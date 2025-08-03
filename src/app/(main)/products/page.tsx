
'use client';

import { useMemo } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { ProductsClient } from '@/components/pages/products/ProductsClient';

export default function ProductsPage() {
    const { products, categories, loading } = useAppContext();
    const isLoading = loading.products || loading.categories;

    const categoryNames = useMemo(() => {
        return categories.reduce((acc, cat) => {
            acc[cat.id] = cat.name;
            return acc;
        }, {} as Record<string, string>);
    }, [categories]);
    

    if (isLoading) {
        return <div className="flex justify-center items-center h-full">Chargement des produits...</div>;
    }

    return <ProductsClient products={products} categoryNames={categoryNames} />;
}
