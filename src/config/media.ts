/** P8b job media limits from `Implementation_Phase_2 - Stage 1.md` (Section 3.8). */
export const jobMedia = {
  maxItems: 10,
  maxVideos: 2,
  videoMaxSeconds: 30,
  videoMaxBytes: 25 * 1024 * 1024,
  imageMaxEdge: 1600,
  imageQuality: 0.7,
  draftDir: 'gabfix-media/draft',
  bookingsDir: 'gabfix-media/bookings',
} as const;

export const jobMediaAccept = {
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  videos: ['video/mp4', 'video/quicktime'],
} as const;
