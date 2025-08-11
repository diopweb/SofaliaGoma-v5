
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppContext } from "@/hooks/useAppContext";
import { Product, Category } from "@/lib/definitions";
import { useEffect, useState } from "react";
import { PRODUCT_TYPES } from "@/lib/constants";
import { PlusCircle, Trash2, X } from "lucide-react";
import Image from "next/image";
import { resizeImage } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";


const variantSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Le nom de la variante est requis."),
    priceModifier: z.coerce.number().default(0),
    quantity: z.coerce.number().min(0, "La quantité doit être positive."),
    reorderThreshold: z.coerce.number().optional(),
});

const packItemSchema = z.object({
    productId: z.string().min(1, "Un produit est requis."),
    name: z.string(), // To display in the form
    quantity: z.coerce.number().min(1, "La quantité doit être d'au moins 1."),
});


const productSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Le prix doit être positif."),
  basePrice: z.coerce.number().optional(),
  quantity: z.coerce.number().min(0, "La quantité doit être positive.").optional(),
  reorderThreshold: z.coerce.number().optional(),
  categoryId: z.string().optional().nullable(),
  photoURL: z.string().optional().nullable(),
  type: z.enum([PRODUCT_TYPES.SIMPLE, PRODUCT_TYPES.PACK, PRODUCT_TYPES.VARIANT]),
  variants: z.array(variantSchema).optional(),
  packItems: z.array(packItemSchema).optional(),
});

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
  allProducts: Product[];
  allCategories: Category[];
}

