import prisma from "@/app/lib/prisma";
import { notificationService } from "./notification-service";

export const inventoryService = {
  async getAll() {
    return await prisma.inventoryBatch.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        movements: true,
      }
    });
  },

  async create(data: any) {
    return await prisma.inventoryBatch.create({
      data: {
        batchId: data.batch || data.batchId,
        weight: data.weight,
        karat: data.karat,
        fineWeight: data.fine || data.fineWeight,
        location: data.location,
        status: data.status || "Available",
        value: data.value,
        source: data.source,
        transactionId: data.transactionId,
      }
    });
  },

  async update(idOrBatchId: string, data: any) {
    return await prisma.$transaction(async (tx) => {
      let oldBatch = await tx.inventoryBatch.findUnique({ where: { id: idOrBatchId } });
      if (!oldBatch) {
        oldBatch = await tx.inventoryBatch.findUnique({ where: { batchId: idOrBatchId } });
      }
      if (!oldBatch) throw new Error("Batch not found");

      const batch = await tx.inventoryBatch.update({
        where: { id: oldBatch.id },
        data
      });

      // Logic: Log movement if weight or location changed
      if (data.weight !== undefined && data.weight !== oldBatch.weight) {
        await tx.movement.create({
          data: {
            batchId: batch.batchId,
            type: "Adjustment",
            before: oldBatch.weight,
            delta: batch.weight - oldBatch.weight,
            after: batch.weight,
            user: "System",
            reference: "Weight Update"
          }
        });

        // Trigger real-time notification if weight falls below 750g
        if (batch.weight < 750) {
          try {
            await notificationService.create({
              kind: "stock",
              title: "Low stock alert",
              body: `${batch.karat}K grade batch ${batch.batchId} is at ${batch.weight}g — below 750g safety threshold.`
            });
          } catch (e) {
            console.error("Failed to trigger stock alert notification:", e);
          }
        }
      }

      if (data.location !== undefined && data.location !== oldBatch.location) {
        // Increment new site stock
        await tx.site.updateMany({
          where: { name: batch.location },
          data: { currentStock: { increment: batch.weight } }
        });
        // Decrement old site stock
        await tx.site.updateMany({
          where: { name: oldBatch.location },
          data: { currentStock: { decrement: batch.weight } }
        });

        await tx.movement.create({
          data: {
            batchId: batch.batchId,
            type: "Movement",
            before: batch.weight,
            delta: 0,
            after: batch.weight,
            user: "System",
            reference: `Moved from ${oldBatch.location} to ${batch.location}`
          }
        });
      }

      return batch;
    });
  },

  async addMovement(data: any) {
    return await prisma.movement.create({
      data: {
        batchId: data.batchId,
        type: data.type,
        before: data.before,
        delta: data.delta,
        after: data.after,
        user: data.user,
        reference: data.reference,
      }
    });
  },

  async getMovements() {
    return await prisma.movement.findMany({
      orderBy: { timestamp: "desc" }
    });
  }
};
