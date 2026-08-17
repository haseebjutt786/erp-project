import React from 'react';

const VARIANTS = {
  orange:  'bg-orange-50 text-orange-600',
  blue:    'bg-blue-50 text-blue-600',
  green:   'bg-green-50 text-green-600',
  red:     'bg-red-50 text-red-600',
  purple:  'bg-purple-50 text-purple-600',
  yellow:  'bg-yellow-50 text-yellow-700',
  gray:    'bg-gray-100 text-gray-600',
  teal:    'bg-teal-50 text-teal-600',
};

const STATUS_MAP = {
  'In Progress': 'blue',
  'Planning':    'yellow',
  'Review':      'purple',
  'On Hold':     'gray',
  'Completed':   'green',
  'Done':        'green',
  'Overdue':     'red',
  'Active':      'green',
  'Inactive':    'gray',
  'Present':     'green',
  'Late':        'yellow',
  'Absent':      'red',
  'High':        'red',
  'Medium':      'yellow',
  'Low':         'blue',
  'Pending':     'orange',
  'Approved':    'green',
  'Rejected':    'red',
  'Annual Leave':'blue',
  'Sick Leave':  'green',
  'Casual Leave':'purple',
  'Emergency Leave': 'red',
};

export default function Badge({ label, variant, dot = false }) {
  const v = variant || STATUS_MAP[label] || 'gray';
  const cls = VARIANTS[v] || VARIANTS.gray;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-600 px-2.5 py-0.5 rounded-full ${cls}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {label}
    </span>
  );
}
