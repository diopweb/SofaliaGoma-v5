
"use client";

import { useAppContext } from "@/hooks/useAppContext";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  BarChart2,
  Package,
  ShoppingCart,
  Users,
  Tag,
  CreditCard,
  ListChecks,
  Settings,
  Flame,
} from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Button } from "../ui/button";

const navItems = [
  { href: "/dashboard", label: "Tableau de Bord", icon: BarChart2 },
  { href: "/products", label: "Produits", icon: Package },
  { href: "/categories", label: "Catégories", icon: Tag },
  { href: "/customers", label: "Clients", icon: Users },
  { href: "/sales", label: "Ventes", icon: ShoppingCart },
  { href: "/debts", label: "Créances", icon: CreditCard },
  { href: "/refunds", label: "Remboursements", icon: ListChecks },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { companyProfile, cart, openSaleModal } = useAppContext();
  const userPseudo = "Admin";
  const userRole = "admin";

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center justify-center h-16">
          {companyProfile?.logo ? (
            <img
              src={companyProfile.logo}
              alt={companyProfile.name}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="flex items-center gap-2 text-2xl font-bold text-sidebar-foreground">
              <Flame className="text-primary" />
              <span className="font-headline">{companyProfile?.name || 'SwiftSale'}</span>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                icon={<item.icon />}
              >
                <Link href={item.href}>
                  {item.label}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 space-y-4">
        {cart.length > 0 && (
          <Button
            onClick={() => openSaleModal()}
            variant="outline"
            className="w-full justify-start text-primary border-primary hover:bg-primary/10"
          >
            <ShoppingCart size={16} className="mr-2" /> Panier ({cart.length})
          </Button>
        )}
        <div className="text-xs text-sidebar-foreground/70">
          <p>Utilisateur: {userPseudo}</p>
          <p className="font-bold capitalize">Rôle: {userRole}</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
