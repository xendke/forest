"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    localStorage.removeItem("forest_token")
    sessionStorage.removeItem("forest_token")
    router.replace("/login")
  }, [router])

  return null
}
