import fs from "fs"
import path from "path"
import Ffmpeg from "fluent-ffmpeg"
import { VideoInspector, ThumbnailOptions } from "@/utils/VideoInspector"
import prisma from "@/utils/prisma"

export interface VideoRecord {
  id: string
  path: string
}

export interface TranscodedVariant {
  name: "1080p" | "720p"
  filePath: string // mp4 file
  bitrate: string
  resolution: string
  hlsDir?: string // directory for hls output for this variant
  playlistPath?: string // variant .m3u8
}

export default class VideoService {
  // --- DB hook (prisma) ---
  static async getVideoRecord(id: string): Promise<VideoRecord | null> {
    return prisma.media.findUnique({
      where: { id },
      select: { id: true, path: true }
    })
  }

  // --- Internal helper to resolve local output paths ---
  static getOutputsBaseDir(): string {
    // choose a base location for transcoded assets
    // adapt to your environment
    return path.join(process.cwd(), "data", "videos")
  }

  static getVariantFilePath(id: string, variant: "1080p" | "720p") {
    return path.join(this.getOutputsBaseDir(), id, `${variant}.mp4`)
  }

  static getVariantHlsDir(id: string, variant: "1080p" | "720p") {
    return path.join(this.getOutputsBaseDir(), id, "hls", variant)
  }

  static getMasterPlaylistPath(id: string) {
    return path.join(this.getOutputsBaseDir(), id, "hls", "master.m3u8");
  }

