import React from 'react'

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  color?: string
  fullScreen?: boolean
  message?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = '#FFC72C',
  fullScreen = false,
  message,
}) => {
  const sizeMap = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16',
  }

  const borderMap = {
    small: 'border-2',
    medium: 'border-4',
    large: 'border-4',
  }

  const spinner = (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`${sizeMap[size]} animate-spin rounded-full ${borderMap[size]} border-gray-300`}
        style={{ borderTopColor: color }}
      />
      {message && <p className="text-gray-600">{message}</p>}
    </div>
  )

  if (fullScreen) {
    return <div className="bg-opacity-80 fixed inset-0 z-50 flex items-center justify-center bg-white">{spinner}</div>
  }

  return spinner
}

export default LoadingSpinner
