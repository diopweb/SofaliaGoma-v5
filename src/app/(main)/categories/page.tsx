
'use client';

import { useMemo } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { CategoriesClient } from '@/components/pages/categories/CategoriesClient';

export default function CategoriesPage() {
    const { categories } = useAppContext();
    
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

    return <CategoriesClient categories={categories} parentCategories={parentCategories} />;
}
