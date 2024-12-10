import { PropsWithChildren } from 'react'

interface ModalProps {
  closeModal: () => void
}

function EmployeeCard({ children, closeModal }: PropsWithChildren<ModalProps>) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={closeModal}>
      <div
        className="bg-white p-6 rounded-lg shadow-lg lg:w-1/3 w-1/2 relative flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        <button onClick={closeModal} className="absolute top-0 right-2 text-gray-500 hover:text-mustard text-2xl">
          &#10006;
        </button>
      </div>
    </div>
  )
}

export default EmployeeCard
