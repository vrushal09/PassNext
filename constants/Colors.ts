/**
 * Color constants for PassNext app
 * Main color palette based on purple theme
 */

export const Colors = {
  // Primary brand colors
  primary: '#511E8D',      // Main purple
  primaryLight: '#954CCF',  // Lighter purple
  primaryDark: '#8043B1',   // Medium purple
  
  // UI Colors
  background: '#FFFFFF',
  surface: '#F8F9FA',
  border: '#E8EAED',
  divider: '#F0F0F0',
  
  // Text colors
  text: {
    primary: '#3C4043',
    secondary: '#5F6368',
    tertiary: '#9AA0A6',
    inverse: '#FFFFFF',
  },
  
  // Semantic colors
  success: '#34A853',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#1A73E8',
  
  // Interactive elements
  button: {
    primary: '#511E8D',
    secondary: '#954CCF',
    disabled: '#9AA0A6',
  },
  
  // Input fields
  input: {
    background: '#F8F9FA',
    border: '#E8EAED',
    focused: '#511E8D',
    placeholder: '#9AA0A6',
  },
  
  // Navigation
  nav: {
    active: '#511E8D',
    inactive: '#5F6368',
    background: '#FFFFFF',
    border: '#E8EAED',
  },
  
  // Status colors
  online: '#34A853',
  offline: '#9AA0A6',
  
  // Shadows
  shadow: '#000000',
} as const;

// Theme variants
export const LightTheme = Colors;

// Helper function to get color with opacity
export const getColorWithOpacity = (color: string, opacity: number): string => {
  // Remove # if present
  const hex = color.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default Colors;
