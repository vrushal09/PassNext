import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Colors from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { Password, passwordService } from '../services/passwordService';
import { passwordStrengthService } from '../services/passwordStrengthService';

interface SecurityDashboardProps {
  onClose: () => void;
}

interface SecurityStats {
  totalPasswords: number;
  strongPasswords: number;
  mediumPasswords: number;
  weakPasswords: number;
  reusedPasswords: number;
  averageLength: number;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadSecurityData();
    }
  }, [user]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      if (!user) return;
      
      const passwordsResult = await passwordService.getPasswords(user.uid);
      if (passwordsResult.success && passwordsResult.passwords) {
        setPasswords(passwordsResult.passwords);
        calculateSecurityStats(passwordsResult.passwords);
      }
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSecurityStats = (passwordList: Password[]) => {
    if (passwordList.length === 0) {
      setStats({
        totalPasswords: 0,
        strongPasswords: 0,
        mediumPasswords: 0,
        weakPasswords: 0,
        reusedPasswords: 0,
        averageLength: 0,
      });
      return;
    }

    let strongCount = 0;
    let mediumCount = 0;
    let weakCount = 0;
    let totalLength = 0;
    const passwordCounts = new Map<string, number>();

    passwordList.forEach(password => {
      const strength = passwordStrengthService.getPasswordStrengthIndicator(password.password);
      
      if (strength.score >= 4) strongCount++;
      else if (strength.score >= 2) mediumCount++;
      else weakCount++;

      totalLength += password.password.length;

      // Count password reuse
      const count = passwordCounts.get(password.password) || 0;
      passwordCounts.set(password.password, count + 1);
    });

    const reusedCount = Array.from(passwordCounts.values()).filter(count => count > 1).length;

    setStats({
      totalPasswords: passwordList.length,
      strongPasswords: strongCount,
      mediumPasswords: mediumCount,
      weakPasswords: weakCount,
      reusedPasswords: reusedCount,
      averageLength: Math.round(totalLength / passwordList.length),
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSecurityData();
    setRefreshing(false);
  };

  const getSecurityScore = () => {
    if (!stats || stats.totalPasswords === 0) return 0;
    
    const strongWeight = 40;
    const mediumWeight = 25;
    const weakPenalty = 20;
    const reusedPenalty = 15;

    let score = (stats.strongPasswords / stats.totalPasswords) * strongWeight +
                (stats.mediumPasswords / stats.totalPasswords) * mediumWeight;
    
    score -= (stats.weakPasswords / stats.totalPasswords) * weakPenalty;
    score -= (stats.reusedPasswords / stats.totalPasswords) * reusedPenalty;

    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return Colors.success;
    if (score >= 60) return Colors.warning;
    return Colors.error;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Security Analytics</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Analyzing your password security...</Text>
        </View>
      </View>
    );
  }

  const securityScore = getSecurityScore();
  const scoreColor = getScoreColor(securityScore);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Security Analytics</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Security Score */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreTitle}>Overall Security Score</Text>
          <View style={styles.scoreDisplay}>
            <Text style={[styles.scoreValue, { color: scoreColor }]}>{securityScore}</Text>
            <Text style={styles.scoreLabel}>/ 100</Text>
          </View>
          <Text style={styles.scoreDescription}>
            {securityScore >= 80 ? 'Excellent security!' : 
             securityScore >= 60 ? 'Good security, room for improvement' : 
             'Security needs attention'}
          </Text>
        </View>

        {/* Security Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Password Breakdown</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: Colors.primary + '15' }]}>
                <Ionicons name="key" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.statValue}>{stats?.totalPasswords || 0}</Text>
              <Text style={styles.statLabel}>Total Passwords</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: Colors.success + '15' }]}>
                <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
              </View>
              <Text style={[styles.statValue, { color: Colors.success }]}>{stats?.strongPasswords || 0}</Text>
              <Text style={styles.statLabel}>Strong</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: Colors.warning + '15' }]}>
                <Ionicons name="warning" size={20} color={Colors.warning} />
              </View>
              <Text style={[styles.statValue, { color: Colors.warning }]}>{stats?.mediumPasswords || 0}</Text>
              <Text style={styles.statLabel}>Medium</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: Colors.error + '15' }]}>
                <Ionicons name="alert-circle" size={20} color={Colors.error} />
              </View>
              <Text style={[styles.statValue, { color: Colors.error }]}>{stats?.weakPasswords || 0}</Text>
              <Text style={styles.statLabel}>Weak</Text>
            </View>
          </View>
        </View>

        {/* Additional Stats */}
        <View style={styles.additionalStats}>
          <Text style={styles.sectionTitle}>Additional Insights</Text>
          
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Ionicons name="copy" size={20} color={Colors.text.secondary} />
              <Text style={styles.insightTitle}>Password Reuse</Text>
            </View>
            <Text style={styles.insightValue}>
              {stats?.reusedPasswords || 0} passwords are reused
            </Text>
            <Text style={styles.insightDescription}>
              {stats?.reusedPasswords === 0 ? 
                'Great! No passwords are reused.' : 
                'Consider creating unique passwords for each account.'}
            </Text>
          </View>

          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Ionicons name="resize" size={20} color={Colors.text.secondary} />
              <Text style={styles.insightTitle}>Average Length</Text>
            </View>
            <Text style={styles.insightValue}>
              {stats?.averageLength || 0} characters
            </Text>
            <Text style={styles.insightDescription}>
              {(stats?.averageLength || 0) >= 12 ? 
                'Good password length!' : 
                'Consider using longer passwords (12+ characters).'}
            </Text>
          </View>
        </View>

        {/* Recommendations */}
        <View style={styles.recommendationsSection}>
          <Text style={styles.sectionTitle}>Security Recommendations</Text>
          <View style={styles.recommendationsList}>
            {stats?.weakPasswords ? (
              <View style={styles.recommendationItem}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                <Text style={styles.recommendationText}>
                  Update {stats.weakPasswords} weak password{stats.weakPasswords > 1 ? 's' : ''}
                </Text>
              </View>
            ) : null}
            
            {stats?.reusedPasswords ? (
              <View style={styles.recommendationItem}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                <Text style={styles.recommendationText}>
                  Create unique passwords for {stats.reusedPasswords} reused password{stats.reusedPasswords > 1 ? 's' : ''}
                </Text>
              </View>
            ) : null}

            <View style={styles.recommendationItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
              <Text style={styles.recommendationText}>
                Enable biometric authentication for extra security
              </Text>
            </View>

            <View style={styles.recommendationItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
              <Text style={styles.recommendationText}>
                Regularly update your passwords every 3-6 months
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  scoreCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: 20,
    color: Colors.text.tertiary,
    marginLeft: 4,
  },
  scoreDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  statsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  additionalStats: {
    marginBottom: 24,
  },
  insightCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginLeft: 8,
  },
  insightValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  recommendationsSection: {
    marginBottom: 24,
  },
  recommendationsList: {
    gap: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  recommendationText: {
    fontSize: 14,
    color: Colors.text.primary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});

export default SecurityDashboard;
