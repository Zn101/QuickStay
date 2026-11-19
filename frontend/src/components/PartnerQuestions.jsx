import { useEffect, useState } from 'react'
import { api } from '../lib/api'

/** Hỏi đáp của khách về cơ sở do đối tác phụ trách: xem và trả lời. */
export default function PartnerQuestions() {
  const [questions, setQuestions] = useState([])
  const [drafts, setDrafts] = useState({})
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/partner/questions')
      .then((list) => setQuestions(Array.isArray(list) ? list : []))
      .catch((err) => setError(err.message || 'Không tải được câu hỏi.'))
      .finally(() => setLoading(false))
  }, [])

  async function answer(q) {
    const text = (drafts[q.id] ?? '').trim()
    if (!text) return
    setBusyId(q.id)
    setError('')
    try {
      const updated = await api(`/partner/questions/${q.id}`, { method: 'PATCH', body: { answer: text } })
      setQuestions((list) => list.map((x) => (x.id === q.id ? updated : x)))
      setDrafts((d) => ({ ...d, [q.id]: undefined }))
    } catch (err) {
      setError(err.message || 'Không gửi được câu trả lời.')
    } finally {
      setBusyId(null)
    }
  }

  const unanswered = questions.filter((q) => !q.answer).length

  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Hỏi đáp của khách</h2>
        {unanswered > 0 && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
            {unanswered} câu chưa trả lời
          </span>
        )}
      </div>
      {error && <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-400">Đang tải...</p>
      ) : questions.length === 0 ? (
        <p className="text-sm text-slate-400">Chưa có câu hỏi nào từ khách.</p>
      ) : (
        <ul className="space-y-4">
          {questions.map((q) => (
            <li key={q.id} className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {q.authorName}: <span className="font-normal">{q.question}</span>
              </p>
              {q.answer ? (
                <p className="mt-2 rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-900 dark:bg-sky-950 dark:text-sky-100">
                  <strong>{q.answeredBy}:</strong> {q.answer}
                </p>
              ) : (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <textarea
                    rows={2}
                    maxLength={2000}
                    value={drafts[q.id] ?? ''}
                    onChange={(e) => setDrafts((d) => ({ ...d, [q.id]: e.target.value }))}
                    placeholder="Nhập câu trả lời..."
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => answer(q)}
                    disabled={busyId === q.id || !(drafts[q.id] ?? '').trim()}
                    className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {busyId === q.id ? 'Đang gửi...' : 'Trả lời'}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