  // --- Transcode helper (mp4 variant) ---
  // Produces MP4 with H.264 (libx264) using reasonable presets and bitrate targets.
  static transcodeVariant(
    sourcePath: string,
    outPath: string,
    options: {
      width?: number;
      height?: number;
      videoBitrate?: string; // e.g., "4000k"
      audioBitrate?: string; // e.g., "128k"
      preset?: string; // e.g., "fast"
    }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // ensure output dir
      fs.mkdirSync(path.dirname(outPath), { recursive: true });

      const { width, height, videoBitrate = "3000k", audioBitrate = "128k", preset = "fast" } = options;

      const command = Ffmpeg(sourcePath)
        .outputOptions(
          "-c:v libx264",
          `-preset ${preset}`,
          "-profile:v main",
          "-movflags +faststart",
          `-c:a aac`,
          `-b:a ${audioBitrate}`,
          `-pix_fmt yuv420p`
        )
        .videoBitrate(videoBitrate)
        .on("end", () => resolve())
        .on("error", (err) => reject(err));

      if (width || height) {
        // use -2 to keep even width
        const scaleArg = `scale=${width ? width : -2}:${height ? height : -2}`;
        command.outputOptions(`-vf ${scaleArg}`);
      }

      command.save(outPath);
    });
  }

  // --- Create HLS for a specific variant ---
  // Produces .m3u8 + .ts segments in the variant HLS directory.
  static createHLSVariant(
    sourcePath: string,
    hlsDir: string,
    options: {
      variantName: string;
      width?: number;
      height?: number;
      videoBitrate?: string; // target video bitrate (e.g., "3500k")
      maxRate?: string; // e.g., "4000k"
      bufSize?: string; // e.g., "6000k"
      audioBitrate?: string; // e.g., "128k"
      segmentTime?: number; // seconds
    }
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.mkdirSync(hlsDir, { recursive: true });

      const {
        variantName,
        width,
        height,
        videoBitrate = "3000k",
        maxRate = "3500k",
        bufSize = "6000k",
        audioBitrate = "128k",
        segmentTime = 6
      } = options;

      const playlistName = `${variantName}.m3u8`;
      const playlistPath = path.join(hlsDir, playlistName);

      // build ffmpeg command
      // Using H.264 + AAC, segment_time and hls_flags single_file = false to create segments + playlist
      // Use -hls_playlist_type vod for VOD playlists
      const cmd = Ffmpeg(sourcePath)
        .outputOptions(
          "-c:v libx264",
          `-b:v ${videoBitrate}`,
          `-maxrate ${maxRate}`,
          `-bufsize ${bufSize}`,
          "-sc_threshold 0",
          "-g 48", // GOP size (adjust depending on FPS)
          "-keyint_min 48",
          "-c:a aac",
          `-b:a ${audioBitrate}`,
          "-ac 2",
          "-hls_time " + segmentTime,
          "-hls_playlist_type vod",
          `-hls_segment_filename ${path.join(hlsDir, `${variantName}_%03d.ts`)}`,
          "-hls_flags independent_segments" // ensures segment start with keyframe
        )
        .on("end", () => resolve(playlistPath))
        .on("error", (err) => reject(err));

      if (width || height) {
        const scaleArg = `scale=${width ? width : -2}:${height ? height : -2}`;
        cmd.outputOptions(`-vf ${scaleArg}`);
      }

      cmd.save(playlistPath);
    });
  }

  // --- Build a master playlist that references variant playlists ---
  static async createHLSMasterPlaylist(id: string, variants: TranscodedVariant[]): Promise<string> {
    const masterPath = this.getMasterPlaylistPath(id);
    fs.mkdirSync(path.dirname(masterPath), { recursive: true });

    // Each variant entry includes BANDWIDTH and RESOLUTION; the playlist paths should be relative for serving
    const lines: string[] = ["#EXTM3U", "#EXT-X-VERSION:3"];

    for (const v of variants) {
      if (!v.playlistPath) continue;
      // assume we will serve files under /api/video/:id/hls/... so create relative URI
      const relativeUri = path.posix.join("/", "api", "video", id, "hls", path.basename(v.playlistPath));
      // approximate bandwidth (convert '3000k' -> 3000000)
      const bw = parseInt(v.bitrate.replace(/[^\d]/g, ""), 10) * 1000;
      lines.push(`#EXT-X-STREAM-INF:BANDWIDTH=${bw},RESOLUTION=${v.resolution}`);
      lines.push(relativeUri);
    }

    fs.writeFileSync(masterPath, lines.join("\n"));
    return masterPath;
  }

  // --- Convenience: transcode both variants and create HLS ---
  static async ensureTranscodedAndHls(id: string): Promise<{ variants: TranscodedVariant[]; masterPlaylist: string }> {
    const record = await this.getVideoRecord(id);
    if (!record) throw new Error("Video not found");

    const source = record.path;
    const outBase = path.join(this.getOutputsBaseDir(), id);

    // variant definitions
    const defs: { name: "1080p" | "720p"; width: number; height: number; videoBitrate: string; audioBitrate: string }[] = [
      { name: "1080p", width: 1920, height: 1080, videoBitrate: "5000k", audioBitrate: "192k" },
      { name: "720p", width: 1280, height: 720, videoBitrate: "3000k", audioBitrate: "128k" }
    ];

    const variants: TranscodedVariant[] = [];

    // loop: ensure mp4 exists, ensure hls exists
    for (const d of defs) {
      const filePath = this.getVariantFilePath(id, d.name);
      const hlsDir = this.getVariantHlsDir(id, d.name);
      const playlistPath = path.join(hlsDir, `${d.name}.m3u8`);

      // transcode mp4 if missing
      if (!fs.existsSync(filePath)) {
        await this.transcodeVariant(source, filePath, {
          width: d.width,
          height: d.height,
          videoBitrate: d.videoBitrate,
          audioBitrate: d.audioBitrate,
          preset: "fast"
        });
      }

      // create HLS variant playlist if missing
      if (!fs.existsSync(playlistPath)) {
        await this.createHLSVariant(source, hlsDir, {
          variantName: d.name,
          width: d.width,
          height: d.height,
          videoBitrate: d.videoBitrate,
          audioBitrate: d.audioBitrate,
          segmentTime: 6
        });
      }

      variants.push({
        name: d.name,
        filePath,
        bitrate: d.videoBitrate,
        resolution: `${d.width}x${d.height}`,
        hlsDir,
        playlistPath
      });
    }

    // create master playlist
    const masterPlaylist = await this.createHLSMasterPlaylist(id, variants);

    return { variants, masterPlaylist };
  }

  // --- Thumbnail convenience (delegates to VideoInspector) ---
  static async getThumbnail(id: string) {
    const record = await this.getVideoRecord(id);
    if (!record) throw new Error("Video not found");

    const thumbPath = path.join(this.getOutputsBaseDir(), id, "thumb.jpg");

    if (!fs.existsSync(thumbPath)) {
      const inspector = new VideoInspector(record.path);
      await inspector.extractThumbnail({
        atSecond: 1,
        outputDir: path.dirname(thumbPath),
        outputName: path.basename(thumbPath)
      } as ThumbnailOptions);
    }

    return thumbPath;
  }

  // --- Stream MP4 (existing) ---
  static async streamVideo(id: string, rangeHeader?: string) {
    const record = await this.getVideoRecord(id);
    if (!record) throw new Error("Video not found");

    const videoPath = record.path;
    const stat = fs.statSync(videoPath);
    const videoSize = stat.size;

    if (!rangeHeader) {
      return {
        status: 200,
        headers: {
          "Content-Type": "video/mp4",
          "Content-Length": videoSize.toString()
        },
        stream: fs.createReadStream(videoPath)
      };
    }

    const CHUNK = 1_000_000;

    const [startStr, endStr] = rangeHeader.replace(/bytes=/, "").split("-");
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : Math.min(start + CHUNK, videoSize - 1);

    const contentLength = end - start + 1;

    return {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength.toString(),
        "Content-Type": "video/mp4"
      },
      stream: fs.createReadStream(videoPath, { start, end })
    };
  }
}
