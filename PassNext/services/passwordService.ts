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

export interface Password {
  id?: string;
  service: string;
  account: string;
  password: string;
  notes?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PasswordInput {
  service: string;
  account: string;
  password: string;
  notes?: string;
}

export class PasswordService {
  private collectionName = 'passwords';

  async createPassword(userId: string, passwordData: PasswordInput): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const now = new Date();
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...passwordData,
        userId,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });

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

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        passwords.push({
          id: doc.id,
          service: data.service,
          account: data.account,
          password: data.password,
          notes: data.notes,
          userId: data.userId,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        });
      });

      return { success: true, passwords };
    } catch (error) {
      console.error('Error getting passwords:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get passwords' 
      };
    }
  }

  async updatePassword(passwordId: string, passwordData: PasswordInput): Promise<{ success: boolean; error?: string }> {
    try {
      const passwordRef = doc(db, this.collectionName, passwordId);
      await updateDoc(passwordRef, {
        ...passwordData,
        updatedAt: Timestamp.fromDate(new Date()),
      });

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
}

export const passwordService = new PasswordService();
