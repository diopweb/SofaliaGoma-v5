"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Lightbulb } from 'lucide-react';
import { Product, Sale } from '@/lib/definitions';
import { getProductSales, suggestReorderQuantitiesAction } from '@/app/actions';

interface SuggestReorderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
}

export function SuggestReorderModal({ open, onOpenChange, product }: SuggestReorderModalProps) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<{ suggestedReorderQuantity: number; reasoning: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      // Reset state when modal is closed
      setSuggestion(null);
      setError(null);
      setLoading(false);
    }
  }, [open]);

  const handleGetSuggestion = async () => {
    if (!product) return;

    setLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const historicalSales: Sale[] = await getProductSales(product.id);
      
      const input = {
        productName: product.name,
        productId: product.id,
        historicalSalesData: JSON.stringify(historicalSales.map(s => ({ date: s.saleDate, quantity: s.items.find(i => i.productId === product.id)?.quantity || 0 }))),
        currentStockLevel: product.quantity,
        reorderThreshold: product.reorderThreshold || 0,
      };

      const result = await suggestReorderQuantitiesAction(input);
      setSuggestion(result);
    } catch (err) {
      console.error(err);
      setError('Une erreur est survenue lors de la récupération de la suggestion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Suggestion IA pour Réapprovisionnement</DialogTitle>
          <DialogDescription>
            Obtenez une suggestion intelligente sur la quantité à commander pour le produit : <strong>{product?.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {!suggestion && !loading && (
            <div className="flex flex-col items-center justify-center text-center p-4 bg-secondary rounded-lg">
              <Lightbulb className="h-12 w-12 text-primary mb-4" />
              <p className="text-sm text-muted-foreground">
                Cliquez sur le bouton ci-dessous pour lancer l'analyse IA et obtenir une suggestion de réapprovisionnement.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-4">Analyse en cours...</p>
            </div>
          )}

          {error && (
            <div className="text-destructive p-4 bg-destructive/10 rounded-lg">
              {error}
            </div>
          )}

          {suggestion && (
            <div className="space-y-4">
              <div className="text-center p-6 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium text-primary">Quantité Suggérée</p>
                <p className="text-4xl font-bold text-primary">{suggestion.suggestedReorderQuantity}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Raisonnement de l'IA :</h4>
                <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-md">{suggestion.reasoning}</p>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
          <Button onClick={handleGetSuggestion} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
            {suggestion ? 'Relancer l\'analyse' : 'Obtenir une suggestion'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
