# Firebase Authentication Setup

This project includes a complete Firebase Authentication setup for React Native with Expo.

## Features

✅ Email/Password Authentication
✅ User Registration
✅ Password Reset
✅ Auto-login persistence
✅ **Biometric Authentication (Fingerprint/Face ID)**
✅ **Password Manager with CRUD Operations**
✅ Beautiful UI components
✅ TypeScript support

## Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (passnest-2c9e6)
3. Go to **Authentication > Sign-in method**
4. Enable **Email/Password** authentication
5. Go to **Firestore Database** and create a database in production mode
6. Create required indexes (see Firestore Index Setup section below)
7. Optionally enable **Phone** authentication for future use

## Installation Notes

If you encounter "window is not defined" or Firebase Analytics errors:
- The firebase.ts config has been simplified to avoid analytics initialization issues
- Firebase Analytics is not initialized to prevent web compatibility issues
- Only Firebase Auth is initialized, which is what we need for authentication

## Project Structure

```
├── config/
│   └── firebase.ts                    # Firebase configuration
├── contexts/
│   ├── AuthContext.tsx               # Authentication context
│   └── BiometricAuthContext.tsx      # Biometric authentication context
├── services/
│   ├── authService.ts                # Authentication service functions
│   ├── biometricAuthService.ts       # Biometric authentication service
│   └── passwordService.ts            # Password CRUD operations service
├── components/
│   ├── AuthNavigator.tsx             # Navigation between login/signup
│   ├── LoginScreen.tsx               # Login screen component
│   ├── SignUpScreen.tsx              # Sign up screen component
│   ├── HomeScreen.tsx                # Authenticated user screen with password manager
│   ├── BiometricAuthScreen.tsx       # Biometric authentication screen
│   ├── LoadingScreen.tsx             # Loading component
│   ├── AddPasswordModal.tsx          # Modal for adding new passwords
│   ├── EditPasswordModal.tsx         # Modal for editing existing passwords
│   └── PasswordItem.tsx              # Individual password display component
└── app/
    ├── _layout.tsx                   # Root layout with auth providers
    └── index.tsx                     # Main app entry point
```

## How to Use

### Start the app:
```bash
npm start
```

### Authentication Flow:
1. App loads and checks for existing authentication
2. If not authenticated, shows login/signup screens
3. If authenticated, checks for biometric authentication requirement
4. If biometric auth is enabled but not completed, shows biometric auth screen
5. Once all authentication is satisfied, shows the home screen with password manager
6. Users can sign up, sign in, reset password, enable/disable biometric auth, manage passwords, and logout

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

#### Enable/Disable Biometric Authentication:
```tsx
import { useBiometricAuth } from '../contexts/BiometricAuthContext';

const { isBiometricEnabled, setBiometricEnabled } = useBiometricAuth();

// Enable biometric auth
setBiometricEnabled(true);

// Disable biometric auth
setBiometricEnabled(false);
```

#### Check biometric availability:
```tsx
import { biometricAuthService } from '../services/biometricAuthService';

const isAvailable = await biometricAuthService.isAvailable();
const authTypes = await biometricAuthService.getAvailableTypes();
```

#### Manage Passwords:
```tsx
import { passwordService } from '../services/passwordService';

// Create a new password
const result = await passwordService.createPassword(userId, {
  service: 'Google',
  account: 'user@gmail.com',
  password: 'securepassword',
  notes: 'Personal account'
});

// Get all passwords for user
const { passwords } = await passwordService.getPasswords(userId);

// Update a password
await passwordService.updatePassword(passwordId, {
  service: 'Google',
  account: 'user@gmail.com',
  password: 'newsecurepassword',
  notes: 'Updated password'
});

// Delete a password
await passwordService.deletePassword(passwordId);
```

## Password Manager

The app now includes a comprehensive password manager with full CRUD operations using Firebase Firestore:

