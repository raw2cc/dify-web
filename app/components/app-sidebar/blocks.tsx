import {
  memo,
  useCallback,
  useMemo,
} from 'react'
import { useTranslation } from 'react-i18next'
import { groupBy } from 'lodash-es'
import BlockIcon from '@/app/components/workflow/block-icon'
import { BlockEnum } from '@/app/components/workflow/types'
import {
  useIsChatMode,
  useNodesExtraData,
} from '@/app/components/workflow/hooks'
import { BLOCK_CLASSIFICATIONS } from '@/app/components/workflow/block-selector/constants'
import { useBlocks } from '@/app/components/workflow/block-selector/hooks'
import type { ToolDefaultValue } from '@/app/components/workflow/block-selector/types'
import Tooltip from '@/app/components/base/tooltip'

type BlocksProps = {
  searchText: string
  onSelect: (type: BlockEnum, tool?: ToolDefaultValue) => void
  availableBlocksTypes?: BlockEnum[]
  expand?: boolean
}
const Blocks = ({
  searchText,
  onSelect,
  availableBlocksTypes = [],
  expand,
}: BlocksProps) => {
  const { t } = useTranslation()
  const isChatMode = useIsChatMode()
  const nodesExtraData = useNodesExtraData()
  const blocks = useBlocks()

  const groups = useMemo(() => {
    return BLOCK_CLASSIFICATIONS.reduce((acc, classification) => {
      const list = groupBy(blocks, 'classification')[classification].filter((block) => {
        if (block.type === BlockEnum.Answer && !isChatMode)
          return false

        return block.title.toLowerCase().includes(searchText.toLowerCase()) && availableBlocksTypes.includes(block.type)
      })

      return {
        ...acc,
        [classification]: list,
      }
    }, {} as Record<string, typeof blocks>)
  }, [blocks, isChatMode, searchText, availableBlocksTypes])
  const isEmpty = Object.values(groups).every(list => !list.length)

  const renderGroup = useCallback((classification: string) => {
    const list = groups[classification]

    return (
      <div
        key={classification}
        className={`mb-4 last-of-type:mb-0 ${expand ? '' : 'flex flex-col items-center'}`}
      >
        {
          classification !== '-' && !!list.length && (
            <div className='flex items-start h-[20px] leading-[20px] text-[14px] font-medium text-[#666666]'>
              {expand ? t(`workflow.tabs.${classification}`) : t(`workflow.tabs.${classification}`).slice(0, 2)}
            </div>
          )
        }
        {
          list.map(block => (
            <Tooltip
              key={block.type}
              selector={`workflow-block-${block.type}`}
              position='right'
              className='!p-0 !px-3 !py-2.5 !w-[200px] !leading-[18px] !text-xs !text-gray-700 !border-[0.5px] !border-black/5 !rounded-xl !shadow-lg'
              htmlContent={(
                <div>
                  <BlockIcon
                    size='md'
                    className='mb-2'
                    type={block.type}
                  />
                  <div className='mb-1 text-sm leading-5 text-gray-900'>{block.title}</div>
                  <div className='text-xs text-gray-700 leading-[18px]'>{nodesExtraData[block.type].about}</div>
                </div>
              )}
              noArrow
            >
              <div
                key={block.type}
                className='flex items-center px-3 w-full h-12 select-none rounded-lg hover:border-[#3B6CE4] cursor-pointer mt-2 border-[1px] border-[#CDD9FA]'
                onMouseDown={() => onSelect(block.type)}
              >
                <BlockIcon
                  size='md'
                  className={`shrink-0 ${expand ? 'mr-2' : ''}`}
                  type={block.type}
                />
                {
                  expand && (
                    <div className='text-sm text-[#333333]'>{block.title}</div>
                  )
                }
              </div>
            </Tooltip>
          ))
        }
      </div>
    )
  }, [expand, groups, nodesExtraData, onSelect, t])

  return (
    <div className={`py-1 grow overflow-y-auto ${expand ? 'pr-4' : ''}`}>
      {
        isEmpty && (
          <div className='flex items-center px-3 h-[22px] text-xs font-medium text-gray-500'>{t('workflow.tabs.noResult')}</div>
        )
      }
      {
        !isEmpty && BLOCK_CLASSIFICATIONS.map(renderGroup)
      }
    </div>
  )
}

export default memo(Blocks)
