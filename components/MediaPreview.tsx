/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MediaType } from '@/types/types';
import { Image as ImageIcon, Video, AlertTriangle } from 'lucide-react';

interface MediaPreviewProps {
  url?: string;
  type: MediaType;
  name: string;
  duration?: number;
  isDeleted?: boolean;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
  className?: string;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
  url,
  type,
  name,
  duration,
  isDeleted = false,
  aspectRatio = 'square',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    auto: 'h-full w-full',
  }[aspectRatio];

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-slate-900 flex items-center justify-center select-none ${aspectClasses} ${className}`}
    >
      {url && !hasError ? (
        <img
          src={url}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            isDeleted ? 'opacity-40 grayscale' : ''
          }`}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-1.5 p-3 text-slate-400">
          {type === 'VIDEO' ? <Video className="w-8 h-8 opacity-60" /> : <ImageIcon className="w-8 h-8 opacity-60" />}
          <span className="text-[11px] font-mono text-center text-slate-400 truncate max-w-[120px]">
            {url ? 'Preview error' : 'No thumbnail'}
          </span>
        </div>
      )}

      {/* Type badge overlay */}
      <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/65 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-semibold text-white/90 shadow-sm">
        {type === 'VIDEO' ? <Video className="w-3 h-3 text-sky-400" /> : <ImageIcon className="w-3 h-3 text-emerald-400" />}
        <span>{type}</span>
      </div>

      {/* Video duration badge */}
      {type === 'VIDEO' && duration && (
        <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-white shadow-sm">
          {formatDuration(duration)}
        </div>
      )}

      {/* Soft deletion overlay */}
      {isDeleted && (
        <div className="absolute inset-0 bg-rose-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center p-2 text-center text-rose-200">
          <AlertTriangle className="w-5 h-5 mb-0.5 text-rose-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-900/80 px-2 py-0.5 rounded border border-rose-700/50">
            Soft-Deleted
          </span>
        </div>
      )}
    </div>
  );
};
