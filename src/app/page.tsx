'use client'

import { useEffect, useRef } from "react"
import { SplineScene } from "@/components/ui/splite"

export default function Home() {
  const rootRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    let rafId = 0
    let retryTimeoutId = 0
    let attempts = 0
    let triggeredCount = 0

    const dispatchCenterTap = () => {
      const root = rootRef.current
      const canvas = root?.querySelector("canvas")
      if (!root || !canvas) return false

      const rect = root.getBoundingClientRect()
      const clientX = rect.left + rect.width / 2
      const clientY = rect.top + rect.height / 2

      const pointerInit: PointerEventInit = {
        bubbles: true,
        cancelable: true,
        pointerType: "touch",
        clientX,
        clientY,
      }

      canvas.dispatchEvent(new PointerEvent("pointerdown", pointerInit))
      canvas.dispatchEvent(new PointerEvent("pointerup", pointerInit))
      canvas.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          clientX,
          clientY,
        }),
      )
      return true
    }

    const triggerCenterTap = () => {
      if (triggeredCount > 0) return
      attempts += 1

      if (!dispatchCenterTap()) {
        if (attempts < 120) {
          rafId = requestAnimationFrame(triggerCenterTap)
        }
        return
      }
      triggeredCount = 1

      // Slow-loading fallback: fire a second center tap shortly after first paint.
      retryTimeoutId = window.setTimeout(() => {
        if (triggeredCount < 2 && dispatchCenterTap()) {
          triggeredCount = 2
        }
      }, 900)
    }

    rafId = requestAnimationFrame(triggerCenterTap)
    return () => {
      cancelAnimationFrame(rafId)
      window.clearTimeout(retryTimeoutId)
    }
  }, [])

  return (
    <main ref={rootRef} className="h-dvh w-full overflow-hidden bg-black">
      <SplineScene
        scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
        className="h-full w-full"
      />
    </main>
  )
}
