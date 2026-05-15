import prisma from "@/app/lib/prisma";

export const cashflowService = {
  async getAll() {
    return await prisma.cashFlow.findMany({
      orderBy: { date: "desc" }
    });
  },

  async create(data: any) {
    return await prisma.cashFlow.create({
      data: {
        date: new Date(data.date),
        type: data.type,
        category: data.category,
        description: data.description || data.desc || "N/A",
        amount: data.amount,
        transactionId: data.transactionId,
        createdBy: data.createdBy || "System",
      }
    });
  }
};
