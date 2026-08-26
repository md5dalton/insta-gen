/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MediaItem, ProcessingProfile, ProfileUser } from '@/types/types';
import { StatusBadge } from './StatusBadge';
import { MediaPreview } from './MediaPreview';
import { PolicySelector } from './PolicySelector';
import { AccessPolicyEditor } from './AccessPolicyEditor';
import {
  X,
  Play,
  RotateCcw,
  Trash2,
  Tag,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Lock,
  User,
  FolderTree,
  Calendar,
  HardDrive,
  Maximize2,
  FileCode,
  Shield,
  Sliders,
} from 'lucide-react';

interface MediaDetailModalProps {
  media: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onProcess: (id: string) => Promise<void>;
  onRetry: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
  onUpdatePolicy: (id: string, profileId: string | null) => Promise<void>;
  onUpdateAccess: (id: string, data: { visibility?: string | null; allowedUserIds?: string[] }) => Promise<void>;
  profiles: ProcessingProfile[];
  users: ProfileUser[];
}

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  media,
  isOpen,
  onClose,
  onProcess,
  onRetry,
  onDelete,
  onRestore,
  onUpdatePolicy,
  onUpdateAccess,
  profiles,
  users,
}) => {
  if (!isOpen || !media) return null;

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PROCESSING' | 'ACCESS'>('OVERVIEW');
  const [editingPolicy, setEditingPolicy] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(media.processingProfileId || null);
  const [editingAccess, setEditingAccess] = useState(false);
  const [selectedVisibility, setSelectedVisibility] = useState<any>(media.visibility || null);
  const [selectedAllowedUsers, setSelectedAllowedUsers] = useState<string[]>(media.allowedUserIds || []);
  const [actionLoading, setActionLoading] = useState(false);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleSavePolicy = async () => {
    setActionLoading(true);
    try {
      await onUpdatePolicy(media.id, selectedProfileId);
      setEditingPolicy(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveAccess = async () => {
    setActionLoading(true);
    try {
      await onUpdateAccess(media.id, {
        visibility: selectedVisibility,
        allowedUserIds: selectedAllowedUsers,
      });
      setEditingAccess(false);
    } finally {
      setActionLoading(false);
    }
  };

  const isEffectivelyDeleted = media.isEffectivelyDeleted;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3 truncate pr-4">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <FileCode className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h2 className="text-base font-bold text-slate-900 truncate font-mono">{media.name}</h2>
              <p className="text-xs text-slate-500 truncate">
                {media.rootCollectionName} / {media.collectionName} / @{media.userName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge type="processing" value={media.processingStatus} />
            {isEffectivelyDeleted && <StatusBadge type="deletion" value="DELETED" />}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'OVERVIEW'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Overview & Metadata
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PROCESSING')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'PROCESSING'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Processing & Renditions
            {media.effectivePolicy?.missingAssets && media.effectivePolicy.missingAssets.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ACCESS')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'ACCESS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Access & Permissions
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Media Preview Box */}
              <div className="md:col-span-5 flex flex-col gap-3">
                <MediaPreview
                  url={media.previewUrl || media.thumbnailUrl}
                  type={media.type}
                  name={media.name}
                  duration={media.duration}
                  isDeleted={isEffectivelyDeleted}
                  aspectRatio="auto"
                  className="h-64 sm:h-72 w-full rounded-xl"
                />

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Source Filesystem Path:</span>
                  </div>
                  <div className="font-mono text-[11px] bg-white p-2 rounded border border-slate-200 text-slate-800 break-all select-all">
                    {media.path}
                  </div>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="md:col-span-7 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-medium text-slate-500 block uppercase">Type</span>
                    <span className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5">
                      {media.type}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-medium text-slate-500 block uppercase">File Size</span>
                    <span className="text-sm font-semibold text-slate-900 mt-0.5 block">{formatBytes(media.size)}</span>
                  </div>

                  {media.width && media.height && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[11px] font-medium text-slate-500 block uppercase">Dimensions</span>
                      <span className="text-sm font-semibold text-slate-900 mt-0.5 block">
                        {media.width} × {media.height} px
                      </span>
                    </div>
                  )}

                  {media.duration && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[11px] font-medium text-slate-500 block uppercase">Duration</span>
                      <span className="text-sm font-semibold text-slate-900 mt-0.5 block">
                        {media.duration.toFixed(1)}s ({Math.floor(media.duration / 60)}:
                        {Math.floor(media.duration % 60).toString().padStart(2, '0')})
                      </span>
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-medium text-slate-500 block uppercase">Owner / User</span>
                    <span className="text-sm font-semibold text-slate-900 mt-0.5 block">@{media.userName}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-medium text-slate-500 block uppercase">Collection</span>
                    <span className="text-sm font-semibold text-slate-900 mt-0.5 block truncate">
                      {media.collectionName}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
                    Media Tags
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {media.tags && media.tags.length > 0 ? (
                      media.tags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200"
                        >
                          <Tag className="w-3 h-3 text-slate-400" />
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No tags assigned</span>
                    )}
                  </div>
                </div>

                {/* Soft-deletion state banner */}
                {isEffectivelyDeleted && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      Marked as Soft-Deleted
                    </div>
                    <p className="text-rose-700">
                      Reason: {media.effectiveDeletionSource || 'Marked deleted'}. This item is waiting for filesystem cleanup
                      and will not be permanently destroyed by the dashboard.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PROCESSING */}
          {activeTab === 'PROCESSING' && (
            <div className="space-y-6">
              {/* Effective Policy Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Effective Processing Policy
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <h3 className="text-base font-bold text-slate-900">
                      {media.effectivePolicy?.profile.name || 'System Default'}
                    </h3>
                    <span className="text-xs font-medium text-slate-600 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                      {media.effectivePolicy?.inheritedFrom.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {media.effectivePolicy?.profile.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPolicy(!editingPolicy)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    {editingPolicy ? 'Cancel Override' : 'Configure Override'}
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => onProcess(media.id)}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Trigger Processing
                  </button>
                </div>
              </div>

              {/* Policy Override Editor */}
              {editingPolicy && (
                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 space-y-4">
                  <PolicySelector
                    profiles={profiles}
                    value={selectedProfileId}
                    onChange={setSelectedProfileId}
                    inheritedProfileName={media.effectivePolicy?.profile.name}
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingPolicy(false)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleSavePolicy}
                      className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Save Policy Override
                    </button>
                  </div>
                </div>
              )}

              {/* Failure Error Card */}
              {media.processingError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      Processing Failure at {media.processingError.stage}
                    </div>
                    <button
                      type="button"
                      onClick={() => onRetry(media.id)}
                      className="px-3 py-1 text-xs font-semibold bg-rose-600 text-white rounded-md hover:bg-rose-700 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Retry Stage
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono bg-rose-900/10 p-2.5 rounded border border-rose-200 text-rose-900 overflow-x-auto">
                    {media.processingError.message}
                  </pre>
                  <span className="text-[10px] text-rose-500">
                    Logged at {new Date(media.processingError.timestamp).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Rendition / Asset Status Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Asset Renditions
                  </h4>
                  <span className="text-xs text-slate-500">
                    Thumbnail is <strong>mandatory</strong> for all media.
                  </span>
                </div>

                <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden bg-white">
                  {/* Thumbnail Row */}
                  <div className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <div>
                        <span className="font-semibold text-slate-900">Thumbnail</span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 font-medium px-1.5 py-0.2 rounded ml-2">
                          Mandatory
                        </span>
                        <p className="text-[11px] text-slate-500">Fast grid preview asset</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {media.assets.some((a) => a.type === 'THUMBNAIL' && a.status === 'READY') ? (
                        <StatusBadge type="asset" value="READY" />
                      ) : (
                        <StatusBadge type="asset" value="MISSING" />
                      )}
                    </div>
                  </div>

                  {/* Feed Image Row */}
                  <div className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          media.effectivePolicy?.requiredAssets.includes('FEED_IMAGE')
                            ? 'bg-indigo-500'
                            : 'bg-slate-300'
                        }`}
                      ></div>
                      <div>
                        <span className="font-semibold text-slate-900">Feed Image</span>
                        {media.effectivePolicy?.requiredAssets.includes('FEED_IMAGE') ? (
                          <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 font-medium px-1.5 py-0.2 rounded ml-2">
                            Configured by Policy
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 ml-2 font-mono">Not Required</span>
                        )}
                        <p className="text-[11px] text-slate-500">Web-optimized 1080px display image</p>
                      </div>
                    </div>

                    <div>
                      {media.assets.some((a) => a.type === 'FEED_IMAGE' && a.status === 'READY') ? (
                        <StatusBadge type="asset" value="READY" />
                      ) : media.effectivePolicy?.requiredAssets.includes('FEED_IMAGE') ? (
                        <StatusBadge type="asset" value="MISSING" />
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">—</span>
                      )}
                    </div>
                  </div>

                  {/* HLS Video Stream Row */}
                  <div className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          media.effectivePolicy?.requiredAssets.includes('HLS') ? 'bg-purple-500' : 'bg-slate-300'
                        }`}
                      ></div>
                      <div>
                        <span className="font-semibold text-slate-900">HLS Adaptive Stream</span>
                        {media.effectivePolicy?.requiredAssets.includes('HLS') ? (
                          <span className="text-[10px] text-purple-700 bg-purple-50 border border-purple-200 font-medium px-1.5 py-0.2 rounded ml-2">
                            Configured by Policy
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 ml-2 font-mono">Not Required</span>
                        )}
                        <p className="text-[11px] text-slate-500">Multi-bitrate m3u8 stream playlists</p>
                      </div>
                    </div>

                    <div>
                      {media.assets.some((a) => a.type === 'HLS' && a.status === 'READY') ? (
                        <StatusBadge type="asset" value="READY" />
                      ) : media.effectivePolicy?.requiredAssets.includes('HLS') ? (
                        <StatusBadge type="asset" value="MISSING" />
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">—</span>
                      )}
                    </div>
                  </div>

                  {/* Low Quality Rendition Row */}
                  <div className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          media.effectivePolicy?.requiredAssets.includes('LOW_QUALITY')
                            ? 'bg-amber-500'
                            : 'bg-slate-300'
                        }`}
                      ></div>
                      <div>
                        <span className="font-semibold text-slate-900">Low-Quality Fallback (720p/480p)</span>
                        {media.effectivePolicy?.requiredAssets.includes('LOW_QUALITY') ? (
                          <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 font-medium px-1.5 py-0.2 rounded ml-2">
                            Configured by Policy
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 ml-2 font-mono">Not Required</span>
                        )}
                        <p className="text-[11px] text-slate-500">Compressed MP4 for poor connections</p>
                      </div>
                    </div>

                    <div>
                      {media.assets.some((a) => a.type === 'LOW_QUALITY' && a.status === 'READY') ? (
                        <StatusBadge type="asset" value="READY" />
                      ) : media.effectivePolicy?.requiredAssets.includes('LOW_QUALITY') ? (
                        <StatusBadge type="asset" value="MISSING" />
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">—</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACCESS */}
          {activeTab === 'ACCESS' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Effective Visibility
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge type="visibility" value={media.effectiveAccess?.visibility || 'ALL_USERS'} />
                    {media.effectiveAccess?.inheritedFrom && (
                      <span className="text-xs text-slate-500">
                        from {media.effectiveAccess.inheritedFrom.name}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingAccess(!editingAccess)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {editingAccess ? 'Cancel Override' : 'Configure Access Policy'}
                </button>
              </div>

              {editingAccess && (
                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 space-y-4">
                  <AccessPolicyEditor
                    visibility={selectedVisibility}
                    onVisibilityChange={setSelectedVisibility}
                    allowedUserIds={selectedAllowedUsers}
                    onAllowedUsersChange={setSelectedAllowedUsers}
                    allUsers={users}
                    allowInherit={true}
                    inheritedVisibility={media.effectiveAccess?.visibility}
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingAccess(false)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleSaveAccess}
                      className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Save Access Override
                    </button>
                  </div>
                </div>
              )}

              {/* Effective Access Users Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Effective User Access List
                  </h4>
                  <span className="text-xs text-slate-500">
                    VIEW includes view + like + save. DOWNLOAD allows original file download.
                  </span>
                </div>

                <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden bg-white">
                  {media.effectiveAccess?.effectiveUsers.map(({ user, allowed, blockedByParent, parentBlockReason }) => (
                    <div
                      key={user.id}
                      className={`p-3.5 flex items-center justify-between text-xs ${
                        !allowed ? 'bg-slate-50/60 opacity-75' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            user.role === 'ADMIN' ? 'bg-indigo-600' : allowed ? 'bg-emerald-500' : 'bg-rose-400'
                          }`}
                        ></div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{user.name}</span>
                            <span className="text-slate-400 font-mono text-[11px]">{user.email}</span>
                            {user.role === 'ADMIN' && (
                              <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                                Admin
                              </span>
                            )}
                          </div>
                          {parentBlockReason && (
                            <p className="text-[11px] text-amber-700 mt-0.5 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                              {parentBlockReason}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {user.role === 'ADMIN'
                            ? 'Full Administration'
                            : user.capability === 'DOWNLOAD'
                            ? 'View + Like + Save + Download'
                            : 'View + Like + Save'}
                        </span>
                        {allowed ? (
                          <span className="text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ✓ Permitted
                          </span>
                        ) : (
                          <span className="text-rose-700 font-semibold text-[11px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            ✕ Blocked
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {isEffectivelyDeleted ? (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => onRestore(media.id)}
                className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restore from Soft Deletion
              </button>
            ) : (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => onDelete(media.id)}
                className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Mark Soft-Deleted
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
