
'use client';

import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { CompanyProfile, AppUser } from '@/lib/definitions';
import { SettingsClient } from '@/components/pages/settings/SettingsClient';
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from '@/hooks/useAppContext';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const { companyProfile, users } = useAppContext();

    const handleSaveProfile = async (profileData: Partial<CompanyProfile>) => {
        if (!appId || appId === 'default-app-id') {
            toast({ variant: "destructive", title: "Erreur", description: "La configuration Firebase n'est pas complète." });
            return;
        }
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
        if (!appId || appId === 'default-app-id') {
            toast({ variant: "destructive", title: "Erreur", description: "La configuration Firebase n'est pas complète." });
            return;
        }
        try {
            const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, userId);
            await updateDoc(userDocRef, { role });
            toast({ title: "Succès", description: "Rôle de l'utilisateur mis à jour." });
        } catch (error: any) {
            console.error("Role Update Error:", error);
            toast({ variant: "destructive", title: "Erreur", description: error.message });
        }
    }
    
    return <SettingsClient 
                companyProfile={companyProfile} 
                handleSaveProfile={handleSaveProfile} 
                users={users.filter(u => u.id !== user?.id)} // Pass all users except the current one
                handleUpdateUserRole={handleUpdateUserRole} 
            />;
}
