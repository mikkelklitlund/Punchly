export const getProfilePictureUrl = (filename?: string): string => {
  if (!filename) return '/uploads/default-avatar.png'
  return `${import.meta.env.VITE_STATIC_BASE_URL}/uploads/${filename}`
}
