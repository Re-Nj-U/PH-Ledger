import LedgerApp from './ledger-app';
import IdleSession from './idle-session';
import { redirect } from 'next/navigation';
import { getUser } from '../lib/auth';
export const dynamic='force-dynamic';
export default async function Home(){
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) redirect('/login');
    const user = await getUser();
    if (!user) redirect('/login');
    return <IdleSession initial={{ expiresAt: user.idleExpiresAt, serverNow: Date.now() }}><LedgerApp accountUser={{ email: user.email, name: user.displayName }}/></IdleSession>;
}
