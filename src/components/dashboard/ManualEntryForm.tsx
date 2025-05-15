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
  foodName: z.string().min(2, { message: "Food name must be at least 2 characters." }).max(200, { message: "Food name must be 200 characters or less."}),
  portionSize: z.coerce.number() // Coerce string from input to number
                 .min(0.1, { message: "Portion must be at least 0.1." })
                 .max(20, { message: "Portion size seems too large (max 20 palms)."}),
  // Optional fields, could be expanded
  calories: z.coerce.number().optional(), // Coerce for optional number inputs
  protein: z.coerce.number().optional(),
  carbs: z.coerce.number().optional(),
  fat: z.coerce.number().optional(),
});

export function ManualEntryForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      foodName: "",
      portionSize: 1, // Default to 1 palm-sized portion
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
        // Ensure numeric fields are numbers, Zod coerce should handle it
        calories: values.calories || undefined,
        protein: values.protein || undefined,
        carbs: values.carbs || undefined,
        fat: values.fat || undefined,
        entryMethod: "manual",
      });
      toast({
        title: "Food Logged",
        description: `${values.foodName} (${values.portionSize} palm(s)) has been added to your log.`,
      });
      form.reset({ foodName: "", portionSize: 1, calories: undefined, protein: undefined, carbs: undefined, fat: undefined });
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
              <FormLabel>Palm-sized Portions</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="e.g., 1.5" 
                  step="0.1" 
                  {...field} 
                  // value={field.value || ''} // Handle potential undefined from reset if not careful
                  // onChange={e => field.onChange(parseFloat(e.target.value) || 0)} // Ensure it's a number
                />
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
