"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;)\s*forest_token=([^;]*)/)
    const token = match ? decodeURIComponent(match[1]) : null

    if (!token) {
      router.replace("/")
    } else {
      setVerified(true)
    }
  }, [router])

  if (!verified) return null

  return <>{children}</>
}
