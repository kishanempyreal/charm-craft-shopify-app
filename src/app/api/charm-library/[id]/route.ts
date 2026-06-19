import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const charm = await prisma.charm.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        image: body.image,
        price: parseFloat(body.price) || 0,
        category: body.category,
        engravable: body.category === 'engravable',
        active: body.active !== undefined ? body.active : true,
        sortOrder: body.sortOrder || 0,
      },
    });
    return NextResponse.json({ charm });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.charm.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
