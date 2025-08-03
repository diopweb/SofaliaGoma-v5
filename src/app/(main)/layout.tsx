
"use client";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { Flame, Menu } from 'lucide-react';
import { useAppContext } from "@/hooks/useAppContext";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function MobileHeader() {
  const { toggleSidebar } = useSidebar();
  const { companyProfile } = useAppContext();
  return (
    <header className="md:hidden flex items-center justify-between p-4 border-b">
       <div className="flex items-center gap-2 text-xl font-bold text-foreground">
        <Flame className="text-primary" />
        <span className="font-headline">{companyProfile?.name || 'SwiftSale'}</span>
      </div>
      <button onClick={toggleSidebar} className="p-2">
        <Menu />
        <span className="sr-only">Ouvrir le menu</span>
      </button>
    </header>
  )
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const { loading: appLoading } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const isLoading = authLoading || appLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Chargement de l'application...</p>
      </div>
    );
  }
  
  if (!user) {
    // This can happen briefly during redirection, so we return null to avoid flashing content.
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <MobileHeader />
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
