"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function HeroActions() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token =
      localStorage.getItem("forest_token") ??
      sessionStorage.getItem("forest_token")
    setIsLoggedIn(!!token)
  }, [])

  if (isLoggedIn) {
    return (
      <Button size="lg" asChild>
        <Link href="/home">Dashboard →</Link>
      </Button>
    )
  }

  return (
    <>
      <Button variant="outline" size="lg" asChild>
        <Link href="#about">About</Link>
      </Button>
      <Button size="lg" asChild>
        <Link href="/join">Join Now →</Link>
      </Button>
    </>
  )
}
