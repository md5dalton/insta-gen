import {
  MediaItem,
  ProcessingProfile,
  AssetType,
  EffectivePolicyResult,
  EffectiveAccessResult,
} from '@/types/types';
import { db } from './db';

/**
 * Resolves the deterministic effective processing policy for a media item.
 * Precedence: Media -> User -> Collection -> Root Collection -> System default.
 */
export function resolveEffectiveProcessingPolicy(media: MediaItem): EffectivePolicyResult {
  const user = db.mediaUsers.find((u) => u.id === media.userId);
  const collection = db.collections.find((c) => c.id === media.collectionId);
  const rootCollection = db.rootCollections.find((r) => r.id === media.rootCollectionId);

  let chosenProfileId: string | null | undefined = null;
  let inheritedFrom: EffectivePolicyResult['inheritedFrom'] = {
    level: 'SYSTEM_DEFAULT',
    name: 'System Default (' + (media.type === 'VIDEO' ? 'Video Feed' : 'Image Feed') + ')',
  };

  // 1. Check Media level
  if (media.processingProfileId) {
    chosenProfileId = media.processingProfileId;
    inheritedFrom = {
      level: 'MEDIA',
      name: `Direct Media Override (${media.name})`,
      id: media.id,
    };
  }
  // 2. Check User level
  else if (user?.processingProfileId) {
    chosenProfileId = user.processingProfileId;
    inheritedFrom = {
      level: 'USER',
      name: `User → @${user.username}`,
      id: user.id,
    };
  }
  // 3. Check Collection level
  else if (collection?.processingProfileId) {
    chosenProfileId = collection.processingProfileId;
    inheritedFrom = {
      level: 'COLLECTION',
      name: `Collection → ${collection.name}`,
      id: collection.id,
    };
  }
  // 4. Check Root Collection level
  else if (rootCollection?.processingProfileId) {
    chosenProfileId = rootCollection.processingProfileId;
    inheritedFrom = {
      level: 'ROOT_COLLECTION',
      name: `Root Collection → ${rootCollection.name}`,
      id: rootCollection.id,
    };
  }

  // Find profile object
  let profile = db.profiles.find((p) => p.id === chosenProfileId);
  if (!profile) {
    // System default fallback
    const defaultProfileId = media.type === 'VIDEO' ? 'profile-video-feed' : 'profile-image-feed';
    profile = db.profiles.find((p) => p.id === defaultProfileId) || db.profiles[0];
  }

  // Calculate required assets based on profile
  const requiredAssets: AssetType[] = ['THUMBNAIL']; // Mandatory for ALL media items!
  if (profile.requiredRenditions.feedImage && media.type === 'IMAGE') {
    requiredAssets.push('FEED_IMAGE');
  }
  if (profile.requiredRenditions.hls && media.type === 'VIDEO') {
    requiredAssets.push('HLS');
  }
  if (profile.requiredRenditions.lowQuality && media.type === 'VIDEO') {
    requiredAssets.push('LOW_QUALITY');
  }

  // Calculate existing assets that are READY
  const existingAssets: AssetType[] = (media.assets || [])
    .filter((a) => a.status === 'READY')
    .map((a) => a.type);

  // Missing assets = required - existing
  const missingAssets = requiredAssets.filter((req) => !existingAssets.includes(req));

  const needsProcessing = missingAssets.length > 0;

  return {
    profile,
    inheritedFrom,
    requiredAssets,
    existingAssets,
    missingAssets,
    needsProcessing,
  };
}

/**
 * Resolves deterministic access inheritance and parent restriction intersection.
 * Hierarchy: Root Collection -> Collection -> User -> Media
 * Rule: Child can restrict further, but cannot bypass a parent restriction.
 * Effective access = parent access ∩ child access.
 */
