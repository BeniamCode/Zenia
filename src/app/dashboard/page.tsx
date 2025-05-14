"use client";
import { AppLayout } from "@/components/layout/AppLayout";
import { FoodEntryTabs } from "@/components/dashboard/FoodEntryTabs";
import { FoodLogList } from "@/components/dashboard/FoodLogList";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Separator } from "@/components/ui/separator";

// Metadata can't be dynamic in client components this way. Set in RootLayout or a parent server component.
// export const metadata: Metadata = {
// title: 'Dashboard - Nutrition Navigator',
// };

export default function DashboardPage() {
  const { user, loading, userProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    // AuthProvider already shows a loader, or this page is guarded by middleware
    // So, this is mostly a fallback or if accessed directly before redirect.
    return null; 
  }
  
  const welcomeMessage = userProfile?.displayName ? `Welcome back, ${userProfile.displayName}!` : "Welcome to your Dashboard!";

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{welcomeMessage}</h1>
          <p className="text-muted-foreground">Ready to log your meals? Choose an option below or review your recent entries.</p>
        </div>
        
        <FoodEntryTabs />
        
        <Separator className="my-8" />
        
        <FoodLogList />
      </div>
    </AppLayout>
  );
}
