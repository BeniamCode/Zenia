import type { User as FirebaseUser } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'admin' | 'client'; 
  createdAt?: string; // ISO date string
  // Add other profile fields as needed, e.g., nutritional goals, preferences
}

// This interface might not be strictly necessary if `FirebaseUser` from `firebase/auth`
// and `UserProfile` (from Firestore) are handled separately.
// If you add custom claims to FirebaseUser, you might extend it here.
// export interface AppUser extends FirebaseUser {
//   // Example: customRole?: 'admin' | 'client'; (if using custom claims directly on auth user)
// }

export interface FoodLog {
  id?: string; // Firestore document ID, added after retrieval
  userId: string; // ID of the user who created the log
  foodName: string;
  portionSize: number; // Number of palm-sized portions
  entryMethod: 'manual' | 'ai' | 'barcode';
  timestamp: string; // ISO date string for client-side
  imageUrl?: string; // For AI entry - could be a temporary data URI or a permanent storage URL
  barcode?: string; // For barcode entry
  apiData?: any; // Data from OpenFoodFacts API or other sources for barcode/AI entries
  
  // Optional nutritional information
  calories?: number; 
  protein?: number; 
  carbs?: number; 
  fat?: number; 
  // Add more fields as needed: fiber, sugar, vitamins, etc.
}
