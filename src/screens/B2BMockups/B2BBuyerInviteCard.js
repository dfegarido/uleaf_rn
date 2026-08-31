import React, {useEffect, useState} from 'react';
import {Alert, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {globalStyles} from '../../assets/styles/styles';
import {
  buildInviteUrl,
  getInviteCode,
  publishReferralCodeMapping,
  shareB2BBuyerInvite,
} from '../../utils/referralShare';

const B2BBuyerInviteCard = ({uid}) => {
  const [copied, setCopied] = useState(null);
  const inviteCode = getInviteCode(uid);
  const inviteUrl = buildInviteUrl(inviteCode);
  const ready = Boolean(uid) && inviteCode !== '------';

  useEffect(() => {
    if (ready) {
      publishReferralCodeMapping(uid, inviteCode, {source: 'usBusiness'});
    }
  }, [uid, inviteCode, ready]);

  const copy = async field => {
    const value = field === 'code' ? inviteCode : inviteUrl;
    try {
      await Clipboard.setString(value);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      Alert.alert('Could not copy', error?.message || 'Try Share instead.');
    }
  };

  if (!ready) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>Bring your own buyers</Text>
      <Text style={styles.title}>Share the app + your code</Text>
      <Text style={styles.body}>
        Instagram followers download ileafU and create an account with this code
        before you go live. That ties them to you as their referrer.
      </Text>

      <Text style={styles.label}>Create-account code</Text>
      <View style={styles.row}>
        <Text style={styles.code}>{inviteCode}</Text>
        <TouchableOpacity onPress={() => copy('code')} style={styles.copyBtn}>
          <Text style={styles.copyText}>{copied === 'code' ? 'Copied' : 'Copy'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Download / sign-up link</Text>
      <View style={styles.row}>
        <Text style={styles.link} numberOfLines={1}>
          {inviteUrl}
        </Text>
        <TouchableOpacity onPress={() => copy('link')} style={styles.copyBtn}>
          <Text style={styles.copyText}>{copied === 'link' ? 'Copied' : 'Copy'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[globalStyles.primaryButton, {marginTop: 14}]}
        onPress={() => shareB2BBuyerInvite(uid)}>
        <Text style={globalStyles.primaryButtonText}>Share app to download</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f2f7f3',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C0DAC2',
  },
  kicker: {
    color: '#356641',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  title: {fontWeight: '700', fontSize: 16, color: '#202325', marginBottom: 8},
  body: {color: '#556065', fontSize: 14, lineHeight: 20, marginBottom: 14},
  label: {color: '#7F8D91', fontSize: 12, marginBottom: 6, marginTop: 4},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E7E9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  code: {flex: 1, fontSize: 22, fontWeight: '700', letterSpacing: 2, color: '#202325'},
  link: {flex: 1, fontSize: 13, color: '#202325', marginRight: 8},
  copyBtn: {paddingLeft: 8},
  copyText: {color: '#356641', fontWeight: '700', fontSize: 13},
});

export default B2BBuyerInviteCard;
