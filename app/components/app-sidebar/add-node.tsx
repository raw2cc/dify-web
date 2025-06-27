import React, { useCallback, useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useTranslation } from 'react-i18next'
import { useStoreApi } from 'reactflow'
import NavLink from './navLink2'
import useBreakpoints, { MediaType } from '@/hooks/use-breakpoints'
import {
  AlignLeft02,
  AlignRight02,
} from '@/app/components/base/icons/src/vender/line/layout'
import { useStore as useAppStore } from '@/app/components/app/store'
import type {
  OnSelectBlock,
} from '@/app/components/workflow/types'
import { generateNewNode } from '@/app/components/workflow/utils'
import { NODES_INITIAL_DATA } from '@/app/components/workflow/constants'
import { useWorkflowStore } from '@/app/components/workflow/store'

export type IAppDetailNavProps = {
  changeExpand: (expand: boolean) => void
}

const AppDetailNav = ({ changeExpand }: IAppDetailNavProps) => {
  const { t } = useTranslation()
  const store = useStoreApi()
  const workflowStore = useWorkflowStore()
  const { appSidebarExpand, setAppSiderbarExpand } = useAppStore(useShallow(state => ({
    appSidebarExpand: state.appSidebarExpand,
    setAppSiderbarExpand: state.setAppSiderbarExpand,
  })))
  const media = useBreakpoints()
  const isMobile = media === MediaType.mobile
  const [showExpand, setShowExpand] = useState(true)
  const expand = appSidebarExpand === 'expand'

  const handleToggle = (state: string) => {
    setAppSiderbarExpand(state === 'expand' ? 'collapse' : 'expand')
  }

  const handleSelect = useCallback<OnSelectBlock>((type, toolDefaultValue) => {
    const {
      getNodes,
    } = store.getState()
    const nodes = getNodes()
    const nodesWithSameType = nodes.filter(node => node.data.type === type)
    const newNode = generateNewNode({
      data: {
        ...NODES_INITIAL_DATA[type],
        title: nodesWithSameType.length > 0 ? `${t(`workflow.blocks.${type}`)} ${nodesWithSameType.length + 1}` : t(`workflow.blocks.${type}`),
        ...(toolDefaultValue || {}),
        _isCandidate: true,
      },
      position: {
        x: 0,
        y: 0,
      },
      zIndex: 10,
    })
    workflowStore.setState({
      candidateNode: newNode?.newNode,
    })
  }, [store, workflowStore, t])

  useEffect(() => {
    if (appSidebarExpand) {
      localStorage.setItem('app-detail-collapse-or-expand', appSidebarExpand)
      setAppSiderbarExpand(appSidebarExpand)
    }
    changeExpand(appSidebarExpand === 'expand')
  }, [appSidebarExpand, changeExpand, setAppSiderbarExpand])

  return (
    <div
      className={`
        shrink-0 flex flex-col bg-white border-r border-divider-burn transition-all h-full
        ${expand ? 'w-[216px]' : 'w-[72px]'}
      `}
    >
      <div
        className={`
          shrink-0 text-[18px] border-b border-divider-burn
          ${expand ? 'px-5 py-[10px]' : 'p-2 text-center'}
        `}
      >
        {expand ? t('workflow.common.addBlock') : t('workflow.common.block')}
      </div>
      <NavLink onSelect={handleSelect} expand={expand} onChangeTabs={show => setShowExpand(show)}/>
      {
        !isMobile && showExpand && (
          <div
            className={`
              shrink-0 py-4 flex items-center justify-end 
              ${expand ? 'px-4' : 'px-4'}
            `}
          >
            <div
              className='flex items-center justify-center w-8 h-8 text-[#666666] cursor-pointer bg-[#EBF0FC] rounded-[10px]'
              onClick={() => handleToggle(appSidebarExpand)}
            >
              {
                expand
                  ? <AlignLeft02 className='w-4 h-4' />
                  : <AlignRight02 className='w-4 h-4' />
              }
            </div>
          </div>
        )
      }
    </div>
  )
}

export default React.memo(AppDetailNav)
