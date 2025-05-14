"use client";

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
import React from "react";
import { Loader2, Save } from "lucide-react";

const formSchema = z.object({
  foodName: z.string().min(2, { message: "Food name must be at least 2 characters." }).max(200, { message: "Food name must be 200 characters or less."}), // Increased max length
  portionSize: z.string().min(1, { message: "Portion size is required." }).max(100, { message: "Portion size must be 100 characters or less."}), // Increased max length
  // Optional fields, could be expanded
  calories: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
});

export function ManualEntryForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      foodName: "",
      portionSize: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to add food." });
      return;
    }
    setIsLoading(true);
    try {
      await addFoodLogEntry(user.uid, {
        ...values,
        entryMethod: "manual",
      });
      toast({
        title: "Food Logged",
        description: `${values.foodName} has been added to your log.`,
      });
      form.reset();
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
        <h3 className="text-xl font-semibold text-foreground mb-4">Log Food Manually</h3>
        <FormField
          control={form.control}
          name="foodName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Food Item / Description</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Grilled chicken salad with mixed greens and vinaigrette dressing" {...field} />
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
              <FormLabel>Portion Size</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 1 large bowl, 250g, 1 slice" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Optional: Add fields for calories, protein, carbs, fat here if desired */}
        <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Add to Log
        </Button>
      </form>
    </Form>
  );
}
