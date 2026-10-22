// Kiem thu tai: N request dong thoi toi cac API doc chinh, do thoi gian phan hoi (NFR-01, NFR-03).
// Chay: node qa/load-test.mjs [BASE_URL] [CONCURRENCY]
const BASE = process.argv[2] || 'http://localhost:8080'
const N = Number(process.argv[3] || 50)
const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)
const endpoints = ['/api/hotels', '/api/hotels/1', `/api/hotels/1/rooms?checkIn=${day(5)}&checkOut=${day(7)}`]

let failed = 0
for (const path of endpoints) {
  await fetch(BASE + path) // khoi dong nong
  const times = await Promise.all(
    Array.from({ length: N }, async () => {
      const t = performance.now()
      try {
        const res = await fetch(BASE + path)
        await res.text()
        if (!res.ok) throw new Error(res.status)
        return performance.now() - t
      } catch {
        failed++
        return Infinity
      }
    }),
  )
  const ok = times.filter(Number.isFinite).sort((a, b) => a - b)
  const avg = ok.reduce((s, x) => s + x, 0) / (ok.length || 1)
  const p95 = ok[Math.floor(ok.length * 0.95) - 1] ?? Infinity
  console.log(`${path}\n  ${ok.length}/${N} thanh cong, TB ${avg.toFixed(0)}ms, p95 ${p95.toFixed(0)}ms, max ${(ok.at(-1) ?? 0).toFixed(0)}ms  ${p95 < 500 ? 'DAT (<500ms)' : 'KHONG DAT'}`)
}
console.log(failed === 0 ? `\nKhong co request nao loi voi ${N} request dong thoi.` : `\n${failed} request loi.`)
process.exit(failed === 0 ? 0 : 1)
