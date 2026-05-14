import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

export interface OutcomeDay {
  date: string
  pass: number
  fail: number
}

const W = 720
const PAD = { l: 44, r: 12, t: 16, b: 28 }
const INNER_W = W - PAD.l - PAD.r

interface TooltipInfo {
  day: OutcomeDay
  /** 0–1 fraction of SVG viewBox width */
  xFrac: number
  /** 0–1 fraction of rendered height, pointing at bar top */
  yFrac: number
}

export default function OutcomeChart({
  data,
  height = 220,
}: {
  data: OutcomeDay[]
  height?: number
}) {
  const { t } = useTranslation()
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [containerW, setContainerW] = useState(W)

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setContainerW(entry.contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (data.length === 0) return null

  // compensate for viewBox scaling so text always renders at ~11px
  const scale = containerW / W
  const tickFontSize = Math.round(11 / scale)

  const innerH = height - PAD.t - PAD.b

  // keep a consistent ~12px gap between chart bottom and x-axis label cap-top;
  // extend the viewBox height when the compensated font needs more room than PAD.b allows
  const labelGapVB = 12 / scale
  const labelY = PAD.t + innerH + labelGapVB + tickFontSize * 0.75
  const viewBoxH = Math.ceil(Math.max(height, labelY + tickFontSize * 0.25 + 2))
  const bw = INNER_W / data.length - 6

  const maxTotal = Math.max(...data.map((d) => d.pass + d.fail), 1)
  const yTicks = niceTicks(maxTotal)
  const scaleMax = yTicks[yTicks.length - 1]

  const showTooltip = (d: OutcomeDay, xFrac: number, yFrac: number) =>
    setTooltip({ day: d, xFrac, yFrac })
  const hideTooltip = () => setTooltip(null)

  return (
    <div
      ref={wrapperRef}
      style={{ position: 'relative', aspectRatio: `${W} / ${viewBoxH}` }}
      onTouchStart={hideTooltip}
    >
      <svg
        viewBox={`0 0 ${W} ${viewBoxH}`}
        width="100%"
        height="100%"
        role="img"
        aria-label={t('statistics.chartTitle')}
      >
        {yTicks.map((tick) => {
          const y = PAD.t + innerH - (tick / scaleMax) * innerH
          return (
            <g key={tick}>
              <line
                x1={PAD.l}
                y1={y}
                x2={W - PAD.r}
                y2={y}
                stroke="#DFD8C7"
                strokeWidth="1"
                strokeDasharray={tick === 0 ? '' : '2 3'}
              />
              <text
                x={PAD.l - 8}
                y={y + 4}
                textAnchor="end"
                fontSize={tickFontSize}
                fill="#4D4844"
                fontFamily="JetBrains Mono, monospace"
              >
                {fmtTick(tick)}
              </text>
            </g>
          )
        })}

        {data.map((d, i) => {
          const x = PAD.l + 4 + i * (INNER_W / data.length)
          const passH = (d.pass / scaleMax) * innerH
          const failH = (d.fail / scaleMax) * innerH
          const passY = PAD.t + innerH - passH
          const failY = passY - failH

          const isFirst = i === 0
          const isLast = i === data.length - 1
          const label = isFirst || isLast ? formatLabel(d.date) : null

          const xFrac = (x + bw / 2) / W
          const barTopY = failH > 0 ? failY : passY
          const yFrac = barTopY / height

          const barLabel = t('statistics.chartBarLabel', {
            date: d.date,
            pass: d.pass,
            fail: d.fail,
          })

          return (
            <g
              key={d.date}
              tabIndex={0}
              role="img"
              aria-label={barLabel}
              style={{ cursor: 'default', outline: 'none' }}
              onMouseEnter={() => showTooltip(d, xFrac, yFrac)}
              onMouseLeave={hideTooltip}
              onFocus={() => showTooltip(d, xFrac, yFrac)}
              onBlur={hideTooltip}
              onTouchStart={(e) => {
                e.stopPropagation()
                setTooltip(
                  tooltip?.day.date === d.date
                    ? null
                    : { day: d, xFrac, yFrac },
                )
              }}
            >
              <title>{barLabel}</title>
              {/* wider invisible hit area for easier touch/hover targeting */}
              <rect
                x={x - 3}
                y={PAD.t}
                width={bw + 6}
                height={innerH}
                fill="transparent"
              />
              <rect
                x={x}
                y={passY}
                width={bw}
                height={passH}
                fill="#1B1714"
                rx="1"
              />
              <rect
                x={x}
                y={failY}
                width={bw}
                height={failH}
                fill="#A8392C"
                rx="1"
              />
              {label && (
                <text
                  x={x + bw / 2}
                  y={labelY}
                  textAnchor="middle"
                  fontSize={tickFontSize}
                  fill="#4D4844"
                  fontFamily="Inter, sans-serif"
                >
                  {label}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: `clamp(4px, ${tooltip.xFrac * 100}%, calc(100% - 4px))`,
            top: `${tooltip.yFrac * 100}%`,
            transform: 'translate(-50%, calc(-100% - 6px))',
            background: 'var(--surface)',
            border: '1px solid var(--surface-2)',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 12,
            lineHeight: '1.6',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            zIndex: 20,
          }}
          role="tooltip"
          aria-live="polite"
        >
          <div
            style={{ fontWeight: 600, marginBottom: 2, color: 'var(--ink)' }}
          >
            {tooltip.day.date}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--ink-2)',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                background: '#1B1714',
                display: 'inline-block',
                borderRadius: 1,
                flexShrink: 0,
              }}
              aria-hidden="true"
            />
            {t('statistics.chartPassed')}:{' '}
            <strong style={{ color: 'var(--ink)' }}>{tooltip.day.pass}</strong>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--ink-2)',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                background: '#A8392C',
                display: 'inline-block',
                borderRadius: 1,
                flexShrink: 0,
              }}
              aria-hidden="true"
            />
            {t('statistics.chartFailed')}:{' '}
            <strong style={{ color: 'var(--ink)' }}>{tooltip.day.fail}</strong>
          </div>
        </div>
      )}
    </div>
  )
}

/** Returns 4–5 evenly-spaced "nice" tick values from 0 up to above maxVal. */
function niceTicks(maxVal: number): number[] {
  const step = niceStep(maxVal, 4)
  const ticks: number[] = []
  for (let v = 0; v <= maxVal + step * 0.01; v += step) {
    ticks.push(v)
  }
  // ensure we always have at least the max covered
  if (ticks[ticks.length - 1] < maxVal)
    ticks.push(ticks[ticks.length - 1] + step)
  return ticks
}

function niceStep(maxVal: number, steps: number): number {
  const raw = maxVal / steps
  const exp = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1))))
  const f = raw / exp
  if (f < 1.5) return exp
  if (f < 3.5) return 2 * exp
  if (f < 7.5) return 5 * exp
  return 10 * exp
}

function fmtTick(n: number): string {
  if (n === 0) return '0'
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}k`
  return String(n)
}

function formatLabel(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00Z')
  return d.toLocaleDateString('en-GB', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
