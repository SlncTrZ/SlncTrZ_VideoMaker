# Clay Stop-Motion Scene Image Generation · Constraint Manual

---

## I. Scene Aesthetic Principles

1. **Spatial Narrative** — The scene carries emotion and narrative function
2. **Depth Layers** — All scenes must have foreground/midground/background, no flatness
3. **Clay Texture First** — Material textures must be clearly distinguishable (wood/stone/cloth/water)
4. **Stop-Motion as Anchor** — All imagery uses stop-motion clay style as standard, reject realistic photography; pursue stop-motion photography characteristics (depth of field blur, lens flare, stop-motion grain) and warm-toned lighting

---

## II. Seasonal Color Mapping

| Season | Primary Color | Secondary Color | Prompt |
|---|---|---|---|
| Spring | Warm Green + Peach Pink | Cream white, Light yellow | Spring warm green, peach pink |
| Summer | Verdant Green + Lotus Pink | Sky blue, Lotus white | Summer lotus green, thick shade warmth |
| Autumn | Warm Red + Golden Yellow | Orange yellow, Warm gray | Autumn maple warm red, golden leaves warm sun |
| Winter | Soft White + Frost Gray | Warm wood color, Ice blue | Winter snow soft, withered branches warm tone |

---

## III. Indoor Scenes

### Spatial Specifications

| Dimension | Constraint | Prompt |
|---|---|---|
| Style | Ancient mansion/palace/study/boudoir, warm vintage | Ancient {dynasty} style, warm vintage |
| Material | Clay sculpted wood primarily, stone/jade/silk/gauze secondary | Clay wooden furniture, jade screen |
| Color Tone | Low saturation warm wood + cream white gauze + celadon | Warm wood tones, warm furnishings |
| Depth | Fore/mid/background layers | Foreground {element}, midground {element}, background {element} |
| Texture | Wood grain/fabric draping/porcelain sheen distinguishable | Clear texture, clay texture |
| Lighting | Warm soft light primarily (window light/candlelight), diffused light | Warm light diffusion, warm candlelight |
| Lens Feel | Soft shallow depth of field blur, natural lens flare, stop-motion grain | shallow depth of field, bokeh, stop-motion feel |
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
| Air Feel | Must have atmospheric perspective, distant warm-gray | Distant mountains like brows, atmospheric perspective |
| Lighting | Warm natural light as sole source, sunlight/moonlight must have volumetric light | Warm light diffusion, volumetric light, warm-toned lens flare |
| Lens Feel | Soft shallow depth of field blur, bokeh, stop-motion feel | shallow depth of field, bokeh, stop-motion feel |
| Imperfection | Stone moss/weathering, wood cracking/patina, tile chipping | Moss mottled, weathering marks, age patina |

### Outdoor Type Quick Reference

| Type | Core Elements | Atmosphere Words |
|---|---|---|
| Courtyard Garden | Rockery, pond, flowers, stone path | Flower shadows sparse, winding path |
| Mountain Forest Bamboo Sea | Ancient trees, bamboo grove, rocks, clouds | Peaks layered, clouds misty |
| Streamside Lakeside | Stream, pebbles, weeping willow, lotus | Babbling stream, willow shadows swaying |
| Old Bridge Pavilion | Stone arch bridge, pavilion, willow tree | Old road pavilion, willows gently swaying |
| Market Street | Wine banner, stalls, lantern | Bustling marketplace, lively world |
| Rooftop Terrace | Tiles, flying eaves, night sky | Moonlit solitude, gentle breeze |

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

```
Clay stop-motion ancient Chinese scene main view concept art, stop-motion style, 3D cartoon render, warm-toned lighting, soft shallow depth of field,
claymation style, stop-motion aesthetic, warm lighting,
scene design sheet, environment concept art, no people, no characters, no human figures,
{indoor/outdoor}, {scene type}, {dynasty style}, {season+time},
Foreground: {element}, midground: {element}, background: {element},
{color tone description}, {weather/atmosphere element},
{material description}, atmospheric perspective, ultra-clear texture details,
Natural material wear marks, age patina, moss weathering, fabric natural folds,
Warm soft light diffusion, volumetric light, warm-toned lens flare, shallow depth of field blur,
Single image composition, natural observation angle, composition can represent scene subject and show fore/mid/background layers,
No people in the image
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
| R6 | Must include stop-motion keywords (claymation / stop-motion) |
| R7 | Must include shallow depth of field keywords (shallow depth of field / bokeh) |
| R8 | Must specify "warm soft light", no hard shadows |
| R9 | Materials must have natural wear/age marks |

### Prohibited

| No. | Prohibited |
|---|---|
| X1 | Pure white/pure black/no scene background |
| X2 | Extreme weather (storms/lightning/blizzard) |
| X3 | Scene without depth/layers |
| X4 | Vegetation/weather contradicting season |
| X5 | Any people, human figures, silhouettes |
| X6 | Image spliced into multi-view/grid/split-screen layout |
| X7 | Realistic photography/3D render/CG animation quality |
| X8 | Materials too clean and perfect, without any use marks |
| X9 | Cold hard lighting/high contrast/hard shadows |
