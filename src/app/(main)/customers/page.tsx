
'use client';

import { useAppContext } from '@/hooks/useAppContext';
import { CustomersClient } from '@/components/pages/customers/CustomersClient';

export default function CustomersPage() {
    const { customers, loading } = useAppContext();
    
    if (loading.customers) {
        return <div className="flex justify-center items-center h-full">Chargement des clients...</div>;
    }

    return <CustomersClient customers={customers} />;
}
