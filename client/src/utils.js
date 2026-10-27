// Photo URL ya raw base64 dono ko browser ke liye sahi src banata hai
export function photoSrc(photo) {
  if (!photo) return null
  if (photo.startsWith('data:') || photo.startsWith('http') || photo.startsWith('/')) return photo
  return `data:image/jpeg;base64,${photo}`
}
