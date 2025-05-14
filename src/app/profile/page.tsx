"use client";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateProfile as firebaseUpdateProfile } from "firebase/auth";
import { auth, db } from "@/config/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Loader2, UserCircle, Construction } from "lucide-react";

export default function ProfilePage() {
  const { user, userProfile, loading, isAdmin, setUserProfile: updateUserProfileInContext } = useAuth(); // Assuming userProfile is updated by AuthContext & added setUserProfile
  const router = useRouter();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState(""); // Email usually not updatable this easily
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
    if (userProfile) {
      setDisplayName(userProfile.displayName || "");
      setEmail(userProfile.email || "");
    }
  }, [user, userProfile, loading, router]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) return; // Ensure userProfile is available
    setIsSaving(true);
    try {
      // Update Firebase Auth display name
      await firebaseUpdateProfile(user, { displayName });
      // Update Firestore user document
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { displayName });

      // Update userProfile in AuthContext
      if (updateUserProfileInContext) { // Check if updateUserProfileInContext is defined
         const updatedProfile = { ...userProfile, displayName };
         updateUserProfileInContext(updatedProfile); // Update context state
      }


      toast({ title: "Profile Updated", description: "Your display name has been updated." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !user) {
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center">
            <UserCircle className="w-8 h-8 mr-3 text-primary" />
            My Profile
          </h1>
          <p className="text-muted-foreground">Manage your account details and preferences.</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Update your display name. Email changes require verification and are handled separately.</CardDescription>
          </CardHeader>
          <form onSubmit={handleProfileUpdate}>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="displayName">Display Name</Label>
                <Input 
                  id="displayName" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)} 
                  placeholder="Your Name"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" value={email} disabled placeholder="your.email@example.com" />
                 <p className="text-xs text-muted-foreground">Email address cannot be changed here.</p>
              </div>
               <div className="space-y-1">
                <Label htmlFor="role">Role</Label>
                <Input id="role" value={userProfile?.role || 'client'} disabled className="capitalize"/>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSaving || displayName === (userProfile?.displayName || "")} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Card>

         <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Construction className="w-6 h-6 mr-2 text-accent" />
              More Profile Settings Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-muted-foreground">
              Features like password change, notification preferences, and theme settings will be available here in the future.
            </p>
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}
