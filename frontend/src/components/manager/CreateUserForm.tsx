import UserForm, { UserFormValues } from './UserForm'
import { toast } from 'react-toastify'
import { Role } from 'shared'
import { authService } from '../../services/authService'

interface CreateManagerProps {
  onSuccess: () => void
}

const CreateUserComponent = ({ onSuccess }: CreateManagerProps) => {
  const initial: UserFormValues = {
    email: '',
    username: '',
    password: '',
    shouldChangePassword: true,
    userRole: Role.MANAGER,
  }

  const handleSubmit = async (v: UserFormValues) => {
    if (!v.password) {
      toast.error('Adgangskode er påkrævet for en ny bruger.')
      return
    }

    let email: string | undefined = v.email
    if (!v.email) {
      email = undefined
    }

    await toast.promise(authService.register(email, v.password, v.username, v.shouldChangePassword, v.userRole), {
      success: 'Bruger oprettet',
      error: 'Fejl ved oprettelse af bruger',
    })
    onSuccess()
  }

  return <UserForm initialValues={initial} onSubmit={handleSubmit} submitLabel="Opret Bruger" onCancel={onSuccess} />
}

export default CreateUserComponent
