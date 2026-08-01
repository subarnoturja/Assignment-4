import { prisma } from "../../lib/prisma";

const getAllCategories = async () => {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { services: true },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return categories;
};

export const CategoryService = {
  getAllCategories,
};