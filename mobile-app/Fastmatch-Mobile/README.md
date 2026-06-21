# FastMatch - React Native CLI

This project has been converted from React (Vite) to React Native CLI.

## Project Structure
- `App.tsx`: Root component with state-based routing.
- `src/components/`: Reusable UI components (Buttons, Inputs, Nav).
- `src/views/`: Screen views (Auth, Core, App).
- `src/types.ts`: Shared types and enums.

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Metro Bundler
```bash
npm start
```

### 3. Run on Android/iOS
```bash
npm run android
# or
npm run ios
```

## Note
This conversion adapted Tailwind CSS classes to React Native `StyleSheet`. Video chat logic uses placeholders and will require `react-native-webrtc` for full implementation.
