import { Password } from './passwordService';
import { passwordStrengthService } from './passwordStrengthService';
import { breachMonitoringService } from './breachMonitoringService';
import { notificationService } from './notificationService';
import { passwordExpiryService } from './passwordExpiryService';

export interface SecurityMetrics {
  totalPasswords: number;
  weakPasswords: number;
  reusedPasswords: number;
  oldPasswords: number;
  breachedPasswords: number;
  expiringPasswords: number;
  securityScore: number;
}

export interface PasswordHealth {
  id: string;
  service: string;
  strength: {
    score: number;
    level: string;
    color: string;
  };
  isWeak: boolean;
  isReused: boolean;
  isOld: boolean;
  isBreached: boolean;
  isExpiring: boolean;
  daysSinceCreated: number;
  daysUntilExpiry?: number;
  recommendations: string[];
}

export interface SecurityDashboardData {
  metrics: SecurityMetrics;
  passwordHealth: PasswordHealth[];
  recommendations: string[];
  alerts: SecurityAlert[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityAlert {
  id: string;
  type: 'weak_password' | 'reused_password' | 'old_password' | 'breach' | 'expiring';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  serviceName: string;
  passwordId: string;
  createdAt: Date;
  isRead: boolean;
  actions: Array<{
    label: string;
    action: string;
    isPrimary: boolean;
  }>;
}

export class SecurityDashboardService {
  private static instance: SecurityDashboardService;

  static getInstance(): SecurityDashboardService {
    if (!SecurityDashboardService.instance) {
      SecurityDashboardService.instance = new SecurityDashboardService();
    }
    return SecurityDashboardService.instance;
  }

  /**
   * Generate comprehensive security dashboard data
   */
  async generateSecurityDashboard(passwords: Password[]): Promise<SecurityDashboardData> {
    const metrics = await this.calculateSecurityMetrics(passwords);
    const passwordHealth = await this.analyzePasswordHealth(passwords);
    const recommendations = this.generateSecurityRecommendations(metrics, passwordHealth);
    const alerts = await this.generateSecurityAlerts(passwordHealth);
    const riskLevel = this.calculateOverallRiskLevel(metrics);

    return {
      metrics,
      passwordHealth,
      recommendations,
      alerts,
      riskLevel,
    };
  }

  /**
   * Calculate security metrics
   */
  private async calculateSecurityMetrics(passwords: Password[]): Promise<SecurityMetrics> {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    const twoWeeksFromNow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14);

    let weakPasswords = 0;
    let reusedPasswords = 0;
    let oldPasswords = 0;
    let breachedPasswords = 0;
    let expiringPasswords = 0;

    const passwordCounts = new Map<string, number>();
    const decryptedPasswords: string[] = [];

    // Analyze each password
    for (const password of passwords) {
      // Check password strength
      const strength = passwordStrengthService.getPasswordStrengthIndicator(password.password);
      if (strength.score < 3) {
        weakPasswords++;
      }

      // Check for reuse
      const count = passwordCounts.get(password.password) || 0;
      passwordCounts.set(password.password, count + 1);
      decryptedPasswords.push(password.password);

      // Check if password is old
      if (password.createdAt < threeMonthsAgo) {
        oldPasswords++;
      }

      // Check for expiry (if expiry date is set)
      const expiryDate = this.getPasswordExpiryDate(password);
      if (expiryDate && expiryDate <= twoWeeksFromNow) {
        expiringPasswords++;
      }
    }

    // Count reused passwords
    for (const [, count] of passwordCounts) {
      if (count > 1) {
        reusedPasswords += count;
      }
    }

    // Check for breached passwords (simplified - in real app, you'd check against breach database)
    try {
      const breachResults = await breachMonitoringService.checkMultiplePasswordBreaches(decryptedPasswords);
      breachedPasswords = Array.from(breachResults.values()).filter(result => result.isBreached).length;
    } catch (error) {
      console.error('Error checking password breaches:', error);
      breachedPasswords = 0;
    }

    const securityScore = this.calculateSecurityScore({
      totalPasswords: passwords.length,
      weakPasswords,
      reusedPasswords,
      oldPasswords,
      breachedPasswords,
      expiringPasswords,
    });

    return {
      totalPasswords: passwords.length,
      weakPasswords,
      reusedPasswords,
      oldPasswords,
      breachedPasswords,
      expiringPasswords,
      securityScore,
    };
  }

  /**
   * Analyze individual password health
   */
  private async analyzePasswordHealth(passwords: Password[]): Promise<PasswordHealth[]> {
    const passwordHealth: PasswordHealth[] = [];
    const passwordCounts = new Map<string, number>();
    const now = new Date();

    // Count password reuse
    for (const password of passwords) {
      const count = passwordCounts.get(password.password) || 0;
      passwordCounts.set(password.password, count + 1);
    }

    for (const password of passwords) {
      const strength = passwordStrengthService.getPasswordStrengthIndicator(password.password);
      const daysSinceCreated = Math.floor((now.getTime() - password.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const expiryDate = this.getPasswordExpiryDate(password);
      const daysUntilExpiry = expiryDate ? Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : undefined;

      const isWeak = strength.score < 3;
      const isReused = (passwordCounts.get(password.password) || 0) > 1;
      const isOld = daysSinceCreated > 90; // 3 months
      const isExpiring = daysUntilExpiry !== undefined && daysUntilExpiry <= 14;

      // Check if password is breached (simplified)
      let isBreached = false;
      try {
        const breachResult = await breachMonitoringService.checkPasswordBreach(password.password);
        isBreached = breachResult.isBreached;
      } catch (error) {
        console.error('Error checking password breach:', error);
      }

      const recommendations = this.generatePasswordRecommendations({
        isWeak,
        isReused,
        isOld,
        isBreached,
        isExpiring,
        strength,
        daysSinceCreated,
        daysUntilExpiry,
      });

      passwordHealth.push({
        id: password.id || '',
        service: password.service,
        strength: {
          score: strength.score,
          level: strength.level,
          color: strength.color,
        },
        isWeak,
        isReused,
        isOld,
        isBreached,
        isExpiring,
        daysSinceCreated,
        daysUntilExpiry,
        recommendations,
      });
    }

    return passwordHealth;
  }

  /**
   * Generate security recommendations
   */
  private generateSecurityRecommendations(metrics: SecurityMetrics, passwordHealth: PasswordHealth[]): string[] {
    const recommendations: string[] = [];

    if (metrics.securityScore < 50) {
      recommendations.push('Your password security needs immediate attention');
    }

    if (metrics.weakPasswords > 0) {
      recommendations.push(`Update ${metrics.weakPasswords} weak password(s) to improve security`);
    }

    if (metrics.reusedPasswords > 0) {
      recommendations.push(`${metrics.reusedPasswords} password(s) are reused - create unique passwords for each account`);
    }

    if (metrics.oldPasswords > 0) {
      recommendations.push(`${metrics.oldPasswords} password(s) are over 3 months old - consider updating them`);
    }

    if (metrics.breachedPasswords > 0) {
      recommendations.push(`${metrics.breachedPasswords} password(s) have been found in data breaches - change them immediately`);
    }

    if (metrics.expiringPasswords > 0) {
      recommendations.push(`${metrics.expiringPasswords} password(s) are expiring soon - schedule updates`);
    }

    if (metrics.totalPasswords < 5) {
      recommendations.push('Consider using a password manager for all your accounts');
    }

    // Add general security tips
    if (recommendations.length === 0) {
      recommendations.push('Your password security looks good! Keep up the good work.');
      recommendations.push('Consider enabling two-factor authentication for additional security');
    }

    return recommendations;
  }

  /**
   * Generate security alerts
   */
  private async generateSecurityAlerts(passwordHealth: PasswordHealth[]): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];

    for (const health of passwordHealth) {
      if (health.isBreached) {
        alerts.push({
          id: `breach-${health.id}`,
          type: 'breach',
          severity: 'critical',
          title: 'Password Compromised',
          message: `Your password for ${health.service} has been found in a data breach`,
          serviceName: health.service,
          passwordId: health.id,
          createdAt: new Date(),
          isRead: false,
          actions: [
            { label: 'Change Password', action: 'change_password', isPrimary: true },
            { label: 'Learn More', action: 'learn_more', isPrimary: false },
          ],
        });
      }

      if (health.isWeak) {
        alerts.push({
          id: `weak-${health.id}`,
          type: 'weak_password',
          severity: 'high',
          title: 'Weak Password',
          message: `Your password for ${health.service} is weak and easily guessable`,
          serviceName: health.service,
          passwordId: health.id,
          createdAt: new Date(),
          isRead: false,
          actions: [
            { label: 'Strengthen Password', action: 'strengthen_password', isPrimary: true },
            { label: 'Generate New', action: 'generate_password', isPrimary: false },
          ],
        });
      }

      if (health.isExpiring && health.daysUntilExpiry !== undefined) {
        alerts.push({
          id: `expiring-${health.id}`,
          type: 'expiring',
          severity: health.daysUntilExpiry <= 7 ? 'high' : 'medium',
          title: 'Password Expiring Soon',
          message: `Your password for ${health.service} expires in ${health.daysUntilExpiry} days`,
          serviceName: health.service,
          passwordId: health.id,
          createdAt: new Date(),
          isRead: false,
          actions: [
            { label: 'Update Password', action: 'update_password', isPrimary: true },
            { label: 'Extend Expiry', action: 'extend_expiry', isPrimary: false },
          ],
        });
      }

      if (health.isReused) {
        alerts.push({
          id: `reused-${health.id}`,
          type: 'reused_password',
          severity: 'medium',
          title: 'Password Reused',
          message: `Your password for ${health.service} is used for multiple accounts`,
          serviceName: health.service,
          passwordId: health.id,
          createdAt: new Date(),
          isRead: false,
          actions: [
            { label: 'Create Unique Password', action: 'create_unique', isPrimary: true },
          ],
        });
      }
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Calculate overall risk level
   */
  private calculateOverallRiskLevel(metrics: SecurityMetrics): 'low' | 'medium' | 'high' | 'critical' {
    if (metrics.breachedPasswords > 0) return 'critical';
    if (metrics.weakPasswords > metrics.totalPasswords * 0.3) return 'high';
    if (metrics.reusedPasswords > 0 || metrics.oldPasswords > metrics.totalPasswords * 0.5) return 'medium';
    return 'low';
  }

  /**
   * Calculate security score (0-100)
   */
  private calculateSecurityScore(metrics: Omit<SecurityMetrics, 'securityScore'>): number {
    if (metrics.totalPasswords === 0) return 0;

    let score = 100;

    // Deduct points for security issues
    score -= (metrics.weakPasswords / metrics.totalPasswords) * 30;
    score -= (metrics.reusedPasswords / metrics.totalPasswords) * 25;
    score -= (metrics.oldPasswords / metrics.totalPasswords) * 20;
    score -= (metrics.breachedPasswords / metrics.totalPasswords) * 40;
    score -= (metrics.expiringPasswords / metrics.totalPasswords) * 10;

    return Math.max(0, Math.round(score));
  }

  /**
   * Generate password-specific recommendations
   */
  private generatePasswordRecommendations(params: {
    isWeak: boolean;
    isReused: boolean;
    isOld: boolean;
    isBreached: boolean;
    isExpiring: boolean;
    strength: any;
    daysSinceCreated: number;
    daysUntilExpiry?: number;
  }): string[] {
    const recommendations: string[] = [];

    if (params.isBreached) {
      recommendations.push('🚨 Password found in data breach - change immediately');
    }

    if (params.isWeak) {
      recommendations.push('⚠️ Password is weak - use longer, more complex password');
    }

    if (params.isReused) {
      recommendations.push('🔄 Password is reused - create a unique password');
    }

    if (params.isOld) {
      recommendations.push(`📅 Password is ${params.daysSinceCreated} days old - consider updating`);
    }

    if (params.isExpiring) {
      recommendations.push(`⏰ Password expires in ${params.daysUntilExpiry} days`);
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Password appears secure');
    }

    return recommendations;
  }

  /**
   * Get password expiry date (using password expiry service)
   */
  private getPasswordExpiryDate(password: Password): Date | null {
    return password.expiryDate || null;
  }

  /**
   * Schedule security notifications
   */
  async scheduleSecurityNotifications(alerts: SecurityAlert[]): Promise<void> {
    const preferences = await notificationService.getNotificationPreferences();

    for (const alert of alerts) {
      switch (alert.type) {
        case 'breach':
          if (preferences.breachAlerts) {
            await notificationService.scheduleBreachAlert(alert.serviceName, alert.passwordId);
          }
          break;
        case 'weak_password':
          if (preferences.weakPasswordAlerts) {
            await notificationService.scheduleWeakPasswordAlert(alert.serviceName, alert.passwordId);
          }
          break;
        case 'expiring':
          if (preferences.passwordExpiry) {
            const daysUntilExpiry = alert.message.match(/(\d+) days/)?.[1];
            if (daysUntilExpiry) {
              await notificationService.schedulePasswordExpiryReminder(
                alert.serviceName,
                parseInt(daysUntilExpiry),
                alert.passwordId
              );
            }
          }
          break;
      }
    }
  }
}

export const securityDashboardService = SecurityDashboardService.getInstance();
