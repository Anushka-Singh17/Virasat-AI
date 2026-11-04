// Chhota logo: welcome page ke illustration jaisa (ek ke andar ek mehrab aur suraj)
export default function Logo({ className = 'logo' }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="12" fill="#fbf5ea" />
      <circle cx="37" cy="12" r="4" fill="#e0a800" />
      <path d="M7 44V26Q7 6 24 6Q41 6 41 26V44Z" fill="#b5532e" opacity="0.3" />
      <path d="M13 44V28Q13 14 24 14Q35 14 35 28V44Z" fill="#b5532e" opacity="0.55" />
      <path d="M19 44V32Q19 22 24 22Q29 22 29 32V44Z" fill="#4a2c1a" opacity="0.85" />
    </svg>
  )
}
