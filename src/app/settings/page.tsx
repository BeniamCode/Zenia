"use client";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Construction } from "lucide-react";

export default function SettingsPage() {
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
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center">
            <SettingsIcon className="w-8 h-8 mr-3 text-primary" />
            Application Settings
          </h1>
          <p className="text-muted-foreground">Configure your Nutrition Navigator experience.</p>
        </div>
        
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Construction className="w-6 h-6 mr-2 text-accent" />
              Settings Under Construction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-muted-foreground">
              This section is currently under development. Soon, you&apos;ll be able to customize various application settings, 
              such as notification preferences, theme choices, data export options, and more.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Thank you for your patience as we build these features!
            </p>
            <div className="mt-6 flex justify-center">
              <SettingsIcon className="w-24 h-24 text-primary/20" />
            </div>
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}
