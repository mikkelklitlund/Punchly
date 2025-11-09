export const getProfilePictureUrl = (filename?: string): string => {
  if (!filename) return '/api/uploads/default-avatar.png'
  return `${import.meta.env.VITE_API_BASE_URL}/uploads/${filename}`
}
