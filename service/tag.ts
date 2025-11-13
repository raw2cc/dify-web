import { del, get, patch, post } from './base'
import type { Tag } from '@/app/components/base/tag-management/constant'

export const fetchTagList = (type: string) => {
  return get<Tag[]>('/tags', { params: { type } })
}

export const createTag = (name: string, type: string) => {
  return post<Tag>('/tags', {
    body: {
      name,
      type,
    },
  })
}

export const updateTag = (tagID: string, name: string) => {
  return patch(`/tags/${tagID}`, {
    body: {
      name,
    },
  })
}

export const deleteTag = (tagID: string) => {
  return del(`/tags/${tagID}`)
}

export const bindTag = (tagIDList: string[], targetID: string, type: string) => {
  return post('/tag-bindings/create', {
    body: {
      tag_ids: tagIDList,
      target_id: targetID,
      type,
    },
  })
}

export const unBindTag = (tagID: string, targetID: string, type: string) => {
  return post('/tag-bindings/remove', {
    body: {
      tag_id: tagID,
      target_id: targetID,
      type,
    },
  })
}

// 获取标签列表
export const getTagsApi = (params: any) => {
  return get<Tag>('/tags', { params })
}

// 新增标签
export const addTagsApi = (data: any) => {
  return post<Tag>('/tags', {
    body: data,
  })
}

// 删除标签
export const deleteTagApi = (data: any) => {
  return post<Tag>('/tags/remove', {
    body: data,
  })
}

// 保存标签对应
export const replaceTagApi = (data: any) => {
  return post<Tag>('/tag-bindings/replace', {
    body: data,
  })
}

// 编辑标签
export const editTagApi = (data: any) => {
  return patch<Tag>(`/tags/${data.id}`, {
    body: data,
  })
}
