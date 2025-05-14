"use client";
import { AppLayout } from "@/components/layout/AppLayout";
import { FoodLogList } from "@/components/dashboard/FoodLogList";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MyFoodLogPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return null; 
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">My Food Log</h1>
          <p className="text-muted-foreground">Review all your past food entries here.</p>
        </div>
        <FoodLogList />
      </div>
    </AppLayout>
  );
}
