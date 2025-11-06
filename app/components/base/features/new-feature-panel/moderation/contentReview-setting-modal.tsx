import type { ChangeEvent, FC } from 'react'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { useContext } from 'use-context-selector'
import { useTranslation } from 'react-i18next'
import { RiAddLine, RiCloseLine } from '@remixicon/react'
import { usePathname, useRouter } from 'next/navigation'
import RulesSelectModal from './rules-select-modal'
import CreateRuleModal from './create-rule-modal'
import Modal from '@/app/components/base/modal'
import Button from '@/app/components/base/button'
import type { ModerationConfig } from '@/models/debug'
import { useToastContext } from '@/app/components/base/toast'
import {
  fetchCodeBasedExtensionList,
  fetchModelProviders,
} from '@/service/common'
import type { CodeBasedExtensionItem } from '@/models/common'
import I18n from '@/context/i18n'
import { useModalContext } from '@/context/modal-context'
import { CustomConfigurationStatusEnum } from '@/app/components/header/account-setting/model-provider-page/declarations'
import { getAppRulesApi, getSafeRuleListApi, saveAppRulesApi } from '@/service/rules'

const systemTypes = ['openai_moderation', 'keywords', 'api']

type Provider = {
  key: string
  name: string
  form_schema?: CodeBasedExtensionItem['form_schema']
}

