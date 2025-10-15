import React from 'react';

type StatCardProps = {
  value: string | number;
  label: string;
}

export const StatCard = ({ value, label }: StatCardProps) => {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="text-4xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
};