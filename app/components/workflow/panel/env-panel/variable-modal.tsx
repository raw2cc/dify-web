import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { v4 as uuid4 } from 'uuid'
import { RiCloseLine } from '@remixicon/react'
import { useContext } from 'use-context-selector'
import Button from '@/app/components/base/button'
import Input from '@/app/components/base/input'
import Tooltip from '@/app/components/base/tooltip'
import { ToastContext } from '@/app/components/base/toast'
import VariableTypeSelector from '@/app/components/workflow/panel/chat-variable-panel/components/variable-type-select'
import { useStore } from '@/app/components/workflow/store'
import { ChatVarType } from '@/app/components/workflow/panel/chat-variable-panel/type'
import type { EnvironmentVariable } from '@/app/components/workflow/types'
import cn from '@/utils/classnames'
import { checkKeys } from '@/utils/var'

export type ModalPropsType = {
  env?: EnvironmentVariable
  onClose: () => void
  onSave: (env: EnvironmentVariable) => void
}
const VariableModal = ({
  env,
  onClose,
  onSave,
}: ModalPropsType) => {
  const { t } = useTranslation()
  const { notify } = useContext(ToastContext)
  const envList = useStore(s => s.environmentVariables)
  const envSecrets = useStore(s => s.envSecrets)
  const [type, setType] = React.useState<'string' | 'number' | 'secret'>('string')
  const [name, setName] = React.useState('')
  const [value, setValue] = React.useState<any>()

  const checkVariableName = (value: string) => {
    const { isValid, errorMessageKey } = checkKeys([value], false)
    if (!isValid) {
      notify({
        type: 'error',
        message: t(`appDebug.varKeyError.${errorMessageKey}`, { key: t('workflow.env.modal.name') }),
      })
      return false
    }
    return true
  }

  const handleSave = () => {
    if (!checkVariableName(name))
      return
    if (!value)
      return notify({ type: 'error', message: '值不能为空' })
    if (!env && envList.some(env => env.name === name))
      return notify({ type: 'error', message: '名称已存在' })
    onSave({
      id: env ? env.id : uuid4(),
      value_type: type,
      name,
      value: type === 'number' ? Number(value) : value,
    })
    onClose()
  }

  // 下拉选中事件
  const handleTypeChange = (v: any) => {
    // setValue(undefined)
    if (v === ChatVarType.Number) {
      if (!(/^[0-9]$/).test(value))
        setValue('')
    }
    setType(v)
  }

  const typeList = [
    ChatVarType.String,
    ChatVarType.Number,
    ChatVarType.Secret,
  ]

  useEffect(() => {
    if (env) {
      setType(env.value_type)
      setName(env.name)
      setValue(env.value_type === 'secret' ? envSecrets[env.id] : env.value)
    }
  }, [env, envSecrets])

  return (
    <div
      className={cn('flex flex-col w-[360px] bg-components-panel-bg rounded-2xl h-full border-[0.5px] border-components-panel-border shadow-2xl')}
    >
      <div className='shrink-0 flex items-center justify-between mb-3 p-4 pb-0 text-text-primary system-xl-semibold'>
        {!env ? t('workflow.env.modal.title') : t('workflow.env.modal.editTitle')}
        <div className='flex items-center'>
          <div
            className='flex items-center justify-center w-6 h-6 cursor-pointer'
            onClick={onClose}
          >
            <RiCloseLine className='w-4 h-4 text-text-tertiary' />
          </div>
        </div>
      </div>
      <div className='px-4 py-2'>
        {/* name */}
        <div className='mb-4 flex items-center gap-2.5'>
          <div className='mb-1 h-6 flex items-center text-text-secondary system-sm-semibold'>{t('workflow.env.modal.name')}</div>
          <div className='flex flex-1'>
            <Input
              placeholder={t('workflow.env.modal.namePlaceholder') || ''}
              value={name}
              onChange={e => setName(e.target.value || '')}
              onBlur={e => checkVariableName(e.target.value)}
              type='text'
            />
          </div>
        </div>
        {/* type */}
        <div className='mb-4 flex items-center gap-2.5'>
          <div className='mb-1 h-6 flex items-center text-text-secondary system-sm-semibold'>{t('workflow.env.modal.type')}</div>
          <div className='flex flex-1'>
            <VariableTypeSelector
              value={type}
              list={typeList}
              onSelect={handleTypeChange}
              popupClassName='w-[290px]'
            />
          </div>
          <div className='flex gap-2 hidden'>
            <div className={cn(
              'w-[106px] flex items-center justify-center p-2 radius-md bg-components-option-card-option-bg border border-components-option-card-option-border text-text-secondary system-sm-regular cursor-pointer hover:shadow-xs hover:bg-components-option-card-option-bg-hover hover:border-components-option-card-option-border-hover',
              type === 'string' && 'text-text-primary system-sm-medium border-[1.5px] shadow-xs bg-components-option-card-option-selected-bg border-components-option-card-option-selected-border hover:border-components-option-card-option-selected-border',
            )} onClick={() => setType('string')}>字符串</div>
            <div className={cn(
              'w-[106px] flex items-center justify-center p-2 radius-md bg-components-option-card-option-bg border border-components-option-card-option-border text-text-secondary system-sm-regular cursor-pointer hover:shadow-xs hover:bg-components-option-card-option-bg-hover hover:border-components-option-card-option-border-hover',
              type === 'number' && 'text-text-primary font-medium border-[1.5px] shadow-xs bg-components-option-card-option-selected-bg border-components-option-card-option-selected-border hover:border-components-option-card-option-selected-border',
            )} onClick={() => {
              setType('number')
              if (!(/^[0-9]$/).test(value))
                setValue('')
            }}>数字</div>
            <div className={cn(
              'w-[106px] flex items-center justify-center p-2 radius-md bg-components-option-card-option-bg border border-components-option-card-option-border text-text-secondary system-sm-regular cursor-pointer hover:shadow-xs hover:bg-components-option-card-option-bg-hover hover:border-components-option-card-option-border-hover',
              type === 'secret' && 'text-text-primary font-medium border-[1.5px] shadow-xs bg-components-option-card-option-selected-bg border-components-option-card-option-selected-border hover:border-components-option-card-option-selected-border',
            )} onClick={() => setType('secret')}>
              <span>敏感信息</span>
              {false && <Tooltip
                popupContent={
                  <div className='w-[240px]'>
                    {t('workflow.env.modal.secretTip')}
                  </div>
                }
                triggerClassName='ml-0.5 w-3.5 h-3.5'
              />}
            </div>
          </div>
        </div>
        {/* value */}
        <div className='flex items-center gap-2.5'>
          <div className='mb-1 h-6 flex items-center text-text-secondary system-sm-semibold w-[26px] justify-end'>{t('workflow.env.modal.value')}</div>
          <div className='flex flex-1'>
            <Input
              placeholder={t('workflow.env.modal.valuePlaceholder') || ''}
              value={value}
              onChange={e => setValue(e.target.value)}
              type={type !== 'number' ? 'text' : 'number'}
            />
          </div>
        </div>
      </div>
      <div className='p-4 pt-2 flex flex-row-reverse rounded-b-2xl'>
        <div className='flex gap-2'>
          <Button onClick={onClose}>{t('common.operation.cancel')}</Button>
          <Button variant='primary' onClick={handleSave}>{t('common.operation.save')}</Button>
        </div>
      </div>
    </div>
  )
}

export default VariableModal
