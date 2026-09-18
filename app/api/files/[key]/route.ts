import { publicFileUrl } from '../../../public-backend';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const url = publicFileUrl((await params).key);
  if (!url) return new Response('Not found', { status: 404 });
  // The browser retrieves media directly, preserving Range requests and avoiding
  // Vercel Function payload limits for uploaded video/audio/PDF files.
  return new Response(null, { status: 307, headers: { Location: url, 'Cache-Control': 'no-store' } });
}
export const HEAD = GET;
