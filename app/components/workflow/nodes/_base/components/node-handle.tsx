import type { MouseEvent } from 'react'
import {
  memo,
  useCallback,
  useEffect,
  useState,
} from 'react'
import {
  Handle,
  Position,
} from 'reactflow'
import { useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import {
  BlockEnum,
  NodeRunningStatus,
} from '../../../types'
import type { Node } from '../../../types'
import BlockSelector from '../../../block-selector'
import type { ToolDefaultValue } from '../../../block-selector/types'
import {
  useAvailableBlocks,
  useIsChatMode,
  useNodesInteractions,
  useNodesReadOnly,
  useWorkflow,
} from '../../../hooks'
import {
  useStore,
} from '../../../store'
import ToolModal from '@/app/components/app-sidebar/tool-modal'
import cn from '@/utils/classnames'

type NodeHandleProps = {
  handleId: string
  handleClassName?: string
  nodeSelectorClassName?: string
  showExceptionStatus?: boolean
} & Pick<Node, 'id' | 'data'>

export const NodeTargetHandle = memo(({
  id,
  data,
  handleId,
  handleClassName,
  nodeSelectorClassName,
}: NodeHandleProps) => {
  const [open, setOpen] = useState(false)
  const { handleNodeAdd } = useNodesInteractions()
  const { getNodesReadOnly } = useNodesReadOnly()
  const searchParams = useSearchParams()
  const isOnlyView = searchParams.get('pageType') === 'onlyView'
  const connected = data._connectedTargetHandleIds?.includes(handleId)
  const { availablePrevBlocks } = useAvailableBlocks(data.type, data.isInIteration)
  const isConnectable = !!availablePrevBlocks.length && !isOnlyView
  const [toolModalOpen, setToolModalOpen] = useState(false) // 添加状态控制弹框
  const [toolModalType, setToolModalType] = useState<'workflow' | 'toolbox' | ''>('')
  const handleOpenChange = useCallback((v: boolean) => {
    setOpen(v)
  }, [])
  const handleHandleClick = useCallback((e: MouseEvent) => {
    e.stopPropagation()
    if (isOnlyView)
      return
    if (!connected)
      setOpen(v => !v)
  }, [connected, isOnlyView])
  const handleSelect = useCallback((type: BlockEnum, toolDefaultValue?: ToolDefaultValue) => {
    // 当节点类型为 workflow,toolbox 时，显示弹框而不是创建节点
    if (type === 'workflow' || type === 'toolbox') {
      setToolModalType(type)
      setToolModalOpen(true)
      return
    }
    handleNodeAdd(
      {
        nodeType: type,
        toolDefaultValue,
      },
      {
        nextNodeId: id,
        nextNodeTargetHandle: handleId,
      },
    )
  }, [handleNodeAdd, id, handleId])

  return (
    <>
      <Handle
        id={handleId}
        type='target'
        position={Position.Left}
        className={cn(
          '!w-4 !h-4 !bg-transparent !rounded-none !outline-none !border-none z-[1]',
          'after:absolute after:w-2 after:h-2 after:left-[0.2rem] after:rounded-[50%] after:top-1 after:bg-workflow-link-line-handle',
          'hover:scale-125 transition-all',
          data._runningStatus === NodeRunningStatus.Succeeded && 'after:bg-workflow-link-line-success-handle',
          data._runningStatus === NodeRunningStatus.Failed && 'after:bg-workflow-link-line-error-handle',
          data._runningStatus === NodeRunningStatus.Exception && 'after:bg-workflow-link-line-failure-handle',
          !connected && 'after:opacity-0',
          data.type === BlockEnum.Start && 'opacity-0',
          handleClassName,
        )}
        isConnectable={isConnectable}
        onClick={handleHandleClick}
      >
        {
          !connected && isConnectable && !getNodesReadOnly() && !isOnlyView && (
            <BlockSelector
              open={open}
              onOpenChange={handleOpenChange}
              onSelect={handleSelect}
              asChild
              placement='left'
              triggerClassName={open => `
                hidden absolute left-0 top-0 pointer-events-none
                ${nodeSelectorClassName}
                group-hover:!flex
                ${data.selected && '!flex'}
                ${open && '!flex'}
              `}
              availableBlocksTypes={availablePrevBlocks}
            />
          )
        }
        <ToolModal open={toolModalOpen} onSelect={handleSelect}
          onCancel={() => {
            setToolModalOpen(false)
            setToolModalType('')
          }} toolType={toolModalType} />
      </Handle>
    </>
  )
})
NodeTargetHandle.displayName = 'NodeTargetHandle'

export const NodeSourceHandle = memo(({
  id,
  data,
  handleId,
  handleClassName,
  nodeSelectorClassName,
  showExceptionStatus,
}: NodeHandleProps) => {
  const { t } = useTranslation()
  const notInitialWorkflow = useStore(s => s.notInitialWorkflow)
  const [open, setOpen] = useState(false)
  const { handleNodeAdd } = useNodesInteractions()
  const { getNodesReadOnly, isView } = useNodesReadOnly()
  const searchParams = useSearchParams()
  const isOnlyView = searchParams.get('pageType') === 'onlyView'
  const { availableNextBlocks } = useAvailableBlocks(data.type, data.isInIteration)
  const isConnectable = !!availableNextBlocks.length && !isOnlyView
  const isChatMode = useIsChatMode()
  const { checkParallelLimit } = useWorkflow()
  const [toolModalOpen, setToolModalOpen] = useState(false) // 添加状态控制弹框
  const [toolModalType, setToolModalType] = useState<'workflow' | 'toolbox' | ''>('')
  const connected = data._connectedSourceHandleIds?.includes(handleId)
  const handleOpenChange = useCallback((v: boolean) => {
    setOpen(v)
  }, [])
  const handleHandleClick = useCallback((e: MouseEvent) => {
    e.stopPropagation()
    if (isOnlyView)
      return
    if (checkParallelLimit(id, handleId))
      setOpen(v => !v)
  }, [checkParallelLimit, id, handleId, isOnlyView])
  const handleSelect = useCallback((type: BlockEnum, toolDefaultValue?: ToolDefaultValue) => {
    // 当节点类型为 workflow,toolbox 时，显示弹框而不是创建节点
    if (type === 'workflow' || type === 'toolbox') {
      setToolModalType(type)
      setToolModalOpen(true)
      return
    }
    handleNodeAdd(
      {
        nodeType: type,
        toolDefaultValue,
      },
      {
        prevNodeId: id,
        prevNodeSourceHandle: handleId,
      },
    )
  }, [handleNodeAdd, id, handleId])

  useEffect(() => {
    if (notInitialWorkflow && data.type === BlockEnum.Start && !isChatMode)
      setOpen(true)
  }, [notInitialWorkflow, data.type, isChatMode])

  return (
    <Handle
      id={handleId}
      type='source'
      position={Position.Right}
      className={cn(
        'group/handle !w-4 !h-4 !bg-transparent !rounded-none !outline-none !border-none z-[1]',
        'after:absolute after:w-2 after:h-2 after:right-[0.2rem] after:rounded-[50%] after:top-1 after:bg-workflow-link-line-handle',
        'hover:scale-125 transition-all',
        data._runningStatus === NodeRunningStatus.Succeeded && 'after:bg-workflow-link-line-success-handle',
        data._runningStatus === NodeRunningStatus.Failed && 'after:bg-workflow-link-line-error-handle',
        showExceptionStatus && data._runningStatus === NodeRunningStatus.Exception && 'after:bg-workflow-link-line-failure-handle',
        !connected && 'after:opacity-0',
        handleClassName,
      )}
      isConnectable={isConnectable}
      onClick={handleHandleClick}
    >
      <div style={{ display: (isView || isOnlyView) ? 'none' : '' }} className='hidden group-hover/handle:block absolute left-1/2 -top-1 -translate-y-full -translate-x-1/2 p-1.5 border-[0.5px] border-components-panel-border bg-components-tooltip-bg rounded-lg shadow-lg'>
        <div className='system-xs-regular text-text-tertiary'>
          <div className=' whitespace-nowrap'>
            <span className='system-xs-medium text-text-secondary'>{t('workflow.common.parallelTip.click.title')}</span>
            {t('workflow.common.parallelTip.click.desc')}
          </div>
          <div>
            <span className='system-xs-medium text-text-secondary'>{t('workflow.common.parallelTip.drag.title')}</span>
            {t('workflow.common.parallelTip.drag.desc')}
          </div>
        </div>
      </div>
      {
        isConnectable && !getNodesReadOnly() && !isOnlyView && (
          <BlockSelector
            open={open}
            onOpenChange={handleOpenChange}
            onSelect={handleSelect}
            asChild
            triggerClassName={open => `
              hidden absolute top-0 left-0 pointer-events-none 
              ${nodeSelectorClassName}
              group-hover:!flex
              ${data.selected && '!flex'}
              ${open && '!flex'}
            `}
            availableBlocksTypes={availableNextBlocks}
          />
        )
      }
      <ToolModal open={toolModalOpen} onSelect={handleSelect}
        onCancel={() => {
          setToolModalOpen(false)
          setToolModalType('')
        }} toolType={toolModalType} />
    </Handle>
  )
})
NodeSourceHandle.displayName = 'NodeSourceHandle'
