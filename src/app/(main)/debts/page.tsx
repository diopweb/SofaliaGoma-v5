
'use client';

import { useAppContext } from '@/hooks/useAppContext';
import { useMemo } from 'react';
import { DebtsClient } from '@/components/pages/debts/DebtsClient';
import { SALE_STATUS } from '@/lib/constants';

export default function DebtsPage() {
    const { sales } = useAppContext();

    const debtSales = useMemo(() => {
        return sales
            .filter(sale => sale.status === SALE_STATUS.CREDIT)
            .sort((a, b) => new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime());
    }, [sales]);

    return <DebtsClient debtSales={debtSales} />;
}
