import { useCallback } from 'react'
import produce from 'immer'
import { useBoolean } from 'ahooks'
import { v4 as uuid4 } from 'uuid'
import {
  useIsChatMode,
  useIsNodeInIteration,
  useNodesReadOnly,
  useWorkflow,
} from '../../hooks'
import { VarType } from '../../types'
import type { ErrorHandleMode, ValueSelector, Var } from '../../types'
import useNodeCrud from '../_base/hooks/use-node-crud'
import { getNodeInfoById, getNodeUsedVarPassToServerKey, getNodeUsedVars, isSystemVar, toNodeOutputVars } from '../_base/components/variable/utils'
import useOneStepRun from '../_base/hooks/use-one-step-run'
import { getOperators } from './utils'
import { LogicalOperator } from './types'
import type { HandleAddCondition, HandleAddSubVariableCondition, HandleRemoveCondition, HandleToggleConditionLogicalOperator, HandleToggleSubVariableConditionLogicalOperator, HandleUpdateCondition, HandleUpdateSubVariableCondition, IterationNodeType } from './types'
import useIsVarFileAttribute from './use-is-var-file-attribute'
import type { VarType as VarKindType } from '@/app/components/workflow/nodes/tool/types'
import type { Item } from '@/app/components/base/select'

const DELIMITER = '@@@@@'
const useConfig = (id: string, payload: IterationNodeType) => {
  const { nodesReadOnly: readOnly } = useNodesReadOnly()
  const { isNodeInIteration } = useIsNodeInIteration(id)
  const isChatMode = useIsChatMode()

  const { inputs, setInputs } = useNodeCrud<IterationNodeType>(id, payload)

  const filterInputVar = useCallback((varPayload: Var) => {
    return [VarType.array, VarType.arrayString, VarType.arrayNumber, VarType.arrayObject, VarType.arrayFile].includes(varPayload.type)
  }, [])

  const handleInputChange = useCallback((input: ValueSelector | string) => {
    const newInputs = produce(inputs, (draft) => {
      draft.iterator_selector = input as ValueSelector || []
    })
    setInputs(newInputs)
  }, [inputs, setInputs])

  // output
  const { getIterationNodeChildren, getBeforeNodesInSameBranch } = useWorkflow()
  const beforeNodes = getBeforeNodesInSameBranch(id)
  // const loopChildrenNodes = [{ id, data: payload } as any, ...getIterationNodeChildren(id)]
  const iterationChildrenNodes = getIterationNodeChildren(id)
  const canChooseVarNodes = [...beforeNodes, ...iterationChildrenNodes]
  const childrenNodeVars = toNodeOutputVars(iterationChildrenNodes, isChatMode)

  const handleOutputVarChange = useCallback((output: ValueSelector | string, _varKindType: VarKindType, varInfo?: Var) => {
    const newInputs = produce(inputs, (draft) => {
      draft.output_selector = output as ValueSelector || []
      const outputItemType = varInfo?.type || VarType.string

      draft.output_type = ({
        [VarType.string]: VarType.arrayString,
        [VarType.number]: VarType.arrayNumber,
        [VarType.object]: VarType.arrayObject,
        [VarType.file]: VarType.arrayFile,
        // list operator node can output array
        [VarType.array]: VarType.array,
        [VarType.arrayFile]: VarType.arrayFile,
        [VarType.arrayString]: VarType.arrayString,
        [VarType.arrayNumber]: VarType.arrayNumber,
        [VarType.arrayObject]: VarType.arrayObject,
      } as Record<VarType, VarType>)[outputItemType] || VarType.arrayString
    })
    setInputs(newInputs)
  }, [inputs, setInputs])

  // single run
  const iteratorInputKey = `${id}.input_selector`
  const {
    isShowSingleRun,
    showSingleRun,
    hideSingleRun,
    toVarInputs,
    runningStatus,
    handleRun: doHandleRun,
    handleStop,
    runInputData,
    setRunInputData,
    runResult,
    iterationRunResult,
  } = useOneStepRun<IterationNodeType>({
    id,
    data: inputs,
    iteratorInputKey,
    defaultRunInputData: {
      [iteratorInputKey]: [''],
    },
  })

  const [isShowIterationDetail, {
    setTrue: doShowIterationDetail,
    setFalse: doHideIterationDetail,
  }] = useBoolean(false)

  const hideIterationDetail = useCallback(() => {
    hideSingleRun()
    doHideIterationDetail()
  }, [doHideIterationDetail, hideSingleRun])

  const showIterationDetail = useCallback(() => {
    doShowIterationDetail()
  }, [doShowIterationDetail])

  const backToSingleRun = useCallback(() => {
    hideIterationDetail()
    showSingleRun()
  }, [hideIterationDetail, showSingleRun])

  const { usedOutVars, allVarObject } = (() => {
    const vars: ValueSelector[] = []
    const varObjs: Record<string, boolean> = {}
    const allVarObject: Record<string, {
      inSingleRunPassedKey: string
    }> = {}
    iterationChildrenNodes.forEach((node) => {
      const nodeVars = getNodeUsedVars(node).filter(item => item && item.length > 0)
      nodeVars.forEach((varSelector) => {
        if (varSelector[0] === id) { // skip iteration node itself variable: item, index
          return
        }
        const isInIteration = isNodeInIteration(varSelector[0])
        if (isInIteration) // not pass iteration inner variable
          return

        const varSectorStr = varSelector.join('.')
        if (!varObjs[varSectorStr]) {
          varObjs[varSectorStr] = true
          vars.push(varSelector)
        }
        let passToServerKeys = getNodeUsedVarPassToServerKey(node, varSelector)
        if (typeof passToServerKeys === 'string')
          passToServerKeys = [passToServerKeys]

        passToServerKeys.forEach((key: string, index: number) => {
          allVarObject[[varSectorStr, node.id, index].join(DELIMITER)] = {
            inSingleRunPassedKey: key,
          }
        })
      })
    })
    const res = toVarInputs(vars.map((item) => {
      const varInfo = getNodeInfoById(canChooseVarNodes, item[0])
      return {
        label: {
          nodeType: varInfo?.data.type,
          nodeName: varInfo?.data.title || canChooseVarNodes[0]?.data.title, // default start node title
          variable: isSystemVar(item) ? item.join('.') : item[item.length - 1],
        },
        variable: `${item.join('.')}`,
        value_selector: item,
      }
    }))
    return {
      usedOutVars: res,
      allVarObject,
    }
  })()

  const {
    getIsVarFileAttribute,
  } = useIsVarFileAttribute({
    nodeId: id,
  })

  const handleAddCondition = useCallback<HandleAddCondition>((valueSelector, varItem) => {
    const newInputs = produce(inputs, (draft) => {
      if (!draft.end_conditions)
        draft.end_conditions = []

      draft.end_conditions?.push({
        id: uuid4(),
        varType: varItem.type,
        variable_selector: valueSelector,
        comparison_operator: getOperators(varItem.type, getIsVarFileAttribute(valueSelector) ? { key: valueSelector.slice(-1)[0] } : undefined)[0],
        value: '',
      })
    })
    setInputs(newInputs)
  }, [getIsVarFileAttribute, inputs, setInputs])
  const handleUpdateCondition = useCallback<HandleUpdateCondition>((conditionId, newCondition) => {
    const newInputs = produce(inputs, (draft) => {
      const targetCondition = draft.end_conditions?.find(item => item.id === conditionId)
      if (targetCondition)
        Object.assign(targetCondition, newCondition)
    })
    setInputs(newInputs)
  }, [inputs, setInputs])
  const handleRemoveCondition = useCallback<HandleRemoveCondition>((conditionId) => {
    const newInputs = produce(inputs, (draft) => {
      draft.end_conditions = draft.end_conditions?.filter(item => item.id !== conditionId)
    })
    setInputs(newInputs)
  }, [inputs, setInputs])
  const handleToggleConditionLogicalOperator = useCallback<HandleToggleConditionLogicalOperator>(() => {
    const newInputs = produce(inputs, (draft) => {
      draft.end_condition_logical_operator = draft.end_condition_logical_operator === LogicalOperator.and ? LogicalOperator.or : LogicalOperator.and
    })
    setInputs(newInputs)
  }, [inputs, setInputs])
  const handleRemoveSubVariableCondition = useCallback((conditionId: string, subConditionId: string) => {
    const newInputs = produce(inputs, (draft) => {
      const condition = draft.end_conditions?.find(item => item.id === conditionId)
      if (!condition)
        return
      if (!condition?.sub_variable_condition)
        return
      const subVarCondition = condition.sub_variable_condition
      if (subVarCondition)
        subVarCondition.conditions = subVarCondition.conditions.filter(item => item.id !== subConditionId)
    })
    setInputs(newInputs)
  }, [inputs, setInputs])
  const handleUpdateSubVariableCondition = useCallback<HandleUpdateSubVariableCondition>((conditionId, subConditionId, newSubCondition) => {
    const newInputs = produce(inputs, (draft) => {
      const targetCondition = draft.end_conditions?.find(item => item.id === conditionId)
      if (targetCondition && targetCondition.sub_variable_condition) {
        const targetSubCondition = targetCondition.sub_variable_condition.conditions.find(item => item.id === subConditionId)
        if (targetSubCondition)
          Object.assign(targetSubCondition, newSubCondition)
      }
    })
    setInputs(newInputs)
  }, [inputs, setInputs])
  const handleToggleSubVariableConditionLogicalOperator = useCallback<HandleToggleSubVariableConditionLogicalOperator>((conditionId) => {
    const newInputs = produce(inputs, (draft) => {
      const targetCondition = draft.end_conditions?.find(item => item.id === conditionId)
      if (targetCondition && targetCondition.sub_variable_condition)
        targetCondition.sub_variable_condition.logical_operator = targetCondition.sub_variable_condition.logical_operator === LogicalOperator.and ? LogicalOperator.or : LogicalOperator.and
    })
    setInputs(newInputs)
  }, [inputs, setInputs])
  const handleAddSubVariableCondition = useCallback<HandleAddSubVariableCondition>((conditionId: string, key?: string) => {
    const newInputs = produce(inputs, (draft) => {
      const condition = draft.end_conditions?.find(item => item.id === conditionId)
      if (!condition)
        return
      if (!condition?.sub_variable_condition) {
        condition.sub_variable_condition = {
          logical_operator: LogicalOperator.and,
          conditions: [],
        }
      }
      const subVarCondition = condition.sub_variable_condition
      if (subVarCondition) {
        if (!subVarCondition.conditions)
          subVarCondition.conditions = []

        const svcComparisonOperators = getOperators(VarType.string, { key: key || '' })

        subVarCondition.conditions.push({
          id: uuid4(),
          key: key || '',
          varType: VarType.string,
          comparison_operator: (svcComparisonOperators && svcComparisonOperators.length) ? svcComparisonOperators[0] : undefined,
          value: '',
        })
      }
    })
    setInputs(newInputs)
  }, [inputs, setInputs])
  const handleRun = useCallback((data: Record<string, any>) => {
    const formattedData: Record<string, any> = {}
    Object.keys(allVarObject).forEach((key) => {
      const [varSectorStr, nodeId] = key.split(DELIMITER)
      formattedData[`${nodeId}.${allVarObject[key].inSingleRunPassedKey}`] = data[varSectorStr]
    })
    formattedData[iteratorInputKey] = data[iteratorInputKey]
    doHandleRun(formattedData)
  }, [allVarObject, doHandleRun, iteratorInputKey])

  const inputVarValues = (() => {
    const vars: Record<string, any> = {}
    Object.keys(runInputData)
      .filter(key => ![iteratorInputKey].includes(key))
      .forEach((key) => {
        vars[key] = runInputData[key]
      })
    return vars
  })()

  const setInputVarValues = useCallback((newPayload: Record<string, any>) => {
    const newVars = {
      ...newPayload,
      [iteratorInputKey]: runInputData[iteratorInputKey],
    }
    setRunInputData(newVars)
  }, [iteratorInputKey, runInputData, setRunInputData])

  const iterator = runInputData[iteratorInputKey]
  const setIterator = useCallback((newIterator: string[]) => {
    setRunInputData({
      ...runInputData,
      [iteratorInputKey]: newIterator,
    })
  }, [iteratorInputKey, runInputData, setRunInputData])

  const changeParallel = useCallback((value: boolean) => {
    const newInputs = produce(inputs, (draft) => {
      draft.is_parallel = value
    })
    setInputs(newInputs)
  }, [inputs, setInputs])

  const changeErrorResponseMode = useCallback((item: Item) => {
    const newInputs = produce(inputs, (draft) => {
      draft.error_handle_mode = item.value as ErrorHandleMode
    })
    setInputs(newInputs)
  }, [inputs, setInputs])
  const changeParallelNums = useCallback((num: number) => {
    const newInputs = produce(inputs, (draft) => {
      draft.parallel_nums = num
    })
    setInputs(newInputs)
  }, [inputs, setInputs])
  return {
    readOnly,
    inputs,
    filterInputVar,
    handleInputChange,
    childrenNodeVars,
    iterationChildrenNodes,
    handleOutputVarChange,
    isShowSingleRun,
    showSingleRun,
    hideSingleRun,
    isShowIterationDetail,
    showIterationDetail,
    hideIterationDetail,
    backToSingleRun,
    runningStatus,
    handleRun,
    handleStop,
    runResult,
    inputVarValues,
    setInputVarValues,
    usedOutVars,
    iterator,
    setIterator,
    iteratorInputKey,
    iterationRunResult,
    changeParallel,
    changeErrorResponseMode,
    changeParallelNums,
    handleAddCondition,
    handleUpdateCondition,
    handleRemoveCondition,
    handleToggleConditionLogicalOperator,
    handleAddSubVariableCondition,
    handleRemoveSubVariableCondition,
    handleUpdateSubVariableCondition,
    handleToggleSubVariableConditionLogicalOperator,
  }
}

export default useConfig
