# Firebase Authentication Setup

This project includes a complete Firebase Authentication setup for React Native with Expo.

## Features

✅ Email/Password Authentication
✅ User Registration
✅ Password Reset
✅ Auto-login persistence
✅ Beautiful UI components
✅ TypeScript support

## Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (passnest-2c9e6)
3. Go to **Authentication > Sign-in method**
4. Enable **Email/Password** authentication
5. Optionally enable **Phone** authentication for future use

## Installation Notes

If you encounter "window is not defined" or Firebase Analytics errors:
- The firebase.ts config has been simplified to avoid analytics initialization issues
- Firebase Analytics is not initialized to prevent web compatibility issues
- Only Firebase Auth is initialized, which is what we need for authentication

## Project Structure

```
├── config/
│   └── firebase.ts           # Firebase configuration
├── contexts/
│   └── AuthContext.tsx       # Authentication context
├── services/
│   └── authService.ts        # Authentication service functions
├── components/
│   ├── AuthNavigator.tsx     # Navigation between login/signup
│   ├── LoginScreen.tsx       # Login screen component
│   ├── SignUpScreen.tsx      # Sign up screen component
│   ├── HomeScreen.tsx        # Authenticated user screen
│   └── LoadingScreen.tsx     # Loading component
└── app/
    ├── _layout.tsx           # Root layout with auth provider
    └── index.tsx             # Main app entry point
```

## How to Use

### Start the app:
```bash
npm start
```

### Authentication Flow:
1. App loads and checks for existing authentication
2. If not authenticated, shows login/signup screens
3. If authenticated, shows the home screen
4. Users can sign up, sign in, reset password, and logout

### Code Examples:

#### Check if user is authenticated:
```tsx
import { useAuth } from '../contexts/AuthContext';

const { user, loading } = useAuth();
```

#### Sign in programmatically:
```tsx
import { authService } from '../services/authService';

const result = await authService.signIn(email, password);
if (result.success) {
  // User signed in successfully
}
```

#### Sign out:
```tsx
await authService.signOut();
```

## Phone Authentication (Future Enhancement)

To enable phone authentication, you'll need to:

1. Enable Phone authentication in Firebase Console
2. Install expo-dev-client: `npx expo install expo-dev-client`
3. Add to app.json: `"plugins": ["expo-dev-client"]`
4. Build with EAS: `npx expo run:android` or `npx expo run:ios`

Phone auth requires native code and cannot run in Expo Go.

## Security Notes

- Firebase configuration is in `config/firebase.ts`
- API keys are safe to expose in client-side code for Firebase
- Consider using environment variables for production
- Always validate data on the server side as well

## Troubleshooting

### Common Issues:

#### "window is not defined" error:
- This has been fixed by removing Firebase Analytics initialization
- The config now only initializes Firebase Auth

#### "Unable to resolve firebase/auth":
- Make sure Firebase is installed: `npm install firebase`
- Clear Metro cache: `npx expo start --clear`

#### Authentication not working:
- Ensure Email/Password is enabled in Firebase Console
- Check that your Firebase config keys are correct
- Verify your internet connection

### Debug Steps:
1. Clear Metro cache: `npx expo start --clear`
2. Check Firebase Console for any errors
3. Verify the config in `config/firebase.ts`

## Customization

- Modify styles in each component's StyleSheet
- Add additional auth methods in `authService.ts`
- Customize error messages and validation
- Add user profile management features
