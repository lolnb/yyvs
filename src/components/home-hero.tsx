"use client"

import * as React from "react"

import { SiriWave } from "@/components/ui/siri-wave"

function useWaveSize() {
  const [size, setSize] = React.useState(360)

  React.useEffect(() => {
    const update = () => {
      const pad = 64
      const max = Math.min(window.innerWidth - pad, window.innerHeight - pad, 360)
      setSize(Math.round(Math.max(200, max)))
    }

    update()
    window.addEventListener("resize", update)
    window.addEventListener("orientationchange", update)
    return () => {
      window.removeEventListener("resize", update)
      window.removeEventListener("orientationchange", update)
    }
  }, [])

  return size
}

export function HomeHero() {
  const size = useWaveSize()

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-black p-8">
      <SiriWave variant="wave" size={size} />
    </div>
  )
}
