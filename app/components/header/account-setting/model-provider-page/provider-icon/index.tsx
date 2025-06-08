import type { FC } from 'react'
import type { ModelProvider } from '../declarations'
import { useLanguage } from '../hooks'

import { API_PREFIX, AUTH_WAY } from '@/config'

type ProviderIconProps = {
  provider: ModelProvider
  className?: string
}
const ProviderIcon: FC<ProviderIconProps> = ({
  provider,
  className,
}) => {
  const language = useLanguage()
 const baseUrl = AUTH_WAY !== 'SIGN' ? API_PREFIX.replace('/console/api', '') : ''
  if (provider.icon_large) {
    return (
      <img
        alt='provider-icon'
        src={`${baseUrl}${provider.icon_large[language] || provider.icon_large.en_US}`}
        className={`w-auto h-6 ${className}`}
      />
    )
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      <div className='text-xs font-semibold text-black'>
        {provider.label[language] || provider.label.en_US}
      </div>
    </div>
  )
}

export default ProviderIcon
