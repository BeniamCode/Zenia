import type { User as FirebaseUser } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'admin' | 'client'; 
  createdAt?: Timestamp | Date; // Optional: when the user profile was created
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
  portionSize: string;
  entryMethod: 'manual' | 'ai' | 'barcode';
  timestamp: Timestamp; // Firestore Timestamp for server-side consistency
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
