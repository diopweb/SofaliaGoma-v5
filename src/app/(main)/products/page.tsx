
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { Product, Category } from '@/lib/definitions';
import { ProductsClient } from '@/components/pages/products/ProductsClient';

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const productPath = `artifacts/${appId}/public/data/products`;
        const categoryPath = `artifacts/${appId}/public/data/categories`;

        const unsubProducts = onSnapshot(query(collection(db, productPath)), snapshot => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
            setProducts(items);
            if(categories.length > 0) setLoading(false);
        }, err => {
            console.error(`Error reading products:`, err);
            setLoading(false);
        });

        const unsubCategories = onSnapshot(query(collection(db, categoryPath)), snapshot => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
            setCategories(items);
             if(products.length > 0) setLoading(false);
        }, err => {
            console.error(`Error reading categories:`, err);
            setLoading(false);
        });

        // Initial loading state for when both are empty
        if(products.length === 0 && categories.length === 0){
             setTimeout(()=> setLoading(false), 2000); // Failsafe timeout
        }


        return () => {
            unsubProducts();
            unsubCategories();
        };
    }, []); // products, categories deps removed to avoid re-subscribing

    const categoryNames = useMemo(() => {
        return categories.reduce((acc, cat) => {
            acc[cat.id] = cat.name;
            return acc;
        }, {} as Record<string, string>);
    }, [categories]);
    

    if (loading) {
        return <div className="flex justify-center items-center h-full">Chargement des produits...</div>;
    }

    return <ProductsClient products={products} categoryNames={categoryNames} />;
}
