import { z } from 'zod';
import { initialEntries, type Entry } from './content';

// This public read bridge deliberately has no access to sign-in headers or cookies.
export const CONTENT_ORIGIN = 'https://parkhyeonuk-still-making.skfkgusdnr75.chatgpt.site';
export const EDITOR_URL = CONTENT_ORIGIN + '/admin';

const uploadKey = /^[a-f0-9-]+\.[a-z0-9]+$/;
const localAsset = z.string().max(300).refine(value => !value ||
  /^\/art\/(sculpture|mangrove|paper-cat)\.webp$/.test(value) ||
  /^\/api\/files\/[a-f0-9-]+\.[a-z0-9]+$/.test(value));
const safeLink = z.string().max(2000).refine(value => {
  if (!value) return true;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password; }
  catch { return false; }
});
const entrySchema = z.object({
  week: z.number().int().min(0).max(9), title: z.string().min(1).max(120),
  subtitle: z.string().max(200), medium: z.string().max(80),
  body: z.string().max(50000), published: z.boolean(), cover: localAsset,
  assets: z.array(z.object({ url: localAsset.refine(Boolean), name: z.string().max(200), type: z.string().max(80) })).max(40),
  link: safeLink, updated: z.string().max(100),
});
const entriesSchema = z.object({ entries: z.array(entrySchema).max(10) }).refine(
  data => new Set(data.entries.map(entry => entry.week)).size === data.entries.length,
  'Duplicate week',
);
const gallerySchema = z.object({ photos: z.array(z.object({
  url: z.string().max(300).regex(/^\/api\/files\/[a-f0-9-]+\.(jpg|png|webp)$/),
  name: z.string().max(200), caption: z.string().max(80),
})).max(20) });

async function publicRead(path: '/api/entries' | '/api/camera-photos'): Promise<unknown> {
  const response = await fetch(CONTENT_ORIGIN + path, {
    method: 'GET', headers: { Accept: 'application/json' }, credentials: 'omit',
    cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000),
  });
  if (!response.ok || !(response.headers.get('content-type') || '').includes('application/json')) {
    throw new Error('Published content unavailable');
  }
  const body = await response.text();
  if (body.length > 1000000) throw new Error('Published content too large');
  return JSON.parse(body);
}

export async function readPublishedEntries(): Promise<{ entries: Entry[]; canEdit: false }> {
  const data = entriesSchema.parse(await publicRead('/api/entries'));
  const byWeek = new Map(data.entries.filter(entry => entry.published).map(entry => [entry.week, entry]));
  // Keep the ten week slots used by the archive and its next-story navigation.
  // An unpublished upstream row never contributes even its title or subtitle.
  const entries = initialEntries.map(template => byWeek.get(template.week) ?? {
    ...template, published: false, body: '', cover: '', assets: [], link: '', updated: '',
  });
  return { entries, canEdit: false };
}

export async function readPublishedGallery() {
  return gallerySchema.parse(await publicRead('/api/camera-photos'));
}

export function publicFileUrl(key: string): string | null {
  return key.length <= 200 && uploadKey.test(key) ? CONTENT_ORIGIN + '/api/files/' + key : null;
}

export function readOnlyResponse(allow = 'GET, HEAD'): Response {
  return Response.json({
    error: '기록 관리는 기존 작성자 페이지에서 할 수 있어요.', editorUrl: EDITOR_URL,
  }, { status: 405, headers: { Allow: allow, 'Cache-Control': 'no-store' } });
}
