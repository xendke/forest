"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    document.cookie = 'forest_token=; path=/; Max-Age=0; SameSite=Lax'
    router.replace("/login")
  }, [router])

  return null
}
