'use client'

import { SWRConfig } from 'swr'
import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { fetchSetupStatus } from '@/service/common'
import { AUTH_WAY } from '@/config'

type SwrInitorProps = {
  children: ReactNode
}
const SwrInitor = ({
  children,
}: SwrInitorProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const consoleToken = decodeURIComponent(searchParams.get('access_token') || '')
  const refreshToken = decodeURIComponent(searchParams.get('refresh_token') || '')
  const loginToken = decodeURIComponent(searchParams.get('loginToken') || '')
  const curTenantId = decodeURIComponent(searchParams.get('curTenantId') || '')
  const consoleTokenFromLocalStorage = localStorage?.getItem('console_token')
  const refreshTokenFromLocalStorage = localStorage?.getItem('refresh_token')
  const pathname = usePathname()
  const [init, setInit] = useState(false)

  const isSetupFinished = useCallback(async () => {
    try {
      if (localStorage.getItem('setup_status') === 'finished')
        return true
      const setUpStatus = await fetchSetupStatus()
      if (setUpStatus.step !== 'finished') {
        localStorage.removeItem('setup_status')
        return false
      }
      localStorage.setItem('setup_status', 'finished')
      return true
    }
    catch (error) {
      console.error(error)
      return false
    }
  }, [])

  const signTokenCheck = useCallback(async() => {
     try {
        const isFinished = await isSetupFinished()
        if (!isFinished) {
          router.replace('/install')
          return
        }
        if (!((consoleToken && refreshToken) || (consoleTokenFromLocalStorage && refreshTokenFromLocalStorage))) {
          router.replace('/signin')
          return
        }
        if (searchParams.has('access_token') || searchParams.has('refresh_token')) {
          consoleToken && localStorage.setItem('console_token', consoleToken)
          refreshToken && localStorage.setItem('refresh_token', refreshToken)
          router.replace(pathname)
        }

        setInit(true)
      }
      catch (error) {
        router.replace('/signin')
      }
  }, [])

  useEffect(() => {
    (async () => {
      if (AUTH_WAY === 'SIGN') {
      await signTokenCheck()
      }
      else {
        // 如果是福诺平台使用获取token和curTenantId，在url有拼接时
        loginToken && localStorage.setItem('Login-Token', loginToken)
        curTenantId && localStorage.setItem('curTenantId', curTenantId)
        setInit(true)
      }
    })()
  }, [isSetupFinished, router, pathname, searchParams, consoleToken, refreshToken, consoleTokenFromLocalStorage, refreshTokenFromLocalStorage])

  return init
    ? (
      <SWRConfig value={{
        shouldRetryOnError: false,
        revalidateOnFocus: false,
      }}>
        {children}
      </SWRConfig>
    )
    : null
}

export default SwrInitor
