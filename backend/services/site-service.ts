import prisma from "@/app/lib/prisma";

export const siteService = {
  async getAll() {
    return await prisma.site.findMany({
      orderBy: { name: "asc" }
    });
  },

  async create(data: any) {
    return await prisma.site.create({
      data: {
        name: data.name,
        location: data.location,
        manager: data.manager,
        capacity: data.capacity,
        currentStock: data.currentStock || 0,
        security: data.security || "Standard",
        status: data.status || "Active",
        staffCount: data.staffCount || 0,
      }
    });
  },

  async update(id: string, data: any) {
    return await prisma.site.update({
      where: { id },
      data
    });
  }
};
