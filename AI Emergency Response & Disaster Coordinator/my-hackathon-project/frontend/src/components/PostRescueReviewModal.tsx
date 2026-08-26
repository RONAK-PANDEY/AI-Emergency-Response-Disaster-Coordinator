import React, { useState } from 'react'

interface PostRescueReviewModalProps {
  isOpen: boolean
  incidentId: number
  trackingCode?: string
  token?: string | null
  onClose: () => void
  onReviewSubmitted?: () => void
}

function StarRatingSelector({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (val: number) => void
  label: string
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2.5">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="text-lg transition transform hover:scale-125 focus:outline-none"
            aria-label={`${star} star`}
          >
            {star <= value ? '⭐' : '☆'}
          </button>
        ))}
        <span className="ml-1.5 text-xs font-bold text-slate-800">{value}/5</span>
      </div>
    </div>
  )
}

export default function PostRescueReviewModal({
  isOpen,
  incidentId,
  trackingCode,
  token,
  onClose,
  onReviewSubmitted,
}: PostRescueReviewModalProps) {
  const [responseTime, setResponseTime] = useState(5)
  const [efficiency, setEfficiency] = useState(5)
  const [behaviour, setBehaviour] = useState(5)
  const [overall, setOverall] = useState(5)
  const [feedback, setFeedback] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`http://localhost:8000/api/incidents/${incidentId}/review`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          response_time_rating: responseTime,
          rescue_efficiency_rating: efficiency,
          staff_behaviour_rating: behaviour,
          overall_rating: overall,
          feedback_text: feedback.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to submit review')
      }

      setSubmitted(true)
      if (onReviewSubmitted) onReviewSubmitted()
    } catch (err: any) {
      setErrorMessage(err.message || 'Review submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-2xl">
        {/* Government Portal Header */}
        <div className="border-b border-slate-200 bg-gradient-to-r from-blue-950 to-blue-900 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">⭐</span>
              <div>
                <h3 className="text-base font-bold">Post-Rescue Citizen Feedback & Review</h3>
                <p className="text-xs text-blue-200">
                  Incident Code: <span className="font-mono font-bold text-amber-300">{trackingCode || `EMG-${incidentId}`}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-300 hover:text-white text-lg font-bold p-1"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {submitted ? (
            <div className="space-y-4 py-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
                ✓
              </div>
              <h4 className="text-base font-bold text-slate-900">Thank You for Your Feedback!</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Your rating has been securely submitted to the State Emergency Operations Centre for continuous response quality auditing.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-blue-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-800 transition"
              >
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-600">
                Your feedback helps the Government Disaster Response Force maintain high standards of emergency rescue, speed, and citizen safety.
              </p>

              {errorMessage && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                  ✗ {errorMessage}
                </div>
              )}

              <div className="space-y-2">
                <StarRatingSelector
                  label="⏱️ Emergency Response Time"
                  value={responseTime}
                  onChange={setResponseTime}
                />
                <StarRatingSelector
                  label="🛡️ Rescue & Evacuation Efficiency"
                  value={efficiency}
                  onChange={setEfficiency}
                />
                <StarRatingSelector
                  label="🤝 Staff & Personnel Behaviour"
                  value={behaviour}
                  onChange={setBehaviour}
                />
                <StarRatingSelector
                  label="⭐ Overall Emergency Operation Rating"
                  value={overall}
                  onChange={setOverall}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Citizen Comments & Testimonial (Optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share details of the rescue, staff assistance, or any suggestions..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-slate-300 bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-blue-900 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-900/30 hover:bg-blue-800 transition disabled:opacity-50"
                >
                  {loading ? 'Submitting Review...' : 'Submit Official Review'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