export function resolveEffectiveAccess(media: MediaItem): EffectiveAccessResult {
  const user = db.mediaUsers.find((u) => u.id === media.userId);
  const collection = db.collections.find((c) => c.id === media.collectionId);
  const rootCollection = db.rootCollections.find((r) => r.id === media.rootCollectionId);

  // 1. Resolve visibility precedence
  let effectiveVisibility: 'ALL_USERS' | 'RESTRICTED' | 'PRIVATE' = 'ALL_USERS';
  let inheritedFrom: EffectiveAccessResult['inheritedFrom'] = undefined;

  const chain = [
    { level: 'ROOT_COLLECTION' as const, name: rootCollection?.name || 'Root Collection', vis: rootCollection?.visibility, allowed: rootCollection?.allowedUserIds },
    { level: 'COLLECTION' as const, name: collection?.name || 'Collection', vis: collection?.visibility, allowed: collection?.allowedUserIds },
    { level: 'USER' as const, name: user?.displayName || 'User', vis: user?.visibility, allowed: user?.allowedUserIds },
    { level: 'MEDIA' as const, name: media.name, vis: media.visibility, allowed: media.allowedUserIds },
  ];

  // Most specific non-inherit visibility determines base policy
  let baseVisibilityLevel = chain[0];
  for (const item of chain) {
    if (item.vis && item.vis !== 'INHERIT') {
      effectiveVisibility = item.vis;
      baseVisibilityLevel = item;
    }
  }

  if (baseVisibilityLevel.level !== 'MEDIA') {
    inheritedFrom = {
      level: baseVisibilityLevel.level,
      name: `${baseVisibilityLevel.level.replace('_', ' ')} → ${baseVisibilityLevel.name}`,
    };
  }

  // If any parent is PRIVATE, effective visibility is locked to PRIVATE
  if (chain.some((c) => c.vis === 'PRIVATE')) {
    effectiveVisibility = 'PRIVATE';
  }

  // 2. Compute parent allowed sets for intersection
  // Start with all users permitted if Root is ALL_USERS or empty restricted
  let currentAllowedSet: Set<string> | null = null; // null means unrestricted (ALL_USERS)

  for (const node of chain) {
    if (node.vis === 'PRIVATE') {
      currentAllowedSet = new Set(); // No regular users allowed
      break;
    } else if (node.vis === 'RESTRICTED') {
      const nodeAllowed = new Set(node.allowed || []);
      if (currentAllowedSet === null) {
        currentAllowedSet = nodeAllowed;
      } else {
        // Intersection: current ∩ node
        const nextSet = new Set<string>();
        for (const uid of currentAllowedSet) {
          if (nodeAllowed.has(uid)) {
            nextSet.add(uid);
          }
        }
        currentAllowedSet = nextSet;
      }
    }
    // If INHERIT or ALL_USERS, leaves existing restriction in place
  }

  // 3. Build effective user list for all profile users
  const effectiveUsers = db.profileUsers.map((pUser) => {
    if (pUser.role === 'ADMIN') {
      return {
        user: pUser,
        allowed: true, // Admin always bypasses restrictions
      };
    }

    if (effectiveVisibility === 'PRIVATE') {
      return {
        user: pUser,
        allowed: false,
        blockedByParent: true,
        parentBlockReason: 'Entity visibility is set to Private (Admin only).',
      };
    }

    if (effectiveVisibility === 'ALL_USERS' && currentAllowedSet === null) {
      return {
        user: pUser,
        allowed: true,
      };
    }

    // Check if user is in restricted set
    const isAllowed = currentAllowedSet ? currentAllowedSet.has(pUser.id) : true;

    // Check if blocked by parent restriction
    let blockedByParent = false;
    let parentBlockReason = undefined;

    if (!isAllowed) {
      // Check which parent blocked them
      if (rootCollection?.visibility === 'RESTRICTED' && !rootCollection.allowedUserIds?.includes(pUser.id)) {
        blockedByParent = true;
        parentBlockReason = `Parent Root Collection '${rootCollection.name}' does not permit access for ${pUser.name}.`;
      } else if (collection?.visibility === 'RESTRICTED' && !collection.allowedUserIds?.includes(pUser.id)) {
        blockedByParent = true;
        parentBlockReason = `Parent Collection '${collection.name}' does not permit access for ${pUser.name}.`;
      } else if (media.visibility === 'RESTRICTED' && !media.allowedUserIds?.includes(pUser.id)) {
        blockedByParent = false;
        parentBlockReason = `Media access list does not include ${pUser.name}.`;
      }
    }

    return {
      user: pUser,
      allowed: isAllowed,
      blockedByParent,
      parentBlockReason,
    };
  });

  return {
    visibility: effectiveVisibility,
    inheritedFrom,
    effectiveUsers,
  };
}

/**
 * Resolves effective deletion state by checking item and all parent levels.
 */


/**
 * Enriches a raw MediaItem with dynamic backend calculations.
 */
