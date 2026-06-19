import { prisma } from './db';

export async function getSessionFromDB(id: string) {
  return prisma.session.findUnique({ where: { id } });
}

export async function saveSessionToDB(session: {
  id: string;
  shop: string;
  state: string;
  isOnline: boolean;
  scope?: string;
  expires?: Date;
  accessToken: string;
  userId?: bigint;
}) {
  return prisma.session.upsert({
    where: { id: session.id },
    update: {
      shop: session.shop,
      state: session.state,
      isOnline: session.isOnline,
      scope: session.scope,
      expires: session.expires,
      accessToken: session.accessToken,
      userId: session.userId,
    },
    create: session,
  });
}

export async function deleteSessionFromDB(id: string) {
  return prisma.session.delete({ where: { id } }).catch(() => null);
}

export async function getShopSession(shop: string) {
  return prisma.session.findFirst({
    where: { shop, isOnline: false },
    orderBy: { createdAt: 'desc' },
  });
}
