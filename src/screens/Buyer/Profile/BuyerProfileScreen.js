import React, {useContext, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import {useSafeAreaInsets, SafeAreaView} from 'react-native-safe-area-context';
import {AuthContext} from '../../../auth/AuthProvider';
import Svg, {Path} from 'react-native-svg';
import {useIsFocused} from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';
import {
  getBuyerProfileApi,
  getAddressBookEntriesApi,
  deactivateBuyerApi,
} from '../../../components/Api';
import {deleteUserApi} from '../../../components/Api';

// Import icons (you'll need to add these to your assets)
import ProfileIcon from '../../../assets/icons/greydark/profile.svg';
import PasswordIcon from '../../../assets/icons/greydark/lock-key-regular.svg';
import ReportIcon from '../../../assets/icons/greydark/question-regular.svg';
import ChatIcon from '../../../assets/icons/greydark/chat-circle-dots-regular.svg';
import EnvelopeIcon from '../../../assets/icons/greydark/envelope.svg';
import RightIcon from '../../../assets/icons/greydark/caret-right-regular.svg';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import AvatarIcon from '../../../assets/buyer-icons/avatar.svg';
import TrashIcon from '../../../assets/icons/red/trash.svg';
import { useNavigation } from '@react-navigation/native';

// Custom Shipping Credits Icon Component (from Figma SVG)
const ShippingCreditsIcon = ({width = 24, height = 24, fill = "white"}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18.7499 13.5H11.5593L13.6602 11.3991C14.4198 11.7816 15.2567 11.9855 16.1071 11.9953C16.9631 11.9976 17.803 11.7633 18.5343 11.3184C20.758 9.97218 21.9496 6.85593 21.7218 2.98218C21.7111 2.7987 21.6334 2.62554 21.5034 2.49558C21.3734 2.36562 21.2003 2.2879 21.0168 2.27718C17.143 2.04937 14.0268 3.24093 12.6796 5.46468C11.803 6.91312 11.7805 8.6625 12.599 10.3397L11.2499 11.6887L10.1052 10.5441C10.6677 9.30187 10.6274 8.01281 9.97492 6.93656C8.95585 5.25 6.6196 4.35093 3.7246 4.52062C3.54144 4.53154 3.36863 4.60922 3.23888 4.73896C3.10914 4.86871 3.03145 5.04152 3.02054 5.22468C2.84991 8.11875 3.74991 10.455 5.43741 11.475C6.00197 11.8197 6.65094 12.0014 7.31241 12C7.91252 11.994 8.50444 11.8601 9.04866 11.6072L10.1896 12.75L9.4396 13.5H5.24991C5.051 13.5 4.86024 13.579 4.71958 13.7197C4.57893 13.8603 4.49991 14.0511 4.49991 14.25C4.49991 14.4489 4.57893 14.6397 4.71958 14.7803C4.86024 14.921 5.051 15 5.24991 15H6.14898L7.38742 20.5753C7.45969 20.9094 7.64465 21.2085 7.91128 21.4223C8.17791 21.6362 8.50998 21.7519 8.85179 21.75H15.149C15.4907 21.7516 15.8226 21.6358 16.0891 21.4219C16.3557 21.2081 16.5408 20.9092 16.6134 20.5753L17.8518 15H18.7499C18.9488 15 19.1396 14.921 19.2802 14.7803C19.4209 14.6397 19.4999 14.4489 19.4999 14.25C19.4999 14.0511 19.4209 13.8603 19.2802 13.7197C19.1396 13.579 18.9488 13.5 18.7499 13.5Z"
      fill={fill}
    />
  </Svg>
);

// Custom Leaf Icon Component
const LeafIcon = ({width = 24, height = 24, fill = "white"}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20.9475 3.75656C20.9367 3.57308 20.859 3.39992 20.7291 3.26996C20.5991 3.14 20.4259 3.06228 20.2425 3.05156C13.1053 2.6325 7.3884 4.78125 4.9509 8.8125C4.10599 10.1915 3.68964 11.7903 3.75465 13.4063C3.79708 14.4396 4.00733 15.4592 4.37715 16.425C4.39888 16.4844 4.4353 16.5374 4.48302 16.579C4.53074 16.6206 4.5882 16.6494 4.65006 16.6628C4.71191 16.6761 4.77615 16.6737 4.83679 16.6555C4.89742 16.6374 4.95248 16.6042 4.99684 16.5591L12.9656 8.46844C13.0353 8.39876 13.118 8.34348 13.209 8.30577C13.3001 8.26806 13.3977 8.24865 13.4962 8.24865C13.5948 8.24865 13.6923 8.26806 13.7834 8.30577C13.8744 8.34348 13.9572 8.39876 14.0268 8.46844C14.0965 8.53812 14.1518 8.62085 14.1895 8.71189C14.2272 8.80294 14.2466 8.90052 14.2466 8.99906C14.2466 9.09761 14.2272 9.19519 14.1895 9.28624C14.1518 9.37728 14.0965 9.46001 14.0268 9.52969L5.3184 18.3694L3.98809 19.6997C3.84973 19.8344 3.76714 20.0162 3.75672 20.209C3.74629 20.4018 3.80881 20.5915 3.93184 20.7403C3.99921 20.8183 4.08195 20.8816 4.17488 20.9262C4.26781 20.9709 4.36894 20.9958 4.47196 20.9996C4.57498 21.0034 4.67767 20.9859 4.77362 20.9482C4.86958 20.9106 4.95673 20.8535 5.02965 20.7806L6.60371 19.2066C7.92934 19.8478 9.26715 20.1975 10.5937 20.2444C10.6981 20.2481 10.8021 20.25 10.9059 20.25C12.4166 20.2539 13.8986 19.8378 15.1865 19.0481C19.2178 16.6106 21.3675 10.8947 20.9475 3.75656Z"
      fill={fill}
    />
  </Svg>
);

// Custom Plant Credits Icon Component (from Figma SVG)
const PlantCreditsIcon = ({width = 24, height = 24, fill = "white"}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18.7499 13.5H11.5593L13.6602 11.3991C14.4198 11.7816 15.2567 11.9855 16.1071 11.9953C16.9631 11.9976 17.803 11.7633 18.5343 11.3184C20.758 9.97218 21.9496 6.85593 21.7218 2.98218C21.7111 2.7987 21.6334 2.62554 21.5034 2.49558C21.3734 2.36562 21.2003 2.2879 21.0168 2.27718C17.143 2.04937 14.0268 3.24093 12.6796 5.46468C11.803 6.91312 11.7805 8.6625 12.599 10.3397L11.2499 11.6887L10.1052 10.5441C10.6677 9.30187 10.6274 8.01281 9.97492 6.93656C8.95585 5.25 6.6196 4.35093 3.7246 4.52062C3.54144 4.53154 3.36863 4.60922 3.23888 4.73896C3.10914 4.86871 3.03145 5.04152 3.02054 5.22468C2.84991 8.11875 3.74991 10.455 5.43741 11.475C6.00197 11.8197 6.65094 12.0014 7.31241 12C7.91252 11.994 8.50444 11.8601 9.04866 11.6072L10.1896 12.75L9.4396 13.5H5.24991C5.051 13.5 4.86024 13.579 4.71958 13.7197C4.57893 13.8603 4.49991 14.0511 4.49991 14.25C4.49991 14.4489 4.57893 14.6397 4.71958 14.7803C4.86024 14.921 5.051 15 5.24991 15H6.14898L7.38742 20.5753C7.45969 20.9094 7.64465 21.2085 7.91128 21.4223C8.17791 21.6362 8.50998 21.7519 8.85179 21.75H15.149C15.4907 21.7516 15.8226 21.6358 16.0891 21.4219C16.3557 21.2081 16.5408 20.9092 16.6134 20.5753L17.8518 15H18.7499C18.9488 15 19.1396 14.921 19.2802 14.7803C19.4209 14.6397 19.4999 14.4489 19.4999 14.25C19.4999 14.0511 19.4209 13.8603 19.2802 13.7197C19.1396 13.579 18.9488 13.5 18.7499 13.5Z"
      fill={fill}
    />
  </Svg>
);

// Custom Shipping Buddies Icon Component (from Figma SVG)
const ShippingBuddiesIcon = ({width = 80, height = 80}) => (
  <Svg width={width} height={height} viewBox="0 0 80 80" fill="none">
    <Path
      d="M72.7636 72.7565L69.6017 57.6985L66.0687 40.8677L65.4423 37.8882L61.6969 20.0488C61.2656 17.9874 59.2437 16.668 57.1823 17.0994C55.3842 17.4768 54.1505 19.0626 54.1505 20.829C54.1505 21.0812 54.1758 21.3365 54.2281 21.5916L53.7698 19.4065C53.3369 17.3451 51.3152 16.0257 49.2537 16.4587C48.7145 16.5713 48.2247 16.7932 47.8044 17.0977C47.8028 17.0993 47.8028 17.1008 47.8012 17.1008C46.8244 17.8065 46.2219 18.9513 46.2219 20.1851C46.2219 20.4451 46.2488 20.7083 46.3044 20.9732C45.8714 18.9118 43.8497 17.5924 41.7883 18.0254C41.2555 18.138 40.7719 18.3552 40.3564 18.6533C40.3484 18.6597 40.3422 18.6644 40.3358 18.6691C39.3606 19.3747 38.758 20.5196 38.758 21.7533C38.758 22.0135 38.785 22.2766 38.8405 22.5415L42.5225 40.0812L35.0586 41.6479L38.1142 56.2032C38.3283 57.226 38.8294 58.1679 39.5572 58.9163L42.5511 61.9958C43.2805 62.7458 43.7816 63.6861 43.9956 64.709L46.8277 78.2002C47.0845 79.4244 48.285 80.2077 49.5091 79.9508L71.013 75.4363C72.2356 75.1794 73.0205 73.9791 72.7636 72.7565Z"
      fill="#FFDFCF"
    />
    <Path
      d="M57.7059 20.0487L61.0708 36.1869L64.9175 35.3793L61.6991 20.0487C61.2663 17.9874 59.2445 16.6671 57.1833 17.0999C56.7409 17.1927 56.333 17.3593 55.9688 17.5832C56.8305 18.1126 57.4817 18.9807 57.7059 20.0487Z"
      fill="#FFCEBF"
    />
    <Path
      d="M72.7641 72.7559L69.603 57.6984L64.9173 35.3792L61.0703 36.1868L65.6528 58.0156L68.8139 73.7787C69.0047 74.6871 68.6211 75.5818 67.9105 76.0881L71.0136 75.4367C72.2373 75.1798 73.0209 73.9796 72.7641 72.7559Z"
      fill="#FFCEBF"
    />
    <Path
      d="M57.2408 35.9421C57.3572 36.4967 57.0022 37.0406 56.4477 37.1571L55.0016 37.4613C54.9984 37.4613 54.9936 37.4629 54.9905 37.4629C54.3784 37.5849 53.7806 37.1981 53.6442 36.5892L49.8194 19.7235C49.5705 18.5421 48.7997 17.6049 47.8008 17.1007C47.8008 17.1002 47.8008 17.1004 47.8008 17.0999C48.2217 16.7943 48.7128 16.5713 49.2534 16.4585C51.3148 16.0256 53.3367 17.3449 53.7695 19.4063L57.2408 35.9421Z"
      fill="#FFCEBF"
    />
    <Path
      d="M49.7652 37.4593C49.8875 38.0418 49.5142 38.6132 48.9316 38.7352L47.4209 39.0518C46.8041 39.1818 46.1967 38.7901 46.062 38.1734L42.3545 21.2902C42.1072 20.1088 41.3366 19.1716 40.3359 18.669C40.3423 18.6643 40.3486 18.6595 40.3566 18.6532C40.772 18.3551 41.2556 18.1379 41.7884 18.0252C43.8498 17.5923 45.8717 18.9116 46.3045 20.9731L49.7652 37.4593Z"
      fill="#FFCEBF"
    />
    <Path
      d="M66.0702 40.8663L63.2416 44.8646C60.9322 48.129 60.0868 52.2077 60.9083 56.1212L62.8554 65.3955L70.7902 63.3498L70.1344 60.2263C69.7899 58.5855 69.9866 56.8774 70.6949 55.3579L73.3852 49.5863C73.9022 48.4773 74.2429 47.2943 74.3951 46.0801L75.5976 36.4832C75.8401 34.5484 74.6305 32.7274 72.7532 32.2005C70.6947 31.6229 68.5512 32.7926 67.923 34.8362L66.0702 40.8663Z"
      fill="#FFDFCF"
    />
    <Path
      d="M75.5948 36.4832L74.3928 46.0799C74.2406 47.2946 73.8997 48.4775 73.3826 49.5858L70.6917 55.3578C69.9845 56.8769 69.7862 58.5847 70.132 60.226L70.7869 63.3499L66.9272 64.3441L66.1819 60.5432C65.8362 58.9019 66.0328 57.1941 66.7415 55.675L69.4325 49.903C69.9494 48.7946 70.2903 47.6116 70.4426 46.3971L71.6447 36.8003C71.8587 35.0957 70.9437 33.4799 69.4373 32.7583C70.3712 32.1113 71.5748 31.8703 72.7498 32.2002C74.6275 32.7264 75.8373 34.5485 75.5948 36.4832Z"
      fill="#FFCEBF"
    />
    <Path
      d="M44.6791 24.328C42.6179 23.8952 40.596 25.2155 40.1632 27.2767L41.1573 22.5414C41.2127 22.2766 41.2398 22.0134 41.2398 21.7533C41.2398 19.9869 40.006 18.4027 38.2094 18.0253C37.1152 17.7953 36.0323 18.0602 35.1918 18.6675H35.1902C34.448 19.2034 33.8963 20.0075 33.6933 20.9731C33.7488 20.7083 33.7758 20.445 33.7758 20.185C33.7758 18.42 32.5405 16.8344 30.744 16.4586C29.6482 16.2288 28.5652 16.4934 27.7248 17.1008C26.9826 17.6367 26.4308 18.4408 26.2279 19.4064L25.7696 21.5892C26.186 19.5369 24.868 17.5303 22.8154 17.1008V17.0992C21.7371 16.8741 20.6683 17.1278 19.8343 17.7145C19.8312 17.7177 19.8279 17.7209 19.8232 17.7225C19.8137 17.7305 19.8057 17.7367 19.7962 17.7431C19.7963 17.7431 19.7963 17.7433 19.7965 17.7433C19.0555 18.2794 18.5029 19.0822 18.3008 20.0488L13.9296 40.8663L12.0765 34.8361C11.4485 32.7923 9.30491 31.6227 7.24632 32.2003C5.36897 32.7272 4.15944 34.5483 4.40194 36.483L5.60444 46.0799C5.75663 47.2941 6.09725 48.4769 6.61428 49.5861L9.3046 55.3577C10.0129 56.8772 10.2096 58.5853 9.86507 60.2261L7.2346 72.7561C6.97772 73.9797 7.76147 75.1799 8.98507 75.4367L30.4891 79.9513C31.7127 80.2081 32.9129 79.4244 33.1699 78.2008L36.0024 64.7091C36.2171 63.6863 36.7179 62.7455 37.4463 61.9961L40.4402 58.9164C41.1687 58.167 41.6694 57.2263 41.8841 56.2034L47.628 28.8438C48.0607 26.7825 46.7404 24.7608 44.6791 24.328Z"
      fill="#FFCEBF"
    />
    <Path
      d="M41.1864 40.8595L37.9356 56.5207C37.7209 57.5436 37.2202 58.4843 36.4917 59.2337L33.4978 62.3134C32.7694 63.0628 32.2686 64.0036 32.0539 65.0264L29.4278 77.4839C29.2092 78.5251 28.307 79.2453 27.2891 79.2792L30.4909 79.9514C31.7145 80.2082 32.9147 79.4245 33.1717 78.2009L36.0042 64.7092C36.2189 63.6864 36.7197 62.7456 37.4481 61.9962L40.442 58.9165C41.1705 58.1672 41.6713 57.2264 41.8859 56.2036L44.9417 41.6479L41.1864 40.8595Z"
      fill="#FFB09E"
    />
    <Path
      d="M25.7664 21.6153L22.8311 35.5949C22.6744 36.3412 21.9425 36.8192 21.1963 36.6628L20.0357 36.4195C20.0293 36.4179 20.0246 36.4164 20.0182 36.4148C19.3616 36.2673 18.943 35.6187 19.081 34.9574L21.8163 21.9323C22.1794 20.2023 21.3072 18.5007 19.7977 17.7428C19.8072 17.7364 19.8152 17.7301 19.8247 17.7221C19.8294 17.7206 19.8327 17.7174 19.8358 17.7142C20.6699 17.1274 21.7386 16.8737 22.8169 17.0989V17.1004C24.8783 17.532 26.1993 19.5539 25.7664 21.6153Z"
      fill="#FFB09E"
    />
    <Path
      d="M33.7768 20.1849C33.7768 20.4449 33.7497 20.7082 33.6943 20.9731L30.2832 37.2239C30.1336 37.9365 29.4346 38.3929 28.7219 38.2432L27.4989 37.9864C26.833 37.8468 26.4064 37.192 26.546 36.5259L29.7444 21.2903C30.1075 19.5603 29.2353 17.8587 27.7258 17.1007C28.5663 16.4934 29.6493 16.2285 30.745 16.4585C32.5416 16.8343 33.7768 18.4201 33.7768 20.1849Z"
      fill="#FFB09E"
    />
    <Path
      d="M41.2418 21.7532C41.2418 22.0134 41.2148 22.2765 41.1593 22.5413L37.724 38.9057C37.5877 39.5548 36.951 39.9704 36.302 39.834L34.9654 39.5531C34.2977 39.4135 33.8712 38.7587 34.0109 38.0926L37.2093 22.8585C37.5724 21.127 36.7002 19.427 35.1938 18.6674C36.0343 18.0601 37.1173 17.7953 38.2115 18.0253C40.0081 18.4026 41.2418 19.9868 41.2418 21.7532Z"
      fill="#FFB09E"
    />
    <Path
      d="M44.6816 24.3279C43.5867 24.0981 42.503 24.3628 41.6625 24.9704C43.1712 25.7285 44.0434 27.4306 43.6802 29.1609L41.2227 40.8668L44.9422 41.6478L47.6303 28.8437C48.0631 26.7825 46.7428 24.7607 44.6816 24.3279Z"
      fill="#FFB09E"
    />
    <Path
      d="M13.9298 40.8659V40.8675L13.3945 43.4185C13.1823 44.4295 11.8236 44.6245 11.3358 43.714L10.7942 42.7031C10.2525 41.6921 9.81031 40.6309 9.47359 39.5346L8.12781 35.1526C7.79156 34.0617 7.02422 33.2196 6.06641 32.7598C6.41844 32.514 6.81484 32.3221 7.24781 32.2001C9.30609 31.6229 11.45 32.7932 12.078 34.8356L13.9298 40.8659Z"
      fill="#FFB09E"
    />
    <Path
      d="M66.0703 40.8676C66.0322 40.988 65.9767 41.1007 65.9037 41.2038L63.0748 45.2015C60.9642 48.1858 60.1841 51.9502 60.9341 55.5277C61.0705 56.1699 60.6581 56.801 60.0159 56.9358C59.3722 57.0707 58.7427 56.6583 58.6078 56.0162C57.7198 51.7933 58.6411 47.3518 61.1339 43.8283L65.4439 37.8882L66.0703 40.8676Z"
      fill="#FFCEBF"
    />
    <Path
      d="M31.5641 8.56702C31.288 8.56702 31.0108 8.47156 30.7858 8.27656L28.5902 6.37406C28.0938 5.9439 28.04 5.19281 28.4702 4.6964C28.9002 4.19999 29.6513 4.14624 30.1479 4.5764L32.3435 6.4789C32.8399 6.90906 32.8936 7.66015 32.4635 8.15656C32.2282 8.42796 31.8971 8.56702 31.5641 8.56702Z"
      fill="#539461"
    />
    <Path
      d="M36.8552 5.16684C36.341 5.16684 35.8668 4.83074 35.7146 4.3123L34.8961 1.5248C34.7111 0.894648 35.0719 0.23371 35.7022 0.0487102C36.3322 -0.136446 36.9933 0.224491 37.1783 0.854804L37.9968 3.6423C38.1818 4.27246 37.821 4.9334 37.1907 5.1184C37.0789 5.15121 36.9661 5.16684 36.8552 5.16684Z"
      fill="#539461"
    />
    <Path
      d="M43.1472 5.16696C43.0363 5.16696 42.9235 5.15133 42.8116 5.11852C42.1813 4.93352 41.8205 4.27258 42.0055 3.64243L42.8239 0.854926C43.0089 0.224614 43.6702 -0.136324 44.3 0.0488323C44.9303 0.233832 45.2911 0.89477 45.1061 1.52493L44.2877 4.31243C44.1357 4.83071 43.6614 5.16696 43.1472 5.16696Z"
      fill="#539461"
    />
    <Path
      d="M48.436 8.56685C48.103 8.56685 47.7718 8.42779 47.5366 8.15638C47.1064 7.65997 47.1602 6.90888 47.6566 6.47873L49.8522 4.57623C50.3489 4.14607 51.0999 4.19998 51.5299 4.69623C51.96 5.19263 51.9063 5.94372 51.4099 6.37388L49.2143 8.27638C48.9894 8.47138 48.7121 8.56685 48.436 8.56685Z"
      fill="#539461"
    />
  </Svg>
);

// Component definitions outside of render
const CreditCard = ({title, value, color, hasArrow = false, icon, isPlantCredits = false}) => (
  <View style={[styles.creditCard]}>
    <View style={[styles.iconActionRow, isPlantCredits && styles.plantCreditsIconRow]}>
      <View style={[
        styles.iconContainer, 
        {backgroundColor: color},
        isPlantCredits && styles.plantCreditsIconContainer
      ]}>
        {icon && icon}
        <Text style={[styles.creditValue, isPlantCredits && styles.plantCreditValue]}>{value}</Text>
      </View>
      {hasArrow && (
        <View style={[styles.arrowContainer, isPlantCredits && styles.plantCreditsArrowContainer]}>
          <RightIcon width={24} height={24} fill="#7F8D91" />
        </View>
      )}
    </View>
    <Text style={[styles.creditLabel, isPlantCredits && styles.plantCreditsLabel]}>{title}</Text>
  </View>
);

const MenuItem = ({icon, title, rightText, onPress, disabled = false, isDangerous = false}) => (
  <TouchableOpacity style={[styles.menuItem, disabled && styles.menuItemDisabled, isDangerous && styles.dangerMenuItem]} onPress={onPress} disabled={disabled}>
    <View style={styles.menuLeft}>
      {icon}
      <Text style={[styles.menuTitle, isDangerous && styles.dangerText]}>{title}</Text>
    </View>
    <View style={styles.menuRight}>
      {rightText && <Text style={styles.menuRightText}>{rightText}</Text>}
      {!disabled && <RightIcon width={24} height={24} fill="#556065" />}
    </View>
  </TouchableOpacity>
);

const Divider = () => <View style={styles.divider} />;


const BuyerProfileScreen = (props) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Calculate proper bottom padding for tab bar + safe area
  const tabBarHeight = 60; // Standard tab bar height
  const safeBottomPadding = Math.max(insets.bottom, 8); // At least 8px padding
  const totalBottomPadding = tabBarHeight + safeBottomPadding + 16; // Extra 16px for spacing
  
  // Local require for reusable Avatar component
  const Avatar = require('../../../components/Avatar/Avatar').default;
  const {logout, userInfo} = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({});
  const [addressBookCount, setAddressBookCount] = useState(0);
  const [profileStats, setProfileStats] = useState({
      leafPoints: 0,
      plantCredits: 0,
      shippingCredits: 0,
  buddyRequests: 0,
  });

  // ✅ Fetch on mount
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadAllProfileData();
    }
  }, [isFocused]);

  const loadAllProfileData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadProfileData(),
        loadAddressBookCount(),
        loadProfileStats(),
      ]);
  } catch (error) {
      
      Alert.alert(
        'Error',
        'Failed to load profile information. Please check your connection and try again.',
        [
          { text: 'Retry', onPress: () => loadAllProfileData() },
          { text: 'OK', style: 'cancel' },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAllProfileData();
  } catch (error) {
      
    } finally {
      setRefreshing(false);
    }
  };

  const loadProfileData = async () => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const res = await retryAsync(() => getBuyerProfileApi(), 3, 1000);

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load profile data');
    }
    setData(res.user || res);
  };

  const loadAddressBookCount = async () => {
    try {
      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        return;
      }

      const res = await retryAsync(() => getAddressBookEntriesApi(), 3, 1000);
      
      if (res?.success && res?.addresses) {
        setAddressBookCount(res.addresses.length);
      }
  } catch (error) {
      
      // Don't throw error for address book as it's not critical
    }
  };

  const loadProfileStats = async () => {
    try {
      // For now, using mock data since we don't have specific APIs for these
      // In a real app, these would come from separate API endpoints
      setProfileStats({
        leafPoints: 0,
        plantCredits: 0,
        shippingCredits: 0,
        buddyRequests: 0,
      });
  } catch (error) {
      
    }
  };

  const handleDeactivateAccount = () => {
    Alert.alert(
      'Deactivate Account',
      'Are you sure you want to deactivate your account? This action cannot be undone and you will lose access to all your data.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              // Show loading state
              Alert.alert('Processing', 'Deactivating your account...');
              
              // Call the deactivate buyer API
              const result = await deactivateBuyerApi();
              
              if (result?.success) {
                Alert.alert(
                  'Account Deactivated',
                  'Your account has been successfully deactivated. You will be logged out now.',
                  [
                    {
                      text: 'OK',
                      onPress: () => logout(),
                    },
                  ]
                );
              } else {
                throw new Error(result?.message || 'Failed to deactivate account');
              }
            } catch (error) {
              console.error('Account deactivation error:', error);
              
              // Check if it's the "pending orders" error
              const errorMessage = error.message || '';
              const isPendingOrdersError = errorMessage.includes('pending or undelivered orders') || 
                                          errorMessage.includes('orders are delivered or cancelled');
              
              if (isPendingOrdersError) {
                Alert.alert(
                  'Cannot Deactivate Account',
                  'You have pending or undelivered orders. Please wait until all your orders are delivered or cancelled before deactivating your account.',
                  [
                    { text: 'OK' },
                    { 
                      text: 'View Orders', 
                      onPress: () => {
                        // Navigate to orders screen - adjust this navigation as needed
                        navigation.navigate('Orders');
                      }
                    }
                  ]
                );
              } else {
                Alert.alert(
                  'Deactivation Failed',
                  'We couldn\'t deactivate your account at this time. Please try again later or contact support.',
                  [
                    { text: 'OK' },
                    { 
                      text: 'Contact Support', 
                      onPress: () => {
                        const supportChatParams = {
                          avatarUrl: null,
                          name: "Support Team",
                          id: "support-chat",
                          participants: ["support-admin", "current-user-id"]
                        };
                        navigation.navigate('ChatScreen', supportChatParams);
                      }
                    }
                  ]
                );
              }
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
  {/* Show skeleton placeholders in header when loading instead of modal spinner */}
      <StatusBar backgroundColor="#DFECDF" barStyle="dark-content" />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: totalBottomPadding}}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#699E73']}
            tintColor="#699E73"
          />
        }
      >
  {/* Header */}
  <View style={[styles.header, {paddingTop: Math.min(insets.top, 10) }]}> 
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <LeftIcon width={24} height={24} fill="#393D40" />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
          <View style={styles.headerSpacer} />
        </View>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.nameSection}>
            <View style={styles.avatarContainer}>
              {loading ? (
                <View style={styles.skeletonAvatar} />
              ) : (
                <Avatar size={56} />
              )}
            </View>
            <View style={styles.information}>
              <View style={styles.nameRow}>
                {loading ? (
                  <View style={styles.skeletonName} />
                ) : (
                  <Text style={styles.nameText}>
                    {data?.firstName && data?.lastName 
                      ? `${data.firstName} ${data.lastName}` 
                      : data?.gardenOrCompanyName }
                  </Text>
                )}
              </View>
              {loading ? (
                <View style={styles.skeletonSubtitle} />
              ) : (
                <Text style={styles.usernameText}>
                  @{data?.username || data?.email?.split('@')[0] }
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Credit Cards Scroll */}
        <View style={styles.scrollContent}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.creditScrollContainer}>
            <CreditCard
              title="My Leaf Points"
              value={profileStats.leafPoints.toString()}
              color="#539461"
              icon={<LeafIcon width={24} height={24} fill="#FFFFFF" />}
            />
            <CreditCard
              title="My Plant Credits"
              value={profileStats.plantCredits.toString()}
              color="#6B4EFF"
              hasArrow
              icon={<PlantCreditsIcon width={24} height={24} fill="#FFFFFF" />}
              isPlantCredits={true}
            />
            <CreditCard
              title="My Shipping Credits"
              value={profileStats.shippingCredits.toString()}
              color="#48A7F8"
              hasArrow
              icon={<ShippingCreditsIcon width={24} height={24} fill="#FFFFFF" />}
            />
          </ScrollView>
        </View>

        {/* Shipping Buddies */}
        <View style={styles.shippingBuddiesContainer}>
          <View style={styles.shippingBuddiesCard}>
            <View style={styles.buddiesContent}>
              <Text style={styles.buddiesTitle}>My Shipping Buddies</Text>
              <View style={styles.requestsRow}>
                <Text style={styles.requestsText}>Joiner request(s)</Text>
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>{profileStats.buddyRequests}</Text>
                </View>
              </View>
            </View>
            <View style={styles.highFiveIcon}>
              <ShippingBuddiesIcon width={80} height={80} />
            </View>
          </View>
        </View>

        {/* Profile Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Profile</Text>

          <MenuItem
            icon={<ProfileIcon width={24} height={24} fill="#556065" />}
            title="Account Information"
            onPress={() => navigation.navigate('AccountInformationScreen')}
          />

          <MenuItem
            icon={<EnvelopeIcon width={24} height={24} fill="#556065" />}
            title="My Address Book"
            rightText={addressBookCount > 0 ? `${addressBookCount} address${addressBookCount !== 1 ? 'es' : ''}` : ''}
            onPress={() => navigation.navigate('AddressBookScreen')}
          />

          {/* <MenuItem
            icon={<ReportIcon width={24} height={24} fill="#556065" />}
            title="Venmo"
            rightText="Still in progress for developing"
            onPress={() => {}}
            disabled={true}
          /> */}

          <MenuItem
            icon={<PasswordIcon width={24} height={24} fill="#556065" />}
            title="Password"
            onPress={() => navigation.navigate('UpdatePasswordScreen')}
          />
        </View>

        <Divider />

        {/* Leafy Activities Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Leafy Activities</Text>

          <MenuItem
            icon={<ProfileIcon width={24} height={24} fill="#556065" />}
            title="My Orders"
            onPress={() => navigation.navigate('Orders')}
          />

          <MenuItem
            icon={<EnvelopeIcon width={24} height={24} fill="#556065" />}
            title="Invite Friends"
            onPress={() => navigation.navigate('InviteFriendsScreen')}
          />

          <MenuItem
            icon={<ReportIcon width={24} height={24} fill="#556065" />}
            title="My Wishlist"
            onPress={() => {
              // Wishlist feature temporarily disabled
              
            }}
          />
        </View>

        <Divider />

        {/* Support Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Support</Text>

          <MenuItem
            icon={<ReportIcon width={24} height={24} fill="#556065" />}
            title="Report a Problem"
            onPress={() => navigation.navigate('ReportAProblemScreen')}
          />

          <MenuItem
            icon={<ChatIcon width={24} height={24} fill="#556065" />}
            title="Email Us"
            onPress={() => {
              // Open email app with the specified email address (encoded)
              const subject = encodeURIComponent('Support Request');
              const body = encodeURIComponent('Hello iLeafU Support Team,\n\n');
              const emailUrl = `mailto:ileafuasiausa@gmail.com?subject=${subject}&body=${body}`;
              console.log('mailto url:', emailUrl);
              Linking.openURL(emailUrl).catch(err => {
                console.error('Failed to open email app:', err);
                Alert.alert(
                  'Email App Not Available',
                  'Please send an email to: ileafuasiausa@gmail.com',
                  [{ text: 'OK' }]
                );
              });
            }}
          />
        </View>

        <Divider />

        {/* Legal Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Legal</Text>

          <MenuItem
            icon={<ProfileIcon width={24} height={24} fill="#556065" />}
            title="Terms of Use"
            onPress={() => navigation.navigate('TermsOfUseScreen')}
          />

          <MenuItem
            icon={<ProfileIcon width={24} height={24} fill="#556065" />}
            title="Privacy Policy"
            onPress={() => navigation.navigate('PrivacyPolicyScreen')}
          />
        </View>

        <Divider />

        {/* Account Management Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Account</Text>

          <MenuItem
            icon={<TrashIcon width={24} height={24} />}
            title="Deactivate Account"
            onPress={handleDeactivateAccount}
            isDangerous={true}
          />
        </View>

        {/* Logout Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#DFECDF',
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#393D40',
  },
  headerSpacer: {
    width: 24,
    height: 24,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  profileSection: {
    backgroundColor: '#DFECDF',
    paddingTop: 10,
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 10,
    width: '100%',
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    height: 58,
    width: '100%',
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: '#539461',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  information: {
    width: '100%',
    height: 58,
    justifyContent: 'center',
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 32,
    width: '100%',
  },
  nameText: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    color: '#202325',
    fontFamily: 'Inter',
    width: '100%',
    height: 32,
  },
  usernameText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: '#202325',
    fontFamily: 'Inter',
    width: '100%',
    height: 22,
  },
  scrollContent: {
    paddingVertical: 16,
    width: '100%',
    paddingHorizontal: 0,
    height: 146,
    backgroundColor: '#FFFFFF',
  },
  creditScrollContainer: {
    paddingHorizontal: 24,
    gap: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    minWidth: 678,
    height: 114,
  },
  creditCard: {
    width: 200,
    height: 114,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E7E9',
    borderRadius: 12,
    padding: 16,
    paddingBottom: 20,
    justifyContent: 'flex-end',
    gap: 16,
  },
  iconActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 40,
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    paddingRight: 16,
    borderRadius: 1000,
    width: 93,
    height: 40,
    gap: 8,
    flex: 0,
  },
  creditValue: {
    width: 33,
    height: 24,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontStyle: 'normal',
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0,
  },
  arrowContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  creditLabel: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    color: '#202325',
    fontFamily: 'Inter',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: 168,
    height: 22,
    flex: 0,
    alignSelf: 'stretch',
  },
  shippingBuddiesContainer: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  shippingBuddiesCard: {
    backgroundColor: '#F2F7F3',
    borderWidth: 1,
    borderColor: '#C0DAC2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    height: 112,
  },
  buddiesContent: {
    flex: 1,
    gap: 12,
  },
  buddiesTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: '#202325',
    fontFamily: 'Inter',
  },
  requestsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requestsText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: '#202325',
    fontFamily: 'Inter',
  },
  notificationBadge: {
    backgroundColor: '#E7522F',
    borderRadius: 1000,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  highFiveIcon: {
    width: 80,
    height: 80,
  },
  highFivePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#FFDFCF',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highFiveEmoji: {
    fontSize: 32,
  },
  settingsSection: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: '#202325',
    fontFamily: 'Inter',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingVertical: 12,
    gap: 8,
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: '#393D40',
    fontFamily: 'Inter',
  },
  menuRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingRight: 16,
    paddingVertical: 8,
    gap: 8,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  dangerMenuItem: {
    borderRadius: 8,
    marginVertical: 4,
  },
  dangerText: {
    color: '#FF4444',
  },
  menuRightText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: '#202325',
    fontFamily: 'Inter',
    textAlign: 'right',
    // Removed flex: 1 to prevent layout issues
  },
  divider: {
    height: 1,
    backgroundColor: '#E4E7E9',
    marginVertical: 8,
  },
  actionSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  logoutButton: {
    backgroundColor: '#E4E7E9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
    fontFamily: 'Inter',
  },
  creditIcon: {
    color: '#FFFFFF',
    marginRight: 4,
  },
  // Plant Credits specific styles
  plantCreditsIconRow: {
    width: 168,
    height: 40,
    alignSelf: 'stretch',
  },
  plantCreditsIconContainer: {
    width: 97,
    height: 40,
    paddingVertical: 8,
    paddingHorizontal: 12,
    paddingRight: 16,
    gap: 8,
  },
  plantCreditValue: {
    width: 37,
    height: 24,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontStyle: 'normal',
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0,
  },
  plantCreditsArrowContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: 59,
    height: 24,
    flex: 1,
  },
  plantCreditsLabel: {
    width: 168,
    height: 22,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22, // 140% of 16px = 22.4px, rounded to 22
    color: '#202325',
    fontFamily: 'Inter',
    fontStyle: 'normal',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    flex: 1,
  },
  // Skeleton placeholders for loading state
  skeletonAvatar: {
    width: 56,
    height: 56,
    borderRadius: 1000,
    backgroundColor: '#e0e0e0',
  },
  skeletonName: {
    height: 24,
    width: '60%',
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
  },
  skeletonSubtitle: {
    height: 16,
    width: '40%',
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    marginTop: 6,
  },
});

export default BuyerProfileScreen;