export function enrichMediaItem(media: MediaItem): MediaItem {
  const policyResult = resolveEffectiveProcessingPolicy(media);
  const accessResult = resolveEffectiveAccess(media);
  const deletionResult = resolveEffectiveDeletion({ media });

  // Recalculate processing status if needed
  let status = media.processingStatus;
  if (status !== 'PROCESSING' && status !== 'FAILED') {
    if (media.thumbnailUrl === '' || media.assets.length === 0) {
      status = 'NEW';
    } else if (policyResult.needsProcessing) {
      status = 'NEEDS_PROCESSING';
    } else {
      status = 'READY';
    }
  }

  return {
    ...media,
    processingStatus: status,
    effectivePolicy: policyResult,
    effectiveAccess: accessResult,
    isEffectivelyDeleted: deletionResult.isEffectivelyDeleted,
    effectiveDeletionSource: deletionResult.deletionSource,
  };
}

// --- Convenience helpers expected by API routes ---

export function resolveEffectiveProfile(params: {
  mediaId?: string;
  userId?: string;
  collectionId?: string;
  rootCollectionId?: string;
  type?: 'IMAGE' | 'VIDEO';
}): ProcessingProfile {
  const { mediaId, userId, collectionId, rootCollectionId, type = 'IMAGE' } = params;

  let chosenProfileId: string | null | undefined = null;

  if (mediaId) {
    const m = db.media.find((item) => item.id === mediaId);
    if (m?.processingProfileId) chosenProfileId = m.processingProfileId;
  }
  if (!chosenProfileId && userId) {
    const u = db.mediaUsers.find((user) => user.id === userId);
    if (u?.processingProfileId) chosenProfileId = u.processingProfileId;
  }
  if (!chosenProfileId && collectionId) {
    const c = db.collections.find((col) => col.id === collectionId);
    if (c?.processingProfileId) chosenProfileId = c.processingProfileId;
  }
  if (!chosenProfileId && rootCollectionId) {
    const r = db.rootCollections.find((root) => root.id === rootCollectionId);
    if (r?.processingProfileId) chosenProfileId = r.processingProfileId;
  }

  let profile = db.profiles.find((p) => p.id === chosenProfileId);
  if (!profile) {
    const defaultProfileId = type === 'VIDEO' ? 'profile-video-feed' : 'profile-image-feed';
    profile = db.profiles.find((p) => p.id === defaultProfileId) || db.profiles[0];
  }
  return profile;
}

export function resolveEffectiveVisibility(params: {
  mediaId?: string;
  userId?: string;
  collectionId?: string;
  rootCollectionId?: string;
}): 'ALL_USERS' | 'RESTRICTED' | 'PRIVATE' {
  const { mediaId, userId, collectionId, rootCollectionId } = params;

  const m = mediaId ? db.media.find((item) => item.id === mediaId) : null;
  const targetUserId = userId || m?.userId;
  const u = targetUserId ? db.mediaUsers.find((user) => user.id === targetUserId) : null;
  const targetColId = collectionId || u?.collectionId || m?.collectionId;
  const c = targetColId ? db.collections.find((col) => col.id === targetColId) : null;
  const targetRootId = rootCollectionId || c?.rootCollectionId || m?.rootCollectionId;
  const r = targetRootId ? db.rootCollections.find((root) => root.id === targetRootId) : null;

  const chain = [r?.visibility, c?.visibility, u?.visibility, m?.visibility].filter(Boolean as any);

  if (chain.includes('PRIVATE')) return 'PRIVATE';

  for (let i = chain.length - 1; i >= 0; i--) {
    const v = chain[i];
    if (v && v !== 'INHERIT') {
      return v as 'ALL_USERS' | 'RESTRICTED' | 'PRIVATE';
    }
  }

  return 'ALL_USERS';
}

