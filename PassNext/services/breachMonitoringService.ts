import axios from 'axios';
import * as Crypto from 'expo-crypto';

export interface BreachData {
  Name: string;
  Title: string;
  Domain: string;
  BreachDate: string;
  AddedDate: string;
  ModifiedDate: string;
  PwnCount: number;
  Description: string;
  LogoPath: string;
  DataClasses: string[];
  IsVerified: boolean;
  IsFabricated: boolean;
  IsSensitive: boolean;
  IsRetired: boolean;
  IsSpamList: boolean;
  IsMalware: boolean;
  IsSubscriptionFree: boolean;
}

export interface BreachCheckResult {
  isBreached: boolean;
  breachCount: number;
  breaches: BreachData[];
  lastChecked: Date;
}

export interface PasswordBreachResult {
  isBreached: boolean;
  breachCount: number;
  lastChecked: Date;
}

export class BreachMonitoringService {
  private static instance: BreachMonitoringService;
  private readonly HIBP_API_URL = 'https://haveibeenpwned.com/api/v3';
  private readonly PWNED_PASSWORDS_API_URL = 'https://api.pwnedpasswords.com/range';
  private apiKey: string | null = null;

  static getInstance(): BreachMonitoringService {
    if (!BreachMonitoringService.instance) {
      BreachMonitoringService.instance = new BreachMonitoringService();
    }
    return BreachMonitoringService.instance;
  }

  /**
   * Set API key for Have I Been Pwned service
   */
  setApiKey(key: string): void {
    this.apiKey = key;
  }

  /**
   * Check if an email address has been involved in data breaches
   */
  async checkEmailBreaches(email: string): Promise<BreachCheckResult> {
    try {
      const headers: any = {
        'User-Agent': 'PassNext Password Manager',
      };

      if (this.apiKey) {
        headers['hibp-api-key'] = this.apiKey;
      }

      const response = await axios.get(
        `${this.HIBP_API_URL}/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
        { headers }
      );

      const breaches: BreachData[] = response.data;
      
      return {
        isBreached: breaches.length > 0,
        breachCount: breaches.length,
        breaches,
        lastChecked: new Date(),
      };
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        // No breaches found
        return {
          isBreached: false,
          breachCount: 0,
          breaches: [],
          lastChecked: new Date(),
        };
      }
      
      console.error('Error checking email breaches:', error);
      throw new Error('Failed to check email breaches');
    }
  }

  /**
   * Check if a password has been compromised using k-anonymity
   */
  async checkPasswordBreach(password: string): Promise<PasswordBreachResult> {
    try {
      // Hash the password with SHA-1
      const hashArrayBuffer = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA1,
        password,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      
      const hash = hashArrayBuffer.toUpperCase();
      const hashPrefix = hash.substring(0, 5);
      const hashSuffix = hash.substring(5);

      // Query the k-anonymity API
      const response = await axios.get(`${this.PWNED_PASSWORDS_API_URL}/${hashPrefix}`, {
        headers: {
          'User-Agent': 'PassNext Password Manager',
        },
      });

      const lines = response.data.split('\n');
      let breachCount = 0;

      for (const line of lines) {
        const [suffix, count] = line.split(':');
        if (suffix === hashSuffix) {
          breachCount = parseInt(count, 10);
          break;
        }
      }

      return {
        isBreached: breachCount > 0,
        breachCount,
        lastChecked: new Date(),
      };
    } catch (error) {
      console.error('Error checking password breach:', error);
      throw new Error('Failed to check password breach');
    }
  }

  /**
   * Check multiple passwords for breaches
   */
  async checkMultiplePasswordBreaches(passwords: string[]): Promise<Map<string, PasswordBreachResult>> {
    const results = new Map<string, PasswordBreachResult>();
    
    for (const password of passwords) {
      try {
        const result = await this.checkPasswordBreach(password);
        results.set(password, result);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error checking password breach for password: ${error}`);
        results.set(password, {
          isBreached: false,
          breachCount: 0,
          lastChecked: new Date(),
        });
      }
    }
    
