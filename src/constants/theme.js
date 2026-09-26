/**
 * theme.js - Compact Guide Book Layout + Font Scale
 * - Card removed: thin divider 1px
 * - Left accent strip for feedback
 * - Font: Hind Siliguri / Noto Sans Bengali recommended
 * - Sizes: Small 14/13, Medium 16/15, Large 18/17, lineHeight 1.5x
 */

export const FontScales = {
  small: { 
    question: 14, 
    option: 13, 
    lineHeightQ: 21, // 14*1.5
    lineHeightO: 19.5,
    label: 'Small - Compact',
    desc: '6-8 questions per screen'
  },
  medium: { 
    question: 16, 
    option: 15, 
    lineHeightQ: 24, 
    lineHeightO: 22.5,
    label: 'Medium - Default',
    desc: 'Most comfortable reading'
  },
  large: { 
    question: 18, 
    option: 17, 
    lineHeightQ: 27, 
    lineHeightO: 25.5,
    label: 'Large - Comfort',
    desc: 'For elderly / eye issues'
  },
};

export const FontFamilies = {
  // Recommended Bengali fonts - will fallback to system if not loaded
  primary: 'HindSiliguri-Regular', // Best for small Bengali digital
  secondary: 'NotoSansBengali-Regular', // International standard
  traditional: 'Kalpurush', // Print guide book feel
  system: undefined, // Use system default if custom not loaded
};

export const lightTheme = {
  background: '#F8FAFC',
  cardBackground: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  divider: '#E2E8F0', // 1px thin divider
  
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  
  primary: '#0284C7',
  primarySoft: 'rgba(2,132,199,0.08)',
  primaryBorder: '#0284C7',
  
  optionDefaultBg: '#FFFFFF',
  optionDefaultBorder: '#E2E8F0',
  optionSelectedBg: '#FFFFFF',
  optionSelectedBorder: '#0284C7',
  optionSelectedWidth: 2,
  
  correctBorder: '#10B981',
  correctBg: '#FFFFFF',
  wrongBorder: '#EF4444',
  wrongBg: '#FFFFFF',
  
  cardCorrectOutline: '#10B981',
  cardWrongOutline: '#EF4444',
  
  // Compact accent strip
  accentCorrect: '#10B981',
  accentWrong: '#EF4444',
  accentWidth: 3,
  
  infoButtonBg: 'rgba(2,132,199,0.08)',
  infoIcon: '#0284C7',
  tabBackground: '#FFFFFF',
  tabActive: '#0284C7',
  tabInactive: '#94A3B8',
  
  questionNumberColor: '#0F172A',
};

export const darkTheme = {
  background: '#0F172A',
  cardBackground: '#1E293B',
  border: '#334155',
  borderLight: '#1E293B',
  divider: '#334155',
  
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  
  primary: '#38BDF8',
  primarySoft: 'rgba(56,189,248,0.08)',
  primaryBorder: '#38BDF8',
  
  optionDefaultBg: '#1E293B',
  optionDefaultBorder: '#334155',
  optionSelectedBg: '#1E293B',
  optionSelectedBorder: '#38BDF8',
  optionSelectedWidth: 2,
  
  correctBorder: '#34D399',
  correctBg: '#1E293B',
  wrongBorder: '#F87171',
  wrongBg: '#1E293B',
  
  cardCorrectOutline: '#34D399',
  cardWrongOutline: '#F87171',
  
  accentCorrect: '#34D399',
  accentWrong: '#F87171',
  accentWidth: 3,
  
  infoButtonBg: 'rgba(56,189,248,0.08)',
  infoIcon: '#38BDF8',
  tabBackground: '#1E293B',
  tabActive: '#38BDF8',
  tabInactive: '#64748B',
  
  questionNumberColor: '#F8FAFC',
};

export const Colors = {
  primaryLight: '#0284C7',
  primaryDark: '#38BDF8',
  successLight: '#10B981',
  successDark: '#34D399',
  errorLight: '#EF4444',
  errorDark: '#F87171',
};

export const getTheme = (mode = 'dark') => mode === 'light' ? lightTheme : darkTheme;
export const getFontScale = (scale = 'medium') => FontScales[scale] || FontScales.medium;

export const Theme = { light: lightTheme, dark: darkTheme };
export default Theme;
