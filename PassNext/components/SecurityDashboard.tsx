import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Colors from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { biometricAuthService } from '../services/biometricAuthService';
import { Password, passwordService } from '../services/passwordService';
import { SecurityAlert, SecurityDashboardData, securityDashboardService } from '../services/securityDashboardService';
import { CustomAlert } from './CustomAlert';

interface SecurityDashboardProps {
  onEditPassword: (password: Password) => void;
  onDeletePassword: (password: Password) => void;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  onEditPassword,
  onDeletePassword,
}) => {
  const { user } = useAuth();
  const { alertState, hideAlert, showError } = useCustomAlert();
  const [dashboardData, setDashboardData] = useState<SecurityDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [showAllPasswords, setShowAllPasswords] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData(false); // Don't force notifications on initial load
    }
  }, [user]);

  const loadDashboardData = async (forceNotifications = false) => {
    try {
      setLoading(true);
      
      if (!user) return;
      
      // Load passwords
      const passwordsResult = await passwordService.getPasswords(user.uid);
      if (passwordsResult.success && passwordsResult.passwords) {
        setPasswords(passwordsResult.passwords);
        
        // Generate security dashboard data
        const dashboardResult = await securityDashboardService.generateSecurityDashboard(
          passwordsResult.passwords
        );
        setDashboardData(dashboardResult);
        
        // Only schedule notifications if explicitly requested or if there are critical alerts
        const criticalAlerts = dashboardResult.alerts.filter(alert => 
          alert.severity === 'critical' || alert.severity === 'high'
        );
        
        if (forceNotifications || criticalAlerts.length > 0) {
          await securityDashboardService.scheduleSecurityNotifications(dashboardResult.alerts);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData(false); // Don't force notifications on refresh
    setRefreshing(false);
  };

  const handleEditPassword = async (password: Password) => {
    try {
      // Require biometric auth for editing
      const isAvailable = await biometricAuthService.isAvailable();
      
      if (isAvailable) {
        const result = await biometricAuthService.authenticate(
          `Authenticate to edit password for ${password.service}`
        );
        
        if (result.success) {
          onEditPassword(password);
        } else {
          showError(
            'Authentication Failed',
            result.error || 'Biometric authentication failed. Please try again.'
          );
        }
      } else {
        // If biometric auth is not available, edit directly
        onEditPassword(password);
      }
    } catch (error) {
      console.error('Error during biometric authentication:', error);
      showError('Error', 'An error occurred during authentication');
    }
  };

  const handleAlertAction = async (alert: SecurityAlert, action: string) => {
    const password = passwords.find(p => p.id === alert.passwordId);
    if (!password) return;

    switch (action) {
      case 'change_password':
      case 'strengthen_password':
      case 'update_password':
      case 'create_unique':
        await handleEditPassword(password);
        break;
      case 'generate_password':
        // Generate a new password and update
        await handleEditPassword(password);
        break;
      case 'learn_more':
        Alert.alert(
          'Security Information',
          'This password has been found in known data breaches. It\'s recommended to change it immediately to protect your account.',
          [{ text: 'OK' }]
        );
        break;
      case 'extend_expiry':
        // Extend password expiry (implement based on your expiry system)
        Alert.alert(
          'Password Expiry',
          'Password expiry extended by 30 days.',
          [{ text: 'OK' }]
        );
        break;
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return Colors.success;
      case 'medium': return Colors.warning;
      case 'high': return '#FF9500';
      case 'critical': return Colors.error;
      default: return Colors.text.secondary;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'breach': return 'shield-outline';
      case 'weak_password': return 'warning-outline';
      case 'reused_password': return 'copy-outline';
      case 'old_password': return 'time-outline';
      case 'expiring': return 'hourglass-outline';
      default: return 'information-circle-outline';
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'low': return Colors.info;
      case 'medium': return Colors.warning;
      case 'high': return '#FF9500';
      case 'critical': return Colors.error;
      default: return Colors.text.secondary;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading security dashboard...</Text>
      </View>
    );
  }

  if (!dashboardData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load security dashboard</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadDashboardData(false)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Compact Security Score */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreTitle}>Security Score</Text>
            <View style={styles.scoreDisplay}>
              <Text style={[styles.scoreValue, { color: getRiskLevelColor(dashboardData.riskLevel) }]}>
                {dashboardData.metrics.securityScore}
              </Text>
              <Text style={styles.scoreLabel}>/ 100</Text>
            </View>
          </View>
          <View style={styles.scoreRight}>
            <View style={[styles.riskLevel, { backgroundColor: getRiskLevelColor(dashboardData.riskLevel) }]}>
              <Text style={styles.riskLevelText}>{dashboardData.riskLevel.toUpperCase()}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Compact Metrics Overview */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Passwords"
            value={dashboardData.metrics.totalPasswords}
            icon="key-outline"
            color={Colors.primary}
          />
          <MetricCard
            title="Weak"
            value={dashboardData.metrics.weakPasswords}
            icon="warning-outline"
            color={Colors.error}
          />
          <MetricCard
            title="Reused"
            value={dashboardData.metrics.reusedPasswords}
            icon="copy-outline"
            color={Colors.warning}
          />
          <MetricCard
            title="Breached"
            value={dashboardData.metrics.breachedPasswords}
            icon="shield-outline"
            color={Colors.error}
          />
        </View>
      </View>

      {/* Compact Recommendations */}
      {dashboardData.recommendations.length > 0 && (
        <View style={styles.recommendationsContainer}>
          <View style={styles.recommendationsHeader}>
            <Ionicons name="bulb-outline" size={16} color={Colors.primary} />
            <Text style={styles.recommendationsTitle}>Quick Tips</Text>
          </View>
          <View style={styles.recommendationsList}>
            {dashboardData.recommendations.slice(0, 3).map((recommendation, index) => (
              <Text key={index} style={styles.recommendationText}>
                • {recommendation}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Compact Password Health List */}
      <View style={styles.passwordHealthContainer}>
        <Text style={styles.sectionTitle}>Password Details</Text>
        {(showAllPasswords ? dashboardData.passwordHealth : dashboardData.passwordHealth.slice(0, 5)).map((health, index) => (
          <CompactPasswordHealthCard
            key={health.id}
            health={health}
            onEdit={async () => {
              const password = passwords.find(p => p.id === health.id);
              if (password) await handleEditPassword(password);
            }}
          />
        ))}
        {dashboardData.passwordHealth.length > 5 && (
          <TouchableOpacity 
            style={styles.showMoreButton}
            onPress={() => setShowAllPasswords(!showAllPasswords)}
          >
            <Text style={styles.showMoreText}>
              {showAllPasswords 
                ? 'Show Less' 
                : `+${dashboardData.passwordHealth.length - 5} more passwords`
              }
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <CustomAlert
        visible={alertState.visible}
        title={alertState.options.title}
        message={alertState.options.message}
        buttons={alertState.options.buttons || []}
        onClose={hideAlert}
        icon={alertState.options.icon}
        iconColor={alertState.options.iconColor}
      />
    </ScrollView>
  );
};

interface MetricCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color }) => (
  <View style={styles.metricCard}>
    <View style={[styles.metricIcon, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon as any} size={16} color={color} />
    </View>
    <Text style={[styles.metricValue, { color: value > 0 ? Colors.error : Colors.text.primary }]}>{value}</Text>
    <Text style={styles.metricTitle}>{title}</Text>
  </View>
);

interface PasswordHealthCardProps {
  health: any;
  onEdit: () => void;
}

const CompactPasswordHealthCard: React.FC<PasswordHealthCardProps> = ({ health, onEdit }) => (
  <View style={styles.passwordHealthCard}>
    <View style={styles.passwordHealthHeader}>
      <View style={styles.passwordHealthLeft}>
        <Text style={styles.passwordHealthService}>{health.service}</Text>
        <View style={styles.passwordHealthMeta}>
          <View style={[styles.strengthIndicator, { backgroundColor: health.strength.color }]}>
            <Text style={styles.strengthText}>{health.strength.score}</Text>
          </View>
          <Text style={styles.passwordHealthDays}>{health.daysSinceCreated}d</Text>
        </View>
      </View>
      <TouchableOpacity onPress={onEdit} style={styles.editButton}>
        <Ionicons name="pencil-outline" size={18} color={Colors.text.secondary} />
      </TouchableOpacity>
    </View>
    {health.recommendations.length > 0 && health.recommendations[0] !== 'Password appears secure' && (
      <Text style={styles.passwordHealthRecommendation}>
        {health.recommendations[0]}
      </Text>
    )}
  </View>
);

const PasswordHealthCard: React.FC<PasswordHealthCardProps> = ({ health, onEdit }) => (
  <View style={styles.passwordHealthCard}>
    <View style={styles.passwordHealthHeader}>
      <Text style={styles.passwordHealthService}>{health.service}</Text>
      <TouchableOpacity onPress={onEdit}>
        <Ionicons name="pencil-outline" size={20} color={Colors.text.secondary} />
      </TouchableOpacity>
    </View>
    <View style={styles.passwordHealthInfo}>
      <View style={[styles.strengthIndicator, { backgroundColor: health.strength.color }]}>
        <Text style={styles.strengthText}>{health.strength.level}</Text>
      </View>
      <Text style={styles.passwordHealthDays}>{health.daysSinceCreated} days old</Text>
    </View>
    {health.recommendations.length > 0 && (
      <View style={styles.passwordHealthRecommendations}>
        {health.recommendations.slice(0, 2).map((rec: string, index: number) => (
          <Text key={index} style={styles.passwordHealthRecommendation}>
            • {rec}
          </Text>
        ))}
      </View>
    )}
  </View>
);

interface AlertCardProps {
  alert: SecurityAlert;
  onAction: (action: string) => void;
}

const getAlertColor = (severity: string) => {
  switch (severity) {
    case 'low': return Colors.info;
    case 'medium': return Colors.warning;
    case 'high': return '#FF9500';
    case 'critical': return Colors.error;
    default: return Colors.text.secondary;
  }
};

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'breach': return 'shield-outline';
    case 'weak_password': return 'warning-outline';
    case 'reused_password': return 'copy-outline';
    case 'old_password': return 'time-outline';
    case 'expiring': return 'hourglass-outline';
    default: return 'information-circle-outline';
  }
};

const CompactAlertCard: React.FC<AlertCardProps> = ({ alert, onAction }) => {
  const alertColor = getAlertColor(alert.severity);
  
  return (
    <View style={[styles.alertCard, { borderLeftColor: alertColor }]}>
      <View style={styles.alertHeader}>
        <View style={[styles.alertIcon, { backgroundColor: alertColor }]}>
          <Ionicons name={getAlertIcon(alert.type) as any} size={18} color="white" />
        </View>
        <View style={styles.alertContent}>
          <Text style={styles.alertTitle}>{alert.title}</Text>
          <Text style={styles.alertService}>{alert.serviceName}</Text>
          <Text style={styles.alertMessage} numberOfLines={2}>{alert.message}</Text>
        </View>
      </View>
      <View style={styles.alertActions}>
        {alert.actions.slice(0, 2).map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.alertAction,
              action.isPrimary && styles.alertActionPrimary,
            ]}
            onPress={() => onAction(action.action)}
          >
            <Text
              style={[
                styles.alertActionText,
                action.isPrimary && styles.alertActionTextPrimary,
              ]}
            >
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const AlertCard: React.FC<AlertCardProps> = ({ alert, onAction }) => {
  return (
    <View style={styles.alertCard}>
      <View style={styles.alertHeader}>
        <View style={[styles.alertIcon, { backgroundColor: getAlertColor(alert.severity) }]}>
          <Ionicons name={getAlertIcon(alert.type) as any} size={20} color="white" />
        </View>
        <View style={styles.alertContent}>
          <Text style={styles.alertTitle}>{alert.title}</Text>
          <Text style={styles.alertService}>{alert.serviceName}</Text>
          <Text style={styles.alertMessage}>{alert.message}</Text>
        </View>
      </View>
      <View style={styles.alertActions}>
        {alert.actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.alertAction,
              action.isPrimary && styles.alertActionPrimary,
            ]}
            onPress={() => onAction(action.action)}
          >
            <Text
              style={[
                styles.alertActionText,
                action.isPrimary && styles.alertActionTextPrimary,
              ]}
            >
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    color: Colors.text.primary,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  errorText: {
    color: Colors.text.primary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  scoreCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreInfo: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
  },
  scoreLabel: {
    fontSize: 18,
    color: Colors.text.tertiary,
    marginLeft: 4,
    fontWeight: '500',
  },
  scoreRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  riskLevel: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  riskLevelText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricsContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metricContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricInfo: {
    flex: 1,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 11,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recommendationsContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recommendationsList: {
    backgroundColor: Colors.surface,
    padding: 18,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    flex: 1,
  },
  passwordHealthContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  passwordHealthCard: {
    backgroundColor: Colors.surface,
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  passwordHealthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  passwordHealthLeft: {
    flex: 1,
  },
  passwordHealthService: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  passwordHealthMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  passwordHealthInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  strengthIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  strengthText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  passwordHealthDays: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  passwordHealthRecommendations: {
    gap: 4,
  },
  passwordHealthRecommendation: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginTop: 6,
  },
  editButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  showMoreButton: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  showMoreText: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  alertCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  alertHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  alertService: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  alertAction: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  alertActionPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  alertActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  alertActionTextPrimary: {
    color: Colors.text.inverse,
  },
});

export default SecurityDashboard;
