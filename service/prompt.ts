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

export type Tag = {
  bindingCount: number
  createdAt: string
  createdBy: string
  id: string
  name: string
  sortOrder: number | null
  tenantId: string
  type: string
  ucTenantId: number
  [key: string]: any
}

// 编排提示词模版-新增
export const addPromptWordsApi = (data: any) => {
  return post<any>('/doc/inputTemplate/system/add', {
    body: data,
  })
}

// 编排提示词模版-编辑
export const editPromptWordsApi = (data: any) => {
  return post<any>('/doc/inputTemplate/system/edit', {
    body: data,
  })
}

// 编排提示词模版-详情
export const detailPromptWordsApi = (data: { id: string }) => {
  return post<any>('/doc/inputTemplate/system/detail', {
    body: data,
  })
}

// 编排提示词模版-列表
export const getPromptTemplateListApi = (data: any) => {
  return post<any>('/doc/inputTemplate/system/list', {
    body: data,
  })
}

// 提示词删除
export const deletePromptApi = (data: any) => {
  return post<any>('/doc/inputTemplate/system/delete', {
    body: data,
  })
}
