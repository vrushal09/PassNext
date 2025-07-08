import React, { useState } from 'react';
import { LoginScreen } from './LoginScreen';
import { SignUpScreen } from './SignUpScreen';

export const AuthNavigator: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  if (isLogin) {
    return (
      <LoginScreen onNavigateToSignUp={() => setIsLogin(false)} />
    );
  }

  return (
    <SignUpScreen onNavigateToLogin={() => setIsLogin(true)} />
  );
};
