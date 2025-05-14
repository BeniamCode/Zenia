"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Download, PlusCircle, Users, FileSpreadsheet, Activity, Loader2 } from 'lucide-react';
// import { getAllUsersFoodLogsForAdmin } from "@/lib/firestoreActions"; // This function needs proper implementation

export function AdminDashboardClient() {
  const { toast } = useToast();
  const [newChannelName, setNewChannelName] = useState("");
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Channel name cannot be empty." });
      return;
    }
    setIsCreatingChannel(true);
    // Placeholder for actual channel creation logic
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    toast({ title: "Channel Created (Placeholder)", description: `Channel "${newChannelName}" would be created.` });
    setNewChannelName("");
    setIsCreatingChannel(false);
  };

  const handleDownloadFoodLists = async () => {
    setIsDownloading(true);
    toast({ title: "Download Started (Placeholder)", description: "Preparing user food lists for download. This feature needs full implementation." });
    // Placeholder for actual download logic
    // const data = await getAllUsersFoodLogsForAdmin();
    // Convert data to Excel and trigger download
    // This is complex and would typically involve a backend or serverless function.
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
    setIsDownloading(false);
    // For a real implementation, you'd trigger a file download here.
  };
  
  // Dummy data for dashboard stats
  const stats = [
    { title: "Total Users", value: "1,234", icon: <Users className="h-6 w-6 text-primary" />, trend: "+5% last month" },
    { title: "Food Entries Today", value: "567", icon: <FileSpreadsheet className="h-6 w-6 text-primary" />, trend: "+12 entries" },
    { title: "Active Channels", value: "12", icon: <Activity className="h-6 w-6 text-primary" />, trend: "+2 new" },
  ];


  return (
    <div className="space-y-8 mt-6"> {/* Added margin-top for spacing from page title */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><PlusCircle className="mr-2 h-5 w-5 text-primary"/>Create New Channel</CardTitle>
            <CardDescription>Set up a new channel for users or specific groups.</CardDescription>
          </CardHeader>
          <form onSubmit={handleCreateChannel}>
            <CardContent className="space-y-2">
              <Label htmlFor="channelName">Channel Name</Label>
              <Input 
                id="channelName" 
                value={newChannelName} 
                onChange={(e) => setNewChannelName(e.target.value)} 
                placeholder="e.g., Spring Health Challenge" 
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isCreatingChannel} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {isCreatingChannel ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" /> } 
                Create Channel
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><Download className="mr-2 h-5 w-5 text-primary"/>User Data Export</CardTitle>
            <CardDescription>Download all user food log entries as an Excel spreadsheet.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This action will compile all food logs from all users. This may take some time depending on the amount of data. (This is a UI placeholder).
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleDownloadFoodLists} disabled={isDownloading} variant="outline">
              {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Download Food Lists (Excel)
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
