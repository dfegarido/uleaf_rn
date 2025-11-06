import React from 'react';
import { View, Text, Pressable, TouchableOpacity, ActivityIndicator } from 'react-native';
import ShippingBuddiesIcon from './ShippingBuddiesIcon';
import styles from './styles/EmptyStateStyles';

/**
 * EmptyState - Shows empty state when user has no shipping buddy requests
 */
const EmptyState = ({
  receiverUsername,
  onUsernamePress,
  onSubmit,
  submitting,
}) => {
  return (
    <View style={styles.emptyStateContainer}>
      {/* Icon */}
      <View style={styles.iconSection}>
        <ShippingBuddiesIcon width={96} height={96} />
      </View>

      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.titleText}>
          Find Your Shipping Buddy
        </Text>
      </View>

      {/* Note */}
      <View style={styles.noteSection}>
        <Text style={styles.noteText}>
          Connect with another buyer to share shipping costs and save money on your plant orders.
        </Text>
        <Text style={styles.noteText}>
          When you find a shipping buddy, you can coordinate your orders to ship together.
        </Text>
      </View>

      {/* Address Input Section */}
      <View style={styles.addressSection}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Receiver Username</Text>
          <Pressable
            onPress={onUsernamePress}
            style={styles.inputPressable}>
            <View style={styles.textInput}>
              <Text
                style={[
                  styles.textInputText,
                  !receiverUsername && styles.textInputPlaceholder,
                ]}>
                {receiverUsername || 'Ex. @john123'}
              </Text>
            </View>
          </Pressable>
        </View>

        <TouchableOpacity
          style={[styles.createButton, (submitting || !receiverUsername) && styles.createButtonDisabled]}
          onPress={onSubmit}
          activeOpacity={0.8}
          disabled={submitting || !receiverUsername}>
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.createButtonText}>Submit a Receiver Request</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default EmptyState;

