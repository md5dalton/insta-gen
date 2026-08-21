# Expo Video Example (Private HLS flow)

This example demonstrates the recommended flow for private HLS content with an Expo client using `expo-video`.

Overview
- Client requests a short-lived presigned manifest URL from your server (with authorization).
- Server validates the user and returns `{ url: 'https://...' }` pointing to a presigned `.m3u8`.
- Client passes that URL into `expo-video`'s `Video` component.

Files
- `App.js` — Expo client that fetches the presigned manifest and plays it with `expo-video`.
- `mock-server.js` — Minimal Express server that simulates returning a presigned manifest URL (for local testing).

Quick start

1. Start the mock server (node):

```bash
cd examples/expo-video
npm install
node mock-server.js
```

2. In another terminal, run the Expo app (you need `expo-cli` installed):

```bash
cd examples/expo-video
npm install
expo start
```

3. Set `API_BASE_URL` and `AUTH_TOKEN` in the app or use the in-app defaults.

Notes
- This is a minimal demo. Replace the mock server with your real API route (the Next.js route at `app/api/media/video/[id]/[variant]/index.m3u8/route.ts`).
- The server should return presigned URLs for both the master playlist and (ideally) segment URLs, or rewrite the playlist to include presigned segment URLs.
