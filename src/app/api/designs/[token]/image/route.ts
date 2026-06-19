import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const design = await prisma.design.findUnique({ where: { shareToken: params.token } });

  if (!design || !design.canvasData) {
    return new NextResponse('Not found', { status: 404 });
  }

  // Strip data URL prefix if present
  const base64 = design.canvasData.replace(/^data:image\/\w+;base64,/, '');
  const buf = Buffer.from(base64, 'base64');

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
