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

    return { success: true };
  }
};
