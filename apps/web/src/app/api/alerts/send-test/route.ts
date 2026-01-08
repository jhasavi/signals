import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { sendAlertEmail } from '@/lib/email';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { alertId } = await request.json();

    if (!alertId) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
    }

    // Fetch the alert details
    const alerts = await sql`
      SELECT * FROM saved_searches WHERE id = ${alertId}
    `;

    if (alerts.length === 0) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    const alert = alerts[0] as unknown as any;

    // Verify ownership via cookie - only the creating user may send test emails
    const cookieStore = cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId || alert.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!alert.contact_email) {
      return NextResponse.json(
        { error: 'No email address associated with this alert' },
        { status: 400 }
      );
    }

    // Find matching signals
    const signals = await sql`
      SELECT 
        ls.*,
        lr.address,
        lr.town,
        lr.list_price,
        lr.beds,
        lr.baths,
        lr.sqft,
        lr.property_type
      FROM listing_signals ls
      JOIN listings_raw lr ON ls.mls_id = lr.mls_id
      WHERE lr.town = ${alert.town}
        AND lr.property_type = ${alert.property_type}
        AND (${alert.min_price}::numeric IS NULL OR lr.list_price >= ${alert.min_price})
        AND (${alert.max_price}::numeric IS NULL OR lr.list_price <= ${alert.max_price})
        AND ls.is_primary = true
        AND (${alert.signal_type}::text IS NULL OR ls.signal_type = ${alert.signal_type})
      ORDER BY ls.signal_score DESC
      LIMIT 20
    `;

    if (signals.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No matching opportunities found at this time.',
        matchCount: 0,
      });
    }

    // Send the test email
    await sendAlertEmail(alert.contact_email, alert, signals as unknown as any[]);

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${alert.contact_email} with ${signals.length} opportunities`,
      matchCount: signals.length,
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 });
  }
}
