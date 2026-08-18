import { SplineScene } from "@/components/ui/splite"

export default function Home() {
  return (
    <main className="h-dvh w-full overflow-hidden bg-black">
      <SplineScene
        scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
        className="h-full w-full"
      />
    </main>
  )
}
