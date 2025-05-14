"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getFoodLogs } from '@/lib/firestoreActions';
import type { FoodLog } from '@/types';
import { FoodLogItem } from './FoodLogItem';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Utensils, ListChecks } from 'lucide-react';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

export function FoodLogList() {
  const { user } = useAuth();
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (loadMore = false) => {
    if (!user) return;

    setError(null);
    if (loadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setFoodLogs([]); 
      setLastVisible(null);
      setHasMore(true);
    }

    try {
      const { logs: newLogs, nextLastVisibleDoc } = await getFoodLogs({
        userId: user.uid,
        count: 5, 
        lastVisibleDoc: loadMore ? lastVisible : null,
      });
      
      setFoodLogs(prevLogs => loadMore ? [...prevLogs, ...newLogs] : newLogs);
      setLastVisible(nextLastVisibleDoc);
      setHasMore(newLogs.length === 5); // Check if there might be more items
    } catch (err: any) {
      console.error("Failed to fetch food logs:", err);
      setError(err.message || "Failed to load food logs. Please try again.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [user, lastVisible]); // Removed foodLogs from dependencies as it causes infinite loops if not careful

  useEffect(() => {
    if (user) {
      fetchLogs();
    } else {
      // Clear logs if user logs out or is not available
      setFoodLogs([]);
      setIsLoading(false);
      setHasMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [user]); // Only re-fetch when user changes

  const handleRefresh = () => {
    fetchLogs(false); 
  };


  if (isLoading && foodLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p>Loading your food log...</p>
      </div>
    );
  }

  if (error) {
     return (
      <div className="text-center p-8 border border-dashed border-destructive rounded-lg bg-destructive/10">
        <Utensils className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h3 className="text-xl font-semibold mb-2 text-destructive">Error Loading Food Log</h3>
        <p className="text-destructive/80">{error}</p>
        <Button onClick={handleRefresh} variant="destructive" className="mt-4">
          <RefreshCw className={`mr-2 h-4 w-4`} />
          Try Again
        </Button>
      </div>
    );
  }

  if (!isLoading && foodLogs.length === 0) {
    return (
      <div className="text-center p-8 border border-dashed rounded-lg">
        <ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Your Food Log is Empty</h3>
        <p className="text-muted-foreground">Start adding entries using the tabs above to see them here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-foreground">Recent Food Entries</h2>
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoading || isLoadingMore}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading || isLoadingMore ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      <div className="space-y-4">
        {foodLogs.map((log) => (
          <FoodLogItem key={log.id} log={log} />
        ))}
      </div>
      {isLoadingMore && (
        <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {hasMore && !isLoadingMore && (
        <div className="text-center mt-6">
          <Button onClick={() => fetchLogs(true)} disabled={isLoadingMore} variant="ghost" className="text-primary hover:text-primary/80">
            Load More
          </Button>
        </div>
      )}
      {!hasMore && foodLogs.length > 0 && !isLoading && !isLoadingMore && (
        <p className="text-center text-sm text-muted-foreground mt-6 py-4 border-t">You&apos;ve reached the end of your log.</p>
      )}
    </div>
  );
}
