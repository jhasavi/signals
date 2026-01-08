import { Resend } from 'resend';

let resend: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  try {
    resend = new Resend(process.env.RESEND_API_KEY);
  } catch (e) {
    console.warn('Resend client not initialized:', e);
    resend = null;
  }
} else {
  console.warn('RESEND_API_KEY not set; email sending disabled');
}
import { computeAndPersistScore } from '@/lib/scoring';

interface Signal {
  signal_type: string;
  signal_score: number;
  metadata?: any;
  address: string;
  town: string;
  list_price: number;
  beds?: number;
  baths?: number;
  sqft?: number;
}

interface Alert {
  town: string;
  property_type: string;
  signal_type?: string;
  min_price?: number;
  max_price?: number;
}

function getSignalEmoji(signalType: string): string {
  const emojis: Record<string, string> = {
    'price-reduction': '💰',
    'new-listing': '✨',
    'price-increase': '📈',
    'back-on-market': '🔄',
    'high-dom': '⏰',
    'low-dom': '⚡',
    underpriced: '🎯',
    overpriced: '🏷️',
  };
  return emojis[signalType] || '📊';
}

function getSignalLabel(signalType: string): string {
  const labels: Record<string, string> = {
    'price-reduction': 'Price Reduction',
    'new-listing': 'New Listing',
    'price-increase': 'Price Increase',
    'back-on-market': 'Back on Market',
    'high-dom': 'Long on Market',
    'low-dom': 'Moving Fast',
    underpriced: 'Below Market',
    overpriced: 'Above Market',
  };
  return labels[signalType] || signalType;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

async function generateEmailHTML(alert: Alert, signals: Signal[]): Promise<string> {
  const propertyTypeLabel =
    alert.property_type === 'SF'
      ? 'Single Family'
      : alert.property_type === 'CC'
        ? 'Condo'
        : 'Multi-Family';

  const signalTypeLabel = alert.signal_type ? getSignalLabel(alert.signal_type) : 'All Signals';

  const cards = await Promise.all(
    signals.map(async (signal) => {
      // compute/persist score breakdown for each signal listing so the email shows it
      try {
        const mlsId = signal.metadata?.mls_id || '';
        const sc = await computeAndPersistScore(
          {
            mls_id: mlsId,
            list_price: signal.list_price || null,
            sqft: signal.sqft || null,
            town: signal.town || alert.town,
            property_type: null,
            dom: null,
          },
          Boolean(signal.signal_score >= 0),
          [signal.signal_type]
        );
        (signal as any).score_breakdown = sc as any;
      } catch (e) {
        // ignore scoring errors for email
      }

      const changePct = signal.metadata?.change_pct || signal.metadata?.price_change_pct;
      return `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: linear-gradient(to bottom right, #ffffff, #f9fafa);">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span style="background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
          ${getSignalEmoji(signal.signal_type)} ${getSignalLabel(signal.signal_type)}
        </span>
        ${changePct ? `<span style="font-size: 14px; font-weight: 500; color: #374151;">${Number(changePct) > 0 ? '+' : ''}${Number(changePct).toFixed(1)}%</span>` : ''}
        <span style="font-size: 12px; color: #6b7280;">Score: ${signal.signal_score}</span>
      </div>
      <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 8px 0;">${signal.address}</h3>
      <div style="display: flex; gap: 16px; font-size: 14px; color: #4b5563; margin-top: 8px;">
        <span style="font-size: 18px; font-weight: 700; color: #2563eb;">${formatPrice(signal.list_price)}</span>
        ${signal.beds ? `<span>${signal.beds} beds</span>` : ''}
        ${signal.baths ? `<span>${signal.baths} baths</span>` : ''}
        ${signal.sqft ? `<span>${signal.sqft.toLocaleString()} sqft</span>` : ''}
      </div>
      ${(signal as any).score_breakdown ? `<div style="margin-top:8px; font-size:13px; color:#374151;"><strong>Score:</strong> ${(signal as any).score_breakdown.finalScore} / 100 — components: pps ${(signal as any).score_breakdown.ppsComponent}, price ${(signal as any).score_breakdown.priceComponent}, dom ${(signal as any).score_breakdown.domComponent}, signal ${(signal as any).score_breakdown.signalComponent}</div>` : ''}
    </div>
    `;
    })
  );

  const signalCardsHtml = cards.join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.5; color: #111827; background: #f3f4f6; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; background: white; padding: 32px; border-radius: 8px; margin-top: 20px; margin-bottom: 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb;">
          <h1 style="font-size: 28px; font-weight: 700; color: #1f2937; margin: 0 0 8px 0;">🎯 Market Signals Alert</h1>
          <p style="font-size: 16px; color: #6b7280; margin: 0;">New opportunities in ${alert.town}</p>
        </div>

        <!-- Alert Summary -->
        <div style="background: linear-gradient(to right, #dbeafe, #e0e7ff); border: 1px solid #93c5fd; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <h2 style="font-size: 18px; font-weight: 600; color: #1e40af; margin: 0 0 12px 0;">Your Alert</h2>
          <div style="font-size: 14px; color: #1e3a8a;">
            <p style="margin: 4px 0;"><strong>Town:</strong> ${alert.town}</p>
            <p style="margin: 4px 0;"><strong>Property Type:</strong> ${propertyTypeLabel}</p>
            <p style="margin: 4px 0;"><strong>Signal Type:</strong> ${signalTypeLabel}</p>
            ${alert.min_price ? `<p style="margin: 4px 0;"><strong>Min Price:</strong> ${formatPrice(alert.min_price)}</p>` : ''}
            ${alert.max_price ? `<p style="margin: 4px 0;"><strong>Max Price:</strong> ${formatPrice(alert.max_price)}</p>` : ''}
          </div>
        </div>

        <!-- Opportunities Count -->
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 48px; font-weight: 700; color: #2563eb;">${signals.length}</div>
          <div style="font-size: 16px; color: #6b7280;">New Opportunities</div>
        </div>

        <!-- Signal Cards -->
        <div style="margin-bottom: 32px;">
          <h2 style="font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 16px;">Top Opportunities</h2>
          ${signalCardsHtml}
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/town/${encodeURIComponent(alert.town)}" 
             style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            View All Opportunities →
          </a>
        </div>

        <!-- Footer -->
        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af;">
          <p style="margin: 4px 0;">This is an automated alert from Market Signals</p>
          <p style="margin: 4px 0;">You're receiving this because you created an alert for ${alert.town}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendAlertEmail(email: string, alert: Alert, signals: Signal[]) {
  const propertyTypeLabel =
    alert.property_type === 'SF'
      ? 'Single Family'
      : alert.property_type === 'CC'
        ? 'Condo'
        : 'Multi-Family';

  const subject = `🎯 ${signals.length} New ${propertyTypeLabel} Opportunities in ${alert.town}`;
  const html = await generateEmailHTML(alert, signals);

  if (!resend) {
    console.warn('Skipping email send; Resend client not configured');
    return;
  }

  await resend.emails.send({
    from: 'Market Signals <alerts@signals.dev>',
    to: email,
    subject,
    html,
  });
}
