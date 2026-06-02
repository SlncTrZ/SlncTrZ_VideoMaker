# 3D Anime Render Urban Scene Image Generation · Constraint Manual

---

## I. Scene Aesthetic Principles

1. **Spatial Narrative** — The scene carries emotion and narrative function, not just a background
2. **Depth Layers** — All scenes must have foreground/midground/background, no flatness
3. **Texture First** — Material textures like wood grain/stone/cloth/water surface must be clear, but cel-shaded render simplified
4. **Cel-Shaded as Anchor** — All imagery uses 3D animation render + cel-shaded as standard, reject realistic photography/CG animation quality; maintain animation style consistency and lens characteristics
5. **Urban Atmosphere** — Modern urban landscape, architectural style, unified color tones

---

## II. Seasonal Color Mapping

| Season | Primary Color | Secondary Color | Prompt |
|---|---|---|---|
| Spring | Green + Peach Pink | Light blue, Light yellow | Spring green, flowers blooming |
| Summer | Verdant + Lotus Pink | Sky blue, White | Summer vibrant, trees shading |
| Autumn | Crimson + Golden Yellow | Amber, Light gray | Autumn deep, red leaves falling |
| Winter | Pure White + Frost Silver | Deep blue, Light gray | Winter snow covering, winter tranquility |

---

## III. Urban Architecture

### Spatial Specifications

| Dimension | Constraint | Prompt |
|---|---|---|
| Style | Modern urban, office/residential/commercial | Modern urban architecture |
| Material | Glass/concrete/metal primarily (cel-shaded) | Modern material, cel-shaded render |
| Color Tone | Warm tones primarily, dusk glow atmosphere | Warm tones, dusk atmosphere |
| Depth | Fore/mid/background layers (cel-shaded depth) | Foreground {element}, midground {element}, background {element} |
| Texture | Building texture clear (cel-shaded) | Clear texture, cel-shaded quality |
| Lighting | Natural light primarily (window light/street lamp), soft lighting | Natural light, soft lighting |
| Lens Feel | Shallow depth of field blurring fore/background, cel-shaded lens effect | shallow depth of field, cel-shaded lens |
| Imperfection | Buildings have use marks, natural wear (cel-shaded) | Natural wear, cel-shaded treatment |

### Urban Type Quick Reference

| Type | Core Elements | Atmosphere Words |
|---|---|---|
| Commercial District | High-rises/shops/billboards | Bustling lively, modern urban |
| Residential Area | Apartment buildings/gardens/streets | Warm living, quiet community |
| Office District | Office buildings/parking/coffee area | Workplace atmosphere, business vibe |
| Park/Green Space | Trees/paths/benches | Relaxing, lush greenery |
| Transport Hub | Subway station/bus stop/pedestrian bridge | Busy traffic, urban pulse |
| Riverside/Lakeside | Water/paths/lighting | Romantic atmosphere, beautiful waterscape |

---

## IV. Indoor/Outdoor Scenes

### Indoor Space Specifications

| Dimension | Constraint | Prompt |
|---|---|---|
| Style | Office/café/apartment/convenience store | Modern interior style |
| Material | Flooring/walls/furniture (cel-shaded) | Modern material, cel-shaded render |
| Color Tone | Warm tones primarily, dusk atmosphere | Warm tones, cozy atmosphere |
| Depth | Fore/mid/background layers | Foreground {element}, midground {element}, background {element} |
| Texture | Material texture clear (cel-shaded) | Clear texture, cel-shaded quality |
| Lighting | Natural light + indoor lighting, soft | Natural light, indoor lighting, soft |
| Lens Feel | Shallow depth of field blurring fore/background | shallow depth of field, indoor lens |
| Imperfection | Furniture has use marks, natural wear | Natural wear, cel-shaded treatment |

### Indoor Type Quick Reference

| Type | Core Elements | Atmosphere Words |
|---|---|---|
| Office | Desk/computer/files/chair | Workplace atmosphere, business vibe |
| Café | Coffee tables/seats/counter/decoration | Warm cozy, casual atmosphere |
| Apartment | Sofa/bed/bookshelf/decoration | Homey warmth, comfortable space |
| Convenience Store | Shelves/register/drinks | Daily convenience, everyday feel |
| Restaurant | Dining table/chairs/kitchen | Dining atmosphere, warm meal |
| Gym | Treadmill/equipment/mirror | Sports atmosphere, energetic space |

