import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AvatarIcon from '../../assets/images/avatar.svg';

const ChatBubble = ({text, isMe, showAvatar }) => {
  return (
    <View style={[styles.row, isMe ? styles.rowReverse : {}, !isMe && showAvatar ? styles.rowReverseGap : {}]}>
      {!isMe && showAvatar && <AvatarIcon width={25} height={25} />}
      <View
        style={[
          showAvatar ? styles.withAvatar : styles.bubble,
          isMe ? styles.myBubble : styles.theirBubble
        ]}>
        <Text style={[isMe ? styles.myText : styles.text]}>{text}</Text>
      </View>
      {isMe}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 10,
    marginVertical: 1,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  rowReverseGap: {  marginBottom: 10 },
  bubble: {
    padding: 10,
    borderRadius: 16,
    maxWidth: '70%',
    marginLeft: 33,
  },
  myBubble: {
    backgroundColor: '#5ca15c',
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
