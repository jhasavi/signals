import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

const result = await sql`
  SELECT DISTINCT status, COUNT(*)::int as count 
  FROM listings_raw 
  GROUP BY status 
  ORDER BY count DESC
`;

console.log('Status values in database:');
console.table(result);

await sql.end();
