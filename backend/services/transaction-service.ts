import prisma from "@/app/lib/prisma";

export const transactionService = {
  async getAll() {
    return await prisma.transaction.findMany({
      orderBy: { date: "desc" },
      include: {
        inventoryBatches: true,
        cashFlowEntries: true,
      }
    });
  },

  async create(data: any) {
    return await prisma.transaction.create({
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