---

## V. Main View Specifications

### View Definition

> Single image main view, shot from the most representative angle of the scene, carrying spatial narrative and composition focus.

| Item | Constraint | Prompt |
|---|---|---|
| Perspective | Natural observation angle, composition best showcases scene subject and depth | hero shot, representative angle |
| Viewpoint Height | Default human eye level, special scenes can be high/low angle | eye level (default) |
| Composition | Subject centered or following rule of thirds, fore/mid/background layers clear | balanced composition |

### Frame Specifications

| Item | Constraint |
|---|---|
| Layout | Single image (not collage, not multi-view, not split screen) |
| People | **No people, human figures, or human silhouettes allowed** |
| Consistency | Style/material/color tone/lighting unified (cel-shaded treatment) |
| Lighting | Single light source logic, consistent light direction (cel-shaded treatment) |
| Aspect Ratio | Default 16:9 (or per caller setting) |

---

## VI. Prompt Template
```
3D animation render, cinematic lighting, vibrant cel-shaded texture, high-detail materials, joyful healing atmosphere, cartoon urban style, high-detail cartoon materials, moderate cartoon proportions, warm color palette, 8K ultra HD, cinematic composition, soft light and shadow layers, bright cartoon render style, warm and healing, urban scene main view concept art,
anime style, cel-shaded, 3D animation render,
film lighting, warm sunset lighting,
scene design sheet, environment concept art, no people, no characters, no human figures,
{indoor/outdoor}, {scene type}, {architectural style}, {season+time},
Foreground: {element}, midground: {element}, background: {element},
{color tone description}, {weather/atmosphere element},
{material description}, atmospheric perspective, clear texture, cel-shaded treatment,
Natural material use marks, lived-in wear, fabric natural folds (cel-shaded),
Natural light diffusion, volumetric light, cel-shaded light effects, cel-shaded shadows,
Single image composition, natural observation angle, composition can represent scene subject and show fore/mid/background layers,
No people in the image,
Cel-shaded render style, soft light and shadow, moderate cartoon proportions, high-detail cartoon materials,
Warm color palette, dusk glow atmosphere, joyful healing atmosphere,
8K ultra HD, cinematic composition,
No text in the image
```

---

## VII. Constraint Rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Scene must have "fore/mid/background layers" |
| R2 | Outdoor must include "atmospheric perspective" |
| R3 | Scene image must be "single image main view", no multi-view splicing/split-screen/grid |
| R4 | Composition must represent scene subject and show fore/mid/background layers |
| R5 | **No people allowed** in scene images |
| R6 | Must include 3D animation render keywords (cel-shaded, 3D animation render, anime style) |
| R7 | Must include lens optical characteristics (shallow depth of field / lens vignette / bokeh at least one, cel-shaded treatment) |
| R8 | Materials must have natural wear/age marks, no pristine "CG feel", but cel-shaded presentation |
| R9 | Must maintain cel-shaded render style consistency, no mixing with realistic elements |
| R10 | Must include warm color palette, dusk glow atmosphere keywords |
| R11 | Must include 8K ultra HD, cinematic composition keywords |

### Prohibited

| No. | Prohibited |
|---|---|
| X1 | Pure white/pure black/no scene background |
| X2 | Extreme weather (storms/lightning/blizzard, unless story requires, and must be cel-shaded) |
| X3 | Scene without depth/layers |
| X4 | Vegetation/weather contradicting season |
| X5 | Any people, human figures, silhouettes, or body outlines |
| X6 | Image spliced into multi-view/grid/split-screen layout |
| X7 | 3D render/CG animation/game engine quality (disable terms like 3D render, CGI, Unreal Engine, Unity), but clearly cel-shaded animation render |
| X8 | Materials too clean and perfect, without any use marks or sense of age (avoid "plastic feel"), must be cel-shaded treatment |
| X9 | Lighting too even and flat, no depth of field blur, no lens optical characteristics |
| X10 | Using realistic photography terms (e.g., real photography, photorealistic, RAW photo etc.) |
| X11 | Ancient/futuristic elements, non-modern urban style |
| X12 | Cool tones/night primary tones, non-warm tones/dusk atmosphere |
