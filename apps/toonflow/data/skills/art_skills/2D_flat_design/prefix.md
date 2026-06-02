# Global Aesthetic Foundation · 2D Flat Design

---
Must strictly and fully follow all style constraints and global rules below, and generate prompts exactly according to the prompt template format; only output the prompt body, without any explanation, clarification, note, title, or other extra text.
## I. Style DNA

| Dimension | Definition |
|---|---|
| **Primary Style** | 2D Flat Design |
| **Secondary Style** | Geometric Shapes · Solid Color Blocks · No Shadows, No Gradients |
| **Emotional Tone** | Minimalist Modern · Bright and Fresh |
| **Texture Keywords** | Clean lines, solid color fill, color block contrast |

---

## II. Global Color Palette (Style Baseline, Not Hard-Locked)

> Goal: Unify aesthetics without restricting creativity. Except for "hard-constrained colors," all other colors are prioritized by default and may shift within reasonable range.

### Color Usage Hierarchy

| Layer | Constraint Strength | Description |
|---|---|---|
| L1 Hard Constraint | High | Only locks character identity core: skin tone, hair color, main garment base color aesthetic direction |
| L2 Soft Constraint | Medium | Scene colors, accessory colors, accent colors prioritize the palette first, may be fine-tuned per shot and story |
| L3 Exception Mechanism | Low | Romance/climax/special scenes may temporarily break local colors, but must retain overall flat logic |

| No. | Color Name | Hex Value | Usage |
|---|---|---|---|
| C1 | Vivid Blue | #3B82F6 | Background, clothing, cool-toned subject |
| C2 | Energetic Orange | #F59E0B | Warm accents, emotional climax |
| C3 | Pure White | #FFFFFF | Background, whitespace, purity |
| C4 | Deep Brown Hair | #4A3728 | Hair color, eye color |
| C5 | Neutral Gray | #8A8A8A | Neutral tones, secondary elements |
| C6 | Lavender | #C084FC | Night, dreamy, accents |
| C7 | Warm Pink | #FB7185 | Romance, heart-fluttering, accents |
| C8 | Light Yellow | #FDE047 | Warmth, sunshine, background |
| C9 | Off-White | #FEF3C7 | Background, whitespace, warmth |
| C10 | Mint Green | #5EEAD4 | Nature, freshness, environment |

### Hard Constraint Colors (Locked by Default)

| Color Item | Corresponding Color | Rule |
|---|---|---|
| Skin Base | C3 Pure White + C9 Off-White | Priority by default, brightness fine-tuning allowed |
| Hair/Eye Base | C4 Deep Brown Hair | Priority by default, slight deep brown/dark brown shift allowed |

### Soft Constraint Colors (Recommended Priority)

> C1/C2/C5/C6/C7/C8/C10 are recommended gamut for clothing, decoration, background, warm light, environment, etc. May be adjusted to adjacent hues per shot atmosphere.

### Emotional Palette (Director-Aligned)

| Emotional Scene | Main Color | Secondary Color | Color Block Contrast Suggestions | Visual Keywords |
|---|---|---|---|---|
| Everyday Warmth | C9 Off-White | C3 Pure White + C5 Neutral Gray | Low contrast, soft | Slice of life, warmth, calm |
| Heart-fluttering Moment | C7 Warm Pink | C2 Energetic Orange + C9 Off-White | Medium contrast, main color prominent | Shyness, closeness, ambiguity |
| Office/Study | C1 Vivid Blue | C3 Pure White + C5 Neutral Gray | High contrast, rational | Efficient, calm, professional |
| Romantic Scene | C7 Warm Pink | C2 Energetic Orange + C8 Light Yellow | High contrast, romantic | Sweet, warm, emotional |
| Night Scene | C6 Lavender | C1 Vivid Blue + C2 Energetic Orange | Cool tones dominant, warm accents | Serene, mysterious, contemplative |
| Memory/Flashback | C8 Light Yellow | C5 Neutral Gray + C7 Warm Pink | Low contrast, soft | Nostalgic, old memories, dreamy |
| Parting Melancholy | C5 Neutral Gray | C1 Vivid Blue + C6 Lavender | High contrast, cool tones | Distance, restraint, subdued weight |
| Reunion Relief | C9 Off-White | C7 Warm Pink + C2 Energetic Orange | Cool then warm, progressive | Rewarming, relief, healing |

### Emotional Palette Usage Rules

| No. | Rule |
|---|---|
| E1 | Each prompt must specify at least 1 "emotional scene" and bind main + secondary color combination |
| E2 | No more than 2 main colors per shot to avoid color narrative diffusion |
| E3 | When shifting emotions, prioritize adjusting hue over color temperature, then saturation |
| E4 | Healing-oriented defaults follow "warm base + warm-cool contrast": warm colors as base, cool colors for background/secondary elements |
| E5 | If conflicting with the story, emotional palette takes priority over general recommended colors, but must not break prohibited items |

### Color Temperature Constraints

| Parameter | Value | Description |
|---|---|---|
| Overall Color Temp | Neutral 5500-6500K (recommended) | Minimalist modern main tone |
| Skin Color Temp | Slightly warm 5800-6200K (recommended) | Off-white but with life |
| Contrast | Medium-high (recommended to maintain) | Clear color block contrast, not overly strong |
| Saturation | Medium-high 70-90% (recommended range) | Flat design premium tones |

### Tolerance & Exceptions

| Item | Suggested Tolerance |
|---|---|
| Hue Shift | ±8° |
| Saturation Shift | ±10% |
| Brightness Shift | ±12% |

> Exception scenes: romance, climax, emotional transition shots may use warmer or higher saturation local color blocks; but high-saturation fluorescent colors and modern color language are prohibited.

---

## III. Global Constraint Rules

### Mandatory Rules (Inherited by All Skills)

| No. | Rule |
|---|---|
| R1 | Must include "2D Flat Design" style anchor term |
| R2 | Must declare "no shadows, no gradients + solid color blocks" |
| R3 | Face must use "geometric shapes + clean lines" |
| R4 | Outlines must use "clear lines + uniform consistency" |
| R5 | Color must declare "solid color fill + clear color block contrast" |

### Prohibited Items (Inherited by All Skills)

| No. | Prohibited Content |
|---|---|
| X1 | Strictly prohibited "3D rendering/realistic rendering/photo-level realism" |
| X2 | Strictly prohibited "shadows/gradients/textures/lighting" |
| X3 | Strictly prohibited "high-saturation fluorescent colors / neon colors" |
| X4 | Strictly prohibited terms implying "facial distortion / proportion imbalance / limb abnormality" |
| X5 | Strictly prohibited "complex details/fine textures/realistic background" |
| X6 | Strictly prohibited "3D perspective/depth description" |
