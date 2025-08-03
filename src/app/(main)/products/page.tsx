
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { Product, Category } from '@/lib/definitions';
import { ProductsClient } from '@/components/pages/products/ProductsClient';

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingStates, setLoadingStates] = useState({
        products: true,
        categories: true,
    });
    
    const loading = loadingStates.products || loadingStates.categories;

    useEffect(() => {
        const productPath = `artifacts/${appId}/public/data/products`;
        const categoryPath = `artifacts/${appId}/public/data/categories`;

        const unsubProducts = onSnapshot(query(collection(db, productPath)), snapshot => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
            setProducts(items);
            setLoadingStates(prev => ({...prev, products: false}));
        }, err => {
            console.error(`Error reading products:`, err);
            setLoadingStates(prev => ({...prev, products: false}));
        });

        const unsubCategories = onSnapshot(query(collection(db, categoryPath)), snapshot => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
            setCategories(items);
            setLoadingStates(prev => ({...prev, categories: false}));
        }, err => {
            console.error(`Error reading categories:`, err);
            setLoadingStates(prev => ({...prev, categories: false}));
        });

        return () => {
            unsubProducts();
            unsubCategories();
        };
    }, []);

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
