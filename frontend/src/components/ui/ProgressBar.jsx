import React from 'react';

export default function ProgressBar({ value = 0, color = '#ff7b0d', height = 6, showLabel = false }) {
  const pct = Math.min(100, Math.max(0, value));
  const getColor = () => {
    if (color) return color;
    if (pct >= 80) return '#18a04b';
    if (pct >= 50) return '#ff7b0d';
    return '#eb0910';
  };
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-gray-500">Progress</span>
          <span className="text-xs font-600 text-gray-700">{pct}%</span>
        </div>
      )}
      <div className="w-full bg-gray-100 rounded-full overflow-hidden" style={{ height }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: getColor() }}
        />
      </div>
    </div>
  );
}