    return results;
  }

  /**
   * Get breach information for a specific domain
   */
  async getDomainBreaches(domain: string): Promise<BreachData[]> {
    try {
      const headers: any = {
        'User-Agent': 'PassNext Password Manager',
      };

      if (this.apiKey) {
        headers['hibp-api-key'] = this.apiKey;
      }

      const response = await axios.get(
        `${this.HIBP_API_URL}/breaches`,
        { 
          headers,
          params: { domain }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting domain breaches:', error);
      return [];
    }
  }

  /**
   * Get all known breaches
   */
  async getAllBreaches(): Promise<BreachData[]> {
    try {
      const headers: any = {
        'User-Agent': 'PassNext Password Manager',
      };

      if (this.apiKey) {
        headers['hibp-api-key'] = this.apiKey;
      }

      const response = await axios.get(
        `${this.HIBP_API_URL}/breaches`,
        { headers }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting all breaches:', error);
      return [];
    }
  }

  /**
   * Generate breach risk assessment
   */
  generateBreachRiskAssessment(breaches: BreachData[]): {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    score: number;
    recommendations: string[];
    recentBreaches: BreachData[];
    highImpactBreaches: BreachData[];
  } {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    
    const recentBreaches = breaches.filter(breach => 
      new Date(breach.BreachDate) > oneYearAgo
    );
    
    const highImpactBreaches = breaches.filter(breach => 
      breach.PwnCount > 1000000 && breach.IsVerified
    );

    let score = 0;
    const recommendations: string[] = [];

    // Calculate risk score
    score += breaches.length * 5; // Base score per breach
    score += recentBreaches.length * 15; // Higher weight for recent breaches
    score += highImpactBreaches.length * 25; // Higher weight for high-impact breaches

    // Adjust for sensitive breaches
    const sensitiveBreaches = breaches.filter(breach => breach.IsSensitive);
    score += sensitiveBreaches.length * 20;

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (score >= 100) riskLevel = 'critical';
    else if (score >= 60) riskLevel = 'high';
    else if (score >= 30) riskLevel = 'medium';

    // Generate recommendations
    if (breaches.length > 0) {
      recommendations.push('Change all passwords for breached accounts immediately');
    }
    
    if (recentBreaches.length > 0) {
      recommendations.push('Monitor accounts from recent breaches closely');
    }
    
    if (highImpactBreaches.length > 0) {
      recommendations.push('Enable two-factor authentication for high-impact breached accounts');
    }
    
    if (sensitiveBreaches.length > 0) {
      recommendations.push('Review and update security settings for sensitive accounts');
    }

    return {
      riskLevel,
      score,
      recommendations,
      recentBreaches,
      highImpactBreaches,
    };
  }

  /**
   * Check if a service domain has been breached
   */
  async checkServiceBreach(serviceName: string): Promise<{
    hasBreaches: boolean;
    breaches: BreachData[];
    recommendations: string[];
  }> {
    try {
      // Try to extract domain from service name
      const domain = this.extractDomainFromService(serviceName);
      const breaches = await this.getDomainBreaches(domain);
      
      const recommendations: string[] = [];
      
      if (breaches.length > 0) {
        recommendations.push(`${serviceName} has been involved in ${breaches.length} data breach(es)`);
        recommendations.push('Consider changing your password for this service');
        
        const recentBreaches = breaches.filter(breach => {
          const breachDate = new Date(breach.BreachDate);
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          return breachDate > oneYearAgo;
        });
        
        if (recentBreaches.length > 0) {
          recommendations.push('This service has had recent breaches - immediate action recommended');
        }
      }
      
      return {
        hasBreaches: breaches.length > 0,
        breaches,
        recommendations,
      };
    } catch (error) {
      console.error('Error checking service breach:', error);
      return {
        hasBreaches: false,
        breaches: [],
        recommendations: [],
      };
    }
  }

  /**
   * Extract domain from service name
   */
  private extractDomainFromService(serviceName: string): string {
    // Simple domain extraction logic
    const lowerService = serviceName.toLowerCase();
    
    // Common service mappings
    const serviceMap: { [key: string]: string } = {
      'gmail': 'gmail.com',
      'google': 'google.com',
      'facebook': 'facebook.com',
      'instagram': 'instagram.com',
      'twitter': 'twitter.com',
      'linkedin': 'linkedin.com',
      'microsoft': 'microsoft.com',
      'apple': 'apple.com',
      'amazon': 'amazon.com',
      'netflix': 'netflix.com',
      'spotify': 'spotify.com',
      'github': 'github.com',
      'dropbox': 'dropbox.com',
      'yahoo': 'yahoo.com',
      'ebay': 'ebay.com',
      'paypal': 'paypal.com',
    };

    // Check if it's a known service
    for (const [service, domain] of Object.entries(serviceMap)) {
      if (lowerService.includes(service)) {
        return domain;
      }
    }

    // If it looks like a URL, extract the domain
    if (lowerService.includes('.')) {
      return lowerService.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    }

    // Default: assume it's a domain or add .com
    return lowerService.includes('.') ? lowerService : `${lowerService}.com`;
  }
}

export const breachMonitoringService = BreachMonitoringService.getInstance();
