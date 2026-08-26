import React, { useEffect, useMemo, useRef, useState } from "react"

interface LocationPoint {
  latitude: number
  longitude: number
}

interface OfflineDraft {
  description: string
  location: LocationPoint | null
  createdAt: string
  imageName?: string
}

const STORAGE_KEY = "emergency-offline-drafts"
const VOICE_LANGUAGES = ["en-IN", "hi-IN", "pa-IN", "bn-IN", "mr-IN", "gu-IN", "ta-IN", "te-IN", "kn-IN", "ml-IN", "or-IN", "ur-IN"]

function redactSensitiveText(value: string) {
  return value
    .replace(/\b(?:\+?\d[\d\s().-]{7,}\d)\b/g, "[REDACTED_PHONE]")
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[REDACTED_EMAIL]")
    .replace(/\b(?:\d{12}|\d{16}|\d{4}\s\d{4}\s\d{4}\s\d{4})\b/g, "[REDACTED_ID]")
    .replace(/\b(?:\d{1,3}[- ]?){2,}\d{2,5}\b/g, "[REDACTED_ADDRESS]")
}

function getQualityLabel(score: number) {
  if (score >= 80) return "Excellent"
  if (score >= 65) return "Good"
  if (score >= 50) return "Fair"
  return "Low"
}

function assessImageQuality(file: File): Promise<{ quality: number; advisory: string | null }> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      resolve({ quality: 100, advisory: null })
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve({ quality: 100, advisory: null })
          return
        }

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
        let brightness = 0
        let contrastSum = 0

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          brightness += (r + g + b) / 3
          contrastSum += Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r)
        }

        const avgBrightness = brightness / (data.length / 4)
        const variance = contrastSum / (data.length / 4)
        const score = Math.max(0, Math.min(100, Math.round((avgBrightness / 255) * 40 + (variance / 2000) * 60)))

        const advisory = score < 50 ? "Image quality is low; blur or darkness may reduce confidence." : null
        resolve({ quality: score, advisory })
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

