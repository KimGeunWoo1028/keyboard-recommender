/**
 * Community terminology → structured trait senses.
 *
 * **Multiple meanings:** entries can list several `TermSense` objects. Pick one with
 * strategies in `convert.ts`, or blend.
 *
 * **Editing:** add rows here; keep `traitBoost` sparse and on the same 0–10-ish scale as catalog items.
 */

import type { TermDictionaryEntry } from "@/keyboard-terminology/types";

/** Authoritative list — indexes are built in `indexes.ts`. */
export const TERMINOLOGY_DICTIONARY: TermDictionaryEntry[] = [
  {
    canonical: "thocky",
    aliases: ["thock", "thocc", "thockier", "도각도각", "도각", "도독도독", "저음도각", "묵직한소리", "묵직"],
    glossary: "묵직하고 낮은 톤의 바닥 타건감. 보통 깊은 하우징/플레이트 조합에서 잘 느껴집니다.",
    senses: [
      {
        id: "thocky:default",
        description: "Classic “thock” — depth-forward, less ping, rounded fundamental.",
        traitBoost: { deep_sound: 8, soft: 4, clacky: 2, smooth: 4 },
        confidence: 0.9,
      },
      {
        id: "thocky:plate_forward",
        description: "User emphasizes plate/case thock (still deep, slightly firmer presentation).",
        traitBoost: { deep_sound: 7, firm: 5, clacky: 3, smooth: 3 },
        confidence: 0.45,
      },
    ],
  },
  {
    canonical: "creamy",
    aliases: ["cream", "크리미", "버터리", "쫀득한", "쫀득쫀득", "부드러운"],
    glossary: "날카롭기보다 매끈하고 둥근 타건감. 윤활된 리니어 느낌을 말할 때 자주 쓰는 표현입니다.",
    senses: [
      {
        id: "creamy:default",
        description: "Smooth glide with softened, rounded feedback — often pairs with lubed linears.",
        traitBoost: { smooth: 8, soft: 6, deep_sound: 4, clacky: 2 },
        confidence: 0.85,
      },
    ],
  },
  {
    canonical: "clacky",
    aliases: ["clack", "clacky-forward", "클래키", "클락키", "경쾌한타건", "딱딱한소리", "쨍한소리"],
    glossary: "고음이 살아 있고 타건 어택이 또렷한 성향입니다.",
    senses: [
      {
        id: "clacky:default",
        description: "Sharp, present acoustics and firmer perceived impact.",
        traitBoost: { clacky: 9, firm: 5, deep_sound: 2, smooth: 3 },
        confidence: 0.9,
      },
    ],
  },
  {
    canonical: "marbly",
    aliases: ["marble", "마블리", "머블리", "또각또각", "마블톤"],
    glossary: "맥락에 따라 저음 마블리/고음 마블리로 나뉘는 표현입니다.",
    senses: [
      {
        id: "marbly:deep_smooth",
        description: "Dense, smooth fundamental with a stone-like roundness (often thock-leaning).",
        traitBoost: { deep_sound: 7, smooth: 6, soft: 4, clacky: 3 },
        confidence: 0.55,
      },
      {
        id: "marbly:bright_articulate",
        description: "Harder, more articulate “marble click” character — brighter edge.",
        traitBoost: { clacky: 7, firm: 6, smooth: 4, deep_sound: 4 },
        confidence: 0.55,
      },
    ],
  },
  {
    canonical: "muted",
    aliases: ["mute", "dampened", "뮤트", "조용한", "먹먹한", "차분한소리", "정숙한", "저소음"],
    glossary: "링/핑이 줄고 고음이 눌린 차분한 소리. 폼/테이프 세팅과 함께 자주 언급됩니다.",
    senses: [
      {
        id: "muted:default",
        description: "Overall quieter, more controlled harmonics; less clack-forward.",
        traitBoost: { soft: 8, clacky: 1, deep_sound: 4, smooth: 5 },
        confidence: 0.9,
      },
    ],
  },
  {
    canonical: "poppy",
    aliases: ["pop", "팝피", "파피", "통통튀는", "튀는느낌", "스냅감"],
    glossary: "통통 튀는 반발감과 또렷한 어택이 강조되는 성향입니다.",
    senses: [
      {
        id: "poppy:default",
        description: "Energetic, snappy feedback — often reads as brighter and more defined.",
        traitBoost: { clacky: 8, firm: 5, smooth: 4, tactile_strength: 4 },
        confidence: 0.75,
      },
      {
        id: "poppy:tactile_event",
        description: "Emphasis on a crisp tactile event (bump-forward wording in reviews).",
        traitBoost: { tactile_strength: 7, clacky: 6, firm: 4, smooth: 2 },
        confidence: 0.5,
      },
    ],
  },
  {
    canonical: "foamy",
    aliases: ["foamy", "폼많은", "보글보글", "폼빵빵"],
    glossary: "폼 세팅으로 소리가 정리되고 부드럽게 눌리는 느낌을 말할 때 쓰는 표현입니다.",
    senses: [
      {
        id: "foamy:default",
        description: "폼 감쇠가 많이 들어간 차분한 타건감.",
        traitBoost: { soft: 6, smooth: 4, deep_sound: 3, clacky: 1 },
        confidence: 0.72,
      },
    ],
  },
  {
    canonical: "scratchy",
    aliases: ["scratchy", "서걱서걱", "서걱", "거친질감", "사각사각", "까슬한"],
    glossary: "매끈하기보다 결이 느껴지는 거친 타건 질감입니다.",
    senses: [
      {
        id: "scratchy:default",
        description: "윤활이 덜 된 듯한 마찰감이 느껴지는 질감.",
        traitBoost: { smooth: -2, clacky: 5, firm: 4, tactile_strength: 4 },
        confidence: 0.67,
      },
    ],
  },
  {
    canonical: "deep",
    aliases: ["deep", "bassy", "lowpitch", "저음", "깊은소리", "묵직한저음"],
    glossary: "저음 중심의 묵직한 사운드 성향입니다.",
    senses: [
      {
        id: "deep:default",
        description: "고음보다 저음 중심으로 무게감이 느껴지는 소리.",
        traitBoost: { deep_sound: 8, clacky: 1, soft: 3 },
        confidence: 0.82,
      },
    ],
  },
  {
    canonical: "bright",
    aliases: ["bright", "pingy", "고음", "쨍한", "맑은소리", "경쾌한고음"],
    glossary: "고음이 살아 있고 어택이 선명한 성향입니다.",
    senses: [
      {
        id: "bright:default",
        description: "상단 고음이 또렷하고 반응이 빠른 느낌.",
        traitBoost: { clacky: 8, firm: 3, deep_sound: 1 },
        confidence: 0.79,
      },
    ],
  },
  {
    canonical: "tactile",
    aliases: ["tactile", "택타일", "구분감", "범프", "걸리는느낌"],
    glossary: "눌렀을 때 구분감(범프)이 느껴지는 성향입니다.",
    senses: [
      {
        id: "tactile:default",
        description: "명확한 구분감이 있는 입력 피드백.",
        traitBoost: { tactile_strength: 8, firm: 3, smooth: -1 },
        confidence: 0.83,
      },
    ],
  },
  {
    canonical: "linear",
    aliases: ["linear", "리니어", "매끈한", "미끄러지는"],
    glossary: "구분감보다 매끈한 직선형 입력 감각입니다.",
    senses: [
      {
        id: "linear:default",
        description: "범프가 적고 부드럽게 이어지는 입력감.",
        traitBoost: { smooth: 8, tactile_strength: -2, soft: 2 },
        confidence: 0.84,
      },
    ],
  },
  {
    canonical: "bouncy",
    aliases: ["bouncy", "탄성있는", "탱글한", "쫀득쫀득", "말랑한반발"],
    glossary: "탄성감이 있고 말랑하게 반발하는 타건감입니다.",
    senses: [
      {
        id: "bouncy:default",
        description: "부드럽고 탄성 있는 반발감 중심.",
        traitBoost: { soft: 6, smooth: 4, firm: -1, tactile_strength: 2 },
        confidence: 0.73,
      },
    ],
  },
  {
    canonical: "stiff",
    aliases: ["stiff", "rigid", "강성", "빳빳한", "단단한하우징", "단단한"],
    glossary: "유연함보다 단단하고 고정된 타건감을 원하는 표현입니다.",
    senses: [
      {
        id: "stiff:default",
        description: "하드한 바닥감과 단단한 입력 피드백.",
        traitBoost: { firm: 8, soft: -2, clacky: 3 },
        confidence: 0.76,
      },
    ],
  },
  {
    canonical: "light-force",
    aliases: ["light", "저압", "가벼운", "살짝눌리는", "힘덜드는"],
    glossary: "적은 힘으로 가볍게 눌리는 입력감을 뜻합니다.",
    senses: [
      {
        id: "light-force:default",
        description: "부담 없는 키압 중심의 장시간 타이핑 성향.",
        traitBoost: { soft: 3, smooth: 3, firm: -1, tactile_strength: -1 },
        confidence: 0.68,
      },
    ],
  },
  {
    canonical: "hollow",
    aliases: ["hollow", "통울림", "텅빈소리", "울림이큰", "부밍"],
    glossary: "하우징 내부 공진이 느껴지는 울림 성향입니다.",
    senses: [
      {
        id: "hollow:default",
        description: "울림이 강조되어 차분함이 줄어드는 케이스 공진 느낌.",
        traitBoost: { deep_sound: 3, clacky: 3, soft: -2, firm: 2 },
        confidence: 0.65,
      },
    ],
  },
];
