
"use client";

import { useAppContext } from "@/hooks/useAppContext";
import { useAuth } from "@/hooks/useAuth";
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
  LogOut,
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
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const navItems = [
  { href: "/dashboard", label: "Tableau de Bord", icon: BarChart2, roles: ['admin', 'seller'] },
  { href: "/products", label: "Produits", icon: Package, roles: ['admin', 'seller'] },
  { href: "/categories", label: "Catégories", icon: Tag, roles: ['admin', 'seller'] },
  { href: "/customers", label: "Clients", icon: Users, roles: ['admin', 'seller'] },
  { href: "/sales", label: "Ventes", icon: ShoppingCart, roles: ['admin', 'seller'] },
  { href: "/debts", label: "Créances", icon: CreditCard, roles: ['admin', 'seller'] },
  { href: "/refunds", label: "Remboursements", icon: ListChecks, roles: ['admin'] },
  { href: "/settings", label: "Paramètres", icon: Settings, roles: ['admin'] },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { companyProfile, cart, openSaleModal } = useAppContext();
  const { user, logout } = useAuth();
  
  const availableNavItems = navItems.filter(item => user && item.roles.includes(user.role));

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
          {availableNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.label}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 space-y-4">
        {cart.length > 0 && user?.role === 'seller' && (
          <Button
            onClick={() => openSaleModal()}
            variant="outline"
            className="w-full justify-start text-primary border-primary hover:bg-primary/10"
          >
            <ShoppingCart size={16} className="mr-2" /> Panier ({cart.length})
          </Button>
        )}
        <div className="flex items-center gap-2">
            <Avatar className="h-9 w-9">
                <AvatarImage src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.pseudo}`} />
                <AvatarFallback>{user?.pseudo?.[0]}</AvatarFallback>
            </Avatar>
            <div className="text-xs text-sidebar-foreground/70">
              <p>Utilisateur: {user?.pseudo}</p>
              <p className="font-bold capitalize">Rôle: {user?.role}</p>
            </div>
            <Button variant="ghost" size="icon" className="ml-auto" onClick={logout}>
                <LogOut className="h-5 w-5"/>
            </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
