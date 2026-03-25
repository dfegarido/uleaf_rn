import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Share from 'react-native-share';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import Svg, { Path } from 'react-native-svg';
import { AuthContext } from '../../../auth/AuthProvider';
import { db } from '../../../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getReferralInfoApi } from '../../../components/Api/referralApi';

const InfoIcon = ({ width = 20, height = 20, fill = '#393D40' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
      stroke={fill}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M12 16V12" stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 8H12.01" stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const GiftIcon = ({width = 96, height = 96}) => (
  <Svg width={width} height={height} viewBox="0 0 96 96" fill="none">
    <Path d="M67.4825 57.6106C66.0146 55.6165 63.357 55.0025 61.163 56.1513L42.501 65.9223C41.9268 66.2229 41.6323 66.8761 41.787 67.5054C41.9418 68.1346 42.5058 68.5767 43.1536 68.5767H58.7698C59.0036 68.5767 59.234 68.5184 59.4395 68.407L65.8424 64.9419C67.1098 64.256 68.0171 63.056 68.3315 61.6497C68.6463 60.2431 68.3368 58.771 67.4825 57.6106Z" fill="#F7B081"/>
    <Path d="M58.77 68.5761C59.0038 68.5761 59.2343 68.5178 59.4398 68.4064L65.8427 64.9412C67.11 64.2553 68.0173 63.0553 68.3318 61.6491C68.58 60.5391 68.4379 59.3888 67.9476 58.3821L49.4492 68.5761H58.77Z" fill="#DB9975"/>
    <Path d="M77.382 60.7186C76.0455 58.5134 73.2219 57.7473 70.9537 58.9743L58.0991 65.9313C57.5323 66.2379 57.2463 66.89 57.4046 67.5148C57.5628 68.1393 58.1248 68.5768 58.769 68.5768H61.9747C63.3129 68.5768 64.4017 69.6654 64.4017 71.0036C64.4017 71.4965 64.6595 71.9536 65.0816 72.2084C65.3049 72.3433 65.5567 72.4111 65.8091 72.4111C66.0337 72.4111 66.2589 72.3573 66.4644 72.2491L75.5006 67.4951C76.6738 66.8776 77.5501 65.7909 77.9051 64.5134C78.2598 63.2358 78.0693 61.8526 77.382 60.7186Z" fill="#F7B081"/>
    <Path d="M77.9089 64.5135C78.2638 63.2359 78.0731 61.8529 77.386 60.7189C77.3271 60.6219 77.2645 60.5286 77.2 60.4373L62.5176 68.6394C63.5968 68.8854 64.4055 69.8513 64.4055 71.0038C64.4055 71.4968 64.6633 71.9539 65.0854 72.2087C65.3087 72.3435 65.5605 72.4114 65.8129 72.4114C66.0375 72.4114 66.2627 72.3576 66.4682 72.2494L75.5044 67.4953C76.6776 66.8775 77.554 65.7908 77.9089 64.5135Z" fill="#DB9975"/>
    <Path d="M87.6555 62.6724C86.2474 60.7044 83.5706 60.0701 81.4286 61.1967L65.1568 69.7576C64.6943 70.0008 64.4048 70.4806 64.4048 71.0034C64.4048 72.2231 63.4924 73.2581 62.2821 73.4111L38.4264 76.4272C37.7213 76.5163 37.1933 77.117 37.1953 77.8276C37.1976 78.5382 37.7289 79.136 38.4349 79.2207L48.5664 80.4399C50.4525 80.6668 52.3363 80.7796 54.2106 80.7796C62.0882 80.7796 69.7958 78.7882 76.7771 74.9139L86.0582 69.7633C87.271 69.0905 88.1411 67.9288 88.4458 66.5758C88.7505 65.2229 88.4623 63.8 87.6555 62.6724Z" fill="#F7B081"/>
    <Path d="M76.7768 74.9138L86.0578 69.7631C87.2706 69.0904 88.1408 67.9286 88.4454 66.5756C88.7001 65.4445 88.5388 64.2649 88.008 63.2494L64.6746 75.9253C64.6746 75.9253 60.7307 75.2449 59.5851 75.1984C59.1548 75.181 54.2548 75.1766 48.3041 75.178L38.4264 76.4269C37.7213 76.516 37.1933 77.1167 37.1953 77.8273C37.1976 78.538 37.7289 79.1357 38.4349 79.2205L48.5664 80.4396C50.4525 80.6665 52.3363 80.7793 54.2106 80.7793C62.088 80.7795 69.7954 78.7879 76.7768 74.9138Z" fill="#DB9975"/>
    <Path d="M65.8296 45.4827C65.5866 45.3205 59.8208 41.5339 54.5518 43.2625C51.4429 44.2825 49.3328 46.9515 48.1041 49.0255C46.8754 46.9517 44.7653 44.2825 41.6562 43.2625C36.3876 41.5341 30.6216 45.3205 30.3786 45.4827C29.8392 45.8427 29.6153 46.5244 29.8365 47.134C29.9361 47.4083 32.3385 53.8748 37.6075 55.6034C38.5827 55.9232 39.5747 56.0543 40.5462 56.0543C43.756 56.0543 46.7346 54.6231 48.1039 53.854C49.4728 54.6233 52.4515 56.0543 55.6617 56.0543C56.6325 56.0543 57.6254 55.9232 58.6004 55.6034C63.8693 53.8748 66.2715 47.4083 66.3713 47.134C66.5929 46.5244 66.3692 45.8427 65.8296 45.4827Z" fill="#8ACC19"/>
    <Path d="M65.8292 45.4827C65.8204 45.4767 65.8019 45.4645 65.7784 45.4493C64.7702 47.5068 62.4522 51.3003 58.6003 52.5638C57.6255 52.8835 56.6327 53.0148 55.6617 53.0148C52.4515 53.0148 49.4729 51.5836 48.1039 50.8143C46.7348 51.5836 43.756 53.0146 40.5462 53.0148C39.5749 53.0148 38.5829 52.8837 37.6075 52.5638C33.7557 51.3001 31.4376 47.507 30.4294 45.4493C30.406 45.4645 30.3874 45.4767 30.3786 45.4827C29.8392 45.8427 29.6153 46.5245 29.8365 47.134C29.9361 47.4083 32.3385 53.8748 37.6075 55.6034C38.5827 55.9233 39.5747 56.0543 40.5462 56.0543C43.756 56.0543 46.7346 54.6232 48.1039 53.854C49.4729 54.6233 52.4515 56.0543 55.6617 56.0543C56.6325 56.0543 57.6253 55.9233 58.6003 55.6034C63.8693 53.8748 66.2715 47.4083 66.3713 47.134C66.5925 46.5245 66.3689 45.8427 65.8292 45.4827Z" fill="#79AF10"/>
    <Path d="M48.1157 60.2514C47.3385 60.2514 46.7089 59.6218 46.7083 58.8448L46.6973 40.9249C46.6967 40.1475 47.3267 39.5171 48.1037 39.5167C48.1041 39.5167 48.1046 39.5167 48.1046 39.5167C48.8818 39.5167 49.5115 40.1463 49.512 40.9233L49.5231 58.8431C49.5236 59.6205 48.8938 60.251 48.1166 60.2512C48.1163 60.2514 48.1157 60.2514 48.1157 60.2514Z" fill="#739B10"/>
    <Path d="M72.8363 74.9327C60.9107 60.4716 52.8041 57.4362 48.1033 57.4362C43.9924 57.4362 39.2246 59.6687 33.9332 64.0723C33.4948 64.4372 33.3197 65.0303 33.4901 65.5746C33.6606 66.1187 34.1424 66.5065 34.7106 66.5565C39.3613 66.9645 42.6456 68.4062 42.6782 68.4207C42.8589 68.5013 43.0545 68.5431 43.2523 68.5431H62.097C63.4378 68.5431 64.5285 69.634 64.5285 70.9746C64.5285 72.1967 63.6143 73.2336 62.4019 73.3868L38.517 76.4065C37.8118 76.4955 37.2838 77.0963 37.2859 77.8069C37.2879 78.5175 37.8195 79.1151 38.5254 79.2L48.6696 80.4207C50.5174 80.643 52.3738 80.7535 54.228 80.7535C60.4102 80.7535 66.5666 79.5257 72.2944 77.1263C72.7052 76.9542 73.0103 76.5981 73.1171 76.1659C73.2236 75.7335 73.1198 75.2762 72.8363 74.9327Z" fill="#AA5D24"/>
    <Path d="M72.837 74.9327C60.9115 60.4716 52.8049 57.4362 48.1041 57.4362C46.7233 57.4362 45.2681 57.6893 43.7441 58.1907C47.4596 59.4103 52.3264 62.3361 58.4222 68.5427H62.0976C63.4384 68.5427 64.5291 69.6336 64.5291 70.9742C64.5291 72.0673 63.7967 73.0103 62.7746 73.3073C63.2245 73.8328 63.6795 74.3732 64.1408 74.9325C64.312 75.1399 65.7643 77.2669 66.8653 79.015C68.7081 78.4986 70.5223 77.8688 72.295 77.1261C72.7058 76.954 73.0108 76.5979 73.1177 76.1657C73.2244 75.7335 73.1205 75.2762 72.837 74.9327Z" fill="#8E4821"/>
    <Path d="M94.9119 66.9209C93.3158 64.808 90.4558 64.1701 88.1128 65.4035C88.1036 65.4084 88.0944 65.4133 88.0853 65.4183L75.4095 72.4526C67.6611 76.7525 58.9592 78.5831 50.1699 77.7796L62.6334 76.2039C65.247 75.8733 67.2178 73.6378 67.2178 71.0034C67.2178 68.1133 64.8664 65.7616 61.9761 65.7616H43.4398C41.9484 65.1523 35.0929 62.6334 26.9903 64.1394C19.1754 65.5921 12.7768 70.3085 11.1173 71.6186H1.40738C0.63 71.6186 0 72.2488 0 73.0259V91.6299C0 92.4073 0.630188 93.0373 1.40738 93.0373H11.5526L43.4548 95.8801C44.1754 95.9443 44.8941 95.975 45.6131 95.975C54.7609 95.9746 63.7631 90.9929 71.7728 86.5599C72.7459 86.0214 73.7072 85.4894 74.6546 84.9738L93.1901 74.8908C94.5673 74.1416 95.5472 72.833 95.8781 71.3004C96.2094 69.7683 95.8571 68.1718 94.9119 66.9209Z" fill="#FFC89F"/>
    <Path d="M93.1903 69.5771L74.6548 79.6601C73.7072 80.1756 72.7459 80.7077 71.7729 81.2462C63.7629 85.6793 54.7611 90.6608 45.6133 90.6613C44.8943 90.6613 44.1756 90.6306 43.455 90.5664L11.5526 87.7234H1.40738C0.63 87.7234 0 87.0932 0 86.3158V91.6294C0 92.4068 0.630188 93.0368 1.40738 93.0368H11.5526L43.4548 95.8796C44.1754 95.9438 44.8941 95.9745 45.6131 95.9745C54.7609 95.9741 63.7631 90.9924 71.7728 86.5594C72.7459 86.0209 73.7072 85.4889 74.6546 84.9733L93.1901 74.8903C94.5673 74.1411 95.5472 72.8325 95.8781 71.2999C96.1592 69.9979 95.9456 68.6505 95.2958 67.5073C94.806 68.3711 94.0823 69.0919 93.1903 69.5771Z" fill="#F7B081"/>
    <Path d="M48.1063 0.0249023C36.4423 0.0249023 26.9531 9.51428 26.9531 21.1781C26.9531 32.8419 36.4423 42.3313 48.1063 42.3313C59.7703 42.3313 69.2595 32.8419 69.2595 21.1781C69.2595 9.51428 59.7703 0.0249023 48.1063 0.0249023Z" fill="#FFD039"/>
    <Path d="M48.1041 0.0249023C47.3681 0.0249023 46.6406 0.0629648 45.9238 0.13684C56.5673 1.23165 64.8968 10.2504 64.8968 21.1785C64.8968 32.1065 56.5675 41.1253 45.9238 42.2201C46.6406 42.2938 47.3681 42.332 48.1041 42.332C59.7681 42.332 69.2573 32.8427 69.2573 21.1788C69.2573 9.51503 59.7681 0.0249023 48.1041 0.0249023Z" fill="#FFAE47"/>
    <Path d="M48.1058 35.35C55.9329 35.35 62.278 29.0049 62.278 21.1778C62.278 13.3507 55.9329 7.00562 48.1058 7.00562C40.2787 7.00562 33.9336 13.3507 33.9336 21.1778C33.9336 29.0049 40.2787 35.35 48.1058 35.35Z" fill="#F99608"/>
    <Path d="M48.4005 19.7639C47.5088 19.6884 46.8983 19.4216 46.5865 18.971C46.2578 18.4966 46.2372 17.8267 46.2779 17.3484C46.3249 16.7917 46.5494 16.3141 46.9101 16.0036C47.3376 15.635 47.983 15.476 48.7752 15.5431C49.9641 15.6438 50.4194 17.273 50.4212 17.2794C50.613 18.0326 51.3784 18.4878 52.1325 18.2962C52.8857 18.1046 53.341 17.3384 53.1494 16.5851C53.1265 16.4951 52.9092 15.6806 52.3508 14.8331C51.6274 13.7349 50.6535 13.0432 49.513 12.8101V11.4104C49.513 10.6331 48.883 10.0031 48.1056 10.0031C47.328 10.0031 46.698 10.6332 46.698 11.4104V12.9717C45.9839 13.2005 45.4491 13.547 45.0726 13.8714C44.151 14.6658 43.5827 15.8161 43.4732 17.1108C43.3592 18.4567 43.6356 19.6542 44.2727 20.5741C44.8319 21.3813 45.9604 22.3824 48.1632 22.5691C50.5054 22.7679 50.6854 23.8634 50.6168 24.6702C50.5641 25.2931 50.3119 25.8706 49.9247 26.255C49.4837 26.693 48.8667 26.882 48.0908 26.816C46.3677 26.6699 45.4742 24.9147 45.4474 24.8613C45.1142 24.1636 44.2793 23.8649 43.579 24.194C42.8755 24.5246 42.5729 25.3627 42.9034 26.0664C42.9582 26.1836 44.1289 28.613 46.6982 29.3984V30.9464C46.6982 31.7238 47.3282 32.3538 48.1056 32.3538C48.883 32.3538 49.513 31.7236 49.513 30.9464V29.5312C50.625 29.3007 51.4041 28.7523 51.9079 28.2522C52.774 27.3922 53.3115 26.2046 53.4216 24.908C53.6134 22.6434 52.3951 20.1029 48.4005 19.7639Z" fill="#FFD039"/>
  </Svg>
);

const CopyIcon = ({width = 18, height = 18, fill = '#539461'}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path fillRule="evenodd" clipRule="evenodd" d="M7.5 3.75C7.5 3.33579 7.83579 3 8.25 3H20.25C20.6642 3 21 3.33579 21 3.75V15.75C21 16.1642 20.6642 16.5 20.25 16.5H16.5V20.25C16.5 20.6642 16.1642 21 15.75 21H3.75C3.33579 21 3 20.6642 3 20.25V8.25C3 7.83579 3.33579 7.5 3.75 7.5H7.5V3.75ZM4.5 9V19.5H15V9H4.5ZM16.5 15V8.25C16.5 7.83579 16.1642 7.5 15.75 7.5H9V4.5H19.5V15H16.5Z" fill={fill}/>
  </Svg>
);

const ShareIcon = ({width = 18, height = 18, fill = '#FFFFFF'}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path d="M4 12V20C4 20.5523 4.44772 21 5 21H19C19.5523 21 20 20.5523 20 20V12" stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M12 3L12 15M12 3L8 7M12 3L16 7" stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CheckIcon = ({width = 18, height = 18}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path d="M5 13L9 17L19 7" stroke="#539461" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const getInviteCode = (uid) => {
  if (!uid) return '------';
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash << 5) - hash + uid.charCodeAt(i);
    hash |= 0;
  }
  return String(Math.abs(hash) % 1000000).padStart(6, '0');
};

