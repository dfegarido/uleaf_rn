import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  TRANSACTION_TYPES,
  CREDIT_TYPES,
  REASON_TYPE_META,
  getCreditTypeMeta,
  formatCreditAmount,
} from '../../utils/creditEnums';
import BoxIcon from '../../assets/icons/greydark/box-regular.svg';

function formatDate(value) {
  if (!value) return '';
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function Section({ title, children }) {
  if (!children) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function LabeledRow({ label, value, valueStyle = {} }) {
  if (value == null || value === '') return null;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, valueStyle]}>{value}</Text>
    </View>
  );
}

function ActionButton({ icon: Icon, label, onPress, disabled = false }) {
  const isDisabled = disabled || !onPress;
  return (
    <TouchableOpacity
      style={[styles.actionButton, isDisabled && styles.actionButtonDisabled]}
      onPress={onPress || (() => {})}
      activeOpacity={isDisabled ? 1 : 0.8}
      disabled={isDisabled}
    >
      {Icon && <Icon width={16} height={16} />}
      <Text style={[styles.actionButtonText, isDisabled && styles.actionButtonTextDisabled]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function CreditLedgerDetails({
  item,
  isAdmin,
  onClearCredit,
  onViewInvoice,
}) {
  const {
    transactionType,
    creditType,
    reasonType,
    details = {},
    notes,
    processedBy,
    balanceAfter,
  } = item;

  const creditMeta = getCreditTypeMeta(creditType);
  const reasonMeta = REASON_TYPE_META[reasonType] || null;

  const plants = details.plants || [];

  const amountColor = item.amount < 0 ? '#F04438' : '#12B76A';
  const processedByName = processedBy?.name || null;

  const transactionNumber = item.transactionNumber || details?.order?.transactionNumber || null;

  const canClearCredit = isAdmin && transactionType === TRANSACTION_TYPES.EARNED && creditType === CREDIT_TYPES.PLANT;

  const transactionSection = (
    <Section title="Transaction">
      <LabeledRow label="Type" value={item.title} />
      {item.subtitle || reasonMeta ? <LabeledRow label="Reason" value={item.subtitle || reasonMeta?.label} /> : null}
      <LabeledRow label="Credit Type" value={creditMeta.label} />
      <LabeledRow
        label="Amount"
        value={formatCreditAmount(item.amount)}
        valueStyle={{ color: amountColor }}
      />
      <LabeledRow label="Date" value={formatDate(item.date)} />
      {processedByName ? <LabeledRow label="Processed By" value={processedByName} /> : null}
      {balanceAfter != null ? <LabeledRow label="Balance After" value={formatCreditAmount(balanceAfter).replace('+', '')} /> : null}
    </Section>
  );

  const verificationChildren = [];

  if (transactionNumber) {
    verificationChildren.push(
      <LabeledRow key="transactionNumber" label="Transaction #" value={transactionNumber} />
    );
  }

  const verificationSection = transactionNumber ? (
    <Section title="Verification">
      {verificationChildren}
      <View style={styles.actionGroup}>
        <ActionButton
          icon={BoxIcon}
          label="View Invoice"
          onPress={() => onViewInvoice && onViewInvoice({ transactionNumber })}
        />
      </View>
    </Section>
  ) : (
    <Section title="Verification">
      <Text style={styles.unavailableText}>Invoice not available.</Text>
    </Section>
  );

  let plantSection = null;
  if (plants.length > 0) {
    const visible = plants.slice(0, 3);
    const remaining = plants.length - visible.length;
    const plantRows = visible.map((plant, idx) => {
      const name = plant.plantName || plant.name || 'Plant';
      const qty = plant.quantity > 1 || plant.qty ? plant.quantity || plant.qty : null;
      return (
        <View key={idx} style={styles.plantRow}>
          <View style={[styles.plantDot, { backgroundColor: creditMeta.color }]} />
          <View style={styles.flex}>
            <Text style={styles.plantName}>{name}</Text>
            {qty ? <Text style={styles.plantQty}>Qty {qty}</Text> : null}
          </View>
        </View>
      );
    });

    plantSection = (
      <Section title="Plants">
        {plantRows}
        {remaining > 0 ? <Text style={styles.moreText}>+{remaining} more</Text> : null}
      </Section>
    );
  }

  const notesSection = notes ? (
    <Section title="Notes">
      <Text style={styles.notes}>{notes}</Text>
    </Section>
  ) : null;

  return (
    <View style={styles.container}>
      {transactionSection}
      {verificationSection}
      {plantSection}
      {notesSection}
      {canClearCredit && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => onClearCredit && onClearCredit(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.clearButtonText}>Clear Credit</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E4E7EC',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#98A2B3',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#475467',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#101828',
  },
  actionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F2F4F7',
    borderWidth: 1,
    borderColor: '#E4E7EC',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#344054',
  },
  actionButtonTextDisabled: {
    color: '#98A2B3',
  },
  flex: {
    flex: 1,
  },
  plantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  plantDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  plantName: {
    fontSize: 14,
    color: '#101828',
    fontWeight: '500',
  },
  plantQty: {
    fontSize: 12,
    color: '#475467',
    marginTop: 2,
  },
  moreText: {
    fontSize: 13,
    color: '#2E90FA',
    fontWeight: '500',
    marginTop: 4,
  },
  notes: {
    fontSize: 14,
    color: '#475467',
    lineHeight: 20,
  },
  unavailableText: {
    fontSize: 14,
    color: '#98A2B3',
    fontStyle: 'italic',
  },
  clearButton: {
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  clearButtonText: {
    color: '#F04438',
    fontSize: 14,
    fontWeight: '600',
  },
});
