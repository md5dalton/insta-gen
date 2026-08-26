/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AdminUser,
  ProcessingProfile,
  RootCollection,
  Collection,
  MediaUser,
  MediaItem,
  ProfileUser,
  MediaAsset,
  SystemSettings,
} from '@/types/types';

export class DatabaseStore {
  admin: AdminUser | null = null;
  adminPasswordHash: string | null = null;
  tokens: Set<string> = new Set();

  settings: SystemSettings = {
    mediaRoot: '/mnt/media/library',
    mediaRootStatus: {
      exists: true,
      readable: true,
      writable: true,
      path: '/mnt/media/library',
    },
    databaseStatus: {
      connected: true,
      latencyMs: 4,
    },
    mediaProcessorStatus: {
      running: true,
      activeWorkers: 3,
      queuedJobs: 0,
    },
  };

  profiles: ProcessingProfile[] = [
    {
      id: 'profile-direct',
      name: 'Direct',
      description: 'Standard storage with required thumbnail. No additional transcode renditions.',
      isSystem: true,
      requiredRenditions: {
        thumbnail: true,
        feedImage: false,
        hls: false,
        lowQuality: false,
      },
    },
    {
      id: 'profile-image-feed',
      name: 'Image Feed',
      description: 'Optimized for social image feeds. Generates thumbnail + web-optimized feed image.',
      isSystem: true,
      requiredRenditions: {
        thumbnail: true,
        feedImage: true,
        hls: false,
        lowQuality: false,
      },
    },
    {
      id: 'profile-video-feed',
      name: 'Video Feed',
      description: 'Optimized for video streaming and reels. Generates thumbnail + adaptive HLS streams.',
      isSystem: true,
      requiredRenditions: {
        thumbnail: true,
        feedImage: false,
        hls: true,
        lowQuality: false,
      },
    },
    {
      id: 'profile-video-hq-lq',
      name: 'Video Feed + Low Quality',
      description: 'Comprehensive video profile with thumbnail + HLS + 720p/480p low-quality fallback.',
      isSystem: true,
      requiredRenditions: {
        thumbnail: true,
        feedImage: false,
        hls: true,
        lowQuality: true,
      },
    },
  ];

  profileUsers: ProfileUser[] = [
    {
      id: 'puser-1',
      name: 'Sarah Jenkins',
      email: 'sarah.j@example.com',
      role: 'USER',
      capability: 'VIEW',
      createdAt: '2026-01-15T10:00:00.000Z',
    },
    {
      id: 'puser-2',
      name: 'Mark Stevens',
      email: 'mark.stevens@example.com',
      role: 'USER',
      capability: 'DOWNLOAD',
      createdAt: '2026-02-01T14:30:00.000Z',
    },
    {
      id: 'puser-3',
      name: 'Elena Vance',
      email: 'elena.v@example.com',
      role: 'USER',
      capability: 'MANAGE',
      createdAt: '2026-03-10T09:15:00.000Z',
    },
    {
      id: 'puser-4',
      name: 'David Kim',
      email: 'david.k@example.com',
      role: 'USER',
      capability: 'VIEW',
      createdAt: '2026-04-12T11:45:00.000Z',
    },
  ];

  rootCollections: RootCollection[] = [
    {
      id: 'root-1',
      name: 'Social Media Ingest',
      path: 'social-media-ingest',
      processingProfileId: 'profile-image-feed',
      visibility: 'ALL_USERS',
      allowedUserIds: ['puser-1', 'puser-2', 'puser-3', 'puser-4'],
      deletedAt: null,
    },
    {
      id: 'root-2',
      name: 'Personal Archive',
      path: 'personal-archive',
      processingProfileId: 'profile-direct',
      visibility: 'RESTRICTED',
      allowedUserIds: ['puser-1', 'puser-2', 'puser-3'],
      deletedAt: null,
    },
    {
      id: 'root-3',
      name: 'Raw Video Production',
      path: 'video-production',
      processingProfileId: 'profile-video-hq-lq',
      visibility: 'PRIVATE',
      allowedUserIds: [],
      deletedAt: null,
    },
  ];

