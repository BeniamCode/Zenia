"use client";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';

// Metadata can't be dynamic in client components this way.
// export const metadata: Metadata = {
// title: 'Admin Dashboard - Nutrition Navigator',
// };

export default function AdminDashboardPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const { toast } = useToast(); // Moved toast hook here as it's used in this component scope

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (!isAdmin) {
        toast({ variant: "destructive", title: "Access Denied", description: "You do not have permission to view this page." });
        router.replace("/dashboard");
      }
    }
  }, [user, loading, isAdmin, router, toast]); // Added toast to dependencies

  if (loading || !user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
            <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
            <p className="text-muted-foreground mt-2">You do not have the necessary permissions to access the admin dashboard.</p>
            <Button onClick={() => router.push('/dashboard')} className="mt-6">Go to Dashboard</Button>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
       <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, channels, and application data.</p>
        </div>
      <AdminDashboardClient />
    </AppLayout>
  );
}
