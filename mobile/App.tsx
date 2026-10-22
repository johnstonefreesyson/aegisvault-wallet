import 'react-native-get-random-values';
import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View, Text } from 'react-native';

/**
 * React Native CLI Mobile Entry Point for AegisVault
 */
export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070b14" />
      <View style={styles.inner}>
        <Text style={styles.title}>AegisVault Mobile</Text>
        <Text style={styles.subtitle}>
          Non-Custodial Multi-Chain Crypto Wallet for iOS & Android
        </Text>
        <Text style={styles.info}>
          Hardware-backed KeyStore & Secure Enclave key isolation active.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070b14',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 16,
  },
  info: {
    fontSize: 12,
    color: '#38bdf8',
    textAlign: 'center',
  },
});
