import {StyleSheet} from 'react-native';

// Define reusable styles here
const colors = {
  primaryLight: '#fff', // white
  primaryDark: '#202325', // neutral 950 like black
  accent: '#539461', // green dark
  accentDark: '#356641', // green darker
  greyDark: '#393D43',
  grey: '#556065',
  greySoft: '#647276',
  greyLight: '#7F8D91',
  disable: '#A9B357',
  muted: '#CDD3D4',
  bgPrimaryLight: '#fff',
  bgPrimaryDark: '#202325',
  bgAccent: '#539461',
  bgLightAccent: '#DFECDF',
  bgGrey: '#A9B3B7',
  bgSoftGrey: '#CDD3D4',
  bgMuted: '#F5F6F6',
  bgCardSurfaceLightAccent: '#f2f7f3', // light green
  bgAccentSoft: '#C0DAC2',
};

// const fontWeightSize = {
//   light: 300,
//   regular: 500,
//   medium: 600,
//   semiBold: 600,
//   bold: 700,
//   extraBold: 800,
// };

const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  xxxxl: 36,
  xxxxxl: 48,
};

const spacing = {
  small: 8,
  medium: 16,
  large: 24,
};

export const globalStyles = StyleSheet.create({
  // Background
  backgroundAccent: {backgroundColor: colors.bgAccent},

  // Buttons
  primaryButton: {
    backgroundColor: colors.bgAccent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginVertical: 5,
  },
  primaryButtonText: {
    color: colors.primaryLight,
    fontWeight: 'bold',
    fontSize: fontSize.xl,
    textAlign: 'center',
  },
  secondaryButtonAccent: {
    backgroundColor: colors.bgPrimaryLight,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginVertical: 5,
    borderColor: colors.bgAccent,
    borderWidth: 1,
  },
  secondaryButtonButtonTextAccent: {
    color: colors.accent,
    fontWeight: 'bold',
    fontSize: fontSize.xl,
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: colors.bgPrimaryLight,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginVertical: 5,
    borderColor: colors.bgSoftGrey,
    borderWidth: 1,
  },
  secondaryButtonButtonText: {
    color: colors.accent,
    fontWeight: 'bold',
    fontSize: fontSize.xl,
    textAlign: 'center',
  },
  grayButton: {
    backgroundColor: colors.grey,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginVertical: 5,
    borderColor: colors.grey,
    borderWidth: 1,
  },
  grayButtonText: {
    color: colors.primaryLight,
    fontSize: fontSize.md,
    textAlign: 'center',
  },

  lightGreenButton: {
    backgroundColor: '#F2F7F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginVertical: 5,
  },
  // Buttons
  // Typography
  title: {
    color: colors.primaryDark,
    fontWeight: 'bold',
    fontSize: fontSize.xxxxl,
  },
  textBold: {
    fontWeight: 'bold',
  },
  textSemiBold: {
    fontWeight: '600',
  },
  textRegular: {
    fontWeight: 'regular',
  },
  // Typography
  // Grey Dark
  textXSGreyDark: {
    color: colors.greyDark,
    fontSize: fontSize.xs,
  },
  textSMGreyDark: {
    color: colors.greyDark,
    fontSize: fontSize.sm,
  },
  textMDGreyDark: {
    color: colors.greyDark,
    fontSize: fontSize.md,
  },
  textLGGreyDark: {
    color: colors.greyDark,
    fontSize: fontSize.lg,
  },
  textXLGreyDark: {
    color: colors.greyDark,
    fontSize: fontSize.xl,
  },
  textXXLGreyDark: {
    color: colors.greyDark,
    fontSize: fontSize.xxl,
  },
  // Grey Dark
  // Grey Light
  textXSGreyLight: {
    color: colors.greyLight,
    fontSize: fontSize.xs,
  },
  textSMGreyLight: {
    color: colors.greyLight,
    fontSize: fontSize.sm,
  },
  textMDGreyLight: {
    color: colors.greyLight,
    fontSize: fontSize.md,
  },
  textLGGreyLight: {
    color: colors.greyLight,
    fontSize: fontSize.lg,
  },
  textXLGreyLight: {
    color: colors.greyLight,
    fontSize: fontSize.xl,
  },
  textXXLGreyLight: {
    color: colors.greyLight,
    fontSize: fontSize.xxl,
  },
  // Grey Light
  // Accent
  textXSAccent: {
    color: colors.accent,
    fontSize: fontSize.xs,
  },
  textSMAccent: {
    color: colors.accent,
    fontSize: fontSize.sm,
  },
  textMDAccent: {
    color: colors.accent,
    fontSize: fontSize.md,
  },
  textLGAccent: {
    color: colors.accent,
    fontSize: fontSize.lg,
  },
  textXLGAccent: {
    color: colors.accent,
    fontSize: fontSize.xl,
  },
  textXXLGAccent: {
    color: colors.accent,
    fontSize: fontSize.xxl,
  },
  // Accent
  // Accent Dark
  textXSAccentDark: {
    color: colors.accentDark,
    fontSize: fontSize.xs,
  },
  textSMAccentDark: {
    color: colors.accentDark,
    fontSize: fontSize.sm,
  },
  textMDAccentDark: {
    color: colors.accentDark,
    fontSize: fontSize.md,
  },
  textLGAccentDark: {
    color: colors.accentDark,
    fontSize: fontSize.lg,
  },
  textXLAccentDark: {
    color: colors.accentDark,
    fontSize: fontSize.xl,
  },
  textXXLAccentDark: {
    color: colors.accentDark,
    fontSize: fontSize.xxl,
  },
  // Accent Dark
  // White
  textXSWhite: {
    color: '#fff',
    fontSize: fontSize.xs,
  },
  textSMWhite: {
    color: '#fff',
    fontSize: fontSize.sm,
  },
  textMDWhite: {
    color: '#fff',
    fontSize: fontSize.md,
  },
  textLGWhite: {
    color: '#fff',
    fontSize: fontSize.lg,
  },
  textXLWhite: {
    color: '#fff',
    fontSize: fontSize.xl,
  },
  textXXLWhite: {
    color: '#fff',
    fontSize: fontSize.xxl,
  },
  // White
  textXSRed: {
    color: '#FF5247',
    fontSize: fontSize.xs,
  },
  // Card
  cardLightAccent: {
    backgroundColor: colors.bgCardSurfaceLightAccent,
    borderColor: colors.bgAccentSoft,
    borderWidth: 1,
    borderRadius: 10,
  },
  // Card
});

