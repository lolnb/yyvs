'use client'

import { useEffect, useRef } from "react"
import { SplineScene } from "@/components/ui/splite"

export default function Home() {
  const rootRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    let rafId = 0
    let swipeRafId = 0
    let swipeTimeoutId = 0
    let attempts = 0
    let sequenceRan = false

    const getCanvas = () => rootRef.current?.querySelector("canvas") ?? null

    const dispatchCenterTap = () => {
      const canvas = getCanvas()
      if (!canvas) return false

      const rect = canvas.getBoundingClientRect()
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

    const dispatchCenterSlightUpSwipe = () => {
      const canvas = getCanvas()
      if (!canvas) return

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
          swipeRafId = requestAnimationFrame(animateSwipe)
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

      swipeRafId = requestAnimationFrame(animateSwipe)
    }

    const runIntroSequence = () => {
      if (sequenceRan) return
      if (!dispatchCenterTap()) return

      sequenceRan = true
      swipeTimeoutId = window.setTimeout(() => {
        dispatchCenterSlightUpSwipe()
      }, 260)
    }

    const waitForCanvasAndRun = () => {
      if (sequenceRan) return
      attempts += 1

      if (getCanvas()) {
        runIntroSequence()
        return
      }

      if (attempts < 180) {
        rafId = requestAnimationFrame(waitForCanvasAndRun)
      }
    }

    rafId = requestAnimationFrame(waitForCanvasAndRun)

    return () => {
      cancelAnimationFrame(rafId)
      cancelAnimationFrame(swipeRafId)
      window.clearTimeout(swipeTimeoutId)
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
