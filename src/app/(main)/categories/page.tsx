
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { Category } from '@/lib/definitions';
import { CategoriesClient } from '@/components/pages/categories/CategoriesClient';

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const path = `artifacts/${appId}/public/data/categories`;
        const q = query(collection(db, path));
        const unsubscribe = onSnapshot(q, snapshot => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
            setCategories(items);
            setLoading(false);
        }, err => {
            console.error(`Error reading categories:`, err);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const parentCategories = useMemo(() => {
        const parentMap = new Map<string, string>();
        categories.forEach(cat => {
            if(cat.parentId) {
                const parent = categories.find(p => p.id === cat.parentId);
                if(parent) {
                    parentMap.set(cat.id, parent.name);
                }
            }
        });
        return parentMap;
    }, [categories]);


    if (loading) {
        return <div className="flex justify-center items-center h-full">Chargement des catégories...</div>;
    }

    return <CategoriesClient categories={categories} parentCategories={parentCategories} />;
}