export default function ReportForm() {
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState<LocationPoint | null>(null)
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "error">("idle")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageQuality, setImageQuality] = useState<{ quality: number; advisory: string | null } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "listening" | "error">("idle")
  const [voiceLanguage, setVoiceLanguage] = useState("en-IN")
  const [offlineQueue, setOfflineQueue] = useState<OfflineDraft[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setOfflineQueue(JSON.parse(saved))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  useEffect(() => {
    if (offlineQueue.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(offlineQueue))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [offlineQueue])

  const queueDraft = () => {
    const draft: OfflineDraft = {
      description: description.trim(),
      location,
      createdAt: new Date().toISOString(),
      imageName: image ? image.name : undefined,
    }

    if (!draft.description && !draft.location && !draft.imageName) {
      return
    }

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as OfflineDraft[]
    const merged = [draft, ...saved.filter((item) => item.description || item.location || item.imageName)].slice(0, 5)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    setOfflineQueue(merged)
    setSubmitStatus("success")
    setErrorMessage("Draft saved offline. It will upload when connectivity returns.")
  }

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("error")
      return
    }
    setLocationStatus("loading")
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setLocationStatus("idle")
      },
      () => {
        setLocationStatus("error")
      }
    )
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setImage(file)
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
      const quality = await assessImageQuality(file)
      setImageQuality(quality)
    } else {
      setImagePreview(null)
      setImageQuality(null)
    }
  }

  const startVoiceCapture = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setVoiceStatus("error")
      setErrorMessage("Voice input is not supported in this browser.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = voiceLanguage
    recognition.interimResults = true
    recognition.continuous = false

    recognition.onstart = () => setVoiceStatus("listening")
    recognition.onerror = () => setVoiceStatus("error")
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join(" ")
      setDescription((current) => `${current}${current ? " " : ""}${transcript}`.trim())
    }
    recognition.onend = () => setVoiceStatus("idle")

    recognitionRef.current = recognition
    recognition.start()
  }

  const retryQueuedDrafts = async () => {
    if (offlineQueue.length === 0) return
    const items = [...offlineQueue]
    for (const draft of items) {
      if (!draft.description && !draft.location) continue
      try {
        const formData = new FormData()
        formData.append("description", redactSensitiveText(draft.description))
        if (draft.location) {
          formData.append("latitude", draft.location.latitude.toString())
          formData.append("longitude", draft.location.longitude.toString())
        }
        const response = await fetch("http://localhost:8000/api/report", {
          method: "POST",
          body: formData,
        })
        if (response.ok) {
          setOfflineQueue((current) => current.filter((entry) => entry.createdAt !== draft.createdAt))
        }
      } catch {
        break
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanedDescription = redactSensitiveText(description.trim())

    if (!cleanedDescription || !location) {
      setErrorMessage("Please provide a description and GPS location.")
      setSubmitStatus("error")
      return
    }

    if (image && imageQuality && imageQuality.quality < 45) {
      setErrorMessage(`Evidence quality is low (${getQualityLabel(imageQuality.quality)}). Please retake or send with lower confidence.`)
      setSubmitStatus("error")
      return
    }

    setIsSubmitting(true)
    setSubmitStatus("idle")

    try {
      const formData = new FormData()
      formData.append("description", cleanedDescription)
      formData.append("latitude", location.latitude.toString())
      formData.append("longitude", location.longitude.toString())
      formData.append("source", voiceStatus === "listening" ? "voice" : "text")
      if (image) {
        formData.append("image", image)
      }

      const response = await fetch("http://localhost:8000/api/report", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        if (!navigator.onLine) {
          queueDraft()
          throw new Error("Offline: queued for retry")
        }
        throw new Error(`HTTP ${response.status}`)
      }

      setSubmitStatus("success")
      setDescription("")
      setLocation(null)
      setImage(null)
      setImagePreview(null)
      setImageQuality(null)
      setOfflineQueue([])
      localStorage.removeItem(STORAGE_KEY)
      setTimeout(() => setSubmitStatus("idle"), 3000)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Submit failed"
      setErrorMessage(message)
      setSubmitStatus("error")
      if (!navigator.onLine) {
        queueDraft()
      }
      console.error("Submit error:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isSubmitDisabled = !description.trim() || !location || isSubmitting
  const queuedCount = useMemo(() => offlineQueue.length, [offlineQueue])

  return (
    <div className="min-h-screen w-full bg-neutral-950 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl p-6 space-y-5"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            <h1 className="text-lg font-semibold text-neutral-100">Report an incident</h1>
          </div>
          <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300">
            {navigator.onLine ? "online" : "offline"}
          </span>
        </div>

        <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">Quick entry</div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={startVoiceCapture} className="rounded-lg border border-cyan-700 bg-cyan-950 px-3 py-2 text-xs text-cyan-200">
              🎤 {voiceStatus === "listening" ? "Listening..." : "Voice report"}
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-lg border border-violet-700 bg-violet-950 px-3 py-2 text-xs text-violet-200">
              📷 Camera / Gallery
            </button>
            <button type="button" onClick={queueDraft} className="rounded-lg border border-amber-700 bg-amber-950 px-3 py-2 text-xs text-amber-200">
              💾 Save draft
            </button>
          </div>
          <select value={voiceLanguage} onChange={(e) => setVoiceLanguage(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-xs text-slate-200">
            {VOICE_LANGUAGES.map((language) => (
              <option key={language} value={language}>{language}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="description" className="text-sm font-medium text-neutral-300">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what's happening"
            rows={4}
            className="w-full resize-none rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-100 placeholder-neutral-500 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        <div className="space-y-1.5">
          <span className="text-sm font-medium text-neutral-300">Location</span>
          <button
            type="button"
            onClick={handleShareLocation}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-sm font-medium px-3 py-2 transition-colors"
          >
            {locationStatus === "loading" ? (
              "Getting location..."
            ) : location ? (
              `✓ Location shared (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`
            ) : (
              "📍 Share my GPS location"
            )}
          </button>
          {locationStatus === "error" && (
            <p className="text-xs text-red-400">Couldn't get your location. Check permissions and try again.</p>
          )}
        </div>

        <div className="space-y-1.5">
          <span className="text-sm font-medium text-neutral-300">Evidence</span>
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-sm font-medium px-3 py-2 transition-colors"
            >
              📸 {image ? image.name : "Upload screenshot / camera image"}
            </button>
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
            )}
            {imageQuality && (
              <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-300">
                Photo quality: {getQualityLabel(imageQuality.quality)} ({imageQuality.quality}/100)
                {imageQuality.advisory ? ` — ${imageQuality.advisory}` : ""}
              </div>
            )}
          </div>
        </div>

        {queuedCount > 0 && (
          <div className="rounded-lg border border-amber-700 bg-amber-950/40 p-3 text-xs text-amber-300">
            Offline queue: {queuedCount} draft{queuedCount > 1 ? "s" : ""}
            <button type="button" onClick={retryQueuedDrafts} className="ml-2 underline">Retry now</button>
          </div>
        )}

        {submitStatus === "success" && (
          <div className="p-3 bg-green-950 border border-green-700 rounded-lg text-green-300 text-sm">
            ✓ Report submitted successfully.{queueDraft ? "" : ""}
          </div>
        )}

        {submitStatus === "error" && (
          <div className="p-3 bg-red-950 border border-red-700 rounded-lg text-red-300 text-sm">
            ✗ {errorMessage || "Failed to submit report"}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="w-full rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-neutral-700 text-white text-sm font-medium px-3 py-2.5 transition-colors"
        >
          {isSubmitting ? "Submitting..." : "Submit Report"}
        </button>
      </form>
    </div>
  )
}