  collections: Collection[] = [
    {
      id: 'col-1',
      rootCollectionId: 'root-1',
      name: 'Instagram Imports',
      path: 'instagram-imports',
      processingProfileId: 'profile-image-feed',
      visibility: 'INHERIT',
      allowedUserIds: ['puser-1', 'puser-2'],
      deletedAt: null,
    },
    {
      id: 'col-2',
      rootCollectionId: 'root-1',
      name: 'TikTok Reels',
      path: 'tiktok-reels',
      processingProfileId: 'profile-video-feed',
      visibility: 'RESTRICTED',
      allowedUserIds: ['puser-1', 'puser-2', 'puser-3'],
      deletedAt: null,
    },
    {
      id: 'col-3',
      rootCollectionId: 'root-2',
      name: 'Family & Events 2026',
      path: 'family-events-2026',
      processingProfileId: null, // inherits from root-2 ('profile-direct')
      visibility: 'RESTRICTED',
      allowedUserIds: ['puser-1', 'puser-2'],
      deletedAt: null,
    },
    {
      id: 'col-4',
      rootCollectionId: 'root-2',
      name: 'Archived Projects',
      path: 'archived-projects',
      processingProfileId: null,
      visibility: 'PRIVATE',
      allowedUserIds: [],
      deletedAt: '2026-08-10T14:20:00.000Z', // Soft-deleted collection
    },
  ];

  mediaUsers: MediaUser[] = [
    {
      id: 'user-1',
      collectionId: 'col-1',
      username: 'alex_travels',
      displayName: 'Alex Rivers',
      processingProfileId: null,
      visibility: 'INHERIT',
      allowedUserIds: [],
      deletedAt: null,
    },
    {
      id: 'user-2',
      collectionId: 'col-1',
      username: 'sophia_art',
      displayName: 'Sophia Chen',
      processingProfileId: null,
      visibility: 'INHERIT',
      allowedUserIds: [],
      deletedAt: null,
    },
    {
      id: 'user-3',
      collectionId: 'col-2',
      username: 'jordan_reels',
      displayName: 'Jordan Miller',
      processingProfileId: 'profile-video-hq-lq', // override
      visibility: 'INHERIT',
      allowedUserIds: [],
      deletedAt: null,
    },
    {
      id: 'user-4',
      collectionId: 'col-3',
      username: 'family_vault',
      displayName: 'Family Vault Owner',
      processingProfileId: null,
      visibility: 'INHERIT',
      allowedUserIds: [],
      deletedAt: null,
    },
    {
      id: 'user-5',
      collectionId: 'col-4',
      username: 'old_legacy_user',
      displayName: 'Legacy User',
      processingProfileId: null,
      visibility: 'INHERIT',
      allowedUserIds: [],
      deletedAt: null,
    },
  ];

  media: MediaItem[] = [];
  recentActivity: {
    id: string;
    type: 'DISCOVERY' | 'PROCESSED' | 'FAILED' | 'POLICY_CHANGE' | 'DELETED';
    title: string;
    description: string;
    timestamp: string;
  }[] = [];

  constructor() {
    this.seedInitialMedia();
    this.seedInitialActivity();
  }

