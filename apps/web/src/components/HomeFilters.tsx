'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface HomeFiltersProps {
  currentFilters: {
    propertyType: string | null;
    priceBucket: string | null;
    minBeds: number | null;
    maxBeds: number | null;
    minBaths: number | null;
    town: string | null;
    signalType: string | null;
    sort: string;
  };
}

const PRICE_BUCKETS = [
  { value: '0-150k', label: 'Under $150K' },
  { value: '150k-500k', label: '$150K-$500K' },
  { value: '500k-1m', label: '$500K-$1M' },
  { value: '1m-2m', label: '$1M-$2M' },
  { value: '2m-4m', label: '$2M-$4M' },
  { value: '4m+', label: '$4M+' },
];

const SIGNAL_TYPES = [
  { value: 'all', label: 'All Signals' },
  { value: 'price-reduction', label: '💰 Price Reductions' },
  { value: 'underpriced', label: '🎯 Below Market' },
  { value: 'new-listing', label: '✨ New Listings' },
  { value: 'back-on-market', label: '🔄 Back on Market' },
  { value: 'high-dom', label: '⏰ Long on Market' },
  { value: 'low-dom', label: '⚡ Moving Fast' },
];

export function HomeFilters({ currentFilters }: HomeFiltersProps) {
  const router = useRouter();

  const [propertyType, setPropertyType] = useState(currentFilters.propertyType || 'all');
  const [priceBucket, setPriceBucket] = useState(currentFilters.priceBucket || 'all');
  const [minBeds, setMinBeds] = useState(currentFilters.minBeds?.toString() || '');
  const [maxBeds, setMaxBeds] = useState(currentFilters.maxBeds?.toString() || '');
  const [minBaths, setMinBaths] = useState(currentFilters.minBaths?.toString() || '');
  const [town, setTown] = useState(currentFilters.town || '');
  const [signalType, setSignalType] = useState(currentFilters.signalType || 'all');
  const [sort, setSort] = useState(currentFilters.sort);

  const applyFilters = () => {
    const params = new URLSearchParams();

    if (propertyType && propertyType !== 'all') params.set('propertyType', propertyType);
    if (priceBucket && priceBucket !== 'all') params.set('priceBucket', priceBucket);
    if (minBeds) params.set('minBeds', minBeds);
    if (maxBeds) params.set('maxBeds', maxBeds);
    if (minBaths) params.set('minBaths', minBaths);
    if (town) params.set('town', town);
    if (signalType && signalType !== 'all') params.set('signalType', signalType);
    if (sort !== 'score') params.set('sort', sort);

    router.push(`/?${params.toString()}`);
  };

  const clearFilters = () => {
    setPropertyType('all');
    setPriceBucket('all');
    setMinBeds('');
    setMaxBeds('');
    setMinBaths('');
    setTown('');
    setSignalType('all');
    setSort('score');
    router.push('/');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filter Opportunities</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Property Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Type
          </label>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="SF">Single Family</option>
            <option value="CC">Condo</option>
            <option value="MF">Multi-Family</option>
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Range
          </label>
          <select
            value={priceBucket}
            onChange={(e) => setPriceBucket(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Prices</option>
            {PRICE_BUCKETS.map((bucket) => (
              <option key={bucket.value} value={bucket.value}>
                {bucket.label}
              </option>
            ))}
          </select>
        </div>

        {/* Signal Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Signal Type
          </label>
          <select
            value={signalType}
            onChange={(e) => setSignalType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {SIGNAL_TYPES.map((signal) => (
              <option key={signal.value} value={signal.value}>
                {signal.label}
              </option>
            ))}
          </select>
        </div>

        {/* Town */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Town
          </label>
          <input
            type="text"
            value={town}
            onChange={(e) => setTown(e.target.value)}
            placeholder="e.g., Cambridge"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Bedrooms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bedrooms
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={minBeds}
              onChange={(e) => setMinBeds(e.target.value)}
              placeholder="Min"
              min="0"
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              value={maxBeds}
              onChange={(e) => setMaxBeds(e.target.value)}
              placeholder="Max"
              min="0"
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Bathrooms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min Bathrooms
          </label>
          <input
            type="number"
            value={minBaths}
            onChange={(e) => setMinBaths(e.target.value)}
            placeholder="Min"
            min="0"
            step="0.5"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Sort */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="score">Best Score</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="newest">Newest First</option>
          </select>
        </div>

        {/* Apply Button */}
        <div className="flex items-end">
          <button
            onClick={applyFilters}
            className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
