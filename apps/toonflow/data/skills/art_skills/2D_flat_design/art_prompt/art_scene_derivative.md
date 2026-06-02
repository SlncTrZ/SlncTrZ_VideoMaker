# Scene Derivative Asset Generation · Flat Design Constraint Manual

---

## I. Derivative Principles

1. **Spatial Consistency** — Building structure/layout/materials consistent across all variants
2. **Shot-Driven** — Same scene shown through different shots for different narrative functions
3. **Time Switching** — Same space at different times presents different tone color blocks
4. **Weather Variation** — Same space under different weather conditions presents different color atmospheres
5. **Flat Anchored** — All variants must maintain flat vector illustration texture, reject 3D rendering/CG animation feel; maintain simple lines, solid color fill

---

## II. Shot Variants

### Shot Definitions

| Shot | Range | Narrative Function | Prompt Keywords |
|---|---|---|---|
| Extreme Wide Shot | Scene overview + surrounding environment | Establish spatial awareness, location | extreme wide shot, extreme wide shot, flat extreme wide |
| Wide Shot | Complete scene presentation | Show spatial structure | wide shot, wide shot, flat wide |
| Medium Shot | Scene partial area | Focus on functional area | medium shot, medium shot, flat medium |
| Close Shot | Scene details | Color block/atmosphere prop close-up | close shot, close shot, flat close |
| Extreme Close-up | Extremely local details | Color block texture/key props | extreme closeup, extreme closeup, flat extreme close |

### Shot Derivative Specifications

| Derived From Base | Keep Unchanged | Allow Changes |
|---|---|---|
| Extreme Wide → Wide | Building exterior, overall layout | Narrower perspective, increased foreground color blocks |
| Wide → Medium | Material, tone, lighting | Crop focus, solid color change |
| Medium → Close | Material, tone | Solid color focus, background color blocks |
| Close → Extreme Close-up | Color block texture | Solid color focus, macro color blocks |

---

## III. Time Variants

### Time Definitions

| Time | Visual Characteristics | Prompt Keywords |
|---|---|---|
| Early Morning | Flat tone, light color blocks | Flat early morning, light morning colors |
| Noon | Flat bright, solid color blocks | Flat noon, solid bright |
| Dusk | Flat golden, warm color blocks | Flat dusk, warm golden glow |
| Night (Moonlight) | Flat cool blue, dark color blocks | Flat moonlight, cool blue moonlight |
| Night (Lamplight) | Flat warm yellow, dark background | Flat lamplight, warm yellow dark background |

### Time Derivative Specifications

| Derived From Base Time | Keep Unchanged | Change Items |
|---|---|---|
| Daytime → Dusk | Building/layout/materials | Sky color block warms, shadow color blocks |
| Daytime → Night | Building/layout/materials | Overall color blocks darken, add lamplight/moonlight color blocks |
| Indoor Day → Indoor Night | Spatial structure, furniture | Overall color blocks warm, add candle flame/lantern color blocks |

---

## IV. Weather Variants

### Weather Definitions

| Weather | Visual Characteristics | Prompt Keywords |
|---|---|---|
| Sunny | Flat bright, solid color blocks | Flat sunny, solid sunny day |
| Cloudy | Flat even, gray color blocks | Flat cloudy, gray soft light |
| Mist | Flat hazy, low saturation color blocks | Flat mist, hazy color blocks |
| Light Rain | Flat rain streaks, wet color blocks | Flat light rain, wet color blocks |
| Snowfall | Flat white, covering color blocks | Flat snowfall, white covering |

### Weather Derivative Specifications

| Derived From Base Weather | Keep Unchanged | Change Items |
|---|---|---|
| Sunny → Mist | Building/layout | Add flat fog layer, distant color block blur, saturation decrease |
| Sunny → Light Rain | Building/layout | Add flat rain streaks, ground color blocks, tone slightly cool |
| Sunny → Snowfall | Building/layout | Add flat snow cover, snowflake color blocks, tone leaning to white |
| Vegetation must adapt to weather logic | — | Flat rain color, flat snow color |

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
| Reference Consistency | Building structure/layout/material/tone/season/weather must match reference |
| Viewpoint | Same scene center point, only angle switch; eye height can adjust with angle |
| Lighting Logic | Maintain flat no-light-and-shadow logic, consistent with reference |
| Layout | Single frame (no collage, no multi-view, no split screen) |
| Characters | **No people, human figures, or body outlines allowed** |
| Aspect Ratio | Default 1:1 (or per caller setting) |

---

## VI. Prompt Template

```
Flat ancient-style derivative scene image, based on reference image,
2d flat design, vector art, flat illustration,
minimalist, clean lines, solid colors,
flat scene derivative, environment concept art, no people, no characters, no human figures,
maintain scene spatial structure consistency,
{target angle (if any)}, {shot perspective (if any)}, {time description (if any)}, {weather description (if any)},
{foreground color block}, {midground color block}, {background color block},
{tone description}, {color block change (if any)}, {sky color block change (if any)}, {atmosphere adjustment (if any)},
{weather visual characteristics (if any)}, {material color block change (if any)}, {vegetation adaptation description (if any)},
no years of marks, no wear, flat perfect,
no lighting, no shadows, solid color flat painting,
no perspective, solid color fill,
single frame composition, maintain building structure/material/tone consistency with reference, only switch viewpoint to target angle,
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
| R2 | Time variants must adjust color block tone and atmosphere |
| R3 | Weather variants must adapt color blocks/material surfaces |
| R4 | Derivative image must be "single frame," no multi-view collage/grid/split screen |
| R5 | Derivative image must maintain building structure/material/tone consistency with reference, only switch viewpoint to specified angle |
| R6 | **No people allowed** in scene images |
| R7 | Determine change dimensions (angle/shot/time/weather) based on user-provided information; leave unmentioned dimensions empty/omitted |
| R8 | Must specify "flat style" keywords (2d flat design, vector art) |
| R9 | Must specify "no light and shadow no gradient" |
| R10 | Materials must be solid color fill, prohibit complex texture/aged feel |

### Prohibited

| Number | Prohibition |
|---|---|
| X1 | Inconsistent building structure/layout between variants |
| X2 | Weather contradicting season (summer snowfall, etc.) |
| X3 | Sudden material/style change between variants |
| X4 | Any people, human figures, human silhouettes, or human body outlines appearing |
| X5 | Image assembled into multi-view/grid/split-screen layout |
| X6 | 3D rendering/CG animation/cartoon/game engine texture (disable 3D render, CGI, Unreal Engine, Unity, etc.) |
| X7 | Materials too complex, color blocks not clearly distinguishable |
| X8 | Adding light and shadow/shading/gradient/three-dimensional effects |
