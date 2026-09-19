/**
 * TAMVA InstitutionPickerSheet Component
 *
 * BottomSheet for selecting a Ghanaian financial institution:
 * - Real-time case-insensitive search with clear button
 * - Clean institution rows with type avatar, category, and name
 * - Duplicate prevention: active connections (connected, syncing, action_required) are locked
 * - Reconnection support: disconnected institutions can be selected to re-authorize
 * - Integrated empty search state and clear mock demo indicator
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../theme';
import { BottomSheet } from '../ui/BottomSheet';
import { Icon } from '../ui/Icon';
import { BrandLogo } from '../ui/BrandLogo';
import { Badge } from '../ui/Badge';
import { InstitutionCatalogItem, ConnectedAccount } from '../../types/accounts';
import { INSTITUTION_CATALOG } from '../../demo/data/mockConnectedAccountsData';
import { useHaptics } from '../../hooks/useHaptics';

export interface InstitutionPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectInstitution: (institution: InstitutionCatalogItem) => void;
  connectedAccounts: ConnectedAccount[];
}

export const InstitutionPickerSheet: React.FC<InstitutionPickerSheetProps> = ({
  visible,
  onClose,
  onSelectInstitution,
  connectedAccounts,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const [searchQuery, setSearchQuery] = useState('');

  // Map of active connections vs disconnected accounts
  const connectionStateMap = useMemo(() => {
    const map = new Map<string, 'active' | 'disconnected'>();
    connectedAccounts.forEach((acc) => {
      const nameKey = acc.institutionName.toLowerCase();
      if (acc.status === 'disconnected') {
        map.set(nameKey, 'disconnected');
      } else {
        map.set(nameKey, 'active');
      }
    });
    return map;
  }, [connectedAccounts]);

  // Filtered institution catalog
  const filteredInstitutions = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return INSTITUTION_CATALOG;

    return INSTITUTION_CATALOG.filter(
      (item) =>
        item.name.toLowerCase().includes(trimmed) ||
        item.categoryLabel.toLowerCase().includes(trimmed) ||
        item.defaultAccountType.toLowerCase().includes(trimmed)
    );
  }, [searchQuery]);

  const handleSelect = (institution: InstitutionCatalogItem) => {
    const status = connectionStateMap.get(institution.name.toLowerCase());
    if (status === 'active') return; // Cannot duplicate active connection

    haptics.lightImpact();
    onSelectInstitution(institution);
  };

  const handleClearSearch = () => {
    haptics.lightImpact();
    setSearchQuery('');
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Connect an Institution"
      subtitle="Select a Ghanaian bank or mobile wallet"
      maxHeight="86%"
    >
      <View style={styles.container}>
        {/* Search Input Bar */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <Icon name="search" size={16} color={theme.colors.textTertiary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search bank, mobile money, wallet..."
            placeholderTextColor={theme.colors.textTertiary}
            style={[
              styles.searchInput,
              theme.typography.body,
              { color: theme.colors.textPrimary },
            ]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={handleClearSearch}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.clearButton}
              accessibilityRole="button"
              accessibilityLabel="Clear search text"
            >
              <Icon name="x" size={15} color={theme.colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Institutions List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        >
          {filteredInstitutions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIconCircle,
                  { backgroundColor: theme.colors.surfaceElevated },
                ]}
              >
                <Icon name="alert-circle" size={24} color={theme.colors.textTertiary} />
              </View>
              <Text
                style={[
                  theme.typography.subheading,
                  { color: theme.colors.textPrimary, marginTop: 12 },
                ]}
              >
                No institutions found
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, marginTop: 4, textAlign: 'center' },
                ]}
              >
                No financial provider matched &quot;{searchQuery}&quot;. Try searching for MTN, GCB, or Stanbic.
              </Text>
              <Pressable
                onPress={handleClearSearch}
                style={[
                  styles.clearFilterButton,
                  { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border },
                ]}
              >
                <Text style={[theme.typography.captionMedium, { color: theme.colors.primary }]}>
                  Clear Search
                </Text>
              </Pressable>
            </View>
          ) : (
            filteredInstitutions.map((item) => {
              const connectionStatus = connectionStateMap.get(item.name.toLowerCase());
              const isActive = connectionStatus === 'active';
              const isDisconnected = connectionStatus === 'disconnected';

              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleSelect(item)}
                  disabled={isActive}
                  style={({ pressed }) => [
                    styles.institutionItem,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.md,
                      opacity: isActive ? 0.55 : pressed ? 0.82 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name}, ${item.categoryLabel}. ${
                    isActive
                      ? 'Already connected. Cannot create duplicate.'
                      : isDisconnected
                      ? 'Previously disconnected. Tap to reconnect.'
                      : 'Select to connect.'
                  }`}
                  accessibilityState={{ disabled: isActive }}
                >
                  <BrandLogo
                    name={item.name}
                    containerSize={40}
                    fallbackIcon={item.icon}
                    fallbackBg={
                      item.type === 'mobile_money'
                        ? theme.colors.primaryLight
                        : theme.colors.surfaceElevated
                    }
                    fallbackIconColor={
                      item.type === 'mobile_money'
                        ? theme.colors.primary
                        : theme.colors.textPrimary
                    }
                    style={styles.avatarCircle}
                  />

                  <View style={styles.textColumn}>
                    <Text
                      style={[
                        theme.typography.bodyMedium,
                        { color: theme.colors.textPrimary, flexShrink: 1 },
                      ]}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={[
                        theme.typography.caption,
                        { color: theme.colors.textSecondary, marginTop: 1 },
                      ]}
                      numberOfLines={1}
                    >
                      {item.categoryLabel} • {item.defaultAccountType}
                    </Text>
                  </View>

                  {isActive ? (
                    <Badge label="Connected" tone="success" size="sm" showDot />
                  ) : isDisconnected ? (
                    <Badge label="Reconnect" tone="neutral" size="sm" />
                  ) : (
                    <Icon
                      name="chevron-right"
                      size={18}
                      color={theme.colors.textTertiary}
                    />
                  )}
                </Pressable>
              );
            })
          )}

          {/* Sandbox Disclosure Footnote */}
          <View style={styles.footnoteRow}>
            <Icon name="info" size={13} color={theme.colors.textTertiary} />
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textTertiary, marginLeft: 6 },
              ]}
            >
              Demo sandbox mode — Simulated mock financial provider
            </Text>
          </View>
        </ScrollView>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 8,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    paddingBottom: 24,
  },
  institutionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
    minHeight: 56,
  },
  avatarCircle: {
    marginRight: 12,
  },
  textColumn: {
    flex: 1,
    marginRight: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 16,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearFilterButton: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  footnoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingBottom: 8,
  },
});
