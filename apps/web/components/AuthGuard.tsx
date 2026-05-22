"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token =
      localStorage.getItem("forest_token") ??
      sessionStorage.getItem("forest_token")

    if (!token) {
      router.replace("/")
    } else {
      setVerified(true)
    }
  }, [router])

  if (!verified) return null

  return <>{children}</>
}
