import prisma from "@/app/lib/prisma";
import * as mock from "@/app/lib/mockData";

export const seedService = {
  async seed() {
    // 1. Clear existing data (CAUTION: Only for development)
    // await prisma.transaction.deleteMany();
    // await prisma.inventoryBatch.deleteMany();
    // ...

    // 2. Seed Sites
    for (const s of mock.SITES) {
      await prisma.site.upsert({
        where: { id: s.id },
        update: {},
        create: {
          id: s.id,
          name: s.name,
          location: s.location,
          manager: s.manager,
          capacity: s.capacity,
          currentStock: s.currentStock,
          security: s.security,
          status: s.status,
          staffCount: s.staffCount
        }
      });
    }

    // 3. Seed Contacts
    for (const c of mock.CUSTOMERS) {
      await prisma.contact.create({
        data: { name: c.name, type: "Customer", email: c.email, phone: c.phone, status: "Active" }
      });
    }
    for (const s of mock.SUPPLIERS) {
      await prisma.contact.create({
        data: { name: s.name, type: "Supplier", phone: s.contact, status: "Active" }
      });
    }

    // 4. Seed Transactions
    for (const tx of mock.RECENT_TX) {
      await prisma.transaction.upsert({
        where: { ref: tx.ref },
        update: {},
        create: {
          ref: tx.ref,
          date: new Date(tx.date),
          type: tx.type,
          party: tx.party,
          amount: tx.amount,
          status: tx.status,
        }
      });
    }

    // 5. Seed Invoices
    const existingInvoices = await prisma.invoice.count();
    if (existingInvoices === 0) {
      await prisma.invoice.create({
        data: {
          no: "INV-2026-10001",
          customer: "Mwanza Refinery Ltd.",
          issued: new Date("2026-05-01"),
          due: new Date("2026-05-08"),
          amount: 18400,
          status: "Pending",
          items: {
            create: [
              { description: "Refined Gold 24K", weight: 250, karat: "24K", price: 73.6 }
            ]
          }
        }
      });
    }

    // 6. Seed Quotations
    const existingQuotations = await prisma.quotation.count();
    if (existingQuotations === 0) {
      await prisma.quotation.create({
        data: {
          no: "QTN-2026-50001",
          customer: "Coastal Buyers",
          date: new Date("2026-05-10"),
          expiry: new Date("2026-05-17"),
          amount: 12500,
          status: "DRAFT",
          items: {
            create: [
              { description: "Gold Bullion 22K", weight: 200, karat: "22K", price: 62.5 }
            ]
          }
        }
      });
    }

    return { success: true };
  }
};
