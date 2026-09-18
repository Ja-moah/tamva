/**
 * TAMVA SelectRecipientStep Component (Screen 2)
 *
 * Recipient selection experience supporting:
 * - Real-time recipient search
 * - Method filter chips (All, Mobile Money, Bank Account, TAMVA User)
 * - Recent recipients row for quick 1-tap re-transfers
 * - Saved recipients directory with masked account privacy
 * - Add new recipient sheet integration
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { TransferRecipient, RecipientMethod } from '../../types/transfer';
import { ScreenHeader } from '../ui/ScreenHeader';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Chip } from '../ui/Chip';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { BrandLogo } from '../ui/BrandLogo';
import { NewRecipientModal } from './NewRecipientModal';

export interface SelectRecipientStepProps {
  recipients: TransferRecipient[];
  selectedRecipientId: string | null;
  onSelectRecipient: (recipient: TransferRecipient) => void;
  onAddNewRecipient: (recipient: TransferRecipient) => void;
  onContinue: () => void;
  onBack: () => void;
}

export const SelectRecipientStep: React.FC<SelectRecipientStepProps> = ({
  recipients,
  selectedRecipientId,
  onSelectRecipient,
  onAddNewRecipient,
  onContinue,
  onBack,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | RecipientMethod>('all');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  // Filter recipients based on search query and active method filter
  const filteredRecipients = useMemo(() => {
    return recipients.filter((rec) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        rec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.institutionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.maskedAccount.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMethod =
        selectedFilter === 'all' || rec.method === selectedFilter;

      return matchesSearch && matchesMethod;
    });
  }, [recipients, searchQuery, selectedFilter]);

  const recentRecipients = useMemo(() => {
    return recipients.filter((r) => r.isRecent);
  }, [recipients]);

  const handleRecipientPress = (recipient: TransferRecipient) => {
    haptics.selection();
    onSelectRecipient(recipient);
  };

  const selectedRecipient = recipients.find((r) => r.id === selectedRecipientId);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 1. SCREEN HEADER */}
      <ScreenHeader
        title="Who are you sending to?"
        subtitle="Select or search a recipient"
        showBack={true}
        onBackPress={onBack}
        borderBottom={true}
      />

      {/* 2. SEARCH & FILTER BAR */}
      <View
        style={[
          styles.topControls,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        {/* Search Input */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.colors.backgroundAlt,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Icon name="search" size={16} color={theme.colors.textTertiary} />
          <TextInput
            placeholder="Search by name, bank, or phone"
            placeholderTextColor={theme.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.colors.textPrimary }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {Boolean(searchQuery) && (
            <Pressable
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="x" size={16} color={theme.colors.textTertiary} />
            </Pressable>
          )}
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsRow}
        >
          <Chip
            label="All"
            selected={selectedFilter === 'all'}
            onPress={() => setSelectedFilter('all')}
          />
          <Chip
            label="Mobile Money"
            selected={selectedFilter === 'mobile_money'}
            onPress={() => setSelectedFilter('mobile_money')}
          />
          <Chip
            label="Bank Account"
            selected={selectedFilter === 'bank'}
            onPress={() => setSelectedFilter('bank')}
          />
          <Chip
            label="TAMVA User"
            selected={selectedFilter === 'tamva'}
            onPress={() => setSelectedFilter('tamva')}
          />
        </ScrollView>
      </View>

      {/* 3. SCROLLABLE RECIPIENT DIRECTORY */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 80 },
        ]}
      >
        {/* Add New Recipient Card */}
        <Pressable
          onPress={() => {
            haptics.selection();
            setIsAddModalVisible(true);
          }}
          style={({ pressed }) => [
            styles.addRecipientCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <View
            style={[
              styles.addIconContainer,
              { backgroundColor: theme.colors.primaryLight },
            ]}
          >
            <Icon name="plus" size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.addRecipientTextContainer}>
            <Text
              style={[
                theme.typography.bodyMedium,
                { color: theme.colors.primary, fontWeight: '600' },
              ]}
            >
              Add new recipient
            </Text>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textTertiary, marginTop: 2 },
              ]}
            >
              Send to Mobile Money, Bank, or TAMVA ID
            </Text>
          </View>
          <Icon
            name="chevron-right"
            size={18}
            color={theme.colors.textTertiary}
          />
        </Pressable>

        {/* Recent Recipients Row (if no active search) */}
        {!searchQuery && recentRecipients.length > 0 && (
          <View style={styles.sectionWrapper}>
            <Text
              style={[
                theme.typography.captionMedium,
                {
                  color: theme.colors.textSecondary,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  marginBottom: 10,
                },
              ]}
            >
              Recent Transfers
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentHorizontalList}
            >
              {recentRecipients.map((rec) => {
                const isSelected = rec.id === selectedRecipientId;

                return (
                  <Pressable
                    key={`recent-${rec.id}`}
                    onPress={() => handleRecipientPress(rec)}
                    style={({ pressed }) => [
                      styles.recentCard,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primaryLight
                          : theme.colors.surface,
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.border,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <BrandLogo
                      name={rec.institutionName}
                      containerSize={38}
                      shape="circle"
                      fallbackIcon={
                        rec.method === 'mobile_money'
                          ? 'smartphone'
                          : rec.method === 'bank'
                          ? 'credit-card'
                          : 'user'
                      }
                      fallbackBg={theme.colors.backgroundAlt}
                    />
                    <Text
                      style={[
                        theme.typography.captionMedium,
                        {
                          color: theme.colors.textPrimary,
                          fontWeight: '600',
                          marginTop: 6,
                          textAlign: 'center',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {rec.name.split(' ')[0]}
                    </Text>
                    <Text
                      style={[
                        theme.typography.caption,
                        {
                          color: theme.colors.textTertiary,
                          fontSize: 10,
                          textAlign: 'center',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {rec.networkOrBank}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Saved Directory Section */}
        <View style={styles.sectionWrapper}>
          <Text
            style={[
              theme.typography.captionMedium,
              {
                color: theme.colors.textSecondary,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                marginBottom: 10,
              },
            ]}
          >
            {searchQuery ? 'Search Results' : 'Saved Recipients'} (
            {filteredRecipients.length})
          </Text>

          {filteredRecipients.length === 0 ? (
            <Card variant="outlined" style={styles.emptyCard}>
              <Icon
                name="user"
                size={28}
                color={theme.colors.textTertiary}
              />
              <Text
                style={[
                  theme.typography.bodyMedium,
                  { color: theme.colors.textSecondary, marginTop: 8 },
                ]}
              >
                No recipients match your query
              </Text>
            </Card>
          ) : (
            filteredRecipients.map((recipient) => {
              const isSelected = recipient.id === selectedRecipientId;

              return (
                <Pressable
                  key={recipient.id}
                  onPress={() => handleRecipientPress(recipient)}
                  style={({ pressed }) => [
                    styles.recipientRowWrapper,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${recipient.name}, ${recipient.networkOrBank}, ${recipient.maskedAccount}`}
                >
                  <Card
                    variant={isSelected ? 'elevated' : 'outlined'}
                    style={
                      isSelected
                        ? {
                            ...styles.recipientCard,
                            borderColor: theme.colors.primary,
                            borderWidth: 2,
                            backgroundColor: theme.colors.surface,
                          }
                        : styles.recipientCard
                    }
                  >
                    <View style={styles.recipientRow}>
                      <BrandLogo
                        name={recipient.institutionName}
                        containerSize={42}
                        shape="rounded"
                        fallbackIcon={
                          recipient.method === 'mobile_money'
                            ? 'smartphone'
                            : recipient.method === 'bank'
                            ? 'credit-card'
                            : 'user'
                        }
                        fallbackBg={theme.colors.backgroundAlt}
                      />

                      <View style={styles.recipientDetails}>
                        <View style={styles.nameRow}>
                          <Text
                            style={[
                              theme.typography.bodyMedium,
                              { color: theme.colors.textPrimary, fontWeight: '600' },
                            ]}
                            numberOfLines={1}
                          >
                            {recipient.name}
                          </Text>
                          {Boolean(recipient.tag) && (
                            <Badge
                              label={recipient.tag!}
                              tone="neutral"
                              size="sm"
                            />
                          )}
                        </View>

                        <Text
                          style={[
                            theme.typography.caption,
                            { color: theme.colors.textTertiary, marginTop: 2 },
                          ]}
                          numberOfLines={1}
                        >
                          {recipient.networkOrBank} • {recipient.maskedAccount}
                        </Text>
                      </View>

                      {/* Radio Selection Indicator */}
                      <View
                        style={[
                          styles.radioCircle,
                          {
                            borderColor: isSelected
                              ? theme.colors.primary
                              : theme.colors.border,
                            backgroundColor: isSelected
                              ? theme.colors.primary
                              : 'transparent',
                          },
                        ]}
                      >
                        {isSelected && (
                          <Icon name="check" size={13} color="#FFFFFF" />
                        )}
                      </View>
                    </View>
                  </Card>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* 4. FIXED BOTTOM BAR */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <Button
          label="Continue"
          variant="primary"
          size="lg"
          fullWidth={true}
          disabled={!selectedRecipient}
          rightIcon="arrow-right"
          onPress={onContinue}
          accessibilityHint="Continues to amount entry"
        />
      </View>

      {/* 5. ADD NEW RECIPIENT MODAL */}
      <NewRecipientModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onAddRecipient={(newRec) => {
          onAddNewRecipient(newRec);
          onSelectRecipient(newRec);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topControls: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  filterChipsRow: {
    gap: 8,
    marginTop: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  addRecipientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  addIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRecipientTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  sectionWrapper: {
    marginBottom: 20,
  },
  recentHorizontalList: {
    gap: 12,
  },
  recentCard: {
    width: 96,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientRowWrapper: {
    marginBottom: 10,
  },
  recipientCard: {
    padding: 14,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipientDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
