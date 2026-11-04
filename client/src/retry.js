const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Ye errors par retry karte hain (server shayad abhi jaag raha hai): network error ya timeout
// (response hi nahi aaya), aur 502 / 503 / 504. Baaki (jaise 404) par turant haar maan lete hain.
export function isRetryable(err) {
  if (!err?.response) return true
  return [502, 503, 504].includes(err.response.status)
}

// fn() ko baar-baar chalata hai: fail hone par 2s, 4s, 8s, 16s, 16s... ruk kar, kul ~budgetMs tak.
// Budget khatam (ya retry layak error nahi) to aakhri error phenk deta hai.
export async function retryWithBackoff(
  fn,
  { budgetMs = 60000, firstDelayMs = 2000, maxDelayMs = 16000, isCancelled = () => false } = {},
) {
  const startedAt = Date.now()
  let delay = firstDelayMs

  for (;;) {
    try {
      return await fn()
    } catch (err) {
      const timeLeft = budgetMs - (Date.now() - startedAt)
      // 3 second se kam bache to ek aur koshish ka matlab nahi
      if (isCancelled() || !isRetryable(err) || timeLeft < 3000) throw err
      await wait(Math.min(delay, timeLeft))
      delay = Math.min(delay * 2, maxDelayMs)
    }
  }
}
