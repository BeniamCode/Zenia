"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManualEntryForm } from "./ManualEntryForm";
import { AiEntryForm } from "./AiEntryForm";
import { BarcodeEntry } from "./BarcodeEntry";
import { ClipboardEdit, ScanSearch, ImageUp } from 'lucide-react';

export function FoodEntryTabs() {
  return (
    <Tabs defaultValue="manual" className="w-full">
      <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2 mb-6 bg-transparent p-0">
        <TabsTrigger value="manual" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg rounded-lg border border-border hover:bg-accent/80 hover:text-accent-foreground transition-all">
          <ClipboardEdit className="mr-2 h-5 w-5" /> Manual Entry
        </TabsTrigger>
        <TabsTrigger value="ai" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg rounded-lg border border-border hover:bg-accent/80 hover:text-accent-foreground transition-all">
          <ImageUp className="mr-2 h-5 w-5" /> AI Photo Scan
        </TabsTrigger>
        <TabsTrigger value="barcode" className="py-3 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg rounded-lg border border-border hover:bg-accent/80 hover:text-accent-foreground transition-all">
          <ScanSearch className="mr-2 h-5 w-5" /> Barcode Scan
        </TabsTrigger>
      </TabsList>
      <TabsContent value="manual" className="rounded-lg border bg-card text-card-foreground shadow-md p-6">
        <ManualEntryForm />
      </TabsContent>
      <TabsContent value="ai" className="rounded-lg border bg-card text-card-foreground shadow-md p-6">
        <AiEntryForm />
      </TabsContent>
      <TabsContent value="barcode" className="rounded-lg border bg-card text-card-foreground shadow-md p-6">
        <BarcodeEntry />
      </TabsContent>
    </Tabs>
  );
}
