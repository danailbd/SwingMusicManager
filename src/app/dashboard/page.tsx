import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Dashboard from '@/components/dashboard';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('spotify_access_token')?.value;
  const userProfile = cookieStore.get('user_profile')?.value;

  if (!accessToken || !userProfile) {
    redirect('/?error=not_authenticated');
  }

  const user = JSON.parse(userProfile);

  return <Dashboard user={user} accessToken={accessToken} />;
}
