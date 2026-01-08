import { describe, it, expect } from 'vitest';
import { validatePrice, validateSqft, validatePps, sanitizeListing } from '../validation';

describe('validation utilities', () => {
  it('validatePrice: returns null for invalid values', () => {
    expect(validatePrice(null)).toBeNull();
    expect(validatePrice(undefined)).toBeNull();
    expect(validatePrice(10)).toBeNull();
    expect(validatePrice(1e9)).toBeNull();
    expect(validatePrice(Number.NaN)).toBeNull();
  });

  it('validatePrice: rounds and accepts valid prices', () => {
    expect(validatePrice(25000.4)).toBe(25000);
    expect(validatePrice(20000)).toBe(20000);
  });

  it('validateSqft: returns null for invalid values', () => {
    expect(validateSqft(null)).toBeNull();
    expect(validateSqft(10)).toBeNull();
    expect(validateSqft(99999)).toBeNull();
  });

  it('validateSqft: rounds and accepts valid sqft', () => {
    expect(validateSqft(1500.7)).toBe(1501);
  });

  it('validatePps: returns null for invalid values and accepts valid', () => {
    expect(validatePps(null)).toBeNull();
    expect(validatePps(1)).toBeNull();
    expect(validatePps(6000)).toBeNull();
    expect(validatePps(150)).toBe(150);
  });

  it('sanitizeListing: maps values through validators', () => {
    const out = sanitizeListing({ list_price: 25000.4, sqft: 1200.9 });
    expect(out.list_price).toBe(25000);
    expect(out.sqft).toBe(1201);
  });
});
