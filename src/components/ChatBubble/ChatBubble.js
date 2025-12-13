import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import ListingMessage from '../../screens/ChatScreen/ListingMessage';

const DefaultAvatar = require('../../assets/images/AvatarBig.png');

const ChatBubble = ({ currentUserUid, isSeller=false, isBuyer=false, listingId, isListing = false, navigation, text, isMe, showAvatar, senderName, senderAvatarUrl, isGroupChat, isFirstInGroup, isLastInGroup }) => {
  // Show sender name for group chats, not from current user, only on first message of group
  const shouldShowSenderName = isGroupChat && !isMe && senderName && isFirstInGroup;
  
  // Determine border radius based on position in group
  const getBorderRadius = () => {
    if (isMe) {
      // For my messages: rounded on all corners except bottom-left if not last, and top-left if not first
      if (isFirstInGroup && isLastInGroup) {
        return 16; // Single message - fully rounded
      } else if (isFirstInGroup) {
        return { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomRightRadius: 16, borderBottomLeftRadius: 4 };
      } else if (isLastInGroup) {
        return { borderTopLeftRadius: 4, borderTopRightRadius: 16, borderBottomRightRadius: 16, borderBottomLeftRadius: 16 };
      } else {
        return { borderTopLeftRadius: 4, borderTopRightRadius: 16, borderBottomRightRadius: 16, borderBottomLeftRadius: 4 };
      }
    } else {
      // For their messages: rounded on all corners except bottom-right if not last, and top-right if not first
      if (isFirstInGroup && isLastInGroup) {
        return 16; // Single message - fully rounded
      } else if (isFirstInGroup) {
        return { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 4 };
      } else if (isLastInGroup) {
        return { borderTopLeftRadius: 4, borderTopRightRadius: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 };
      } else {
        return { borderTopLeftRadius: 4, borderTopRightRadius: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 4 };
      }
    }
  };

  const borderRadius = getBorderRadius();
  const marginBottom = isLastInGroup ? 4 : 2; // Less spacing between grouped messages

  // Get avatar source - use provided URL or fallback to default
  const getAvatarSource = () => {
    if (senderAvatarUrl && typeof senderAvatarUrl === 'string' && senderAvatarUrl.trim() !== '') {
      return { uri: senderAvatarUrl };
    }
    return DefaultAvatar;
  };

  return (
    <View style={[styles.row, isMe ? styles.rightAlign : styles.leftAlign, !isMe && showAvatar ? styles.rowReverseGap : {}]}>
      {!isMe && showAvatar && (
        <Image
          source={getAvatarSource()}
          style={styles.avatarImage}
          defaultSource={DefaultAvatar}
        />
      )}
      <View style={styles.bubbleContainer}>
        {shouldShowSenderName && (
          <Text style={[
            styles.senderName,
            // Align sender name with bubble's left edge
            showAvatar ? { marginLeft: 4 } : (!isMe ? { marginLeft: 35 } : {})
          ]}>{senderName}</Text>
        )}
        <View
          style={[
            showAvatar ? styles.withAvatar : styles.bubble,
            isMe ? styles.myBubble : styles.theirBubble,
            typeof borderRadius === 'number' ? { borderRadius } : borderRadius,
            { marginBottom },
            // Add left margin for receiver messages to align with avatar position (avatar width 25 + margin 10 = 35)
            !isMe && !showAvatar && { marginLeft: 35 }
          ]}>
          {!isListing && <Text style={[isMe ? styles.myText : styles.text]}>{text}</Text>}
          {isListing && (
            <ListingMessage currentUserUid={currentUserUid} isSeller={isSeller} isBuyer={isBuyer} listingId={listingId} navigation={navigation} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 10,
    marginVertical: 0, // Remove default margin, handled by marginBottom in bubble
  },
  rightAlign: {
    justifyContent: 'flex-end',
  },
  leftAlign: {
    justifyContent: 'flex-start',
  },
  rowReverseGap: {  marginBottom: 10 },
  bubbleContainer: {
    flexDirection: 'column',
    maxWidth: '70%',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
    marginLeft: 0, // Left aligned
    paddingHorizontal: 0,
    textAlign: 'left',
  },
  bubble: {
    padding: 10,
    borderRadius: 16,
    maxWidth: '100%',
  },
  myBubble: {
    backgroundColor: '#539461',
  },
  theirBubble: {
    backgroundColor: '#E5E5E5',
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  text: {
    color: '#000',
  },
  myText: {
    color: '#fff',
  },
  withAvatar: {
    padding: 10,
    borderRadius: 16,
    maxWidth: '100%',
    marginLeft: 4, // Reduced from 10 to minimize gap
  },
  avatarImage: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    marginRight: 4, // Reduced from 10 to minimize gap
    backgroundColor: '#f0f0f0',
  },
});

export default ChatBubble;
