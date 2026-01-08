"use client";

import Link from 'next/link';

interface PropertyTypeToggleProps {
  town: string;
  currentType: string;
  availableTypes: string[];
}

export function PropertyTypeToggle({ town, currentType, availableTypes }: PropertyTypeToggleProps) {
  const typeLabels: Record<string, string> = {
    SF: 'Single Family',
    CC: 'Condo',
    MF: 'Multi-Family',
  };

  return (
    <div className="flex gap-2">
      {availableTypes.map((type) => (
        <Link
          key={type}
          href={`/town/${encodeURIComponent(town)}?type=${type}`}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentType === type
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {typeLabels[type] || type}
        </Link>
      ))}
    </div>
  );
}

interface TimeframeToggleProps {
  town: string;
  propertyType: string;
  currentTimeframe: number;
}

export function TimeframeToggle({ town, propertyType, currentTimeframe }: TimeframeToggleProps) {
  const timeframes = [30, 90, 180];

  return (
    <div className="flex gap-2">
      {timeframes.map((days) => (
        <Link
          key={days}
          href={`/town/${encodeURIComponent(town)}?type=${propertyType}&timeframe=${days}`}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentTimeframe === days
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {days} Days
        </Link>
      ))}
    </div>
  );
}
