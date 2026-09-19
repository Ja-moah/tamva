import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme';
import { Card } from '../ui/Card';
import { ScreenHeader } from '../ui/ScreenHeader';

// Plain statements of what the product is. No support channel is listed
// because none has been provisioned; add one here when it exists.
const TOPICS: { title: string; body: string }[] = [
  {
    title: 'What is TAMVA?',
    body: 'TAMVA helps you understand and control how your financial data is used. It is not a bank, a wallet or a lender, and it does not move your money.',
  },
  {
    title: 'What is Financial Confidence?',
    body: 'A 0–100 indicator of how strongly your financial picture can be verified from the accounts you have chosen to connect. Higher means stronger verified confidence. It is informational: it is not a credit score and not a lending decision.',
  },
  {
    title: 'What is a risk decision?',
    body: 'Institutions may run risk checks on activity. A risk score runs from 0 to 1000 and a higher number means higher risk. It is a different measure from Financial Confidence and the two are never the same thing.',
  },
  {
    title: 'What does consent do?',
    body: 'Consent lets an institution use specific data for a specific purpose for a limited time. You can revoke it at any time from Consent & data sharing, and the institution can no longer use it.',
  },
  {
    title: 'Why are some screens not available yet?',
    body: 'TAMVA only shows information it can verify from its systems. Where a part of the app is not connected yet, it says so instead of showing sample figures.',
  },
];

export function HelpScreen() {
  const { theme } = useTheme();
  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Help" showBack borderBottom />
      <ScrollView contentContainerStyle={styles.content}>
        {TOPICS.map((topic) => (
          <Card key={topic.title}>
            <Text accessibilityRole="header" style={[theme.typography.bodyMedium, { color: theme.colors.textPrimary }]}>
              {topic.title}
            </Text>
            <Text style={[theme.typography.bodySm, styles.body, { color: theme.colors.textSecondary }]}>{topic.body}</Text>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 64 },
  body: { marginTop: 6 },
});
