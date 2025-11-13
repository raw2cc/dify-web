import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiCloseLine } from '@remixicon/react'
import Modal from '@/app/components/base/modal'
import Button from '@/app/components/base/button'
import Input from '@/app/components/base/input'
import Textarea from '@/app/components/base/textarea'
import { useToastContext } from '@/app/components/base/toast'
import { addPromptWordsApi, detailPromptWordsApi, editPromptWordsApi } from '@/service/prompt'

type AddPromptModalProps = {
  promptId?: string
  isNoApproval?: boolean
  onCancel: () => void
  onConfirm: (values: any) => void
}

const CreatePromptModal: FC<AddPromptModalProps> = ({
  promptId,
  isNoApproval = false,
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation()
  const { notify } = useToastContext()
  const [formData, setFormData] = useState({
    id: '',
    promptName: '',
    promptDesc: '',
    promptContent: '',
  })
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 表单字数限制
  const nameLimit = 10
  const descLimit = 20
  const contentLimit = 500

  // 重置表单
  const resetForm = useCallback(() => {
    setFormData({
      id: '',
      promptName: '',
      promptDesc: '',
      promptContent: '',
    })
  }, [])

  // 获取详情
  const fetchDetail = useCallback(async (id: string) => {
    setLoading(true)
    try {
      const res = await detailPromptWordsApi({ id })
      setFormData({
        id: res.id || '',
        promptName: res.promptName || '',
        promptDesc: res.promptDesc || '',
        promptContent: res.promptContent || '',
      })
    }
    catch (err) {
      console.error('获取详情失败:', err)
      notify({ type: 'error', message: '获取详情失败' })
    }
    finally {
      setLoading(false)
    }
  }, [notify])

  // 监听promptId变化
  useEffect(() => {
    if (promptId)
      fetchDetail(promptId)
    else
      resetForm()
  }, [])

  const handleInputChange = useCallback((field: string, value: string) => {
    // 字数限制检查
    if (field === 'promptName' && value.length > nameLimit)
      return
    if (field === 'promptDesc' && value.length > descLimit)
      return
    if (field === 'promptContent' && value.length > contentLimit)
      return

    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  const handleConfirm = async () => {
    // 表单验证
    if (!formData.promptName.trim()) {
      notify({ type: 'error', message: '请输入提示词名称' })
      return
    }
    if (!formData.promptDesc.trim()) {
      notify({ type: 'error', message: '请输入提示词概述' })
      return
    }
    if (!formData.promptContent.trim()) {
      notify({ type: 'error', message: '请输入提示词模版内容' })
      return
    }

    setIsSubmitting(true)
    try {
      let res: any
      if (formData.id) {
        // 编辑
        res = await editPromptWordsApi(formData)
        notify({ type: 'success', message: '编辑成功' })
      }
      else {
        // 新增
        res = await addPromptWordsApi({ ...formData, isNoApproval })
        notify({ type: 'success', message: '新增成功' })
      }

      onConfirm(res)
    }
    catch (err) {
      console.error('保存失败:', err)
      notify({
        type: 'error',
        message: err instanceof Error ? err.message : '保存失败，请稍后重试',
      })
    }
    finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isShow
      onClose={onCancel}
      className="!p-0 !mt-14 !max-w-none !w-[600px] !max-h-[80vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="text-xl font-semibold text-gray-900">
          {formData.id ? '编辑模板' : '新增模板'}
        </div>
        <div className="p-1 cursor-pointer" onClick={onCancel}>
          <RiCloseLine className="w-4 h-4 text-gray-500" />
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {/* 提示词名称 */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <span className="text-red-500">*</span>
            <span className="text-sm font-medium text-gray-900">提示词名称</span>
          </div>
          <div className="relative">
            <Input
              placeholder="请输入提示词"
              value={formData.promptName}
              onChange={e => handleInputChange('promptName', e.target.value)}
              maxLength={nameLimit}
            />
            <div className="absolute right-3 top-2 text-xs text-gray-500">
              {formData.promptName.length}/{nameLimit}
            </div>
          </div>
        </div>

        {/* 提示词概述 */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <span className="text-red-500">*</span>
            <span className="text-sm font-medium text-gray-900">提示词概述</span>
          </div>
          <div className="relative">
            <Input
              placeholder="请输入提示词"
              value={formData.promptDesc}
              onChange={e => handleInputChange('promptDesc', e.target.value)}
              maxLength={descLimit}
            />
            <div className="absolute right-3 top-2 text-xs text-gray-500">
              {formData.promptDesc.length}/{descLimit}
            </div>
          </div>
        </div>

        {/* 提示词模版内容 */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <span className="text-red-500">*</span>
            <span className="text-sm font-medium text-gray-900">提示词模版内容</span>
          </div>
          <div className="relative">
            <Textarea
              rows={6}
              value={formData.promptContent}
              onChange={e => handleInputChange('promptContent', e.target.value)}
              className="border-gray-200"
              placeholder="请输入提示词"
              maxLength={contentLimit}
            />
            <div className="absolute right-3 bottom-2 text-xs text-gray-500">
              {formData.promptContent.length}/{contentLimit}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end px-6 py-4 border-t border-gray-100">
        <Button onClick={onCancel} className="mr-2 min-w-24">
          取消
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          className="min-w-24"
          disabled={isSubmitting || loading}
        >
          {isSubmitting ? '保存中...' : (formData.id ? '保存' : '保存')}
        </Button>
      </div>
    </Modal>
  )
}

export default CreatePromptModal
