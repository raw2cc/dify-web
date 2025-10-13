import {
  memo,
  useCallback,
  useState,
} from 'react'
import {
  RiAddLine,
} from '@remixicon/react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'next/navigation'
import {
  useAvailableBlocks,
  useNodesInteractions,
  useNodesReadOnly,
} from '../../hooks'
import type { IterationNodeType } from './types'
import cn from '@/utils/classnames'
import BlockSelector from '@/app/components/workflow/block-selector'
import type {
  OnSelectBlock,
} from '@/app/components/workflow/types'
import {
  BlockEnum,
} from '@/app/components/workflow/types'
import ToolModal from '@/app/components/app-sidebar/tool-modal'

type AddBlockProps = {
  iterationNodeId: string
  iterationNodeData: IterationNodeType
}
const AddBlock = ({
  iterationNodeData,
}: AddBlockProps) => {
  const { t } = useTranslation()
  const { nodesReadOnly } = useNodesReadOnly()
  const { handleNodeAdd } = useNodesInteractions()
  const { availableNextBlocks } = useAvailableBlocks(BlockEnum.Start, true)
  const [toolModalOpen, setToolModalOpen] = useState(false) // 添加状态控制弹框
  const [toolModalType, setToolModalType] = useState<'workflow' | 'toolbox' | ''>('')
  const searchParams = useSearchParams()
  const isOnlyView = searchParams.get('pageType') === 'onlyView'
  const handleSelect = useCallback<OnSelectBlock>((type, toolDefaultValue) => {
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
        prevNodeId: iterationNodeData.start_node_id,
        prevNodeSourceHandle: 'source',
      },
    )
  }, [handleNodeAdd, iterationNodeData.start_node_id])

  const renderTriggerElement = useCallback((open: boolean) => {
    return (
      <div className={cn(
        'relative inline-flex items-center px-3 h-8 rounded-lg border-[0.5px] border-components-button-secondary-border bg-components-button-secondary-bg shadow-xs cursor-pointer hover:bg-components-button-secondary-bg-hover system-sm-medium text-components-button-secondary-text backdrop-blur-[5px]',
        `${nodesReadOnly && '!cursor-not-allowed bg-components-button-secondary-bg-disabled'}`,
        open && 'bg-components-button-secondary-bg-hover',
      )}>
        <RiAddLine className='mr-1 w-4 h-4' />
        {t('workflow.common.addBlock')}
      </div>
    )
  }, [nodesReadOnly, t])

  return (
    <div className='absolute top-7 left-14 flex items-center h-8 z-10'>
      <div className='group/insert relative w-16 h-0.5 bg-gray-300'>
        <div className='absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-2 bg-primary-500'></div>
      </div>
      <BlockSelector
        disabled={nodesReadOnly || isOnlyView}
        onSelect={handleSelect}
        trigger={renderTriggerElement}
        triggerInnerClassName='inline-flex'
        popupClassName='!min-w-[256px]'
        availableBlocksTypes={availableNextBlocks}
      />
      <ToolModal open={toolModalOpen} onSelect={handleSelect}
        onCancel={() => {
          setToolModalOpen(false)
          setToolModalType('')
        }} toolType={toolModalType} />
    </div>
  )
}

export default memo(AddBlock)
