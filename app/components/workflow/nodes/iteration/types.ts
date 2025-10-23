import type { VarType as NumberVarType } from '../tool/types'
import type {
  BlockEnum,
  CommonNodeType,
  ErrorHandleMode,
  ValueSelector,
  Var,
  VarType,
} from '@/app/components/workflow/types'

export type IterationNodeType = CommonNodeType & {
  startNodeType?: BlockEnum
  start_node_id: string // start node id in the iteration
  iteration_id?: string
  iterator_selector: ValueSelector
  output_selector: ValueSelector
  output_type: VarType // output type.
  is_parallel: boolean // open the parallel mode or not
  parallel_nums: number // the numbers of parallel
  error_handle_mode: ErrorHandleMode // how to handle error in the iteration
  _isShowTips: boolean // when answer node in parallel mode iteration show tips
  break_conditions?: Condition[]
  end_conditions?: Condition[]
  end_condition_logical_operator?: LogicalOperator
  enable_end_condition?: boolean
}

export enum LogicalOperator {
  and = 'and',
  or = 'or',
}

export type handleRemoveSubVariableCondition = (conditionId: string, subConditionId: string) => void
export type HandleToggleConditionLogicalOperator = () => void
export type HandleRemoveCondition = (conditionId: string) => void
export type HandleAddCondition = (valueSelector: ValueSelector, varItem: Var) => void
export type HandleAddSubVariableCondition = (conditionId: string, key?: string) => void
export type HandleToggleSubVariableConditionLogicalOperator = (conditionId: string) => void
export type HandleUpdateCondition = (conditionId: string, newCondition: Condition) => void
export type HandleUpdateSubVariableCondition = (conditionId: string, subConditionId: string, newSubCondition: Condition) => void

export type Condition = {
  id: string
  varType: VarType
  variable_selector?: ValueSelector
  key?: string // sub variable key
  comparison_operator?: ComparisonOperator
  value: string | string[]
  numberVarType?: NumberVarType
  sub_variable_condition?: CaseItem
}

export type CaseItem = {
  logical_operator: LogicalOperator
  conditions: Condition[]
}

export enum ComparisonOperator {
  contains = 'contains',
  notContains = 'not contains',
  startWith = 'start with',
  endWith = 'end with',
  is = 'is',
  isNot = 'is not',
  empty = 'empty',
  notEmpty = 'not empty',
  equal = '=',
  notEqual = '≠',
  largerThan = '>',
  lessThan = '<',
  largerThanOrEqual = '≥',
  lessThanOrEqual = '≤',
  isNull = 'is null',
  isNotNull = 'is not null',
  in = 'in',
  notIn = 'not in',
  allOf = 'all of',
  exists = 'exists',
  notExists = 'not exists',
}
