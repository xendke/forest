"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function NavCTA() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token =
      localStorage.getItem("forest_token") ??
      sessionStorage.getItem("forest_token")
    setIsLoggedIn(!!token)
  }, [])

  return (
    <Button size="sm" className="rounded-full px-5 text-xs font-semibold h-8" asChild>
      <Link href={isLoggedIn ? "/home" : "/join"}>
        {isLoggedIn ? "Dashboard" : "Join Now"}
      </Link>
    </Button>
  )
}
