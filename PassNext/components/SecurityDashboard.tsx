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
          <Text style={styles.headerTitle}>Security Insights</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <Ionicons name="shield-checkmark-outline" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.loadingText}>Analyzing security...</Text>
          <Text style={styles.loadingSubtext}>Please wait</Text>
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
        <Text style={styles.headerTitle}>Security Insights</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Security Score */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <Ionicons name="shield-checkmark" size={24} color={scoreColor} />
            <Text style={styles.scoreTitle}>Security Score</Text>
          </View>
          <View style={styles.scoreDisplay}>
            <Text style={[styles.scoreValue, { color: scoreColor }]}>{securityScore}</Text>
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreLabel}>/ 100</Text>
              <Text style={styles.scoreDescription}>
                {securityScore >= 80 ? 'Excellent!' : 
                 securityScore >= 60 ? 'Good' : 
                 'Needs attention'}
              </Text>
            </View>
          </View>
          
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${securityScore}%`, 
                    backgroundColor: scoreColor 
                  }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Security Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Password Health</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(255, 255, 255, 0.06)' }]}>
                  <Ionicons name="key-outline" size={18} color={Colors.text.secondary} />
                </View>
                <Text style={styles.statValue}>{stats?.totalPasswords || 0}</Text>
              </View>
              <Text style={styles.statLabel}>Total</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(52, 168, 83, 0.1)' }]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={Colors.success} />
                </View>
                <Text style={[styles.statValue, { color: Colors.success }]}>{stats?.strongPasswords || 0}</Text>
              </View>
              <Text style={styles.statLabel}>Strong</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(255, 149, 0, 0.1)' }]}>
                  <Ionicons name="warning-outline" size={18} color={Colors.warning} />
                </View>
                <Text style={[styles.statValue, { color: Colors.warning }]}>{stats?.mediumPasswords || 0}</Text>
              </View>
              <Text style={styles.statLabel}>Medium</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
                  <Ionicons name="alert-circle-outline" size={18} color={Colors.error} />
                </View>
                <Text style={[styles.statValue, { color: Colors.error }]}>{stats?.weakPasswords || 0}</Text>
              </View>
              <Text style={styles.statLabel}>Weak</Text>
            </View>
          </View>
        </View>

        {/* Additional Stats */}
        <View style={styles.additionalStats}>
          <Text style={styles.sectionTitle}>Quick Insights</Text>
          
          <View style={styles.insightGrid}>
            <View style={styles.insightCard}>
              <View style={styles.insightIconContainer}>
                <Ionicons name="copy-outline" size={20} color={Colors.text.secondary} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightValue}>
                  {stats?.reusedPasswords || 0}
                </Text>
                <Text style={styles.insightLabel}>Reused</Text>
              </View>
            </View>

            <View style={styles.insightCard}>
              <View style={styles.insightIconContainer}>
                <Ionicons name="resize-outline" size={20} color={Colors.text.secondary} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightValue}>
                  {stats?.averageLength || 0}
                </Text>
                <Text style={styles.insightLabel}>Avg Length</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recommendations */}
        <View style={styles.recommendationsSection}>
          <Text style={styles.sectionTitle}>Security Tips</Text>
          <View style={styles.recommendationsList}>
            {stats?.weakPasswords ? (
              <View style={styles.recommendationItem}>
                <View style={styles.recommendationIcon}>
                  <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                </View>
                <Text style={styles.recommendationText}>
                  Update {stats.weakPasswords} weak password{stats.weakPasswords > 1 ? 's' : ''}
                </Text>
              </View>
            ) : null}
            
            {stats?.reusedPasswords ? (
              <View style={styles.recommendationItem}>
                <View style={styles.recommendationIcon}>
                  <Ionicons name="copy-outline" size={16} color={Colors.warning} />
                </View>
                <Text style={styles.recommendationText}>
                  Make {stats.reusedPasswords} reused password{stats.reusedPasswords > 1 ? 's' : ''} unique
                </Text>
              </View>
            ) : null}

            <View style={styles.recommendationItem}>
              <View style={styles.recommendationIcon}>
                <Ionicons name="shield-checkmark-outline" size={16} color={Colors.success} />
              </View>
              <Text style={styles.recommendationText}>
                Use biometric authentication for extra security
              </Text>
            </View>

            <View style={styles.recommendationItem}>
              <View style={styles.recommendationIcon}>
                <Ionicons name="time-outline" size={16} color={Colors.info} />
              </View>
              <Text style={styles.recommendationText}>
                Update passwords every 3-6 months
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.background,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  scoreCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginLeft: 12,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
  },
  scoreInfo: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    fontSize: 18,
    color: Colors.text.tertiary,
    fontWeight: '400',
  },
  scoreDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '500',
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  statsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
    letterSpacing: -0.2,
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
    flex: 1,
    minWidth: '45%',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
  additionalStats: {
    marginBottom: 24,
  },
  insightGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  insightCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  insightIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  insightLabel: {
    fontSize: 12,
    color: Colors.text.tertiary,
    fontWeight: '500',
  },
  recommendationsSection: {
    marginBottom: 32,
  },
  recommendationsList: {
    gap: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  recommendationIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recommendationText: {
    fontSize: 14,
    color: Colors.text.primary,
    flex: 1,
    lineHeight: 18,
    fontWeight: '400',
  },
  // Legacy styles - keeping for backward compatibility
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
  insightDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
});

export default SecurityDashboard;
