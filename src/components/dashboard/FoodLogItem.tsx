import type { FoodLog } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Utensils, Camera, ScanSearch, CalendarDays, Tag, Info } from 'lucide-react';
import Image from 'next/image';
import { format, isValid } from 'date-fns';

interface FoodLogItemProps {
  log: FoodLog;
}

const getEntryIcon = (method: FoodLog['entryMethod']) => {
  switch (method) {
    case 'manual':
      return <Utensils className="h-4 w-4 text-primary" aria-label="Manual Entry"/>;
    case 'ai':
      return <Camera className="h-4 w-4 text-primary" aria-label="AI Entry"/>;
    case 'barcode':
      return <ScanSearch className="h-4 w-4 text-primary" aria-label="Barcode Entry"/>;
    default:
      return <Utensils className="h-4 w-4 text-primary" aria-label="Food Entry"/>;
  }
};

export function FoodLogItem({ log }: FoodLogItemProps) {
  const formattedDate = log.timestamp && isValid(log.timestamp.toDate()) 
    ? format(log.timestamp.toDate(), 'MMM d, yyyy HH:mm') 
    : 'Date N/A';

  const imageUrl = log.entryMethod === 'ai' && log.imageUrl 
    ? log.imageUrl 
    : log.entryMethod === 'barcode' && (log.apiData?.image_small_url || log.apiData?.image_url)
    ? (log.apiData.image_small_url || log.apiData.image_url)
    : null;
  
  const imageHint = log.entryMethod === 'ai' ? "food meal" : log.entryMethod === 'barcode' ? "food product" : "";

  return (
    <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
                <CardTitle className="text-xl text-foreground">{log.foodName}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-1">
                    Portion: {log.portionSize}
                </CardDescription>
            </div>
            {imageUrl && (
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                    <Image 
                        src={imageUrl} 
                        alt={log.foodName} 
                        width={80} 
                        height={80} 
                        className="rounded-md object-cover border bg-white w-full h-full"
                        data-ai-hint={imageHint}
                    />
                </div>
            )}
        </div>
      </CardHeader>
      <CardContent className="pb-3 pt-0">
        {log.calories && <p className="text-sm text-muted-foreground">Calories: <span className="font-medium text-foreground">{log.calories} kcal</span></p>}
        {log.entryMethod === 'barcode' && log.barcode && (
             <p className="text-xs text-muted-foreground flex items-center mt-1">
                <Tag className="h-3 w-3 mr-1"/> Barcode: {log.barcode}
            </p>
        )}
         {log.entryMethod === 'barcode' && log.apiData?.brands && (
             <p className="text-xs text-muted-foreground flex items-center mt-1">
                <Info className="h-3 w-3 mr-1"/> Brand: {log.apiData.brands}
            </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between items-center text-xs text-muted-foreground pt-0 gap-2">
        <div className="flex items-center gap-1">
          {getEntryIcon(log.entryMethod)}
          <Badge variant="outline" className="capitalize border-primary/50 text-primary">{log.entryMethod}</Badge>
        </div>
        <div className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            <span>{formattedDate}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
