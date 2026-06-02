# Scene Derivative Asset Generation · Constraint Manual

---

## I. Derivative Principles

1. **Spatial Consistency** — Building structure/layout/materials remain consistent across all variants
2. **Shot Scale Drive** — Same scenedisplaying different narrative functions through different shot scales
3. **Time Period Switch** — Same space presents different light and shadow atmosphere at different times
4. **Weather Variation** — Same space presents different moods under different weather conditions
5. **Real Shot Anchor** — All variants must maintain real photo texture, reject 3D render/CG animation feel; preserve lens optical characteristics and physical lighting

---

## II. Shot Scale Variants

### Shot Scale Definitions

| Shot Scale | Range | Narrative Function | Prompt |
|---|---|---|---|
| Extreme wide shot | Full scene + surrounding environment | Establish spatial feel, positioning | extreme wide shot |
| Wide shot | Complete scene presentation | Show spatial structure | wide shot |
| Medium shot | Scene partial area | Focus on functional zone | medium shot |
| Close shot | Scene detail | Material/atmosphere prop close-up | close shot |
| Extreme close-up | Extremelyclose-up part detail | Material texture/key prop | extreme closeup |

### Shot Scale Derivative Specifications

| Deriving from Base | Keep Unchanged | Allow Changes |
|---|---|---|
| Extreme wide → Wide | Building exterior, overall layout | Narrower perspective, increased foreground |
| Wide → Medium | Material, tone, lighting | Cropped focus, depth of field change |
| Medium → Close | Material, tone | Shallow depth of field, background blur |
| Close → Extreme close-up | Material texture | Extremely shallow depth of field, macro feel |

---

## III. Time Period Variants

### Time Period Definitions

| Period | Visual Features | Prompt |
|---|---|---|
| Early morning | Misty soft light, tone slightly warm-cool interwoven | Morning light dim, early morning mist |
| Noon | Bright, short shadows, vivid colors | Noon sunlight, bright light |
| Dusk | Golden tones, long shadows, sky gradient | Dusk golden glow, golden hour |
| Night (moonlight) | Cool blue tone, quiet and cold | Moonlight clear glow, moonlight |
| Night (lamplight) | Warm yellow accents, light-dark contrast | Lamplight flickering, candlelight dots |

### Time Period Derivative Specifications

| Deriving from Base Period | Keep Unchanged | Changes |
|---|---|---|
| Daytime → Dusk | Building/layout/materials | Sky tone warming, shadows lengthening |
| Daytime → Night | Building/layout/materials | Overall darkening, add lamplight/moonlight atmosphere |
| Indoor daytime → Indoor night | Spatial structure, furniture | Overall tone warming, add candle/fire/lantern elements |

---

## IV. Weather Variants

### Weather Definitions

| Weather | Visual Features | Prompt |
|---|---|---|
| Sunny | Bright, clear shadows | Clear skies, bright sunshine |
| Overcast | Even light, no hard shadows | Cloudy soft light, overcast |
| Light mist | Reduced visibility, hazy air | Mist pervasive, fog swirling |
| Drizzle | Water droplets, wet reflections, rain strands | Drizzle like silk, rain curtain like gauze |
| Snowfall | White covering, snowflakes falling | Snowflakes flying, silver-clad white |

### Weather Derivative Specifications

| Deriving from Base Weather | Keep Unchanged | Changes |
|---|---|---|
| Sunny → Mist | Building/layout | Add fog layer, distant view blurry, saturationdecreased |
| Sunny → Drizzle | Building/layout | Add rain strands, ground reflections, tone slightly cool |
| Sunny → Snowfall | Building/layout | Add snow accumulation, snowflakes, tone slightly white |
| Vegetation must adapt to weather logic | — | Petals wet in rain, withered branches hung with frost in snow |

---

## V. Angle Variants

### Angle Definitions

> Derivative images relative to reference image can switch on the following angle dimensions. Caller provides reference image + target angle description; this document only defines angle vocabulary and consistency constraints.

