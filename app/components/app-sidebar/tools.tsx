import {
  memo,
  useCallback,
  useRef,
} from 'react'
import { useTranslation } from 'react-i18next'
import BlockIcon from '@/app/components/workflow/block-icon'
import { BlockEnum } from '@/app/components/workflow/types'
import type { ToolWithProvider } from '@/app/components/workflow/types'
import IndexBar, { groupItems } from '@/app/components/workflow/block-selector/index-bar'
import type { ToolDefaultValue } from '@/app/components/workflow/block-selector/types'
import Tooltip from '@/app/components/base/tooltip'
import Empty from '@/app/components/tools/add-tool-modal/empty'
import { useGetLanguage } from '@/context/i18n'

type ToolsProps = {
  showWorkflowEmpty: boolean
  onSelect: (type: BlockEnum, tool?: ToolDefaultValue) => void
  tools: ToolWithProvider[]
}
const Blocks = ({
  showWorkflowEmpty,
  onSelect,
  tools,
}: ToolsProps) => {
  const { t } = useTranslation()
  const language = useGetLanguage()

  const { letters, groups: groupedTools } = groupItems(tools, tool => tool.label[language][0])
  const toolRefs = useRef({})

  const renderGroup = useCallback((toolWithProvider: ToolWithProvider) => {
    const list = toolWithProvider.tools

    return (
      <div
        key={toolWithProvider.id}
        className='mb-1 last-of-type:mb-0'
      >
        <div className='flex items-start pr-3 text-xs break-all font-medium text-gray-500'>
          <span className=''>{toolWithProvider.label[language]}</span>
        </div>
        {
          list.map(tool => (
            <Tooltip
              key={tool.name}
              selector={`workflow-block-tool-${tool.name}`}
              position='right'
              className='!p-0 !px-3 !py-2.5 !w-[200px] !leading-[18px] break-all !text-xs !text-gray-700 !border-[0.5px] !border-black/5 !rounded-xl !shadow-lg'
              htmlContent={(
                <div>
                  <BlockIcon
                    size='md'
                    className='mb-2'
                    type={BlockEnum.Tool}
                    toolIcon={toolWithProvider.icon}
                  />
                  <div className='mb-1 text-sm leading-5 text-gray-900'>{tool.label[language]}</div>
                  <div className='text-xs text-gray-700 leading-[18px]'>{tool.description[language]}</div>
                </div>
              )}
              noArrow
            >
              <div
                className='flex items-center pr-3 w-full h-8 select-none rounded-lg hover:bg-gray-50 cursor-pointer'
                onMouseDown={() => onSelect(BlockEnum.Tool, {
                  provider_id: toolWithProvider.id,
                  provider_type: toolWithProvider.type,
                  provider_name: toolWithProvider.name,
                  tool_name: tool.name,
                  tool_label: tool.label[language],
                  title: tool.label[language],
                })}
              >
                <BlockIcon
                  className='mr-2 shrink-0'
                  type={BlockEnum.Tool}
                  toolIcon={toolWithProvider.icon}
                />
                <div className='text-sm text-gray-900 truncate'>{tool.label[language]}</div>
              </div>
            </Tooltip>
          ))
        }
      </div>
    )
  }, [onSelect, language])

  const renderLetterGroup = (letter) => {
    const tools = groupedTools[letter]
    return (
      <div
        key={letter}
        ref={el => (toolRefs.current[letter] = el)}
      >
        {tools.map(renderGroup)}
      </div>
    )
  }

  return (
    <div className='py-1 grow overflow-y-auto'>
      {
        !tools.length && !showWorkflowEmpty && (
          <div className='flex items-center px-3 h-[22px] text-xs font-medium text-gray-500'>{t('workflow.tabs.noResult')}</div>
        )
      }
      {!tools.length && showWorkflowEmpty && (
        <div className='py-10'>
          <Empty />
        </div>
      )}
      {!!tools.length && letters.map(renderLetterGroup)}
      {tools.length > 10 && <IndexBar letters={letters} itemRefs={toolRefs} />}
    </div>
  )
}

export default memo(Blocks)
