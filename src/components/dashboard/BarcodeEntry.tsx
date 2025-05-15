
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { addFoodLogEntry } from "@/lib/firestoreActions";
import { Loader2, ScanLine, Search, UploadCloud, Info, Edit3, Video, VideoOff, CameraOff } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Quagga from 'quagga'; // ES6 import
import OpenFoodFacts from 'openfoodfacts-nodejs';

// Minimal type definitions for QuaggaJS to avoid errors if @types/quagga is not available
interface QuaggaJSCodeResult {
  code: string | null;
  format?: string;
  // Add other properties from codeResult if needed
}

interface QuaggaJSResultObject {
  codeResult: QuaggaJSCodeResult | null;
  // Add other top-level result properties if needed (e.g., line, box)
}

const formSchema = z.object({
  barcode: z.string().optional(), 
  foodName: z.string().min(1, { message: "Food name is required." }).max(200, { message: "Food name must be 200 characters or less."}),
  portionSize: z.string().min(1, { message: "Portion size is required." }).max(100, { message: "Portion size must be 100 characters or less."}),
});

type BarcodeFormValues = z.infer<typeof formSchema>;

// Adjusted to better match potential SDK response structure
interface OpenFoodFactsProduct {
  product_name_en?: string;
  product_name?: string;
  generic_name_en?: string;
  generic_name?: string;
  image_url?: string;
  image_small_url?: string;
  nutriments?: {
    calories?: number; 
    'energy-kcal_100g'?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
  brands?: string;
  quantity?: string;
  // SDK might wrap product in a top-level 'product' key or return directly
  // and might have a status or status_verbose field.
  // For simplicity, we'll primarily look for these fields directly on the result.
}

// Type for the SDK's getProduct response
interface SdkProductResponse {
  status: number; // 0 for not found, 1 for found
  status_verbose: string;
  product?: OpenFoodFactsProduct; 
  // The SDK might return other fields, this is a minimal interface
}


export function BarcodeEntry() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProduct, setIsFetchingProduct] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [productData, setProductData] = useState<OpenFoodFactsProduct | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const detectedOnce = useRef(false);
  const openFoodFactsClient = useRef(new OpenFoodFacts());


  const stableFetchProductData = useCallback(async (barcode: string) => {
    if (!barcode.trim()) {
        toast({ variant: "destructive", title: "Invalid Barcode", description: "Please enter or scan a valid barcode." });
        return;
    }
    setIsFetchingProduct(true);
    setProductData(null); 
    form.resetField("foodName");
    form.resetField("portionSize");

    try {
      // The SDK's getProduct method might return the product directly or an object containing it.
      // It typically includes a status field.
      const response = await openFoodFactsClient.current.getProduct(barcode) as SdkProductResponse;

      if (response && response.status === 1 && response.product) {
        const product = response.product;
        setProductData(product);
        const productName = product.product_name_en || product.product_name || product.generic_name_en || product.generic_name || "Unknown Product";
        form.setValue("foodName", productName);
        form.setValue("barcode", barcode);
        form.setValue("portionSize", product.quantity || "1 serving (adjust as needed)");
        toast({ title: "Product Found!", description: productName });
      } else {
        toast({ variant: "destructive", title: "Product Not Found", description: response?.status_verbose || "No product data found for this barcode." });
         form.setValue("foodName", "Unknown Product (Not Found)");
         form.setValue("portionSize", "1 serving");
         form.setValue("barcode", barcode);
      }
    } catch (error: any) {
      console.error("OpenFoodFacts SDK error:", error);
      toast({
        variant: "destructive",
        title: "API Error",
        description: error.message || "Could not fetch product data. Please check the barcode and try again.",
      });
        form.setValue("foodName", "Error Fetching Product");
        form.setValue("portionSize", "1 serving");
        form.setValue("barcode", barcode);
    } finally {
      setIsFetchingProduct(false);
    }
  }, [toast, form]);


  useEffect(() => {
    const onDetected = (result: QuaggaJSResultObject | undefined) => {
      if (!result || !result.codeResult || !result.codeResult.code || detectedOnce.current) return;
      
      detectedOnce.current = true; 
      const scannedBarcode = result.codeResult.code;
      if (scannedBarcode) {
        form.setValue("barcode", scannedBarcode);
        setManualBarcode(scannedBarcode);
        stableFetchProductData(scannedBarcode);
      }
      setIsScanning(false); 
    };

    if (isScanning && videoRef.current) {
      detectedOnce.current = false; 
      setCameraError(null);
      setHasCameraPermission(null); 

      Quagga.init(
        {
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: videoRef.current,
            constraints: {
              width: 640, 
              height: 480, 
              facingMode: "environment",
            },
            willReadFrequently: true, 
          },
          locator: { patchSize: "medium", halfSample: true },
          numOfWorkers: typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 2,
          decoder: { 
            readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader", "code_128_reader", "code_39_reader", "codabar_reader"],
            multiple: false, 
          },
          locate: true,
          frequency: 10, 
        },
        (err: any) => {
          if (err) {
            console.error("Quagga initialization error:", err);
            let errorMessage = `Failed to initialize scanner. Ensure camera access is allowed.`;
            if (typeof err === 'string') errorMessage = err;
            else if (err.message) errorMessage = err.message;
            else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMessage = 'Camera permission denied. Please enable camera access in your browser settings.';
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError'){
                errorMessage = 'No camera found. Please ensure a camera is connected and enabled.';
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                errorMessage = 'Camera is already in use or could not be accessed.';
            }
            setCameraError(errorMessage);
            setIsScanning(false);
            setHasCameraPermission(false);
            return;
          }
          setHasCameraPermission(true);
          setCameraError(null);
          Quagga.start();
        }
      );
      Quagga.onDetected(onDetected);
    }

    return () => {
      Quagga.offDetected(onDetected);
      // Check if Quagga is running before stopping
      // Note: Quagga.running is not a documented public API, but Quagga.stop() itself is safe to call.
      // It handles internal checks.
      Quagga.stop();
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
      }
    };
  }, [isScanning, stableFetchProductData, form, toast]);


  const toggleScanner = () => {
    if (isScanning) {
      setIsScanning(false); 
    } else {
      setProductData(null);
      form.reset();
      setManualBarcode("");
      setIsScanning(true); 
    }
  };

  async function onSubmit(values: BarcodeFormValues) {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to add food." });
      return;
    }
    setIsLoading(true);
    try {
      await addFoodLogEntry(user.uid, {
        foodName: values.foodName,
        portionSize: values.portionSize,
        entryMethod: "barcode",
        barcode: values.barcode || manualBarcode,
        apiData: productData || undefined, 
      });
      toast({
        title: "Food Logged via Barcode",
        description: `${values.foodName} has been added to your log.`,
      });
      form.reset();
      setProductData(null);
      setManualBarcode("");
      if(isScanning) setIsScanning(false);
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

  const form = useForm<BarcodeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      barcode: "",
      foodName: "",
      portionSize: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center"><ScanLine className="w-6 h-6 mr-2 text-primary"/>Log Food with Barcode Scan</h3>
        
        <div className="space-y-2">
          <FormLabel>Scan Barcode or Enter Manually</FormLabel>
          <div className="flex gap-2">
            <Button type="button" onClick={toggleScanner} variant="outline" className="flex-shrink-0">
              {isScanning ? <VideoOff className="mr-2 h-4 w-4" /> : <Video className="mr-2 h-4 w-4" />}
              {isScanning ? 'Stop Scanner' : 'Start Scanner'}
            </Button>
          </div>

          {isScanning && (
            <div className="mt-2 p-2 border rounded-md bg-muted aspect-video w-full max-w-md mx-auto relative overflow-hidden">
              <video ref={videoRef} className="w-full h-full object-cover rounded" playsInline autoPlay muted />
            </div>
          )}
          
          { hasCameraPermission === false && ( 
             <Alert variant="destructive" className="mt-2">
                <CameraOff className="h-4 w-4" />
                <AlertTitle>Camera Access Issue</AlertTitle>
                <AlertDescription>{cameraError || "Could not access camera. Please check permissions."}</AlertDescription>
            </Alert>
          )}
           {isScanning && hasCameraPermission === null && !cameraError && ( 
            <Alert className="mt-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Accessing Camera</AlertTitle>
                <AlertDescription>Please allow camera access to start scanning.</AlertDescription>
            </Alert>
          )}
           {isScanning && cameraError && ( 
             <Alert variant="destructive" className="mt-2">
                <CameraOff className="h-4 w-4" />
                <AlertTitle>Scanner Error</AlertTitle>
                <AlertDescription>{cameraError}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex items-end gap-2">
            <FormField
              control={form.control}
              name="barcode"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormLabel htmlFor="manualBarcode">Barcode Number</FormLabel>
                  <FormControl>
                    <Input 
                      id="manualBarcode"
                      placeholder="Enter barcode manually" 
                      {...field} 
                      value={manualBarcode}
                      onChange={(e) => {
                        setManualBarcode(e.target.value);
                        field.onChange(e.target.value); // Keep react-hook-form in sync if needed
                      }}
                      disabled={isScanning}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="button" onClick={() => stableFetchProductData(manualBarcode)} disabled={isFetchingProduct || !manualBarcode.trim() || isScanning} className="flex-shrink-0">
              {isFetchingProduct ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Fetch Info
            </Button>
        </div>


        {productData && (
          <Alert variant="default" className="bg-primary/5 border-primary/20">
            <Info className="h-5 w-5 text-primary" />
            <AlertTitle className="text-primary">Product Information</AlertTitle>
            <AlertDescription className="space-y-2">
              <div className="flex gap-4 items-start">
                {(productData.image_small_url || productData.image_url) && 
                  <Image 
                    src={productData.image_small_url || productData.image_url!} 
                    alt={productData.product_name || 'Product Image'} 
                    width={80} 
                    height={80} 
                    className="rounded-md object-cover border bg-white w-auto h-auto"
                    data-ai-hint="food product"
                  />
                }
                <div className="flex-1">
                    <p><strong>Name:</strong> {productData.product_name_en || productData.product_name || productData.generic_name_en || productData.generic_name}</p>
                    {productData.brands && <p><strong>Brand:</strong> {productData.brands}</p>}
                    {productData.quantity && <p><strong>Package Size:</strong> {productData.quantity}</p>}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="foodName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Food Item Name {productData && <span className="text-xs text-accent">(from API, editable)</span>}</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Whole Wheat Bread" {...field} disabled={isScanning}/>
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
              <FormLabel>Portion Size Consumed {productData && productData.quantity && <span className="text-xs text-accent">(package size: {productData.quantity})</span>}</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 2 slices, 100g, 1/2 pack" {...field} disabled={isScanning} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading || isFetchingProduct || isScanning}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {productData ? <Edit3 className="mr-2 h-4 w-4" /> : <UploadCloud className="mr-2 h-4 w-4" /> }
          {productData ? 'Confirm and Add to Log' : 'Add to Log Manually'}
        </Button>
         <p className="text-xs text-muted-foreground">Note: Barcode scanning uses your device camera. Ensure you have granted permission if prompted.</p>
      </form>
    </Form>
  );
}
