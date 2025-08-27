import { useState } from 'react'
import dayjs from 'dayjs'
import { useCompany } from '../contexts/CompanyContext'
import { employeeService } from '../services/employeeService'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-toastify'

const AttendanceReportPage = () => {
  const { departments } = useCompany()

  const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'))
  const [endDate, setEndDate] = useState(dayjs().endOf('month').format('YYYY-MM-DD'))
  const [departmentId, setDepartmentId] = useState<number | ''>('')

  const reportMutation = useMutation({
    mutationFn: (vars: { start: Date; end: Date; departmentId?: number }) =>
      employeeService.getAttendanceReport(vars.start, vars.end, vars.departmentId),
  })

  const handleDownload = async () => {
    const start = dayjs(startDate)
    const end = dayjs(endDate)

    if (!start.isValid() || !end.isValid()) {
      toast.error('Ugyldige datoer')
      return
    }
    if (end.isBefore(start, 'day')) {
      toast.error('Slutdato må ikke være før startdato')
      return
    }

    try {
      const blob = await toast.promise(
        reportMutation.mutateAsync({
          start: start.toDate(),
          end: end.toDate(),
          departmentId: departmentId ? Number(departmentId) : undefined,
        }),
        {
          error: 'Kunne ikke hente rapporten',
        }
      )

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance-report-${start.format('YYYY-MM-DD')}-to-${end.format('YYYY-MM-DD')}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-bold text-gray-800">Download fremmøderapport</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
            Startdato
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
            Slutdato
          </label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="department" className="block text-sm font-medium text-gray-700">
          Afdeling (valgfri)
        </label>
        <select
          id="department"
          className="mt-1 w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 shadow-sm"
          onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : '')}
          value={departmentId || ''}
        >
          <option value="">-- Alle afdelinger --</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <button
          onClick={handleDownload}
          disabled={reportMutation.isPending}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {reportMutation.isPending && <LoadingSpinner size="small" />}
          {reportMutation.isPending ? 'Genererer...' : 'Download rapport'}
        </button>
      </div>
    </div>
  )
}

export default AttendanceReportPage
