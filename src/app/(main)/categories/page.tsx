
'use client';

import { useMemo } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { CategoriesClient } from '@/components/pages/categories/CategoriesClient';

export default function CategoriesPage() {
    const { categories, loading } = useAppContext();
    
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


    if (loading.categories) {
        return <div className="flex justify-center items-center h-full">Chargement des catégories...</div>;
    }

    return <CategoriesClient categories={categories} parentCategories={parentCategories} />;
}
