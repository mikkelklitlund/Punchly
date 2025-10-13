import UserForm, { UserFormValues } from './UserForm'
import { toast } from 'react-toastify'
import { createUserDTO, Role } from 'shared'
import { companyService } from '../../services/companyService'
import { useAuth } from '../../contexts/AuthContext'

interface CreateManagerProps {
  onSuccess: () => void
}

const CreateUserComponent = ({ onSuccess }: CreateManagerProps) => {
  const { companyId } = useAuth()
  const initial: UserFormValues = {
    email: undefined,
    username: '',
    password: '',
    shouldChangePassword: true,
    role: Role.MANAGER,
  }

  const handleSubmit = async (v: UserFormValues) => {
    if (!companyId) {
      toast.error('Der er sket en fejl, log venligst ud og ind igen.')
      return
    }

    if (!v.password) {
      toast.error('Adgangskode er påkrævet for en ny bruger.')
      return
    }

    const dto: createUserDTO = {
      email: v.email ?? null,
      password: v.password,
      role: v.role,
      username: v.username,
      shouldChangePassword: v.shouldChangePassword,
    }

    await toast.promise(companyService.createUser(companyId, dto), {
      success: 'Bruger oprettet',
      error: 'Fejl ved oprettelse af bruger',
    })
    onSuccess()
  }

  return <UserForm initialValues={initial} onSubmit={handleSubmit} submitLabel="Opret Bruger" onCancel={onSuccess} />
}

export default CreateUserComponent
