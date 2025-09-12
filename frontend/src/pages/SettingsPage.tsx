// pages/SettingsPage.tsx
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useDepartments } from '../hooks/useDepartments'
import { useEmployeeTypes } from '../hooks/useEmployeeTypes'
import { useDepartmentMutations } from '../hooks/useDepartmentMutations'
import { useEmployeeTypeMutations } from '../hooks/useEmployeeTypeMutations'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import { useAbsenceTypes } from '../hooks/useAbsenceTypes'
import { useAbsenceTypeMutations } from '../hooks/useAbsenceTypeMutations'

type ConfirmDelete =
  | { kind: 'dep'; id: number; name: string }
  | { kind: 'type'; id: number; name: string }
  | { kind: 'absence'; id: number; name: string }

const SettingsPage = () => {
  const { companyId } = useAuth()

  const { data: departments = [], isLoading: depLoading } = useDepartments(companyId)
  const { data: employeeTypes = [], isLoading: typeLoading } = useEmployeeTypes(companyId)
  const { data: absenceTypes = [], isLoading: absenceLoading } = useAbsenceTypes(companyId)

  const depMut = useDepartmentMutations(companyId)
  const typeMut = useEmployeeTypeMutations(companyId)
  const absenceMut = useAbsenceTypeMutations(companyId)

  const [newDep, setNewDep] = useState('')
  const [newType, setNewType] = useState('')
  const [newAbsence, setNewAbsence] = useState('')

  const [editingDepId, setEditingDepId] = useState<number | null>(null)
  const [editingDepName, setEditingDepName] = useState('')
  const [editingTypeId, setEditingTypeId] = useState<number | null>(null)
  const [editingTypeName, setEditingTypeName] = useState('')
  const [editingAbsenceId, setEditingAbsenceId] = useState<number | null>(null)
  const [editingAbsenceName, setEditingAbsenceName] = useState('')

  // confirm modal
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDelete | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  const busy = depLoading || typeLoading || absenceLoading

  async function handleConfirmDelete() {
    if (!confirmDelete) return
    setIsConfirming(true)
    try {
      if (confirmDelete.kind === 'dep') {
        await depMut.remove.mutateAsync(confirmDelete.id)
      } else if (confirmDelete.kind === 'type') {
        await typeMut.remove.mutateAsync(confirmDelete.id)
      } else {
        await absenceMut.remove.mutateAsync(confirmDelete.id) // NEW
      }
      setConfirmDelete(null)
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <div className="w-fullp-4">
      <h1 className="text-2xl text-gray-800">Indstillinger</h1>

      {busy && <LoadingSpinner message="Indlæser..." />}
      <div className="mt-3 flex flex-wrap gap-5">
        {/* Departments */}
        <section className="min-w-[500px] flex-1 rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Afdelinger</h2>

          <div className="mb-3 flex gap-2">
            <input
              className="w-full rounded-md border px-3 py-2"
              placeholder="Ny afdeling…"
              value={newDep}
              onChange={(e) => setNewDep(e.target.value)}
            />
            <button
              className="btn btn-green"
              onClick={() => newDep.trim() && depMut.create.mutate(newDep.trim(), { onSuccess: () => setNewDep('') })}
              disabled={!newDep.trim() || depMut.create.isPending}
            >
              Opret
            </button>
          </div>

          <ul className="divide-y">
            {departments.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2">
                {editingDepId === d.id ? (
                  <div className="flex w-full items-center gap-2">
                    <input
                      className="w-full rounded-md border px-3 py-2"
                      value={editingDepName}
                      onChange={(e) => setEditingDepName(e.target.value)}
                    />
                    <button
                      className="btn btn-green"
                      onClick={() =>
                        editingDepName.trim() &&
                        depMut.rename.mutate(
                          { id: d.id, name: editingDepName.trim() },
                          { onSuccess: () => setEditingDepId(null) }
                        )
                      }
                      disabled={!editingDepName.trim() || depMut.rename.isPending}
                    >
                      Gem
                    </button>
                    <button className="btn btn-gray" onClick={() => setEditingDepId(null)}>
                      Annuller
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-gray-800">{d.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        className="btn btn-rust"
                        onClick={() => {
                          setEditingDepId(d.id)
                          setEditingDepName(d.name)
                        }}
                      >
                        Rediger
                      </button>
                      <button
                        className="btn btn-red"
                        onClick={() => setConfirmDelete({ kind: 'dep', id: d.id, name: d.name })}
                      >
                        Slet
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Employee Types */}
        <section className="min-w-[500px] flex-1 rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Medarbejdertyper</h2>

          <div className="mb-3 flex gap-2">
            <input
              className="w-full rounded-md border px-3 py-2"
              placeholder="Ny medarbejdertype…"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
            />
            <button
              className="btn btn-green"
              onClick={() =>
                newType.trim() && typeMut.create.mutate(newType.trim(), { onSuccess: () => setNewType('') })
              }
              disabled={!newType.trim() || typeMut.create.isPending}
            >
              Opret
            </button>
          </div>

          <ul className="divide-y">
            {employeeTypes.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2">
                {editingTypeId === t.id ? (
                  <div className="flex w-full items-center gap-2">
                    <input
                      className="w-full rounded-md border px-3 py-2"
                      value={editingTypeName}
                      onChange={(e) => setEditingTypeName(e.target.value)}
                    />
                    <button
                      className="btn btn-green"
                      onClick={() =>
                        editingTypeName.trim() &&
                        typeMut.rename.mutate(
                          { id: t.id, name: editingTypeName.trim() },
                          { onSuccess: () => setEditingTypeId(null) }
                        )
                      }
                      disabled={!editingTypeName.trim() || typeMut.rename.isPending}
                    >
                      Gem
                    </button>
                    <button className="btn btn-gray" onClick={() => setEditingTypeId(null)}>
                      Annuller
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-gray-800">{t.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        className="btn btn-rust"
                        onClick={() => {
                          setEditingTypeId(t.id)
                          setEditingTypeName(t.name)
                        }}
                      >
                        Rediger
                      </button>
                      <button
                        className="btn btn-red"
                        onClick={() => setConfirmDelete({ kind: 'type', id: t.id, name: t.name })}
                      >
                        Slet
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Absence Types */}
        <section className="min-w-[500px] flex-1 rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Fraværstyper</h2>

          <div className="mb-3 flex gap-2">
            <input
              className="w-full rounded-md border px-3 py-2"
              placeholder="Ny fraværstype…"
              value={newAbsence}
              onChange={(e) => setNewAbsence(e.target.value)}
            />
            <button
              className="btn btn-green"
              onClick={() =>
                newAbsence.trim() && absenceMut.create.mutate(newAbsence.trim(), { onSuccess: () => setNewAbsence('') })
              }
              disabled={!newAbsence.trim() || absenceMut.create.isPending}
            >
              Opret
            </button>
          </div>

          <ul className="divide-y">
            {absenceTypes.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2">
                {editingAbsenceId === a.id ? (
                  <div className="flex w-full items-center gap-2">
                    <input
                      className="w-full rounded-md border px-3 py-2"
                      value={editingAbsenceName}
                      onChange={(e) => setEditingAbsenceName(e.target.value)}
                    />
                    <button
                      className="btn btn-green"
                      onClick={() =>
                        editingAbsenceName.trim() &&
                        absenceMut.rename.mutate(
                          { id: a.id, name: editingAbsenceName.trim() },
                          { onSuccess: () => setEditingAbsenceId(null) }
                        )
                      }
                      disabled={!editingAbsenceName.trim() || absenceMut.rename.isPending}
                    >
                      Gem
                    </button>
                    <button className="btn btn-gray" onClick={() => setEditingAbsenceId(null)}>
                      Annuller
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-gray-800">{a.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        className="btn btn-rust"
                        onClick={() => {
                          setEditingAbsenceId(a.id)
                          setEditingAbsenceName(a.name)
                        }}
                      >
                        Rediger
                      </button>
                      <button
                        className="btn btn-red"
                        onClick={() => setConfirmDelete({ kind: 'absence', id: a.id, name: a.name })}
                      >
                        Slet
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <Modal
          title={
            confirmDelete.kind === 'dep'
              ? 'Slet afdeling'
              : confirmDelete.kind === 'type'
                ? 'Slet medarbejdertype'
                : 'Slet fraværstype'
          }
          closeModal={() => (isConfirming ? null : setConfirmDelete(null))}
        >
          <p className="mb-6 text-center">
            Er du sikker på, at du vil slette <span className="font-semibold">&quot;{confirmDelete.name}&quot;</span>?
          </p>
          <div className="flex w-full justify-end gap-2">
            <button
              className="rounded-md bg-gray-200 px-4 py-2 disabled:opacity-50"
              onClick={() => setConfirmDelete(null)}
              disabled={isConfirming}
            >
              Annuller
            </button>
            <button
              className="rounded-md bg-red-600 px-4 py-2 text-white disabled:opacity-50"
              onClick={handleConfirmDelete}
              disabled={isConfirming}
            >
              {isConfirming ? 'Sletter…' : 'Slet'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default SettingsPage
