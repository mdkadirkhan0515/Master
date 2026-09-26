/**
 * MCQCard.js - Compact Guide Book Layout
 * - Heavy card removed, thin divider only
 * - Left accent strip for feedback: red/green 3px
 * - Option circle: no fill, cyan outline only for selected
 * - Font scales: small/medium/large with 1.5x lineHeight
 * - 6-8 questions per screen
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getTheme, getFontScale } from '../constants/theme';

const MCQCard = ({
  question,
  options = [],
  selectedId = null,
  showResult = false,
  onSelectOption,
  themeMode = 'dark',
  index = 0,
  activeMode = 'M-iiii',
  onCardPress,
  isPlaying = false,
  disabled = false,
  fontScale = 'medium',
}) => {
  const theme = getTheme(themeMode);
  const fontConfig = getFontScale(fontScale);
  const isReview = activeMode === 'A-A';
  const isResultMode = showResult || isReview;
  const isAudio = ['q-iiii', 'q-A', 'q-iiii-GS', 'q-A-GS'].includes(activeMode);

  const getAccentColor = () => {
    if (isResultMode && selectedId) {
      const selectedOpt = options.find(o => o.Random_id === selectedId);
      if (selectedOpt) {
        return selectedOpt.isCorrect ? theme.accentCorrect : theme.accentWrong;
      }
    }
    if (isPlaying) return theme.primary;
    return 'transparent';
  };

  const getOptionStyle = (option) => {
    const isSelected = selectedId === option.Random_id;

    if (isResultMode) {
      if (isSelected) {
        return {
          circleBorder: theme.primary,
          circleBg: 'transparent',
          text: theme.textPrimary,
          circleText: theme.primary,
        };
      }
      return {
        circleBorder: theme.optionDefaultBorder,
        circleBg: 'transparent',
        text: theme.textPrimary,
        circleText: theme.textSecondary,
      };
    }

    if (isSelected) {
      return {
        circleBorder: theme.primary,
        circleBg: 'transparent',
        text: theme.textPrimary,
        circleText: theme.primary,
      };
    }

    return {
      circleBorder: theme.optionDefaultBorder,
      circleBg: 'transparent',
      text: theme.textPrimary,
      circleText: theme.textSecondary,
    };
  };

  const CardWrapper = isAudio ? TouchableOpacity : View;
  const wrapperProps = isAudio ? { onPress: () => onCardPress && onCardPress(), activeOpacity: 0.85 } : {};

  return (
    <CardWrapper style={styles.container} {...wrapperProps}>
      {/* Left Accent Strip */}
      <View style={[styles.accentStrip, { backgroundColor: getAccentColor(), width: getAccentColor() !== 'transparent' ? 3 : 0 }]} />

      <View style={[styles.content, { backgroundColor: theme.cardBackground }]}>
        {/* Question Row - Compact */}
        <View style={styles.questionRow}>
          <Text style={[styles.questionNumber, { color: theme.questionNumberColor, fontSize: fontConfig.question - 2 }]}>
            {String(index + 1).padStart(2, '0')}.
          </Text>
          <Text style={[styles.questionText, { color: theme.textPrimary, fontSize: fontConfig.question, lineHeight: fontConfig.lineHeightQ }]}>
            {question?.question_text || ''}
          </Text>
        </View>

        {/* Options - Compact grid, circle outline only */}
        <View style={styles.optionsGrid}>
          {options.map((opt, idx) => {
            const styleSet = getOptionStyle(opt);
            const label = ['ক', 'খ', 'গ', 'ঘ'][idx] || ['A', 'B', 'C', 'D'][idx];

            return (
              <TouchableOpacity
                key={String(opt.Random_id)}
                style={styles.optionRow}
                onPress={() => {
                  if (!disabled && !isResultMode && onSelectOption) {
                    onSelectOption(opt);
                  }
                }}
                disabled={disabled || isResultMode}
                activeOpacity={0.6}
              >
                <View style={[styles.circle, { borderColor: styleSet.circleBorder, backgroundColor: styleSet.circleBg }]}>
                  <Text style={[styles.circleText, { color: styleSet.circleText, fontSize: fontConfig.option - 1 }]}>{label}</Text>
                </View>
                <Text style={[styles.optionText, { color: styleSet.text, fontSize: fontConfig.option, lineHeight: fontConfig.lineHeightO }]} numberOfLines={2}>
                  {opt.option_text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Thin Divider - 1px */}
      <View style={[styles.divider, { backgroundColor: theme.divider }]} />
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    minHeight: 80,
  },
  accentStrip: {
    width: 3,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 8,
  },
  questionNumber: {
    fontWeight: '700',
    minWidth: 22,
    marginTop: 1,
  },
  questionText: {
    flex: 1,
    fontWeight: '500',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  optionRow: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 28,
    paddingVertical: 2,
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  optionText: {
    flex: 1,
    fontWeight: '400',
  },
  divider: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
  },
});

export default MCQCard;
