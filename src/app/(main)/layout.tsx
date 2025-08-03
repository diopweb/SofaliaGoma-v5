"use client";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { Flame, Menu } from 'lucide-react';
import { useAppContext } from "@/hooks/useAppContext";

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