export function resolveEffectiveAllowedUsers(params: {
  mediaId?: string;
  userId?: string;
  collectionId?: string;
  rootCollectionId?: string;
}): string[] {
  const { mediaId, userId, collectionId, rootCollectionId } = params;

  const m = mediaId ? db.media.find((item) => item.id === mediaId) : null;
  const targetUserId = userId || m?.userId;
  const u = targetUserId ? db.mediaUsers.find((user) => user.id === targetUserId) : null;
  const targetColId = collectionId || u?.collectionId || m?.collectionId;
  const c = targetColId ? db.collections.find((col) => col.id === targetColId) : null;
  const targetRootId = rootCollectionId || c?.rootCollectionId || m?.rootCollectionId;
  const r = targetRootId ? db.rootCollections.find((root) => root.id === targetRootId) : null;

  const nodes = [r, c, u, m].filter(Boolean as any);
  let currentAllowed: Set<string> | null = null;

  for (const node of nodes) {
    if ((node as any).visibility === 'PRIVATE') {
      return [];
    } else if ((node as any).visibility === 'RESTRICTED') {
      const allowedArr: string[] = (node as any).allowedUserIds || [];
      const nodeSet = new Set<string>(allowedArr);
      if (currentAllowed === null) {
        currentAllowed = nodeSet;
      } else {
        const next = new Set<string>();
        for (const uid of currentAllowed) {
          if (nodeSet.has(uid)) next.add(uid);
        }
        currentAllowed = next;
      }
    }
  }

  return currentAllowed ? Array.from(currentAllowed) : db.profileUsers.map((p) => p.id);
}

export function resolveEffectiveDeletion(params: {
  media?: MediaItem;
  mediaId?: string;
  userId?: string;
  collectionId?: string;
  rootCollectionId?: string;
}): { isEffectivelyDeleted: boolean; deletionSource?: string; deletedAt?: string | null } {
  const { media, mediaId, userId, collectionId, rootCollectionId } = params;
  const m = media || (mediaId ? db.media.find((item) => item.id === mediaId) : null);

  if (m?.deletedAt) {
    return { isEffectivelyDeleted: true, deletionSource: 'Marked deleted directly', deletedAt: m.deletedAt };
  }

  const targetUserId = userId || m?.userId;
  const user = targetUserId ? db.mediaUsers.find((u) => u.id === targetUserId) : null;
  if (user?.deletedAt) {
    return { isEffectivelyDeleted: true, deletionSource: `Inherited from User '@${user.username}' (Marked deleted)`, deletedAt: user.deletedAt };
  }

  const targetColId = collectionId || user?.collectionId || m?.collectionId;
  const collection = targetColId ? db.collections.find((c) => c.id === targetColId) : null;
  if (collection?.deletedAt) {
    return { isEffectivelyDeleted: true, deletionSource: `Inherited from Collection '${collection.name}' (Marked deleted)`, deletedAt: collection.deletedAt };
  }

  const targetRootId = rootCollectionId || collection?.rootCollectionId || m?.rootCollectionId;
  const rootCollection = targetRootId ? db.rootCollections.find((r) => r.id === targetRootId) : null;
  if (rootCollection?.deletedAt) {
    return { isEffectivelyDeleted: true, deletionSource: `Inherited from Root Collection '${rootCollection.name}' (Marked deleted)`, deletedAt: rootCollection.deletedAt };
  }

  return { isEffectivelyDeleted: false, deletedAt: null };
}

export function processMediaItemSync(media: MediaItem): MediaItem {
  // Simple implementation: fill missing assets based on processing policy
  const policy = resolveEffectiveProcessingPolicy(media);
  policy.missingAssets.forEach((assetType) => {
    const assetId = `asset-${media.id}-${assetType.toLowerCase()}`;
    const existingIdx = media.assets.findIndex((a) => a.type === assetType);
    const newAsset: any = {
      id: assetId,
      mediaId: media.id,
      type: assetType,
      status: 'READY',
      path: `${media.path}_${assetType.toLowerCase()}.${assetType === 'HLS' ? 'm3u8' : 'webp'}`,
      size: Math.round(media.size * (assetType === 'THUMBNAIL' ? 0.05 : assetType === 'FEED_IMAGE' ? 0.35 : 0.7)),
      generatedAt: new Date().toISOString(),
    };
    if (existingIdx >= 0) media.assets[existingIdx] = newAsset;
    else media.assets.push(newAsset);
    if (assetType === 'THUMBNAIL') media.thumbnailUrl = media.previewUrl;
  });
  media.processingStatus = 'READY';
  media.processingError = null as any;
  media.updatedAt = new Date().toISOString();
  return enrichMediaItem(media);
}

export function retryFailedAssetsSync(media: MediaItem): MediaItem {
  media.assets.forEach((asset) => {
    if ((asset as any).status === 'FAILED') {
      (asset as any).status = 'READY';
      delete (asset as any).error;
      (asset as any).generatedAt = new Date().toISOString();
    }
  });
  media.processingStatus = 'READY';
  media.processingError = null as any;
  media.updatedAt = new Date().toISOString();
  return enrichMediaItem(media);
}
