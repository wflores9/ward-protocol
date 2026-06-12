import { NextResponse } from 'next/server';

const HEALTH_URL = 'https://api.wardprotocol.org/health';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const response = await fetch(HEALTH_URL, { cache: 'no-store' });
    const payload = await response.json();

    return NextResponse.json(payload, {
      status: response.ok ? 200 : response.status,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json(
      { status: 'offline' },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  }
}
