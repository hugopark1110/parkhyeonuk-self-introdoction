import { CONTENT_ORIGIN, publicFileUrl } from '../../../public-backend';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const key = (await params).key;
  // This small, public cover must not depend on cross-site browser cookies.
  if (key === 'a7eb46ac8ca2b5e9efc3c359593ce67cb7cc6da2398b4e07d962d5b09bb8001e.jpg') {
    try {
      const asset = await fetch(CONTENT_ORIGIN + '/art/gallery-card-' + key, {
        credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(10000),
        next: { revalidate: 86400 },
      });
      if (!asset.ok || !asset.headers.get('content-type')?.startsWith('image/jpeg')) {
        return new Response('Cover unavailable', { status: 502 });
      }
      return new Response(_request.method === 'HEAD' ? null : asset.body, {
        headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' },
      });
    } catch { return new Response('Cover unavailable', { status: 502 }); }
  }
  const url = publicFileUrl(key);
  if (!url) return new Response('Not found', { status: 404 });
  // The browser retrieves media directly, preserving Range requests and avoiding
  // Vercel Function payload limits for uploaded video/audio/PDF files.
  return new Response(null, { status: 307, headers: { Location: url, 'Cache-Control': 'no-store' } });
}
export const HEAD = GET;
