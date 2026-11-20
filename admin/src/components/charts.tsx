import { useState } from 'react';
import { compactUgx } from '../lib/format';

type Point = { label: string; value: number };

export function RevenueChart({ data }: { data: Point[] }) {
  const [active, setActive] = useState<number | null>(null);
  const width = 720;
  const height = 240;
  const pad = { top: 22, right: 24, bottom: 34, left: 58 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const max = 7_000_000;
  const maxIndex = data.reduce(
    (best, point, index) => (point.value > data[best].value ? index : best),
    0,
  );

  const x = (index: number) =>
    pad.left + (data.length === 1 ? chartW / 2 : (index / (data.length - 1)) * chartW);
  const y = (value: number) => pad.top + chartH - (value / max) * chartH;
  const line = data.map((point, index) => `${x(index)},${y(point.value)}`).join(' ');
  const area = `${pad.left},${pad.top + chartH} ${line} ${x(data.length - 1)},${pad.top + chartH}`;
  const activePoint = active == null ? null : data[active];
  const tooltipX =
    active == null ? 0 : Math.min(Math.max(x(active) - 54, pad.left), width - pad.right - 108);

  return (
    <div className="chart-wrap">
      <svg
        className="revenue-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Revenue for the last seven days. Nineteen November was the highest day at UGX 6.3 million."
        onMouseLeave={() => setActive(null)}
      >
        <defs>
          <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#118E45" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#118E45" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {[0, 2, 4, 6].map((value) => {
          const yy = y(value * 1_000_000);
          return (
            <g key={value}>
              <line
                x1={pad.left}
                y1={yy}
                x2={width - pad.right}
                y2={yy}
                stroke="#E7EEE9"
                strokeDasharray={value === 0 ? undefined : '4 6'}
              />
              <text x={pad.left - 12} y={yy + 4} textAnchor="end" className="chart-axis">
                {value === 0 ? 'UGX 0' : `${value}m`}
              </text>
            </g>
          );
        })}
        <polygon points={area} fill="url(#revenue-fill)" />
        <polyline
          points={line}
          fill="none"
          stroke="#118E45"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {data.map((point, index) => (
          <g key={point.label}>
            <text
              x={x(index)}
              y={height - 10}
              textAnchor="middle"
              className="chart-axis chart-axis-x"
            >
              {point.label}
            </text>
            <circle
              cx={x(index)}
              cy={y(point.value)}
              r={index === maxIndex ? 7 : 4}
              fill={index === maxIndex ? '#F7EB15' : '#fff'}
              stroke={index === maxIndex ? '#1A5E2F' : '#118E45'}
              strokeWidth="2.5"
            />
            <rect
              x={x(index) - 26}
              y={pad.top}
              width="52"
              height={chartH}
              fill="transparent"
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              tabIndex={0}
              role="button"
              aria-label={`${point.label}: ${compactUgx(point.value)}`}
            />
          </g>
        ))}
        {activePoint ? (
          <g pointerEvents="none">
            <rect
              x={tooltipX}
              y={Math.max(y(activePoint.value) - 52, 4)}
              width="108"
              height="40"
              rx="10"
              fill="#1C411E"
            />
            <text x={tooltipX + 54} y={Math.max(y(activePoint.value) - 33, 23)} textAnchor="middle" className="chart-tip-label">
              {activePoint.label}
            </text>
            <text x={tooltipX + 54} y={Math.max(y(activePoint.value) - 18, 38)} textAnchor="middle" className="chart-tip-value">
              {compactUgx(activePoint.value)}
            </text>
          </g>
        ) : null}
      </svg>
    </div>
  );
}

export function AreaBars({ data }: { data: { area: string; count: number }[] }) {
  const max = Math.max(...data.map((item) => item.count));
  return (
    <div className="area-bars">
      {data.map((item) => (
        <div className="area-row" key={item.area}>
          <span className="area-name">{item.area}</span>
          <div className="area-track" aria-hidden="true">
            <span style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
          <span className="area-count">{item.count}</span>
        </div>
      ))}
    </div>
  );
}
