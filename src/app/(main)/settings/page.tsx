
'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { CompanyProfile } from '@/lib/definitions';
import { SettingsClient } from '@/components/pages/settings/SettingsClient';
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
    const { toast } = useToast();
    const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const profileDocRef = doc(db, `artifacts/${appId}/public/data/companyProfile`, 'main');
        const unsubscribe = onSnapshot(profileDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setCompanyProfile({ id: docSnap.id, ...docSnap.data() } as CompanyProfile);
            } else {
                 const defaultProfile: Omit<CompanyProfile, 'id'> = {
                    name: "SwiftSale",
                    address: "Dakar - Sénégal",
                    phone: "+221776523381",
                    logo: null,
                    invoicePrefix: "FAC-",
                    refundPrefix: "REM-",
                    depositPrefix: "DEP-",
                    invoiceFooterMessage: "Merci pour votre achat !",
                    lastInvoiceNumber: 0
                };
                setDoc(profileDocRef, defaultProfile);
            }
            setLoading(false);
        }, err => {
            console.error(`Error reading company profile:`, err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleSaveProfile = async (profileData: Partial<CompanyProfile>) => {
        try {
            const profileDocRef = doc(db, `artifacts/${appId}/public/data/companyProfile`, 'main');
            await setDoc(profileDocRef, profileData, { merge: true });
            toast({ title: "Succès", description: "Profil de l'entreprise mis à jour." });
        } catch (error: any) {
            console.error("Profile Save Error:", error);
            toast({ variant: "destructive", title: "Erreur", description: error.message });
        }
    };
    
    if (loading) {
        return <div className="flex justify-center items-center h-full">Chargement des paramètres...</div>;
    }

    return <SettingsClient companyProfile={companyProfile} handleSaveProfile={handleSaveProfile} />;
}
