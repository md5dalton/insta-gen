/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowDownRight, Check, Sliders } from 'lucide-react';

interface InheritedValueProps {
  label: string;
  explicitValue?: string | null;
  effectiveValue: string;
  sourceLevel?: 'MEDIA' | 'USER' | 'COLLECTION' | 'ROOT_COLLECTION' | 'SYSTEM_DEFAULT';
  sourceName?: string;
  description?: string;
}

export const InheritedValue: React.FC<InheritedValueProps> = ({
  label,
  explicitValue,
  effectiveValue,
  sourceLevel = 'SYSTEM_DEFAULT',
  sourceName,
  description,
}) => {
  const isOverridden = explicitValue !== null && explicitValue !== undefined && explicitValue !== 'INHERIT';

  const levelBadges = {
    MEDIA: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    USER: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    COLLECTION: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ROOT_COLLECTION: 'bg-amber-50 text-amber-700 border-amber-200',
    SYSTEM_DEFAULT: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const levelLabels = {
    MEDIA: 'Direct Override',
    USER: 'User Level',
    COLLECTION: 'Collection Level',
    ROOT_COLLECTION: 'Root Collection Level',
    SYSTEM_DEFAULT: 'System Default',
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <span
          className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${levelBadges[sourceLevel] || levelBadges.SYSTEM_DEFAULT}`}
        >
          {levelLabels[sourceLevel] || 'Inherited'}
        </span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-sm font-semibold text-slate-900">{effectiveValue}</span>
        {isOverridden ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.5 rounded">
            <Sliders className="w-3 h-3" /> Explicit override
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            <ArrowDownRight className="w-3 h-3 text-slate-400" />
            {sourceName ? `from ${sourceName}` : 'inherited'}
          </span>
        )}
      </div>

      {description && <p className="mt-1 text-xs text-slate-500 leading-relaxed">{description}</p>}
    </div>
  );
};
