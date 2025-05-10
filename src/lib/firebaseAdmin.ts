import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY 
    ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;
    
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID as string,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL as string,
      privateKey,
    })
  });
}

export const adminAuth = getAuth();

/**
 * Get user's display name from Firebase Auth
 * @param userId Firebase UID
 * @returns Display name or 'Anonymous User' if not found
 */
export async function getUserDisplayName(userId: string): Promise<string> {
  try {
    const userRecord = await adminAuth.getUser(userId);
    return userRecord.displayName || 'Anonymous User';
  } catch (error) {
    console.error(`Error fetching user ${userId} from Firebase Auth:`, error);
    return 'Anonymous User';
  }
}

/**
 * Get multiple users' display names at once
 * @param userIds Array of Firebase UIDs
 * @returns Map of userId to displayName
 */
export async function getUsersDisplayNames(userIds: string[]): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(userIds)];
  const displayNames = new Map<string, string>();
  
  try {
    // Process in batches of 100 (Firebase limit)
    const batchSize = 100;
    for (let i = 0; i < uniqueIds.length; i += batchSize) {
      const batch = uniqueIds.slice(i, i + batchSize);
      const userRecords = await adminAuth.getUsers(batch.map(uid => ({ uid })));
      
      userRecords.users.forEach(user => {
        displayNames.set(user.uid, user.displayName || 'Anonymous User');
      });
      
      // Add missing users as Anonymous
      batch.forEach(uid => {
        if (!displayNames.has(uid)) {
          displayNames.set(uid, 'Anonymous User');
        }
      });
    }
  } catch (error) {
    console.error('Error fetching users from Firebase Auth:', error);
    // Fall back to Anonymous for all users
    uniqueIds.forEach(uid => {
      displayNames.set(uid, 'Anonymous User');
    });
  }
  
  return displayNames;
}
