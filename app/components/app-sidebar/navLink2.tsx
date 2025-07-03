import type {
  FC,
} from 'react'
import {
  memo,
  useCallback,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import Tabs from './tabs'
import type { OnSelectBlock } from '@/app/components/workflow/types'
import { BlockEnum } from '@/app/components/workflow/types'
import { useAvailableBlocks } from '@/app/components/workflow/hooks'
import { XCircle } from '@/app/components/base/icons/src/vender/solid/general'
import {
  SearchIcon,
} from '@/app/components/base/icons/src/vender/line/others'

type NodeSelectorProps = {
  onSelect: OnSelectBlock
  expand?: boolean
  onChangeTabs: (show: boolean) => void
}
const NodeSelector: FC<NodeSelectorProps> = ({
  onSelect,
  expand = true,
  onChangeTabs,
}) => {
  const { t } = useTranslation()
  const [searchText, setSearchText] = useState('')
  const handleSelect = useCallback<OnSelectBlock>((type, toolDefaultValue) => {
    onSelect(type, toolDefaultValue)
  }, [onSelect])

  const { availableNextBlocks } = useAvailableBlocks(BlockEnum.Start, false)

  return (
    <div className={`flex flex-col 
          grow space-y-1 overflow-hidden
          ${expand ? 'pt-4 pl-4' : 'pt-4'}`}>
      {
        expand && (
          <div className='pr-4'>
            <div
              className='flex items-center px-2 rounded-[10px] bg-[#f6f7fa]'
              onClick={e => e.stopPropagation()}
            >
              <input
                value={searchText}
                className='grow px-0.5 py-[7px] text-[13px] text-gray-700 bg-transparent appearance-none outline-none caret-primary-600 placeholder:text-gray-400 overflow-hidden'
                placeholder={t('workflow.tabs.searchBlock') || ''}
                onChange={e => setSearchText(e.target.value)}
                autoFocus
              />
              {
                searchText && (
                  <div
                    className='flex items-center justify-center ml-[5px] w-[18px] h-[18px] cursor-pointer'
                    onClick={() => setSearchText('')}
                  >
                    <XCircle className='w-[14px] h-[14px] text-gray-400' />
                  </div>
                )
              }
              {!searchText && <SearchIcon className='shrink-0 w-[16px] h-[16px] text-[#3B6CE4] ml-[5px]'/>}
            </div>
          </div>
        )
      }
      <Tabs
        onSelect={handleSelect}
        searchText={searchText}
        availableBlocksTypes={availableNextBlocks}
        expand={expand}
        onChangeTabs={onChangeTabs}
      />
    </div>
  )
}

export default memo(NodeSelector)
