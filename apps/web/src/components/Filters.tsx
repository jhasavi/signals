'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface FiltersProps {
  town: string;
  propertyType: string;
  signalType: string;
  currentFilters: {
    minPrice: number | null;
    maxPrice: number | null;
    minBeds: number | null;
    maxBeds: number | null;
    minBaths: number | null;
    maxBaths: number | null;
    minDom: number | null;
    maxDom: number | null;
    priceBucket: string | null;
    inventory: string | null;
    status: string | null;
    sort: string;
  };
}

export function Filters({ town, propertyType, signalType, currentFilters }: FiltersProps) {
  const router = useRouter();

  const [selectedPropertyType, setSelectedPropertyType] = useState(propertyType);
  const [priceBucket, setPriceBucket] = useState(currentFilters.priceBucket || '');
  const [minPrice, setMinPrice] = useState(currentFilters.minPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice?.toString() || '');
  const [minBeds, setMinBeds] = useState(currentFilters.minBeds?.toString() || '');
  const [maxBeds, setMaxBeds] = useState(currentFilters.maxBeds?.toString() || '');
  const [minBaths, setMinBaths] = useState(currentFilters.minBaths?.toString() || '');
  const [maxBaths, setMaxBaths] = useState(currentFilters.maxBaths?.toString() || '');
  const [minDom, setMinDom] = useState(currentFilters.minDom?.toString() || '');
  const [maxDom, setMaxDom] = useState(currentFilters.maxDom?.toString() || '');
  const [inventory, setInventory] = useState(currentFilters.inventory || 'any');
  const [status, setStatus] = useState(currentFilters.status || 'any');
  const [sort, setSort] = useState(currentFilters.sort);

  const applyFilters = () => {
    const params = new URLSearchParams();
    params.set('type', selectedPropertyType);
    params.set('signal', signalType);

    if (priceBucket) params.set('priceBucket', priceBucket);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (minBeds) params.set('minBeds', minBeds);
    if (maxBeds) params.set('maxBeds', maxBeds);
    if (minBaths) params.set('minBaths', minBaths);
    if (maxBaths) params.set('maxBaths', maxBaths);
    if (minDom) params.set('minDom', minDom);
    if (maxDom) params.set('maxDom', maxDom);
    if (inventory && inventory !== 'any') params.set('inventory', inventory);
    if (status && status !== 'any') params.set('status', status);
    if (sort) params.set('sort', sort);

    router.push(`/town/${encodeURIComponent(town)}/signals?${params.toString()}`);
  };

  const clearFilters = () => {
    setSelectedPropertyType(propertyType);
    setPriceBucket('');
    setMinPrice('');
    setMaxPrice('');
    setMinBeds('');
    setMaxBeds('');
    setMinBaths('');
    setMaxBaths('');
    setMinDom('');
    setMaxDom('');
    setInventory('any');
    setStatus('any');
    setSort('score');
    router.push(
      `/town/${encodeURIComponent(town)}/signals?type=${propertyType}&signal=${signalType}`
    );
  };

  const priceBuckets = [
    { value: '', label: 'All Prices' },
    { value: '0-150k', label: 'Under $150K' },
    { value: '150k-500k', label: '$150K - $500K' },
    { value: '500k-1m', label: '$500K - $1M' },
    { value: '1m-2m', label: '$1M - $2M' },
    { value: '2m-4m', label: '$2M - $4M' },
    { value: '4m+', label: '$4M+' },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>

      {/* Property Type Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
        <div className="flex gap-2">
          {['SF', 'CC', 'MF'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedPropertyType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPropertyType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type === 'SF' ? 'Single Family' : type === 'CC' ? 'Condo' : 'Multi-Family'}
            </button>
          ))}
        </div>
      </div>

      {/* Price Bucket Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
        <select
          value={priceBucket}
          onChange={(e) => {
            setPriceBucket(e.target.value);
            // Clear manual price inputs when bucket is selected
            if (e.target.value) {
              setMinPrice('');
              setMaxPrice('');
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          {priceBuckets.map((bucket) => (
            <option key={bucket.value} value={bucket.value}>
              {bucket.label}
            </option>
          ))}
        </select>
      </div>

      {/* Inventory Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Inventory Level</label>
        <select
          value={inventory}
          onChange={(e) => setInventory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="any">Any Inventory</option>
          <option value="low">Low Inventory (&lt; 50 listings)</option>
          <option value="high">High Inventory (≥ 50 listings)</option>
        </select>
      </div>

      <div className="border-t pt-4 mt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Advanced Filters</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Min Beds */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Beds</label>
          <input
            type="number"
            value={minBeds}
            onChange={(e) => setMinBeds(e.target.value)}
            placeholder="Any"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Max Beds */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Beds</label>
          <input
            type="number"
            value={maxBeds}
            onChange={(e) => setMaxBeds(e.target.value)}
            placeholder="Any"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Min Baths */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Baths</label>
          <input
            type="number"
            step="0.5"
            value={minBaths}
            onChange={(e) => setMinBaths(e.target.value)}
            placeholder="Any"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Max Baths */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Baths</label>
          <input
            type="number"
            step="0.5"
            value={maxBaths}
            onChange={(e) => setMaxBaths(e.target.value)}
            placeholder="Any"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Min DOM */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Days on Market</label>
          <input
            type="number"
            value={minDom}
            onChange={(e) => setMinDom(e.target.value)}
            placeholder="Any"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Max DOM */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Days on Market</label>
          <input
            type="number"
            value={maxDom}
            onChange={(e) => setMaxDom(e.target.value)}
            placeholder="Any"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="any">Any Status</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Under Agreement">Under Agreement</option>
          </select>
        </div>

        {/* Sort */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="score">Signal Score</option>
            <option value="price">Price (Low to High)</option>
            <option value="dom">Days on Market</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={applyFilters}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Apply Filters
        </button>
        <button
          onClick={clearFilters}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
