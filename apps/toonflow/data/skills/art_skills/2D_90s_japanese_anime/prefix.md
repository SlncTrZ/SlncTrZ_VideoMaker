# Global Aesthetic Foundation · 90s Japanese Anime

---
Must strictly and fully follow all style constraints and global rules below, and generate prompts exactly according to the prompt template format; only output the prompt body, without any explanation, clarification, note, title, or other extra text.
## I. Style DNA

| Dimension | Definition |
|---|---|
| **Primary Style** | 90s Japanese Anime (90s Anime Aesthetic) |
| **Secondary Style** | Hand-drawn Cel Shading · Cinematic Light and Shadow |
| **Emotional Tone** | Nostalgic Healing · Gentle and Delicate |
| **Texture Keywords** | Crisp clean lines, flat coloring, soft warm tones |

---

## II. Global Color Palette (Style Baseline, Not Hard-Locked)

> Goal: Unify aesthetics without restricting creativity. Except for "hard-constrained colors," all other colors are prioritized by default and may shift within reasonable range.

### Color Usage Hierarchy

| Layer | Constraint Strength | Description |
|---|---|---|
| L1 Hard Constraint | High | Only locks character identity core: skin tone, hair color, main garment base color aesthetic direction |
| L2 Soft Constraint | Medium | Scene colors, accessory colors, accent colors prioritize the palette first, may be fine-tuned per shot and story |
| L3 Exception Mechanism | Low | Flashback/climax/special scenes may temporarily break local colors, but must retain overall warm tone logic |

| No. | Color Name | Hex Value | Usage |
|---|---|---|---|
| C1 | Warm Yellow | #F5E6D0 | Skin base, warm light, sunset |
| C2 | Cherry Pink | #F4D5D5 | Cheek blush, spring, romance |
| C3 | Sky Blue | #87AEC9 | Sky, clothing, cool accents |
| C4 | Deep Brown Hair | #4A3728 | Hair color, eye color |
| C5 | Neutral Gray | #8A8A8A | Architecture, shadows, neutral tones |
| C6 | Lavender | #D0C4D6 | Night, dreamy, memories |
| C7 | Amber Warm | #C9A96E | Dusk, lighting, warmth |
| C8 | Olive Green | #8A9A5B | Plants, nature, environment |
| C9 | Off-White | #F5F0E8 | Walls, clothing, background |
| C10 | Warm Orange | #E8C890 | Sunset, firelight, coziness |

### Hard Constraint Colors (Locked by Default)

| Color Item | Corresponding Color | Rule |
|---|---|---|
| Skin Base | C1 Warm Yellow | Priority by default, minor brightness/warmth adjustment allowed |
| Hair/Eye Base | C4 Deep Brown Hair | Priority by default, slight deep brown/dark brown shift allowed |

### Soft Constraint Colors (Recommended Priority)

> C2/C3/C5/C6/C7/C8/C9/C10 are recommended gamut for clothing, decoration, background, warm light, environment, etc. May be adjusted to adjacent hues per shot atmosphere.

### Emotional Palette (Director-Aligned)

| Emotional Scene | Main Color | Secondary Color | Lighting & Contrast Suggestions | Visual Keywords |
|---|---|---|---|---|
| Everyday Warmth | C1 Warm Yellow | C9 Off-White + C5 Neutral Gray | Even warm tone, soft contrast | Slice of life, warmth, calm |
| Heart-fluttering Moment | C2 Cherry Pink | C1 Warm Yellow + C10 Warm Orange | Medium/close shot warming up, skin slightly flushed | Shyness, closeness, ambiguity |
| School/Classroom | C9 Off-White | C5 Neutral Gray + C3 Sky Blue | Clear light-dark hierarchy, neutral dominant | Youth, everyday, natural |
| Dusk Romance | C7 Amber Warm | C10 Warm Orange + C2 Cherry Pink | Backlit warm tone, rim light | Nostalgic, romantic, emotional |
| Moonlit Night | C3 Sky Blue | C6 Lavender + C1 Warm Yellow | Cool tones dominant, warm accents | Serenity, contemplation, solitude |
| Memory/Flashback | C1 Warm Yellow | C6 Lavender + C5 Neutral Gray | Soft focus haze, slight desaturation | Nostalgic, old memories, dreamy |
| Parting Melancholy | C5 Neutral Gray | C3 Sky Blue + C1 Warm Yellow | Desaturated, widen warm-cool contrast | Distance, restraint, subdued weight |
| Reunion Relief | C1 Warm Yellow | C7 Amber Warm + C2 Cherry Pink | Cool then warm, progressive warm face light | Rewarming, relief, healing |

### Emotional Palette Usage Rules

| No. | Rule |
|---|---|
| E1 | Each prompt must specify at least 1 "emotional scene" and bind main + secondary color combination |
| E2 | No more than 2 main colors per shot to avoid color narrative diffusion |
| E3 | When shifting emotions, prioritize adjusting light ratio and color temperature, then saturation |
| E4 | Healing-oriented defaults follow "warm base + warm-cool contrast": warm colors as base, cool colors for background/shadows |
| E5 | If conflicting with the story, emotional palette takes priority over general recommended colors, but must not break prohibited items |

### Color Temperature Constraints

| Parameter | Value | Description |
|---|---|---|
| Overall Color Temp | Slightly warm 4800-5200K (recommended) | Warm nostalgic main tone |
| Skin Color Temp | Slightly warm 5000-5400K (recommended) | Warm yellow but with life |
| Contrast | Medium (recommended to maintain) | Clear light-dark hierarchy, not overly strong |
| Saturation | Medium-low 50-70% (recommended range) | 90s anime premium tones |

### Tolerance & Exceptions

| Item | Suggested Tolerance |
|---|---|
| Hue Shift | ±8° |
| Saturation Shift | ±10% |
| Brightness Shift | ±12% |

> Exception scenes: flashback, dusk, emotional climax shots may use warmer or higher saturation local color blocks; but high-saturation fluorescent colors and modern color language are prohibited.

---

## III. Global Constraint Rules

### Mandatory Rules (Inherited by All Skills)

| No. | Rule |
|---|---|
| R1 | Must include "90s Japanese Anime Style" style anchor term |
| R2 | Must declare "hand-drawn texture + cel shading" |
| R3 | Face must use "fine clean lines + soft warm tones" |
| R4 | Hair strands must use "clean flowing lines + natural shadows" |
| R5 | Lighting must declare "cinematic light and shadow layers" |

### Prohibited Items (Inherited by All Skills)

| No. | Prohibited Content |
|---|---|
| X1 | Strictly prohibited "modern Japanese anime style / late Shinkai / MAPPA style" |
| X2 | Strictly prohibited "3D rendering / CG animation / digital painting" |
| X3 | Strictly prohibited "high-saturation fluorescent colors / neon colors" |
| X4 | Strictly prohibited terms implying "facial distortion / proportion imbalance / limb abnormality" |
| X5 | Strictly prohibited "excessive shadows / heavy contrast / dark tones" |
| X6 | Strictly prohibited "modern elements / modern architecture / modern clothing" |
