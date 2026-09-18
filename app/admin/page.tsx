import { redirect } from 'next/navigation';
import { EDITOR_URL } from '../public-backend';
export const dynamic = 'force-dynamic';
export default function Page() { redirect(EDITOR_URL); }
