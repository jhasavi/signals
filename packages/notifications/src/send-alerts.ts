import { Resend } from 'resend';
import { sql } from 'db';

const resend = new Resend(process.env.RESEND_API_KEY);

interface Alert {
  id: number;
  user_id: string;
  name: string;
  town: string;
  property_type: string;
  signal_type: string;
  min_price: number | null;
  max_price: number | null;
  min_beds: number | null;
  contact_email: string;
  notify_via_email: boolean;
}

interface Match {
  mls_id: string;
  address: string;
  town: string;
  list_price: number;
  beds: number;
  signal_type: string;
  signal_score: number;
}

export async function sendAlertDigest() {
  console.log('🔍 Checking for alerts to send...');

  // Get all active alerts with email enabled
  const alerts = await sql<Alert[]>`
    SELECT *
    FROM saved_searches
    WHERE contact_email IS NOT NULL
      AND notify_via_email = true
    ORDER BY contact_email
  `;

  console.log(`Found ${alerts.length} active alerts`);

  // Group by email to send one digest per user
  const alertsByEmail = alerts.reduce(
    (acc, alert) => {
      if (!acc[alert.contact_email]) {
        acc[alert.contact_email] = [];
      }
      acc[alert.contact_email].push(alert);
      return acc;
    },
    {} as Record<string, Alert[]>
  );

  for (const [email, userAlerts] of Object.entries(alertsByEmail)) {
    console.log(`\n📧 Processing ${userAlerts.length} alerts for ${email}`);

    const allMatches: Array<{ alert: Alert; matches: Match[] }> = [];

    for (const alert of userAlerts) {
      const matches = await findMatches(alert);
      if (matches.length > 0) {
        allMatches.push({ alert, matches });
      }
    }

    if (allMatches.length === 0) {
      console.log(`  No new matches for ${email}`);
      continue;
    }

    // Send email
    try {
      await sendDigestEmail(email, allMatches);
      console.log(`  ✅ Sent digest to ${email}`);
    } catch (error) {
      console.error(`  ❌ Failed to send to ${email}:`, error);
    }
  }

  console.log('\n✨ Alert digest complete');
}

async function findMatches(alert: Alert): Promise<Match[]> {
  const conditions = [
    sql`lr.town = ${alert.town}`,
    sql`lr.property_type = ${alert.property_type}`,
    sql`lr.list_price IS NOT NULL`,
  ];

  if (alert.min_price) {
    conditions.push(sql`lr.list_price >= ${alert.min_price}`);
  }
  if (alert.max_price) {
    conditions.push(sql`lr.list_price <= ${alert.max_price}`);
  }
  if (alert.min_beds) {
    conditions.push(sql`lr.beds >= ${alert.min_beds}`);
  }
  if (alert.signal_type) {
    conditions.push(sql`ls.signal_type = ${alert.signal_type}`);
  }

  // Only show listings updated in last 24 hours (new signals)
  conditions.push(sql`ls.computed_at >= NOW() - INTERVAL '24 hours'`);

  const query = sql<Match[]>`
    SELECT 
      lr.mls_id,
      lr.address,
      lr.town,
      lr.list_price,
      lr.beds,
      ls.signal_type,
      ls.signal_score
    FROM listings_raw lr
    JOIN listing_signals ls ON lr.mls_id = ls.mls_id
    WHERE ${sql.join(conditions, sql` AND `)}
      AND ls.is_primary = true
    ORDER BY ls.signal_score DESC
    LIMIT 20
  `;

  return await query;
}

async function sendDigestEmail(
  email: string,
  alertMatches: Array<{ alert: Alert; matches: Match[] }>
) {
  const totalMatches = alertMatches.reduce((sum, am) => sum + am.matches.length, 0);

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; }
    .alert-section { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .listing { background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin: 10px 0; }
    .signal-badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .price { font-size: 20px; font-weight: bold; color: #059669; }
    .btn { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🎯 Market Signals Alert</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">${totalMatches} new ${totalMatches === 1 ? 'property matches' : 'properties match'} your saved searches</p>
    </div>
    
    ${alertMatches
      .map(
        ({ alert, matches }) => `
      <div class="alert-section">
        <h2 style="margin-top: 0;">${alert.name || 'Your Alert'}</h2>
        <p style="color: #6b7280; font-size: 14px;">${alert.town} • ${alert.property_type === 'SF' ? 'Single Family' : alert.property_type === 'CC' ? 'Condo' : 'Multi-Family'}</p>
        
        ${matches
          .map(
            (match) => `
          <div class="listing">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div>
                <div class="signal-badge">${getSignalLabel(match.signal_type)}</div>
                <h3 style="margin: 8px 0;">${match.address}</h3>
                <p style="color: #6b7280; margin: 4px 0;">${match.town} • ${match.beds} beds</p>
                <div class="price">$${match.list_price.toLocaleString()}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 24px; font-weight: bold; color: #7c3aed;">${Math.round(match.signal_score)}</div>
                <div style="font-size: 11px; color: #9ca3af;">Signal Score</div>
              </div>
            </div>
          </div>
        `
          )
          .join('')}
        
        <a href="https://yourdomain.com/town/${encodeURIComponent(alert.town)}/signals?type=${alert.property_type}&signal=${alert.signal_type}" class="btn" style="color: white;">View All Matches →</a>
      </div>
    `
      )
      .join('')}
    
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
      <p>You're receiving this because you created an alert on Market Signals.</p>
      <p><a href="https://yourdomain.com/alerts" style="color: #6b7280;">Manage your alerts</a></p>
    </div>
  </div>
</body>
</html>
  `;

  await resend.emails.send({
    from: 'Market Signals <alerts@yourdomain.com>',
    to: email,
    subject: `🎯 ${totalMatches} New Market Signal${totalMatches === 1 ? '' : 's'} - ${new Date().toLocaleDateString()}`,
    html: htmlBody,
  });
}

function getSignalLabel(type: string): string {
  const labels: Record<string, string> = {
    'price-reduction': 'Price Drop',
    'new-listing': 'New Listing',
    'price-increase': 'Price Increase',
    'back-on-market': 'Back on Market',
    'high-dom': 'Long on Market',
    'low-dom': 'Moving Fast',
    underpriced: 'Below Market',
    overpriced: 'Above Market',
    stale: 'Stale',
    recent_drop: 'Recent Drop',
    likely_cut: 'Likely Cut',
    hot: 'Hot Property',
  };
  return labels[type] || type;
}

// Run if called directly
if (require.main === module) {
  sendAlertDigest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
