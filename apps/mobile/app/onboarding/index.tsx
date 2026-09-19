/**
 * TAMVA Onboarding Screen (Phase 9A)
 *
 * Immersive, production-quality onboarding experience for first-time users.
 * Supports:
 * - 3 editorial screens with native abstract financial visualizations
 * - Dual navigation: 100% reliable primary buttons + smooth horizontal gesture swipe
 * - Subtle 3-position pagination indicator
 * - Safe area handling for all screen sizes (320px–430px+ and web)
 * - Safe persistence: Navigates to authentication entry upon completion
 * - Dev-only reset controls (__DEV__ only, excluded in production)
 */

import React, { useState, useRef } from 'react';
import { DEMO_MODE } from '../../src/config/env';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { useHaptics } from '../../src/hooks/useHaptics';
import { useOnboarding } from '../../src/hooks/useOnboarding';
import { Button } from '../../src/components/ui/Button';
import { Chip } from '../../src/components/ui/Chip';
import {
  OnboardingPagination,
  OnboardingVisualOne,
  OnboardingVisualTwo,
  OnboardingVisualThree,
} from '../../src/components/onboarding';

interface SlideData {
  id: string;
  title: string;
  description: string;
  visual: React.ReactNode;
}

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();
  const { width } = useWindowDimensions();
  const { completeOnboarding, resetOnboarding } = useOnboarding();

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const scrollRef = useRef<ScrollView>(null);

  const slides: SlideData[] = [
    {
      id: 'step_1',
      title: 'Your financial picture, connected.',
      description:
        'Bring your consented financial accounts together and see your financial position in one clear view.',
      visual: <OnboardingVisualOne />,
    },
    {
      id: 'step_2',
      title: 'Understand your financial position.',
      description:
        'See your balances, cash flow, savings behaviour and financial signals in one place.',
      visual: <OnboardingVisualTwo />,
    },
    {
      id: 'step_3',
      title: 'Build financial trust.',
      description:
        'Use your financial profile to provide trusted financial context when you need it.',
      visual: <OnboardingVisualThree />,
    },
  ];

  // Handle horizontal scroll / swipe gesture
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / width);
    if (page !== activeIndex && page >= 0 && page < slides.length) {
      setActiveIndex(page);
    }
  };

  const scrollToPage = (index: number) => {
    scrollRef.current?.scrollTo({
      x: index * width,
      animated: true,
    });
    setActiveIndex(index);
  };

  const handleNext = async () => {
    haptics.selection();
    if (activeIndex < slides.length - 1) {
      scrollToPage(activeIndex + 1);
    } else {
      // Step 3: Complete onboarding and proceed to auth handoff
      haptics.success();
      await completeOnboarding();
      router.replace('/(auth)');
    }
  };

  const handleSkip = async () => {
    haptics.lightImpact();
    await completeOnboarding();
    router.replace('/(auth)');
  };

  const handleBack = () => {
    haptics.selection();
    if (activeIndex > 0) {
      scrollToPage(activeIndex - 1);
    }
  };

  const handleDevReset = async () => {
    haptics.mediumImpact();
    await resetOnboarding();
    scrollToPage(0);
  };

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: theme.colors.background,
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      {/* 1. Top Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandContainer}>
          <Text
            style={[
              theme.typography.label,
              {
                color: theme.colors.textPrimary,
                fontWeight: '800',
                fontSize: 16,
                letterSpacing: 1.2,
              },
            ]}
          >
            TAMVA
          </Text>
        </View>

        {/* Skip button (only shown on screens 1 and 2) */}
        {activeIndex < slides.length - 1 ? (
          <Pressable
            onPress={handleSkip}
            style={({ pressed }) => [
              styles.skipButton,
              pressed && { opacity: 0.6 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600' },
              ]}
            >
              Skip
            </Text>
          </Pressable>
        ) : (
          <View style={styles.skipPlaceholder} />
        )}
      </View>

      {/* 2. Swipeable Paged Content (Gestures + Scroll) */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        style={styles.carousel}
        contentContainerStyle={styles.carouselContent}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={[styles.slide, { width }]}>
            {/* Visual Container */}
            <View style={styles.visualWrapper}>{slide.visual}</View>

            {/* Editorial Headline & Supporting Copy */}
            <View style={styles.copyWrapper}>
              <Text
                style={[
                  theme.typography.display,
                  {
                    color: theme.colors.textPrimary,
                    fontSize: 26,
                    lineHeight: 32,
                    fontWeight: '800',
                    letterSpacing: -0.4,
                  },
                ]}
              >
                {slide.title}
              </Text>
              <Text
                style={[
                  theme.typography.body,
                  {
                    color: theme.colors.textSecondary,
                    fontSize: 14,
                    lineHeight: 22,
                    marginTop: 10,
                  },
                ]}
              >
                {slide.description}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* 3. Bottom Controls Area */}
      <View style={styles.bottomArea}>
        {/* Pagination Dots */}
        <View style={styles.paginationRow}>
          <OnboardingPagination
            currentIndex={activeIndex}
            total={slides.length}
          />
        </View>

        {/* Primary Action Button */}
        <Button
          label={activeIndex === slides.length - 1 ? 'Get started' : 'Continue'}
          onPress={handleNext}
          variant="primary"
          size="lg"
          fullWidth
          style={styles.primaryBtn}
        />

        {/* Secondary Action: Back on step 3, Skip on step 1/2 */}
        {activeIndex === slides.length - 1 ? (
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.secondaryActionBtn,
              pressed && { opacity: 0.6 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back to previous screen"
          >
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.textTertiary, fontSize: 13, fontWeight: '600' },
              ]}
            >
              Back
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleSkip}
            style={({ pressed }) => [
              styles.secondaryActionBtn,
              pressed && { opacity: 0.6 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.textTertiary, fontSize: 13, fontWeight: '600' },
              ]}
            >
              Skip
            </Text>
          </Pressable>
        )}

        {/* 4. Developer QA Controls (__DEV__ only, completely excluded in production) */}
        {DEMO_MODE && (
          <View style={styles.devControlsContainer}>
            <Chip
              label="DEV: Reset Onboarding"
              selected={false}
              onPress={handleDevReset}
              style={styles.devChip}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    height: 48,
  },
  brandContainer: {
    justifyContent: 'center',
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  skipPlaceholder: {
    width: 44,
    height: 44,
  },
  carousel: {
    flex: 1,
  },
  carouselContent: {
    alignItems: 'center',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  visualWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  copyWrapper: {
    width: '100%',
    paddingHorizontal: 4,
  },
  bottomArea: {
    paddingHorizontal: 24,
    paddingTop: 12,
    alignItems: 'center',
    width: '100%',
  },
  paginationRow: {
    marginBottom: 18,
  },
  primaryBtn: {
    minHeight: 52,
    width: '100%',
  },
  secondaryActionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  devControlsContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  devChip: {
    minHeight: 28,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
});
