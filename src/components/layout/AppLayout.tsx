
"use client";
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation'; // usePathname for active link
import { signOut } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons/Logo';
import { Home, User, LogOut, Settings, ShieldCheck, Utensils, BarChart3, PanelLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, userProfile, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // For active link highlighting
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({ variant: 'destructive', title: 'Logout Failed', description: 'Could not log you out. Please try again.' });
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'NN';
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    }
    return nameParts[0].substring(0, 2).toUpperCase();
  };
  
  const navLinkClasses = (path: string) => cn(
    "w-full",
    pathname === path ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
  );

  const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home, adminOnly: false },
    { href: "/admin/dashboard", label: "Admin", icon: ShieldCheck, adminOnly: true },
    { href: "/my-food-log", label: "My Food Log", icon: Utensils, adminOnly: false },
    { href: "/reports", label: "Reports", icon: BarChart3, adminOnly: false },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarHeader className="p-4 items-center justify-center group-data-[collapsible=icon]:p-2">
          <Link href="/dashboard" className="flex items-center gap-2 text-sidebar-primary hover:opacity-80 transition-opacity">
            <Logo className="h-8 w-8" />
            <span className="font-bold text-xl group-data-[collapsible=icon]:hidden">Navigator</span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="p-2">
          <SidebarMenu>
            {menuItems.map((item) => {
              if (item.adminOnly && !isAdmin) return null;
              const IconComponent = item.icon;
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    className={navLinkClasses(item.href)}
                    tooltip={{ children: item.label, className: "group-data-[collapsible=icon]:block hidden" }}
                  >
                    <Link href={item.href}>
                      <IconComponent />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
        
        <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-2">
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="justify-start w-full p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-auto focus-visible:ring-sidebar-ring">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.photoURL || undefined} alt={userProfile?.displayName || 'User'} />
                  <AvatarFallback>{getInitials(userProfile?.displayName)}</AvatarFallback>
                </Avatar>
                <div className="ml-2 text-left group-data-[collapsible=icon]:hidden">
                  <p className="text-sm font-medium leading-none text-sidebar-foreground">{userProfile?.displayName || 'User'}</p>
                  <p className="text-xs leading-none text-sidebar-foreground/70">{userProfile?.email}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right" sideOffset={10} className="w-56 border-border bg-popover text-popover-foreground">
              <DropdownMenuLabel>{userProfile?.displayName || 'My Account'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6">
          <SidebarTrigger className="md:hidden">
            <PanelLeft />
          </SidebarTrigger>
          <div className="flex-1">
            {/* Breadcrumbs or page title could go here */}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-background"> {/* Changed background to plain background for cleaner content area */}
          {children}
        </main>
      </SidebarInset>
    </div>
  );
}