### Features:
- **Secure Storage**: All passwords are stored in Firebase Firestore with user isolation
- **CRUD Operations**: Create, Read, Update, and Delete passwords
- **Rich Data Model**: Store service name, account, password, and optional notes
- **User-Friendly Interface**: Beautiful modals for adding and editing passwords
- **Security Features**: 
  - Passwords are masked by default with show/hide toggle
  - **Biometric authentication required to view or copy passwords**
  - Copy to clipboard functionality for easy use
  - Secure deletion with confirmation
- **Real-time Updates**: Automatic refresh and synchronization
- **Timestamps**: Automatic creation and update timestamps

### Data Fields:
- **Service**: The name of the service/website (e.g., Google, Facebook, GitHub)
- **Account**: Username or email associated with the account
- **Password**: The actual password (stored securely)
- **Notes**: Optional additional information or notes

### How it Works:
1. **Add Password**: Tap the "Add" button to create a new password entry
2. **View Passwords**: All passwords are displayed in a scrollable list
3. **Edit Password**: Tap "Edit" on any password item to modify it
4. **Delete Password**: Tap "Delete" with confirmation to remove a password
5. **Copy Data**: Tap on account fields to copy to clipboard, password copying requires biometric authentication
6. **Show/Hide**: Toggle password visibility with biometric authentication for security

### Security Considerations:
- All passwords are associated with the authenticated user's UID
- Users can only access their own passwords
- **Biometric authentication required to view or copy passwords (if available on device)**
- **Automatic fallback to direct access if biometric authentication is not available**
- Biometric authentication adds an extra layer of security
- Data is stored in Firebase Firestore with built-in security rules

## Biometric Authentication

The app now includes fingerprint/Face ID authentication for enhanced security:

### Features:
- **Automatic Detection**: Detects available biometric methods (fingerprint, Face ID, etc.)
- **User Choice**: Users can enable/disable biometric auth in settings
- **Fallback Support**: Supports PIN/Password fallback if biometric fails
- **Persistent Settings**: Remembers user preference across app sessions
- **Security First**: Biometric auth is required after each app launch (when enabled)

### How it Works:
1. **First Login**: After email/password authentication, user can enable biometric auth
2. **Settings Toggle**: Users can enable/disable in the home screen settings
3. **App Launch**: If enabled, biometric auth is required before accessing the app
4. **Fallback**: Users can use device PIN/Password if biometric fails

### Device Support:
- **iOS**: Face ID, Touch ID
- **Android**: Fingerprint, Face Recognition, Iris
- **Automatic Fallback**: If no biometrics available, feature is hidden

## Phone Authentication (Future Enhancement)

To enable phone authentication, you'll need to:

1. Enable Phone authentication in Firebase Console
2. Install expo-dev-client: `npx expo install expo-dev-client`
3. Add to app.json: `"plugins": ["expo-dev-client"]`
4. Build with EAS: `npx expo run:android` or `npx expo run:ios`

Phone auth requires native code and cannot run in Expo Go.

## Firestore Index Setup

Your password manager requires a composite index for optimal query performance. Create this index in Firebase Console:

### Required Index:
1. Go to [Firebase Console](https://console.firebase.google.com) → Your Project → **Firestore Database** → **Indexes** tab
2. Click **"Create Index"** in the Composite section
3. Configure the index:
   - **Collection ID**: `passwords`
   - **Field 1**: `userId` → **Ascending**
   - **Field 2**: `createdAt` → **Descending**
   - **Query scope**: Collection
4. Click **"Create"** and wait for the index to build (usually 2-5 minutes)

### Alternative Method:
1. Run your app and try to load passwords
2. Firebase will show an error with a direct link to create the required index
3. Click the link and the index will be created automatically

### Verify Index:
Once created, you should see the index listed as:
- Collection: `passwords`
- Fields: `userId ASC, createdAt DESC`
- Status: `Enabled`

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
