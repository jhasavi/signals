# MLS Integration Guide

This document contains essential information for integrating with the MLS (Multiple Listing Service) system, including property data access and photo retrieval.

## Table of Contents

- [Property Data Feeds](#property-data-feeds)
- [Photo Retrieval](#photo-retrieval)
- [Usage Examples](#usage-examples)
- [Authentication](#authentication)
- [Rate Limits and Best Practices](#rate-limits-and-best-practices)

## Property Data Feeds

MLS provides different property type feeds through the following URLs:

### Single Family Homes

```
https://idx.mlspin.com/idx.asp?user=2KzB9t1nMtTtFnNBPt57rdjW2YyL9tYszthNRUut9sKRDHrZh5FoENmNRcv7Z25AxItDOL5fDnqOoPxnPy5&proptype=SF
```

### Condominiums

```
https://idx.mlspin.com/idx.asp?user=2KzB9t1nMtTtFnNBPt57rdjW2YyL9tYszthNRUut9sKRDHrZh5FoENmNRcv7Z25AxItDOL5fDnqOoPxnPy5&proptype=CC
```

### Multi-Family Homes

```
https://idx.mlspin.com/idx.asp?user=2KzB9t1nMtTtFnNBPt57rdjW2YyL9tYszthNRUut9sKRDHrZh5FoENmNRcv7Z25AxItDOL5fDnqOoPxnPy5&proptype=MF
```

## Photo Retrieval

To retrieve listing photos, use the following URL pattern:

```
https://media.mlspin.com/photo.aspx?mls=MLS_NUMBER&n=PHOTO_INDEX&w=WIDTH&h=HEIGHT
```

### Parameters

- `mls`: The MLS number of the property (e.g., `73026808`)
- `n`: The photo index (0-based, where 0 is the first/primary photo)
- `w`: Image width in pixels (optional)
- `h`: Image height in pixels (optional)

### Example

To get the second photo (index 1) for MLS #73026808 with dimensions 1024x768:

```
https://media.mlspin.com/photo.aspx?mls=73026808&n=1&w=1024&h=768
```

## Usage Examples

### Fetching a Property Photo (JavaScript)

```javascript
/**
 * Get a property photo URL
 * @param {string} mlsNumber - The MLS number of the property
 * @param {number} [photoIndex=0] - Index of the photo (0 = primary photo)
 * @param {Object} [dimensions] - Optional width and height
 * @param {number} [dimensions.width] - Desired width in pixels
 * @param {number} [dimensions.height] - Desired height in pixels
 * @returns {string} The photo URL
 */
function getMLSPhotoUrl(mlsNumber, photoIndex = 0, dimensions = {}) {
  const { width, height } = dimensions;
  let url = `https://media.mlspin.com/photo.aspx?mls=${encodeURIComponent(mlsNumber)}&n=${photoIndex}`;

  if (width) url += `&w=${width}`;
  if (height) url += `&h=${height}`;

  return url;
}

// Example usage
const photoUrl = getMLSPhotoUrl('73026808', 1, { width: 1024, height: 768 });
```

## Authentication

- The provided URLs include an authentication token in the query parameters
- Keep these URLs secure and do not expose them in client-side code
- For production use, consider implementing a server-side proxy to protect your credentials

## Rate Limits and Best Practices

1. **Rate Limiting**: Be mindful of rate limits when making requests to the MLS service
2. **Caching**: Implement caching to reduce redundant API calls
3. **Error Handling**: Always include proper error handling for API requests
4. **Data Freshness**: Property data should be refreshed regularly to ensure accuracy
5. **Photo Optimization**: Request appropriately sized images to optimize load times

## Monitoring and Maintenance

- Monitor the integration for any changes in the MLS API
- Keep track of any API version updates or deprecations
- Regularly test the photo retrieval functionality to ensure URLs remain valid

---

_Last Updated: September 23, 2025_
