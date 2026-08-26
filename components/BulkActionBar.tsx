/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Play, Sliders, Lock, Tag, Trash2, X, RotateCcw } from 'lucide-react';
import { ProcessingProfile, VisibilityType } from '@/types/types';

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkProcess: () => void;
  onBulkAssignProfile: (profileId: string | null) => void;
  onBulkSetVisibility: (vis: VisibilityType | null) => void;
  onBulkAddTag: (tag: string) => void;
  onBulkMarkDeleted: () => void;
  onBulkRestore: () => void;
  profiles: ProcessingProfile[];
  hasDeletedSelected?: boolean;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onClearSelection,
  onBulkProcess,
  onBulkAssignProfile,
  onBulkSetVisibility,
  onBulkAddTag,
  onBulkMarkDeleted,
  onBulkRestore,
  profiles,
  hasDeletedSelected = false,
}) => {
  const [openMenu, setOpenMenu] = useState<'PROFILE' | 'VISIBILITY' | 'TAG' | null>(null);
  const [tagInput, setTagInput] = useState('');

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700/80 px-4 py-2.5 flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-xs font-bold text-white">
          {selectedCount}
        </span>
        <span className="text-xs font-medium text-slate-300">Selected</span>
        <button
          type="button"
          onClick={onClearSelection}
          className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          title="Clear selection"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBulkProcess}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-sm transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Process
        </button>

        {/* Assign Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu(openMenu === 'PROFILE' ? null : 'PROFILE')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-all"
          >
            <Sliders className="w-3.5 h-3.5" />
            Assign Profile
          </button>

          {openMenu === 'PROFILE' && (
            <div className="absolute bottom-full mb-2 left-0 w-60 bg-white rounded-lg shadow-xl border border-slate-200 py-1 text-slate-900 z-50 text-xs">
              <button
                type="button"
                onClick={() => {
                  onBulkAssignProfile(null);
                  setOpenMenu(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-100 font-medium text-indigo-600"
              >
                ● Inherit from parent
              </button>
              <div className="border-t border-slate-100 my-1"></div>
              {profiles.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onBulkAssignProfile(p.id);
                    setOpenMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 font-medium text-slate-800 flex items-center justify-between"
                >
                  <span>{p.name}</span>
                  {p.isSystem && <span className="text-[10px] text-slate-400">System</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Set Visibility Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu(openMenu === 'VISIBILITY' ? null : 'VISIBILITY')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-all"
          >
            <Lock className="w-3.5 h-3.5" />
            Visibility
          </button>

          {openMenu === 'VISIBILITY' && (
            <div className="absolute bottom-full mb-2 left-0 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 text-slate-900 z-50 text-xs">
              <button
                type="button"
                onClick={() => {
                  onBulkSetVisibility(null);
                  setOpenMenu(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-100 font-medium text-indigo-600"
              >
                ● Inherit
              </button>
              <button
                type="button"
                onClick={() => {
                  onBulkSetVisibility('ALL_USERS');
                  setOpenMenu(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-100 font-medium"
              >
                All Users
              </button>
              <button
                type="button"
                onClick={() => {
                  onBulkSetVisibility('RESTRICTED');
                  setOpenMenu(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-100 font-medium"
              >
                Restricted
              </button>
              <button
                type="button"
                onClick={() => {
                  onBulkSetVisibility('PRIVATE');
                  setOpenMenu(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-100 font-medium text-rose-600"
              >
                Private (Admin only)
              </button>
            </div>
          )}
        </div>

        {/* Add Tag */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu(openMenu === 'TAG' ? null : 'TAG')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-all"
          >
            <Tag className="w-3.5 h-3.5" />
            Tag
          </button>

          {openMenu === 'TAG' && (
            <div className="absolute bottom-full mb-2 left-0 w-64 bg-white rounded-lg shadow-xl border border-slate-200 p-2.5 text-slate-900 z-50 text-xs">
              <span className="font-semibold block mb-1.5 text-slate-700">Add tag to selected</span>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="tag-name"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      onBulkAddTag(tagInput.trim());
                      setTagInput('');
                      setOpenMenu(null);
                    }
                  }}
                  className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (tagInput.trim()) {
                      onBulkAddTag(tagInput.trim());
                      setTagInput('');
                      setOpenMenu(null);
                    }
                  }}
                  className="px-2.5 py-1 bg-indigo-600 text-white font-medium rounded text-xs hover:bg-indigo-700"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        {hasDeletedSelected ? (
          <button
            type="button"
            onClick={onBulkRestore}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white shadow-sm transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restore
          </button>
        ) : (
          <button
            type="button"
            onClick={onBulkMarkDeleted}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-medium text-white shadow-sm transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Mark Deleted
          </button>
        )}
      </div>
    </div>
  );
};
