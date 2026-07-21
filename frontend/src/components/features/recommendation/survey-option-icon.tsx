import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  AudioWaveform,
  Box,
  Cloud,
  Feather,
  Gauge,
  HelpCircle,
  Moon,
  Mountain,
  Scale,
  Sparkles,
  TrendingUp,
  Volume1,
  Volume2,
  VolumeOff,
  VolumeX,
  Weight,
  Zap,
} from "lucide-react";

import type { SurveyAnswers, SurveyStepId } from "@/types/survey";
import { cn } from "@/lib/utils";

type OptionId = SurveyAnswers[SurveyStepId];
type OnboardingStyleId = "creamy_quiet" | "crisp_expressive" | "balanced";

type Props = {
  optionId: OptionId;
  selected?: boolean;
  className?: string;
};

type OnboardingIconProps = {
  styleId: OnboardingStyleId;
  className?: string;
};

/** Lucide icons per survey option — https://lucide.dev/icons/ */
const OPTION_ICONS: Record<string, LucideIcon> = {
  // sound_profile
  thocky: AudioWaveform,
  clacky: Zap,
  muted: VolumeOff,
  balanced: Scale,
  bright: Sparkles,
  // typing_pressure
  light: Feather,
  medium: Gauge,
  heavy: Weight,
  // switch_feel
  tactile_clear: Mountain,
  tactile_light: TrendingUp,
  linear: ArrowRight,
  // bottom_out
  soft: Cloud,
  firm: Box,
  // volume
  quiet: VolumeX,
  moderate: Volume1,
  loud: Volume2,
};

const ONBOARDING_STYLE_ICONS: Record<OnboardingStyleId, LucideIcon> = {
  creamy_quiet: Moon,
  crisp_expressive: Zap,
  balanced: Scale,
};

function lucideIconClass(selected: boolean | undefined, className?: string, fallback = "mb-6 h-12 w-12") {
  return cn(
    "transition-colors",
    selected
      ? "text-ca-on-surface"
      : "text-ca-on-surface-variant group-hover:text-ca-on-surface",
    className ?? fallback,
  );
}

export function SurveyOptionIcon({ optionId, selected = false, className }: Props) {
  const Icon = OPTION_ICONS[optionId] ?? HelpCircle;

  return (
    <Icon
      aria-hidden
      strokeWidth={1.75}
      className={lucideIconClass(selected, className)}
    />
  );
}

export function SurveyOnboardingStyleIcon({ styleId, className }: OnboardingIconProps) {
  const Icon = ONBOARDING_STYLE_ICONS[styleId];

  return (
    <Icon
      aria-hidden
      strokeWidth={1.75}
      className={lucideIconClass(undefined, className, "h-10 w-10 sm:h-12 sm:w-12")}
    />
  );
}
