import React from 'react';
import { Platform, Text, TextInput } from 'react-native';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import { AppProvider } from './context';
import AppNavigator from './navigation/AppNavigator';

// ── Web : autofill fix + Poppins depuis Google Fonts ──────────────────────────
if (Platform.OS === 'web') {
  // Autofill fix
  const styleId = 'vroom-autofill-fix';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus,
      input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 60px #221011 inset !important;
        -webkit-text-fill-color: #FFFAFA !important;
        background-color: #221011 !important;
        color: #FFFAFA !important;
        caret-color: #FFFAFA !important;
        transition: background-color 9999s ease-in-out 0s !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Poppins via Google Fonts CDN (gère tous les graisses automatiquement)
  const poppinsFontId = 'vroom-poppins-font';
  if (!document.getElementById(poppinsFontId)) {
    const preconnect1 = document.createElement('link');
    preconnect1.rel = 'preconnect';
    preconnect1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(preconnect1);

    const preconnect2 = document.createElement('link');
    preconnect2.rel = 'preconnect';
    preconnect2.href = 'https://fonts.gstatic.com';
    preconnect2.crossOrigin = 'anonymous';
    document.head.appendChild(preconnect2);

    const link = document.createElement('link');
    link.id = poppinsFontId;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap';
    document.head.appendChild(link);
  }
}

// ── Police par défaut pour tous les Text et TextInput ─────────────────────────
const DEFAULT_FONT = Platform.select({
  web: 'Poppins, sans-serif',
  default: 'Poppins_400Regular',
});

if (!Text.defaultProps) Text.defaultProps = {};
Text.defaultProps.style = { fontFamily: DEFAULT_FONT };

if (!TextInput.defaultProps) TextInput.defaultProps = {};
TextInput.defaultProps.style = { fontFamily: DEFAULT_FONT };

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  // Sur native, attendre que les fonts soient prêtes
  if (!fontsLoaded && Platform.OS !== 'web') {
    return null;
  }

  return (
    <AppProvider>
      <AppNavigator />
    </AppProvider>
  );
}
