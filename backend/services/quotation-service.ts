import prisma from "@/app/lib/prisma";

export const quotationService = {
  async getAll() {
    return await prisma.quotation.findMany({
      orderBy: { date: "desc" },
      include: { items: true }
    });
  },

  async create(data: any) {
    return await prisma.quotation.create({
      data: {
        no: data.no,
        customer: data.customer,
        date: data.date ? new Date(data.date) : new Date(),
        expiry: new Date(data.expiry),
        amount: data.amount,
        status: data.status || "Draft",
        notes: data.notes,
        items: {
          create: data.items.map((item: any) => ({
            description: item.description,
            weight: item.weight,
            karat: item.karat,
            price: item.price
          }))
        }
      },
      include: { items: true }
    });
  },

  async update(id: string, data: any) {
    const { items, ...rest } = data;
    return await prisma.quotation.update({
      where: { id },
      data: {
        ...rest,
        date: data.date ? new Date(data.date) : undefined,
        expiry: data.expiry ? new Date(data.expiry) : undefined,
        items: items ? {
          deleteMany: {},
          create: items.map((item: any) => ({
            description: item.description,
            weight: item.weight,
            karat: item.karat,
            price: item.price
          }))
        } : undefined
      },
      include: { items: true }
    });
  },

  async delete(id: string) {
    return await prisma.quotation.delete({ where: { id } });
  }
};
