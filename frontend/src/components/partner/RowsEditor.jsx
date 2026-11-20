/**
 * Trình sửa danh sách nhiều cột cho đối tác (ảnh, quy định, đưa đón, ẩm thực...).
 * Giá trị lưu ở backend là chuỗi nhiều dòng, mỗi dòng các cột cách nhau bằng "|".
 */
export function parseRows(text, columns) {
  if (!text) return []
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cells = line.split('|')
      const row = {}
      columns.forEach((c, idx) => {
        // Cột cuối gom phần còn lại (nội dung có thể chứa "|")
        row[c.key] = (idx === columns.length - 1 ? cells.slice(idx).join('|') : cells[idx] || '').trim()
      })
      return row
    })
}

export function serializeRows(rows, columns) {
  return rows
    .filter((r) => (r[columns[0].key] || '').trim())
    .map((r) => columns.map((c) => String(r[c.key] ?? '').replace(/[|\r\n]+/g, ' ').trim()).join('|'))
    .join('\n')
}

export const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white'

export const labelCls = 'mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400'

export const cardCls = 'rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900'

export default function RowsEditor({ label, hint, columns, rows, onChange, addLabel = '+ Thêm dòng', max = 20 }) {
  function update(idx, key, value) {
    onChange(rows.map((r, i) => (i === idx ? { ...r, [key]: value } : r)))
  }
  function remove(idx) {
    onChange(rows.filter((_, i) => i !== idx))
  }
  function add() {
    onChange([...rows, Object.fromEntries(columns.map((c) => [c.key, '']))])
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <span className={labelCls}>{label}</span>
        {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
      </div>
      <div className="space-y-2">
        {rows.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-200 px-3 py-2.5 text-xs text-slate-400 dark:border-slate-700">
            Chưa có mục nào. Mục trống sẽ được ẩn trên trang khách.
          </p>
        )}
        {rows.map((row, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-2.5 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-800/40"
          >
            <div
              className="grid flex-1 gap-2"
              style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${columns.length > 3 ? 130 : 180}px, 1fr))` }}
            >
            {columns.map((c) => (
              <input
                key={c.key}
                aria-label={`${c.label} (dòng ${idx + 1})`}
                placeholder={c.label}
                type={c.type || 'text'}
                inputMode={c.type === 'number' ? 'numeric' : undefined}
                min={c.type === 'number' ? 0 : undefined}
                value={row[c.key] ?? ''}
                onChange={(e) => update(idx, c.key, e.target.value)}
                className={inputCls}
              />
            ))}
            </div>
            <button
              type="button"
              onClick={() => remove(idx)}
              className="shrink-0 cursor-pointer rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              Xoá
            </button>
          </div>
        ))}
      </div>
      {rows.length < max && (
        <button
          type="button"
          onClick={add}
          className="mt-2 cursor-pointer rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
        >
          {addLabel}
        </button>
      )}
    </div>
  )
}
