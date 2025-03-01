import { PropsWithChildren, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  closeModal: () => void
  title?: string
}

function Modal({ children, closeModal, title }: PropsWithChildren<ModalProps>) {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal()
      }
    }
    window.addEventListener('keydown', handleEsc)

    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'auto'
    }
  }, [closeModal])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90" onClick={closeModal}>
      <div
        className="relative flex w-1/2 flex-col items-center rounded-lg bg-white p-6 shadow-lg lg:w-1/3"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="mb-4 text-xl font-bold">{title}</h2>}
        {children}
        <button
          onClick={closeModal}
          className="absolute right-2 top-2 text-2xl text-gray-500 hover:text-mustard"
          aria-label="Close modal"
        >
          &#10006;
        </button>
      </div>
    </div>,
    document.body
  )
}

export default Modal
