import CryptoJS from 'crypto-js';

export class EncryptionService {
  private static instance: EncryptionService;
  
  private constructor() {}
  
  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Generate a unique encryption key for each user based on their UID
   * In production, consider using a more robust key derivation function
   */
  private generateUserKey(userId: string): string {
    // Using PBKDF2 for key derivation
    const salt = 'PassNext-Salt-2025'; // In production, use a random salt per user
    const key = CryptoJS.PBKDF2(userId, salt, {
      keySize: 256 / 32,
      iterations: 10000
    });
    return key.toString();
  }

  /**
   * Encrypt sensitive data
   */
  public encrypt(data: string, userId: string): string {
    try {
      const key = this.generateUserKey(userId);
      const encrypted = CryptoJS.AES.encrypt(data, key).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Check if data is encrypted by trying to decrypt it
   */
  public isEncrypted(data: string): boolean {
    try {
      // Check if it looks like encrypted data (base64 with specific characteristics)
      return data.includes('U2FsdGVkX1') || (data.length > 20 && /^[A-Za-z0-9+/]+=*$/.test(data));
    } catch {
      return false;
    }
  }

  /**
   * Safely decrypt data - returns original if not encrypted
   */
  public safeDecrypt(data: string, userId: string): string {
    if (!data) return data;
    
    // If data doesn't look encrypted, return as-is
    if (!this.isEncrypted(data)) {
      return data;
    }
    
    try {
      return this.decrypt(data, userId);
    } catch (error) {
      console.warn('Failed to decrypt data, returning original:', error);
      return data; // Return original data if decryption fails
    }
  }

  /**
   * Decrypt sensitive data
   */
  public decrypt(encryptedData: string, userId: string): string {
    try {
      const key = this.generateUserKey(userId);
      const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        throw new Error('Decryption failed - invalid data or key');
      }
      
      return decryptedString;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt password data object
   */
  public encryptPasswordData(data: {
    service: string;
    account: string;
    password: string;
    notes?: string;
  }, userId: string): {
    service: string;
    account: string;
    password: string;
    notes?: string;
  } {
    return {
      service: data.service, // Service name can remain unencrypted for search/display
      account: this.encrypt(data.account, userId),
      password: this.encrypt(data.password, userId),
      notes: data.notes && data.notes.trim() ? this.encrypt(data.notes, userId) : undefined,
    };
  }

  /**
   * Decrypt password data object with backward compatibility
   */
  public decryptPasswordData(encryptedData: {
    service: string;
    account: string;
    password: string;
    notes?: string;
  }, userId: string): {
    service: string;
    account: string;
    password: string;
    notes?: string;
  } {
    return {
      service: encryptedData.service, // Service name is not encrypted
      account: this.safeDecrypt(encryptedData.account, userId),
      password: this.safeDecrypt(encryptedData.password, userId),
      notes: (encryptedData.notes && encryptedData.notes.trim()) ? this.safeDecrypt(encryptedData.notes, userId) : undefined,
    };
  }

  /**
   * Check if password data is encrypted
   */
  public isPasswordDataEncrypted(data: {
    account: string;
    password: string;
    notes?: string;
  }): boolean {
    return this.isEncrypted(data.account) && this.isEncrypted(data.password);
  }

  /**
   * Migrate unencrypted password data to encrypted format
   */
  public migrateToEncrypted(data: {
    service: string;
    account: string;
    password: string;
    notes?: string;
  }, userId: string): {
    service: string;
    account: string;
    password: string;
    notes?: string;
    migrated?: boolean;
  } {
    // If already encrypted, return as-is
    if (this.isPasswordDataEncrypted(data)) {
      return data;
    }

    // Encrypt the data
    const encrypted = this.encryptPasswordData(data, userId);
    return {
      ...encrypted,
      migrated: true,
    };
  }
}

export const encryptionService = EncryptionService.getInstance();
