# Global Aesthetics Foundation · 3D Anime Rendering

---
Must strictly and completely follow all style constraints and global rules below, and strictly generate prompts according to the prompt template format; output only the prompt body, without attaching any explanations, notes, comments, titles, or other extra text.

## I. Style DNA

| Dimension | Definition |
|---|---|
| **Primary Style** | 3D Animation Rendering |
| **Secondary Style** | Cel Shading Texture · Cinematic Light and Shadow Layers |
| **Emotional Tone** | Healing · Bright and Warm |
| **Texture Keywords** | Clear contour lines, high-detail materials, soft warm tones |

---

## II. Global Color Palette (Style Baseline, Not a Hard Lock)

> Goal: Unify aesthetics rather than restrict creativity. Except for "hard constraint colors," all other colors are preferred by default and may deviate within reasonable range.

### Color Usage Hierarchy

| Tier | Constraint Level | Description |
|---|---|---|
| L1 Hard Constraint | High | Only locks core character identification: aesthetic direction of skin tone, hair color, main costume base |
| L2 Soft Constraint | Medium | Scene colors, accessory colors, and accent colorspriorityreferencepalette，canby lens/shotandplot fine-tuning |
| L3 Exception Mechanism | Low | Romantic/climax/special scenes may temporarily breakpartialcolor，but must preservewholewarm tone logic |

| No. | Color Name | Color Value | Usage |
|---|---|---|---|
| C1 | Warm Orange | #F5A673 | Skin base, sunset, twilight glow |
| C2 | Cherry Blossom Pink | #F4D5D5 | Cheek blush, romance, accents |
| C3 | Sky Blue | #87AEC9 | Sky, clothing, cool-toned accents |
| C4 | Dark Brown Hair | #4A3728 | Hair color, pupils |
| C5 | Premium Gray | #8A8A8A | Architecture, shadows, neutral colors |
| C6 | Soft Purple | #D0C4D6 | Night, dreamy, memories |
| C7 | Amber Warm | #C9A96E | Sunset, lighting, warmth |
| C8 | Mint Green | #9DC2A5 | Plants, nature, environment |
| C9 | Cream White | #F5F0E8 | Walls, clothing, background |
| C10 | Warm Yellow | #F5E6D0 | Indoor, warm light, cozy feel |

### Hard Constraint Colors (Default Locked)

| Color Item | Corresponding Color | Rule |
|---|---|---|
| Skin tone baseline | C1 Warm Orange | Default priority, minor brightness/warmth adjustments allowed |
| Hair/pupil baseline | C4 Dark Brown Hair | Default priority, slightoffset to dark brown/dark chestnut allowed |

### Soft Constraint Colors (Recommended Priority)

> C2/C3/C5/C6/C7/C8/C9/C10 are recommendedcolor gamut，used forclothing、decoration、background、warm light、environment etc. 。canaccording tolens/shotatmospheremake samehueadjacentadjust。

### Emotional Palette (Director-Aligned Version)

| Emotion Scene | Main Color | Auxiliary Color | Lighting & Contrast Suggestions | Visual Keywords |
|---|---|---|---|---|
| Everyday Warmth | C10 Warm Yellow | C9 Cream White + C5 Premium Gray | Even warm tone, soft contrast | Everyday life, warmth, calm |
| Heartbeat Moment | C2 Cherry Blossom Pink | C1 Warm Orange + C10 Warm Yellow | Medium-close shot warm-up, skin slightly flushed | Shyness, closeness, ambiguity |
| Cityscape | C9 Cream White | C5 Premium Gray + C3 Sky Blue | Clear light-dark layers, neutral dominant | Urban, openness, nature |
| Sunset Romance | C7 Amber Warm | C1 Warm Orange + C2 Cherry Blossom Pink | Backlit twilight glow, rim light | Romance, warmth, emotion |
| Night Street Scene | C3 Sky Blue | C6 Soft Purple + C1 Warm Orange | Cool tones dominant, warm accents | Urban, serene, vitality |
| Indoor Daily Life | C10 Warm Yellow | C9 Cream White + C5 Premium Gray | Warm light soft focus, cozy feel | Homey, comfortable, safe |
| Memory/Flashback | C1 Warm Orange | C5 Premium Gray + C7 Amber Warm | Soft focus fogging, slight fading | Nostalgia, old memories, dreamy |
| Farewell Sadness | C5 Premium Gray | C3 Sky Blue + C1 Warm Orange | Desaturate, widen warm-cool contrast | Distance, restraint, silent tension |

### Emotional Palette Usage Rules

| No. | Rule |
|---|---|
| E1 | Each prompt must specify at least 1 "emotion scene" and bind main + auxiliary colorgroup |
| E2 | No more than 2 main colors per shot to avoid color narrative dispersion |
| E3 | When switching emotions,priorityadjustlight ratioandcolor temperature， then adjustsaturation |
| E4 | Healing genre defaults to "warm base + warm-cool contrast": warm colorsfoundation layering，cold color used forbackground/shadow |
| E5 | If conflicting with plot, emotional palette takes priority overuniversalpushingrecommended colors，must not violate prohibitions |

### Color Temperature Constraints

| Parameter | Value | Description |
|---|---|---|
| Overall color temperature | Warmleaning warm 4800-5200K (recommended) | Warm healing mainkey tone |
| Skin color temperature | Slightly warm 5000-5400K (recommended) | Warm orangebut haslife feel |
| Contrast | Medium (recommended) | Clear light-dark layers, but not overlyintense |
| Saturation | Medium-high 65-80% (recommended range) | 3D anime premium tones |

### Tolerance & Exceptions

| Item | Recommended Tolerance |
|---|---|
| Hueoffset | ±8° |
| Saturationoffset | ±10% |
| Brightnessoffset | ±12% |

> Exception scenes: Romantic, sunset, emotional climax shots may use warmer or higher saturationpartialcolor block； but prohibitedhigh saturationfluorescent colorsandmoderncolorlanguage enters frame。

---

## III. Global Constraint Rules

### Mandatory Rules (Inherited by All Skills)

| No. | Rule |
|---|---|
| R1 | Must include "3D animation rendering + cel shading texture" style anchor term |
| R2 | Must declare "clear contour lines + high-detail materials" |
| R3 | Face must use "realistic materials combined with cartoon proportions + softlight and shadow" |
| R4 | Hair must use "clear contour lines + naturallight and shadow layers" |
| R5 | Lighting must declare "cinematic lighting + softlight and shadow layers" |

### Prohibited Items (Inherited by All Skills)

| No. | Prohibited Content |
|---|---|
| X1 | Strictlyprohibited "realistic rendering/photorealistic" |
| X2 | Strictlyprohibited "dark tones/heavy shadows/excessive contrast" |
| X3 | Strictlyprohibited "high saturation fluorescent/neon colors" |
| X4 | Strictlyprohibited terms suggesting "facial deformation/proportionimbalance/limb abnormalities" |
| X5 | Strictlyprohibited "absence of modern elements" (mustclear modernscene) |
| X6 | Strictlyprohibited "cyberpunk/steampunk/fantasy Western elements" |
