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

  const spinner = (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`${sizeMap[size]} border-4 border-gray-300 border-t-4 rounded-full animate-spin`}
        style={{ borderTopColor: color }}
      />
      {message && <p className="mt-4 text-gray-600">{message}</p>}
    </div>
  )

  if (fullScreen) {
    return <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">{spinner}</div>
  }

  return spinner
}

export default LoadingSpinner
