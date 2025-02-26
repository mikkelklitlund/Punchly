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
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={closeModal}>
      <div
        className="bg-white p-6 rounded-lg shadow-lg lg:w-1/3 w-1/2 relative flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="text-xl font-bold mb-4">{title}</h2>}
        {children}
        <button
          onClick={closeModal}
          className="absolute top-2 right-2 text-gray-500 hover:text-mustard text-2xl"
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