// Mock referral data for rorounifix@gmail.com (UI preview / testing)
const MOCK_REFERRAL_DATA = {
  statistics: {
    totalReferred: 5,
    successfulReferrals: 3,
    totalRewardsEarned: 60,
    availableBalance: 60,
    redeemedBalance: 0,
    ordersWithZeroFees: 2,
  },
  recentReferrals: [
    { id: 'ref1', refereeEmail: 'luffy.plant@example.com', status: 'completed', rewardAmount: 20, rewardCurrency: 'leaf_coins', createdAt: null, completedAt: null },
    { id: 'ref2', refereeEmail: 'zoro.moss@example.com', status: 'completed', rewardAmount: 20, rewardCurrency: 'leaf_coins', createdAt: null, completedAt: null },
    { id: 'ref3', refereeEmail: 'nami.fern@example.com', status: 'completed', rewardAmount: 20, rewardCurrency: 'leaf_coins', createdAt: null, completedAt: null },
    { id: 'ref4', refereeEmail: 'sanji.herb@example.com', status: 'pending', rewardAmount: null, rewardCurrency: null, createdAt: null, completedAt: null },
    { id: 'ref5', refereeEmail: 'chopper.bonsai@example.com', status: 'pending', rewardAmount: null, rewardCurrency: null, createdAt: null, completedAt: null },
  ],
  availableRewards: [
    { id: 'r1', rewardType: 'leaf_coins', amount: 20, currency: 'leaf_coins', description: 'Referral reward', createdAt: null },
    { id: 'r2', rewardType: 'leaf_coins', amount: 20, currency: 'leaf_coins', description: 'Referral reward', createdAt: null },
    { id: 'r3', rewardType: 'leaf_coins', amount: 20, currency: 'leaf_coins', description: 'Referral reward', createdAt: null },
  ],
};

const InviteFriendsScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { userInfo } = useContext(AuthContext);

  // Track which row was just copied for visual feedback
  const [copiedField, setCopiedField] = useState(null); // 'code' | 'link' | null

  // Your referrals stats
  const [referralStats, setReferralStats] = useState(null);
  const [referralLoading, setReferralLoading] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const uid = userInfo?.uid || userInfo?.user?.uid || '';
  const inviteCode = getInviteCode(uid);
  const inviteUrl = `https://ileafu.com/refer?code=${inviteCode}`;
  const inviteMessage = `Join ileafU — the best app for rare plant lovers!\n\nWhen you buy your first plant, you get 20 Leaf Coins and I earn 20 Leaf Points!\n\nUse my link: ${inviteUrl}\nOr enter my code: ${inviteCode}`;

  // Save invite code -> UID mapping so the backend can resolve referrals
  useEffect(() => {
    if (uid && inviteCode && inviteCode !== '------') {
      setDoc(doc(db, 'referralCodes', inviteCode), { uid }, { merge: true }).catch(() => {});
    }
  }, [uid, inviteCode]);

  // Fetch referral stats on mount (use mock data for rorounifix@gmail.com)
  const userEmail = userInfo?.email || userInfo?.user?.email || userInfo?.data?.email || '';
  const useMockReferrals = userEmail === 'rorounifix@gmail.com';

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setReferralLoading(true);
      if (useMockReferrals) {
        // Use mock data for preview
        if (!cancelled) {
          setReferralStats(MOCK_REFERRAL_DATA);
        }
      } else {
        const res = await getReferralInfoApi();
        if (!cancelled && res.success && res.data) {
          setReferralStats(res.data);
        } else if (!cancelled) {
          setReferralStats({
            statistics: {
              totalReferred: 0,
              successfulReferrals: 0,
              totalRewardsEarned: 0,
              availableBalance: 0,
            },
            recentReferrals: [],
          });
        }
      }
      if (!cancelled) setReferralLoading(false);
    };
    if (uid) load();
    return () => { cancelled = true; };
  }, [uid, useMockReferrals]);

  const handleCopy = async (field) => {
    const content = field === 'code' ? inviteCode : inviteUrl;
    try {
      if (field === 'code') {
        // Copy invite code only (no URL preview cards).
        await Share.open({ message: content, title: 'ileafU' });
      } else {
        // Copy invite link, but force the visible title text.
        // This prevents iOS from showing stale web-page preview title like "Join I Leaf U".
        await Share.open({
          url: content,
          title: 'Join ileafU',
          message: 'Join ileafU',
        });
      }
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2500);
    } catch (error) {
      if (error?.message !== 'User did not share') {
        Alert.alert('Error', 'Could not copy. Please try again.');
      }
    }
  };

  const handleShare = async () => {
    try {
      await Share.open({
        message: inviteMessage,
        url: inviteUrl,
        title: 'Join ileafU',
      });
    } catch (error) {
      if (error?.message !== 'User did not share') {
        Alert.alert('Error', 'Could not open share sheet. Please try again.');
      }
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <LeftIcon width={24} height={24} fill="#393D40" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite Friends</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        {/* Your referrals */}
        <View style={styles.referralsSection}>
          <View style={styles.referralsHeader}>
            <Text style={styles.referralsTitle}>Your referrals</Text>
            <TouchableOpacity
              onPress={() => Alert.alert(
                'Referral rewards',
                'Invite friends to iLeafU. When they buy their first plant: they get 20 Leaf Coins, you earn 20 Leaf Points.',
                [{ text: 'OK' }],
              )}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.infoBtn}>
              <InfoIcon width={20} height={20} />
            </TouchableOpacity>
          </View>

          {referralLoading ? (
            <ActivityIndicator size="small" color="#539461" style={styles.referralLoader} />
          ) : (
            <>
              <View style={styles.metricsRow}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricValue}>
                    {referralStats?.statistics?.availableBalance ?? referralStats?.statistics?.totalRewardsEarned ?? 0}
                  </Text>
                  <Text style={styles.metricLabel}>Leaf Points earned</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricValue}>{referralStats?.statistics?.ordersWithZeroFees ?? 0}</Text>
                  <Text style={styles.metricLabel}>Orders with 0 selling fees</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricValue}>{referralStats?.statistics?.successfulReferrals ?? 0}</Text>
                  <Text style={styles.metricLabel}>Completed referrals</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricValue}>
                    {Math.max(0, (referralStats?.statistics?.totalReferred ?? 0) - (referralStats?.statistics?.successfulReferrals ?? 0))}
                  </Text>
                  <Text style={styles.metricLabel}>Pending referrals</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.historyButton}
                onPress={() => setShowHistoryModal(true)}
                activeOpacity={0.85}>
                <Text style={styles.historyButtonText}>View Referral History</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Icon */}
        <View style={styles.iconSection}>
          <GiftIcon width={88} height={88} />
        </View>

        {/* Title */}
        <Text style={styles.titleText}>
          Grow the Jungle 🌿
        </Text>

        {/* Description */}
        <Text style={styles.noteText}>
          Invite friends to iLeafU. When your friend buys their first plant:{'\n'}
          🌱 They get 20 Leaf Coins{'\n'}
          🍃 You earn 20 Leaf Points
        </Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Invite Code Row */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Your Invite Code</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldValue} numberOfLines={1} ellipsizeMode="middle">
              {inviteCode || '—'}
            </Text>
            <TouchableOpacity
              style={styles.copyBtn}
              onPress={() => handleCopy('code')}
              activeOpacity={0.7}>
              {copiedField === 'code' ? (
                <CheckIcon width={16} height={16} />
              ) : (
                <CopyIcon width={16} height={16} fill="#539461" />
              )}
              <Text style={styles.copyBtnText}>
                {copiedField === 'code' ? 'Copied!' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Invite Link Row */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Your Invite Link</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldValueSmall} numberOfLines={1} ellipsizeMode="middle">
              {inviteUrl}
            </Text>
            <TouchableOpacity
              style={styles.copyBtn}
              onPress={() => handleCopy('link')}
              activeOpacity={0.7}>
              {copiedField === 'link' ? (
                <CheckIcon width={16} height={16} />
              ) : (
                <CopyIcon width={16} height={16} fill="#539461" />
              )}
              <Text style={styles.copyBtnText}>
                {copiedField === 'link' ? 'Copied!' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Share Button */}
        <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.85}>
          <ShareIcon width={18} height={18} fill="#FFFFFF" />
          <Text style={styles.shareButtonText}>Share via WhatsApp, SMS, Email…</Text>
        </TouchableOpacity>

        {/* How it works */}
        <View style={styles.stepsSection}>
          <Text style={styles.stepsTitle}>How it works</Text>

          <View style={styles.step}>
            <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>1</Text></View>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>Copy your invite link</Text>
              <Text style={styles.stepDesc}>Share it with friends.</Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>2</Text></View>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>Friend signs up</Text>
              <Text style={styles.stepDesc}>They create an account using your link or code.</Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>3</Text></View>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeading}>First purchase unlocks rewards</Text>
              <Text style={styles.stepDesc}>When they buy their first plant: they get 20 Leaf Coins, you earn 20 Leaf Points.</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Referral History Modal */}
      <Modal
        visible={showHistoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHistoryModal(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowHistoryModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Referral History</Text>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {(referralStats?.recentReferrals ?? []).length === 0 ? (
                <Text style={styles.modalEmpty}>No referrals yet. Share your link to invite friends!</Text>
              ) : (
                (referralStats?.recentReferrals ?? []).map((r) => (
                  <View key={r.id} style={styles.modalRow}>
                    <Text style={styles.modalEmail} numberOfLines={1}>{r.refereeEmail}</Text>
                    <Text style={[styles.modalStatus, r.status === 'completed' && styles.modalStatusCompleted]}>
                      {r.status || 'pending'}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowHistoryModal(false)}
              activeOpacity={0.85}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    height: 52,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: '#202325',
    flex: 1,
  },
  headerSpacer: {
    width: 32,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  referralsSection: {
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#F8FAF8',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EAF3EC',
  },
  referralsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  referralsTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
  },
  infoBtn: {
    padding: 4,
  },
  referralLoader: {
    paddingVertical: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  metricBox: {
    width: '50%',
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  metricValue: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 22,
    lineHeight: 28,
    color: '#202325',
  },
  metricLabel: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    color: '#5A6169',
    marginTop: 2,
  },
  historyButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D6E4D8',
  },
  historyButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 15,
    color: '#539461',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    marginBottom: 16,
  },
  modalList: {
    maxHeight: 240,
    marginBottom: 16,
  },
  modalEmpty: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 15,
    color: '#5A6169',
    textAlign: 'center',
    paddingVertical: 24,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEDED',
  },
  modalEmail: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    color: '#202325',
    flex: 1,
    marginRight: 12,
  },
  modalStatus: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 12,
    color: '#8A9299',
    textTransform: 'capitalize',
  },
  modalStatusCompleted: {
    color: '#539461',
  },
  modalCloseBtn: {
    backgroundColor: '#539461',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCloseText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 15,
    color: '#FFFFFF',
  },
  iconSection: {
    paddingTop: 20,
    paddingBottom: 8,
  },
  titleText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 26,
    lineHeight: 34,
    color: '#202325',
    marginTop: 8,
    marginBottom: 12,
  },
  noteText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 15,
    lineHeight: 22,
    color: '#5A6169',
    marginBottom: 4,
  },
  
  divider: {
    height: 1,
    backgroundColor: '#EAEDED',
    marginVertical: 24,
  },
  fieldSection: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 13,
    lineHeight: 18,
    color: '#8A9299',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F7F4',
    borderWidth: 1,
    borderColor: '#D6E4D8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  fieldValue: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 1,
  },
  fieldValueSmall: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 18,
    color: '#393D40',
    flex: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D6E4D8',
  },
  copyBtnText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 13,
    color: '#539461',
  },
  shareButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 15,
    backgroundColor: '#539461',
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 32,
  },
  shareButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 15,
    color: '#FFFFFF',
  },
  stepsSection: {
    gap: 20,
  },
  stepsTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    marginBottom: 4,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EAF3EC',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepBadgeText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 14,
    color: '#539461',
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepHeading: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: '#202325',
  },
  stepDesc: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 18,
    color: '#5A6169',
    marginTop: 2,
  },
});

export default InviteFriendsScreen;