  private seedInitialMedia() {
    const sampleImages = [
      {
        name: 'IMG_2026_08_ALPS_01.jpg',
        userId: 'user-1',
        collectionId: 'col-1',
        rootCollectionId: 'root-1',
        type: 'IMAGE' as const,
        size: 5242880,
        width: 4032,
        height: 3024,
        tags: ['instagram', 'travel', 'mountains', 'summer2026'],
        previewUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=200&auto=format&fit=crop&q=80',
        likesCount: 142,
        savesCount: 38,
        createdAt: '2026-08-20T10:14:00.000Z',
        overrideProfileId: null,
        status: 'READY' as const,
        assets: [
          { type: 'THUMBNAIL' as const, status: 'READY' as const, path: 'thumb/IMG_2026_08_ALPS_01_thumb.webp', size: 45000 },
          { type: 'FEED_IMAGE' as const, status: 'READY' as const, path: 'feed/IMG_2026_08_ALPS_01_feed.jpg', size: 450000 },
        ],
      },
      {
        name: 'IMG_2026_08_SUNSET_LAKE.jpg',
        userId: 'user-1',
        collectionId: 'col-1',
        rootCollectionId: 'root-1',
        type: 'IMAGE' as const,
        size: 4890000,
        width: 3840,
        height: 2160,
        tags: ['travel', 'sunset', 'lake', 'scenic'],
        previewUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&auto=format&fit=crop&q=80',
        likesCount: 89,
        savesCount: 19,
        createdAt: '2026-08-22T14:30:00.000Z',
        overrideProfileId: null,
        status: 'NEEDS_PROCESSING' as const, // Missing feed image per Image Feed policy
        assets: [
          { type: 'THUMBNAIL' as const, status: 'READY' as const, path: 'thumb/IMG_2026_08_SUNSET_LAKE_thumb.webp', size: 38000 },
          { type: 'FEED_IMAGE' as const, status: 'MISSING' as const },
        ],
      },
      {
        name: 'IMG_STUDIO_CERAMICS_402.jpg',
        userId: 'user-2',
        collectionId: 'col-1',
        rootCollectionId: 'root-1',
        type: 'IMAGE' as const,
        size: 6100000,
        width: 4200,
        height: 2800,
        tags: ['art', 'ceramics', 'pottery', 'studio'],
        previewUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=200&auto=format&fit=crop&q=80',
        likesCount: 310,
        savesCount: 77,
        createdAt: '2026-08-24T09:12:00.000Z',
        overrideProfileId: null,
        status: 'READY' as const,
        assets: [
          { type: 'THUMBNAIL' as const, status: 'READY' as const, path: 'thumb/IMG_STUDIO_CERAMICS_402_thumb.webp', size: 52000 },
          { type: 'FEED_IMAGE' as const, status: 'READY' as const, path: 'feed/IMG_STUDIO_CERAMICS_402_feed.jpg', size: 580000 },
        ],
      },
      {
        name: 'RAW_DISCOVERED_IMG_0099.jpg',
        userId: 'user-2',
        collectionId: 'col-1',
        rootCollectionId: 'root-1',
        type: 'IMAGE' as const,
        size: 7800000,
        width: 6000,
        height: 4000,
        tags: ['new-import', 'raw'],
        previewUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80',
        thumbnailUrl: '',
        likesCount: 0,
        savesCount: 0,
        createdAt: '2026-08-25T06:20:00.000Z',
        overrideProfileId: null,
        status: 'NEW' as const, // Newly ingested from filesystem! No thumbnail yet
        assets: [
          { type: 'THUMBNAIL' as const, status: 'MISSING' as const },
          { type: 'FEED_IMAGE' as const, status: 'MISSING' as const },
        ],
      },
      {
        name: 'CORRUPTED_HDR_PHOTO_88.jpg',
        userId: 'user-2',
        collectionId: 'col-1',
        rootCollectionId: 'root-1',
        type: 'IMAGE' as const,
        size: 9400000,
        width: 5400,
        height: 3600,
        tags: ['hdr', 'failed'],
        previewUrl: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=200&auto=format&fit=crop&q=80',
        likesCount: 12,
        savesCount: 2,
        createdAt: '2026-08-21T18:00:00.000Z',
        overrideProfileId: null,
        status: 'FAILED' as const,
        processingError: {
          stage: 'Feed image generation',
          message: 'libvips error: Corrupted EXIF color profile header at offset 0x48',
          timestamp: '2026-08-21T18:02:15.000Z',
        },
        assets: [
          { type: 'THUMBNAIL' as const, status: 'READY' as const, path: 'thumb/CORRUPTED_HDR_PHOTO_88_thumb.webp', size: 39000 },
          { type: 'FEED_IMAGE' as const, status: 'FAILED' as const, error: 'libvips header error' },
        ],
      },
      {
        name: 'FAMILY_PICNIC_AUGUST_2026.jpg',
        userId: 'user-4',
        collectionId: 'col-3',
        rootCollectionId: 'root-2',
        type: 'IMAGE' as const,
        size: 3400000,
        width: 3200,
        height: 2400,
        tags: ['family', 'picnic', 'summer2026'],
        previewUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=200&auto=format&fit=crop&q=80',
        likesCount: 45,
        savesCount: 12,
        createdAt: '2026-08-18T12:00:00.000Z',
        overrideProfileId: null, // Inherits Direct -> requires only Thumbnail
        status: 'READY' as const,
        assets: [
          { type: 'THUMBNAIL' as const, status: 'READY' as const, path: 'thumb/FAMILY_PICNIC_thumb.webp', size: 28000 },
        ],
      },
      {
        name: 'OLD_TRIP_DELETED_SAMPLE.jpg',
        userId: 'user-1',
        collectionId: 'col-1',
        rootCollectionId: 'root-1',
        type: 'IMAGE' as const,
        size: 2100000,
        width: 2400,
        height: 1600,
        tags: ['deleted', 'trash'],
        previewUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200&auto=format&fit=crop&q=80',
        likesCount: 5,
        savesCount: 0,
        createdAt: '2026-07-15T08:00:00.000Z',
        deletedAt: '2026-08-23T11:00:00.000Z', // Soft-deleted!
        overrideProfileId: null,
        status: 'READY' as const,
        assets: [
          { type: 'THUMBNAIL' as const, status: 'READY' as const, path: 'thumb/OLD_TRIP_thumb.webp', size: 24000 },
        ],
      },
    ];

    const sampleVideos = [
      {
        name: 'REEL_URBAN_SKATE_4K.mp4',
        userId: 'user-3',
        collectionId: 'col-2',
        rootCollectionId: 'root-1',
        type: 'VIDEO' as const,
        size: 48500000,
        width: 1080,
        height: 1920,
        duration: 28.5,
        bitrate: 13500,
        tags: ['tiktok', 'reels', 'skate', 'urban'],
        previewUrl: 'https://images.unsplash.com/photo-1564982752979-3f7bc974d29a?w=800&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1564982752979-3f7bc974d29a?w=200&auto=format&fit=crop&q=80',
        likesCount: 890,
        savesCount: 240,
        createdAt: '2026-08-23T16:45:00.000Z',
        overrideProfileId: null, // user-3 uses 'profile-video-hq-lq' -> requires Thumbnail, HLS, LowQuality
        status: 'READY' as const,
        assets: [
          { type: 'THUMBNAIL' as const, status: 'READY' as const, path: 'thumb/REEL_URBAN_SKATE_thumb.webp', size: 55000 },
          { type: 'HLS' as const, status: 'READY' as const, path: 'hls/REEL_URBAN_SKATE/master.m3u8', size: 32000000 },
          { type: 'LOW_QUALITY' as const, status: 'READY' as const, path: 'lq/REEL_URBAN_SKATE_720p.mp4', size: 12000000 },
        ],
      },
      {
        name: 'REEL_COFFEE_BREW_LATTE.mp4',
        userId: 'user-3',
        collectionId: 'col-2',
        rootCollectionId: 'root-1',
        type: 'VIDEO' as const,
        size: 36200000,
        width: 1080,
        height: 1920,
        duration: 18.2,
        bitrate: 15800,
        tags: ['coffee', 'barista', 'reels', 'morning'],
        previewUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&auto=format&fit=crop&q=80',
        likesCount: 450,
        savesCount: 112,
        createdAt: '2026-08-24T08:30:00.000Z',
        overrideProfileId: null,
        status: 'NEEDS_PROCESSING' as const, // Missing Low Quality rendition
        assets: [
          { type: 'THUMBNAIL' as const, status: 'READY' as const, path: 'thumb/REEL_COFFEE_BREW_thumb.webp', size: 48000 },
          { type: 'HLS' as const, status: 'READY' as const, path: 'hls/REEL_COFFEE_BREW/master.m3u8', size: 22000000 },
          { type: 'LOW_QUALITY' as const, status: 'MISSING' as const },
        ],
      },
      {
        name: 'RAW_INGEST_DRONE_CLIFFS.mp4',
        userId: 'user-3',
        collectionId: 'col-2',
        rootCollectionId: 'root-1',
        type: 'VIDEO' as const,
        size: 142000000,
        width: 3840,
        height: 2160,
        duration: 45.0,
        bitrate: 25000,
        tags: ['drone', 'cinematic', 'new-import'],
        previewUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&auto=format&fit=crop&q=80',
        thumbnailUrl: '',
        likesCount: 0,
        savesCount: 0,
        createdAt: '2026-08-25T07:10:00.000Z',
        overrideProfileId: null,
        status: 'NEW' as const, // Newly ingested
        assets: [
          { type: 'THUMBNAIL' as const, status: 'MISSING' as const },
          { type: 'HLS' as const, status: 'MISSING' as const },
          { type: 'LOW_QUALITY' as const, status: 'MISSING' as const },
        ],
      },
      {
        name: 'FAIL_CORRUPT_CODEC_TEST.mp4',
        userId: 'user-3',
        collectionId: 'col-2',
        rootCollectionId: 'root-1',
        type: 'VIDEO' as const,
        size: 18000000,
        width: 1920,
        height: 1080,
        duration: 12.0,
        bitrate: 12000,
        tags: ['test', 'failed-video'],
        previewUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop&q=80',
        likesCount: 0,
        savesCount: 0,
        createdAt: '2026-08-22T20:15:00.000Z',
        overrideProfileId: null,
        status: 'FAILED' as const,
        processingError: {
          stage: 'HLS generation',
          message: 'ffmpeg exited with code 1: [h264 @ 0x55bc12] non-existing PPS 0 referenced',
          timestamp: '2026-08-22T20:17:40.000Z',
        },
        assets: [
          { type: 'THUMBNAIL' as const, status: 'READY' as const, path: 'thumb/FAIL_CORRUPT_CODEC_thumb.webp', size: 31000 },
          { type: 'HLS' as const, status: 'FAILED' as const, error: 'ffmpeg non-existing PPS 0 referenced' },
          { type: 'LOW_QUALITY' as const, status: 'MISSING' as const },
        ],
      },
      {
        name: 'IN_TRANSCODE_STORM_CHASE.mp4',
        userId: 'user-3',
        collectionId: 'col-2',
        rootCollectionId: 'root-1',
        type: 'VIDEO' as const,
        size: 92000000,
        width: 1920,
        height: 1080,
        duration: 35.0,
        bitrate: 21000,
        tags: ['weather', 'storm', 'chase'],
        previewUrl: 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?w=800&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?w=200&auto=format&fit=crop&q=80',
        likesCount: 15,
        savesCount: 4,
        createdAt: '2026-08-25T07:40:00.000Z',
        overrideProfileId: null,
        status: 'PROCESSING' as const, // Currently processing
        assets: [
          { type: 'THUMBNAIL' as const, status: 'READY' as const, path: 'thumb/IN_TRANSCODE_STORM_thumb.webp', size: 42000 },
          { type: 'HLS' as const, status: 'PROCESSING' as const },
          { type: 'LOW_QUALITY' as const, status: 'MISSING' as const },
        ],
      },
    ];

    let idCounter = 1;
    [...sampleImages, ...sampleVideos].forEach((item) => {
      const mediaId = `media-${idCounter++}`;
      const assets: MediaAsset[] = item.assets.map((a, idx) => ({
        id: `asset-${mediaId}-${idx + 1}`,
        mediaId,
        type: a.type,
        status: a.status,
        path: a.path,
        size: a.size,
        error: a.error,
        generatedAt: a.status === 'READY' ? '2026-08-24T12:00:00.000Z' : undefined,
      }));

      const collection = this.collections.find((c) => c.id === item.collectionId);
      const rootCollection = this.rootCollections.find((r) => r.id === item.rootCollectionId);
      const user = this.mediaUsers.find((u) => u.id === item.userId);

      const path = `${rootCollection?.path || 'root'}/${collection?.path || 'col'}/${user?.username || 'user'}/${item.name}`;

      this.media.push({
        id: mediaId,
        name: item.name,
        type: item.type,
        path,
        size: item.size,
        width: item.width,
        height: item.height,
        duration: (item as any).duration,
        bitrate: (item as any).bitrate,
        mktime: item.createdAt,
        createdAt: item.createdAt,
        updatedAt: item.createdAt,
        deletedAt: (item as any).deletedAt || null,
        userId: item.userId,
        userName: user?.displayName,
        collectionId: item.collectionId,
        collectionName: collection?.name,
        rootCollectionId: item.rootCollectionId,
        rootCollectionName: rootCollection?.name,
        processingProfileId: item.overrideProfileId,
        visibility: null, // Inherit
        allowedUserIds: [],
        tags: item.tags,
        likesCount: item.likesCount,
        savesCount: item.savesCount,
        previewUrl: item.previewUrl,
        thumbnailUrl: item.thumbnailUrl,
        assets,
        processingStatus: item.status,
        processingError: (item as any).processingError || null,
      });
    });
  }

