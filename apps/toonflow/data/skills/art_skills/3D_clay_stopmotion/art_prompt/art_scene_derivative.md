# Clay Stop-Motion Scene Derivative Asset Generation · Constraint Manual

---

## I. Derivative Principles

1. **Space Consistent** — Building structure/layout/materials consistent across all variants
2. **Framing Driven** — Same scene shows different narrative functions through different framings
3. **Time Switch** — Same space presents different warm-toned light and shadow atmospheres at different times
4. **Weather Change** — Same space presents different moods under different weather
5. **Stop-Motion as Anchor** — All variants must maintain stop-motion clay style

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
| Early Morning | Warm soft light, warm-golden tones | Morning light, early morning warm tone |
| Noon | Bright, short shadows, vivid colors | Noon sun, bright lighting |
| Dusk | Warm golden tones, long shadows, sky gradient | Dusk warm gold, golden hour |
| Night (Moonlight) | Cool blue tones, quiet and serene | Moonlight glow, moonlight |
| Night (Lamplight) | Warm yellow accents, light-dark contrast | Lamplight flickering, candlelight dots |

### Time Derivative Specifications

| Derived from Base Time | Stay Unchanged | Change Items |
|---|---|---|
| Daytime → Dusk | Building/layout/material | Sky tone warm, shadows lengthen |
| Daytime → Night | Building/layout/material | Overall darker, add lamplight/moonlight atmosphere |
| Indoor Day → Indoor Night | Space structure, furniture | Overall tone warmer, add candle/fire/lantern elements |

---

## IV. Weather Variants

### Weather Definitions

| Weather | Visual Characteristics | Prompt |
|---|---|---|
| Sunny | Bright, clear shadows | Clear sky, bright sunshine |
| Cloudy | Even light, no hard shadows | Cloudy soft light, overcast |
| Misty | Reduced visibility, hazy air | Mist pervasive, fog around |
| Light Rain | Water droplets, wet reflection, rain streaks | Rain like silk, rain veil |
| Snowfall | White covering, snowflakes falling | Snowflakes falling, silver white world |

### Weather Derivative Specifications

| Derived from Base Weather | Stay Unchanged | Change Items |
|---|---|---|
| Sunny → Misty | Building/layout | Add fog layer, distant blur, lower saturation |
| Sunny → Light Rain | Building/layout | Add rain streaks, ground reflection, cooler tones |
| Sunny → Snowfall | Building/layout | Add snow accumulation, snowflakes, whiter tones |
| Vegetation must adapt to weather logic | — | Rain petals wet, snow branches frost |

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
| Reference Consistency | Building structure/layout/material/color tone/lighting/season/weather must match reference |
| Viewpoint | Same scene center point, angle only; sight height can adjust with angle |
| Lighting Logic | Reference light source direction unchanged, light projection direction must recalculate after angle switch (maintain warm soft light) |
| Layout | Single image (not collage, not multi-view, not split screen) |
| People | **No people, human figures, or silhouettes allowed** |
| Aspect Ratio | Default 16:9 (or per caller setting) |

---

## VI. Prompt Template

```
Clay stop-motion derivative scene image, based on reference, stop-motion style, 3D cartoon render, warm-toned lighting, soft shallow depth of field,
claymation style, stop-motion aesthetic, warm lighting, shallow depth of field, bokeh,
scene derivative design sheet, environment concept art, no people, no characters, no human figures,
Maintain scene spatial structure consistent,
{target angle (if any)}, {framing perspective (if any)}, {time description (if any)}, {weather description (if any)},
{foreground}, {midground}, {background},
{color tone description}, {depth description (if any)}, {sky tone change (if any)}, {atmosphere adjustment (if any)},
{weather visual characteristics (if any)}, {material surface change (if any)}, {vegetation adaptation description (if any)},
Natural material wear marks, age patina, moss weathering, fabric natural folds,
Warm soft light diffusion, volumetric light, warm-toned lens flare, shallow depth of field blur,
Atmospheric perspective, ultra-clear texture details,
Single image composition, maintain building structure/material/color tone/lighting consistent with reference, only switch viewpoint per target angle,
No people in the image
No text in the image
```

---

## VII. Constraint Rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Scene spatial structure consistent across all variants |
| R2 | Time variants must adjust sky tone and atmosphere |
| R3 | Weather variants must adapt vegetation/material surfaces |
| R4 | Derivative image must be "single image", no multi-view splicing/grid/split screen |
| R5 | Derivative image must maintain building structure/material/color tone/lighting consistent with reference, only switch viewpoint per specified angle |
| R6 | **No people allowed** in scene images |
| R7 | Depending on user-provided information, determine change dimensions (angle/framing/time/weather), leave unnamed dimensions blank |
| R8 | Must include stop-motion keywords (claymation / stop-motion) |
| R9 | Must include shallow depth of field keywords (shallow depth of field / bokeh) |
| R10 | Must specify "warm soft light" |
| R11 | Materials must have natural wear/age marks |

### Prohibited

| No. | Prohibited |
|---|---|
| X1 | Building structure/layout inconsistent across variants |
| X2 | Weather contradicting season |
| X3 | Material/style sudden change across variants |
| X4 | Any people, human figures, silhouettes |
| X5 | Image spliced into multi-view/grid/split-screen layout |
| X6 | Realistic photography/3D render/CG animation quality |
| X7 | Materials too clean and perfect, without any use marks |
| X8 | Cold hard lighting/high contrast/hard shadows |
