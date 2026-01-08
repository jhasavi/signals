import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { SavedSearchForm } from '@/components/SavedSearchForm';
import { getSignalLabel } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface SavedSearch {
  id: number;
  name: string;
  town: string;
  property_type: string;
  signal_type: string;
  min_price: number;
  max_price: number;
  min_beds: number;
  contact_email: string | null;
  contact_phone: string | null;
  notify_via_email: boolean | null;
  created_at: string;
}

function getOrCreateUserId(): string {
  const cookieStore = cookies();
  let userId = cookieStore.get('user_id')?.value;

  if (!userId) {
    userId = `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    // Persist the generated id as a cookie so subsequent requests are scoped
    try {
      cookies().set('user_id', userId, {
        maxAge: 365 * 24 * 60 * 60,
        httpOnly: true,
        sameSite: 'lax',
      });
    } catch (err) {
      // cookies().set may throw in some environments; fallback silently
      console.warn('Unable to set user_id cookie:', err);
    }
  }

  return userId;
}

async function getSavedSearches(userId: string): Promise<SavedSearch[]> {
  const searches = await sql`
    SELECT *
    FROM saved_searches
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;

  return searches as unknown as SavedSearch[];
}

async function getTowns(): Promise<string[]> {
  const towns = await sql`
    SELECT DISTINCT town
    FROM listings_raw
    WHERE town IS NOT NULL
      AND town != ''
      AND town !~ '^[0-9]+[A-Z]?$'
      AND list_price IS NOT NULL
    ORDER BY town
  `;

  return towns.map((t: any) => t.town);
}

export default async function AlertsPage() {
  const userId = getOrCreateUserId();
  const savedSearches = await getSavedSearches(userId);
  const availableTowns = await getTowns();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Saved Alerts</h1>
        <p className="mt-2 text-gray-600">
          Get notified when properties match your criteria with market signals like price drops,
          underpriced listings, or hot properties moving fast.
        </p>
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">💡 How Alerts Work</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • <strong>Smart Signals</strong>: Unlike basic price alerts, we analyze days on
              market, price changes, and how listings compare to their neighborhood.
            </li>
            <li>
              • <strong>Email Notifications</strong>: Get daily digest emails when new properties
              match your saved searches (email delivery coming soon).
            </li>
            <li>
              • <strong>Real-time Access</strong>: Click "View Results" on any alert to see current
              matches instantly.
            </li>
          </ul>
        </div>
      </div>

      {/* Create New Alert Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Create New Alert</h2>
        <p className="text-sm text-gray-600 mb-4">
          Define your search criteria and we'll track matching properties with actionable market
          signals.
        </p>
        <SavedSearchForm userId={userId} towns={availableTowns} />
      </div>

      {/* Saved Searches List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Your Alerts</h2>
        </div>

        {savedSearches.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No saved alerts yet. Create one above to get started.
          </div>
        ) : (
          <div className="divide-y">
            {savedSearches.map((search) => (
              <div key={search.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {search.name || 'Untitled Alert'}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Location:</span> {search.town}
                      </div>
                      <div>
                        <span className="font-medium">Type:</span>{' '}
                        {search.property_type === 'SF'
                          ? 'Single Family'
                          : search.property_type === 'CC'
                            ? 'Condo'
                            : 'Multi-Family'}
                      </div>
                      {search.signal_type && (
                        <div>
                          <span className="font-medium">Signal:</span>{' '}
                          {getSignalLabel(search.signal_type)}
                        </div>
                      )}
                      {(search.min_price || search.max_price) && (
                        <div>
                          <span className="font-medium">Price:</span>{' '}
                          {search.min_price
                            ? `$${Number(search.min_price).toLocaleString()}`
                            : 'Any'}{' '}
                          -{' '}
                          {search.max_price
                            ? `$${Number(search.max_price).toLocaleString()}`
                            : 'Any'}
                        </div>
                      )}
                      {search.min_beds && (
                        <div>
                          <span className="font-medium">Min Beds:</span> {search.min_beds}
                        </div>
                      )}
                      {search.contact_email && (
                        <div>
                          <span className="font-medium">Email:</span> {search.contact_email}
                          {search.notify_via_email === false && ' (notifications off)'}
                        </div>
                      )}
                      {search.contact_phone && (
                        <div>
                          <span className="font-medium">SMS:</span> {search.contact_phone}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Created {new Date(search.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={`/town/${encodeURIComponent(search.town)}/signals?type=${search.property_type}&signal=${search.signal_type || 'likely_cut'}${search.min_price ? `&minPrice=${search.min_price}` : ''}${search.max_price ? `&maxPrice=${search.max_price}` : ''}${search.min_beds ? `&minBeds=${search.min_beds}` : ''}`}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View Results
                    </a>
                    <form action="/api/alerts/delete" method="POST">
                      <input type="hidden" name="id" value={search.id} />
                      <input type="hidden" name="userId" value={userId} />
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
