import { Metadata } from "next";
import { getCategories } from "@/lib/actions/categories";
import { CategoriesClient } from "./categories-client";

export const metadata: Metadata = {
  title: "Categorias | BoxShop",
  description: "Gerencie as categorias de produtos da sua loja",
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <CategoriesClient initialCategories={categories} />
    </div>
  );
}
