import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Colors from '../constants/Colors';
import { PasswordStrengthIndicator, passwordStrengthService } from '../services/passwordStrengthService';

interface PasswordStrengthMeterProps {
  password: string;
  userInputs?: string[];
  showSuggestions?: boolean;
  style?: any;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  userInputs = [],
  showSuggestions = false,
  style,
}) => {
  const [animatedValue] = React.useState(new Animated.Value(0));
  const [strength, setStrength] = React.useState<PasswordStrengthIndicator>({
    score: 0,
    level: 'very-weak',
    color: '#FF4444',
    text: 'Very Weak',
    percentage: 0,
  });

  React.useEffect(() => {
    if (password) {
      const newStrength = passwordStrengthService.getPasswordStrengthIndicator(password, userInputs);
      setStrength(newStrength);
      
      // Animate the strength meter
      Animated.timing(animatedValue, {
        toValue: newStrength.percentage,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      setStrength({
        score: 0,
        level: 'very-weak',
        color: '#FF4444',
        text: 'Very Weak',
        percentage: 0,
      });
      animatedValue.setValue(0);
    }
  }, [password, userInputs]);

  const suggestions = React.useMemo(() => {
    if (!password || !showSuggestions) return [];
    return passwordStrengthService.getPasswordSuggestions(password, userInputs);
  }, [password, userInputs, showSuggestions]);

  const requirements = React.useMemo(() => {
    if (!password) return null;
    return passwordStrengthService.meetsMinimumRequirements(password);
  }, [password]);

  if (!password) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      {/* Strength Meter */}
      <View style={styles.meterContainer}>
        <Text style={styles.label}>Password Strength</Text>
        <View style={styles.meterTrack}>
          <Animated.View
            style={[
              styles.meterFill,
              {
                backgroundColor: strength.color,
                width: animatedValue.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <View style={styles.strengthInfo}>
          <Text style={[styles.strengthText, { color: strength.color }]}>
            {strength.text}
          </Text>
          <Text style={styles.scoreText}>
            {strength.score}/4
          </Text>
        </View>
      </View>

      {/* Strength Indicators */}
      <View style={styles.indicatorsContainer}>
        {[0, 1, 2, 3, 4].map((level) => (
          <View
            key={level}
            style={[
              styles.indicator,
              {
                backgroundColor: level <= strength.score ? strength.color : Colors.border,
                opacity: level <= strength.score ? 1 : 0.4,
              },
            ]}
          />
        ))}
      </View>

      {/* Requirements Checklist */}
      {requirements && (
        <View style={styles.requirementsContainer}>
          <Text style={styles.requirementsTitle}>Requirements</Text>
          <View style={styles.requirementsList}>
            <RequirementItem
              text="At least 8 characters"
              met={requirements.requirements.length}
            />
            <RequirementItem
              text="Contains uppercase letter"
              met={requirements.requirements.uppercase}
            />
            <RequirementItem
              text="Contains lowercase letter"
              met={requirements.requirements.lowercase}
            />
            <RequirementItem
              text="Contains number"
              met={requirements.requirements.numbers}
            />
            <RequirementItem
              text="Contains special character"
              met={requirements.requirements.symbols}
            />
          </View>
        </View>
      )}

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Suggestions</Text>
          {suggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionItem}>
              <Text style={styles.suggestionBullet}>•</Text>
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

interface RequirementItemProps {
  text: string;
  met: boolean;
}

const RequirementItem: React.FC<RequirementItemProps> = ({ text, met }) => (
  <View style={styles.requirementItem}>
    <View style={[styles.requirementIcon, { backgroundColor: met ? Colors.success : Colors.error }]}>
      <Text style={styles.requirementIconText}>{met ? '✓' : '✗'}</Text>
    </View>
    <Text style={[styles.requirementText, { color: met ? Colors.success : Colors.text.secondary }]}>
      {text}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  meterContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  meterTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  strengthText: {
    fontSize: 15,
    fontWeight: '600',
  },
  scoreText: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  indicatorsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
  },
  indicator: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  requirementsContainer: {
    marginTop: 16,
  },
  requirementsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  requirementsList: {
    gap: 10,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requirementIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requirementIconText: {
    fontSize: 11,
    color: 'white',
    fontWeight: 'bold',
  },
  requirementText: {
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  suggestionsContainer: {
    marginTop: 16,
    backgroundColor: Colors.warning + '10',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warning + '20',
  },
  suggestionsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.warning,
    marginBottom: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  suggestionBullet: {
    fontSize: 14,
    color: Colors.warning,
    marginTop: 2,
    fontWeight: '600',
  },
  suggestionText: {
    fontSize: 14,
    color: Colors.text.primary,
    flex: 1,
    lineHeight: 20,
  },
});

export default PasswordStrengthMeter;
