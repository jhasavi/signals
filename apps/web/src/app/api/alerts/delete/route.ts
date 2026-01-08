import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const id = formData.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify user via cookie - do not trust form-submitted userId
    const cookieStore = cookies();
    const userId = cookieStore.get('user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete saved search (verify user_id matches for security)
    await sql`
      DELETE FROM saved_searches
      WHERE id = ${Number(id)}
        AND user_id = ${userId}
    `;

    // Redirect back to alerts page
    redirect('/alerts');
  } catch (error) {
    console.error('Error deleting alert:', error);
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 });
  }
}
