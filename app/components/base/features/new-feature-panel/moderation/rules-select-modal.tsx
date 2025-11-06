import type { FC } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiAddLine, RiCloseLine } from '@remixicon/react'
import { Table, Tooltip } from 'antd'
import type { TableProps } from 'antd'
import { RiDeleteBinLine } from '@remixicon/react'
import CreateRuleModal from './create-rule-modal'
import Modal from '@/app/components/base/modal'
import Button from '@/app/components/base/button'
import { CommonSelect } from '@/app/components/base/select'
import SearchInput from '@/app/components/base/search-input'
import { type DictType, deleteSafeRuleApi, getDictTypeApi, getSafeRuleListApi } from '@/service/rules'
import { useToastContext } from '@/app/components/base/toast'

type SelectedRule = {
  id: string
  ruleName: string
}

type Rule = {
  id: string
  ruleName: string
  ruleContent: string
  ruleType: string
  ruleTypeInfo: string
  rulePlatform: string
  createdName: string
  createdAt: string
}

type RulesSelectModalProps = {
  selectedRuleList?: Rule[]
  onCancel: () => void
  onConfirm: (selectedRules: Rule[]) => void
}
const RulesSelectModal: FC<RulesSelectModalProps> = ({
  selectedRuleList = [],
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation()
  const { notify } = useToastContext()
  // 状态管理
  const [queryParams, setQueryParams] = useState({
    ruleName: '',
    ruleType: '',
    ruleTypeInfo: '',
    rulePlatform: '',
    pageNum: 1,
    pageSize: 10,
    total: 0,
    createdBy: '',
  })
  const queryParamsRef = useRef(queryParams)
  useEffect(() => {
    queryParamsRef.current = queryParams
  }, [queryParams])

  const [tableData, setTableData] = useState<Rule[]>([])
  const [allSelectedRows, setAllSelectedRows] = useState<Rule[]>(selectedRuleList)
  const [loading, setLoading] = useState(false)
  const [deleteVisible, setDeleteVisible] = useState(false)
  const [deletingRule, setDeletingRule] = useState<Rule | null>(null)

  const [typeOption, setTypeOption] = useState<DictType[]>([])
  const [categoryOption, setCategoryList] = useState<DictType[]>([])
  // 在组件顶部添加状态
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [modalTitle, setModalTitle] = useState('创建规则')
  const [createRuleVisible, setCreateRuleVisible] = useState(false)
  const [selectedRows, setSelectedRows] = useState<string[]>(selectedRuleList.map(item => item.id))
  const searchDebounceRef = useRef<number | null>(null)
  // 获取规则类型列表
  const fetchRuleTypes = useCallback(async () => {
    try {
      const result = await getDictTypeApi({ dictType: 'kxaf_rule_config' })
      setTypeOption(Array.isArray(result) ? result : [])
    }
    catch (err) {
      console.error('获取规则类型列表失败:', err)
      setTypeOption([]) // 确保在错误情况下也设置空数组
    }
  }, [])

  // 获取所属分类列表
  const fetchCategoryOptions = useCallback(async (ruleType: string) => {
    try {
      const result = await getDictTypeApi({ dictType: ruleType })
      setCategoryList(Array.isArray(result) ? result : [])
    }
    catch (err) {
      console.error('获取所属分类失败:', err)
      notify({ type: 'error', message: '获取所属分类失败' })
      setCategoryList([])
    }
  }, [])

  // 获取表格数据
  const getTableData = useCallback(async (overrides?: Partial<typeof queryParams>) => {
    setLoading(true)
    const merged = { ...queryParamsRef.current, ...(overrides || {}) }
    try {
      const params = {
        ruleName: merged.ruleName,
        ruleType: merged.ruleType ? (typeOption.find(item => item.dictValue === merged.ruleType)?.dictLabel || '') : '',
        ruleTypeInfo: merged.ruleTypeInfo ? (categoryOption.find(item => item.dictValue === merged.ruleTypeInfo)?.dictLabel || '') : '',
        pageNum: merged.pageNum,
        pageSize: merged.pageSize,
        rulePlatform: merged.rulePlatform,
      }

      // if (merged.rulePlatform !== '0')
      //   params.createBy = JSON.parse(localStorage.getItem('Login-Token') || '{}')?.userId || ''

      const res = await getSafeRuleListApi(params)
      if (res?.data) {
        setTableData(res.data)
        setQueryParams(prev => ({ ...prev, total: res.count || 0 }))
      }
      else {
        setTableData([])
        setQueryParams(prev => ({ ...prev, total: 0 }))
      }
    }
    catch (err) {
      notify({ type: 'error', message: '获取规则列表失败' })
    }
    finally {
      setLoading(false)
    }
  }, [typeOption, categoryOption, notify])

  // 初始化
  useEffect(() => {
    fetchRuleTypes()
    getTableData()
    return () => {
      if (searchDebounceRef.current)
        clearTimeout(searchDebounceRef.current)
    }
  }, [])

  const handleSearchChange = (value: string) => {
    // 清除旧 timer
    if (searchDebounceRef.current)
      clearTimeout(searchDebounceRef.current)

    // 先同步 state（pageNum 重置为 1）
    setQueryParams(prev => ({ ...prev, ruleName: value, pageNum: 1 }))
    // 防抖后请求
    searchDebounceRef.current = window.setTimeout(() => {
      getTableData({ ruleName: value, pageNum: 1 })
    }, 500)
  }

  // 处理规则类型变化
  const handleRuleTypeChange = async (value: string) => {
    // 更新 queryParams：重置分类和页码
    setQueryParams(prev => ({ ...prev, ruleType: value, ruleTypeInfo: '', pageNum: 1 }))
    setCategoryList([])
    if (value.trim())
      await fetchCategoryOptions(value)

    getTableData({ ruleType: value, ruleTypeInfo: '', pageNum: 1 })
  }

  // 处理所属分类变化
  const handleCategoryChange = (value: string) => {
    setQueryParams(prev => ({ ...prev, ruleTypeInfo: value, pageNum: 1 }))
    getTableData({ ruleTypeInfo: value, pageNum: 1 })
  }

  // 处理来源类型变化
  const handlePlatformChange = (value: string | number) => {
    setQueryParams(prev => ({ ...prev, rulePlatform: String(value), pageNum: 1 }))
    getTableData({ rulePlatform: String(value), pageNum: 1 })
  }

  // 分页变化（pageNum/pageSize）一次性更新并请求
  const handleTablePageChange = (page: number, pageSize?: number) => {
    const newPageSize = pageSize || queryParamsRef.current.pageSize
    setQueryParams(prev => ({ ...prev, pageNum: page, pageSize: newPageSize }))
    getTableData({ pageNum: page, pageSize: newPageSize })
  }

  const handleSelectRow = (id: string) =>
    selectedRows.includes(id)
      ? setSelectedRows(selectedRows.filter(item => item !== id))
      : setSelectedRows([...selectedRows, id])

  // const handleSelectAll = (checked: boolean) =>
  //   checked
  //     ? setSelectedRows(filteredData.map(item => item.id))
  //     : setSelectedRows([])

  // const handleConfirm = () => {
  //   const selectedRules = data.filter(item => selectedRows.includes(item.id))
  //   console.log('Selected rules:', selectedRules)
  //   onConfirm(selectedRules)
  // }

  // 首先添加格式化函数
  const formatRulePlatform = (platformValue: number) => {
    switch (platformValue) {
      case 0:
        return '平台默认'
      case 1:
        return '自定义'
      default:
        return (platformValue !== undefined && platformValue !== null) ? platformValue.toString() : ''
    }
  }

  // 修改表格列配置以适配 antd Table
  const columns = [
    {
      key: 'selection',
      width: 0,
      // render: (_: any, record: Rule) => (
      //   <input
      //     type='checkbox'
      //     checked={selectedRows.includes(record.id)}
      //     onChange={() => handleSelectRow(record.id)}
      //     className='rounded border-gray-300'
      //   />
      // ),
    },
    {
      key: 'ruleName',
      title: t('appDebug.feature.moderation.modal.table.ruleName'),
      dataIndex: 'ruleName',
      ellipsis: {
        showTitle: false,
      },
      render: (ruleName: string) => (
        <Tooltip title={ruleName}>
          {ruleName}
        </Tooltip>
      ),
    },
    {
      key: 'ruleContent',
      title: t('appDebug.feature.moderation.modal.table.ruleContent'),
      dataIndex: 'ruleContent',
      ellipsis: true,
      render: (ruleContent: string) => (
        <Tooltip title={ruleContent}>
          {ruleContent}
        </Tooltip>
      ),
    },
    {
      key: 'ruleType',
      title: t('appDebug.feature.moderation.modal.table.ruleType'),
      dataIndex: 'ruleType',
      ellipsis: true,
      render: (ruleType: string) => (
        <Tooltip title={ruleType}>
          {ruleType}
        </Tooltip>
      ),
    },
    {
      key: 'ruleTypeInfo',
      title: t('appDebug.feature.moderation.modal.table.ruleTypeInfo'),
      dataIndex: 'ruleTypeInfo',
      ellipsis: true,
      render: (ruleTypeInfo: string) => (
        <Tooltip title={ruleTypeInfo}>
          {ruleTypeInfo}
        </Tooltip>
      ),
    },
    {
      key: 'rulePlatform',
      title: t('appDebug.feature.moderation.modal.table.rulePlatform'),
      dataIndex: 'rulePlatform',
      ellipsis: true,
      render: (value: number) => (
        <Tooltip title={formatRulePlatform(value)}>
          {formatRulePlatform(value)}
        </Tooltip>
      ),
    },
    {
      key: 'createdName',
      title: t('appDebug.feature.moderation.modal.table.createdName'),
      dataIndex: 'createdName',
      ellipsis: true,
      render: (createdName: string) => (
        <Tooltip title={createdName}>
          {createdName}
        </Tooltip>
      ),
    },
    {
      key: 'createdAt',
      title: t('appDebug.feature.moderation.modal.table.createdAt'),
      dataIndex: 'createdAt',
      width: 170,
      ellipsis: true,
      render: (createdAt: string) => (
        <Tooltip title={createdAt}>
          {createdAt}
        </Tooltip>
      ),
    },
    {
      key: 'operation',
      title: t('appDebug.feature.moderation.modal.table.operation'),
      render: (_: any, record: Rule) => (
        Number(record.rulePlatform) === 1
          ? (
            <div className='flex items-center gap-3'>
              <span className='text-primary-600 cursor-pointer hover:text-primary-700'
                onClick={() => {
                  // console.log('数据', record)
                  setModalTitle('编辑规则')
                  setEditingRule(record)
                  setCreateRuleVisible(true)
                }}>
                编辑
              </span>
              <span className='text-red-600 cursor-pointer hover:text-red-700'
                onClick={() => {
                  setDeletingRule(record)
                  setDeleteVisible(true)
                }}>
                删除
              </span>
            </div>
          )
          : (
            <span>-</span>
          )
      ),
    },
  ]

  return (
    <Modal
      isShow
      onClose={onCancel}
      className="!p-0 !mt-14 !max-w-none !w-[1120px]"
    >
      <div className="flex items-center justify-between px-6 h-[64px] border-b border-gray-100">
        <div className="text-xl font-semibold text-gray-900">
          {t('appDebug.feature.moderation.modal.selectModal.title')}
        </div>
        <div className="p-1 cursor-pointer" onClick={onCancel}>
          <RiCloseLine className="w-4 h-4 text-gray-500" />
        </div>
      </div>
      <div className="px-6 pt-3">
        {/* 查询条件 */}
        <div className="flex gap-3 mb-4 items-center">
          <div className="flex-1">
            <SearchInput
              value={queryParams.ruleName}
              onChange={(value) => {
                handleSearchChange(value)
              }}
              placeholder={t('appDebug.feature.moderation.modal.selectModal.searchName') || ''}
            />
          </div>
          <CommonSelect
            className="w-40"
            defaultValue={queryParams.ruleType}
            onSelect={item => handleRuleTypeChange(item.value as string)}
            items={[
              { value: '', name: '全部类型' },
              ...typeOption.map(item => ({
                value: item.dictValue,
                name: item.dictLabel,
              })),
            ]}
            allowSearch={false}
            bgClassName="bg-gray-50"
          ></CommonSelect>

          <CommonSelect
            className="w-40"
            defaultValue={queryParams.ruleTypeInfo}
            onSelect={(item) => {
              handleCategoryChange(item.value as string) }}
            items={[
              { value: '', name: '全部所属分类' },
              ...categoryOption.map(item => ({
                value: item.dictValue,
                name: item.dictLabel,
              })),
            ]}
            allowSearch={false}
            bgClassName="bg-gray-50"
            placeholder={t('appDebug.feature.moderation.modal.selectModal.ruleTypeInfo') as string}
          ></CommonSelect>

          <CommonSelect
            className="w-40"
            onSelect={(item) => {
              handlePlatformChange(item.value as string) }}
            defaultValue={queryParams.rulePlatform}
            items={[
              { value: '', name: '全部来源类型' },
              { value: '1', name: '自定义' },
              { value: '0', name: '平台默认' },
            ]}
            allowSearch={false}
            bgClassName="bg-gray-50"
          ></CommonSelect>
          <Button variant="primary" className="min-w-24" onClick={() => {
            setModalTitle('创建规则')
            setEditingRule(null)
            setCreateRuleVisible(true)
          }}>
            + 创建规则
          </Button>
        </div>

        {/* 表格 */}
        <div className="mb-1">
          <Table
            loading={loading}
            rowKey="id"
            columns={columns}
            dataSource={tableData}
            pagination={{
              current: queryParams.pageNum,
              pageSize: queryParams.pageSize,
              total: queryParams.total,
              showSizeChanger: false,
              showQuickJumper: false,
              onChange: (page, pageSize) => {
                handleTablePageChange(page, pageSize)
              },
            }}
            rowSelection={{
              selectedRowKeys: allSelectedRows.map(row => row.id),
              onChange: (selectedRowKeys, selectedRows) => {
                // console.log('选中行', selectedRowKeys, selectedRows)
                setAllSelectedRows(selectedRows)
              },
              preserveSelectedRowKeys: true,
            }}
            className="custom-ant-table" // 自定义样式类名
          />
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="flex justify-end px-6 py-4 border-t border-gray-100">
        <Button onClick={onCancel} className="mr-2 min-w-24">
          {t('common.operation.cancel')}
        </Button>
        <Button
          variant="primary"
          className="min-w-24"
          onClick={() => {
            onConfirm(allSelectedRows)
            onCancel()
          }}
          disabled={allSelectedRows.length === 0}
        >
          {t('common.operation.confirm')}
        </Button>
      </div>
      {/* 创建规则弹窗 */}
      {createRuleVisible && (
        <CreateRuleModal
          title={modalTitle}
          onCancel={() => {
            setCreateRuleVisible(false)
            setEditingRule(null)
          }}
          onConfirm={(formData) => {
            setCreateRuleVisible(false)
            // 修改allSelectedRows缓存数据
            setAllSelectedRows((prevRows) => {
              const index = prevRows.findIndex(row => row.id === formData.id)
              if (index !== -1) {
                // 如果找到了匹配的记录，更新相关字段
                const updatedRows = [...prevRows]
                updatedRows[index] = {
                  ...updatedRows[index],
                  ruleName: formData.ruleName,
                  ruleContent: formData.ruleContent,
                  ruleType: formData.ruleType,
                  ruleTypeInfo: formData.ruleTypeInfo,
                }
                return updatedRows
              }
              return prevRows
            })
            setEditingRule(null)
            getTableData()
          }}
          ruleData={
            editingRule
              ? {
                id: editingRule.id,
                ruleName: editingRule.ruleName,
                ruleContent: editingRule.ruleContent,
                ruleType: editingRule.ruleType,
                ruleTypeInfo: editingRule.ruleTypeInfo,
                // rulePlatform: editingRule.rulePlatform,
                // status: 1,
              }
              : undefined}
        />
      )}
      {deleteVisible && (
        <Modal
          isShow
          onClose={() => {
            setDeleteVisible(false)
            setDeletingRule(null)
          }}
          className='!w-[600px]'
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="text-xl font-semibold text-gray-900">{t('appDebug.feature.moderation.modal.selectModal.deleteTitle')}</div>
            <div className="p-1 cursor-pointer" onClick={() => {
              setDeleteVisible(false)
              setDeletingRule(null)
            }}>
              <RiCloseLine className="w-4 h-4 text-gray-500" />
            </div>
          </div>
          <div className="px-6 py-6 space-y-5">
            <div className='px-6 py-4 bg-gray-50 rounded-xl'>
              <p className='mt-2 text-sm text-gray-500'>
                {`${deletingRule?.ruleName}`}
              </p>
            </div>
            <div className='flex items-center px-6 py-4 rounded-xl bg-[#fff2f1]'>
              <div
                className='p-1 radius-md cursor-pointer text-red-400'>
                <RiDeleteBinLine className='w-4 h-4'/>
              </div>
              <p className='text-sm text-red-600'>
                {t('appDebug.feature.moderation.modal.selectModal.deleteTip')}
              </p>
            </div>
          </div>
          <div className="flex justify-end px-6 py-4 border-t border-gray-100">
            <Button
              className='mr-2'
              onClick={() => {
                setDeleteVisible(false)
                setDeletingRule(null)
              }}
            >
              取消
            </Button>
            <Button
              variant='primary'
              onClick={async () => {
                if (deletingRule) {
                  try {
                    await deleteSafeRuleApi(deletingRule.id)
                    notify({ type: 'success', message: '删除成功' })
                    setDeleteVisible(false)
                    // 删除后更新缓存数据 setAllSelectedRows
                    setAllSelectedRows((prevRows) =>
                      prevRows.filter(row => row.id !== deletingRule.id),
                    )
                    setDeletingRule(null)
                    getTableData() // 刷新列表
                  }
                  catch (err) {
                    notify({ type: 'error', message: '删除失败' })
                  }
                }
              }}
            >
              确认
            </Button>
          </div>
        </Modal>
      )}
    </Modal>
  )
}

export default RulesSelectModal
