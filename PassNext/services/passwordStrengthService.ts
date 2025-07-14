import zxcvbn from 'zxcvbn';

export interface PasswordStrengthResult {
  score: number; // 0-4 (very weak to very strong)
  feedback: {
    warning: string;
    suggestions: string[];
  };
  crackTimeDisplay: string;
  entropy: number;
  pattern: string[];
  guesses: number;
  guessesLog10: number;
}

export interface PasswordStrengthIndicator {
  score: number;
  level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
  color: string;
  text: string;
  percentage: number;
}

export class PasswordStrengthService {
  private static instance: PasswordStrengthService;

  static getInstance(): PasswordStrengthService {
    if (!PasswordStrengthService.instance) {
      PasswordStrengthService.instance = new PasswordStrengthService();
    }
    return PasswordStrengthService.instance;
  }

  /**
   * Analyze password strength using zxcvbn
   */
  analyzePassword(password: string, userInputs?: string[]): PasswordStrengthResult {
    const result = zxcvbn(password, userInputs);
    
    return {
      score: result.score,
      feedback: {
        warning: result.feedback.warning || '',
        suggestions: result.feedback.suggestions || [],
      },
      crackTimeDisplay: String(result.crack_times_display.offline_slow_hashing_1e4_per_second || ''),
      entropy: this.calculateEntropy(password),
      pattern: result.sequence.map((seq: any) => seq.pattern),
      guesses: result.guesses,
      guessesLog10: result.guesses_log10,
    };
  }

  /**
   * Get password strength indicator for UI display
   */
  getPasswordStrengthIndicator(password: string, userInputs?: string[]): PasswordStrengthIndicator {
    const analysis = this.analyzePassword(password, userInputs);
    
    const indicators = [
      { 
        level: 'very-weak' as const, 
        color: '#FF4444', 
        text: 'Very Weak',
        percentage: 20 
      },
      { 
        level: 'weak' as const, 
        color: '#FF8800', 
        text: 'Weak',
        percentage: 40 
      },
      { 
        level: 'fair' as const, 
        color: '#FFAA00', 
        text: 'Fair',
        percentage: 60 
      },
      { 
        level: 'good' as const, 
        color: '#88DD00', 
        text: 'Good',
        percentage: 80 
      },
      { 
        level: 'strong' as const, 
        color: '#00CC44', 
        text: 'Strong',
        percentage: 100 
      },
    ];

    const indicator = indicators[analysis.score];
    
    return {
      score: analysis.score,
      level: indicator.level,
      color: indicator.color,
      text: indicator.text,
      percentage: indicator.percentage,
    };
  }

  /**
   * Get password improvement suggestions
   */
  getPasswordSuggestions(password: string, userInputs?: string[]): string[] {
    const analysis = this.analyzePassword(password, userInputs);
    const suggestions = [...analysis.feedback.suggestions];

    // Add custom suggestions based on password patterns
    if (password.length < 8) {
      suggestions.push('Use at least 8 characters');
    }
    
    if (password.length < 12) {
      suggestions.push('Consider using 12 or more characters for better security');
    }

    if (!/[A-Z]/.test(password)) {
      suggestions.push('Add uppercase letters');
    }

    if (!/[a-z]/.test(password)) {
      suggestions.push('Add lowercase letters');
    }

    if (!/[0-9]/.test(password)) {
      suggestions.push('Add numbers');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      suggestions.push('Add special characters (!@#$%^&*)');
    }

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      suggestions.push('Avoid repeating characters');
    }

    if (/123|abc|qwe|asd|zxc/i.test(password)) {
      suggestions.push('Avoid common sequences');
    }

    return [...new Set(suggestions)]; // Remove duplicates
  }

  /**
   * Check if password meets minimum requirements
   */
  meetsMinimumRequirements(password: string): {
    meets: boolean;
    requirements: {
      length: boolean;
      uppercase: boolean;
      lowercase: boolean;
      numbers: boolean;
      symbols: boolean;
    };
  } {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /[0-9]/.test(password),
      symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const meets = Object.values(requirements).every(req => req);

    return { meets, requirements };
  }

  /**
   * Generate password strength report
   */
  generateStrengthReport(password: string, userInputs?: string[]): {
    strength: PasswordStrengthIndicator;
    requirements: {
      meets: boolean;
      requirements: {
        length: boolean;
        uppercase: boolean;
        lowercase: boolean;
        numbers: boolean;
        symbols: boolean;
      };
    };
    suggestions: string[];
    analysis: PasswordStrengthResult;
    isSecure: boolean;
  } {
    const strength = this.getPasswordStrengthIndicator(password, userInputs);
    const requirements = this.meetsMinimumRequirements(password);
    const suggestions = this.getPasswordSuggestions(password, userInputs);
    const analysis = this.analyzePassword(password, userInputs);
    const isSecure = strength.score >= 3 && requirements.meets;

    return {
      strength,
      requirements,
      suggestions,
      analysis,
      isSecure,
    };
  }

  /**
   * Check if password is commonly used or breached
   */
  isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
      'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
      'qwerty123', 'dragon', 'master', 'baseball', 'football', 'sunshine',
      'iloveyou', 'trustno1', 'batman', 'superman', 'charlie', 'jordan',
      'princess', 'liverpool', 'arsenal', 'chelsea', 'manchester', 'london'
    ];

    return commonPasswords.includes(password.toLowerCase());
  }

  /**
   * Estimate password entropy
   */
  calculateEntropy(password: string): number {
    let charset = 0;
    if (/[a-z]/.test(password)) charset += 26;
    if (/[A-Z]/.test(password)) charset += 26;
    if (/[0-9]/.test(password)) charset += 10;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) charset += 32;

    return Math.log2(Math.pow(charset, password.length));
  }

  /**
   * Check for password reuse patterns
   */
  checkPasswordReuse(password: string, existingPasswords: string[]): {
    isReused: boolean;
    similarPasswords: string[];
  } {
    const isReused = existingPasswords.includes(password);
    const similarPasswords = existingPasswords.filter(existing => {
      // Check for similar passwords (edit distance < 3)
      return this.levenshteinDistance(password, existing) < 3 && password !== existing;
    });

    return { isReused, similarPasswords };
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    const n = str2.length;
    const m = str1.length;

    if (n === 0) return m;
    if (m === 0) return n;

    for (let i = 0; i <= n; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= m; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[n][m];
  }
}

export const passwordStrengthService = PasswordStrengthService.getInstance();
