import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { AppProvider } from './context';
import AppNavigator from './navigation/AppNavigator';

if (Platform.OS === 'web') {
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
}

export default function App() {
  return (
    <AppProvider>
      <AppNavigator />
    </AppProvider>
  );
}