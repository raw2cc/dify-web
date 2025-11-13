import type { FC } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Tag } from 'antd'
import cn from 'classnames'
import ConfirmModal from './confirm-modal'
import Button from '@/app/components/base/button'
import Input from '@/app/components/base/input'
import Modal from '@/app/components/base/modal'
import { useToastContext } from '@/app/components/base/toast'
import { addTagsApi, deleteTagApi, editTagApi, getTagsApi, replaceTagApi } from '@/service/tag'

type TagItem = {
  id: string
  name: string
  type: string
  binding_count: number
}

type TagsModalProps = {
  isShow?: boolean
  type?: string
  tagsData?: TagItem[] | string[] // 已选中的标签ID数组或标签对象数组
  tagData?: {
    id: string
    name: string
    [key: string]: any
  }
  onClose: () => void
  onUpdate?: (data?: TagItem[]) => void
  onUpdatePromptTags?: (data: { id: string; tags: TagItem[] }) => void
}

const TagsModal: FC<TagsModalProps> = ({
  isShow,
  type = 'promptFlow',
  tagsData = [],
  tagData,
  onClose,
  onUpdate,
  onUpdatePromptTags,
}) => {
  const { t } = useTranslation()
  const { notify } = useToastContext()

  // 状态管理
  const [tagList, setTagList] = useState<TagItem[]>([])
  const [tagName, setTagName] = useState('')
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkedTags, setCheckedTags] = useState<string[]>([])
  const inputEditRef = useRef<HTMLInputElement>(null)

  // 初始化选中的标签
  const initCheckedTags = () => {
    if (Array.isArray(tagsData) && tagsData.length > 0) {
      if (typeof tagsData[0] === 'object') {
        // tagsData是TagItem对象数组
        setCheckedTags((tagsData as TagItem[]).map(tag => tag.id))
      }
      else if (typeof tagsData[0] === 'string') {
        // tagsData是字符串ID数组
        setCheckedTags(tagsData as string[])
      }
      else {
        setCheckedTags([])
      }
    }
    else {
      setCheckedTags([])
    }
  }

  // 获取标签列表
  const getTags = async () => {
    setLoading(true)
    try {
      const result = await getTagsApi({ type })
      setTagList(Array.isArray(result) ? result : [])
    }
    catch (err) {
      console.error('获取标签列表失败:', err)
      notify({ type: 'error', message: '获取标签列表失败' })
    }
    finally {
      setLoading(false)
    }
  }

  // 检查标签名称是否重复
  const checkTagNameExists = (name: string, excludeId: string | null = null) => {
    return tagList.some(tag =>
      tag.name === name && (!excludeId || tag.id !== excludeId),
    )
  }

  // 创建标签
  const handleCreateTag = async () => {
    if (!tagName)
      return
    if (tagName.length > 40) {
      notify({ type: 'warning', message: '标签的字符长度必须是 1 到 40 个字符' })
      return
    }
    // 检查是否存在同名标签
    if (checkTagNameExists(tagName)) {
      notify({ type: 'warning', message: '已存在相同名称的标签' })
      return
    }
    try {
      await addTagsApi({ name: tagName, type })
      await getTags()
      onUpdate?.()
      setTagName('')
    }
    catch (err) {
      console.error('创建标签失败:', err)
      notify({ type: 'error', message: '创建标签失败' })
    }
  }

  // 编辑标签
  const handleEditTag = async () => {
    if (editIndex === null)
      return

    const item = tagList[editIndex]
    if (!editName || editName === item.name) {
      setEditIndex(null)
      return
    }
    if (editName.length > 40) {
      notify({ type: 'warning', message: '标签的字符长度必须是 1 到 40 个字符' })
      return
    }
    // 检查是否存在同名标签（排除当前编辑的标签）
    if (checkTagNameExists(editName, item.id)) {
      notify({ type: 'warning', message: '已存在相同名称的标签' })
      return
    }
    try {
      await editTagApi({ id: item.id, name: editName })
      await getTags()
      onUpdate?.()
      setEditIndex(null)
      setEditName('')
    }
    catch (err) {
      console.error('编辑标签失败:', err)
      notify({ type: 'error', message: '编辑标签失败' })
    }
  }

  // 处理编辑标签
  const handleEdit = (item: TagItem, index: number) => {
    setEditIndex(index)
    setEditName(item.name)
  }

  // 处理删除标签
  const [deleteVisible, setDeleteVisible] = useState(false)
  const [deleteData, setDeleteData] = useState<TagItem | null>(null)

  const handleConfirmDelete = async (data: any) => {
    if (!data)
      return

    try {
      await deleteTagApi({ ids: [data.id] })
      // 更新选中的标签列表，移除被删除的标签
      setCheckedTags(prev => prev.filter(id => id !== data.id))
      await getTags()
      // 通知父组件
      onUpdate?.(data)
      setDeleteVisible(false)
      setDeleteData(null)
      notify({ type: 'success', message: '删除成功' })
    }
    catch (err) {
      console.error('删除标签失败:', err)
      notify({ type: 'error', message: '删除标签失败' })
    }
  }

  const handleDeleteTag = async (item: TagItem) => {
    // setDeleteData(item)
    // setDeleteVisible(true)
    handleConfirmDelete(item)
  }

  // 处理标签选中状态变化
  const handleChange = (checked: boolean, id: string) => {
    if (checked)
      setCheckedTags(prev => [...prev, id])
    else
      setCheckedTags(prev => prev.filter(i => i !== id))
  }

  // 处理添加标签
  const handleAddTag = async () => {
    if (!tagData)
      return

    try {
      await replaceTagApi({ tag_ids: checkedTags, target_id: tagData.id })

      // 获取完整的标签对象用于回调
      const tags = checkedTags.map(tagId => {
        return tagList.find(tag => tag.id === tagId)!
      }).filter(Boolean)
      onUpdatePromptTags?.({
        id: tagData.id,
        tags,
      })

      onClose()
      notify({ type: 'success', message: '标签更新成功' })
    }
    catch (err) {
      console.error('更新标签失败:', err)
      notify({ type: 'error', message: '更新标签失败' })
    }
  }

  // 当模态框打开时获取标签列表
  useEffect(() => {
    getTags()
  }, [])

  // 初始化选中的标签
  useEffect(() => {
    initCheckedTags()
  }, [tagsData])

  // 当编辑索引改变时聚焦输入框
  useEffect(() => {
    if (editIndex !== null && inputEditRef.current)
      inputEditRef.current.focus()
  }, [editIndex])

  return (
    <Modal
      isShow
      onClose={onClose}
      className="!p-0 !mt-14 !max-w-none !w-[620px]"
    >
      <div className="flex items-center justify-between px-6 h-[64px] border-b border-gray-100">
        <div className="text-xl font-semibold text-gray-900">
          选择标签 <span className="text-gray-500 font-normal">({tagData?.name})</span>
        </div>
        <div
          className="p-1 cursor-pointer hover:bg-gray-100 rounded"
          onClick={onClose}
        >
          <span className="text-gray-500 text-xl">×</span>
        </div>
      </div>

      <div className="px-6 py-4" style={{ minHeight: '300px' }}>
        <div className="mb-4 flex items-center gap-2">
          <Input
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-[120px]"
            value={tagName}
            onChange={e => setTagName(e.target.value)}
            placeholder="新增标签"
            onBlur={handleCreateTag}
            onKeyDown={e => e.key === 'Enter' && handleCreateTag()}
          />
        </div>

        <div className="flex flex-wrap gap-5 h-[200px] overflow-y-auto -mx-6 px-6 py-2">
          {tagList.map((item, index) => (
            <div key={item.id} className="relative flex items-center px-2 py-1.5 border border-gray-200 rounded-lg h-8 w-[172px] text-sm text-gray-600">
              {editIndex === index
                ? (
                  <input
                    ref={inputEditRef}
                    className="border-none outline-none p-0 text-gray-900 w-full"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onBlur={handleEditTag}
                    onKeyDown={e => e.key === 'Enter' && handleEditTag()}
                  />
                )
                : (
                  <>
                    <label className="flex items-center cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={checkedTags.includes(item.id)}
                        onChange={e => handleChange(e.target.checked, item.id)}
                      />
                      <span
                        className="truncate"
                        title={item.name}
                      >
                        {item.name}
                      </span>
                    </label>
                    <div className="absolute -top-2 -right-2 flex">
                      <button
                        className="w-4 h-4 bg-gray-400 text-white rounded-full text-[10px] flex items-center justify-center mr-1 hover:bg-blue-500"
                        onClick={() => handleEdit(item, index)}
                      >
                        ✎
                      </button>
                      <button
                        className="w-4 h-4 bg-gray-400 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-red-500"
                        onClick={() => handleDeleteTag(item)}
                      >
                          ×
                      </button>
                    </div>
                  </>
                )
              }
            </div>
          ))}
        </div>
      </div>
      <div className="px-6 py-4 border-t border-gray-100 flex justify-center">
        <Button
          variant="primary"
          className="min-w-24"
          onClick={handleAddTag}
        >
          确认
        </Button>
      </div>

      {/* 删除确认弹窗 */}
      {deleteVisible && deleteData && (
        <ConfirmModal
          title="标签删除"
          type="warning"
          tip={{
            text: (
              <div>
                <p>{deleteData.name}已关联{deleteData.binding_count || 0}个知识库。删除标签后对应的知识库将自动移除该标签</p>
                <div className="px-3 py-2 bg-[#fdf3f1] text-[#c62f27] rounded mt-2">
                  <i className="mr-2">⚠</i>
                  <span>是否确认删除{deleteData.name}数据？</span>
                </div>
              </div>
            ),
          }}
          // onOk={handleConfirmDelete}
          onCancel={() => {
            setDeleteVisible(false)
            setDeleteData(null)
          }}
        >
        </ConfirmModal>
      )}
    </Modal>
  )
}

export default TagsModal
