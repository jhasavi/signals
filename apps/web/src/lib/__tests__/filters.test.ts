import { describe, it, expect } from 'vitest';

// Test price bucket parsing
describe('Price bucket parsing', () => {
  function parsePriceBucket(bucket: string): { min: number; max: number } | null {
    const buckets: Record<string, { min: number; max: number }> = {
      '0-150k': { min: 0, max: 150000 },
      '150k-500k': { min: 150000, max: 500000 },
      '500k-1m': { min: 500000, max: 1000000 },
      '1m-2m': { min: 1000000, max: 2000000 },
      '2m-4m': { min: 2000000, max: 4000000 },
      '4m+': { min: 4000000, max: 999999999 },
    };
    return buckets[bucket] || null;
  }

  it('parses low price bucket correctly', () => {
    const result = parsePriceBucket('0-150k');
    expect(result).toEqual({ min: 0, max: 150000 });
  });

  it('parses mid-range price bucket correctly', () => {
    const result = parsePriceBucket('500k-1m');
    expect(result).toEqual({ min: 500000, max: 1000000 });
  });

  it('parses high price bucket correctly', () => {
    const result = parsePriceBucket('4m+');
    expect(result).toEqual({ min: 4000000, max: 999999999 });
  });

  it('returns null for invalid bucket', () => {
    const result = parsePriceBucket('invalid');
    expect(result).toBeNull();
  });
});

// Test inventory classification
describe('Inventory classification', () => {
  function classifyInventory(count: number): 'low' | 'high' {
    return count < 50 ? 'low' : 'high';
  }

  it('classifies low inventory correctly', () => {
    expect(classifyInventory(30)).toBe('low');
    expect(classifyInventory(49)).toBe('low');
  });

  it('classifies high inventory correctly', () => {
    expect(classifyInventory(50)).toBe('high');
    expect(classifyInventory(100)).toBe('high');
  });
});
