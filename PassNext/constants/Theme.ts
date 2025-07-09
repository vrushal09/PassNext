/**
 * Theme utilities for PassNext app
 * Updated for dark theme design
 */

import Colors from './Colors';

export interface Theme {
  colors: typeof Colors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    sizes: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    weights: {
      normal: '400';
      medium: '500';
      semibold: '600';
      bold: '700';
    };
  };
  // Add form-specific styling
  form: {
    inputHeight: number;
    inputPadding: number;
    buttonHeight: number;
    buttonRadius: number;
  };
}

export const theme: Theme = {
  colors: Colors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  // Form styling to match the new design
  form: {
    inputHeight: 56,        // Height for input fields
    inputPadding: 16,       // Padding inside input fields
    buttonHeight: 48,       // Height for buttons
    buttonRadius: 24,       // Rounded corners for buttons
  },
};

export default theme;
