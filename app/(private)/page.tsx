"use client"

import { useStation } from "@/lib/station/context"
import { useUser } from "@/lib/user/context"

export default function Page() {
  const { user } = useUser()
  const { stations } = useStation()

  return (
    <>
      <pre>{JSON.stringify(user, null, 2)}</pre>
      <pre>{JSON.stringify(stations, null, 2)}</pre>
    </>
  )
}
