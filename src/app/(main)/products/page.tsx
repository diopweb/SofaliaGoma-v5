
'use client';

import { useMemo } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { ProductsClient } from '@/components/pages/products/ProductsClient';

export default function ProductsPage() {
    const { products, categories } = useAppContext();

    const categoryNames = useMemo(() => {
        return categories.reduce((acc, cat) => {
            acc[cat.id] = cat.name;
            return acc;
        }, {} as Record<string, string>);
    }, [categories]);
    
    return <ProductsClient products={products} categoryNames={categoryNames} />;
}
