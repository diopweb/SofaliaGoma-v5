
'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, collection, query, updateDoc } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { CompanyProfile, AppUser } from '@/lib/definitions';
import { SettingsClient } from '@/components/pages/settings/SettingsClient';
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
    const { toast } = useToast();
    const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const profileDocRef = doc(db, `artifacts/${appId}/public/data/companyProfile`, 'main');
        const unsubProfile = onSnapshot(profileDocRef, (docSnap) => {
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
            if (users.length > 0) setLoading(false);
        }, err => {
            console.error(`Error reading company profile:`, err);
            setLoading(false);
        });

        const usersQuery = query(collection(db, `artifacts/${appId}/public/data/users`));
        const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser)));
            if (companyProfile) setLoading(false);
        });

        if (!companyProfile && users.length === 0) {
            setTimeout(() => setLoading(false), 2000); // Failsafe timeout
        }

        return () => {
            unsubProfile();
            unsubUsers();
        };
    }, []); // Run only once

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

    const handleUpdateUserRole = async (userId: string, role: 'admin' | 'seller') => {
        try {
            const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, userId);
            await updateDoc(userDocRef, { role });
            toast({ title: "Succès", description: "Rôle de l'utilisateur mis à jour." });
        } catch (error: any) {
            console.error("Role Update Error:", error);
            toast({ variant: "destructive", title: "Erreur", description: error.message });
        }
    }
    
    if (loading) {
        return <div className="flex justify-center items-center h-full">Chargement des paramètres...</div>;
    }

    return <SettingsClient companyProfile={companyProfile} handleSaveProfile={handleSaveProfile} users={users} handleUpdateUserRole={handleUpdateUserRole} />;
}
