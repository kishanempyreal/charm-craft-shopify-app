import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function generateSlots(count: number) {
  const slots = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / (count - 1)) * 180 - 90;
    const rad = (angle * Math.PI) / 180;
    const x = 50 + 35 * Math.sin(rad);
    const y = 50 + 15 * (1 - Math.cos(rad));
    slots.push({ id: `slot-${i + 1}`, x: Math.round(x), y: Math.round(y), label: `Slot ${i + 1}` });
  }
  return slots;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { shop, chainId, chainName, slotCount } = body;

  if (!shop || !chainId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const slots = generateSlots(slotCount || 8);

  await prisma.chainSlotConfig.upsert({
    where: { shop_chainId: { shop, chainId } },
    update: { chainName, slots: JSON.stringify(slots) },
    create: { shop, chainId, chainName, slots: JSON.stringify(slots) },
  });

  return NextResponse.json({ success: true, slots });
}
