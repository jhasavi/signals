import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

let sqlClient: any;
if (DATABASE_URL) {
  sqlClient = postgres(DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
} else {
  // Provide a no-op sql tag function so imports during build won't fail.
  // Calls at runtime will throw a helpful error if DATABASE_URL is missing.
  sqlClient = function sqlNoop() {
    throw new Error('DATABASE_URL is not set');
  } as any;
  // allow template tag usage like sql`...` by returning empty array
  sqlClient = ((_strings: any, ..._params: any[]) => {
    return [];
  }) as any;
}

// Provide a small `join` helper so callers can do `sql.join(conditions, sql` AND `)`
// Some versions/packaging of the `postgres` client may not expose `join` directly,
// so attach a compatible helper here.
(sqlClient as any).join = function join(fragments: any[], separator: any) {
  if (!fragments || fragments.length === 0) return (sqlClient as any)``;
  return fragments.slice(1).reduce((acc: any, cur: any) => (sqlClient as any)`${acc}${separator}${cur}`, fragments[0]);
};

export const sql = sqlClient;
