'use client'
import type {FC} from 'react'
import React from 'react'
import cn from '@/utils/classnames'

type Props = {
  className?: string
  title: string
  desc?: any
  children: JSX.Element
}

const Field: FC<Props> = ({
                            className,
                            title,
                            desc,
                            children,
                          }) => {
  return (
    <div className={cn(className)}>
      <div className='text-text-secondary system-sm-semibold leading-8'>
        <span>{title}</span>
        <span className="text-text-tertiary ml-1">{desc}</span>
      </div>
      <div>{children}</div>
    </div>
  )
}
export default React.memo(Field)
