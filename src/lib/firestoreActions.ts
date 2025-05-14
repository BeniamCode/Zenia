"use server"; 

import { db } from '@/config/firebase';
import type { FoodLog } from '@/types';
import { collection, addDoc, query, where, getDocs, serverTimestamp, orderBy, limit, startAfter, DocumentData, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';

export async function addFoodLogEntry(userId: string, foodLogData: Omit<FoodLog, 'id' | 'userId' | 'timestamp'>): Promise<string> {
  if (!userId) throw new Error("User ID is required to add a food log entry.");

  try {
    // Ensure all properties in foodLogData are serializable and not undefined
    const dataToSave: any = { ...foodLogData };
    for (const key in dataToSave) {
      if (dataToSave[key] === undefined) {
        delete dataToSave[key]; // Remove undefined properties
      }
    }
    
    const docRef = await addDoc(collection(db, `users/${userId}/foodLogs`), {
      ...dataToSave,
      userId, 
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding food log entry: ", error);
    throw new Error("Failed to add food log entry.");
  }
}

interface GetFoodLogsParams {
  userId: string;
  count?: number;
  lastVisibleDoc?: QueryDocumentSnapshot<DocumentData> | null;
}

interface FoodLogsResponse {
  logs: FoodLog[];
  nextLastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null;
}

export async function getFoodLogs({ userId, count = 10, lastVisibleDoc = null }: GetFoodLogsParams): Promise<FoodLogsResponse> {
  if (!userId) throw new Error("User ID is required to get food logs.");
  
  try {
    const foodLogsRef = collection(db, `users/${userId}/foodLogs`);
    let q;

    if (lastVisibleDoc) {
      q = query(foodLogsRef, orderBy("timestamp", "desc"), startAfter(lastVisibleDoc), limit(count));
    } else {
      q = query(foodLogsRef, orderBy("timestamp", "desc"), limit(count));
    }
    
    const querySnapshot = await getDocs(q);
    const logs: FoodLog[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Ensure timestamp is correctly converted if it's a Firestore Timestamp object
      const timestamp = data.timestamp instanceof Timestamp ? data.timestamp : Timestamp.now(); // Fallback, should be Timestamp
      logs.push({ id: doc.id, ...data, timestamp } as FoodLog);
    });

    const newLastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
    
    return { logs, nextLastVisibleDoc: newLastVisibleDoc };

  } catch (error) {
    console.error("Error getting food logs: ", error);
    throw new Error("Failed to retrieve food logs.");
  }
}

export async function getAllUsersFoodLogsForAdmin() {
  // This is a placeholder for a complex operation.
  // In a real scenario, this would need careful implementation regarding security (admin checks),
  // performance (handling potentially large datasets), and possibly different data structuring
  // or a backend Cloud Function for aggregation.
  console.warn("getAllUsersFoodLogsForAdmin is a placeholder and not fully implemented for production use due to security and performance considerations.");
  // Example: Fetching all users (requires admin SDK or specific rules)
  // const usersSnapshot = await getDocs(collection(db, "users"));
  // let allLogs: FoodLog[] = [];
  // for (const userDoc of usersSnapshot.docs) {
  //   const { logs } = await getFoodLogs({ userId: userDoc.id, count: 1000 }); // Example: get up to 1000 logs per user
  //   allLogs = [...allLogs, ...logs];
  // }
  // return allLogs;
  return Promise.resolve([]); // Return empty array as placeholder
}