// Add a function to get component styles based on color scheme
export const getComponentStyles = (colorScheme = 'light') => {
  // All styles are now static, matching the original light mode
  return {
    container: {
      flexGrow: 1,
      padding: 24,
      backgroundColor: colors.bgPrimaryLight,
    },
    step: {
      color: '#888',
      fontSize: 16,
      marginBottom: 8,
    },
    title: {
      textAlign: 'center',
      fontSize: 28,
      color: '#000',
      fontWeight: 'bold',
      marginBottom: 24,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      marginTop: 16,
      color: colors.primaryDark,
    },
    required: {
      color: '#E53935',
    },
    input: {
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      padding: 12,
      marginTop: 8,
      fontSize: 16,
      backgroundColor: '#fafafa',
      color: colors.primaryDark,
    },
    helper: {
      color: '#888',
      fontSize: 13,
      marginTop: 4,
    },
    passwordRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    eyeIcon: {
      position: 'absolute',
      right: 10,
      bottom: 8,
      padding: 8,
    },
    passwordStrengthBox: {
      borderWidth: 1,
      borderColor: '#eee',
      borderRadius: 10,
      padding: 12,
      marginTop: 12,
      marginBottom: 8,
      backgroundColor: '#fafafa',
    },
    strengthBarContainer: {
      height: 6,
      backgroundColor: '#eee',
      borderRadius: 3,
      marginBottom: 8,
      overflow: 'hidden',
    },
    strengthBar: {
      height: 6,
      borderRadius: 3,
    },
    strengthText: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 8,
      color: '#388E3C',
    },
    requirementRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    requirementText: {
      marginLeft: 8,
      fontSize: 14,
      color: colors.primaryDark,
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 16,
    },
    checkboxText: {
      marginLeft: 8,
      fontSize: 14,
      flex: 1,
      flexWrap: 'wrap',
      color: colors.primaryDark,
    },
    link: {
      color: colors.accent,
      textDecorationLine: 'none',
      fontWeight: '800',
    },
    button: {
      height: 48,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    buttonText: {
      color: colors.primaryLight,
      fontSize: 18,
      fontWeight: 'bold',
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    errorText: {
      color: '#FF5247',
      marginTop: 8,
    },
    successText: {
      color: '#4CAF50',
      marginTop: 8,
    },
  };
};
