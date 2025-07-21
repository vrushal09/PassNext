# ⚡ PassNext

![Banner](PassNext/assets/images/Branding.png)

Welcome to **PassNext** – the password manager that takes your security (and your bad password habits) seriously, so you don’t have to! 🔐

## 😅 What is this?

PassNext was supposed to be my first app launch… but I kinda **messed it up** (badly).  
So I turned it into something open-source and useful instead.

If you’re into security, React Native, or just want to contribute to something cool — **you’re welcome here**.

---

⚠️ Setup Notice
Before running the project, make sure to replace all XXXXXXXXXXXX values in the following files:

🔧 app.json: Replace projectId

🔥 src/config/firebase.ts: Replace Firebase config (apiKey, projectId, etc.)

🧂 src/services/encryptionService.ts: Replace salt value for encryption

These are placeholders from my original private setup. You’ll need your own Firebase project + salt to make things work.

## Features - (Supposed to Be Implemented)

- 🔒 **Biometric Authentication**: Use your face or fingerprint to unlock your vault. (Sorry, no retina scans. Yet.)
- 🛡️ **Password Strength Meter**: Tells you if your password is strong, weak, or “password123”.
- 🚨 **Breach Monitoring**: Alerts you if your password is found in a data breach. (Yikes!)
- ⏰ **Password Expiry Reminders**: Because old passwords are so last year.
- 📊 **Security Dashboard**: Get a bird’s-eye view of your password health.
- 🤖 **Password Generator**: Make strong, random passwords with a single tap.
- ☁️ **Cloud Sync**: Your passwords, everywhere you go.
- 🌗 **Dark/Light Mode**: For your eyes’ comfort (and your hacker aesthetic).

## Quick Start

1. **Clone this repo:**
   ```bash
   git clone https://github.com/vrushal09/PassNext.git
   cd PassNext
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the app:**
   ```bash
   npm start
   ```
4. **Scan the QR code with Expo Go or run on your emulator.**

## Tech Stack

- [Expo](https://expo.dev/) + [React Native](https://reactnative.dev/)
- [Firebase](https://firebase.google.com/) (Auth, Firestore)
- [zxcvbn](https://github.com/dropbox/zxcvbn) for password strength
- [CryptoJS](https://github.com/brix/crypto-js) for encryption

## Contributing

Pull requests are welcome! If you find a bug or have a feature idea, open an issue or PR.

## License

MIT. Use it, fork it, break it, fix it. Just don’t use “password” as your password, please.

---

Made with ❤️, ☕, and a lot of Stress.
