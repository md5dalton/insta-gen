/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
  MediaItem,
  MediaFilterParams,
  ProcessingProfile,
  ProfileUser,
  RootCollection,
  Collection,
  MediaUser,
  VisibilityType,
} from '@/types/types';
import { MediaPreview } from './MediaPreview';
import { StatusBadge } from './StatusBadge';
import { BulkActionBar } from './BulkActionBar';
import { MediaDetailModal } from './MediaDetailModal';
import { ConfirmDialog } from './ConfirmDialog';
import {
  Search,
  Filter,
  Grid,
  List,
  Tag,
  ArrowUpDown,
  RotateCcw,
  Trash2,
  Play,
  Layers,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Lock,
  Sparkles,
  AlertCircle,
  Eye,
  CheckSquare,
  Square,
} from 'lucide-react';

export const MediaLibraryPage: React.FC = () => {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | 'IMAGE' | 'VIDEO'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDeletionStatus, setSelectedDeletionStatus] = useState<'ACTIVE' | 'DELETED' | 'ALL'>('ACTIVE');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'size' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // View mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Metadata caches for dropdowns
  const [profiles, setProfiles] = useState<ProcessingProfile[]>([]);
  const [users, setUsers] = useState<ProfileUser[]>([]);
  const [hierarchy, setHierarchy] = useState<RootCollection[]>([]);
  const [tags, setTags] = useState<{ name: string; count: number }[]>([]);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal inspection
  const [inspectingMedia, setInspectingMedia] = useState<MediaItem | null>(null);

  // Confirmation dialogs
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [mediaToDeleteId, setMediaToDeleteId] = useState<string | null>(null);

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadMedia = async () => {
    setLoading(true);
    try {
      const res = await api.getMediaList({
        query: searchQuery,
        type: selectedType,
        status: selectedStatus as any,
        deletionStatus: selectedDeletionStatus,
        tag: selectedTag,
        collectionId: selectedCollectionId || undefined,
        userId: selectedUserId || undefined,
        sortBy,
        sortOrder,
        page,
        limit: 20,
      });
      setMediaList(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      showFeedback(err.message || 'Failed to load media list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMeta = async () => {
    try {
      const [profRes, usersRes, hierRes, tagRes] = await Promise.all([
        api.getProfiles(),
        api.getUsers(),
        api.getHierarchy(),
        api.getTags(),
      ]);
      setProfiles(profRes);
      setUsers(usersRes);
      setHierarchy(hierRes);
      setTags(tagRes);
    } catch (err) {
      console.error('Failed to load metadata', err);
    }
  };

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    loadMedia();
  }, [
    page,
    searchQuery,
    selectedType,
    selectedStatus,
    selectedDeletionStatus,
    selectedTag,
    selectedCollectionId,
    selectedUserId,
    sortBy,
    sortOrder,
  ]);

  const toggleSelectAll = () => {
    if (selectedIds.length === mediaList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(mediaList.map((m) => m.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Actions
  const handleProcessSingle = async (id: string) => {
    try {
      const res = await api.processMedia(id);
      showFeedback(`Processing triggered for ${res.media.name}`);
      loadMedia();
      if (inspectingMedia && inspectingMedia.id === id) {
        setInspectingMedia(res.media);
      }
    } catch (err: any) {
      showFeedback(err.message || 'Processing failed', 'error');
    }
  };

  const handleRetrySingle = async (id: string) => {
    try {
      const res = await api.retryMedia(id);
      showFeedback(`Processing retry initiated for ${res.media.name}`);
      loadMedia();
      if (inspectingMedia && inspectingMedia.id === id) {
        setInspectingMedia(res.media);
      }
    } catch (err: any) {
      showFeedback(err.message || 'Retry failed', 'error');
    }
  };

  const handleDeleteSingle = async (id: string) => {
    try {
      const res = await api.deleteMedia(id);
      showFeedback(`"${res.media.name}" marked as soft-deleted. Awaiting filesystem cleanup.`);
      setConfirmDeleteOpen(false);
      setMediaToDeleteId(null);
      loadMedia();
      if (inspectingMedia && inspectingMedia.id === id) {
        setInspectingMedia(res.media);
      }
    } catch (err: any) {
      showFeedback(err.message || 'Delete failed', 'error');
    }
  };

  const handleRestoreSingle = async (id: string) => {
    try {
      const res = await api.restoreMedia(id);
      showFeedback(`"${res.media.name}" restored from soft deletion.`);
      loadMedia();
      if (inspectingMedia && inspectingMedia.id === id) {
        setInspectingMedia(res.media);
      }
    } catch (err: any) {
      showFeedback(err.message || 'Restore failed', 'error');
    }
  };

  const handleUpdatePolicy = async (id: string, profileId: string | null) => {
    try {
      const updated = await api.updateMediaPolicy(id, profileId);
      showFeedback(`Updated processing profile override for "${updated.name}"`);
      loadMedia();
      setInspectingMedia(updated);
    } catch (err: any) {
      showFeedback(err.message || 'Update policy failed', 'error');
    }
  };

  const handleUpdateAccess = async (id: string, data: { visibility?: string | null; allowedUserIds?: string[] }) => {
    try {
      const updated = await api.updateMediaAccess(id, data);
      showFeedback(`Updated access policy for "${updated.name}"`);
      loadMedia();
      setInspectingMedia(updated);
    } catch (err: any) {
      showFeedback(err.message || 'Update access failed', 'error');
    }
  };

  // Bulk Actions
  const handleBulkProcess = async () => {
    try {
      const res = await api.bulkMediaAction({
        action: 'PROCESS',
        mediaIds: selectedIds,
      });
      showFeedback(`Triggered processing for ${res.affectedCount} media items (${res.skippedCount} skipped).`);
      setSelectedIds([]);
      loadMedia();
    } catch (err: any) {
      showFeedback(err.message || 'Bulk processing failed', 'error');
    }
  };

  const handleBulkAssignProfile = async (profileId: string | null) => {
    try {
      const res = await api.bulkMediaAction({
        action: 'ASSIGN_PROFILE',
        mediaIds: selectedIds,
        processingProfileId: profileId,
      });
      showFeedback(`Assigned profile to ${res.affectedCount} media items.`);
      setSelectedIds([]);
      loadMedia();
    } catch (err: any) {
      showFeedback(err.message || 'Bulk assign profile failed', 'error');
    }
  };

  const handleBulkSetVisibility = async (visibility: VisibilityType | null) => {
    try {
      const res = await api.bulkMediaAction({
        action: 'SET_VISIBILITY',
        mediaIds: selectedIds,
        visibility,
      });
      showFeedback(`Updated visibility for ${res.affectedCount} media items.`);
      setSelectedIds([]);
      loadMedia();
    } catch (err: any) {
      showFeedback(err.message || 'Bulk set visibility failed', 'error');
    }
  };

  const handleBulkAddTag = async (tag: string) => {
    try {
      const res = await api.bulkMediaAction({
        action: 'ADD_TAG',
        mediaIds: selectedIds,
        tag,
      });
      showFeedback(`Added tag "${tag}" to ${res.affectedCount} media items.`);
      setSelectedIds([]);
      loadMedia();
      loadMeta(); // refresh tags count
    } catch (err: any) {
      showFeedback(err.message || 'Bulk add tag failed', 'error');
    }
  };

  const handleBulkMarkDeleted = async () => {
    try {
      const res = await api.bulkMediaAction({
        action: 'MARK_DELETED',
        mediaIds: selectedIds,
      });
      showFeedback(`Marked ${res.affectedCount} media items as soft-deleted. Awaiting filesystem cleanup.`);
      setConfirmBulkDeleteOpen(false);
      setSelectedIds([]);
      loadMedia();
    } catch (err: any) {
      showFeedback(err.message || 'Bulk mark deleted failed', 'error');
    }
  };

  const handleBulkRestore = async () => {
    try {
      const res = await api.bulkMediaAction({
        action: 'RESTORE',
        mediaIds: selectedIds,
      });
      showFeedback(`Restored ${res.affectedCount} media items.`);
      setSelectedIds([]);
      loadMedia();
    } catch (err: any) {
      showFeedback(err.message || 'Bulk restore failed', 'error');
    }
  };

  // Flattened collections list for dropdown
  const allCollections = hierarchy.flatMap((r) => r.collections || []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between shadow-xl ${
            feedback.type === 'success'
              ? 'bg-emerald-950 border border-emerald-800 text-emerald-200'
              : 'bg-rose-950 border border-rose-800 text-rose-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-white/60 hover:text-white ml-3">
            ✕
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Media Catalog</h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse discovered media, inspect processing renditions, and manage overrides.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-1 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'list' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search by file name, path, tag..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Type Filter */}
          <div className="lg:col-span-2">
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value as any);
                setPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 transition-colors"
            >
              <option value="ALL">All Media Types</option>
              <option value="IMAGE">Images Only</option>
              <option value="VIDEO">Videos Only</option>
            </select>
          </div>

          {/* Processing Status Filter */}
          <div className="lg:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 transition-colors"
            >
              <option value="ALL">All Processing States</option>
              <option value="NEW">✨ New (Ingested)</option>
              <option value="NEEDS_PROCESSING">⚠️ Needs Processing</option>
              <option value="PROCESSING">🔄 Processing</option>
              <option value="READY">✓ Ready</option>
              <option value="FAILED">✕ Failed</option>
            </select>
          </div>

          {/* Deletion Lifecycle Filter */}
          <div className="lg:col-span-2">
            <select
              value={selectedDeletionStatus}
              onChange={(e) => {
                setSelectedDeletionStatus(e.target.value as any);
                setPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 transition-colors"
            >
              <option value="ACTIVE">Active Media Only</option>
              <option value="DELETED">🗑️ Soft-Deleted Only</option>
              <option value="ALL">All (Active + Deleted)</option>
            </select>
          </div>

          {/* Collection Filter */}
          <div className="lg:col-span-2">
            <select
              value={selectedCollectionId}
              onChange={(e) => {
                setSelectedCollectionId(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 transition-colors"
            >
              <option value="">All Collections</option>
              {allCollections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags quick filter bar */}
        {tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Tags:</span>
            <button
              type="button"
              onClick={() => setSelectedTag('')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                selectedTag === '' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            {tags.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => setSelectedTag(selectedTag === t.name ? '' : t.name)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${
                  selectedTag === t.name
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>#{t.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">({t.count})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Catalog Grid / List */}
      <div className="space-y-4">
        {/* Selection & Sorting Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              {selectedIds.length === mediaList.length && mediaList.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-indigo-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
              <span>Select All on Page ({mediaList.length})</span>
            </button>
            <span>•</span>
            <span>Total: <strong>{total.toLocaleString()}</strong> media items</span>
          </div>

          <div className="flex items-center gap-2">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-300 py-1 px-2 rounded-lg text-xs focus:outline-hidden"
            >
              <option value="createdAt">Date Created</option>
              <option value="name">File Name</option>
              <option value="size">Size</option>
              <option value="status">Processing State</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-white"
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Media Items */}
        {loading ? (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-16 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs">Loading media records from library...</p>
          </div>
        ) : mediaList.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-16 text-center text-slate-400 space-y-3">
            <Filter className="w-8 h-8 mx-auto text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-200">No media matched your filters</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search keywords, clearing status filters, or selecting active media.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid Layout */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mediaList.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const isDeleted = item.isEffectivelyDeleted;

              return (
                <div
                  key={item.id}
                  className={`group bg-slate-950 rounded-2xl border transition-all overflow-hidden flex flex-col shadow-lg ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/50'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Thumbnail area with checkbox overlay */}
                  <div className="relative cursor-pointer" onClick={() => setInspectingMedia(item)}>
                    <MediaPreview
                      url={item.previewUrl || item.thumbnailUrl}
                      type={item.type}
                      name={item.name}
                      duration={item.duration}
                      isDeleted={isDeleted}
                      aspectRatio="portrait"
                      className="w-full"
                    />

                    {/* Selection checkbox */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectItem(item.id);
                      }}
                      className="absolute top-2 right-2 p-1 rounded-md bg-black/60 backdrop-blur-xs text-white hover:bg-black/80 transition-colors z-10"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4 text-white/70" />
                      )}
                    </button>
                  </div>

                  {/* Card Details */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                    <div>
                      <div className="flex items-start justify-between gap-1.5">
                        <span
                          onClick={() => setInspectingMedia(item)}
                          className="font-mono text-xs font-semibold text-slate-200 hover:text-indigo-400 truncate cursor-pointer block"
                          title={item.name}
                        >
                          {item.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 truncate block mt-0.5">
                        {item.collectionName} • @{item.userName}
                      </span>
                    </div>

                    {/* Status & Renditions */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-900">
                      <StatusBadge type="processing" value={item.processingStatus} size="sm" />
                      <span className="text-[11px] text-slate-500 font-mono">{formatBytes(item.size)}</span>
                    </div>

                    {/* Policy lineage preview */}
                    <div className="bg-slate-900/60 px-2 py-1 rounded text-[10px] text-slate-400 flex items-center justify-between">
                      <span className="truncate">Policy: {item.effectivePolicy?.profile.name || 'Direct'}</span>
                      {item.processingProfileId && (
                        <span className="text-indigo-400 font-semibold uppercase text-[9px]">Override</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List Layout */
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3.5 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === mediaList.length && mediaList.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="p-3.5 w-16">Preview</th>
                    <th className="p-3.5">Media Name</th>
                    <th className="p-3.5">Hierarchy</th>
                    <th className="p-3.5">Size</th>
                    <th className="p-3.5">Effective Policy</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {mediaList.map((item) => {
                    const isSelected = selectedIds.includes(item.id);
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-900/50 transition-colors ${
                          isSelected ? 'bg-indigo-950/20' : ''
                        }`}
                      >
                        <td className="p-3.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectItem(item.id)}
                            className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="p-3.5">
                          <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 cursor-pointer" onClick={() => setInspectingMedia(item)}>
                            <MediaPreview
                              url={item.previewUrl || item.thumbnailUrl}
                              type={item.type}
                              name={item.name}
                              isDeleted={item.isEffectivelyDeleted}
                              aspectRatio="square"
                            />
                          </div>
                        </td>
                        <td className="p-3.5 font-mono">
                          <button
                            type="button"
                            onClick={() => setInspectingMedia(item)}
                            className="font-semibold text-slate-200 hover:text-indigo-400 text-left block truncate max-w-xs"
                          >
                            {item.name}
                          </button>
                          <span className="text-[11px] text-slate-500 font-sans block truncate max-w-xs">
                            {item.path}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="text-slate-300 block">{item.collectionName}</span>
                          <span className="text-[11px] text-slate-500 block">@{item.userName}</span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-400">{formatBytes(item.size)}</td>
                        <td className="p-3.5">
                          <span className="font-semibold text-slate-300 block">
                            {item.effectivePolicy?.profile.name || 'Direct'}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {item.effectivePolicy?.inheritedFrom.name}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <StatusBadge type="processing" value={item.processingStatus} size="sm" />
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => setInspectingMedia(item)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleProcessSingle(item.id)}
                            className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 hover:bg-emerald-900"
                            title="Process"
                          >
                            <Play className="w-4 h-4 fill-current" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 text-xs text-slate-400">
            <span>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-900 disabled:opacity-40 disabled:pointer-events-none text-slate-200"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-900 disabled:opacity-40 disabled:pointer-events-none text-slate-200"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onBulkProcess={handleBulkProcess}
        onBulkAssignProfile={handleBulkAssignProfile}
        onBulkSetVisibility={handleBulkSetVisibility}
        onBulkAddTag={handleBulkAddTag}
        onBulkMarkDeleted={() => setConfirmBulkDeleteOpen(true)}
        onBulkRestore={handleBulkRestore}
        profiles={profiles}
        hasDeletedSelected={selectedDeletionStatus === 'DELETED'}
      />

      {/* Media Detail Drawer/Modal */}
      <MediaDetailModal
        media={inspectingMedia}
        isOpen={Boolean(inspectingMedia)}
        onClose={() => setInspectingMedia(null)}
        onProcess={handleProcessSingle}
        onRetry={handleRetrySingle}
        onDelete={handleDeleteSingle}
        onRestore={handleRestoreSingle}
        onUpdatePolicy={handleUpdatePolicy}
        onUpdateAccess={handleUpdateAccess}
        profiles={profiles}
        users={users}
      />

      {/* Bulk Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmBulkDeleteOpen}
        onClose={() => setConfirmBulkDeleteOpen(false)}
        onConfirm={handleBulkMarkDeleted}
        title="Mark Selected Media as Soft-Deleted"
        variant="danger"
        confirmText="Mark Deleted"
        description={
          <span>
            You are about to mark <strong>{selectedIds.length} media items</strong> as soft-deleted. The database records
            will be flagged as deleted and will await eventual filesystem cleanup. Files are never immediately destroyed
            by this dashboard.
          </span>
        }
      />
    </div>
  );
};
