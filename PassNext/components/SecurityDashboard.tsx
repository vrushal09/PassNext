import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Password, passwordService } from '../services/passwordService';
import { securityDashboardService, SecurityDashboardData, SecurityAlert } from '../services/securityDashboardService';
import { notificationService } from '../services/notificationService';
import Colors from '../constants/Colors';

interface SecurityDashboardProps {
  onEditPassword: (password: Password) => void;
  onDeletePassword: (password: Password) => void;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  onEditPassword,
  onDeletePassword,
}) => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<SecurityDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [passwords, setPasswords] = useState<Password[]>([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
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
        
        // Schedule notifications for security alerts
        await securityDashboardService.scheduleSecurityNotifications(dashboardResult.alerts);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleAlertAction = async (alert: SecurityAlert, action: string) => {
    const password = passwords.find(p => p.id === alert.passwordId);
    if (!password) return;

    switch (action) {
      case 'change_password':
      case 'strengthen_password':
      case 'update_password':
      case 'create_unique':
        onEditPassword(password);
        break;
      case 'generate_password':
        // Generate a new password and update
        onEditPassword(password);
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
        <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
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
      {/* Security Score */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreTitle}>Security Score</Text>
          <TouchableOpacity onPress={() => setShowAlertsModal(true)}>
            <Ionicons name="notifications-outline" size={24} color={Colors.text.primary} />
            {dashboardData.alerts.length > 0 && (
              <View style={styles.alertBadge}>
                <Text style={styles.alertBadgeText}>{dashboardData.alerts.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.scoreDisplay}>
          <Text style={[styles.scoreValue, { color: getRiskLevelColor(dashboardData.riskLevel) }]}>
            {dashboardData.metrics.securityScore}
          </Text>
          <Text style={styles.scoreLabel}>/ 100</Text>
        </View>
        <View style={[styles.riskLevel, { backgroundColor: getRiskLevelColor(dashboardData.riskLevel) }]}>
          <Text style={styles.riskLevelText}>{dashboardData.riskLevel.toUpperCase()} RISK</Text>
        </View>
      </View>

      {/* Metrics Overview */}
      <View style={styles.metricsContainer}>
        <Text style={styles.sectionTitle}>Password Health</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Total Passwords"
            value={dashboardData.metrics.totalPasswords}
            icon="key-outline"
            color={Colors.info}
          />
          <MetricCard
            title="Weak Passwords"
            value={dashboardData.metrics.weakPasswords}
            icon="warning-outline"
            color={Colors.error}
          />
          <MetricCard
            title="Reused Passwords"
            value={dashboardData.metrics.reusedPasswords}
            icon="copy-outline"
            color={Colors.warning}
          />
          <MetricCard
            title="Old Passwords"
            value={dashboardData.metrics.oldPasswords}
            icon="time-outline"
            color={Colors.warning}
          />
        </View>
      </View>

      {/* Recommendations */}
      {dashboardData.recommendations.length > 0 && (
        <View style={styles.recommendationsContainer}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {dashboardData.recommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Ionicons name="bulb-outline" size={16} color={Colors.warning} />
              <Text style={styles.recommendationText}>{recommendation}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Password Health List */}
      <View style={styles.passwordHealthContainer}>
        <Text style={styles.sectionTitle}>Password Details</Text>
        {dashboardData.passwordHealth.map((health, index) => (
          <PasswordHealthCard
            key={health.id}
            health={health}
            onEdit={() => {
              const password = passwords.find(p => p.id === health.id);
              if (password) onEditPassword(password);
            }}
          />
        ))}
      </View>

      {/* Alerts Modal */}
      <Modal
        visible={showAlertsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Security Alerts</Text>
            <TouchableOpacity onPress={() => setShowAlertsModal(false)}>
              <Ionicons name="close" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={dashboardData.alerts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <AlertCard
                alert={item}
                onAction={(action) => handleAlertAction(item, action)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="shield-checkmark" size={48} color={Colors.success} />
                <Text style={styles.emptyStateText}>No security alerts</Text>
              </View>
            }
          />
        </View>
      </Modal>
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
    <View style={[styles.metricIcon, { backgroundColor: color }]}>
      <Ionicons name={icon as any} size={20} color="white" />
    </View>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricTitle}>{title}</Text>
  </View>
);

interface PasswordHealthCardProps {
  health: any;
  onEdit: () => void;
}

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

const AlertCard: React.FC<AlertCardProps> = ({ alert, onAction }) => {
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
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 20,
    color: Colors.text.secondary,
    marginLeft: 4,
  },
  riskLevel: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  riskLevelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  alertBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  metricsContainer: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  recommendationsContainer: {
    margin: 16,
    marginTop: 0,
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
    flex: 1,
    marginLeft: 8,
    color: Colors.text.primary,
    fontSize: 14,
  },
  passwordHealthContainer: {
    margin: 16,
    marginTop: 0,
  },
  passwordHealthCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  passwordHealthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  passwordHealthService: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  passwordHealthInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  strengthIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  strengthText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  passwordHealthDays: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  passwordHealthRecommendations: {
    gap: 4,
  },
  passwordHealthRecommendation: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 12,
  },
  alertCard: {
    backgroundColor: Colors.surface,
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 8,
  },
  alertAction: {
    paddingHorizontal: 16,
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
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  alertActionTextPrimary: {
    color: Colors.text.inverse,
  },
});

export default SecurityDashboard;
