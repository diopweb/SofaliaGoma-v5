
'use client';

import { useAppContext } from '@/hooks/useAppContext';
import { SalesClient } from '@/components/pages/sales/SalesClient';
import { useMemo } from 'react';

export default function SalesPage() {
    const { sales, loading } = useAppContext();

    const sortedSales = useMemo(() => {
        return [...sales].sort((a,b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
    }, [sales]);

    if (loading.sales) {
        return <div className="flex justify-center items-center h-full">Chargement des ventes...</div>;
    }

    return <SalesClient sales={sortedSales} />;
}
