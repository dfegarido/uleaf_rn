import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AvatarIcon from '../../assets/images/avatar.svg';

const ChatBubble = ({text, isMe, showAvatar }) => {
  return (
    <View style={[styles.row, isMe ? styles.rightAlign : styles.leftAlign, !isMe && showAvatar ? styles.rowReverseGap : {}]}>
      {!isMe && showAvatar && <AvatarIcon width={25} height={25} />}
      <View
        style={[
          showAvatar ? styles.withAvatar : styles.bubble,
          isMe ? styles.myBubble : styles.theirBubble
        ]}>
        <Text style={[isMe ? styles.myText : styles.text]}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 10,
    marginVertical: 4,
  },
  rightAlign: {
    justifyContent: 'flex-end',
  },
  leftAlign: {
    justifyContent: 'flex-start',
  },
  rowReverseGap: {  marginBottom: 10 },
  bubble: {
    padding: 10,
    borderRadius: 16,
    maxWidth: '70%',
  },
  myBubble: {
    backgroundColor: '#539461',
  },
  theirBubble: {
    backgroundColor: '#fff',
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
    maxWidth: '70%',
    marginLeft: 10,
  },
});

export default ChatBubble;
