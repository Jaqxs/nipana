import prisma from "@/app/lib/prisma";
import * as mock from "@/app/lib/mockData";
import bcrypt from "bcryptjs";

export const seedService = {
  async seed() {
    // 0. Seed Administrative Users
    const admins = [
      { email: "director@nipanaatlas.co.tz", name: "Director", role: "admin" },
      { email: "ceo@nipanaatlas.co.tz", name: "CEO", role: "admin" },
      { email: "Developer@nipanaatlas.co.tz", name: "Developer", role: "admin" },
    ];

    const tempPassword = await bcrypt.hash("nipana2026", 10);

    for (const admin of admins) {
      await prisma.user.upsert({
        where: { email: admin.email },
        update: {},
        create: {
          email: admin.email,
          name: admin.name,
          password: tempPassword,
          role: admin.role,
        },
      });
    }

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
          createdBy: tx.ref === "TX-018338" || tx.ref === "TX-018340" ? "Maria Rweyemamu" : "Julius Assey",
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
          createdBy: "Julius Assey",
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
          createdBy: "Maria Rweyemamu",
          items: {
            create: [
              { description: "Gold Bullion 22K", weight: 200, karat: "22K", price: 62.5 }
            ]
          }
        }
      });
    }

    // 7. Seed Notifications
    const existingNotifications = await prisma.notification.count();
    if (existingNotifications === 0) {
      await prisma.notification.createMany({
        data: [
          { kind: "approval", title: "Pending approval", body: "Maria Rweyemamu submitted TX-018340 — Geita Cooperative purchase, $22,800." },
          { kind: "anomaly", title: "Anomaly flagged", body: "AN-2218 · TX-018340 sits 2.8σ above category mean. Review recommended." },
          { kind: "invoice", title: "Invoice viewed", body: "Mwanza Refinery opened INV-2026-000482 for the first time." },
          { kind: "ai", title: "Daily briefing ready", body: "May 04 morning summary delivered. 3 items flagged for attention.", unread: false },
          { kind: "stock", title: "Low stock alert", body: "18K grade is at 612g — below 750g threshold.", unread: false },
          { kind: "system", title: "Backup completed", body: "Daily database backup finished successfully (412 MB, encrypted).", unread: false },
        ]
      });
    }

    return { success: true };
  }
};
