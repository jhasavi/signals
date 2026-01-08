'use client';
import React, { useState } from 'react';

interface Props {
  score?: number | null;
  components?: any | null;
}

export default function ScoreBreakdown({ score, components }: Props) {
  const [open, setOpen] = useState(false);
  const openModal = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOpen(true);
  };
  const closeModal = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOpen(false);
  };

  const pps = components?.ppsComponent ? Math.round(components.ppsComponent) : '—';
  const price = components?.priceComponent ? Math.round(components.priceComponent) : '—';
  const dom = components?.domComponent !== undefined ? Math.round(components.domComponent) : '—';
  const signal =
    components?.signalComponent !== undefined ? Math.round(components.signalComponent) : '—';
  const total =
    components?.finalScore !== undefined ? Math.round(components.finalScore) : (score ?? '—');

  return (
    <>
      <button
        onClick={openModal}
        onMouseDown={(e) => e.stopPropagation()}
        className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-700 text-xs hover:bg-gray-200"
        aria-label="Open score breakdown"
        title="Open score breakdown"
      >
        i
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold">Score Breakdown</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="text-sm text-gray-700 space-y-3">
              <div className="flex justify-between">
                <span>Computed score</span>
                <span className="font-semibold">
                  {typeof total === 'number' ? `${total} / 100` : total}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Price / sqft component</span>
                <span className="font-semibold">{pps === '—' ? '—' : `${pps} pts`}</span>
              </div>
              <div className="flex justify-between">
                <span>Price vs town avg</span>
                <span className="font-semibold">{price === '—' ? '—' : `${price} pts`}</span>
              </div>
              <div className="flex justify-between">
                <span>Days on market</span>
                <span className="font-semibold">{dom === '—' ? '—' : `${dom} pts`}</span>
              </div>
              <div className="flex justify-between">
                <span>Signal presence</span>
                <span className="font-semibold">{signal === '—' ? '—' : `${signal} pts`}</span>
              </div>

              {components?.medians && (
                <div className="pt-3 border-t">
                  <div className="text-xs text-gray-500 mb-2">
                    Town medians (used for comparables)
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                    <div>
                      Price:{' '}
                      <span className="font-medium">
                        {components.medians.price
                          ? `$${Math.round(components.medians.price)}`
                          : '—'}
                      </span>
                    </div>
                    <div>
                      Sqft:{' '}
                      <span className="font-medium">
                        {components.medians.sqft ? Math.round(components.medians.sqft) : '—'}
                      </span>
                    </div>
                    <div>
                      $ / sqft:{' '}
                      <span className="font-medium">
                        {components.medians.pps ? `$${Math.round(components.medians.pps)}` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
