/**
 * TAMVA NewRecipientModal Component
 *
 * Bottom sheet modal for adding a new Ghanaian recipient:
 * Supports Mobile Money, Bank Account, or TAMVA Network ID.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { BottomSheet } from '../ui/BottomSheet';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Icon } from '../ui/Icon';
import { TransferRecipient, RecipientMethod } from '../../types/transfer';

export interface NewRecipientModalProps {
  visible: boolean;
  onClose: () => void;
  onAddRecipient: (recipient: TransferRecipient) => void;
}

export const NewRecipientModal: React.FC<NewRecipientModalProps> = ({
  visible,
  onClose,
  onAddRecipient,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  const [method, setMethod] = useState<RecipientMethod>('mobile_money');
  const [name, setName] = useState('');
  const [accountOrPhone, setAccountOrPhone] = useState('');
  const [institution, setInstitution] = useState('MTN Mobile Money');
  const [error, setError] = useState('');

  const handleMethodChange = (newMethod: RecipientMethod) => {
    haptics.selection();
    setMethod(newMethod);
    setError('');
    if (newMethod === 'mobile_money') {
      setInstitution('MTN Mobile Money');
    } else if (newMethod === 'bank') {
      setInstitution('GCB Bank');
    } else {
      setInstitution('TAMVA Network');
    }
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    const trimmedAccount = accountOrPhone.trim();

    if (!trimmedName) {
      setError('Please enter the recipient’s full name.');
      haptics.warning();
      return;
    }

    if (!trimmedAccount) {
      setError(
        method === 'mobile_money'
          ? 'Please enter a valid mobile money number.'
          : method === 'bank'
          ? 'Please enter a valid account number.'
          : 'Please enter a TAMVA handle.'
      );
      haptics.warning();
      return;
    }

    // Mask for display privacy
    let masked = trimmedAccount;
    if (method === 'mobile_money' && trimmedAccount.length >= 7) {
      masked = `${trimmedAccount.slice(0, 3)} ••• ${trimmedAccount.slice(-4)}`;
    } else if (method === 'bank' && trimmedAccount.length >= 4) {
      masked = `•• ${trimmedAccount.slice(-4)}`;
    } else if (method === 'tamva' && !trimmedAccount.startsWith('@')) {
      masked = `@${trimmedAccount}`;
    }

    const newRecipient: TransferRecipient = {
      id: `rec-custom-${Date.now()}`,
      name: trimmedName,
      method,
      institutionName: institution,
      networkOrBank: institution,
      maskedAccount: masked,
      brandKey:
        institution.toLowerCase().includes('mtn')
          ? 'mtn'
          : institution.toLowerCase().includes('telecel')
          ? 'telecel'
          : institution.toLowerCase().includes('gcb')
          ? 'gcb'
          : institution.toLowerCase().includes('stanbic')
          ? 'stanbic'
          : undefined,
      isRecent: true,
      isSaved: true,
    };

    haptics.success();
    onAddRecipient(newRecipient);
    setName('');
    setAccountOrPhone('');
    setError('');
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Add New Recipient">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Method Selector Chips */}
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginBottom: 8 }]}>
          RECIPIENT METHOD
        </Text>
        <View style={styles.methodChipsRow}>
          <Chip
            label="Mobile Money"
            selected={method === 'mobile_money'}
            onPress={() => handleMethodChange('mobile_money')}
          />
          <Chip
            label="Bank Account"
            selected={method === 'bank'}
            onPress={() => handleMethodChange('bank')}
          />
          <Chip
            label="TAMVA ID"
            selected={method === 'tamva'}
            onPress={() => handleMethodChange('tamva')}
          />
        </View>

        {/* Institution selector shortcuts */}
        {method === 'mobile_money' && (
          <View style={styles.institutionRow}>
            {['MTN Mobile Money', 'Telecel Cash'].map((inst) => (
              <Pressable
                key={inst}
                onPress={() => {
                  haptics.selection();
                  setInstitution(inst);
                }}
                style={[
                  styles.institutionChip,
                  {
                    borderColor:
                      institution === inst
                        ? theme.colors.primary
                        : theme.colors.border,
                    backgroundColor:
                      institution === inst
                        ? theme.colors.primaryLight
                        : theme.colors.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    theme.typography.captionMedium,
                    {
                      color:
                        institution === inst
                          ? theme.colors.primary
                          : theme.colors.textPrimary,
                    },
                  ]}
                >
                  {inst}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {method === 'bank' && (
          <View style={styles.institutionRow}>
            {['GCB Bank', 'Stanbic Bank', 'Absa Bank', 'CalBank'].map((inst) => (
              <Pressable
                key={inst}
                onPress={() => {
                  haptics.selection();
                  setInstitution(inst);
                }}
                style={[
                  styles.institutionChip,
                  {
                    borderColor:
                      institution === inst
                        ? theme.colors.primary
                        : theme.colors.border,
                    backgroundColor:
                      institution === inst
                        ? theme.colors.primaryLight
                        : theme.colors.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    theme.typography.captionMedium,
                    {
                      color:
                        institution === inst
                          ? theme.colors.primary
                          : theme.colors.textPrimary,
                    },
                  ]}
                >
                  {inst}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Inputs */}
        <Input
          label="Full Legal Name"
          placeholder="e.g. Kwame Mensah"
          value={name}
          onChangeText={(val) => {
            setName(val);
            setError('');
          }}
          autoCapitalize="words"
        />

        <View style={{ marginTop: 12 }}>
          <Input
            label={
              method === 'mobile_money'
                ? 'Mobile Money Phone Number'
                : method === 'bank'
                ? 'Bank Account Number'
                : 'TAMVA @Handle'
            }
            placeholder={
              method === 'mobile_money'
                ? 'e.g. 024 123 4567'
                : method === 'bank'
                ? 'e.g. 10482910482'
                : 'e.g. kwame_m'
            }
            value={accountOrPhone}
            onChangeText={(val) => {
              setAccountOrPhone(val);
              setError('');
            }}
            keyboardType={method === 'tamva' ? 'default' : 'phone-pad'}
          />
        </View>

        {/* Error message */}
        {Boolean(error) && (
          <View style={styles.errorRow}>
            <Icon name="alert-circle" size={14} color={theme.colors.danger} />
            <Text style={[styles.errorText, { color: theme.colors.danger }]}>
              {error}
            </Text>
          </View>
        )}

        {/* Save button */}
        <View style={styles.buttonContainer}>
          <Button
            label="Add Recipient & Continue"
            variant="primary"
            size="lg"
            fullWidth={true}
            onPress={handleSave}
          />
        </View>
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  methodChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  institutionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  institutionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  errorText: {
    fontSize: 12,
  },
  buttonContainer: {
    marginTop: 20,
  },
});
