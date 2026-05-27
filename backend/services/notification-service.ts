import prisma from "@/app/lib/prisma";
import { EventEmitter } from "events";

export const notificationEvents = new EventEmitter();
notificationEvents.setMaxListeners(100);

export const notificationService = {
  async getAll() {
    return await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  },

  async create(data: { kind: string; title: string; body: string }) {
    const notification = await prisma.notification.create({
      data: {
        kind: data.kind,
        title: data.title,
        body: data.body,
        unread: true,
      },
    });

    // Emit event to stream clients
    notificationEvents.emit("new-notification", notification);
    return notification;
  },

  async markAllRead() {
    return await prisma.notification.updateMany({
      where: { unread: true },
      data: { unread: false },
    });
  },

  async markRead(id: string) {
    return await prisma.notification.update({
      where: { id },
      data: { unread: false },
    });
  }
};