export function ProductFormModal({ open, onOpenChange, product, allProducts, allCategories }: ProductFormModalProps) {
  const { handleAddItem, handleEditItem } = useAppContext();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      quantity: 0,
      reorderThreshold: 0,
      categoryId: null,
      photoURL: null,
      type: PRODUCT_TYPES.SIMPLE,
      variants: [],
      packItems: [],
    },
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const { fields: packItemFields, append: appendPackItem, remove: removePackItem } = useFieldArray({
      control: form.control,
      name: "packItems"
  });
  
  const productType = form.watch("type");

  useEffect(() => {
    if (product) {
      form.reset({
        ...product,
        basePrice: product.basePrice || product.price,
        variants: product.variants?.map(v => ({...v, id: v.id || crypto.randomUUID()})) || []
      });
      setImagePreview(product.photoURL || null);
    } else {
      form.reset({
        name: "",
        description: "",
        price: 0,
        quantity: 0,
        reorderThreshold: 0,
        categoryId: null,
        photoURL: null,
        type: PRODUCT_TYPES.SIMPLE,
        variants: [],
        packItems: [],
      });
      setImagePreview(null);
    }
  }, [product, form, open]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const preview = await resizeImage(file, 400, 400);
      setImagePreview(preview);
    }
  };

  const onSubmit = async (values: z.infer<typeof productSchema>) => {
    let finalValues = { ...values };
    
    if (finalValues.type === PRODUCT_TYPES.VARIANT) {
        finalValues.variants = finalValues.variants?.map(v => ({ ...v, id: v.id || crypto.randomUUID() }));
        finalValues.quantity = finalValues.variants?.reduce((sum, v) => sum + v.quantity, 0) || 0;
        finalValues.basePrice = finalValues.price;
    }

    if(finalValues.type === PRODUCT_TYPES.PACK) {
        finalValues.quantity = 0; 
    }
    
    finalValues.photoURL = imagePreview;

    if (product) {
      await handleEditItem("products", product.id, finalValues);
    } else {
      await handleAddItem("products", finalValues);
    }
    onOpenChange(false);
  };
  
  const availablePackProducts = allProducts.filter(p => p.type === PRODUCT_TYPES.SIMPLE);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{product ? "Modifier le produit" : "Ajouter un produit"}</DialogTitle>
          <DialogDescription>
             Remplissez les informations ci-dessous.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <ScrollArea className="h-[60vh] p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                     <div className="space-y-2 text-center">
                        <Image src={imagePreview || "https://placehold.co/400x400.png"} alt="Aperçu" width={200} height={200} data-ai-hint="product image" className="mx-auto rounded-lg object-cover aspect-square"/>
                        <Input id="picture" type="file" accept="image/*" onChange={handleFileChange} className="text-xs"/>
                    </div>
                     <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Type de produit</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger><SelectValue placeholder="Sélectionner un type" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value={PRODUCT_TYPES.SIMPLE}>Simple</SelectItem>
                                    <SelectItem value={PRODUCT_TYPES.VARIANT}>Avec Variantes</SelectItem>
                                    <SelectItem value={PRODUCT_TYPES.PACK}>Pack</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                            <FormLabel>Nom du produit</FormLabel>
                            <FormControl><Input placeholder="Ex: T-shirt en coton" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{productType === PRODUCT_TYPES.VARIANT ? "Prix de base" : "Prix de vente"}</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     {productType === PRODUCT_TYPES.SIMPLE && (
                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Quantité en stock</FormLabel>
                                <FormControl><Input type="number" {...field} value={field.value || 0}/></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                     )}
                     <FormField
                        control={form.control}
                        name="reorderThreshold"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Seuil de réappro.</FormLabel>
                            <FormControl><Input type="number" {...field} value={field.value || 0} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Catégorie</FormLabel>
                             <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value || ""}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner une catégorie" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="">Aucune</SelectItem>
                                    {allCategories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                            <FormLabel>Description</FormLabel>
                            <FormControl><Textarea placeholder="Brève description du produit" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
            </div>

            {productType === PRODUCT_TYPES.VARIANT && (
                <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Variantes</h3>
                    <div className="space-y-4">
                    {variantFields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-12 gap-2 items-center p-2 bg-secondary rounded-md">
                            <FormField control={form.control} name={`variants.${index}.name`} render={({ field }) => ( <FormItem className="col-span-4"><FormLabel>Nom</FormLabel><FormControl><Input {...field} placeholder="Ex: Rouge, XL" /></FormControl></FormItem> )}/>
                            <FormField control={form.control} name={`variants.${index}.priceModifier`} render={({ field }) => ( <FormItem className="col-span-3"><FormLabel>Mod. Prix</FormLabel><FormControl><Input type="number" {...field} placeholder="+500" /></FormControl></FormItem> )}/>
                            <FormField control={form.control} name={`variants.${index}.quantity`} render={({ field }) => ( <FormItem className="col-span-2"><FormLabel>Stock</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem> )}/>
                             <FormField control={form.control} name={`variants.${index}.reorderThreshold`} render={({ field }) => ( <FormItem className="col-span-2"><FormLabel>Seuil</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem> )}/>
                            <Button type="button" variant="ghost" size="icon" className="col-span-1 self-end" onClick={() => removeVariant(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        </div>
                    ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendVariant({ name: "", priceModifier: 0, quantity: 0, reorderThreshold: 0 })} className="mt-2"><PlusCircle className="mr-2"/>Ajouter une variante</Button>
                </div>
            )}

            {productType === PRODUCT_TYPES.PACK && (
                <div className="mt-6">
                     <h3 className="text-lg font-medium mb-2">Contenu du Pack</h3>
                     <div className="space-y-4">
                        {packItemFields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-12 gap-4 items-center p-2 bg-secondary rounded-md">
                               <FormField control={form.control} name={`packItems.${index}.productId`} render={({ field: selectField }) => (
                                   <FormItem className="col-span-7">
                                        <FormLabel>Produit</FormLabel>
                                        <Select onValueChange={(value) => {
                                            const selectedProd = availablePackProducts.find(p => p.id === value);
                                            form.setValue(`packItems.${index}.name`, selectedProd?.name || '');
                                            selectField.onChange(value);
                                        }} defaultValue={selectField.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Choisir un produit"/></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {availablePackProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                   </FormItem>
                               )}/>
                               <FormField control={form.control} name={`packItems.${index}.quantity`} render={({ field }) => (<FormItem className="col-span-4"><FormLabel>Quantité</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>)}/>
                               <Button type="button" variant="ghost" size="icon" className="col-span-1 self-end" onClick={() => removePackItem(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                            </div>
                        ))}
                     </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => appendPackItem({ productId: "", name: "", quantity: 1 })} className="mt-2"><PlusCircle className="mr-2"/>Ajouter un produit au pack</Button>
                </div>
            )}
            </ScrollArea>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
