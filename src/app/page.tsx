'use client'

import { useCallback, useRef } from "react"
import type { Application, SplineEventName } from "@splinetool/runtime"
import { SplineScene } from "@/components/ui/splite"

const EYE_EVENT_OBJECTS = [
  "Video",
  "Bot",
  "Head",
  "Head 2",
  "Body",
  "Top part",
] as const

const VIDEO_OBJECT_ID = "ede530fe-2372-405d-96a3-cd68daee0858"

export default function Home() {
  const rootRef = useRef<HTMLElement | null>(null)
  const userTouchedRef = useRef(false)
  const swipeRafRef = useRef(0)
  const appRef = useRef<Application | null>(null)
  const swipePointerRef = useRef<{
    canvas: HTMLCanvasElement
    clientX: number
    clientY: number
  } | null>(null)

  const playEyeVideos = useCallback((app: Application) => {
    const videos = new Set<HTMLVideoElement>()

    const addVideo = (value: unknown) => {
      if (value instanceof HTMLVideoElement) videos.add(value)
    }

    const inspect = (value: unknown, depth = 0) => {
      if (!value || depth > 8) return
      addVideo(value)
      if (typeof value !== "object") return
      if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) return
      if (value instanceof Node && !(value instanceof HTMLVideoElement)) return

      const record = value as Record<string, unknown>
      addVideo(record.img)
      addVideo(record.videoElement)
      addVideo(record.image)
      inspect(record.material, depth + 1)
      inspect(record.color, depth + 1)
      inspect(record.texture, depth + 1)
      inspect(record.layers, depth + 1)
      if (Array.isArray(value) && value.length < 40) {
        for (const item of value) inspect(item, depth + 1)
      }
    }

    for (const obj of app.getAllObjects()) {
      inspect(obj)
      inspect(obj.material)
    }

    for (const video of document.querySelectorAll("video")) {
      videos.add(video)
    }

    for (const video of videos) {
      video.muted = true
      video.defaultMuted = true
      video.playsInline = true
      video.loop = true
      video.setAttribute("playsinline", "true")
      video.setAttribute("webkit-playsinline", "true")
      video.setAttribute("x5-playsinline", "true")
      void video.play().catch(() => {})
    }
  }, [])

  const openEyes = useCallback(
    (app: Application) => {
      app.setGlobalEvents(true)
      playEyeVideos(app)

      const eventNames: SplineEventName[] = [
        "start",
        "mouseDown",
        "mouseUp",
        "mouseHover",
      ]
      const targets = new Set<string>([...EYE_EVENT_OBJECTS, VIDEO_OBJECT_ID])
      for (const obj of app.getAllObjects()) {
        if (obj.name) targets.add(obj.name)
        if (obj.uuid) targets.add(obj.uuid)
      }

      for (const target of targets) {
        for (const eventName of eventNames) {
          try {
            app.emitEvent(eventName, target)
          } catch {
            // Event may not exist on this object.
          }
        }
      }
    },
    [playEyeVideos],
  )

  const releaseSwipePointer = useCallback(() => {
    cancelAnimationFrame(swipeRafRef.current)
    const active = swipePointerRef.current
    if (!active) return
    swipePointerRef.current = null

    const pointerInit: PointerEventInit = {
      bubbles: true,
      cancelable: true,
      pointerType: "touch",
      clientX: active.clientX,
      clientY: active.clientY,
    }
    active.canvas.dispatchEvent(new PointerEvent("pointerup", pointerInit))
    active.canvas.dispatchEvent(new PointerEvent("pointercancel", pointerInit))
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

    swipePointerRef.current = {
      canvas,
      clientX: startX,
      clientY: startY,
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
      if (userTouchedRef.current) {
        releaseSwipePointer()
        return
      }

      const elapsed = performance.now() - startTime
      const t = Math.min(elapsed / durationMs, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const clientY = startY + (endY - startY) * eased

      swipePointerRef.current = {
        canvas,
        clientX: startX,
        clientY,
      }

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

      releaseSwipePointer()
    }

    swipeRafRef.current = requestAnimationFrame(animateSwipe)
  }, [releaseSwipePointer])

  const handleLoad = useCallback(
    (app: Application) => {
      appRef.current = app
      openEyes(app)
      window.setTimeout(() => openEyes(app), 200)

      const unlockOnWeChat = () => openEyes(app)
      document.addEventListener("WeixinJSBridgeReady", unlockOnWeChat, {
        once: true,
      })
      const weixin = (window as unknown as { WeixinJSBridge?: unknown })
        .WeixinJSBridge
      if (weixin) unlockOnWeChat()

      const canvas = app.canvas
      const onFirstRealTouch = (event: Event) => {
        if ("isTrusted" in event && event.isTrusted === false) return
        userTouchedRef.current = true
        releaseSwipePointer()
        // WeChat requires a real user gesture to start the eye video.
        playEyeVideos(app)
      }
      canvas.addEventListener("pointerdown", onFirstRealTouch, {
        capture: true,
      })
      canvas.addEventListener("touchstart", onFirstRealTouch, {
        capture: true,
        passive: true,
      })

      const isWeChat = /MicroMessenger/i.test(navigator.userAgent)
      if (!isWeChat) {
        window.setTimeout(() => {
          dispatchCenterSlightUpSwipe()
        }, 280)
      }
    },
    [dispatchCenterSlightUpSwipe, openEyes, playEyeVideos, releaseSwipePointer],
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
