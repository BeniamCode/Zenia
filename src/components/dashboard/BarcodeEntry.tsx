"use client";

import React, { useState, useRef, useEffect } from 'react';
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
// For actual barcode scanning, consider installing: npm install @zxing/library
// import { BrowserMultiFormatReader, NotFoundException, BarcodeFormat, DecodeHintType } from '@zxing/library';

const formSchema = z.object({
  barcode: z.string().optional(), 
  foodName: z.string().min(1, { message: "Food name is required." }).max(200, { message: "Food name must be 200 characters or less."}),
  portionSize: z.string().min(1, { message: "Portion size is required." }).max(100, { message: "Portion size must be 100 characters or less."}), // Increased max length
});

type BarcodeFormValues = z.infer<typeof formSchema>;

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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  // const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  const form = useForm<BarcodeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      foodName: "",
      portionSize: "",
      barcode: "",
    },
  });

  const startScanner = async () => {
    setIsScanning(true);
    setProductData(null);
    setCameraError(null);
    form.reset(); // Clear previous form data
    setManualBarcode(""); // Clear manual barcode input
    toast({ title: "Scanner Activated (Placeholder)", description: "Point your camera at a barcode. Full scanning functionality requires a dedicated library and camera permissions."});
    
    // Conceptual @zxing/library integration (actual implementation is more involved)
    /*
    if (!codeReader.current) {
      const hints = new Map();
      const formats = [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.CODE_128, BarcodeFormat.CODE_39, BarcodeFormat.QR_CODE]; // Add more formats as needed
      hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
      codeReader.current = new BrowserMultiFormatReader(hints);
    }
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera access not supported by your browser.");
        setIsScanning(false);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => { // Ensure video dimensions are set
            videoRef.current?.play().catch(err => {
                console.error("Video play error:", err);
                setCameraError("Could not start video playback.");
                stopScanner();
            });
        };
        
        codeReader.current.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
          if (result) {
            const scannedBarcode = result.getText();
            form.setValue("barcode", scannedBarcode);
            setManualBarcode(scannedBarcode); // Also update manual barcode field
            fetchProductData(scannedBarcode);
            stopScanner(); 
          }
          if (err && !(err instanceof NotFoundException)) {
            console.error("Barcode scanning error:", err);
            // Potentially too many toasts here, handle error display differently
          }
        });
      }
    } catch (error: any) {
      console.error("Camera access error:", error);
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setCameraError("Camera permission denied. Please enable camera access in your browser settings.");
      } else {
        setCameraError("Could not access camera. Ensure it's not in use by another app.");
      }
      setIsScanning(false);
    }
    */
  };
  
  const stopScanner = () => {
    setIsScanning(false);
    /*
    if (codeReader.current) {
      codeReader.current.reset();
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    */
  };
  
  useEffect(() => {
    return () => { 
      stopScanner();
    };
  }, []);


  const fetchProductData = async (barcode: string) => {
    if (!barcode.trim()) {
        toast({ variant: "destructive", title: "Invalid Barcode", description: "Please enter or scan a valid barcode." });
        return;
    }
    setIsFetchingProduct(true);
    setProductData(null); // Clear previous product data
    form.resetField("foodName"); // Clear previous food name
    form.resetField("portionSize"); // Clear previous portion size

    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v3/product/${barcode}.json?fields=product_name_en,product_name,generic_name_en,generic_name,image_url,image_small_url,brands,quantity`);
      if (!response.ok) throw new Error(`API error! status: ${response.status}`);
      const data = await response.json();

      if (data.status === 1 && data.product) {
        const product = data.product as OpenFoodFactsProduct;
        setProductData(product);
        const productName = product.product_name_en || product.product_name || product.generic_name_en || product.generic_name || "Unknown Product";
        form.setValue("foodName", productName);
        form.setValue("portionSize", product.quantity || "1 serving (adjust as needed)");
        toast({ title: "Product Found!", description: productName });
      } else {
        toast({ variant: "destructive", title: "Product Not Found", description: data.status_verbose || "No product data found for this barcode." });
         form.setValue("foodName", "Unknown Product (Not Found)");
         form.setValue("portionSize", "1 serving");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "API Error",
        description: error.message || "Could not fetch product data. Please check the barcode and try again.",
      });
        form.setValue("foodName", "Error Fetching Product");
        form.setValue("portionSize", "1 serving");
    } finally {
      setIsFetchingProduct(false);
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
      if(isScanning) stopScanner();
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
        <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center"><ScanLine className="w-6 h-6 mr-2 text-primary"/>Log Food with Barcode Scan</h3>
        
        <div className="space-y-2">
          <FormLabel>Scan Barcode or Enter Manually</FormLabel>
          <div className="flex gap-2">
            <Button type="button" onClick={isScanning ? stopScanner : startScanner} variant="outline" className="flex-shrink-0">
              {isScanning ? <VideoOff className="mr-2 h-4 w-4" /> : <Video className="mr-2 h-4 w-4" />}
              {isScanning ? 'Stop Scanner' : 'Start Scanner'}
            </Button>
          </div>
          {isScanning && (
            <div className="mt-2 p-2 border rounded-md bg-muted aspect-video w-full max-w-md mx-auto relative">
              <video ref={videoRef} className="w-full h-full object-cover rounded" playsInline muted />
              {/* Placeholder for scanning line animation if desired */}
              {/* <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 animate-pulse"></div> */}
              {!cameraError && <p className="text-xs text-muted-foreground text-center mt-1">Align barcode within view. (Scanning is a placeholder)</p>}
            </div>
          )}
          {cameraError && (
             <Alert variant="destructive" className="mt-2">
                <CameraOff className="h-4 w-4" />
                <AlertTitle>Camera Error</AlertTitle>
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
                      value={manualBarcode}  // Controlled by manualBarcode state
                      onChange={(e) => {
                        setManualBarcode(e.target.value);
                        field.onChange(e.target.value); // Also update form state
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="button" onClick={() => fetchProductData(manualBarcode)} disabled={isFetchingProduct || !manualBarcode.trim()} className="flex-shrink-0">
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
                    className="rounded-md object-cover border bg-white w-full h-full"
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
                <Input placeholder="e.g., Whole Wheat Bread" {...field} />
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
                <Input placeholder="e.g., 2 slices, 100g, 1/2 pack" {...field} />
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
         <p className="text-xs text-muted-foreground">Note: Barcode scanning requires camera access. Actual scanning functionality via camera is a placeholder and would need a library like @zxing/library for full implementation.</p>
      </form>
    </Form>
  );
}
