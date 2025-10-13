import {
  memo,
  useEffect,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import {
  COMMAND_PRIORITY_EDITOR,
} from 'lexical'
import { mergeRegister } from '@lexical/utils'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  RiErrorWarningFill,
} from '@remixicon/react'
import { useSelectOrDelete } from '../../hooks'
import type { WorkflowNodesMap } from './node'
import { WorkflowVariableBlockNode } from './node'
import {
  DELETE_WORKFLOW_VARIABLE_BLOCK_COMMAND,
  UPDATE_WORKFLOW_NODES_MAP,
} from './index'
import { BlockEnum } from '@/app/components/workflow/types'
import cn from '@/utils/classnames'
import { Variable02 } from '@/app/components/base/icons/src/vender/solid/development'
import { BubbleX, Env } from '@/app/components/base/icons/src/vender/line/others'
import { VarBlockIcon } from '@/app/components/workflow/block-icon'
import { Line3 } from '@/app/components/base/icons/src/public/common'
import { isConversationVar, isENV, isSystemVar } from '@/app/components/workflow/nodes/_base/components/variable/utils'
import Tooltip from '@/app/components/base/tooltip'
import { isExceptionVariable } from '@/app/components/workflow/utils'

type WorkflowVariableBlockComponentProps = {
  nodeKey: string
  variables: string[]
  workflowNodesMap: WorkflowNodesMap
}

const WorkflowVariableBlockComponent = ({
  nodeKey,
  variables,
  workflowNodesMap = {},
}: WorkflowVariableBlockComponentProps) => {
  const { t } = useTranslation()
  const [editor] = useLexicalComposerContext()
  const [ref, isSelected] = useSelectOrDelete(nodeKey, DELETE_WORKFLOW_VARIABLE_BLOCK_COMMAND)
  const variablesLength = variables.length
  const varName = (
    () => {
      const isSystem = isSystemVar(variables)
      const varName = variablesLength >= 3 ? (variables).slice(-2).join('.') : variables[variablesLength - 1]
      return `${isSystem ? 'sys.' : ''}${varName}`
    }
  )()
  const [localWorkflowNodesMap, setLocalWorkflowNodesMap] = useState<WorkflowNodesMap>(() => {
    // 检查 workflowNodesMap 是否包含 start_query
    if (!workflowNodesMap.start_query) {
      // 如果不包含，则添加 start_query
      return {
        ...workflowNodesMap,
        start_query: {
          title: t('workflow.blocks.start'),
          type: BlockEnum.Start,
        },
      }
    }
    // 如果已经包含，则直接使用 workflowNodesMap
    return workflowNodesMap
  })

  const node = localWorkflowNodesMap![variables[0]]
  // console.log('node111', variables, node)
  const isEnv = isENV(variables)
  const isChatVar = isConversationVar(variables)
  const isException = isExceptionVariable(varName, node?.type)

  useEffect(() => {
    if (!editor.hasNodes([WorkflowVariableBlockNode]))
      throw new Error('WorkflowVariableBlockPlugin: WorkflowVariableBlock not registered on editor')

    return mergeRegister(
      editor.registerCommand(
        UPDATE_WORKFLOW_NODES_MAP,
        (workflowNodesMap: WorkflowNodesMap) => {
          // 更新时检查并添加 start_query
          if (!workflowNodesMap?.start_query) {
            workflowNodesMap = {
              ...workflowNodesMap,
              start_query: {
                title: t('workflow.blocks.start'),
                type: BlockEnum.Start,
              },
            }
          }
          setLocalWorkflowNodesMap(workflowNodesMap)

          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    )
  }, [editor])

  const Item = (
    <div
      className={cn(
        'mx-0.5 relative group/wrap flex items-center h-[18px] pl-0.5 pr-[3px] rounded-[5px] border select-none',
        isSelected ? ' border-state-accent-solid bg-state-accent-hover' : ' border-components-panel-border-subtle bg-components-badge-white-to-dark',
        !node && !isEnv && !isChatVar && '!border-state-destructive-solid !bg-state-destructive-hover',
      )}
      ref={ref}
    >
      {!isEnv && !isChatVar && false && (
        <div className='flex items-center'>
          {
            node?.type && false && (
              <div className='p-[1px]'>
                <VarBlockIcon
                  className='!text-text-secondary'
                  type={node?.type}
                />
              </div>
            )
          }
          <div className='shrink-0 mx-0.5 max-w-[60px] text-xs font-medium text-text-secondary truncate' title={node?.title} style={{
          }}>{node?.title}</div>
          <Line3 className='mr-0.5 text-divider-deep hidden'></Line3>
        </div>
      )}
      <div className='flex items-center text-text-accent text-blue-600'>
        {!isEnv && !isChatVar && false && <Variable02 className={cn('shrink-0 w-3.5 h-3.5', isException && 'text-text-warning')} />}
        {isEnv && false && <Env className='shrink-0 w-3.5 h-3.5 text-util-colors-violet-violet-600' />}
        {isChatVar && false && <BubbleX className='w-3.5 h-3.5 text-util-colors-teal-teal-700' />}
        <div className={cn(
          'shrink-0 ml-0.5 text-xs font-semibold truncate italic',
          isEnv && false && 'text-util-colors-violet-violet-600',
          isChatVar && false && 'text-util-colors-teal-teal-700',
          isException && 'text-text-warning',
        )} title={varName}>{`{{ ${varName} }}`}</div>
        {
          !node && !isEnv && !isChatVar && (
            <RiErrorWarningFill className='ml-0.5 w-3 h-3 text-text-destructive' />
          )
        }
      </div>
    </div>
  )

  if (!node && !isEnv && !isChatVar) {
    return (
      <Tooltip popupContent={t('workflow.errorMsg.invalidVariable')}>
        {Item}
      </Tooltip>
    )
  }

  return Item
}

export default memo(WorkflowVariableBlockComponent)
