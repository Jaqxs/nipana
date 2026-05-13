import prisma from "@/app/lib/prisma";

export const contactService = {
  async getAll() {
    return await prisma.contact.findMany({
      orderBy: { name: "asc" }
    });
  },

  async create(data: any) {
    return await prisma.contact.create({
      data: {
        name: data.name,
        type: data.type,
        email: data.email,
        phone: data.phone,
        address: data.address,
        status: data.status || "Active",
      }
    });
  },

  async update(id: string, data: any) {
    return await prisma.contact.update({
      where: { id },
      data
    });
  },

  async delete(id: string) {
    return await prisma.contact.delete({
      where: { id }
    });
  }
};
