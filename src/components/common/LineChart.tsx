import React, { useMemo } from 'react';

interface LineChartProps {
  points: { t: number; v: number }[];
  height?: number;
  color?: string;
}

/** Dependency-free SVG area/line chart. */
export const LineChart: React.FC<LineChartProps> = ({ points, height = 120, color = '#f4693f' }) => {
  const W = 320;
  const geo = useMemo(() => {
    if (points.length < 2) return null;
    const xs = points.map((p) => p.t);
    const ys = points.map((p) => p.v);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    let minY = Math.min(...ys), maxY = Math.max(...ys);
    if (minY === maxY) { minY -= 1; maxY += 1; }
    const pad = 6;
    const x = (t: number) => pad + ((t - minX) / (maxX - minX || 1)) * (W - pad * 2);
    const y = (v: number) => height - pad - ((v - minY) / (maxY - minY)) * (height - pad * 2);
    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
    const area = `${line} L${x(maxX).toFixed(1)},${height} L${x(minX).toFixed(1)},${height} Z`;
    return { line, area };
  }, [points, height]);

  if (!geo) {
    return <div className="text-xs text-muted py-6 text-center">Not enough data yet. Points are recorded each time balances refresh.</div>;
  }
  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" style={{ height }} role="img" aria-label="Portfolio value over time">
      <path d={geo.area} fill={color} opacity="0.12" />
      <path d={geo.line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};
