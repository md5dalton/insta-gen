/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { RootCollection, Collection, MediaUser, ProcessingProfile, ProfileUser, VisibilityType } from '@/types/types';
import { StatusBadge } from './StatusBadge';
import { PolicySelector } from './PolicySelector';
import { AccessPolicyEditor } from './AccessPolicyEditor';
import { ConfirmDialog } from './ConfirmDialog';
import {
  FolderTree,
  Folder,
  User,
  Film,
  ChevronRight,
  ChevronDown,
  Layers,
  Lock,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Sliders,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const CollectionsPage: React.FC = () => {
  const [hierarchy, setHierarchy] = useState<RootCollection[]>([]);
  const [profiles, setProfiles] = useState<ProcessingProfile[]>([]);
  const [users, setUsers] = useState<ProfileUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected item in tree
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'root' | 'collection' | 'user';
    id: string;
    data: any;
    parentData?: any;
    rootData?: any;
  } | null>(null);

  // Form edit states
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedVisibility, setSelectedVisibility] = useState<VisibilityType | null>(null);
  const [selectedAllowedUsers, setSelectedAllowedUsers] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Tree expansion state
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'root-1': true,
    'root-2': true,
    'col-1': true,
  });

  // Soft delete confirm dialog
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [hierRes, profRes, usersRes] = await Promise.all([
        api.getHierarchy(),
        api.getProfiles(),
        api.getUsers(),
      ]);
      setHierarchy(hierRes);
      setProfiles(profRes);
      setUsers(usersRes);

      // Default select first root collection if none selected
      if (!selectedEntity && hierRes.length > 0) {
        selectRoot(hierRes[0]);
      }
    } catch (err: any) {
      showFeedback(err.message || 'Failed to load hierarchy data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const selectRoot = (root: RootCollection) => {
    setSelectedEntity({
      type: 'root',
      id: root.id,
      data: root,
    });
    setSelectedProfileId(root.processingProfileId || null);
    setSelectedVisibility(root.visibility || null);
    setSelectedAllowedUsers(root.allowedUserIds || []);
  };

  const selectCollection = (col: Collection, root: RootCollection) => {
    setSelectedEntity({
      type: 'collection',
      id: col.id,
      data: col,
      parentData: root,
      rootData: root,
    });
    setSelectedProfileId(col.processingProfileId || null);
    setSelectedVisibility(col.visibility || null);
    setSelectedAllowedUsers(col.allowedUserIds || []);
  };

  const selectUser = (user: MediaUser, col: Collection, root: RootCollection) => {
    setSelectedEntity({
      type: 'user',
      id: user.id,
      data: user,
      parentData: col,
      rootData: root,
    });
    setSelectedProfileId(user.processingProfileId || null);
    setSelectedVisibility(user.visibility || null);
    setSelectedAllowedUsers(user.allowedUserIds || []);
  };

  const handleSaveConfiguration = async () => {
    if (!selectedEntity) return;
    setActionLoading(true);
    try {
      await api.updateHierarchyEntity(selectedEntity.type, selectedEntity.id, {
        processingProfileId: selectedProfileId,
        visibility: selectedVisibility,
        allowedUserIds: selectedAllowedUsers,
      });
      showFeedback(`Configuration updated for "${selectedEntity.data.name || selectedEntity.data.displayName}"`);
      await loadData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to save configuration', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!selectedEntity) return;
    setActionLoading(true);
    try {
      await api.updateHierarchyEntity(selectedEntity.type, selectedEntity.id, {
        action: 'delete',
      });
      showFeedback(`"${selectedEntity.data.name || selectedEntity.data.displayName}" marked as soft-deleted.`);
      setConfirmDeleteOpen(false);
      await loadData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to soft delete', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedEntity) return;
    setActionLoading(true);
    try {
      await api.updateHierarchyEntity(selectedEntity.type, selectedEntity.id, {
        action: 'restore',
      });
      showFeedback(`"${selectedEntity.data.name || selectedEntity.data.displayName}" restored.`);
      await loadData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to restore', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Derive effective values for display
  const effectiveProfileName = () => {
    if (!selectedEntity) return 'System Default';
    if (selectedProfileId) {
      return profiles.find((p) => p.id === selectedProfileId)?.name || 'Custom';
    }
    if (selectedEntity.type === 'user' && selectedEntity.parentData?.processingProfileId) {
      return profiles.find((p) => p.id === selectedEntity.parentData.processingProfileId)?.name || 'Direct';
    }
    if (
      (selectedEntity.type === 'user' || selectedEntity.type === 'collection') &&
      selectedEntity.rootData?.processingProfileId
    ) {
      return profiles.find((p) => p.id === selectedEntity.rootData.processingProfileId)?.name || 'Direct';
    }
    return 'System Default (Image Feed / Video Feed)';
  };

  const isDeleted = Boolean(selectedEntity?.data?.deletedAt);

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

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Hierarchy & Collections</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage processing policies and access restrictions across Root Collections, Collections, and Media Users.
        </p>
      </div>

      {/* Main Dual-Pane Browser */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Tree Explorer */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-800/80">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-indigo-400" />
              Logical Hierarchy Tree
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Root → Col → User</span>
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {hierarchy.map((root) => {
              const isRootExpanded = expandedNodes[root.id] ?? true;
              const isRootSelected = selectedEntity?.type === 'root' && selectedEntity?.id === root.id;
              const isRootDeleted = Boolean(root.deletedAt);

              return (
                <div key={root.id} className="space-y-1">
                  {/* Root Collection Node */}
                  <div
                    onClick={() => selectRoot(root)}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all ${
                      isRootSelected
                        ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/40'
                        : isRootDeleted
                        ? 'bg-rose-950/20 text-rose-300 border border-rose-900/40'
                        : 'hover:bg-slate-900 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(root.id);
                        }}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        {isRootExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <FolderTree className="w-4 h-4 shrink-0 text-amber-400" />
                      <span className="truncate">{root.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isRootDeleted && (
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-rose-900/80 text-rose-200 border border-rose-700">
                          Deleted
                        </span>
                      )}
                      <span className="text-[10px] font-mono opacity-70">
                        {root.mediaCount || 0} media
                      </span>
                    </div>
                  </div>

                  {/* Collections List */}
                  {isRootExpanded && (
                    <div className="pl-6 space-y-1 border-l border-slate-800/80 ml-4">
                      {root.collections?.map((col) => {
                        const isColExpanded = expandedNodes[col.id] ?? false;
                        const isColSelected = selectedEntity?.type === 'collection' && selectedEntity?.id === col.id;
                        const isColDeleted = Boolean(col.deletedAt) || isRootDeleted;

                        return (
                          <div key={col.id} className="space-y-1">
                            {/* Collection Node */}
                            <div
                              onClick={() => selectCollection(col, root)}
                              className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all ${
                                isColSelected
                                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/40'
                                  : isColDeleted
                                  ? 'bg-rose-950/20 text-rose-300 border border-rose-900/40'
                                  : 'hover:bg-slate-900 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpand(col.id);
                                  }}
                                  className="p-0.5 text-slate-400 hover:text-white"
                                >
                                  {isColExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <Folder className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                                <span className="truncate">{col.name}</span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {isColDeleted && (
                                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-rose-900/80 text-rose-200">
                                    Deleted
                                  </span>
                                )}
                                <span className="text-[10px] font-mono opacity-70">
                                  {col.mediaCount || 0}
                                </span>
                              </div>
                            </div>

                            {/* Users in Collection */}
                            {isColExpanded && (
                              <div className="pl-6 space-y-1 border-l border-slate-800/60 ml-3">
                                {col.users?.map((user) => {
                                  const isUserSelected =
                                    selectedEntity?.type === 'user' && selectedEntity?.id === user.id;
                                  const isUserDeleted = Boolean(user.deletedAt) || isColDeleted;

                                  return (
                                    <div
                                      key={user.id}
                                      onClick={() => selectUser(user, col, root)}
                                      className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all ${
                                        isUserSelected
                                          ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/40'
                                          : isUserDeleted
                                          ? 'bg-rose-950/20 text-rose-300 border border-rose-900/40'
                                          : 'hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 truncate">
                                        <User className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                                        <span className="truncate">@{user.username}</span>
                                      </div>

                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {isUserDeleted && (
                                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-rose-900/80 text-rose-200">
                                            Deleted
                                          </span>
                                        )}
                                        <span className="text-[10px] font-mono opacity-70">
                                          {user.mediaCount || 0} media
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Configuration Inspector */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          {selectedEntity ? (
            <>
              {/* Entity Banner */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">
                    {selectedEntity.type === 'root'
                      ? 'Root Collection'
                      : selectedEntity.type === 'collection'
                      ? 'Collection'
                      : 'Media User / Owner'}
                  </span>
                  <h2 className="text-xl font-bold text-white mt-0.5">
                    {selectedEntity.data.name || selectedEntity.data.displayName}
                  </h2>
                  <p className="text-xs font-mono text-slate-400 mt-1">
                    Path: {selectedEntity.data.path || selectedEntity.data.username}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isDeleted ? (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleRestore}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore Entity
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setConfirmDeleteOpen(true)}
                      className="px-3.5 py-1.5 bg-rose-950 border border-rose-800 hover:bg-rose-900 text-rose-300 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Mark Soft-Deleted
                    </button>
                  )}
                </div>
              </div>

              {/* Soft deletion information banner */}
              {isDeleted && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-xs text-rose-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    Entity is Soft-Deleted
                  </div>
                  <p className="leading-relaxed">
                    All descendant media under this entity are effectively marked as deleted in the library, while
                    preserving database integrity. Files remain in the filesystem until external cleanup.
                  </p>
                </div>
              )}

              {/* Hierarchy Scope Statistics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Media</span>
                  <span className="text-base font-bold text-white mt-0.5 block font-mono">
                    {selectedEntity.data.mediaCount || 0}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Active Media</span>
                  <span className="text-base font-bold text-emerald-400 mt-0.5 block font-mono">
                    {selectedEntity.data.activeMediaCount || 0}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Effective Profile
                  </span>
                  <span className="text-xs font-bold text-indigo-300 mt-1 block truncate">
                    {effectiveProfileName()}
                  </span>
                </div>
              </div>

              {/* Processing Policy Configuration */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <PolicySelector
                  profiles={profiles}
                  value={selectedProfileId}
                  onChange={setSelectedProfileId}
                  allowInherit={selectedEntity.type !== 'root'}
                  inheritedProfileName={
                    selectedEntity.parentData?.processingProfileId
                      ? profiles.find((p) => p.id === selectedEntity.parentData.processingProfileId)?.name
                      : selectedEntity.rootData?.processingProfileId
                      ? profiles.find((p) => p.id === selectedEntity.rootData.processingProfileId)?.name
                      : 'System Default'
                  }
                />
              </div>

              {/* Access & Visibility Policy Configuration */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <AccessPolicyEditor
                  visibility={selectedVisibility}
                  onVisibilityChange={setSelectedVisibility}
                  allowedUserIds={selectedAllowedUsers}
                  onAllowedUsersChange={setSelectedAllowedUsers}
                  allUsers={users}
                  allowInherit={selectedEntity.type !== 'root'}
                  inheritedVisibility={
                    selectedEntity.parentData?.visibility || selectedEntity.rootData?.visibility || 'ALL_USERS'
                  }
                  parentAllowedUserIds={
                    selectedEntity.parentData?.visibility === 'RESTRICTED'
                      ? selectedEntity.parentData.allowedUserIds
                      : selectedEntity.rootData?.visibility === 'RESTRICTED'
                      ? selectedEntity.rootData.allowedUserIds
                      : undefined
                  }
                  parentName={selectedEntity.parentData?.name || selectedEntity.rootData?.name}
                />
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleSaveConfiguration}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {actionLoading ? 'Saving...' : 'Save Configuration Changes'}
                </button>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-slate-500 text-xs">
              Select an item from the hierarchy tree on the left to configure policies.
            </div>
          )}
        </div>
      </div>

      {/* Soft Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleSoftDelete}
        title={`Mark ${selectedEntity?.data?.name || selectedEntity?.data?.displayName} as Soft-Deleted`}
        variant="danger"
        confirmText="Mark Soft-Deleted"
        description={
          <span>
            Marking this {selectedEntity?.type} as soft-deleted will cause all descendant media items to become
            <strong> effectively deleted</strong>. No media files are removed from the filesystem by this action.
          </span>
        }
      />
    </div>
  );
};
