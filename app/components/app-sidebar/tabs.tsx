import type { FC } from 'react'
import {
  memo,
  useState,
} from 'react'
import Blocks from './blocks'
import AllTools from './all-tools'
import type { BlockEnum } from '@/app/components/workflow/types'
import type { ToolDefaultValue } from '@/app/components/workflow/block-selector/types'
import { TabsEnum } from '@/app/components/workflow/block-selector/types'
import { useTabs } from '@/app/components/workflow/block-selector/hooks'
import cn from '@/utils/classnames'

export type TabsProps = {
  searchText: string
  onSelect: (type: BlockEnum, tool?: ToolDefaultValue) => void
  availableBlocksTypes?: BlockEnum[]
  expand?: boolean
  onChangeTabs: (show: boolean) => void
}
const Tabs: FC<TabsProps> = ({
  searchText,
  onSelect,
  availableBlocksTypes,
  expand,
  onChangeTabs,
}) => {
  const tabs = useTabs()
  const [activeTab, setActiveTab] = useState(TabsEnum.Blocks)

  const tabClick = (tab: TabsEnum) => {
    setActiveTab(tab)
    onChangeTabs(tab === TabsEnum.Blocks)
  }

  return (
    <div className='grow overflow-hidden flex flex-col' onClick={e => e.stopPropagation()}>
      {
        expand && (
          <div className='flex items-center px-3 border-b-[0.5px] border-b-black/5 mr-4'>
            {
              tabs.map(tab => (
                <div
                  key={tab.key}
                  className={cn(
                    'relative mr-4 h-[38px] text-[14px] leading-[38px] font-medium cursor-pointer',
                    activeTab === tab.key
                      ? 'text-[#175EFF] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-[#175EFF]'
                      : 'text-[#333333]',
                  )}
                  onClick={() => tabClick(tab.key)}
                >
                  {tab.name}
                </div>
              ))
            }
          </div>
        )
      }
      {
        activeTab === TabsEnum.Blocks && (
          <Blocks
            searchText={searchText}
            onSelect={onSelect}
            availableBlocksTypes={availableBlocksTypes}
            expand={expand}
          />
        )
      }
      {
        activeTab === TabsEnum.Tools && (
          <AllTools
            searchText={searchText}
            onSelect={onSelect}
          />
        )
      }
    </div>
  )
}

export default memo(Tabs)
