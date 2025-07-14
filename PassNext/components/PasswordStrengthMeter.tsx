import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { passwordStrengthService, PasswordStrengthIndicator } from '../services/passwordStrengthService';
import Colors from '../constants/Colors';

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
                backgroundColor: level <= strength.score ? strength.color : '#E0E0E0',
                opacity: level <= strength.score ? 1 : 0.3,
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
    <View style={[styles.requirementIcon, { backgroundColor: met ? '#00CC44' : '#FF4444' }]}>
      <Text style={styles.requirementIconText}>{met ? '✓' : '✗'}</Text>
    </View>
    <Text style={[styles.requirementText, { color: met ? '#00CC44' : '#666' }]}>
      {text}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  meterContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  meterTrack: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 4,
  },
  strengthInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  strengthText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  indicatorsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 16,
  },
  indicator: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  requirementsContainer: {
    marginTop: 12,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  requirementsList: {
    gap: 6,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requirementIconText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  requirementText: {
    fontSize: 12,
    flex: 1,
  },
  suggestionsContainer: {
    marginTop: 12,
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57C00',
    marginBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 4,
  },
  suggestionBullet: {
    fontSize: 12,
    color: '#F57C00',
    marginTop: 2,
  },
  suggestionText: {
    fontSize: 12,
    color: '#E65100',
    flex: 1,
    lineHeight: 16,
  },
});

export default PasswordStrengthMeter;
