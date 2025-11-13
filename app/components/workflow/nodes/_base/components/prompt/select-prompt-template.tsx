import type { FC } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { RiCloseLine, RiDeleteBinLine } from '@remixicon/react'
import { Select, Tag } from 'antd'
import CreatePromptModal from './create-prompt-modal'
import TagsModal from './tags-modal'
import ConfirmModal from './confirm-modal'
import Modal from '@/app/components/base/modal'
import Button from '@/app/components/base/button'
import SearchInput from '@/app/components/base/search-input'
import { useToastContext } from '@/app/components/base/toast'
import { deletePromptApi, getPromptTemplateListApi } from '@/service/prompt'
import { getTagsApi } from '@/service/tag'

type TagItem = {
  name: string
  id: string
}

type PromptTemplate = {
  id: string
  promptName: string
  promptDesc: string
  promptContent: string
  useCount?: number
  status?: number
  categoryValueName?: string
  tagList?: TagItem[]
  [key: string]: any
}

type PromptSelectModalProps = {
  onCancel: () => void
  onConfirm?: (selectedPrompts: PromptTemplate[]) => void
  onUseTemplate?: (template: PromptTemplate) => void
}

const PromptSelectModal: FC<PromptSelectModalProps> = ({
  onCancel,
  onConfirm,
  onUseTemplate,
}) => {
  const { notify } = useToastContext()

  // 状态管理
  const [queryParams, setQueryParams] = useState({
    keyword: '',
    tagIdList: [] as string[],
    pageNum: 1,
    pageSize: 10,
    total: 0,
  })
  const queryParamsRef = useRef(queryParams)
  useEffect(() => {
    queryParamsRef.current = queryParams
  }, [queryParams])

  const [list, setList] = useState<PromptTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [deleteVisible, setDeleteVisible] = useState(false)
  const [deleteData, setDeleteData] = useState<PromptTemplate | null>(null)

  const [labelOptions, setLabelOptions] = useState<TagItem[]>([])
  const [editingRule, setEditingRule] = useState<PromptTemplate | null>(null)
  const [addDialogVisible, setAddDialogVisible] = useState(false)
  // const [hoveredCardId, setHoveredCardId] = useState<string | null>(null)
  const searchDebounceRef = useRef<number | null>(null)
  // 滚动分页相关状态
  const [hasMore, setHasMore] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // 标签管理相关状态
  const [tagsModalVisible, setTagsModalVisible] = useState(false)
  const [currentTagData, setCurrentTagData] = useState<PromptTemplate | null>(null)

  // 获取标签列表
  const getTags = useCallback(async () => {
    try {
      const result = await getTagsApi({ type: 'promptFlow' })
      setLabelOptions(Array.isArray(result) ? result : [])
    }
    catch (err) {
      console.error('获取标签列表失败:', err)
    }
  }, [])

  // 获取模板列表
  const getList = useCallback(
    async (overrides?: Partial<typeof queryParams>, isLoadMore = false) => {
      // 如果是加载更多且已经在请求中，则跳过
      if (isLoadMore && isFetching)
        return
      if (isLoadMore)
        setIsFetching(true)
      else
        setLoading(true)

      const merged = { ...queryParamsRef.current, ...(overrides || {}) }
      try {
        const params = {
          page: merged.pageNum,
          limit: merged.pageSize,
          ...(merged.keyword && { keyword: merged.keyword }),
          ...(merged.tagIdList && merged.tagIdList.length > 0 && { tagIdList: merged.tagIdList }),
        }
        // console.log('参数', params)
        // 调用获取模板列表的API
        const res = await getPromptTemplateListApi(params)
        if (res?.records) {
          if (merged.pageNum === 1)
            setList(res.records)
          else
            setList(prev => [...prev, ...res.records])

          setQueryParams(prev => ({ ...prev, total: res.total || 0 }))

          // 判断是否还有更多数据
          setHasMore(res.records.length >= merged.pageSize)
        }
      }
      catch (err) {
        notify({ type: 'error', message: '获取模板列表失败' })
      }
      finally {
        setLoading(false)
        setIsFetching(false)
      }
    },
    [notify, isFetching],
  )

  // 初始化
  useEffect(() => {
    getTags()
    getList()
    return () => {
      if (searchDebounceRef.current)
        clearTimeout(searchDebounceRef.current)
    }
  }, [])

  // 搜索处理 - 500ms 防抖
  const handleSearch = (value: string) => {
    if (searchDebounceRef.current)
      clearTimeout(searchDebounceRef.current)

    setQueryParams(prev => ({ ...prev, keyword: value, pageNum: 1 }))
    setHasMore(true)
    searchDebounceRef.current = window.setTimeout(() => {
      getList({ keyword: value, pageNum: 1 })
    }, 500)
  }

  // 标签选择处理
  const handleFormTagChange = (val: string[]) => {
    setQueryParams(prev => ({ ...prev, tagIdList: val, pageNum: 1 }))
    setHasMore(true) // 重置hasMore状态
    getList({ tagIdList: val, pageNum: 1 })
  }

  // 编辑模板
  const handleEdit = (item: PromptTemplate) => {
    setEditingRule(item)
    setAddDialogVisible(true)
  }

  // 删除模板
  const handleDelete = (item: PromptTemplate) => {
    setDeleteData(item)
    setDeleteVisible(true)
  }

  // 删除成功回调
  const handleDeleteSuccess = (id: string) => {
    setDeleteVisible(false)
    setList(prev => prev.filter(item => item.id.toString() !== id.toString()))
    setDeleteData(null)
  }

  // 新增成功回调
  const handlePromptAdded = () => {
    setAddDialogVisible(false)
    setQueryParams(prev => ({ ...prev, pageNum: 1 }))
    setHasMore(true) // 重置hasMore状态
    getList({ pageNum: 1 })
  }

  // 更新成功回调
  const handlePromptUpdated = (item: PromptTemplate) => {
    setAddDialogVisible(false)
    setList(prev =>
      prev.map(i =>
        i.id === item.id
          ? {
            ...i,
            promptName: item.promptName,
            promptDesc: item.promptDesc,
            promptContent: item.promptContent,
          }
          : i,
      ),
    )
    setEditingRule(null)
  }

  // 更新模板对应标签
  const updatePromptTags = (data: { id: string; tags: TagItem[] }) => {
    setList(prev =>
      prev.map((item) => {
        if (item.promptsUuid === data.id) {
          return {
            ...item,
            tagList: data.tags || [],
          }
        }
        return item
      }),
    )
  }

  // 使用模板
  const selectTemplate = async (item: PromptTemplate) => {
    onUseTemplate?.(item)
    onCancel()
  }

  // 新增模板
  const addPromptTemplate = () => {
    setEditingRule(null)
    setAddDialogVisible(true)
  }

  // 加载更多数据
  const loadMore = () => {
    if (!hasMore || isFetching)
      return

    const nextPage = queryParamsRef.current.pageNum + 1
    setQueryParams(prev => ({ ...prev, pageNum: nextPage }))
    getList({ pageNum: nextPage }, true)
  }

  // 滚动到底部时加载更多
  const handleScroll = () => {
    if (!scrollContainerRef.current || !hasMore || isFetching)
      return

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    // 当距离底部小于50px时触发加载
    if (scrollHeight - scrollTop - clientHeight < 50)
      loadMore()
  }

  // 处理分页变化
  const handlePageChange = (page: number, pageSize?: number) => {
    const newPageSize = pageSize || queryParamsRef.current.pageSize
    setQueryParams(prev => ({ ...prev, pageNum: page, pageSize: newPageSize }))
    getList({ pageNum: page, pageSize: newPageSize })
  }

  // 处理标签点击
  const handleTagsClick = (item: PromptTemplate) => {
    setCurrentTagData({ ...item, id: item.promptsUuid })
    setTagsModalVisible(true)
  }
  // 卡片组件
  const TemplateCard: FC<{ template: PromptTemplate }> = ({ template }) => {
    return (
      <div
        className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow h-full"
      >
        {/* 卡片头部 - 标题和选择框 */}
        <div className="p-3 border-gray-100">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate text-sm">
                {template.promptName}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                引用次数：{template.useCount || 0}
              </p>
            </div>
            <div className="items-center hidden group-hover:flex gap-2">
              <button
                onClick={() => handleEdit(template)}
                className="text-blue-600 hover:text-blue-700 cursor-pointer text-sm"
              >
                  编辑
              </button>
              {/* <span className="text-gray-300">|</span> */}
              <button
                onClick={() => handleDelete(template)}
                className="text-red-600 hover:text-red-700 cursor-pointer text-sm"
              >
                删除
              </button>
            </div>
          </div>
        </div>

        {/* 卡片概述 */}
        <div className="p-3 min-h-[66px]">
          <p className="text-sm text-gray-600 line-clamp-3">
            {template.promptDesc}
          </p>
        </div>

        {/* 标签区域 */}
        <div className="px-3 py-2 border-t border-gray-100 flex items-center gap-2 justify-between">
          <div className="truncate cursor-pointer" onClick={() => handleTagsClick(template)}>
            <Tag
              style={{
                marginRight: 0,
                borderStyle: 'dashed',
                cursor: 'pointer',
                color: '#616E89',
              }}
            >
              + 标签
            </Tag>
            {template.tagList && template.tagList.length > 0 && (
              template.tagList.map((tag, idx) => (
                <Tag className='ml-2' key={idx} style={{ marginRight: 0 }}>
                  {tag.name}
                </Tag>
              ))
            )}
          </div>
          {/* 操作按钮 */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => selectTemplate(template)}
              className="text-blue-600 w-[86px] hover:bg-[#3b6ce4] hover:border-[#3b6ce4] hover:text-white cursor-pointer border border-[#cdd9fa] rounded-lg py-1.5 px-2.5"
            >
              + 使用模板
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Modal
      isShow
      onClose={onCancel}
      className="!p-0 !mt-14 !max-w-none !w-[1120px]"
    >
      <div className="flex items-center justify-between px-6 h-[64px] border-b border-gray-100">
        <div className="text-xl font-semibold text-gray-900">
          提示词模板
        </div>
        <div
          className="p-1 cursor-pointer hover:bg-gray-100 rounded"
          onClick={onCancel}
        >
          <RiCloseLine className="w-4 h-4 text-gray-500" />
        </div>
      </div>
      <div className="px-6 pt-4">
        {/* 查询条件 */}
        <div className="flex gap-3 mb-4 items-center">
          <div className="flex-shrink-0 w-80">
            <SearchInput
              value={queryParams.keyword}
              onChange={handleSearch}
              placeholder="搜索模板"
            />
          </div>
          <Select
            className="flex-shrink-0 w-80"
            mode="multiple"
            placeholder="选择标签"
            maxTagCount="responsive"
            value={queryParams.tagIdList}
            onChange={(vals) => handleFormTagChange(vals as string[])}
            options={labelOptions.map(item => ({ value: item.id, label: item.name }))}
            allowClear
            dropdownMatchSelectWidth={false}
          />
          <Button
            variant="primary"
            className="min-w-24 ml-auto"
            onClick={addPromptTemplate}
          >
            + 新增
          </Button>
        </div>

        {/* 卡片网格 */}
        <div className="mb-4 h-[500px] overflow-y-auto" ref={scrollContainerRef} onScroll={handleScroll}>
          {(loading && queryParams.pageNum === 1)
            ? (
              <div className="flex items-center justify-center h-96">
                <span className="text-gray-500">加载中...</span>
              </div>
            )
            : list.length > 0
              ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    {list.map(template => (
                      <TemplateCard key={template.id} template={template} />
                    ))}
                  </div>
                  {/* 加载更多指示器 */}
                  {!hasMore
                    ? (<div className="text-center text-sm py-4 text-gray-500">没有更多了</div>)
                    : isFetching
                      ? (<div className="text-center text-sm py-4 text-gray-500">加载中...</div>)
                      : null}
                </>
              )
              : (
                <div className="flex items-center justify-center h-96">
                  <span className="text-gray-500 text-sm">暂无数据</span>
                </div>
              )}
        </div>

        {/* 分页 */}
        {/* {queryParams.total > 0 && (
          <div className="flex justify-center py-4 border-t border-gray-100">
            <Pagination
              current={queryParams.pageNum}
              pageSize={queryParams.pageSize}
              total={queryParams.total}
              onChange={handlePageChange}
              showSizeChanger={false}
              showQuickJumper={false}
            />
          </div>
        )} */}
      </div>

      {/* 创建/编辑模板弹窗 */}
      {addDialogVisible && (
        <CreatePromptModal
          isNoApproval={true}
          promptId={editingRule?.id || ''}
          onCancel={() => {
            setAddDialogVisible(false)
            setEditingRule(null)
          }}
          onConfirm={(_formData) => {
            if (editingRule)
              handlePromptUpdated(_formData)
            else
              handlePromptAdded()
          }}
        />
      )}

      {/* 删除确认弹窗 */}
      {deleteVisible && deleteData && (
        <ConfirmModal
          title="确认删除"
          type="error"
          tip={{ text: '删除后无法恢复，确认删除吗？' }}
          info={{ name: deleteData.promptName }}
          onOk={async () => {
            if (deleteData) {
              try {
                await deletePromptApi({ ids: deleteData.id, isNoApproval: true })
                notify({ type: 'success', message: '删除成功' })
                handleDeleteSuccess(deleteData.id)
              }
              catch (err) {
                notify({ type: 'error', message: '删除失败' })
              }
            }
          }}
          onCancel={() => {
            setDeleteVisible(false)
            setDeleteData(null)
          }}
        >
        </ConfirmModal>
      )}
      {/* 标签管理弹窗 */}
      {tagsModalVisible && currentTagData && (
        <TagsModal
          isShow={tagsModalVisible}
          type="promptFlow"
          tagsData={currentTagData.tagList || []}
          tagData={{
            id: currentTagData.id,
            name: currentTagData.promptName,
          }}
          onClose={() => {
            setTagsModalVisible(false)
            setCurrentTagData(null)
          }}
          onUpdate={() => {
            getTags()
          }}
          onUpdatePromptTags={updatePromptTags}
        />
      )}
    </Modal>
  )
}

export default PromptSelectModal
