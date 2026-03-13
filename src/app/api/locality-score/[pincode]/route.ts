import { NextResponse } from 'next/server';
import { getLocalityScoreByPincode } from '@/server/data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _request: Request,
  context: { params: Promise<{ pincode: string }> }
) {
  try {
    const { pincode } = await context.params;
    const result = await getLocalityScoreByPincode(pincode);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch locality score.';
    const status = message.toLowerCase().includes('database unavailable') ? 503 : 400;
    return NextResponse.json({ message }, { status });
  }
}
