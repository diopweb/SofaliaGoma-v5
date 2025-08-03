
'use client';

import { useAppContext } from '@/hooks/useAppContext';
import { CustomersClient } from '@/components/pages/customers/CustomersClient';

export default function CustomersPage() {
    const { customers } = useAppContext();
    
    return <CustomersClient customers={customers} />;
}
