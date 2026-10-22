import React from 'react';

export const Sparkline: React.FC<{ data?: number[]; up: boolean; width?: number; height?: number }> = ({
  data,
  up,
  width = 56,
  height = 24,
}) => {
  if (!data || data.length < 2) return <div style={{ width, height }} />;
  // Downsample to ~28 points
  const step = Math.max(1, Math.floor(data.length / 28));
  const pts = data.filter((_, i) => i % step === 0);
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;
  const d = pts
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${((i / (pts.length - 1)) * width).toFixed(1)},${(height - 2 - ((v - min) / range) * (height - 4)).toFixed(1)}`)
    .join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden="true">
      <path d={d} stroke={up ? '#10b981' : '#f43f5e'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