| Angle | Description | Prompt |
|---|---|---|
| Front/front view | Compared to reference,line of sight facing scene front | front view, eye level |
| Side (left/right) | Facing scene left/right 90° at eye level | left side view / right side view |
| Back/back view | Facing scene back 180° | back view |
| High angle/top-down | High elevationoverlooking view, presenting overall layout | high angle, bird's eye view |
| Low angle/bottom-up | Low elevation looking up, emphasizing tall subject | low angle, worm's eye view |
| Close-up push-in | Same direction but lens pushed in, focusing onclose-up part | push-in, closer angle |
| Custom angle | Any angle description defined by caller | Inject per `{target angle}` |

### Angle Derivative Specifications

| Item | Constraint |
|---|---|
| Reference consistency | Building structure/layout/material/tone/lighting/season/weather must match reference |
| Viewpoint | Same scene center point, only angle switch;line of sight height adjustable per angle |
| Lighting logic | Reference light direction unchanged, light-shadow projection direction must be recalculated after angle switch (maintain physical plausibility) |
| Layout | Single frame (not collage, not multi-view, not split-screen) |
| Figures | **Strictly prohibited: any person, figure silhouette, body contour** |
| Aspect ratio | Default 16:9 (or per caller specification) |

---

## VI. Prompt Template

```
Ancient style derivative scene image, based on reference,
real photography, photorealistic, shot on ARRI Alexa, 35mm film grain,
RAW photo, ultra realistic, hyper detailed,
shallow depth of field, natural lens vignette, subtle chromatic aberration, bokeh,
real photo texture, film grain feel, natural lighting, physical light and shadow,
scene derivative design sheet, environment concept art, no people, no characters, no human figures,
Keep scene spatial structure consistent,
{target angle (if any)}, {shot scale perspective (if any)}, {time period description (if any)}, {weather description (if any)},
{foreground}, {midground}, {background},
{tone description}, {depth of field description (if any)}, {sky tone change (if any)}, {atmosphere adjustment (if any)},
{weather visual features (if any)}, {material surface change (if any)}, {vegetation adaptation description (if any)},
material natural wear traces, age patina, moss weathering, fabric natural drape folds,
natural light diffusion, volumetric light, Tyndall effect, caustic shadows,
aerial perspective, texture detail ultra-clear,
single-frame composition, keep building structure/material/tone/lighting consistent with reference, only switch viewpoint per target angle,
No people in the frame
No text in the image
```

> **Usage Note**: Based on information provided by user, determine which change dimensions (angle/shot scale/time period/weather) to apply. Leave fields for unmentioned dimensions blank/omit. No need to generate separate templates per variant type.

---

## VII. Constraint Rules

### Mandatory

| # | Rule |
|---|---|
| R1 | Scene spatial structure remains consistent across all variants |
| R2 | Time period variant must adjust sky tone and atmosphere |
| R3 | Weather variant must adapt vegetation/material surface |
| R4 | Derivative image must be a "single frame", cannot splice multiple views/grid/split-screen |
| R5 | Derivative image must keep building structure/material/tone/lighting consistent with reference, only switch viewpoint per specified angle |
| R6 | **Strictly prohibit any person** in scene image |
| R7 | Based on user-provided information, determine change dimensions (angle/shot scale/time period/weather); leave unmentioned dimensions blank/omit |
| R8 | Must include real photography keywords (real photography / photorealistic / RAW photo) |
| R9 | Must include lens optical characteristics (shallow depth of field / lens vignette / bokeh at least one) |
| R10 | Materials must have natural wear/traces of age, prohibit brand-new flawless "CG feel" |

### Strictly Prohibited

| # | Strictly Prohibited |
|---|---|
| X1 | Building structure/layout inconsistent between variants |
| X2 | Weather contradicts season (summer snow etc.) |
| X3 | Material/style abrupt change between variants |
| X4 | Any person, figure silhouette, human shadow or body contour |
| X5 | Frame spliced into multi-view/grid/split-screen layout |
| X6 | 3D render/CG animation/cartoon/game engine feel (disable 3D render, CGI, Unreal Engine, Unity etc.) |
| X7 | Material too clean and perfect, no use traces or age feel (avoid "plastic feel") |
| X8 | Lighting too uniform and flat, no depth of field blur, no lens optical characteristics |

---

