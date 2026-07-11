"""
Curated community → internal-trait glosses.

**Structure**: each `CommunityTermDefinition` lists *relative* axis weights plus
`intrinsic_confidence`. The interpreter scales by match quality; overlapping terms *add*
unless you plug a different combiner later.

**NLP expansion**: add rows or load from JSON/YAML; optional `TerminologySource` can
emit soft distributions that get folded into the same `TraitContribution` tuples.
"""

from __future__ import annotations

from keyboard_recommender.terminology.models import CommunityTermDefinition, TraitContribution

Tc = TraitContribution


# Example mappings requested + common adjacent vocabulary (relative, signed shape).
COMMUNITY_TERMS: tuple[CommunityTermDefinition, ...] = (
    CommunityTermDefinition(
        id="thocky",
        canonical_label="thocky",
        synonyms=("thock", "thocky", "thocc", "도각도각", "도각", "저음도각", "묵직한소리"),
        trait_contributions=(
            Tc("deep_sound", 1.35),
            Tc("muted", 0.55),
            Tc("marbly", 0.85),
            Tc("high_pitch", -0.45),
            Tc("poppy", 0.25),
        ),
        intrinsic_confidence=0.82,
        notes="Low-mid resonance + rounded attack; overlaps with marbly/creamy.",
        tags=frozenset({"sound", "attack"}),
    ),
    CommunityTermDefinition(
        id="sound_deep",
        canonical_label="deep (sound)",
        synonyms=(
            "deep",
            "deeper",
            "deepest",
            "bassy",
            "subby",
            "low-end",
            "lowend",
            "저음",
            "저음성향",
            "깊은소리",
            "묵직한",
            "묵직한저음",
        ),
        trait_contributions=(
            Tc("deep_sound", 1.2),
            Tc("high_pitch", -0.35),
            Tc("marbly", 0.3),
            Tc("muted", 0.2),
        ),
        intrinsic_confidence=0.76,
        notes="Low-frequency / warm fundamental language; distinct from thocky meme bundle.",
        tags=frozenset({"sound"}),
    ),
    CommunityTermDefinition(
        id="sound_bright",
        canonical_label="bright / ping",
        synonyms=("bright", "brighter", "pingy", "ping", "shrill", "고음", "경쾌한고음", "쨍한", "맑은소리"),
        trait_contributions=(
            Tc("high_pitch", 1.05),
            Tc("poppy", 0.55),
            Tc("deep_sound", -0.4),
            Tc("muted", -0.35),
        ),
        intrinsic_confidence=0.7,
        notes="Upper-mid / attack-forward descriptors; overlaps clacky/poppy.",
        tags=frozenset({"sound", "attack"}),
    ),
    CommunityTermDefinition(
        id="sound_warm",
        canonical_label="warm (sound)",
        synonyms=("warm", "warmer", "warmth", "mellow", "웜톤", "따뜻한소리", "포근한소리"),
        trait_contributions=(
            Tc("deep_sound", 0.65),
            Tc("muted", 0.45),
            Tc("high_pitch", -0.35),
            Tc("smooth", 0.35),
        ),
        intrinsic_confidence=0.64,
        notes="Broad community term; softer than 'deep' alone on deep_sound.",
        tags=frozenset({"sound"}),
    ),
    CommunityTermDefinition(
        id="feel_tactile",
        canonical_label="tactile (feel)",
        synonyms=("tactile", "tactility", "bump", "bumpy", "snappy", "택타일", "구분감", "걸리는느낌"),
        trait_contributions=(
            Tc("strong_tactile", 1.15),
            Tc("firm_bottom_out", 0.35),
            Tc("smooth", -0.25),
        ),
        intrinsic_confidence=0.72,
        notes="Switch-feel wording; not identical to catalog 'tactile' tiers.",
        tags=frozenset({"feel"}),
    ),
    CommunityTermDefinition(
        id="feel_linear",
        canonical_label="linear (feel)",
        synonyms=("linear", "linears", "리니어", "매끈한", "직선적인"),
        trait_contributions=(
            Tc("smooth", 1.05),
            Tc("strong_tactile", -0.55),
            Tc("scratchy", -0.25),
        ),
        intrinsic_confidence=0.78,
        notes="No-bump preference language.",
        tags=frozenset({"feel"}),
    ),
    CommunityTermDefinition(
        id="feel_soft_bottom",
        canonical_label="soft bottom-out",
        synonyms=("mushy", "pillowy", "cushy", "cushioned", "푹신한", "쿠션감", "말랑한바닥"),
        trait_contributions=(
            Tc("soft_bottom_out", 1.1),
            Tc("firm_bottom_out", -0.45),
            Tc("muted", 0.25),
        ),
        intrinsic_confidence=0.66,
        notes="Bottom-out feel narrative; overlaps foamy/muted slightly.",
        tags=frozenset({"feel"}),
    ),
    CommunityTermDefinition(
        id="texture_scratchy",
        canonical_label="scratchy / rough",
        synonyms=("scratchy", "scratchier", "rough", "gritty", "raspy", "서걱서걱", "서걱", "거친질감"),
        trait_contributions=(
            Tc("scratchy", 1.15),
            Tc("smooth", -0.55),
            Tc("high_pitch", 0.2),
        ),
        intrinsic_confidence=0.62,
        notes="Surface / stem texture language; 'scratchy' surface form is the adjective row.",
        tags=frozenset({"texture"}),
    ),
    CommunityTermDefinition(
        id="creamy",
        canonical_label="creamy",
        synonyms=("creamy", "cream", "buttery", "크리미", "버터리", "쫀득한"),
        trait_contributions=(
            Tc("smooth", 0.95),
            Tc("deep_sound", 0.75),
            Tc("muted", 0.55),
            Tc("high_pitch", -0.35),
            Tc("scratchy", -0.4),
        ),
        intrinsic_confidence=0.68,
        notes="Smooth harmonic stack + softer treble; subjective vs thocky.",
        tags=frozenset({"sound", "texture"}),
    ),
    CommunityTermDefinition(
        id="clacky",
        canonical_label="clacky",
        synonyms=("clack", "clacky", "clack-forward", "클래키", "딱딱한소리", "경쾌한타건"),
        trait_contributions=(
            Tc("high_pitch", 1.2),
            Tc("poppy", 0.95),
            Tc("scratchy", 0.55),
            Tc("deep_sound", 0.15),
            Tc("muted", -0.65),
        ),
        intrinsic_confidence=0.8,
        notes="Bright, sharp front of hit; often anti-muted in community use.",
        tags=frozenset({"sound", "attack"}),
    ),
    CommunityTermDefinition(
        id="marbly",
        canonical_label="marbly",
        synonyms=("marble", "marbly", "마블리", "또각또각"),
        trait_contributions=(
            Tc("marbly", 1.25),
            Tc("deep_sound", 0.55),
            Tc("high_pitch", 0.15),
            Tc("poppy", 0.35),
        ),
        intrinsic_confidence=0.72,
        notes="Higher harmonic color riding on a deeper fundamental; overlaps thocky.",
        tags=frozenset({"sound", "harmonics"}),
    ),
    CommunityTermDefinition(
        id="poppy",
        canonical_label="poppy",
        synonyms=("poppy", "pop", "팝피", "통통튀는"),
        trait_contributions=(
            Tc("poppy", 1.15),
            Tc("high_pitch", 0.65),
            Tc("firm_bottom_out", 0.35),
            Tc("deep_sound", 0.2),
        ),
        intrinsic_confidence=0.74,
        notes="Short, snappy onset; can read as clacky-adjacent.",
        tags=frozenset({"sound", "attack"}),
    ),
    CommunityTermDefinition(
        id="muted",
        canonical_label="muted",
        synonyms=("muted", "mute", "quiet-sounding", "damped", "dampened", "뮤트", "조용한", "죽은소리", "차분한소리"),
        trait_contributions=(
            Tc("muted", 1.3),
            Tc("high_pitch", -0.75),
            Tc("soft_bottom_out", 0.35),
            Tc("scratchy", -0.45),
        ),
        intrinsic_confidence=0.78,
        notes="Damped treble / overall quieter presentation — not identical to 'quiet' dB.",
        tags=frozenset({"sound", "level"}),
    ),
    CommunityTermDefinition(
        id="foamy",
        canonical_label="foamy",
        synonyms=("foamy", "foam-heavy", "foam-maxed", "폼많은", "폼빵빵", "보글보글", "먹먹한"),
        trait_contributions=(
            Tc("muted", 0.85),
            Tc("soft_bottom_out", 0.55),
            Tc("high_pitch", -0.35),
            Tc("poppy", -0.25),
        ),
        intrinsic_confidence=0.62,
        notes="Case/foam damping narrative; correlates with muted/smooth, not a pure axis.",
        tags=frozenset({"setup", "damping"}),
    ),
    CommunityTermDefinition(
        id="case_hollow",
        canonical_label="hollow / case resonance",
        synonyms=("hollow", "echoey", "boomy", "통울림", "울림이큰", "텅빈소리", "부밍"),
        trait_contributions=(
            Tc("high_pitch", 0.45),
            Tc("muted", -0.55),
            Tc("deep_sound", 0.35),
            Tc("marbly", 0.25),
        ),
        intrinsic_confidence=0.64,
        notes="Case resonance / hollowness descriptors from community sound tests.",
        tags=frozenset({"sound", "resonance"}),
    ),
    CommunityTermDefinition(
        id="feel_bouncy",
        canonical_label="bouncy / chewy feel",
        synonyms=("bouncy", "chewy", "elastic", "쫀득쫀득", "쫀득함", "탱글한", "말랑한반발"),
        trait_contributions=(
            Tc("soft_bottom_out", 0.55),
            Tc("flexible", 0.75),
            Tc("firm_bottom_out", -0.35),
            Tc("smooth", 0.35),
        ),
        intrinsic_confidence=0.61,
        notes="Feel-forward terms often used for gasket/flex-heavy typing feel.",
        tags=frozenset({"feel", "mount"}),
    ),
    CommunityTermDefinition(
        id="feel_flexible",
        canonical_label="flexible typing feel",
        synonyms=("flex", "flexy", "gasket", "유연한", "플렉스", "말랑플렉스", "유격감"),
        trait_contributions=(
            Tc("flexible", 1.15),
            Tc("soft_bottom_out", 0.55),
            Tc("stiff", -0.75),
            Tc("firm_bottom_out", -0.25),
        ),
        intrinsic_confidence=0.7,
        notes="Mount/plate flexibility leaning descriptors.",
        tags=frozenset({"feel", "mount"}),
    ),
    CommunityTermDefinition(
        id="feel_stiff",
        canonical_label="stiff / rigid typing feel",
        synonyms=("stiff", "rigid", "hard", "빳빳한", "강성", "단단한", "단단한하우징"),
        trait_contributions=(
            Tc("stiff", 1.25),
            Tc("firm_bottom_out", 0.75),
            Tc("flexible", -0.85),
            Tc("soft_bottom_out", -0.45),
        ),
        intrinsic_confidence=0.72,
        notes="Rigid assembly / hard stop language.",
        tags=frozenset({"feel", "mount"}),
    ),
    CommunityTermDefinition(
        id="feel_light_force",
        canonical_label="light typing force",
        synonyms=("light", "feather", "easy-press", "가벼운", "저압", "살짝눌리는", "힘덜드는"),
        trait_contributions=(
            Tc("light_typing_force", 1.25),
            Tc("firm_bottom_out", -0.25),
            Tc("strong_tactile", -0.2),
            Tc("smooth", 0.2),
        ),
        intrinsic_confidence=0.66,
        notes="Low-force preference descriptors for long typing sessions.",
        tags=frozenset({"feel", "force"}),
    ),
    CommunityTermDefinition(
        id="feel_heavy_force",
        canonical_label="heavier typing force",
        synonyms=("heavy", "weighty", "hard-press", "무거운", "고압", "힘줘서누르는"),
        trait_contributions=(
            Tc("light_typing_force", -1.05),
            Tc("firm_bottom_out", 0.55),
            Tc("strong_tactile", 0.35),
            Tc("stiff", 0.35),
        ),
        intrinsic_confidence=0.63,
        notes="Heavier-force preference often paired with firmer feel.",
        tags=frozenset({"feel", "force"}),
    ),
    CommunityTermDefinition(
        id="silent",
        canonical_label="silent / low-noise",
        synonyms=("silent", "quiet", "low-noise", "저소음", "정숙한", "소음적은"),
        trait_contributions=(
            Tc("muted", 1.15),
            Tc("high_pitch", -0.65),
            Tc("scratchy", -0.35),
            Tc("soft_bottom_out", 0.25),
        ),
        intrinsic_confidence=0.74,
        notes="Explicit low-noise intent, separate from broad muted color terms.",
        tags=frozenset({"sound", "level"}),
    ),
    CommunityTermDefinition(
        id="crispy_attack",
        canonical_label="crisp / defined attack",
        synonyms=("crisp", "defined", "clean-attack", "또렷한", "선명한", "정갈한타건"),
        trait_contributions=(
            Tc("poppy", 0.95),
            Tc("high_pitch", 0.55),
            Tc("scratchy", 0.25),
            Tc("muted", -0.25),
        ),
        intrinsic_confidence=0.68,
        notes="Crisp attack language that sits between clacky and poppy.",
        tags=frozenset({"sound", "attack"}),
    ),
    CommunityTermDefinition(
        id="chalky_texture",
        canonical_label="chalky / dry texture",
        synonyms=("chalky", "dry", "powdery", "건조한", "분필같은", "드라이한질감"),
        trait_contributions=(
            Tc("scratchy", 0.95),
            Tc("smooth", -0.45),
            Tc("muted", 0.25),
            Tc("high_pitch", 0.2),
        ),
        intrinsic_confidence=0.58,
        notes="Dry/chalky descriptors mapped to texture roughness.",
        tags=frozenset({"texture"}),
    ),
)


def default_dictionary() -> tuple[CommunityTermDefinition, ...]:
    """Stable built-in lexicon; swap for DB-backed loader without changing the engine."""
    return COMMUNITY_TERMS
