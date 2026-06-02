# 90s Retro Japanese Anime Style - Scene Derivative Asset Generation · Constraint Manual

---

## I. Derivative Principles

1. **Spatial Consistency** — Building structure/layout/materials consistent across all variants
2. **Shot-Driven** — Same scene shown through different shots for different narrative functions
3. **Time Switching** — Same space at different times presents different light and shadow atmospheres
4. **Weather Variation** — Same space under different weather conditions presents different moods
5. **90s Anchored** — All variants must maintain 90s retro style, reject modern CG/3D rendering

---

## II. Shot Variants

### Shot Definitions

| Shot | Range | Narrative Function | Prompt Keywords |
|---|---|---|---|
| Extreme Wide Shot | Scene overview + surrounding environment | Establish spatial awareness, location | extreme wide shot |
| Wide Shot | Complete scene presentation | Show spatial structure | wide shot |
| Medium Shot | Scene partial area | Focus on functional area | medium shot |
| Close Shot | Scene details | Material/atmosphere prop close-up | close shot |
| Extreme Close-up | Extremely local details | Material texture/key props | extreme closeup |

### Shot Derivative Specifications

| Derived From Base | Keep Unchanged | Allow Changes |
|---|---|---|
| Extreme Wide → Wide | Building exterior, overall layout | Narrower perspective, increased foreground |
| Wide → Medium | Material, tone, lighting | Crop focus, depth of field change |
| Medium → Close | Material, tone | Shallow depth of field, background blur |
| Close → Extreme Close-up | Material texture | Extremely shallow depth of field, macro feel |

---

## III. Time Variants

### Time Definitions

| Time | Visual Characteristics | Prompt Keywords |
|---|---|---|
| Early Morning | Misty soft light, slightly cool tones | Morning light, early morning mist |
| Noon | Bright, short shadows, vivid colors | Midday sun, bright light |
| Dusk | Golden tones, long shadows, sky gradient | Dusk, golden hour |
| Night (Moonlight) | Cool blue tones, quiet and cool | Moonlight, moonlit night |
| Night (Lamplight) | Warm yellow accents, light-dark contrast | Night, lamplight |

### Time Derivative Specifications

| Derived From Base Time | Keep Unchanged | Change Items |
|---|---|---|
| Daytime → Dusk | Building/layout/materials | Sky tone warms, shadows lengthen |
| Daytime → Night | Building/layout/materials | Overall darkens, add lamplight/moonlight |
| Indoor Day → Indoor Night | Spatial structure, furniture | Overall tone warms, add light sources |

---

## IV. Weather Variants

### Weather Definitions

| Weather | Visual Characteristics | Prompt Keywords |
|---|---|---|
| Sunny | Bright, clear shadows | Sunny, bright sunshine |
| Cloudy | Even light, no hard shadows | Cloudy, soft light |
| Mist | Reduced visibility, hazy air | Mist, foggy |
| Light Rain | Water droplets, wet reflections | Light rain, rain streaks |
| Snowfall | White covering, snowflakes falling | Snowfall, snowflakes |

### Weather Derivative Specifications

| Derived From Base Weather | Keep Unchanged | Change Items |
|---|---|---|
| Sunny → Mist | Building/layout | Add fog layer, distant blur |
| Sunny → Light Rain | Building/layout | Add rain streaks, ground reflections |
| Sunny → Snowfall | Building/layout | Add snow cover, snowflakes |
| Vegetation must adapt to weather logic | — | Rain: plants wet, Snow: plants frosted |

---

## V. Angle Variants

### Angle Definitions

> Derivative image relative to reference image, can switch on the following angle dimensions. The caller provides reference image + target angle description; this document only defines angle vocabulary and consistency constraints.

| Angle | Description | Prompt Keywords |
|---|---|---|
| Front/Forward | Compared to reference, line of sight toward scene front | front view, eye level |
| Side (Left/Right) | 90° flat view to left/right of scene | left side view / right side view |
| Back/Rear | 180° toward scene back | back view |
| Top-Down | High angle overview, showing overall layout | high angle, bird's eye view |
| Low Angle | Low angle looking up, emphasizing tall subjects | low angle, worm's eye view |
| Push-In | Same direction but camera pushed in, focusing on details | push-in, closer angle |
| Free Angle | Any angle description customized by caller | Inject via `{target angle}` |

### Angle Derivative Specifications

| Item | Constraint |
|---|---|
| Reference Consistency | Building structure/layout/material/tone/lighting/season/weather must match reference |
| Viewpoint | Same scene center point, only angle switch; eye height can adjust with angle |
| Lighting Logic | Reference light source direction unchanged; shadow projection recalculated after angle switch (maintain physical reasonability) |
| Layout | Single frame (no collage, no multi-view, no split screen) |
| Characters | **No people, human figures, or body outlines allowed** |
| Aspect Ratio | Default 16:9 (or per caller setting) |

---

## VI. Prompt Template
```
90s retro Japanese anime style derivative scene image, based on reference image,
90s anime style, hand-drawn flat coloring, soft warm tones, fine flowing lines, cinematic lighting,
scene derivative design sheet, environment concept art, no people, no characters, no human figures,
maintain scene spatial structure consistency,
{target angle (if any)}, {shot perspective (if any)}, {time description (if any)}, {weather description (if any)},
{foreground}, {midground}, {background},
{tone description}, {depth of field description (if any)}, {sky tone change (if any)}, {atmosphere adjustment (if any)},
{weather visual characteristics (if any)}, {material surface change (if any)}, {vegetation adaptation description (if any)},
flowing lines, block shading, use marks,
soft cinematic light, background glow, natural lighting,
single frame composition, maintain building structure/material/tone/lighting consistency with reference, only switch viewpoint to target angle,
no people in the frame
no text in the image
```

> **Usage Notes**: Based on information provided by the user, determine which change dimensions (angle/shot/time/weather) need to be applied. Leave fields for unmentioned dimensions empty/omitted. No need to generate separate templates for each variant.

---

## VII. Constraint Rules

### Mandatory

| Number | Rule |
|---|---|
| R1 | Scene spatial structure consistent across all variants |
| R2 | Time variants must adjust sky tone and atmosphere |
| R3 | Weather variants must adapt vegetation/material surfaces |
| R4 | Derivative image must be "single frame," no multi-view collage/grid/split screen |
| R5 | Derivative image must maintain building structure/material/tone/lighting consistency with reference, only switch viewpoint to specified angle |
| R6 | **No people allowed** in scene images |
| R7 | Determine change dimensions (angle/shot/time/weather) based on user-provided information; leave unmentioned dimensions empty/omitted |
| R8 | Must include 90s keywords (90s anime style / hand-drawn / warm tone) |
| R9 | Must include line features (flowing lines, block shading — at least one) |
| R10 | Materials must show signs of use, prohibit flawless "CG feel" |

### Prohibited

| Number | Prohibition |
|---|---|
| X1 | Inconsistent building structure/layout between variants |
| X2 | Weather contradicting season |
| X3 | Sudden material/style change between variants |
| X4 | Any people, human figures, or human silhouettes appearing |
| X5 | Image assembled into multi-view/grid/split-screen layout |
| X6 | 3D rendering/CG animation/modern style texture |
| X7 | Materials too clean and perfect, no signs of use |
| X8 | Lighting too even and flat, no soft cinematic light |
