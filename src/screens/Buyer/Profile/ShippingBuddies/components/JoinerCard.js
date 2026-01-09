import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import styles from './styles/JoinerCardStyles';

/**
 * JoinerCard - Displays a single joiner with their info and action buttons
 */
const JoinerCard = ({
  joiner,
  onApprove,
  onReject,
  formatExpirationDate,
}) => {
  const [imageError, setImageError] = React.useState(false);

  // Reset image error when joiner changes
  React.useEffect(() => {
    setImageError(false);
    if (joiner) {
      console.log('[JoinerCard] Joiner data:', {
        requesterUid: joiner.requesterUid,
        firstName: joiner.firstName,
        lastName: joiner.lastName,
        username: joiner.username,
        profileImage: joiner.profileImage,
      });
    }
  }, [joiner]);

  const getInitials = () => {
    const first = joiner.firstName?.[0] || '';
    const last = joiner.lastName?.[0] || '';
    const username = joiner.username?.[0] || joiner.requesterUsername?.[0] || '';
    return (first + last || username || 'U').toUpperCase();
  };

  const getDisplayName = () => {
    const fullName = `${joiner.firstName || ''} ${joiner.lastName || ''}`.trim();
    return fullName || 'Unknown User';
  };

  const getDisplayUsername = () => {
    return `@${joiner.username || joiner.requesterUsername || 'unknown'}`;
  };

  return (
    <View style={styles.joinerCard}>
      <View style={styles.joinerUserCard}>
        {/* Avatar */}
        <View style={styles.joinerAvatarContainer}>
          <View style={styles.joinerAvatar}>
            {joiner.profileImage && !imageError ? (
              <Image
                source={{ uri: joiner.profileImage }}
                style={styles.joinerAvatarImage}
                resizeMode="cover"
                onError={(error) => {
                  console.log('[JoinerCard] Failed to load joiner profile image:', {
                    requesterUid: joiner.requesterUid,
                    url: joiner.profileImage,
                    error: error.nativeEvent.error
                  });
                  setImageError(true);
                }}
                onLoad={() => {
                  console.log('[JoinerCard] Successfully loaded joiner profile image:', joiner.requesterUid);
                }}
              />
            ) : (
              <View style={styles.joinerAvatarPlaceholder}>
                <Text style={styles.joinerAvatarText}>{getInitials()}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Content */}
        <View style={styles.joinerContent}>
          {/* Name and Username */}
          <View style={styles.joinerNameRow}>
            <Text style={styles.joinerName} numberOfLines={2} ellipsizeMode="tail">
              {getDisplayName()}
            </Text>
            <Text style={styles.joinerUsername} numberOfLines={1} ellipsizeMode="tail">
              {getDisplayUsername()}
            </Text>
          </View>

          {/* Expiration Date (receiver's latest flight date) */}
          {joiner.expirationDate && (
            <View style={styles.expirationDateRow}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M7.5 1.5C7.91421 1.5 8.25 1.83579 8.25 2.25V3H15.75V2.25C15.75 1.83579 16.0858 1.5 16.5 1.5C16.9142 1.5 17.25 1.83579 17.25 2.25V3H19.5C20.3284 3 21 3.67157 21 4.5V19.5C21 20.3284 20.3284 21 19.5 21H4.5C3.67157 21 3 20.3284 3 19.5V4.5C3 3.67157 3.67157 3 4.5 3H6.75V2.25C6.75 1.83579 7.08579 1.5 7.5 1.5ZM6.75 4.5H4.5V7.5H19.5V4.5H17.25V5.25C17.25 5.66421 16.9142 6 16.5 6C16.0858 6 15.75 5.66421 15.75 5.25V4.5H8.25V5.25C8.25 5.66421 7.91421 6 7.5 6C7.08579 6 6.75 5.66421 6.75 5.25V4.5ZM19.5 9H4.5V19.5H19.5V9Z"
                  fill="#556065"
                />
              </Svg>
              <Text style={styles.expirationDateText}>
                {formatExpirationDate(joiner.expirationDate)}
              </Text>
            </View>
          )}

          {/* Request Section (only for pending and pending_cancel, not approved) */}
          {joiner.status === 'pending_cancel' ? (
            <View style={styles.requestSectionCancel}>
              <Text style={styles.requestLabelCancel}>Request to cancel</Text>
              <View style={styles.iconButtonsRow}>
                <TouchableOpacity
                  style={styles.iconButtonApprove}
                  onPress={() => onApprove(joiner.requestId)}
                  activeOpacity={0.8}>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"
                      fill="#FFFFFF"
                    />
                  </Svg>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButtonReject}
                  onPress={() => onReject(joiner.requestId)}
                  activeOpacity={0.8}>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
                      fill="#FFFFFF"
                    />
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>
          ) : joiner.status === 'pending' ? (
            <View style={styles.requestSection}>
              <Text style={styles.requestLabel}>Request to join</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() => onApprove(joiner.requestId)}
                  activeOpacity={0.8}>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"
                      fill="#FFFFFF"
                    />
                  </Svg>
                  <Text style={styles.approveButtonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => onReject(joiner.requestId)}
                  activeOpacity={0.8}>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
                      fill="#FFFFFF"
                    />
                  </Svg>
                  <Text style={styles.rejectButtonText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default JoinerCard;

