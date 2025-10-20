import { Role, UserDTO } from 'shared'
import UserForm, { UserFormValues } from './UserForm'
import { toast } from 'react-toastify'
import { companyService } from '../../services/companyService'
import { useAuth } from '../../contexts/AuthContext'

const EditUserForm = ({ user, onSuccess }: { user: UserDTO; onSuccess: () => void }) => {
  const { companyId } = useAuth()
  const initial: UserFormValues = {
    email: user.email ?? '',
    username: user.username,
    password: user.password ?? '',
    shouldChangePassword: user.shouldChangePassword,
    role: user.role ?? Role.COMPANY,
  }

  const submit = async (v: UserFormValues) => {
    if (!companyId) {
      toast.error('Log venligst ud og ind igen, der er sket en uventet fejl')
      return
    }

    const editedUser: UserDTO = {
      id: user.id,
      email: v.email ?? null,
      username: v.username,
      password: v.password ?? null,
      role: v.role,
      shouldChangePassword: v.shouldChangePassword,
    }

    await toast.promise(companyService.updateUser(companyId, editedUser), {
      success: 'Bruger er blevet opdateret',
      error: 'Fejl under opdatering af bruger',
    })

    onSuccess()
  }

  const del = async () => {
    if (!companyId) {
      toast.error('Log venligst ud og ind igen, der er sket en uventet fejl')
      return
    }
    await toast.promise(companyService.deleteUser(companyId, user.id), {
      success: 'Bruger er slettet',
      error: 'Sletning mislykkedes',
    })
  }

  return <UserForm initialValues={initial} onSubmit={submit} submitLabel="Gem" onDelete={del} />
}

export default EditUserForm
