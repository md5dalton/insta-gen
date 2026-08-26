/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Users, Lock, ShieldAlert, Check, AlertCircle, Shield } from 'lucide-react';
import { ProfileUser, VisibilityType } from '@/types/types';

interface AccessPolicyEditorProps {
  visibility?: VisibilityType | null;
  onVisibilityChange: (vis: VisibilityType | null) => void;
  allowedUserIds: string[];
  onAllowedUsersChange: (userIds: string[]) => void;
  allUsers: ProfileUser[];
  allowInherit?: boolean;
  inheritedVisibility?: string;
  parentAllowedUserIds?: string[]; // To highlight parent restriction intersection!
  parentName?: string;
  disabled?: boolean;
}

export const AccessPolicyEditor: React.FC<AccessPolicyEditorProps> = ({
  visibility,
  onVisibilityChange,
  allowedUserIds,
  onAllowedUsersChange,
  allUsers,
  allowInherit = true,
  inheritedVisibility = 'ALL_USERS',
  parentAllowedUserIds,
  parentName,
  disabled = false,
}) => {
  const currentVis = visibility || (allowInherit ? 'INHERIT' : 'ALL_USERS');

  const toggleUser = (userId: string) => {
    if (allowedUserIds.includes(userId)) {
      onAllowedUsersChange(allowedUserIds.filter((id) => id !== userId));
    } else {
      onAllowedUsersChange([...allowedUserIds, userId]);
    }
  };

  const selectAllAllowed = () => {
    // If parent restricts, only add users that parent allows
    if (parentAllowedUserIds && parentAllowedUserIds.length > 0) {
      onAllowedUsersChange(parentAllowedUserIds);
    } else {
      onAllowedUsersChange(allUsers.filter((u) => u.role !== 'ADMIN').map((u) => u.id));
    }
  };

  const clearAllowed = () => {
    onAllowedUsersChange([]);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Visibility Policy
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {allowInherit && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onVisibilityChange(null)}
              className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                currentVis === 'INHERIT'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="p-1.5 rounded bg-slate-100 text-slate-600 mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold text-slate-900 block">Inherit</span>
                <span className="text-xs text-slate-500 block">
                  Effective: <strong className="text-slate-700">{inheritedVisibility}</strong>
                </span>
              </div>
            </button>
          )}

          <button
            type="button"
            disabled={disabled}
            onClick={() => onVisibilityChange('ALL_USERS')}
            className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
              currentVis === 'ALL_USERS'
                ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="p-1.5 rounded bg-emerald-50 text-emerald-600 mt-0.5">
              <Users className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-semibold text-slate-900 block">All Users</span>
              <span className="text-xs text-slate-500 block">Any authenticated application user can view.</span>
            </div>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onVisibilityChange('RESTRICTED')}
            className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
              currentVis === 'RESTRICTED'
                ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="p-1.5 rounded bg-indigo-50 text-indigo-600 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-semibold text-slate-900 block">Restricted</span>
              <span className="text-xs text-slate-500 block">Only explicitly permitted users can access.</span>
            </div>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onVisibilityChange('PRIVATE')}
            className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
              currentVis === 'PRIVATE'
                ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="p-1.5 rounded bg-rose-50 text-rose-600 mt-0.5">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-semibold text-slate-900 block">Private</span>
              <span className="text-xs text-slate-500 block">Only the system administrator can access.</span>
            </div>
          </button>
        </div>
      </div>

      {/* User Permitted List for Restricted Visibility */}
      {currentVis === 'RESTRICTED' && (
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Permitted Application Users
              </span>
              <span className="text-xs text-slate-500">
                Grant VIEW (includes like & save) or DOWNLOAD capabilities.
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAllAllowed}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 underline"
              >
                Select Permitted
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={clearAllowed}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 underline"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Parent restriction explanation note */}
          {parentAllowedUserIds && (
            <div className="flex items-start gap-2 p-2.5 rounded bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Inheritance Rule:</strong> A child can restrict access further, but cannot bypass a parent
                restriction (<code className="font-mono text-[11px]">parent ∩ child</code>). Users blocked by {parentName || 'parent'}
                will not have effective access even if checked here.
              </div>
            </div>
          )}

          <div className="divide-y divide-slate-200 bg-white rounded-md border border-slate-200 overflow-hidden max-h-56 overflow-y-auto">
            {allUsers.map((user) => {
              const isChecked = allowedUserIds.includes(user.id);
              const isBlockedByParent = parentAllowedUserIds && !parentAllowedUserIds.includes(user.id);
              const isAdmin = user.role === 'ADMIN';

              return (
                <label
                  key={user.id}
                  className={`flex items-center justify-between p-2.5 text-xs hover:bg-slate-50 cursor-pointer ${
                    isBlockedByParent ? 'opacity-60 bg-slate-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      disabled={disabled || isAdmin}
                      checked={isAdmin || isChecked}
                      onChange={() => toggleUser(user.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <div>
                      <span className="font-semibold text-slate-900">{user.name}</span>
                      <span className="text-slate-400 ml-2 font-mono text-[11px]">{user.email}</span>
                      {isAdmin && (
                        <span className="ml-2 text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                          Admin (Full Bypass)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {user.capability === 'DOWNLOAD' ? 'View + Download' : user.capability === 'MANAGE' ? 'Manage' : 'View (Like/Save)'}
                    </span>
                    {isBlockedByParent && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Blocked by Parent
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