type ModerationSettingModalProps = {
  data: ModerationConfig
  onCancel: () => void
  onSave: (moderationConfig: ModerationConfig) => void
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

const ContentReviewSettingModal: FC<ModerationSettingModalProps> = ({
  data,
  onCancel,
  onSave,
}) => {
  // console.log('ContentReviewSettingModal', data, onCancel, onSave)
  const { t } = useTranslation()
  const { notify } = useToastContext()
  const { locale } = useContext(I18n)
  const pathname = usePathname()
  const matched = pathname.match(/\/app\/([^/]+)/)
  const appId = (matched?.length && matched[1]) ? matched[1] : ''
  const { data: modelProviders, isLoading, mutate } = useSWR('/workspaces/current/model-providers', fetchModelProviders)
  const [localeData, setLocaleData] = useState<ModerationConfig>(data)
  const [shouldSave, setShouldSave] = useState(false)
  const [ruleMatchWay, setRuleMatchWay] = useState<string>('')
  const [agentRulesData, setAgentRulesData] = useState<{}>({})
  const { setShowAccountSettingModal } = useModalContext()
  const [rulesSelectVisible, setRulesSelectVisible] = useState<boolean>(false)
  // 在组件内添加状态
  const [selectedRules, setSelectedRules] = useState<Rule[]>([
  ])
  const [loading, setLoading] = useState(false)
  const [tableData, setTableData] = useState<Rule[]>([])
  // 添加状态控制创建规则弹框的显示
  const [createRuleVisible, setCreateRuleVisible] = useState(false)

  // 获取智能体规则数据的函数
  const getAgentRules = async () => {
    try {
      const res = await getAppRulesApi(appId)
      setAgentRulesData(res.data)

      // 根据返回的数据设置规则匹配方式和选中规则
      if (res.data?.content === '0' || res.data?.content === 0) {
        setRuleMatchWay('all')
      }
      else if (res.data?.content && res.data?.content.split(',').length > 0) {
        setRuleMatchWay('demand')
        setSelectedRules(res.data?.ruleConfig || [])
      }
    }
    catch (error) {
      console.error('获取智能体规则数据失败:', error)
      notify({ type: 'error', message: '获取规则数据失败' })
    }
  }

  // 获取表格数据
  const getTableData = async () => {
    setLoading(true)
    try {
      // 构造查询参数
      const params = {
        pageNum: 1,
        pageSize: 99999,
        // createBy: JSON.parse(localStorage.getItem('Login-Token') || '{}')?.userId || '',
      }

      const res = await getSafeRuleListApi(params)

      if (res && res.data)
        setTableData(res.data)
      else
        setTableData([])
    }
    catch (error) {
      console.error('获取规则列表失败:', error)
      notify({ type: 'error', message: '获取规则列表失败' })
      setTableData([])
    }
    finally {
      setLoading(false)
    }
  }

  // 在组件初始化时获取智能体规则数据
  useEffect(() => {
    // 获取所有规则
    getTableData()
    // 获取智能体规则数据
    if (appId)
      getAgentRules()
  }, [appId])

  // 添加删除规则的处理函数
  const handleDeleteRule = (id: string) => {
    setSelectedRules(selectedRules.filter(rule => rule.id !== id))
  }

  const handleOpenRulesSelectModal = () => {
    setRulesSelectVisible(true)
  }

  const { data: codeBasedExtensionList } = useSWR(
    '/code-based-extension?module=moderation',
    fetchCodeBasedExtensionList,
  )
  const openaiProvider = modelProviders?.data.find(item => item.provider === 'openai')
  const systemOpenaiProviderEnabled = openaiProvider?.system_configuration.enabled
  const systemOpenaiProviderQuota = systemOpenaiProviderEnabled ? openaiProvider?.system_configuration.quota_configurations.find(item => item.quota_type === openaiProvider.system_configuration.current_quota_type) : undefined
  const systemOpenaiProviderCanUse = systemOpenaiProviderQuota?.is_valid
  const customOpenaiProvidersCanUse = openaiProvider?.custom_configuration.status === CustomConfigurationStatusEnum.active
  const isOpenAIProviderConfigured = customOpenaiProvidersCanUse || systemOpenaiProviderCanUse
  const ruleMatchWayList: Provider[] = [
    {
      key: 'all',
      name: t('appDebug.feature.moderation.modal.matchAllRule'),
    },
    {
      key: 'demand',
      name: t('appDebug.feature.moderation.modal.matchDemandRule'),
    },
  ]

  const currentProvider = ruleMatchWayList.find(provider => provider.key === localeData.type)

  const handleDataTypeChange = (type: string) => {
    setRuleMatchWay(type)
  }

  // 选中规则
  const handleSaveRules = (list: Rule[]) => {
    setSelectedRules(list)
  }

  const formatData = (originData: ModerationConfig) => {
    const { enabled, type, config } = originData
    const { inputs_config, outputs_config } = config!
    const params: Record<string, string | undefined> = {}

    if (type === 'keywords')
      params.keywords = config?.keywords

    if (type === 'api')
      params.api_based_extension_id = config?.api_based_extension_id

    if (systemTypes.findIndex(t => t === type) < 0 && currentProvider?.form_schema) {
      currentProvider.form_schema.forEach((form) => {
        params[form.variable] = config?.[form.variable]
      })
    }

    return {
      type,
      enabled,
      config: {
        inputs_config: inputs_config || { enabled: false },
        outputs_config: outputs_config || { enabled: false },
        ...params,
      },
    }
  }

  // 监听 localeData 变化，当 shouldSave 为 true 时执行 onSave
  useEffect(() => {
    if (shouldSave && localeData) {
      onSave(formatData(localeData))
      setShouldSave(false) // 重置标志
    }
  }, [localeData, shouldSave])

  const handleSave = async () => {
    if (!ruleMatchWay)
      return notify({ type: 'warning', message: '请选择配置' })

    if (ruleMatchWay === 'demand' && selectedRules.length === 0)
      return notify({ type: 'warning', message: '请选择至少一条规则' })

    // 保存智能体对应的规则
    let saveData: any = {
      appId,
      content: ruleMatchWay === 'all' ? 0 : selectedRules.map(rule => rule.id).join(','),
    }
    if (agentRulesData?.id)
      saveData.id = agentRulesData?.id

    try {
      const res = await saveAppRulesApi(saveData)
      console.log('保存规则结果:', res)
    }
    catch (error) {
      console.error('保存规则失败:', error)
      notify({ type: 'error', message: '保存规则失败' })
      return
    }
    // console.log('保存的规则数据:', saveData, localeData)
    // 保存配置到缓存中
    setLocaleData({
      ...localeData,
      config: {
        ...localeData.config,
        keywords: ruleMatchWay === 'all' ? tableData.map(rule => rule.ruleContent).join('\n') : selectedRules.map(rule => rule.ruleContent).join('\n'),
        inputs_config: {
          enabled: true,
          preset_response: '你的问题不符合要求，请重新提问',
        },
        outputs_config: {
          enabled: false,
          preset_response: '',
        },
      },
    })
    // 设置标志，表示需要保存
    setShouldSave(true)

    // onSave(formatData(localeData))
  }

  return (
    <Modal
      isShow
      onClose={() => { }}
      className='!p-6 !mt-14 !max-w-none !w-[600px]'
    >
      <div className='flex items-center justify-between'>
        <div className='text-text-primary title-2xl-semi-bold'>{t('appDebug.feature.moderation.modal.title')}</div>
        <div className='p-1 cursor-pointer' onClick={onCancel}><RiCloseLine className='w-4 h-4 text-text-tertiary'/></div>
      </div>
      <div className='py-2'>
        <div className='leading-9 text-sm font-medium text-gray-900 flex items-center justify-between'>
          {t('appDebug.feature.moderation.modal.matchRule')}
          <Button
            variant='primary'
            className='min-w-24'
            onClick={() => setCreateRuleVisible(true)}
          >
            <RiAddLine className='mr-1 h-3.5 w-3.5' />
            {t('appDebug.feature.moderation.modal.addRule')}
          </Button>
        </div>
        <div className='grid gap-2.5 grid-cols-3'>
          {
            ruleMatchWayList.map(way => (
              <div
                key={way.key}
                className={`
                  flex items-center px-3 py-2 rounded-lg text-sm text-gray-900 cursor-pointer
                  ${ruleMatchWay === way.key ? 'bg-white border-[1.5px] border-primary-400 shadow-sm' : 'border border-gray-100 bg-gray-25'}
                  }
                `}
                onClick={() => handleDataTypeChange(way.key)}
              >
                <div className={`
                  mr-2 w-4 h-4 rounded-full border
                  ${ruleMatchWay === way.key ? 'border-[5px] border-primary-600' : 'border border-gray-300'}`} />
                {way.name}
              </div>
            ))
          }
        </div>
      </div>
      {
        ruleMatchWay === 'demand' && (
          <div className='py-2'>
            <div className='relative px-3 py-2 h-[88px] bg-gray-100 rounded-lg cursor-pointer' onClick={handleOpenRulesSelectModal}>
              <div className='flex flex-wrap gap-2'>
                {selectedRules.map(rule => (
                  <div
                    key={rule.id} onClick={(event: React.MouseEvent<HTMLDivElement>) => {
                      event.stopPropagation()
                    }}
                    className='inline-flex items-center gap-1 px-2 py-1 bg-white rounded-md' 
                  >
                    <span className='text-sm text-gray-700'>{rule.ruleName}</span>
                    <button
                      className='p-0.5 hover:bg-gray-100 rounded-full'
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <RiCloseLine className='w-3.5 h-3.5 text-gray-400' />
                    </button>
                  </div>
                ))}
              </div>
              {/* <div
                className='absolute right-3 top-2 cursor-pointer'
                onClick={handleOpenRulesSelectModal}
              >
                <RiAddLine className='w-4 h-4 text-primary-600' />
              </div> */}
            </div>
          </div>
        )
      }
      <div className='my-3 h-[1px] bg-gradient-to-r from-[#F3F4F6]'></div>

      <div className='flex items-center justify-end'>
        <Button
          onClick={onCancel}
          className='mr-2'
        >
          {t('common.operation.cancel')}
        </Button>
        <Button
          variant='primary'
          onClick={handleSave}
        >
          {t('common.operation.save')}
        </Button>
      </div>
      { rulesSelectVisible && (
        <RulesSelectModal
          selectedRuleList={selectedRules}
          onCancel={() => setRulesSelectVisible(false)}
          onConfirm={handleSaveRules}
        />
      )}
      {/* 添加创建规则弹框 */}
      {createRuleVisible && (
        <CreateRuleModal
          onCancel={() => setCreateRuleVisible(false)}
          onConfirm={() => setCreateRuleVisible(false)}
        />
      )}
    </Modal>
  )
}

export default ContentReviewSettingModal
