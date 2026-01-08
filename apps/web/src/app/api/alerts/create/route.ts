import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      town,
      propertyType,
      signalType,
      minPrice,
      maxPrice,
      minBeds,
      contactEmail,
      contactPhone,
      notifyEmail,
    } = body;

    // Prefer server-side cookie for user id; fall back to generated anon id
    const cookieStore = cookies();
    let userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      userId = `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      try {
        cookies().set('user_id', userId, {
          maxAge: 365 * 24 * 60 * 60,
          httpOnly: true,
          sameSite: 'lax',
        });
      } catch (err) {
        console.warn('Unable to set user_id cookie:', err);
      }
    }

    if (!userId || !town || !propertyType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const email = contactEmail?.trim() || null;
    const phone = contactPhone?.trim() || null;
    const notify = notifyEmail === false ? false : true;

    // Insert saved search
    const result = await sql`
      INSERT INTO saved_searches (
        user_id, name, town, property_type, signal_type,
        min_price, max_price, min_beds,
        contact_email, contact_phone, notify_via_email
      ) VALUES (
        ${userId}, ${name || null}, ${town}, ${propertyType}, ${signalType || null},
        ${minPrice ? parseFloat(minPrice) : null},
        ${maxPrice ? parseFloat(maxPrice) : null},
        ${minBeds ? parseInt(minBeds) : null},
        ${email}, ${phone}, ${notify}
      )
      RETURNING id
    `;

    const alertId = result[0].id;

    // Get match count for this alert
    const matchCount = await sql`
      SELECT COUNT(*) as count
      FROM listing_signals ls
      JOIN listings_raw lr ON ls.mls_id = lr.mls_id
      WHERE lr.town = ${town}
        AND lr.property_type = ${propertyType}
        AND (${signalType}::text IS NULL OR ls.signal_type = ${signalType})
        AND (${minPrice}::numeric IS NULL OR lr.list_price >= ${minPrice})
        AND (${maxPrice}::numeric IS NULL OR lr.list_price <= ${maxPrice})
        AND ls.is_primary = true
    `;

    // cookie is already set above when created; nothing to do here

    return NextResponse.json({
      success: true,
      alertId,
      matchCount: parseInt(matchCount[0].count),
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
  }
}
