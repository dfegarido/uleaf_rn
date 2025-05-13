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
  // Typography
  title: {
    color: colors.primaryDark,
    fontWeight: 'bold',
    fontSize: fontSize.xxxxl,
  },
  // Primary Dark
  textXLPrimaryDark: {
    color: colors.greyDark,
    fontWeight: 'semi-bold',
    fontSize: fontSize.xl,
  },
  textLGPrimaryDark: {
    color: colors.greyDark,
    fontWeight: 'semi-bold',
    fontSize: fontSize.lg,
  },
  textXXLPrimaryDark: {
    color: colors.greyDark,
    fontWeight: 'semi-bold',
    fontSize: fontSize.xxl,
  },
  // Grey Dark
  textMDGrayDark: {
    color: colors.greyDark,
    fontWeight: 'semi-bold',
    fontSize: fontSize.md,
  },
  textLGGreyDark: {
    color: colors.greyDark,
    fontWeight: 'semi-bold',
    fontSize: fontSize.lg,
  },
  textXXLGrayDark: {
    color: colors.greyDark,
    fontWeight: 'semi-bold',
    fontSize: fontSize.xxl,
  },
  // Grey Light
  textSMGreyLight: {
    color: colors.greyLight,
    fontWeight: 'semi-bold',
    fontSize: fontSize.sm,
  },
  textMDGreyLight: {
    color: colors.greyLight,
    fontWeight: 'semi-bold',
    fontSize: fontSize.md,
  },
  textLGGreyLight: {
    color: colors.greyLight,
    fontWeight: 'semi-bold',
    fontSize: fontSize.lg,
  },
  // Accent
  textSMAccent: {
    color: colors.accent,
    fontWeight: 'semi-bold',
    fontSize: fontSize.sm,
  },
  textMDAccent: {
    color: colors.accent,
    fontWeight: 'semi-bold',
    fontSize: fontSize.md,
  },
  textLGAccent: {
    color: colors.accent,
    fontWeight: 'semi-bold',
    fontSize: fontSize.lg,
  },
  textXLGAccent: {
    color: colors.accent,
    fontWeight: 'semi-bold',
    fontSize: fontSize.xl,
  },
  textXXLGAccent: {
    color: colors.accent,
    fontWeight: 'semi-bold',
    fontSize: fontSize.xxl,
  },
  // Accent Dark
  textLGAccentDark: {
    color: colors.accentDark,
    fontWeight: 'semi-bold',
    fontSize: fontSize.lg,
  },
  textXLAccentDark: {
    color: colors.accentDark,
    fontWeight: 'semi-bold',
    fontSize: fontSize.xl,
  },
  // White
  textSMWhite: {
    color: '#fff',
    fontWeight: 'semi-bold',
    fontSize: fontSize.sm,
  },
  textMDWhite: {
    color: '#fff',
    fontWeight: 'semi-bold',
    fontSize: fontSize.md,
  },

  textXLWhite: {
    color: '#fff',
    fontWeight: 'semi-bold',
    fontSize: fontSize.xl,
  },

  // Card
  cardLightAccent: {
    backgroundColor: colors.bgCardSurfaceLightAccent,
    borderColor: colors.bgAccentSoft,
    borderWidth: 1,
    borderRadius: 10,
  },
});
