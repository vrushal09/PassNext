/**
 * Color constants for PassNext app
 * Main color palette based on purple theme
 */

export const Colors = {
  // Primary brand colors (Updated to match new design)
  primary: '#2563EB',      // Bright Blue (for primary actions)
  primaryLight: '#3B82F6',  // Lighter blue
  primaryDark: '#1D4ED8',   // Darker blue
  
  // UI Colors (Dark theme)
  background: '#0C0C0C',    // Deep Black
  surface: '#1A1A1A',      // Dark Gray (for input fields)
  border: '#E5E5E5',       // Icon stroke color
  divider: '#2A2A2A',      // Subtle divider
  
  // Text colors (Dark theme)
  text: {
    primary: '#FFFFFF',     // White text
    secondary: '#A3A3A3',   // Light Gray for placeholders/subtext
    tertiary: '#6B7280',    // Muted text
    inverse: '#0C0C0C',     // Dark text on light backgrounds
  },
  
  // Semantic colors
  success: '#34A853',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#1A73E8',
  
  // Interactive elements (Updated for dark theme)
  button: {
    primary: '#2563EB',     // Bright Blue for primary buttons
    secondary: '#1A1A1A',   // Dark Gray for secondary buttons
    disabled: '#6B7280',    // Disabled state
  },
  
  // Input fields (Dark theme)
  input: {
    background: '#1A1A1A',  // Dark Gray background
    border: '#E5E5E5',      // Light border
    focused: '#2563EB',     // Bright Blue when focused
    placeholder: '#A3A3A3', // Light Gray for placeholders
  },
  
  // Navigation (Dark theme)
  nav: {
    active: '#2563EB',      // Bright Blue for active state
    inactive: '#A3A3A3',    // Light Gray for inactive
    background: '#0C0C0C',  // Deep Black background
    border: '#E5E5E5',      // Light border
  },
  
  // Status colors
  online: '#34A853',
  offline: '#6B7280',     // Updated to match dark theme
  
  // Shadows (Dark theme)
  shadow: '#000000',
  
  // Additional colors for the new design
  icon: {
    stroke: '#E5E5E5',    // Icon stroke color
    fill: '#FFFFFF',      // Icon fill color
  },
} as const;

// Theme variants
export const DarkTheme = Colors;  // Changed to DarkTheme since we're using dark colors
export const LightTheme = {
  ...Colors,
  // Override for light theme if needed in the future
  background: '#FFFFFF',
  surface: '#F8F9FA',
  text: {
    primary: '#0C0C0C',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
  },
};

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
