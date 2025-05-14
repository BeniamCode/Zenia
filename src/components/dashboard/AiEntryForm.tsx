"use client";

import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { addFoodLogEntry } from "@/lib/firestoreActions";
import { imageToFoodForm, ImageToFoodFormOutput } from "@/ai/flows/image-to-food-form";
import { fileToDataUri } from "@/lib/utils";
import Image from 'next/image';
import { Loader2, UploadCloud, Sparkles, Edit3, ImagePlus } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

const formSchema = z.object({
  foodName: z.string().min(2, { message: "Food name must be at least 2 characters." }).max(200, { message: "Food name must be 200 characters or less."}),
  portionSize: z.string().min(1, { message: "Portion size is required." }).max(100, { message: "Portion size must be 100 characters or less."}), // Increased max length
  imageFile: z.instanceof(File).optional(),
});

type AiFormValues = z.infer<typeof formSchema>;

export function AiEntryForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<ImageToFoodFormOutput | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);


  const form = useForm<AiFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      foodName: "",
      portionSize: "",
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("imageFile", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setAiResult(null); // Reset AI result when new image is selected
      form.resetField("foodName");
      form.resetField("portionSize");
    }
  };

  const handleAnalyzeImage = async () => {
    const imageFile = form.getValues("imageFile");
    if (!imageFile) {
      toast({ variant: "destructive", title: "No Image", description: "Please select an image to analyze." });
      return;
    }

    setIsAnalyzing(true);
    setUploadProgress(0); // Reset progress
    try {
      // Simulate progress
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress += 10;
        if (currentProgress <= 60) { // AI call takes time
          setUploadProgress(currentProgress);
        } else {
            clearInterval(progressInterval);
        }
      }, 150);


      const photoDataUri = await fileToDataUri(imageFile);
      clearInterval(progressInterval); // Stop early progress simulation
      setUploadProgress(60); // Mark URI conversion complete

      const result = await imageToFoodForm({ photoDataUri });
      setUploadProgress(100); // Mark AI analysis complete
      
      setAiResult(result);
      form.setValue("foodName", result.description);
      if (result.portionSize) {
        form.setValue("portionSize", result.portionSize);
      } else {
        form.setValue("portionSize", "1 serving"); // Default if AI doesn't provide
      }
      toast({ title: "Analysis Complete", description: "AI has pre-filled the form. Please review and confirm." });
    } catch (error: any) {
      console.error("AI analysis error:", error);
      toast({
        variant: "destructive",
        title: "AI Analysis Failed",
        description: error.message || "Could not analyze image. Please try again.",
      });
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setUploadProgress(0), 1000); // Hide progress bar after a delay
    }
  };

  async function onSubmit(values: AiFormValues) {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to add food." });
      return;
    }
    setIsLoading(true);
    try {
      await addFoodLogEntry(user.uid, {
        foodName: values.foodName,
        portionSize: values.portionSize,
        entryMethod: "ai",
        imageUrl: imagePreview || undefined, 
      });
      toast({
        title: "Food Logged with AI",
        description: `${values.foodName} has been added to your log.`,
      });
      form.reset();
      setImagePreview(null);
      setAiResult(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear file input
      }

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Log Food",
        description: error.message || "Could not add food item. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center"><ImagePlus className="w-6 h-6 mr-2 text-primary"/>Log Food with AI Photo Scan</h3>
        
        <FormItem>
          <FormLabel htmlFor="imageFile">Upload Meal Photo</FormLabel>
          <FormControl>
            <Input 
              id="imageFile" 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange} 
              ref={fileInputRef}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
            />
          </FormControl>
          <FormMessage>{form.formState.errors.imageFile?.message?.toString()}</FormMessage>
        </FormItem>

        {imagePreview && (
          <div className="mt-4 p-2 border rounded-md bg-muted/50">
            <Image src={imagePreview} alt="Meal preview" width={200} height={200} className="rounded-md object-cover mx-auto shadow-md" data-ai-hint="food meal" />
          </div>
        )}

        {isAnalyzing && <Progress value={uploadProgress} className="w-full h-2 mt-2" />}

        {imagePreview && !aiResult && (
          <Button type="button" onClick={handleAnalyzeImage} disabled={isAnalyzing || !imagePreview} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
            {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Analyze Image with AI
          </Button>
        )}
        
        {aiResult && <p className="text-sm text-muted-foreground flex items-center"><Sparkles className="w-4 h-4 mr-2 text-accent"/>AI has suggested the following details. You can edit them before saving.</p>}

        <FormField
          control={form.control}
          name="foodName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Food Item / Description {aiResult && <span className="text-xs text-accent">(AI Suggested)</span>}</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Spaghetti bolognese with parmesan" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="portionSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Portion Size {aiResult && aiResult.portionSize && <span className="text-xs text-accent">(AI Suggested)</span>}</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 1 plate, 250g, 1 medium apple" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading || isAnalyzing}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {aiResult ? <Edit3 className="mr-2 h-4 w-4" /> : <UploadCloud className="mr-2 h-4 w-4" />  }
          {aiResult ? 'Confirm and Add to Log' : 'Add to Log Manually'}
        </Button>
      </form>
    </Form>
  );
}
