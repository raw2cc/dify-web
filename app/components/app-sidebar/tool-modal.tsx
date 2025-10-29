// app/components/app-sidebar/tool-modal.tsx
import React, { useMemo, useState } from 'react'
import { Button, Modal, Table } from 'antd'
import type { TableProps } from 'antd'
import { useTranslation } from 'react-i18next'
import BlockIcon from '@/app/components/workflow/block-icon'
import { BlockEnum } from '@/app/components/workflow/types'
import type {
  ToolWithProvider,
} from '@/app/components/workflow/types'

import { useStore } from '@/app/components/workflow/store'
import { useGetLanguage } from '@/context/i18n'
import type { OnSelectBlock } from '@/app/components/workflow/types'

type WorkflowItem = {
  key: string
  name: string
  type: string
  status: string
  children?: WorkflowItem[]
}

type ToolModalProps = {
  open: boolean
  onCancel: () => void
  toolType: string
  onSelect: OnSelectBlock
}

const ToolModal: React.FC<ToolModalProps> = ({ open, onCancel, toolType, onSelect }) => {
  const { t } = useTranslation()
  const buildInTools = useStore(s => s.buildInTools) // 内置工具
  const customTools = useStore(s => s.customTools) // 自定义工具
  const workflowTools = useStore(s => s.workflowTools) // 工作流工具
  const language = useGetLanguage()

  const columns: TableProps<ToolWithProvider>['columns'] = [
    {
      title: '名称',
      dataIndex: 'label',
      key: 'label',
      render: (label, record) => {
        // 只有子项（有 parent 属性）才显示图标
        if (record?.parent) {
          return (
            <div className='flex items-center'>
              <BlockIcon className="mr-2 shrink-0" type={BlockEnum.Tool} toolIcon={record.parent?.icon} size="md"/>
              <span className=''>{t(label[language])}</span>
            </div>
          )
        }
        // 父项不显示图标
        return t(label[language])
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: description => t(description[language]),
    },
    {
      title: '操作',
      dataIndex: 'operation',
      key: 'operation',
      width: 90,
      render: (_: any, record: any, index: any) => {
        // indent > 0 表示当前行是展开项
        // const indent = record.indent || 0
        // 临时：若有parameters字段则表示工具子项
        if (record.parameters) {
          return (
            <Button
              type="primary" size="small"
              style={{ borderColor: '#4096ff', backgroundColor: '#f0f8ff', color: '#4096ff' }}
              onClick={(e) => {
                e.stopPropagation() // 阻止事件冒泡
                // console.log('添加', record)
                // 获取父级数据
                onCancel()
                const parentData = record.parent // 获取父级数据
                onSelect(BlockEnum.Tool, {
                  provider_id: parentData.id,
                  provider_type: parentData.type,
                  provider_name: parentData.name,
                  tool_name: record.name,
                  tool_label: record.label[language],
                  title: record.label[language],
                })
              }}
            >
              + 添加
            </Button>
          )
        }
        return null
      },
    },
  ]

  // 获取标题
  const getTitle = () => {
    switch (toolType) {
      case 'workflow':
        return t('workflow.common.workflowTool') // 或者直接 '工作流工具'
      case 'toolbox':
        return t('workflow.common.toolbox') // 或者直接 '工具箱'
      default:
        return t('workflow.common.toolbox') // 默认标题
    }
  }

  // 工具list
  const tools = useMemo(() => {
    let mergedTools: ToolWithProvider[] = []
    if (toolType === 'toolbox')
      mergedTools = [...customTools]
    else if (toolType === 'workflow')
      mergedTools = workflowTools
    // 为子工具添加父级引用
    return mergedTools.map((provider) => {
      if (provider.tools && provider.tools.length > 0) {
        const toolsWithParent = provider.tools.map(childTool => ({
          ...childTool,
          parent: provider, // 添加父级引用
        }))
        return {
          ...provider,
          tools: toolsWithParent,
        }
      }
      return provider
    })
  }, [toolType, customTools, workflowTools])
  // console.log('toolList', tools)
  return (
    <Modal
      title={getTitle()}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      <Table
        columns={columns}
        dataSource={tools}
        pagination={false}
        expandable={{
          defaultExpandAllRows: true,
          childrenColumnName: 'tools',
          rowExpandable: record => !!record.tools && record.tools.length > 0, // 只有有 tools 才可展开
        }}
        scroll={{ y: '530px' }} // 设置高度，超出部分自动出现滚动条
        rowKey={record => record.id} // 必须设置唯一 key
      />
    </Modal>
  )
}

export default React.memo(ToolModal)
