import { Metadata } from "next";
import { getProducts } from "@/lib/actions/products";
import { getCategories } from "@/lib/actions/categories";
import { ProductsClient } from "./products-client";

export const metadata: Metadata = {
  title: "Produtos | BoxShop",
  description: "Gerencie os produtos da sua loja",
};

export default async function ProductsPage() {
  const products = await getProducts();
  const categories = await getCategories();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <ProductsClient initialProducts={products} categories={categories} />
    </div>
  );
}
