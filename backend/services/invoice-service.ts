import prisma from "@/app/lib/prisma";
import { notificationService } from "./notification-service";

export const invoiceService = {
  async getAll() {
    return await prisma.invoice.findMany({
      orderBy: { issued: "desc" },
      include: { items: true }
    });
  },

  async create(data: any) {
    const invoice = await prisma.invoice.create({
      data: {
        no: data.no,
        customer: data.customer,
        issued: new Date(data.issued),
        due: new Date(data.due),
        amount: data.amount,
        status: data.status || "Draft",
        notes: data.notes,
        createdBy: data.createdBy || "System",
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

    // Create real-time notification for new invoices
    try {
      await notificationService.create({
        kind: "invoice",
        title: "Invoice created",
        body: `${invoice.createdBy} created invoice ${invoice.no} for ${invoice.customer}. Amount: $${invoice.amount.toLocaleString()}.`
      });
    } catch (e) {
      console.error("Failed to create invoice notification:", e);
    }

    return invoice;
  },

  async update(id: string, data: any) {
    const { items, ...rest } = data;
    return await prisma.invoice.update({
      where: { id },
      data: {
        ...rest,
        issued: data.issued ? new Date(data.issued) : undefined,
        due: data.due ? new Date(data.due) : undefined,
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
    return await prisma.invoice.delete({ where: { id } });
  }
};
