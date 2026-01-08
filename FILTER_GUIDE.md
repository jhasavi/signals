# Filter Usage Guide

## Overview

The Market Signals platform provides comprehensive filtering capabilities to help you find exactly the properties you're looking for. Filters work on the `/town/[town]/signals` page and can be combined for precise searches.

## Available Filters

### 1. Property Type

Switch between:
- **Single Family (SF)**: Detached homes
- **Condo (CC)**: Condominiums and townhouses
- **Multi-Family (MF)**: 2+ unit buildings

**How to use**: Click the property type buttons at the top of the filter panel.

**Example**: Find only condos with price reductions in Boston.

---

### 2. Price Range Buckets

Quick price range selection:
- Under $150K
- $150K - $500K
- $500K - $1M
- $1M - $2M
- $2M - $4M
- $4M+

**How to use**: Select from the "Price Range" dropdown.

**Example**: Find underpriced properties in the $500K-$1M range.

**Note**: Price bucket overrides manual min/max price inputs.

---

### 3. Inventory Level

Filter by market supply:
- **Low Inventory**: Towns with < 50 active listings (hot markets, limited supply)
- **High Inventory**: Towns with ≥ 50 active listings (more buyer leverage)

**How to use**: Select from the "Inventory Level" dropdown.

**Example**: Find price reductions in low-inventory towns (seller's market becoming buyer's opportunity).

**Use cases**:
- **Low inventory + Price drop**: Unusual opportunity in hot market
- **High inventory + High DOM**: Strong negotiation position

---

### 4. Bedrooms

Set minimum and/or maximum bedroom count.

**How to use**: Enter numbers in "Min Beds" and "Max Beds" fields.

**Examples**:
- Min: 3 → Find 3+ bedroom homes
- Min: 2, Max: 3 → Find 2-3 bedroom properties
- Max: 1 → Find studios and 1-beds

---

### 5. Bathrooms

Set minimum and/or maximum bathroom count (supports half-baths).

**How to use**: Enter numbers in "Min Baths" and "Max Baths" fields (use 0.5 increments for half-baths).

**Examples**:
- Min: 2 → Properties with at least 2 bathrooms
- Min: 1.5, Max: 2.5 → Properties with 1.5 to 2.5 baths

---

### 6. Days on Market (DOM)

Filter by how long properties have been listed.

**How to use**: Enter numbers in "Min Days on Market" and "Max Days on Market" fields.

**Examples**:
- Min: 60 → Only properties on market 60+ days (potential deals)
- Max: 7 → Only fresh listings (< 1 week old)
- Min: 30, Max: 90 → Properties sitting 1-3 months

**Use cases**:
- **High DOM + Price reduction**: Motivated sellers
- **Low DOM**: Hot properties moving fast

---

### 7. Status

Filter by listing status:
- **Active**: Currently on market
- **Pending**: Offer accepted, pending closing
- **Under Agreement**: Similar to Pending

**How to use**: Select from the "Status" dropdown.

**Example**: Find only active listings to avoid closed deals.

---

### 8. Sort Order

Order results by:
- **Signal Score**: Highest opportunity score first (default)
- **Price (Low to High)**: Cheapest first
- **Days on Market**: Longest on market first
- **Newest First**: Most recently listed first

**How to use**: Select from the "Sort By" dropdown.

---

## Filter Combinations (Real Examples)

### Example 1: First-Time Buyer in Hot Market
```
Property Type: Condo
Price Range: $150K - $500K
Inventory: Low
Min Beds: 2
Status: Active
Signal: price-reduction
Sort: Signal Score
```
**Result**: Condos in hot markets with recent price drops – rare opportunities.

---

### Example 2: Investor Looking for Deals
```
Property Type: Multi-Family
Price Range: $500K - $1M
Min DOM: 90
Signal: underpriced
Sort: Signal Score
```
**Result**: Multi-family properties sitting long and priced below market – strong negotiation position.

---

### Example 3: Luxury Home Buyer
```
Property Type: Single Family
Price Range: $2M - $4M
Min Beds: 4
Min Baths: 3
Inventory: High
Sort: DOM
```
**Result**: Large luxury homes in areas with good inventory – buyer's market conditions.

---

### Example 4: Quick Move-In
```
Property Type: Single Family
Price Range: $500K - $1M
Max DOM: 30
Status: Active
Min Beds: 3
Signal: new-listing
Sort: Newest First
```
**Result**: Fresh 3+ bedroom homes just hitting the market.

---

### Example 5: Value Hunter
```
Property Type: Condo
Min Beds: 2
Min Baths: 2
Signal: underpriced
Inventory: Low
Sort: Signal Score
```
**Result**: 2BR/2BA condos priced below market in competitive areas.

---

## Tips for Effective Filtering

1. **Start Broad**: Begin with property type and price range, then narrow down.

2. **Use Signal Types**: Each signal page already filters by signal type (e.g., price-reduction, underpriced). Additional filters refine within that signal.

3. **Inventory Context**: 
   - Low inventory + Price drop = Unusual opportunity
   - High inventory + High DOM = Buyer leverage

4. **DOM Sweet Spot**: Properties at 30-90 days often have motivated sellers without being stale.

5. **Combine Complementary Filters**: 
   - Underpriced + Low DOM = Hot deal
   - High DOM + Price reduction = Very motivated seller

6. **Clear Filters**: Use the "Clear" button to reset and start over.

7. **Save Successful Searches**: Once you find a good filter combo, save it as an Alert to get email notifications.

---

## URL Parameters (Advanced)

Filters are stored in URL parameters, so you can bookmark or share searches:

```
/town/Boston/signals?type=CC&priceBucket=500k-1m&inventory=low&minBeds=2&signal=underpriced
```

**Parameters**:
- `type`: SF, CC, or MF
- `priceBucket`: 0-150k, 150k-500k, 500k-1m, 1m-2m, 2m-4m, 4m+
- `inventory`: low or high
- `minBeds`, `maxBeds`: Integer
- `minBaths`, `maxBaths`: Decimal (e.g., 1.5)
- `minDom`, `maxDom`: Integer
- `status`: Active, Pending, or Under Agreement
- `sort`: score, price, dom, or newest
- `signal`: price-reduction, underpriced, etc.

---

## Filter Limits

- Results are limited to 200 listings per query for performance
- If you see exactly 200 results, try adding more filters to narrow down

---

## Questions?

- **Not finding results?** Try removing some filters or broadening price range
- **Too many results?** Add more specific filters (beds, baths, DOM range)
- **Inventory filter not working?** Some small towns may not meet the inventory threshold

For more help, see the main [USER_GUIDE.md](USER_GUIDE.md).
