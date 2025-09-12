import { useState } from 'react'
import dayjs from 'dayjs'
import { useCompany } from '../contexts/CompanyContext'
import { employeeService } from '../services/employeeService'
import LoadingSpinner from '../components/common/LoadingSpinner'

const AttendanceReportPage = () => {
  const { departments } = useCompany()

  const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'))
  const [endDate, setEndDate] = useState(dayjs().endOf('month').format('YYYY-MM-DD'))
  const [departmentId, setDepartmentId] = useState<number | ''>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const buffer = await employeeService.getAttendanceReport(
        startDate,
        endDate,
        departmentId ? Number(departmentId) : undefined
      )

      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance-report-${startDate}-to-${endDate}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      setError('Kunne ikke hente rapporten')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-bold text-gray-800">Download fremmøderapport</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Start Date */}
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

        {/* End Date */}
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

      {/* Department filter */}
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

      {/* Download Button */}
      <div>
        <button
          onClick={handleDownload}
          disabled={isLoading}
          className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Genererer...' : 'Download rapport'}
        </button>
      </div>

      {isLoading && <LoadingSpinner message="Genererer rapport..." />}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  )
}

export default AttendanceReportPage
