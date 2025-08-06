import { useState } from 'react'
import { AttendanceRecord } from 'shared'
import { useToast } from '../../contexts/ToastContext'
import { employeeService } from '../../services/employeeService'
import dayjs from 'dayjs'

interface Props {
  record: AttendanceRecord
  onSuccess: () => void
  onCancel: () => void
}

const EditAttendanceForm = ({ record, onSuccess, onCancel }: Props) => {
  const { showToast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [checkIn, setCheckIn] = useState(dayjs(record.checkIn).format('YYYY-MM-DDTHH:mm'))
  const [checkOut, setCheckOut] = useState(record.checkOut ? dayjs(record.checkOut).format('YYYY-MM-DDTHH:mm') : '')

  const isOpenRecord = !record.checkOut

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      if (!checkIn) {
        showToast('Check ind skal udfyldes', 'warning')
        return
      }

      const checkInDate = new Date(checkIn)
      const checkOutDate = new Date(checkOut)

      if (checkOutDate && checkOutDate < checkInDate) {
        showToast('Check ud kan ikke være før check ind', 'warning')
        return
      }

      await employeeService.updateAttendanceRecord(record.id, {
        checkIn: checkInDate,
        checkOut: checkOutDate,
        autoClosed: false,
      })

      showToast('Tidsregistrering opdateret', 'success')
      onSuccess()
    } catch (err) {
      console.error(err)
      showToast('Fejl ved opdatering af registrering', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = window.confirm('Er du sikker på, at du vil slette denne registrering?')
    if (!confirmed) return

    setIsDeleting(true)
    try {
      await employeeService.deleteAttendanceRecord(record.id)
      showToast('Tidsregistrering slettet', 'success')
      onSuccess()
    } catch (err) {
      console.error(err)
      showToast('Fejl ved sletning af registrering', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isOpenRecord ? (
        <div className="rounded-md border border-yellow-300 bg-yellow-100 p-4 text-sm text-yellow-800 shadow-sm">
          Denne registrering er stadig åben og kan ikke redigeres, før medarbejderen er tjekket ud.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Check ind</label>
              <input
                type="datetime-local"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Check ud</label>
              <input
                type="datetime-local"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500 italic">Både check ind og check ud skal være gyldige tidsstempler.</p>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="rounded bg-gray-300 px-4 py-2 text-sm hover:bg-gray-400"
            >
              Annuller
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
                className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Sletter...' : 'Slet'}
              </button>

              <button
                type="submit"
                disabled={isSaving || isDeleting}
                className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
              >
                {isSaving ? 'Gemmer...' : 'Gem og godkend'}
              </button>
            </div>
          </div>
        </>
      )}
    </form>
  )
}

export default EditAttendanceForm
