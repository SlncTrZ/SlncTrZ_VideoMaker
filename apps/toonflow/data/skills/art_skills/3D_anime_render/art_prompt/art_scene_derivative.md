# 3D Anime Render Urban Scene Derivative Asset Generation · Constraint Manual

---

## I. Derivative Principles

1. **Space Consistent** — Building structure/layout/materials consistent across all variants
2. **Framing Driven** — Same scene shows different narrative functions through different framings
3. **Time Switch** — Same space presents different light and shadow atmospheres at different times
4. **Weather Change** — Same space presents different moods under different weather
5. **Cel-Shaded as Anchor** — All variants must maintain 3D animation render + cel-shaded style, reject realistic photography/CG animation feel; maintain lens characteristics and light-shadow consistency
6. **Urban Atmosphere Unified** — All variants must maintain modern urban style, warm color palette

---

## II. Framing Variants

### Framing Definitions

| Framing | Range | Narrative Function | Prompt |
|---|---|---|---|
| Extreme Wide Shot | Scene panorama + surroundings | Establish spatial sense, positioning | extreme wide shot, wide panorama |
| Wide Shot | Scene complete presentation | Show spatial structure | wide shot, full view |
| Medium Shot | Scene local area | Focus on functional area | medium shot, mid view |
| Close Shot | Scene details | Material/atmosphere prop closeup | close shot, close view |
| Extreme Closeup | Very local details | Material texture/key props | extreme closeup, detail |

### Framing Derivative Specifications

| Derived from Base | Stay Unchanged | Allow Changes |
|---|---|---|
| Extreme Wide Shot → Wide Shot | Building appearance, overall layout | Narrower perspective, add foreground |
| Wide Shot → Medium Shot | Material, color tone, lighting | Crop focus, depth change |
| Medium Shot → Close Shot | Material, color tone | Shallow depth, background blur |
| Close Shot → Extreme Closeup | Material texture | Very shallow depth, macro feel |

---

## III. Time Variants

### Time Definitions

| Time | Visual Characteristics | Prompt |
|---|---|---|
| Early Morning | Mist soft light, cool-warm mixed tones (cel-shaded) | Morning light, early morning mist |
| Noon | Bright, short shadows, vivid colors (cel-shaded) | Noon sun, bright lighting |
| Dusk | Golden tones, long shadows, sky gradient (cel-shaded) | Twilight gold, golden hour |
| Night (Moonlight) | Cool blue tones, quiet and serene (cel-shaded) | Moonlight glow, moonlight |
| Night (Lamplight) | Warm yellow accents, light-dark contrast (cel-shaded) | Lamplight flickering, candlelight dots |

### Time Derivative Specifications

| Derived from Base Time | Stay Unchanged | Change Items |
|---|---|---|
| Daytime → Dusk | Building/layout/material | Sky tone warm, shadows lengthen (cel-shaded) |
| Daytime → Night | Building/layout/material | Overall darker, add lamplight/moonlight atmosphere (cel-shaded) |
| Indoor Day → Indoor Night | Space structure, furniture | Overall tone warmer, add candle/fire/lantern elements (cel-shaded) |

---

## IV. Weather Variants

### Weather Definitions

| Weather | Visual Characteristics | Prompt |
|---|---|---|
| Sunny | Bright, clear shadows (cel-shaded) | Clear sky, bright sunshine |
| Cloudy | Even light, no hard shadows (cel-shaded) | Cloudy soft light, overcast |
| Misty | Reduced visibility, hazy air (cel-shaded) | Mist pervasive, fog around |
| Light Rain | Water droplets, wet reflection, rain streaks (cel-shaded) | Rain like silk, rain veil |
| Snowfall | White covering, snowflakes falling (cel-shaded) | Snowflakes falling, silver white world |

### Weather Derivative Specifications

| Derived from Base Weather | Stay Unchanged | Change Items |
|---|---|---|
| Sunny → Misty | Building/layout | Add fog layer, distant blur, lower saturation (cel-shaded) |
| Sunny → Light Rain | Building/layout | Add rain streaks, ground reflection, cooler tones (cel-shaded) |
| Sunny → Snowfall | Building/layout | Add snow accumulation, snowflakes, whiter tones (cel-shaded) |
| Vegetation must adapt to weather logic | — | Rain petals wet, snow branches frost (cel-shaded) |

---

## V. Angle Variants

### Angle Definitions

> Derivative images relative to the reference image can switch in the following angle dimensions. The caller will provide the reference image + target angle description. This document only defines angle vocabulary and consistency constraints.

| Angle | Description | Prompt |
|---|---|---|
| Front / Forward View | Compared to reference, line of sight toward scene front | front view, eye level |
| Side (Left/Right) | Toward scene left/right 90° eye level | left side view / right side view |
| Back / Rear View | Toward scene back 180° | back view |
| High Angle | Overhead looking down, showing overall layout | high angle, bird's eye view |
| Low Angle | Low looking up, emphasizing tall subject | low angle, worm's eye view |
| Push-In | Same direction but lens pushed in, focusing on part | push-in, closer angle |
| Free Angle | Any angle description defined by caller | Inject per `{target angle}` |

