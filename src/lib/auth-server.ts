import { cookies } from 'next/headers';

export async function isUserLoggedIn() {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token');
    return !!sessionToken;
}
