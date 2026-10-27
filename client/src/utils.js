// Photo URL ya raw base64 dono ko browser ke liye sahi src banata hai
export function photoSrc(photo) {
  if (!photo) return null
  if (photo.startsWith('data:') || photo.startsWith('http') || photo.startsWith('/')) return photo
  return `data:image/jpeg;base64,${photo}`
}

// Photo ko chhota (max 800px) JPEG mein badalta hai, taaki request body chhoti rahe
export function readImageAsDataUrl(file, maxSize = 800) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image load nahi hui'))
    }
    img.src = url
  })
}
