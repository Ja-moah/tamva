/**
 * TAMVA Phase 1 Design System & Architecture Foundation Showcase
 *
 * An interactive, comprehensive foundation viewer.
 * Demonstrates all tokens, primitives, and financial components in live context.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';

// Design System Imports
import { useTheme } from '../src/theme';
import { usePrivacy } from '../src/context/PrivacyContext';
import {
  Button,
  Input,
  Card,
  Badge,
  Chip,
  Avatar,
  IconButton,
  Divider,
  LinearProgress,
  CircularProgress,
  Skeleton,
  SkeletonCard,
  EmptyState,
  ErrorState,
  useToast,
  Modal,
  BottomSheet,
  ScreenHeader,
  SectionHeader,
  ListRow,
} from '../src/components/ui';

import {
  MoneyDisplay,
  MetricCard,
  ScoreDisplay,
  StatusIndicator,
  TransactionRow,
} from '../src/components/financial';

export default function DesignSystemScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { isPrivate, togglePrivacy } = usePrivacy();
  const { showToast } = useToast();
  const router = useRouter();

  // State for interactive component demonstrations
  const [selectedChip, setSelectedChip] = useState<'all' | 'ui' | 'financial'>('all');
  const [inputValue, setInputValue] = useState('user@tamva.com');
  const [passwordValue, setPasswordValue] = useState('Password123');
  const [modalVisible, setModalVisible] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {/* Top App Header */}
      <ScreenHeader
        title="TAMVA Design System"
        subtitle="Phase 1 Foundation"
        showBack={true}
        borderBottom={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Foundation Overview & Controls */}
        <Card variant="elevated" padding="md" style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={[theme.typography.subheading, { color: theme.colors.textPrimary }]}>
                System Controls
              </Text>
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 2 }]}>
                Live testing toggles for global states
              </Text>
            </View>
            <Badge label="v1.0-alpha" tone="information" size="sm" />
          </View>

          <Divider style={{ marginVertical: 14 }} />

          {/* Privacy Mode Toggle */}
          <View style={styles.controlRow}>
            <View style={styles.controlInfo}>
              <Text style={[theme.typography.bodyMedium, { color: theme.colors.textPrimary }]}>
                Privacy Mode
              </Text>
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                {isPrivate ? 'Financial values masked (GH₵ ••••••)' : 'Financial values visible'}
              </Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={togglePrivacy}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.surface}
            />
          </View>

          {/* Dark Mode Toggle */}
          <View style={[styles.controlRow, { marginTop: 12 }]}>
            <View style={styles.controlInfo}>
              <Text style={[theme.typography.bodyMedium, { color: theme.colors.textPrimary }]}>
                Dark Appearance
              </Text>
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                {isDark ? 'Dark theme active' : 'Light theme active'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.surface}
            />
          </View>
        </Card>

        {/* Section Filter Chips */}
        <View style={styles.filterRow}>
          <Chip
            label="All Foundations"
            selected={selectedChip === 'all'}
            onPress={() => setSelectedChip('all')}
          />
          <Chip
            label="Financial UI"
            selected={selectedChip === 'financial'}
            onPress={() => setSelectedChip('financial')}
          />
          <Chip
            label="UI Primitives"
            selected={selectedChip === 'ui'}
            onPress={() => setSelectedChip('ui')}
          />
        </View>

        {/* ─────────────────────────────────────────────────────────────
            1. FINANCIAL UI FOUNDATIONS
           ───────────────────────────────────────────────────────────── */}
        {(selectedChip === 'all' || selectedChip === 'financial') && (
          <View style={styles.section}>
            <SectionHeader
              title="Financial UI Foundations"
              overline="DOMAIN COMPONENTS"
              subtitle="Privacy-aware, high-trust presentation contracts"
            />

            {/* MoneyDisplay Sizes */}
            <Card variant="standard" padding="md" style={styles.cardGroup}>
              <Text style={[theme.typography.label, { color: theme.colors.textSecondary, marginBottom: 8 }]}>
                MoneyDisplay Hierarchy
              </Text>

              <View style={styles.moneyRow}>
                <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, width: 70 }]}>
                  Display
                </Text>
                <MoneyDisplay amount={12450.00} currency="GHS" size="display" showPrivacyToggle={true} />
              </View>

              <Divider style={{ marginVertical: 10 }} />

              <View style={styles.moneyRow}>
                <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, width: 70 }]}>
                  Large
                </Text>
                <MoneyDisplay amount={4820.50} currency="GHS" size="lg" />
              </View>

              <Divider style={{ marginVertical: 10 }} />

              <View style={styles.moneyRow}>
                <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, width: 70 }]}>
                  Medium
                </Text>
                <MoneyDisplay amount={1250.00} currency="GHS" size="md" flow="income" showSign={true} />
              </View>

              <Divider style={{ marginVertical: 10 }} />

              <View style={styles.moneyRow}>
                <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, width: 70 }]}>
                  Small
                </Text>
                <MoneyDisplay amount={85.20} currency="GHS" size="sm" flow="outflow" showSign={true} />
              </View>
            </Card>

            {/* ScoreDisplay */}
            <ScoreDisplay
              score={780}
              maxScore={850}
              label="Financial Confidence Score"
              rating="exceptional"
              summaryText="High transaction consistency and active consent validation across verified accounts."
              style={{ marginTop: 12 }}
            />

            {/* MetricCard Grid */}
            <View style={styles.metricGrid}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <MetricCard
                  title="Monthly Outflow"
                  value={2430}
                  isCurrency={true}
                  trend={{ value: 4.8, direction: 'down', label: 'vs avg', isPositive: true }}
                  icon="credit-card"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <MetricCard
                  title="Data Trust Level"
                  value="94%"
                  supportingText="All 4 accounts in sync"
                  icon="shield"
                />
              </View>
            </View>

            {/* Status Indicators */}
            <Card variant="standard" padding="md" style={styles.cardGroup}>
              <Text style={[theme.typography.label, { color: theme.colors.textSecondary, marginBottom: 12 }]}>
                Account & Sync Status Indicators
              </Text>
              <View style={styles.statusRow}>
                <StatusIndicator status="connected" />
                <StatusIndicator status="syncing" />
                <StatusIndicator status="attention_required" />
                <StatusIndicator status="revoked" />
              </View>
            </Card>

            {/* Transaction Rows */}
            <Card variant="standard" padding="none" style={styles.cardGroup}>
              <View style={{ padding: 14, paddingBottom: 6 }}>
                <Text style={[theme.typography.label, { color: theme.colors.textSecondary }]}>
                  TransactionRow Foundations
                </Text>
              </View>
              <TransactionRow
                title="Ghana Commercial Bank"
                category="Salary Deposit"
                date="Today, 09:15"
                amount={4500.00}
                currency="GHS"
                flow="income"
                accountLabel="Direct Transfer"
                onPress={() => showToast({ type: 'info', title: 'Transaction Selected', message: 'GCB Salary Transfer' })}
              />
              <TransactionRow
                title="Starbites Restaurant"
                category="Food & Dining"
                date="Yesterday, 19:40"
                amount={285.50}
                currency="GHS"
                flow="outflow"
                accountLabel="MTN MoMo"
                onPress={() => showToast({ type: 'info', title: 'Transaction Selected', message: 'Starbites' })}
              />
              <TransactionRow
                title="ECG Electricity Prepaid"
                category="Utilities"
                date="12 Sep, 14:10"
                amount={150.00}
                currency="GHS"
                flow="outflow"
                status="pending"
                accountLabel="GCB Checking"
                showDivider={false}
                onPress={() => showToast({ type: 'warning', title: 'Pending Settlement', message: 'Waiting on ECG confirmation' })}
              />
            </Card>
          </View>
        )}

        {/* ─────────────────────────────────────────────────────────────
            2. UI PRIMITIVES & CONTROLS
           ───────────────────────────────────────────────────────────── */}
        {(selectedChip === 'all' || selectedChip === 'ui') && (
          <View style={styles.section}>
            <SectionHeader
              title="UI Primitives"
              overline="DESIGN SYSTEM ATOMS"
              subtitle="Buttons, inputs, badges, avatars, and overlays"
            />

            {/* Buttons */}
            <Card variant="standard" padding="md" style={styles.cardGroup}>
              <Text style={[theme.typography.label, { color: theme.colors.textSecondary, marginBottom: 12 }]}>
                Button Variants
              </Text>
              <View style={styles.btnStack}>
                <Button
                  label="Primary Action"
                  variant="primary"
                  onPress={() => showToast({ type: 'success', title: 'Action Confirmed', message: 'Primary action triggered with haptic feedback' })}
                  leftIcon="check"
                  fullWidth
                />
                <Button
                  label="Secondary Action"
                  variant="secondary"
                  onPress={() => showToast({ type: 'info', title: 'Secondary Action', message: 'Subtle border styling' })}
                  leftIcon="download"
                  fullWidth
                />
                <Button
                  label="Tertiary Action"
                  variant="tertiary"
                  onPress={() => showToast({ type: 'info', title: 'Tertiary Action', message: 'Clean text button' })}
                  fullWidth
                />
                <Button
                  label="Destructive Action"
                  variant="destructive"
                  onPress={() => showToast({ type: 'danger', title: 'Danger Action', message: 'Sensitive action warning' })}
                  leftIcon="x-circle"
                  fullWidth
                />
                <Button
                  label={btnLoading ? 'Processing...' : 'Toggle Loading State'}
                  variant="primary"
                  loading={btnLoading}
                  onPress={() => {
                    setBtnLoading(true);
                    setTimeout(() => setBtnLoading(false), 2000);
                  }}
                  fullWidth
                />
              </View>
            </Card>

            {/* Inputs */}
            <Card variant="standard" padding="md" style={styles.cardGroup}>
              <Text style={[theme.typography.label, { color: theme.colors.textSecondary, marginBottom: 12 }]}>
                Input States
              </Text>
              <Input
                label="Email Address"
                value={inputValue}
                onChangeText={setInputValue}
                leftIcon="user"
                placeholder="Enter email"
              />
              <Input
                label="Security Password"
                value={passwordValue}
                onChangeText={setPasswordValue}
                isPassword={true}
                leftIcon="key"
                helperText="Must contain at least 8 characters"
              />
              <Input
                label="Account Identifier"
                value="GH99-INVALID-FORMAT"
                errorMessage="Invalid account routing number"
                leftIcon="alert-circle"
              />
            </Card>

            {/* Badges & Chips */}
            <Card variant="standard" padding="md" style={styles.cardGroup}>
              <Text style={[theme.typography.label, { color: theme.colors.textSecondary, marginBottom: 12 }]}>
                Badges & Semantic Tones
              </Text>
              <View style={styles.badgeRow}>
                <Badge label="Success" tone="success" showDot={true} />
                <Badge label="Warning" tone="warning" showDot={true} />
                <Badge label="Danger" tone="danger" showDot={true} />
                <Badge label="Info" tone="information" showDot={true} />
                <Badge label="Neutral" tone="neutral" />
              </View>
            </Card>

            {/* Avatars & IconButtons */}
            <Card variant="standard" padding="md" style={styles.cardGroup}>
              <Text style={[theme.typography.label, { color: theme.colors.textSecondary, marginBottom: 12 }]}>
                Avatars & Action Triggers
              </Text>
              <View style={styles.avatarRow}>
                <Avatar name="Kofi Annan" size="lg" showStatus={true} />
                <Avatar name="Abena Mensah" size="md" />
                <Avatar icon="shield" size="md" />
                <Avatar name="Kwame Nkrumah" size="sm" />
                <View style={styles.iconBtnStack}>
                  <IconButton
                    icon="search"
                    onPress={() => showToast({ type: 'info', title: 'Search', message: 'Search opened' })}
                    accessibilityLabel="Search"
                  />
                  <IconButton
                    icon="filter"
                    variant="default"
                    onPress={() => showToast({ type: 'info', title: 'Filter', message: 'Filters opened' })}
                    accessibilityLabel="Filters"
                  />
                </View>
              </View>
            </Card>

            {/* Progress & Skeletons */}
            <Card variant="standard" padding="md" style={styles.cardGroup}>
              <Text style={[theme.typography.label, { color: theme.colors.textSecondary, marginBottom: 12 }]}>
                Progress & Loading Skeletons
              </Text>
              <LinearProgress progress={0.68} height={8} tone="primary" />
              <View style={{ height: 16 }} />
              <SkeletonCard />
            </Card>

            {/* Modals & Sheet Triggers */}
            <Card variant="standard" padding="md" style={styles.cardGroup}>
              <Text style={[theme.typography.label, { color: theme.colors.textSecondary, marginBottom: 12 }]}>
                Feedback & Overlays
              </Text>
              <View style={styles.btnStack}>
                <Button
                  label="Show Interactive Modal"
                  variant="secondary"
                  onPress={() => setModalVisible(true)}
                  leftIcon="info"
                  fullWidth
                />
                <Button
                  label="Show Bottom Sheet"
                  variant="secondary"
                  onPress={() => setSheetVisible(true)}
                  leftIcon="menu"
                  fullWidth
                />
                <Button
                  label="Trigger Success Toast"
                  variant="tertiary"
                  onPress={() => showToast({
                    type: 'success',
                    title: 'Sync Complete',
                    message: 'All bank permissions verified successfully.',
                  })}
                  fullWidth
                />
              </View>
            </Card>
          </View>
        )}

        {/* Interactive Modal */}
        <Modal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          title="Data Consent Confirmation"
          description="TAMVA requires explicit permission to access read-only transaction history from your connected institutions."
          primaryAction={{
            label: 'Authorize Access',
            onPress: () => {
              setModalVisible(false);
              showToast({ type: 'success', title: 'Consent Granted', message: 'Permissions stored securely.' });
            },
          }}
          secondaryAction={{
            label: 'Review Details',
            onPress: () => setModalVisible(false),
          }}
        />

        {/* Interactive Bottom Sheet */}
        <BottomSheet
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          title="Security & Permissions"
          subtitle="Manage your cryptographic trust delegation"
        >
          <ListRow
            title="Biometric Authentication"
            subtitle="Face ID or Fingerprint login"
            leftIcon="shield"
            rightText="Active"
            onPress={() => {}}
          />
          <ListRow
            title="Read-Only Banking Consent"
            subtitle="Granted to 3 institutions"
            leftIcon="lock"
            badge={{ label: 'Active', tone: 'success' }}
            onPress={() => {}}
          />
          <ListRow
            title="Revoke All Access"
            subtitle="Instantly disconnect external parties"
            leftIcon="x-circle"
            destructive={true}
            onPress={() => {
              setSheetVisible(false);
              showToast({ type: 'danger', title: 'Access Revoked', message: 'All active sessions terminated.' });
            }}
          />
        </BottomSheet>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  heroCard: {
    marginBottom: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlInfo: {
    flex: 1,
    paddingRight: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  cardGroup: {
    marginTop: 12,
  },
  moneyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricGrid: {
    flexDirection: 'row',
    marginTop: 12,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  btnStack: {
    gap: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtnStack: {
    flexDirection: 'row',
    gap: 8,
  },
});
