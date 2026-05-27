import prisma from "@/app/lib/prisma";
import { notificationService } from "./notification-service";

export const transactionService = {
  async getAll(user?: any) {
    const where: any = {};
    if (user && user.role !== "admin") {
      where.createdBy = user.email;
    }

    return await prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        inventoryBatches: true,
        cashFlowEntries: true,
      }
    });
  },

  async create(data: any) {
    const transaction = await prisma.transaction.create({
      data: {
        ref: data.ref,
        date: new Date(data.date),
        type: data.type,
        party: data.party,
        amount: data.amount,
        status: data.status || "pending",
        description: data.description,
        createdBy: data.createdBy || "System",
      }
    });

    // Create real-time notification
    try {
      await notificationService.create({
        kind: "approval",
        title: "Pending approval",
        body: `${transaction.createdBy} submitted ${transaction.ref} — ${transaction.party} purchase, $${transaction.amount.toLocaleString()}.`
      });
    } catch (e) {
      console.error("Failed to create transaction notification:", e);
    }

    return transaction;
  },

  async update(idOrRef: string, data: any) {
    return await prisma.$transaction(async (tx) => {
      let existingTx = await tx.transaction.findUnique({ where: { id: idOrRef } });
      if (!existingTx) {
        existingTx = await tx.transaction.findUnique({ where: { ref: idOrRef } });
      }
      if (!existingTx) throw new Error("Transaction not found");

      const transaction = await tx.transaction.update({
        where: { id: existingTx.id },
        data: {
          ...data,
          date: data.date ? new Date(data.date) : undefined
        }
      });

      // Coordination Logic: If transaction is confirmed and was not confirmed before
      if (data.status === "confirmed" && existingTx.status !== "confirmed") {
        if (transaction.type === "Gold Purchase") {
          // Create an inventory batch automatically
          await tx.inventoryBatch.create({
            data: {
              batchId: `BATCH-${transaction.ref}`,
              weight: 0, 
              karat: 24,
              fineWeight: 0,
              location: "Vault",
              status: "Available",
              source: transaction.ref,
              transactionId: transaction.id
            }
          });
        }

        // Create a cash flow entry
        await tx.cashFlow.create({
          data: {
            date: transaction.date,
            type: transaction.type === "Gold Sale" ? "in" : "out",
            category: transaction.type,
            description: `Linked to ${transaction.ref}`,
            amount: Math.abs(transaction.amount),
            transactionId: transaction.id,
            createdBy: transaction.createdBy
          }
        });

        // Trigger real-time notification on status confirmation
        try {
          await notificationService.create({
            kind: "system",
            title: "Transaction confirmed",
            body: `Transaction ${transaction.ref} has been confirmed and fully processed.`
          });
        } catch (e) {
          console.error("Failed to trigger update notification:", e);
        }
      }

      return transaction;
    });
  },

  async delete(idOrRef: string) {
    let existingTx = await prisma.transaction.findUnique({ where: { id: idOrRef } });
    if (!existingTx) {
      existingTx = await prisma.transaction.findUnique({ where: { ref: idOrRef } });
    }
    if (!existingTx) throw new Error("Transaction not found");

    return await prisma.transaction.delete({
      where: { id: existingTx.id }
    });
  }
};
