import { Role } from 'shared'

export const roleTranslationMap: Record<Role, string> = {
  [Role.COMPANY]: 'Fælles',
  [Role.MANAGER]: 'Leder',
  [Role.ADMIN]: 'Administrator',
}

export const translateRole = (role: Role | string | null): string => {
  return roleTranslationMap[role as Role] || String(role) || ''
}
