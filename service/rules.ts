import { get, post } from './base'
import { SAFE_PLATFORM_API_PREFIX, UC_API_PREFIX } from '@/config'

export type PageParams = {
  pageNum?: number
  pageSize?: number
  [key: string]: any
}

export type PageResult<T> = {
  list: T[]
  total: number
  pageNum: number
  pageSize: number
}

export type DictType = {
  dictCode: number
  dictId: number
  dictValue: string
  dictLabel: string
  dictType: string
  status: string
  [key: string]: any
}

export type Rule = {
  id: string
  name: string
  content: string
  type: string
  category: string
  source: string
  creator: string
  createTime: string
  [key: string]: any
}

export type CreateRuleParams = {
  ruleName: string
  ruleContent: string
  ruleType: string
  ruleTypeInfo: string
  rulePlatform: number
  status: number
  [key: string]: any
}

export type AppRuleConfig = {
  appId: string
  ruleIds: string[]
  enabled: boolean
  [key: string]: any
}

// 获取可信规则列表
export const getSafeRuleListApi = (params: PageParams) => {
  // 构建查询字符串
  const queryString = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
  const url = `SAFE_PLATFORM_PREFIX/ruleConfig/pageList${queryString ? `?${queryString}` : ''}`
  return post<PageResult<Rule>>(url, {
    body: {}, // 提供一个空的 body，确保是 POST 请求
  })
}

// 获取uc字典
export const getDictTypeApi = (params: { dictType: string }) => {
  return get<DictType>('UC_API_PREFIX/system/dict/getType', { params })
}

// 新增规则
export const addSafeRuleApi = (data: CreateRuleParams) => {
  return post<Rule>('SAFE_PLATFORM_PREFIX/ruleConfig/save', {
    body: data,
  })
}

// 编辑规则
export const updateSafeRuleApi = (data: Partial<CreateRuleParams> & { id: string }) => {
  return post<Rule>('SAFE_PLATFORM_PREFIX/ruleConfig/upd', {
    body: data,
  })
}

// 删除规则
export const deleteSafeRuleApi = (id: string) => {
  return get(`SAFE_PLATFORM_PREFIX/ruleConfig/delete/${id}`)
}

// 获取智能体的规则
export const getAppRulesApi = (id: string) => {
  return get<AppRuleConfig>(`SAFE_PLATFORM_PREFIX/app-rule-config/detail/${id}`)
}

// 保存或更新智能体的规则配置
export const saveAppRulesApi = (data: AppRuleConfig) => {
  return post<AppRuleConfig>('SAFE_PLATFORM_PREFIX/app-rule-config/saveOrUpdate', {
    body: data,
  })
}
