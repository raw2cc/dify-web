import type { FC } from 'react'
import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { RiCloseLine } from '@remixicon/react'
import Modal from '@/app/components/base/modal'
import Button from '@/app/components/base/button'
import { CommonSelect } from '@/app/components/base/select'
import Input from '@/app/components/base/input'
import { type DictType, addSafeRuleApi, getDictTypeApi, updateSafeRuleApi } from '@/service/rules'
import { useToastContext } from '@/app/components/base/toast'

type CreateRuleModalProps = {
  title?: string // 添加标题属性
  ruleData?: Object
  onCancel: () => void
  onConfirm: (values: any) => void
}

const CreateRuleModal: FC<CreateRuleModalProps> = ({
  title = '创建规则', // 设置默认标题
  ruleData = {},
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    id: '',
    ruleName: '',
    ruleContent: '',
    ruleType: '',
    ruleTypeInfo: '',
    rulePlatform: 1, // 0-平台默认 1-自定义  默认0
    status: 1, // 0-停用 1-启用 默认1
  })
  const { notify } = useToastContext()

  // 初始化时合并 ruleData 到 formData
  useEffect(() => {
    if (ruleData && Object.keys(ruleData).length > 0) {
      setFormData(prevData => ({
        ...prevData,
        ...ruleData,
      }))
    }
  }, [ruleData])

  // 添加新的状态
  const [ruleTypeList, setRuleTypeList] = useState<DictType[]>([])
  const [categoryList, setCategoryList] = useState<DictType[]>([])
  const [loading, setLoading] = useState(false)
  // 获取所属分类
  const fetchCategoryOptions = useCallback(async (type: string) => {
    try {
      console.log('通过规则类型获取所属分类', formData.ruleType)
      const result = await getDictTypeApi({ dictType: type })
      setCategoryList(Array.isArray(result) ? result : [])
    }
    catch (err) {
      console.error('获取分类列表失败:', err)
      setCategoryList([]) // 确保在错误情况下也设置空数组
    }
  }, [])

  // 监听 formData 变化，处理初始数据加载
  // useEffect(() => {
  //   if (formData.ruleType && formData.ruleTypeInfo && !initialCategoryLoaded) {
  //     // 获取规则类型对应的 dictValue
  //     const ruleTypeValue = ruleTypes.find(item => item.dictLabel === formData.ruleType)?.dictValue
  //     if (ruleTypeValue)
  //       fetchCategoryOptions(ruleTypeValue)
  //     else
  //       setInitialCategoryLoaded(true) // 如果找不到对应的dictValue，标记为已加载完成
  //   }
  // }, [formData.ruleType, ruleTypes])

  // 监听 formData.ruleType 变化，自动加载分类数据
  useEffect(() => {
    if (formData.ruleType) {
      // 获取规则类型对应的 dictValue
      const ruleTypeValue = ruleTypeList.find(item => item.dictLabel === formData.ruleType)?.dictValue
      if (ruleTypeValue)
        fetchCategoryOptions(ruleTypeValue)
    }
  }, [formData.ruleType, ruleTypeList, fetchCategoryOptions])

  // 表单字数限制
  const nameLimit = 50
  const contentLimit = 5000

  const handleInputChange = useCallback((field: string, value: string, label?: string) => {
    if (field === 'ruleName' && value.length > nameLimit)
      return
    if (field === 'ruleContent' && value.length > contentLimit)
      return

    if (field === 'ruleType') {
      fetchCategoryOptions(label as string)
      // 切换规则类型时，清空所属分类
      setFormData(prev => ({
        ...prev,
        [field]: value,
        ruleTypeInfo: '', // 清空所属分类
      }))
      return
    }

    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  // 获取规则类型列表
  const fetchRuleTypes = useCallback(async () => {
    try {
      const result = await getDictTypeApi({ dictType: 'kxaf_rule_config' })
      const typeList = Array.isArray(result) ? result : []
      setRuleTypeList(typeList)
    }
    catch (err) {
      console.error('获取规则类型失败:', err)
    }
  }, [])

  // 2. 添加单独的 effect 处理默认值
  // useEffect(() => {
  //   if (formData.id && formData.ruleType && ruleTypes.length > 0 && !initialCategoryLoaded) {
  //     const ruleTypeValue = ruleTypes.find(item => item.dictLabel === formData.ruleType)?.dictValue
  //     if (ruleTypeValue)
  //       fetchCategoryOptions(ruleTypeValue)
  //     else
  //       setInitialCategoryLoaded(true) // 如果找不到对应的dictValue，标记为已加载完成
  //   }
  // }, [formData.id, formData.ruleType, ruleTypes,initialCategoryLoaded])

  // 初始化加载规则类型
  useEffect(() => {
    fetchRuleTypes()
  }, [])

  const handleConfirm = async () => {
    if (!formData.ruleName || !formData.ruleContent || !formData.ruleType || !formData.ruleTypeInfo) {
      // 可以添加错误提示
      return
    }
    setLoading(true)
    try {
      if (formData.id)
        await updateSafeRuleApi({ ...formData })
      else
        await addSafeRuleApi({ ...formData })

      // 提示 保存成功
      notify({ type: 'success', message: '保存成功' })
      onConfirm(formData)
    }
    catch (err) {
      console.error('保存规则失败:', err)
      notify({
        type: 'error',
        message: err instanceof Error ? err.message : '保存失败，请稍后重试',
      })
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isShow
      onClose={onCancel}
      className="!p-0 !mt-14 !max-w-none !w-[640px] !max-h-[80vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="text-xl font-semibold text-gray-900">{title}</div>
        <div className="p-1 cursor-pointer" onClick={onCancel}>
          <RiCloseLine className="w-4 h-4 text-gray-500" />
        </div>
      </div>

      <div className="px-6 py-2 space-y-2">
        {/* 规则名称 */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <span className="text-red-500">*</span>
            <span className="text-sm font-medium text-gray-900">规则名称</span>
          </div>
          <div className="relative">
            <Input
              placeholder={''}
              value={formData.ruleName}
              onChange={e => handleInputChange('ruleName', e.target.value)}
              type='text'
            />

            <div className="absolute right-3 top-2 text-xs text-gray-500">
              {formData.ruleName.length}/{nameLimit}
            </div>
          </div>
        </div>

        {/* 规则内容 */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <span className="text-red-500">*</span>
            <span className="text-sm font-medium text-gray-900">规则内容</span>
          </div>
          <div className="relative">
            <textarea
              value={formData.ruleContent}
              onChange={(e) => handleInputChange('ruleContent', e.target.value)}
              className="w-full h-[120px] px-3 py-2 text-sm bg-gray-100 rounded-lg outline-none resize-none focus:ring-1 focus:ring-primary-600"
              placeholder="请输入规则内容"
            />
            <div className="absolute right-3 bottom-2 text-xs text-gray-500">
              {formData.ruleContent.length}/{contentLimit}
            </div>
          </div>
        </div>

        {/* 规则类型 */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <span className="text-red-500">*</span>
            <span className="text-sm font-medium text-gray-900">规则类型</span>
          </div>
          <div className='grid gap-2.5 grid-cols-3'>
            {
              ruleTypeList.map(way => (
                <div
                  key={way.dictValue}
                  className={`
                    flex items-center px-3 py-2 rounded-lg text-sm text-gray-900 cursor-pointer
                    ${formData.ruleType === way.dictLabel ? 'bg-white border-[1.5px] border-primary-400 shadow-sm' : 'border border-gray-100 bg-gray-25'}
                    }
                  `}
                  onClick={() => handleInputChange('ruleType', way.dictLabel, way.dictValue)}
                >
                  <div className={`
                    mr-2 w-4 h-4 rounded-full border
                    ${formData.ruleType === way.dictLabel ? 'border-[5px] border-primary-600' : 'border border-gray-300'}`} />
                  {way.dictLabel}
                </div>
              ))
            }
          </div>
        </div>

        {/* 所属分类 */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <span className="text-red-500">*</span>
            <span className="text-sm font-medium text-gray-900">所属分类</span>
          </div>
          <CommonSelect
            className=""
            defaultValue={formData.ruleTypeInfo}
            placeholder="请选择所属分类"
            onSelect={(item) => {
              handleInputChange('ruleTypeInfo', item.value as string)
            }}
            items={categoryList.map(item => ({
              value: item.dictLabel,
              name: item.dictLabel,
            })) || []}
            allowSearch={false}
            bgClassName="bg-gray-50"
          />
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
          disabled={!formData.ruleName || !formData.ruleContent || !formData.ruleType || !formData.ruleTypeInfo}
        >
          确定
        </Button>
      </div>
    </Modal>
  )
}

export default CreateRuleModal
