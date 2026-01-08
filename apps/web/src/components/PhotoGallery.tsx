'use client';
import React from 'react';

interface Props {
  photoUrls: string[];
  address: string;
}

export default function PhotoGallery({ photoUrls, address }: Props) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {photoUrls.map((url, idx) => (
        <div key={idx} className="relative aspect-video bg-gray-100">
          <img
            src={url}
            alt={`${address} - Photo ${idx + 1}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ))}
    </div>
  );
}