### Angle Derivative Specifications

| Item | Constraint |
|---|---|
| Reference Consistency | Building structure/layout/material/color tone/lighting/season/weather must match reference (cel-shaded treatment) |
| Viewpoint | Same scene center point, angle only;line of sight height can adjust with angle |
| Lighting Logic | Reference light source direction unchanged, light projection direction must recalculate after angle switch (cel-shaded treatment) |
| Layout | Single image (not collage, not multi-view, not split screen) |
| People | **No people, human figures, or silhouettes allowed** |
| Aspect Ratio | Default 16:9 (or per caller setting) |

---

## VI. Prompt Template
```
3D animation render, cinematic lighting, vibrant cel-shaded texture, high-detail materials, joyful healing atmosphere, cartoon urban style, high-detail cartoon materials, moderate cartoon proportions, warm color palette, 8K ultra HD, cinematic composition, soft light and shadow layers, bright cartoon render style, warm and healing, derivative scene image, based on reference,
anime style, cel-shaded, 3D animation render,
film lighting, warm sunset lighting,
scene derivative design sheet, environment concept art, no people, no characters, no human figures,
Maintain scene spatial structure consistent,
{target angle (if any)}, {framing perspective (if any)}, {time description (if any)}, {weather description (if any)},
{foreground}, {midground}, {background},
{color tone description}, {depth description (if any)}, {sky tone change (if any)}, {atmosphere adjustment (if any)},
{weather visual characteristics (if any)}, {material surface change (if any)}, {vegetation adaptation description (if any)},
Natural material use marks, lived-in wear, fabric natural folds (cel-shaded),
Natural light diffusion, volumetric light, cel-shaded light effects, cel-shaded shadows,
Atmospheric perspective, clear texture, cel-shaded treatment,
Single image composition, maintain building structure/material/color tone/lighting consistent with reference, only switch viewpoint per target angle,
No people in the image,
Cel-shaded render style, soft light and shadow, moderate cartoon proportions, high-detail cartoon materials,
Warm color palette, dusk glow atmosphere, joyful healing atmosphere,
8K ultra HD, cinematic composition,
No text in the image
```

> **Usage Note**: Determine which change dimensions (angle/framing/time/weather) to apply based on user-provided information. Leave fields blank for dimensions not mentioned. No need to generate separate templates for each variant type.

---

## VII. Constraint Rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Scene spatial structure consistent across all variants |
| R2 | Time variants must adjust sky tone and atmosphere (cel-shaded) |
| R3 | Weather variants must adapt vegetation/material surfaces (cel-shaded) |
| R4 | Derivative image must be "single image", no multi-view splicing/grid/split screen |
| R5 | Derivative image must maintain building structure/material/color tone/lighting consistent with reference, only switch viewpoint per specified angle |
| R6 | **No people allowed** in scene images |
| R7 | Depending on user-provided information, determine change dimensions (angle/framing/time/weather), leave unnamed dimensions blank |
| R8 | Must include 3D animation render keywords (cel-shaded, 3D animation render, anime style) |
| R9 | Must include lens optical characteristics (shallow depth of field / lens vignette / bokeh at least one, cel-shaded treatment) |
| R10 | Materials must have natural wear/age marks, no pristine "CG feel", but cel-shaded presentation |
| R11 | Must maintain cel-shaded render style consistency, no mixing with realistic elements |
| R12 | Must include warm color palette, dusk glow atmosphere keywords |
| R13 | Must include 8K ultra HD, cinematic composition keywords |
| R14 | Must include cinematic lighting, joyful healing atmosphere keywords |

### Prohibited

| No. | Prohibited |
|---|---|
| X1 | Building structure/layout inconsistent across variants |
| X2 | Weather contradicting season (summer snow etc., within cel-shaded limits) |
| X3 | Material/style sudden change across variants |
| X4 | Any people, human figures, silhouettes, or body outlines |
| X5 | Image spliced into multi-view/grid/split-screen layout |
| X6 | 3D render/CG animation/cartoon/game engine quality (disable terms like 3D render, CGI, Unreal Engine, Unity), but clearly cel-shaded animation render |
| X7 | Materials too clean and perfect, without any use marks or sense of age (avoid "plastic feel"), must be cel-shaded treatment |
| X8 | Lighting too even and flat, no depth of field blur, no lens optical characteristics |
| X9 | Using realistic photography terms (e.g., real photography, photorealistic, RAW photo etc.) |
| X10 | Ancient/futuristic elements, non-modern urban style |
| X11 | Cool tones/night primary tones, non-warm tones/dusk atmosphere |
| X12 | Missing joyful healing atmosphere keywords |