  private seedInitialActivity() {
    this.recentActivity = [
      {
        id: 'act-1',
        type: 'DISCOVERY',
        title: 'New media discovered',
        description: 'Discovered RAW_DISCOVERED_IMG_0099.jpg and RAW_INGEST_DRONE_CLIFFS.mp4 in filesystem',
        timestamp: '2026-08-25T07:10:00.000Z',
      },
      {
        id: 'act-2',
        type: 'FAILED',
        title: 'Video transcode failed',
        description: 'FAIL_CORRUPT_CODEC_TEST.mp4 failed at HLS stage (ffmpeg code 1)',
        timestamp: '2026-08-22T20:17:40.000Z',
      },
      {
        id: 'act-3',
        type: 'PROCESSED',
        title: 'Batch processing completed',
        description: 'Successfully generated HLS & 720p renditions for REEL_URBAN_SKATE_4K.mp4',
        timestamp: '2026-08-23T16:50:00.000Z',
      },
      {
        id: 'act-4',
        type: 'POLICY_CHANGE',
        title: 'Processing profile updated',
        description: 'User @jordan_reels set profile override to "Video Feed + Low Quality"',
        timestamp: '2026-08-23T14:10:00.000Z',
      },
    ];
  }
}

export const db = new DatabaseStore();
