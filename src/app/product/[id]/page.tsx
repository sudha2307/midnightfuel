import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import prisma from "@/lib/prisma";
import Navbar from "@/components/customer/Navbar";
import Footer from "@/components/customer/Footer";
import FoodCard from "@/components/customer/FoodCard";
import ProductDetailClient from "./ProductDetailClient";

async function getProductData(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) return null;

    // Get related products in same category
    const related = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isAvailable: true,
      },
      include: {
        category: true,
      },
      take: 3,
    });

    return {
      product,
      related,
    };
  } catch (e) {
    console.error("Failed to load product", e);
    return null;
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getProductData(id);

  if (!data || !data.product) {
    notFound();
  }

  const { product, related } = data;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Full Menu
          </Link>
        </div>

        {/* Client Product Interactive Configurator */}
        <ProductDetailClient product={product as any} />

        {/* Related Items */}
        {related.length > 0 && (
          <div className="mt-20 pt-12 border-t border-border/70">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-primary block mb-1">
                  Pairs Great With
                </span>
                <h3 className="text-2xl font-extrabold text-white font-heading">
                  YOU MIGHT ALSO LIKE
                </h3>
              </div>
              <Link
                href={`/menu?category=${product.category.slug}`}
                className="text-xs font-bold text-primary hover:underline"
              >
                More in {product.category.name} →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((item) => (
                <FoodCard key={item.id} product={item as any} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
