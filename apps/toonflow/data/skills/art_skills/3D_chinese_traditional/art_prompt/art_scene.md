---
name: art_scene
description: Scene Image Generation · Constraint Manual
metaData: art_skills
---

# Scene Image Generation · Constraint Manual

---

## I. Scene Aesthetic Principles

1. **Spatial Narrative** — The scene carries emotion and narrative function
2. **Depth Layers** — All scenes must have foreground/midground/background, no flatness
3. **Texture First** — Material textures like wood/stone/cloth/water surface must be ultra-clear
4. **3D as Anchor** — All imagery uses 3D render as standard, reject flat textures/3D render/CG animation quality; pursue volumetric lighting, ambient occlusion, depth of field blur and other cinematic render effects

---

## II. Seasonal Color Mapping

| Season | Primary Color | Secondary Color | Prompt |
|---|---|---|---|
| Spring | Green + Vermilion | Moon white, Rattan yellow | Spring green, peach blossoms blazing |
| Summer | Green + Indigo | Moon white, Green | Summer lotus green, thick shade covering sun |
| Autumn | Ochre + Golden Yellow | Vermilion, Ochre | Autumn maple crimson, golden leaves falling |
| Winter | Moon white + Indigo | Ink black, Green | Winter snow pure white, withered branches frost |

---

## III. Indoor Scenes

### Spatial Specifications

| Dimension | Constraint | Prompt |
|---|---|---|
| Style | Ancient mansion/palace/study/boudoir, Ming-Qing to Tang-Song | Ancient {dynasty} style |
| Material | Wood primarily, stone/jade/silk/gauze secondary | Sandalwood furniture, jade screen, silk gauze curtains |
| Color Tone | Chinese traditional tones + moon white gauze + vermilion lacquer | Warm wood tones, elegant furnishings |
| Depth | Fore/mid/background layers | Foreground {element}, midground {element}, background {element} |
| Texture | Wood grain/fabric draping/porcelain sheen distinguishable | Clear texture, refined material quality |
| Lighting | Natural light source primarily (window light/candlelight), volumetric light, ambient occlusion | Natural light diffusion, candlelight flickering, volumetric light |
| Lens Feel | Depth of field blur fore/background, lens vignette, subtle chromatic aberration | depth of field, lens vignette, chromatic aberration |
| Imperfection | Wood surface has use marks, stone surface has weathering, fabric has natural folds | Age marks, natural wear, fabric natural folds |

### Indoor Type Quick Reference

| Type | Core Elements | Atmosphere Words |
|---|---|---|
| Boudoir/Bedroom | Gauze curtain, vanity, bronze mirror, vase | Warm private, gauze lightly draped |
| Study/Studio | Bookshelf, scroll, brush and ink, chessboard | Quiet elegant, ink fragrance |
| Grand Hall/Main Hall | Tall pillars, plaque, curtains, candlestick | Solemn magnificent, majestic |
| Courtyard Corridor | Corridor pillars, stone railings, flowers, lantern | Winding path, lantern shadows swaying |
| Kitchen/Dining Hall | Stove, steamer, tableware | Hearth atmosphere, warm daily life |

---

## IV. Outdoor Scenes

### Spatial Specifications

| Dimension | Constraint | Prompt |
|---|---|---|
| Type | Courtyard/mountain forest/streamside/old bridge/market | {scene}, {season}, {time} |
| Weather | Sunny/cloudy/misty/light rain/snowfall | Mist pervasive, rain like silk |
| Vegetation | Plum/bamboo/pine/peach blossom/willow/lotus (must fit season) | Peach blossoms blazing, green bamboo grove |
| Water | Stream/lake/waterfall must have light reflection | Babbling stream, lake like mirror |
| Architecture | Flying eaves/dou Gong/black tiles/white walls/stone bridge/wooden pavilion | Eaves curving upward, stone arch bridge |
| Air Feel | Must have atmospheric perspective, volumetric light, distant blur | Distant mountains like brows, atmospheric perspective, volumetric light |
| Lighting | Natural light as sole source, sunlight/moonlight must have volumetric light and scattering | Natural lighting, volumetric light, depth of field blur |
| Lens Feel | Depth of field blur, lens vignette, chromatic aberration, bokeh | depth of field, bokeh, lens flare, vignette |
| Imperfection | Stone moss/weathering, wood cracking/patina, tile chipping/moss marks | Moss mottled, weathering marks, age patina |

### Outdoor Type Quick Reference

| Type | Core Elements | Atmosphere Words |
|---|---|---|
| Courtyard Garden | Rockery, pond, flowers, stone path | Flower shadows sparse, winding path |
| Mountain Forest Bamboo Sea | Ancient trees, bamboo grove, rocks, clouds | Peaks layered, clouds misty |
| Streamside Lakeside | Stream, pebbles, weeping willow, lotus | Babbling stream, willow shadows swaying |
| Old Bridge Pavilion | Stone arch bridge, pavilion, willow tree | Old road pavilion, willows gently swaying |
| Market Street | Wine banner, stalls, lantern | Bustling marketplace, lively world |
| Rooftop Terrace | Tiles, flying eaves, night sky | Moonlit solitude, gentle breeze |
| Heroic Jianghu | Mountains and rivers, distant mountains, vast sky | Misty rain Jianghu, vast sky |

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
| Consistency | Style/material/color tone/lighting unified |
| Lighting | Single light source logic, consistent light direction |
| Aspect Ratio | Default 16:9 (or per caller setting) |

---

## VI. Prompt Template

Ancient Chinese scene main view concept art,
3D render style, high-precision modeling, PBR materials, Chinese traditional 3D, cinematic lighting,
3D rendered, volumetric lighting,
depth of field, natural lens vignette, subtle chromatic aberration, bokeh,
3D render texture, volumetric light, natural lighting, physical light and shadow,
scene design sheet, environment concept art, no people, no characters, no human figures,
{indoor/outdoor}, {scene type}, {dynasty style}, {season+time},
Foreground: {element}, midground: {element}, background: {element},
{color tone description}, {weather/atmosphere element},
{material description}, atmospheric perspective, ultra-clear texture details,
Natural material wear marks, age patina, moss weathering, fabric natural folds,
Volumetric light, ambient occlusion, natural light diffusion, soft light and shadow,
Single image composition, natural observation angle, composition can represent scene subject and show fore/mid/background layers,
No people in the image
No text in the image

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
| R6 | Must include 3D render keywords (3D rendered / volumetric lighting / PBR materials) |
| R7 | Must include lens optical characteristics (depth of field / lens vignette / bokeh at least one) |
| R8 | Materials must have natural wear/age marks, no pristine "CG feel" |

### Prohibited

| No. | Prohibited |
|---|---|
| X1 | Pure white/pure black/no scene background |
| X2 | Extreme weather (storms/lightning/blizzard, unless story requires) |
| X3 | Scene without depth/layers |
| X4 | Vegetation/weather contradicting season |
| X5 | Any people, human figures, silhouettes, or body outlines |
| X6 | Image spliced into multi-view/grid/split-screen layout |
| X7 | Low-precision modeling/rough texture/plastic feel (disable terms like low-poly, rough modeling) |
| X8 | Materials too clean and perfect, without any use marks or sense of age (avoid "plastic feel") |
| X9 | Lighting too even and flat, no depth of field blur, no lens optical characteristics |
