-- Debug script to check listings_raw table structure and sample data
SELECT '=== TABLE STRUCTURE ===' as debug;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'listings_raw' 
ORDER BY ordinal_position;

SELECT '' as debug;
SELECT '=== SAMPLE DATA (5 rows) ===' as debug;
SELECT 
  mls_id, 
  town, 
  dom,
  list_date,
  list_price,
  bedrooms,
  bathrooms,
  property_type,
  status
FROM listings_raw 
LIMIT 5;

SELECT '' as debug;
SELECT '=== TOWN DATA ANALYSIS ===' as debug;
SELECT 
  town,
  COUNT(*) as count,
  CASE WHEN town ~ '^\d+$' THEN 'NUMERIC_CODE' ELSE 'TOWN_NAME' END as town_type
FROM listings_raw 
GROUP BY town
ORDER BY count DESC
LIMIT 20;

SELECT '' as debug;
SELECT '=== DOM DATA ANALYSIS ===' as debug;
SELECT 
  COUNT(*) as total_rows,
  COUNT(CASE WHEN dom IS NULL THEN 1 END) as null_dom,
  COUNT(CASE WHEN dom IS NOT NULL THEN 1 END) as not_null_dom,
  MIN(dom) as min_dom,
  MAX(dom) as max_dom,
  AVG(dom) as avg_dom
FROM listings_raw;

SELECT '' as debug;
SELECT '=== SAMPLE DOM VALUES ===' as debug;
SELECT dom, COUNT(*) FROM listings_raw WHERE dom IS NOT NULL GROUP BY dom ORDER BY COUNT(*) DESC LIMIT 20;
