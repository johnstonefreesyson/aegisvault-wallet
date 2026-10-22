import React from 'react';

export const RowSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => (
  <ul className="space-y-2.5" aria-busy="true" aria-label="Loading">
    {Array.from({ length: rows }).map((_, i) => (
      <li key={i} className="flex items-center gap-3 px-4 py-3.5 rounded-3xl bg-card animate-pulse">
        <div className="w-10 h-10 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-28 rounded bg-slate-200" />
          <div className="h-3 w-16 rounded bg-slate-200" />
        </div>
        <div className="space-y-2 flex flex-col items-end">
          <div className="h-3.5 w-16 rounded bg-slate-200" />
          <div className="h-3 w-10 rounded bg-slate-200" />
        </div>
      </li>
    ))}
  </ul>
);
