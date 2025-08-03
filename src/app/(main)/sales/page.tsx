
'use client';

import { useAppContext } from '@/hooks/useAppContext';
import { SalesClient } from '@/components/pages/sales/SalesClient';
import { useMemo } from 'react';

export default function SalesPage() {
    const { sales } = useAppContext();

    const sortedSales = useMemo(() => {
        return [...sales].sort((a,b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
    }, [sales]);

    return <SalesClient sales={sortedSales} />;
}
