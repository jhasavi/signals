'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SavedSearchFormProps {
  userId: string;
  towns: string[];
}

export function SavedSearchForm({ userId, towns }: SavedSearchFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    town: '',
    propertyType: 'SF',
    signalType: '',
    minPrice: '',
    maxPrice: '',
    minBeds: '',
    contactEmail: '',
    contactPhone: '',
    notifyEmail: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<{
    alertId: number;
    matchCount: number;
  } | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/alerts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...formData,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Show success message with match count
        setSuccessMessage({
          alertId: data.alertId,
          matchCount: data.matchCount,
        });

        // Reset form
        setFormData({
          name: '',
          town: '',
          propertyType: 'SF',
          signalType: '',
          minPrice: '',
          maxPrice: '',
          minBeds: '',
          contactEmail: formData.contactEmail, // Keep email for convenience
          contactPhone: '',
          notifyEmail: true,
        });

        // Refresh page to show new alert after a delay
        setTimeout(() => {
          router.refresh();
        }, 5000);
      } else {
        alert('Failed to create alert');
      }
    } catch (error) {
      console.error('Error creating alert:', error);
      alert('Failed to create alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!successMessage) return;

    setIsSendingTest(true);
    try {
      const response = await fetch('/api/alerts/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId: successMessage.alertId }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || 'Test email sent successfully!');
      } else {
        alert('Failed to send test email');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      alert('Failed to send test email');
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Alert Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alert Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Boston Underpriced Condos"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Town */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Town <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.town}
            onChange={(e) => setFormData({ ...formData, town: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a town</option>
            {towns.map((town) => (
              <option key={town} value={town}>
                {town}
              </option>
            ))}
          </select>
        </div>

        {/* Property Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.propertyType}
            onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="SF">Single Family</option>
            <option value="CC">Condo</option>
            <option value="MF">Multi-Family</option>
          </select>
        </div>

        {/* Signal Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Signal Type</label>
          <select
            value={formData.signalType}
            onChange={(e) => setFormData({ ...formData, signalType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Signals</option>
            <option value="price-reduction">Price Reduction</option>
            <option value="underpriced">Below Market</option>
            <option value="new-listing">New Listing</option>
            <option value="back-on-market">Back on Market</option>
            <option value="high-dom">Long on Market</option>
            <option value="low-dom">Moving Fast</option>
            <option value="price-increase">Price Increase</option>
            <option value="overpriced">Above Market</option>
          </select>
        </div>

        {/* Contact Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email for Alerts <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.contactEmail}
            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            required
            placeholder="you@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <label className="mt-2 flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={formData.notifyEmail}
              onChange={(e) => setFormData({ ...formData, notifyEmail: e.target.checked })}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            Send me alerts by email
          </label>
        </div>

        {/* Contact Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone for SMS (optional)
          </label>
          <input
            type="tel"
            value={formData.contactPhone}
            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
            placeholder="555-123-4567"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            SMS not yet sending; stored for future notifications.
          </p>
        </div>

        {/* Min Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
          <input
            type="number"
            value={formData.minPrice}
            onChange={(e) => setFormData({ ...formData, minPrice: e.target.value })}
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Max Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
          <input
            type="number"
            value={formData.maxPrice}
            onChange={(e) => setFormData({ ...formData, maxPrice: e.target.value })}
            placeholder="10000000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Min Beds */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Beds</label>
          <input
            type="number"
            value={formData.minBeds}
            onChange={(e) => setFormData({ ...formData, minBeds: e.target.value })}
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 text-4xl">✅</div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 text-lg mb-2">
                Alert Created Successfully!
              </h3>
              <p className="text-green-800 mb-4">
                {successMessage.matchCount > 0 ? (
                  <>
                    Found{' '}
                    <strong>
                      {successMessage.matchCount} matching{' '}
                      {successMessage.matchCount === 1 ? 'opportunity' : 'opportunities'}
                    </strong>{' '}
                    right now. We'll notify you at <strong>{formData.contactEmail}</strong> when new
                    properties match your criteria.
                  </>
                ) : (
                  <>
                    No matches found at the moment, but we'll notify you at{' '}
                    <strong>{formData.contactEmail}</strong> when properties match your criteria.
                  </>
                )}
              </p>
              {successMessage.matchCount > 0 && (
                <button
                  onClick={handleSendTestEmail}
                  disabled={isSendingTest}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium text-sm flex items-center gap-2"
                >
                  {isSendingTest ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>📧 Send Test Email Now</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={isSubmitting || !formData.town || !formData.contactEmail}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Creating...' : 'Create Alert'}
        </button>
      </div>
    </form>
  );
}
