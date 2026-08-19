'use client'

import { useCallback, useRef } from "react"
import type { Application } from "@splinetool/runtime"
import { SplineScene } from "@/components/ui/splite"

const EYE_EVENT_OBJECTS = ["Head", "Head 2", "Body"] as const

export default function Home() {
  const rootRef = useRef<HTMLElement | null>(null)
  const userTouchedRef = useRef(false)
  const swipeRafRef = useRef(0)

  const openEyes = useCallback((app: Application) => {
    for (const name of EYE_EVENT_OBJECTS) {
      try {
        app.emitEvent("mouseDown", name)
        app.emitEvent("mouseUp", name)
      } catch {
        // Object may not exist or may not have this event.
      }
    }
  }, [])

  const dispatchCenterSlightUpSwipe = useCallback(() => {
    const canvas = rootRef.current?.querySelector("canvas")
    if (!canvas || userTouchedRef.current) return

    const rect = canvas.getBoundingClientRect()
    const startX = rect.left + rect.width / 2
    const startY = rect.top + rect.height / 2
    const endY = startY - Math.min(rect.height * 0.045, 24)

    const pointerInitBase: Omit<PointerEventInit, "clientX" | "clientY"> = {
      bubbles: true,
      cancelable: true,
      pointerType: "touch",
    }

    canvas.dispatchEvent(
      new PointerEvent("pointerdown", {
        ...pointerInitBase,
        clientX: startX,
        clientY: startY,
      }),
    )

    const startTime = performance.now()
    const durationMs = 460

    const animateSwipe = () => {
      if (userTouchedRef.current) return

      const elapsed = performance.now() - startTime
      const t = Math.min(elapsed / durationMs, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const clientY = startY + (endY - startY) * eased

      canvas.dispatchEvent(
        new PointerEvent("pointermove", {
          ...pointerInitBase,
          clientX: startX,
          clientY,
        }),
      )
      canvas.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          cancelable: true,
          clientX: startX,
          clientY,
        }),
      )

      if (t < 1) {
        swipeRafRef.current = requestAnimationFrame(animateSwipe)
        return
      }

      canvas.dispatchEvent(
        new PointerEvent("pointerup", {
          ...pointerInitBase,
          clientX: startX,
          clientY: endY,
        }),
      )
    }

    swipeRafRef.current = requestAnimationFrame(animateSwipe)
  }, [])

  const handleLoad = useCallback(
    (app: Application) => {
      openEyes(app)
      window.setTimeout(() => openEyes(app), 120)

      const canvas = app.canvas
      const onFirstTouch = () => {
        userTouchedRef.current = true
        cancelAnimationFrame(swipeRafRef.current)
        openEyes(app)
      }
      canvas.addEventListener("pointerdown", onFirstTouch, {
        capture: true,
        once: true,
      })
      canvas.addEventListener("touchstart", onFirstTouch, {
        capture: true,
        passive: true,
        once: true,
      })

      window.setTimeout(() => {
        dispatchCenterSlightUpSwipe()
      }, 280)
    },
    [dispatchCenterSlightUpSwipe, openEyes],
  )

  return (
    <main ref={rootRef} className="h-dvh w-full overflow-hidden bg-black">
      <SplineScene
        scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
        className="h-full w-full"
        onLoad={handleLoad}
      />
    </main>
  )
}
