'use client'
import type {FC} from 'react'
import React, {useCallback} from 'react'
import useSWR from 'swr'
import produce from 'immer'
import {useTranslation} from 'react-i18next'
import type {UploadFileSetting} from '../../../types'
import {SupportUploadFileTypes} from '../../../types'
import FileTypeItem from './file-type-item'
import InputNumberWithSlider from './input-number-with-slider'
import Field from '@/app/components/app/configuration/config-var/config-modal/field'
import {TransferMethod} from '@/types/app'
import {fetchFileUploadConfig} from '@/service/common'
import {useFileSizeLimit} from '@/app/components/base/file-uploader/hooks'
import {formatFileSize} from '@/utils/format'
import Checkbox from '@/app/components/base/checkbox' // 导入复选框组件

type Props = {
  payload: UploadFileSetting
  isMultiple: boolean
  inFeaturePanel?: boolean
  hideSupportFileType?: boolean
  onChange: (payload: UploadFileSetting) => void
}

const FileUploadSetting: FC<Props> = ({
                                        payload,
                                        isMultiple,
                                        inFeaturePanel = false,
                                        hideSupportFileType = false,
                                        onChange,
                                      }) => {
  const {t} = useTranslation()

  const {
    allowed_file_upload_methods,
    max_length,
    allowed_file_types,
    allowed_file_extensions,
  } = payload
  const {data: fileUploadConfigResponse} = useSWR({url: '/files/upload'}, fetchFileUploadConfig)
  const {
    imgSizeLimit,
    docSizeLimit,
    audioSizeLimit,
    videoSizeLimit,
    maxFileUploadLimit,
  } = useFileSizeLimit(fileUploadConfigResponse)

  const handleSupportFileTypeChange = useCallback((type: SupportUploadFileTypes) => {
    const newPayload = produce(payload, (draft) => {
      if (type === SupportUploadFileTypes.custom) {
        if (!draft.allowed_file_types.includes(SupportUploadFileTypes.custom))
          draft.allowed_file_types = [SupportUploadFileTypes.custom]
        else
          draft.allowed_file_types = draft.allowed_file_types.filter(v => v !== type)
      } else {
        draft.allowed_file_types = draft.allowed_file_types.filter(v => v !== SupportUploadFileTypes.custom)
        if (draft.allowed_file_types.includes(type))
          draft.allowed_file_types = draft.allowed_file_types.filter(v => v !== type)
        else
          draft.allowed_file_types.push(type)
      }
    })
    onChange(newPayload)
  }, [onChange, payload])

  // 修改后的上传方式处理函数
  const handleUploadMethodChange = useCallback((method: TransferMethod) => {
    const newPayload = produce(payload, (draft) => {
      const index = draft.allowed_file_upload_methods.indexOf(method)
      if (index > -1) {
        // 如果已选中，则取消选中
        draft.allowed_file_upload_methods.splice(index, 1)
      } else {
        // 如果未选中，则添加选中
        draft.allowed_file_upload_methods.push(method)
      }
    })
    onChange(newPayload)
  }, [onChange, payload])

  const handleCustomFileTypesChange = useCallback((customFileTypes: string[]) => {
    const newPayload = produce(payload, (draft) => {
      draft.allowed_file_extensions = customFileTypes.map((v) => {
        return v
      })
    })
    onChange(newPayload)
  }, [onChange, payload])

  const handleMaxUploadNumLimitChange = useCallback((value: number) => {
    const newPayload = produce(payload, (draft) => {
      draft.max_length = value
    })
    onChange(newPayload)
  }, [onChange, payload])

  return (
    <div>
      {!inFeaturePanel && (
        <Field
          title={t('appDebug.variableConfig.file.supportFileTypes')}
          desc={t('appDebug.variableConfig.file.fileNote')}
        >
          <div className='space-y-1'>
            {
              [SupportUploadFileTypes.document, SupportUploadFileTypes.image, SupportUploadFileTypes.audio, SupportUploadFileTypes.video].map((type: SupportUploadFileTypes) => (
                <FileTypeItem
                  key={type}
                  type={type as SupportUploadFileTypes.image | SupportUploadFileTypes.document | SupportUploadFileTypes.audio | SupportUploadFileTypes.video}
                  selected={allowed_file_types.includes(type)}
                  onToggle={handleSupportFileTypeChange}
                />
              ))
            }
            <FileTypeItem
              type={SupportUploadFileTypes.custom}
              selected={allowed_file_types.includes(SupportUploadFileTypes.custom)}
              onToggle={handleSupportFileTypeChange}
              customFileTypes={allowed_file_extensions}
              onCustomFileTypesChange={handleCustomFileTypesChange}
            />
          </div>
        </Field>
      )}
      {/*<Field*/}
      {/*  title={t('appDebug.variableConfig.uploadFileTypes')}*/}
      {/*  className='mt-4'*/}
      {/*>*/}
      {/*  /!* 改为复选框形式 *!/*/}
      {/*  <div className='flex flex-row space-x-4'>*/}
      {/*    <div className='flex w-1/2'>*/}
      {/*      <Checkbox*/}
      {/*        checked={allowed_file_upload_methods.includes(TransferMethod.local_file)}*/}
      {/*        onCheck={() => handleUploadMethodChange(TransferMethod.local_file)}*/}
      {/*      />*/}
      {/*      <span className='ml-2 text-sm text-gray-700'>{t('appDebug.variableConfig.localUpload')}</span>*/}
      {/*    </div>*/}
      {/*    <div className='flex w-1/2'>*/}
      {/*      <Checkbox*/}
      {/*        checked={allowed_file_upload_methods.includes(TransferMethod.remote_url)}*/}
      {/*        onCheck={() => handleUploadMethodChange(TransferMethod.remote_url)}*/}
      {/*      />*/}
      {/*      <span className='ml-2 text-sm text-gray-700'>URL</span>*/}
      {/*    </div>*/}
      {/*  </div>*/}
      {/*</Field>*/}
      {inFeaturePanel && !hideSupportFileType && (
        <Field
          title={t('appDebug.variableConfig.file.supportFileTypes')}
          desc={t('appDebug.variableConfig.file.fileNote')}
          className='mt-4'
        >
          <div className='space-y-1'>
            {
              [SupportUploadFileTypes.document, SupportUploadFileTypes.image, SupportUploadFileTypes.audio, SupportUploadFileTypes.video].map((type: SupportUploadFileTypes) => (
                <FileTypeItem
                  key={type}
                  type={type as SupportUploadFileTypes.image | SupportUploadFileTypes.document | SupportUploadFileTypes.audio | SupportUploadFileTypes.video}
                  selected={allowed_file_types.includes(type)}
                  onToggle={handleSupportFileTypeChange}
                />
              ))
            }
            <FileTypeItem
              type={SupportUploadFileTypes.custom}
              selected={allowed_file_types.includes(SupportUploadFileTypes.custom)}
              onToggle={handleSupportFileTypeChange}
              customFileTypes={allowed_file_extensions}
              onCustomFileTypesChange={handleCustomFileTypesChange}
            />
          </div>
        </Field>
      )}
      {isMultiple && (
        <Field
          className='mt-4'
          title={t('appDebug.variableConfig.maxNumberOfUploads')!}
        >
          <div>
            <div className='mb-1.5 text-text-tertiary body-xs-regular'>{t('appDebug.variableConfig.maxNumberTip', {
              imgLimit: formatFileSize(imgSizeLimit),
              docLimit: formatFileSize(docSizeLimit),
              audioLimit: formatFileSize(audioSizeLimit),
              videoLimit: formatFileSize(videoSizeLimit),
            })}</div>

            <InputNumberWithSlider
              value={max_length}
              min={1}
              max={maxFileUploadLimit}
              onChange={handleMaxUploadNumLimitChange}
            />
          </div>
        </Field>
      )}
    </div>
  )
}
export default React.memo(FileUploadSetting)
