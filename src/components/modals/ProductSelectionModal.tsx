
"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/hooks/useAppContext";
import { Product } from "@/lib/definitions";
import { formatCurrency } from "@/lib/utils";
import { Search, X, ShoppingCart, Package } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { Badge } from "../ui/badge";
import { PRODUCT_TYPES } from "@/lib/constants";
import { Card, CardContent } from "../ui/card";

interface ProductSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedCustomerId?: string;
}

export function ProductSelectionModal({
  open,
  onOpenChange,
}: ProductSelectionModalProps) {
  const { addToCart, openSaleModal, openProductDetailsModal, cart, products, categories } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        !selectedCategory || product.categoryId === selectedCategory;
      const matchesSearch =
        searchTerm === "" ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  const handleProductClick = (product: Product) => {
    if (product.type === PRODUCT_TYPES.SIMPLE) {
      addToCart(product, 1);
    } else {
      openProductDetailsModal(product);
    }
  };
  
  const handleFinish = () => {
    onOpenChange(false);
    openSaleModal();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Sélectionner des Produits</DialogTitle>
          <DialogDescription>
            Cliquez sur un produit pour l'ajouter au panier.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {cart.length > 0 && (
            <Button onClick={handleFinish}>
                <ShoppingCart className="mr-2"/>
                Voir le panier ({cart.reduce((acc, item) => acc + item.quantity, 0)})
            </Button>
          )}
        </div>
        
        <div className="flex gap-2 py-2 overflow-x-auto">
            <Button variant={!selectedCategory ? 'default' : 'outline'} onClick={() => setSelectedCategory(null)}>Toutes</Button>
            {categories.map(cat => (
                <Button key={cat.id} variant={selectedCategory === cat.id ? 'default' : 'outline'} onClick={() => setSelectedCategory(cat.id)}>{cat.name}</Button>
            ))}
        </div>

        <ScrollArea className="flex-1 -mx-6">
          <div className="px-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="relative aspect-square w-full bg-muted">
                   <Image
                    src={product.photoURL || "https://placehold.co/400x400.png"}
                    alt={product.name}
                    fill
                    data-ai-hint="product image"
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-2 text-sm">
                  <h4 className="font-semibold truncate">{product.name}</h4>
                  <p className="text-primary font-bold">
                    {formatCurrency(product.price)}
                  </p>
                  {product.type !== PRODUCT_TYPES.PACK && (
                    <Badge variant={product.quantity > 0 ? "default" : "destructive"} className="mt-1 text-xs">
                         {product.quantity > 0 ? `Stock: ${product.quantity}` : 'Épuisé'}
                    </Badge>
                  )}
                   {product.type === PRODUCT_TYPES.PACK && (
                    <Badge variant="secondary" className="mt-1 text-xs flex items-center gap-1">
                        <Package size={12}/> Pack
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            <X className="mr-2" /> Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
