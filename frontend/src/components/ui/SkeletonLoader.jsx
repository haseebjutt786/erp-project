import React from 'react';

export function SkeletonBox({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

export function StatCardSkeleton() {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-4">
        <SkeletonBox className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <SkeletonBox className="h-3 w-24 rounded" />
          <SkeletonBox className="h-7 w-16 rounded" />
          <SkeletonBox className="h-3 w-32 rounded" />
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="table-cell">
          <SkeletonBox className="h-4 w-full rounded" />
        </td>
      ))}
    </tr>
  );
}

export function CardSkeleton({ rows = 3 }) {
  return (
    <div className="card p-5 space-y-3">
      <SkeletonBox className="h-5 w-40 rounded" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <SkeletonBox className="w-8 h-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <SkeletonBox className="h-3.5 w-36 rounded" />
            <SkeletonBox className="h-3 w-24 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
