"use client";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BarChart3, Construction } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
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
            <BarChart3 className="w-8 h-8 mr-3 text-primary" />
            Nutritional Reports
          </h1>
          <p className="text-muted-foreground">Analyze your intake and track your progress over time.</p>
        </div>
        
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Construction className="w-6 h-6 mr-2 text-accent" />
              Feature Under Construction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-muted-foreground">
              We&apos;re working hard to bring you insightful reports and charts. 
              This section will soon provide detailed analysis of your nutritional habits, trends, and summaries.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Stay tuned for updates!
            </p>
            <div className="mt-6 flex justify-center">
              <BarChart3 className="w-24 h-24 text-primary/20" />
            </div>
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}
