// pages/SettingsPage.tsx
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useDepartments } from '../hooks/useDepartments'
import { useEmployeeTypes } from '../hooks/useEmployeeTypes'
import { useDepartmentMutations } from '../hooks/useDepartmentMutations'
import { useEmployeeTypeMutations } from '../hooks/useEmployeeTypeMutations'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'

type ConfirmDelete = { kind: 'dep'; id: number; name: string } | { kind: 'type'; id: number; name: string }

const SettingsPage = () => {
  const { companyId } = useAuth()

  const { data: departments = [], isLoading: depLoading } = useDepartments(companyId)
  const { data: employeeTypes = [], isLoading: typeLoading } = useEmployeeTypes(companyId)

  const depMut = useDepartmentMutations(companyId)
  const typeMut = useEmployeeTypeMutations(companyId)

  const [newDep, setNewDep] = useState('')
  const [newType, setNewType] = useState('')
  const [editingDepId, setEditingDepId] = useState<number | null>(null)
  const [editingDepName, setEditingDepName] = useState('')
  const [editingTypeId, setEditingTypeId] = useState<number | null>(null)
  const [editingTypeName, setEditingTypeName] = useState('')

  // confirm modal
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDelete | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  const busy = depLoading || typeLoading

  async function handleConfirmDelete() {
    if (!confirmDelete) return
    setIsConfirming(true)
    try {
      if (confirmDelete.kind === 'dep') {
        await depMut.remove.mutateAsync(confirmDelete.id)
      } else {
        await typeMut.remove.mutateAsync(confirmDelete.id)
      }
      setConfirmDelete(null)
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <h1 className="text-2xl font-bold text-gray-800">Indstillinger</h1>

      {busy && <LoadingSpinner message="Indlæser..." />}

      {/* Departments */}
      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Afdelinger</h2>

        <div className="mb-3 flex gap-2">
          <input
            className="w-full rounded-md border px-3 py-2"
            placeholder="Ny afdeling…"
            value={newDep}
            onChange={(e) => setNewDep(e.target.value)}
          />
          <button
            className="rounded-md bg-green-600 px-3 py-2 text-white disabled:opacity-50"
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
                    className="rounded-md bg-green-600 px-3 py-2 text-white disabled:opacity-50"
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
                  <button className="rounded-md bg-gray-200 px-3 py-2" onClick={() => setEditingDepId(null)}>
                    Annuller
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-gray-800">{d.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-white"
                      onClick={() => {
                        setEditingDepId(d.id)
                        setEditingDepName(d.name)
                      }}
                    >
                      Rediger
                    </button>
                    <button
                      className="rounded-md bg-red-600 px-3 py-1.5 text-white"
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
      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Medarbejdertyper</h2>

        <div className="mb-3 flex gap-2">
          <input
            className="w-full rounded-md border px-3 py-2"
            placeholder="Ny medarbejdertype…"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
          />
          <button
            className="rounded-md bg-green-600 px-3 py-2 text-white disabled:opacity-50"
            onClick={() => newType.trim() && typeMut.create.mutate(newType.trim(), { onSuccess: () => setNewType('') })}
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
                    className="rounded-md bg-green-600 px-3 py-2 text-white disabled:opacity-50"
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
                  <button className="rounded-md bg-gray-200 px-3 py-2" onClick={() => setEditingTypeId(null)}>
                    Annuller
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-gray-800">{t.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-white"
                      onClick={() => {
                        setEditingTypeId(t.id)
                        setEditingTypeName(t.name)
                      }}
                    >
                      Rediger
                    </button>
                    <button
                      className="rounded-md bg-red-600 px-3 py-1.5 text-white"
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

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <Modal
          title={confirmDelete.kind === 'dep' ? 'Slet afdeling' : 'Slet medarbejdertype'}
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
