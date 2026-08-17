import React from 'react';

export default function Avatar({ initials, color = '#ff7b0d', size = 'md', className = '' }) {
  const sizes = {
    xs:  'w-6 h-6 text-[9px]',
    sm:  'w-8 h-8 text-xs',
    md:  'w-9 h-9 text-sm',
    lg:  'w-11 h-11 text-base',
    xl:  'w-14 h-14 text-lg',
  };
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-700 text-white flex-shrink-0 ${className}`}
      style={{ background: color }}
    >
      {initials}
    </div>
  );
}
