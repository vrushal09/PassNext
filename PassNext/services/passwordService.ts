import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { encryptionService } from './encryptionService';

export interface Password {
  id?: string;
  service: string;
  account: string;
  password: string;
  notes?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  expiryDate?: Date;
  lastBreachCheck?: Date;
  isBreached?: boolean;
}

export interface PasswordInput {
  service: string;
  account: string;
  password: string;
  notes?: string;
  expiryDate?: Date;
}

export class PasswordService {
  private collectionName = 'passwords';

  async createPassword(userId: string, passwordData: PasswordInput): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const now = new Date();
      
      // Encrypt sensitive data before storing
      const encryptedData = encryptionService.encryptPasswordData(passwordData, userId);
      
      // Remove undefined values to avoid Firestore errors
      const cleanData: any = {
        service: encryptedData.service,
        account: encryptedData.account,
        password: encryptedData.password,
        userId,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };
      
      // Only add notes if it's not undefined
      if (encryptedData.notes !== undefined) {
        cleanData.notes = encryptedData.notes;
      }
      
      const docRef = await addDoc(collection(db, this.collectionName), cleanData);

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating password:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create password' 
      };
    }
  }

  async getPasswords(userId: string): Promise<{ success: boolean; passwords?: Password[]; error?: string }> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const passwords: Password[] = [];
      const migrationsNeeded: { id: string; data: any }[] = [];

      querySnapshot.forEach((doc) => {
        try {
          const data = doc.data();
          
          // Check if migration is needed
          if (!encryptionService.isPasswordDataEncrypted({
            account: data.account,
            password: data.password,
            notes: data.notes,
          })) {
            migrationsNeeded.push({ id: doc.id, data });
          }
          
          // Decrypt sensitive data after retrieving (handles both encrypted and unencrypted)
          const decryptedData = encryptionService.decryptPasswordData({
            service: data.service,
            account: data.account,
            password: data.password,
            notes: data.notes,
          }, userId);
          
          passwords.push({
            id: doc.id,
            service: decryptedData.service,
            account: decryptedData.account,
            password: decryptedData.password,
            notes: decryptedData.notes,
            userId: data.userId,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
          });
        } catch (decryptError) {
          console.error('Error processing password:', decryptError);
          // Skip this password if processing fails
        }
      });

      // Perform migration for unencrypted data in the background
      this.performMigrations(migrationsNeeded, userId);

      return { success: true, passwords };
    } catch (error) {
      console.error('Error getting passwords:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get passwords' 
      };
    }
  }

  /**
   * Perform background migration of unencrypted data
   */
  private async performMigrations(migrationsNeeded: { id: string; data: any }[], userId: string): Promise<void> {
    if (migrationsNeeded.length === 0) return;

    console.log(`Migrating ${migrationsNeeded.length} password entries to encrypted format...`);
    
    for (const migration of migrationsNeeded) {
      try {
        const encryptedData = encryptionService.encryptPasswordData({
          service: migration.data.service,
          account: migration.data.account,
          password: migration.data.password,
          notes: migration.data.notes,
        }, userId);

        // Remove undefined values
        const cleanData: any = {
          service: encryptedData.service,
          account: encryptedData.account,
          password: encryptedData.password,
          updatedAt: Timestamp.fromDate(new Date()),
        };
        
        if (encryptedData.notes !== undefined) {
          cleanData.notes = encryptedData.notes;
        }

        const passwordRef = doc(db, this.collectionName, migration.id);
        await updateDoc(passwordRef, cleanData);
        
        console.log(`Successfully migrated password entry: ${migration.id}`);
      } catch (error) {
        console.error(`Failed to migrate password entry ${migration.id}:`, error);
      }
    }
    
    console.log('Password migration completed');
  }

  async updatePassword(passwordId: string, userId: string, passwordData: PasswordInput): Promise<{ success: boolean; error?: string }> {
    try {
      // Encrypt sensitive data before updating
      const encryptedData = encryptionService.encryptPasswordData(passwordData, userId);
      
      // Remove undefined values to avoid Firestore errors
      const cleanData: any = {
        service: encryptedData.service,
        account: encryptedData.account,
        password: encryptedData.password,
        updatedAt: Timestamp.fromDate(new Date()),
      };
      
      // Only add notes if it's not undefined
      if (encryptedData.notes !== undefined) {
        cleanData.notes = encryptedData.notes;
      }
      
      const passwordRef = doc(db, this.collectionName, passwordId);
      await updateDoc(passwordRef, cleanData);

      return { success: true };
    } catch (error) {
      console.error('Error updating password:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update password' 
      };
    }
  }

  async deletePassword(passwordId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await deleteDoc(doc(db, this.collectionName, passwordId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting password:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete password' 
      };
    }
  }

  /**
   * Manually migrate all unencrypted passwords for a user
   */
  async migrateUserPasswords(userId: string): Promise<{ success: boolean; migratedCount?: number; error?: string }> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const migrationsNeeded: { id: string; data: any }[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Check if migration is needed (if data looks like it's unencrypted)
        if (this.isDataUnencrypted(data)) {
          migrationsNeeded.push({ id: doc.id, data });
        }
      });

      if (migrationsNeeded.length > 0) {
        await this.performMigrations(migrationsNeeded, userId);
        return { success: true, migratedCount: migrationsNeeded.length };
      }

      return { success: true, migratedCount: 0 };
    } catch (error) {
      console.error('Error during migration:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to migrate passwords' 
      };
    }
  }

  /**
   * Check if password data appears to be unencrypted
   */
  private isDataUnencrypted(data: any): boolean {
    try {
      // If the account field looks like an email or normal text (not encrypted), it's probably unencrypted
      const account = data.account || '';
      const password = data.password || '';
      
      // Encrypted data from CryptoJS typically contains special characters and is much longer
      // Unencrypted email addresses contain @ symbol and are readable
      // Unencrypted passwords are typically shorter and readable
      
      return (
        account.includes('@') || // Likely an email address
        account.length < 50 ||   // Encrypted data is usually much longer
        password.length < 30     // Encrypted passwords are typically much longer
      );
    } catch (error) {
      // If we can't determine, assume it's encrypted to be safe
      return false;
    }
  }
}

export const passwordService = new PasswordService();
