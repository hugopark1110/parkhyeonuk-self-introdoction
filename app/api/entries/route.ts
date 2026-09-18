import { readPublishedEntries, readOnlyResponse } from '../../public-backend';
export const dynamic = 'force-dynamic';
export async function GET() {
  try { return Response.json(await readPublishedEntries(), { headers: { 'Cache-Control': 'no-store' } }); }
  catch { return Response.json({ error: '기록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
}
export function PUT() { return readOnlyResponse(); }
