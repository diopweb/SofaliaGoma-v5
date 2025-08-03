
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Product, ProductVariant } from "@/lib/definitions";
import { useAppContext } from "@/hooks/useAppContext";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PRODUCT_TYPES } from "@/lib/constants";
import { ShoppingCart, X, Lightbulb } from "lucide-react";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";

interface ProductDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
}

export function ProductDetailModal({ open, onOpenChange, product }: ProductDetailModalProps) {
  const { addToCart, openSuggestReorderModal } = useAppContext();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const handleAddToCart = () => {
    if (product) {
      if (product.type === PRODUCT_TYPES.VARIANT && !selectedVariant) {
        // Maybe show a toast message here
        return;
      }
      addToCart(product, quantity, selectedVariant || undefined);
      onOpenChange(false);
    }
  };
  
  const handleOpenSuggestModal = () => {
    if(product) {
        onOpenChange(false);
        openSuggestReorderModal(product);
    }
  }

  const getStock = () => {
    if (!product) return 0;
    if (product.type === PRODUCT_TYPES.VARIANT) {
        return selectedVariant ? selectedVariant.quantity : product.variants.reduce((acc, v) => acc + v.quantity, 0);
    }
    return product.quantity;
  }
  
  const stock = getStock();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
            setQuantity(1);
            setSelectedVariant(null);
        }
    }}>
      {product && (
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{product.name}</DialogTitle>
            <DialogDescription>
              {product.description || "Détails du produit."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex justify-center items-center bg-gray-100 rounded-lg">
                <Image
                    src={product.photoURL || "https://placehold.co/600x400.png"}
                    alt={product.name}
                    width={400}
                    height={400}
                    data-ai-hint="product image"
                    className="object-cover rounded-lg"
                />
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-2xl font-bold">{formatCurrency(selectedVariant ? product.price + (selectedVariant.priceModifier || 0) : product.price)}</span>
                <Badge variant={stock > 0 ? 'default' : 'destructive'} className="ml-2 bg-green-100 text-green-800">
                  {stock > 0 ? `${stock} en stock` : 'Rupture de stock'}
                </Badge>
              </div>

              {product.type === PRODUCT_TYPES.VARIANT && (
                 <div className="space-y-2">
                    <label>Variante</label>
                    <Select onValueChange={(variantId) => {
                        const variant = product.variants.find(v => v.id === variantId) || null;
                        setSelectedVariant(variant);
                    }}>
                        <SelectTrigger>
                            <SelectValue placeholder="Choisir une variante" />
                        </SelectTrigger>
                        <SelectContent>
                            {product.variants.map(v => (
                                <SelectItem key={v.id} value={v.id} disabled={v.quantity <= 0}>
                                    {v.name} (+{formatCurrency(v.priceModifier)}) - {v.quantity} en stock
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                 </div>
              )}
              
              {product.type === PRODUCT_TYPES.PACK && (
                <div className="space-y-2 text-sm">
                    <h4 className="font-semibold">Contenu du pack:</h4>
                    <ul className="list-disc list-inside">
                        {product.packItems.map((item, index) => (
                            <li key={index}>{item.quantity} x {item.name}</li>
                        ))}
                    </ul>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <label htmlFor="quantity">Quantité</label>
                <Input 
                  id="quantity" 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} 
                  className="w-20"
                  min={1}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleAddToCart} disabled={stock <= 0} className="flex-1">
                  <ShoppingCart className="mr-2 h-4 w-4" /> Ajouter au panier
                </Button>
                <Button onClick={handleOpenSuggestModal} variant="outline">
                    <Lightbulb className="mr-2 h-4 w-4"/> Suggestion IA
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              <X className="mr-2 h-4 w-4" /> Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
