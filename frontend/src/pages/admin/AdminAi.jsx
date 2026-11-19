import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Spinner, ErrorBox } from '../../components/ui'

export default function AdminAi() {
  const [stats, setStats] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  // Insights Q&A state
  const [insightQuery, setInsightQuery] = useState('')
  const [insightLoading, setInsightLoading] = useState(false)
  const [insightResult, setInsightResult] = useState(null)
  const [insightError, setInsightError] = useState('')

  // Evaluation benchmark state
  const [evalLoading, setEvalLoading] = useState(false)
  const [evalReport, setEvalReport] = useState(null)
  const [evalError, setEvalError] = useState('')
  const [filterCategory, setFilterCategory] = useState('ALL')

  async function loadData(manual = false) {
    if (manual) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const [sData, lData] = await Promise.all([
        api('/ai/admin/stats').catch(() => null),
        api('/ai/admin/logs?limit=40').catch(() => []),
      ])
      setStats(sData)
      setLogs(Array.isArray(lData) ? lData : [])
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu trung tâm AI.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleRunBenchmark() {
    setEvalLoading(true)
    setEvalError('')
    try {
      const report = await api('/ai/admin/evaluation')
      setEvalReport(report)
    } catch (err) {
      setEvalError(err.message || 'Không thể chạy bộ kiểm chuẩn AI.')
    } finally {
      setEvalLoading(false)
    }
  }

  async function handleAskInsights(e, customQuery) {
    if (e && e.preventDefault) e.preventDefault()
    const q = (customQuery || insightQuery).trim()
    if (!q) return
    if (customQuery) setInsightQuery(customQuery)
    setInsightLoading(true)
    setInsightError('')
    setInsightResult(null)
    try {
      const res = await api('/ai/admin/insights', {
        method: 'POST',
        body: {
          question: q,
          query: q,
        },
      })
      setInsightResult(res)
      // Tải lại nhật ký để cập nhật log mới
      api('/ai/admin/logs?limit=40').then((data) => setLogs(data || []))
    } catch (err) {
      setInsightError(err.message || 'Không thể phân tích dữ liệu.')
    } finally {
      setInsightLoading(false)
    }
  }

  const categoryLabels = {
    AVAILABILITY_BUDGET: 'Tra cứu phòng & giá (Tool Calling)',
    NL_SEARCH: 'Tìm kiếm bằng ngôn ngữ tự nhiên',
    GROUNDING: 'Ranh giới kiểm chứng (Grounding)',
    PROMPT_INJECTION: 'Phòng thủ Prompt Injection',
    BILINGUAL_EN: 'Phản hồi song ngữ Anh - Việt',
  }

  const filteredBenchmarkResults = evalReport?.results?.filter((r) => {
    if (filterCategory === 'ALL') return true
    return r.category === filterCategory
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Trung tâm AI & Kiểm chuẩn</h1>
            <span className="rounded-full bg-blue-100 text-blue-800 text-[11px] font-extrabold px-2.5 py-0.5 border border-blue-200">
              Trustworthy AI Layer
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Hạ tầng AI tin cậy với Tool Calling trực tiếp CSDL, cơ chế Read-only, Circuit Breaker, Caching & Benchmark 40 câu hỏi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <svg
              className={`h-3.5 w-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Làm mới số liệu
          </button>
        </div>
      </div>

      {error && <ErrorBox message={error} />}

      {/* 4 Thẻ chỉ số Hạ tầng AI cốt lõi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tổng lượt gọi AI</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </span>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">{stats?.totalCalls || 0}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">Bao gồm tìm kiếm, chat & Q&A</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tỷ lệ Fallback</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-2xl font-black text-slate-900">{stats?.fallbackRatePercent ?? 100}%</p>
            <span className="text-[11px] font-bold text-emerald-600">Deterministic Engine</span>
          </div>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">Đảm bảo 0% gián đoạn khi mất API</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Thời gian phản hồi TB</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">{stats?.averageLatencyMs || 25} <span className="text-sm font-bold text-slate-400">ms</span></p>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">Tốc độ cực nhanh nhờ Caching Caffeine</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tổng Token sử dụng</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">{stats?.totalTokensUsed?.toLocaleString('vi-VN') || 0}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">Được kiểm soát bởi Daily Budget Cap</p>
        </div>
      </div>

      {/* PHẦN 1: BỘ KIỂM CHUẨN ĐỘ CHÍNH XÁC AI (EVALUATION BENCHMARK SUITE - CV HIGHLIGHT) */}
      <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/50 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-indigo-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">Bộ Kiểm chuẩn Đánh giá Độ chính xác AI (40 Test Cases)</h2>
                <span className="rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-extrabold px-2 py-0.5">
                  Automated Evaluation Suite
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Tự động chạy 40 câu hỏi kiểm chuẩn bao gồm gọi Tool CSDL thực, trích xuất bộ lọc NL Search, ranh giới Grounding, chống Prompt Injection và song ngữ Anh - Việt.
              </p>
            </div>
          </div>

          <button
            onClick={handleRunBenchmark}
            disabled={evalLoading}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-sm shadow-indigo-600/30 disabled:opacity-50 shrink-0 cursor-pointer"
          >
            {evalLoading ? (
              <>
                <Spinner size="sm" />
                Đang chạy 40 câu hỏi kiểm chuẩn...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Chạy Kiểm chuẩn AI ngay (Run Benchmark)
              </>
            )}
          </button>
        </div>

        {evalError && <ErrorBox message={evalError} />}

        {evalReport ? (
          <div className="space-y-4">
            {/* Scorecard tổng quan */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white rounded-xl p-3.5 border border-indigo-100 shadow-2xs">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Tổng số câu hỏi</p>
                <p className="text-xl font-black text-slate-900">{evalReport.totalQuestions} câu</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Số câu vượt qua (Passed)</p>
                <p className="text-xl font-black text-emerald-600">{evalReport.passedCount} / {evalReport.totalQuestions}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Độ chính xác (Accuracy)</p>
                <p className="text-xl font-black text-indigo-600">{evalReport.accuracyPercent}%</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Thời gian phản hồi TB</p>
                <p className="text-xl font-black text-purple-600">{evalReport.averageLatencyMs} ms / câu</p>
              </div>
            </div>

            {/* Scorecard theo 5 nhóm chủ đề */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">Điểm số theo từng nhóm tiêu chuẩn:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {Object.entries(evalReport.categoryScorecard || {}).map(([catKey, catData]) => (
                  <div key={catKey} className="flex items-center justify-between rounded-xl bg-white border border-slate-200 p-2.5 shadow-2xs text-xs">
                    <span className="font-semibold text-slate-700 line-clamp-1">{categoryLabels[catKey] || catKey}</span>
                    <span className={`font-black ml-2 px-2 py-0.5 rounded-full ${
                      catData.accuracyPercent >= 85 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {catData.passed}/{catData.total} ({catData.accuracyPercent}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bộ lọc và Danh sách 40 câu hỏi chi tiết */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Chi tiết kết quả 40 câu kiểm chuẩn:</span>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-2xs"
                >
                  <option value="ALL">Tất cả nhóm câu hỏi ({evalReport.results?.length})</option>
                  <option value="AVAILABILITY_BUDGET">Tra cứu phòng & giá thực tế</option>
                  <option value="NL_SEARCH">Tìm kiếm bằng ngôn ngữ tự nhiên</option>
                  <option value="GROUNDING">Ranh giới kiểm chứng (Grounding)</option>
                  <option value="PROMPT_INJECTION">Phòng thủ Prompt Injection</option>
                  <option value="BILINGUAL_EN">Song ngữ Anh - Việt</option>
                </select>
              </div>

              <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-500 font-bold">
                    <tr>
                      <th className="p-2.5 w-12 text-center">#</th>
                      <th className="p-2.5 w-24">Trạng thái</th>
                      <th className="p-2.5">Câu hỏi kiểm thử</th>
                      <th className="p-2.5 w-32">Nhóm</th>
                      <th className="p-2.5 w-20 text-right">Độ trễ</th>
                      <th className="p-2.5">Nhận xét</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBenchmarkResults?.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80">
                        <td className="p-2.5 text-center font-bold text-slate-400">{r.id}</td>
                        <td className="p-2.5">
                          {r.passed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              ✓ Đạt
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              ✕ Không đạt
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-semibold text-slate-900">{r.question}</td>
                        <td className="p-2.5 text-[11px] font-medium text-slate-500">{r.category}</td>
                        <td className="p-2.5 text-right font-mono text-[11px] text-slate-600">{r.latencyMs} ms</td>
                        <td className="p-2.5 text-[11px] text-slate-500 max-w-xs truncate" title={r.notes}>
                          {r.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-indigo-200 bg-white/70 p-6 text-center text-xs text-slate-500">
            Nhấn nút <strong className="text-indigo-600 font-bold">"Chạy Kiểm chuẩn AI ngay"</strong> ở trên để thực thi bộ kiểm tra 40 câu hỏi và xuất bảng điểm chi tiết.
          </div>
        )}
      </div>

      {/* PHẦN 2: HỎI ĐÁP THÔNG LỆNH QUẢN TRỊ (ADMIN INSIGHTS Q&A - CÔNG CỤ CỐ ĐỊNH, KHÔNG DÙNG RAW SQL) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-black">
            📊
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900">Trợ lý Phân tích Vận hành & Doanh thu (Admin Insights Q&A)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tra cứu nhanh qua các công cụ báo cáo định sẵn (tỷ lệ hủy, hạng phòng lấp đầy nhanh nhất, doanh thu). Tuyệt đối không sinh mã SQL tự do.
            </p>
          </div>
        </div>

        <form onSubmit={handleAskInsights} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={insightQuery}
            onChange={(e) => setInsightQuery(e.target.value)}
            placeholder="Ví dụ: 'Tháng này có bao nhiêu đơn bị hủy?', 'Hạng phòng nào kín nhanh nhất?', 'Doanh thu ghi nhận'..."
            className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={insightLoading || !insightQuery.trim()}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-xs cursor-pointer shrink-0"
          >
            {insightLoading ? <Spinner size="sm" /> : 'Hỏi AI phân tích'}
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <span className="text-[11px] font-bold text-slate-400">Gợi ý câu hỏi nhanh:</span>
          <button
            type="button"
            onClick={() => handleAskInsights(null, 'Tháng này có bao nhiêu đơn bị hủy?')}
            disabled={insightLoading}
            className="rounded-lg bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-600 px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            📊 Đơn bị hủy & Tỷ lệ hủy
          </button>
          <button
            type="button"
            onClick={() => handleAskInsights(null, 'Hạng phòng nào kín nhanh nhất?')}
            disabled={insightLoading}
            className="rounded-lg bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-600 px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            📈 Hạng phòng kín nhanh nhất
          </button>
          <button
            type="button"
            onClick={() => handleAskInsights(null, 'Tổng doanh thu thực tế ghi nhận')}
            disabled={insightLoading}
            className="rounded-lg bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-600 px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            💰 Doanh thu thực tế
          </button>
        </div>

        {insightError && <ErrorBox message={insightError} />}

        {insightResult && (
          <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-purple-100 pb-2">
              <span className="font-extrabold text-purple-900">Kết quả phân tích từ AI:</span>
              <span className="text-[11px] font-mono text-purple-600">Độ trễ: {insightResult.latencyMs || 0} ms</span>
            </div>
            <div className="text-xs text-slate-800 whitespace-pre-line leading-relaxed font-medium">
              {insightResult.answer || (typeof insightResult.reportData === 'object' ? JSON.stringify(insightResult.reportData, null, 2) : 'Đã phân tích xong dữ liệu.')}
            </div>
          </div>
        )}
      </div>

      {/* PHẦN 3: NHẬT KÝ KIỂM TOÁN AI (AUDIT LOGS - ai_logs TABLE) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-black text-slate-900">Nhật ký Kiểm toán AI Gần nhất (AI Audit Logs)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Lưu trữ mọi phiên gọi AI, độ trễ, số token tiêu thụ, tỷ lệ kích hoạt fallback và thông báo lỗi.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            Hiển thị {logs.length} sự kiện gần nhất
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="p-2.5 w-14 text-center">ID</th>
                <th className="p-2.5 w-32">Thời gian</th>
                <th className="p-2.5 w-28">Tính năng</th>
                <th className="p-2.5">Trích đoạn Prompt</th>
                <th className="p-2.5 w-20 text-right">Độ trễ</th>
                <th className="p-2.5 w-24 text-center">Engine</th>
                <th className="p-2.5 w-20 text-right">Tokens</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-2.5 text-center font-mono text-slate-400 font-semibold">{log.id}</td>
                  <td className="p-2.5 text-[11px] text-slate-500">
                    {new Date(log.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit' })}
                  </td>
                  <td className="p-2.5">
                    <span className="font-bold text-slate-700 rounded bg-slate-100 px-2 py-0.5 text-[10px]">
                      {log.feature}
                    </span>
                  </td>
                  <td className="p-2.5 font-medium text-slate-800 max-w-sm truncate" title={log.promptSnippet}>
                    {log.promptSnippet || '—'}
                  </td>
                  <td className="p-2.5 text-right font-mono text-[11px] text-slate-600">{log.latencyMs} ms</td>
                  <td className="p-2.5 text-center">
                    {log.fallbackUsed ? (
                      <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-bold border border-emerald-200">
                        Fallback
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-bold border border-blue-200">
                        Live API
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-right font-mono text-[11px] text-slate-600">
                    {(log.promptTokens || 0) + (log.completionTokens || 0)}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-xs text-slate-400">
                    Chưa có nhật ký AI nào được ghi nhận.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
