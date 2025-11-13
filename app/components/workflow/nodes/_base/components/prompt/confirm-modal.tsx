import type { FC, ReactNode } from 'react'
import React from 'react'
import { RiCloseLine, RiDeleteBinLine } from '@remixicon/react'
import Modal from '@/app/components/base/modal'
import Button from '@/app/components/base/button'
import cn from '@/utils/classnames'

type ConfirmModalProps = {
  value?: boolean
  title?: string
  type?: 'error' | 'success' | 'warning' | 'info' | 'primary'
  tip?: {
    icon?: string
    text?: string
  }
  info?: {
    name?: string
    status?: {
      type: string
      text: string
    }
    tags?: Array<{ name: string }>
    [key: string]: any
  }
  width?: string | number
  successCallback?: () => void
  loading?: boolean
  onChange?: (value: boolean) => void
  onCancel?: () => void
  onOk?: () => void
  children?: ReactNode
  header?: ReactNode
  subTitle?: ReactNode
  tags?: ReactNode
  moreContent?: ReactNode
}

const ConfirmModal: FC<ConfirmModalProps> = ({
  title = '确认弹窗',
  type = 'error',
  tip = { icon: '', text: '' },
  info = {},
  width = '600px',
  successCallback,
  loading = false,
  onChange,
  onCancel,
  onOk,
  children,
  header,
  subTitle,
  tags,
  moreContent,
}) => {
  const handleCancel = () => {
    onChange?.(false)
    onCancel?.()
  }

  const handleOk = () => {
    if (successCallback)
      successCallback()

    onOk?.()
  }

  // 获取状态样式类名
  const getStatusClassName = (statusType?: string) => {
    const baseClass = 'info-status'
    if (!statusType)
      return baseClass

    return `${baseClass} status-${statusType}`
  }

  // 渲染标签
  const renderTags = () => {
    if (tags)
      return tags

    if (info.tags && info.tags.length > 0) {
      return (
        <div className="info-label">
          {info.tags.map((tag, index) => (
            <span key={`tag_${index}`} className="label-item">
              {tag.name}
            </span>
          ))}
        </div>
      )
    }

    return null
  }

  return (
    <Modal
      isShow
      onClose={handleCancel}
      className="custom-modal-wrap !p-0 !mt-14 !max-w-none !w-[600px]"
      // style={{ width }}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="text-xl font-semibold text-gray-900">{title}</div>
        <div
          className="p-1 cursor-pointer hover:bg-gray-100 rounded"
          onClick={handleCancel}
        >
          <RiCloseLine className="w-4 h-4 text-gray-500" />
        </div>
      </div>
      <div className="p-4">
        <div className="py-3 px-4 rounded-lg bg-[#f6f7fa]">
          <div className="info-header">
            { header || (
              <div className="info-title-wrap">
                <p className="font-bold text-[16px] text-[#0A152B]">{info.name}</p>
                {subTitle && <p className="text-[12px] text-[#667085]">{subTitle}</p>}
                {!subTitle && info.status && typeof info.status === 'object' && (
                  <div className={getStatusClassName(info.status.type)}>
                    {info.status.text}
                  </div>
                )}
              </div>
            )}
          </div>

          {renderTags()}

          {moreContent || children}
        </div>

        <div className={cn('mt-5 flex items-center px-4 py-3 rounded-lg text-sm',
          `${type} === 'success` && 'bg-[#e6f9ef] text-[#08CB5F]',
          `${type} === 'error` && 'bg-[#feebed] text-[#fa3e4f]',
        )}>
          {`${type} === 'error` && (
            <div
              className='p-1 radius-md cursor-pointer text-red-400'>
              <RiDeleteBinLine className='w-4 h-4'/>
            </div>
          )}
          {tip.text || '是否要进行该操作？'}
        </div>

        <div className="flex justify-end px-6 pt-4 border-t border-gray-100">
          <Button onClick={handleCancel} className="mr-2 min-w-24">取 消</Button>
          <Button
            variant="primary"
            onClick={handleOk}
            className="min-w-24"
            loading={loading}
          >
            确 认
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmModal
