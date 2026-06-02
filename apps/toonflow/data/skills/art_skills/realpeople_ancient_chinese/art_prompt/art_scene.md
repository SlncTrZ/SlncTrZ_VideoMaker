# Scene Image Generation · Constraint Manual

---

## I. Scene Aesthetic Principles

1. **Spatial Narrative** — Scene carries emotion and narrative function, not a pure backdrop
2. **Layered Depth** — All scenes must have foreground/midground/background, no flatness
3. **Texture First** — Wood grain/stone/fabric/water surface etc. material textures must be ultra-clear
4. **Real Shot Anchor** — All imagery takes real photography as standard, reject 3D render/CG animation feel; pursue lens optical characteristics (depth of field blur, lens vignette, subtle chromatic aberration) and physical lighting (natural light diffusion, caustics, volumetric light)

---

## II. Seasonal Tone Mapping

| Season | Main Tone | Accent Tone | Prompt |
|---|---|---|---|
| Spring | Verdant + Peach Pink | Moon White, Goose Yellow | Spring verdant, peach blossoms blazing |
| Summer | Emerald Green + Lotus Pink | Sky Blue, Lotus White | Summer lotus emerald, dense shade covering sun |
| Autumn | Crimson + Golden Yellow | Amber, Dusk Gray | Autumn maple crimson, golden leaves drifting |
| Winter | Pure White + Frost Silver | Ink Jade Black, Ice Blue | Winter snow pure white, withered branches hung with frost |

---

## III. Indoor Scenes

### Spatial Specifications

| Dimension | Constraint | Prompt |
|---|---|---|
| Style | Ancient residence/palace/study/boudoir, Wei-Jin to Tang-Song | Ancient {dynasty} style |
| Material | Wood primarily, stone/jade/silk/gauze as accent | Sandalwood furniture, jade screen, silk gauze curtains |
| Tone | Low saturation warm wood + moon white gauze + celadon | Warm wood tone, elegantly furnished |
| Depth | Fore/mid/background layers | Foreground {element}, midground {element}, background {element} |
| Texture | Wood grain/fabric drape/porcelain luster distinguishable | Clear texture, realistic texture |
| Lighting | Natural light source primarily (window light/candlelight), soft diffused light, visible light beam particles, caustic shadows | Natural light diffusion, candlelight flicker, light beams through window, Tyndall effect |
| Lens feel | Shallow depth of field blurring fore/background, subtle lens vignette, natural color temperature shift | shallow depth of field, lens vignette, natural color cast |
| Imperfection feel | Wood surface with wear marks, stone surface with weathering, fabric with natural folds | Traces of age, natural wear, fabric natural drape folds |

### Indoor Type Quick Reference

| Type | Core Elements | Atmosphere Words |
|---|---|---|
| Boudoir/bedroom | Gauze canopy, dressing table, bronze mirror, flower vase | Warm intimate, gauze curtains lightly hanging |
| Study/library | Bookshelf, scrolls, brush and ink, chessboard | Quiet elegant, ink fragrance filling air |
| Main hall/reception | Tall pillars, plaque, curtains, candlestick | Solemn magnificent, imposing grandeur |
| Courtyard corridor | Corridor pillars, stone railings, flowers and trees, lanterns | Winding path leading to seclusion, lantern shadows flickering |
| Kitchen/dining hall | Stove, steamer baskets, tableware | Hearth smoke atmosphere, warm daily life |

---

## IV. Outdoor Scenes

### Spatial Specifications

| Dimension | Constraint | Prompt |
|---|---|---|
| Type | Courtyard/mountain forest/streamside/ancient bridge/market | {scene}, {season}, {time} |
| Weather | Sunny/cloudy/light mist/drizzle/snowfall | Mist pervasive, drizzle like silk |
| Vegetation | Plum/bamboo/pine/peach blossom/willow/lotus (must match season) | Peach blossoms blazing, emerald bamboo forming groves |
| Water body | Stream/lake/waterfall must have light reflection | Stream babbling, lake surface like mirror |
| Architecture | Flying eaves and bracketing, green tiles white walls, stone bridges wooden pavilions | Flying eaves upturned corners, stone arch bridge |
| Atmosphere | Must have aerial perspective, distant areas slightly gray-blue | Distant mountains like brows, aerial perspective |
| Lighting | Natural light as sole source, sunlight/moonlight must have volumetric light and scattering | Natural lighting, volumetric light, god rays, Tyndall effect |
| Lens feel | Shallow depth of field blur, lens vignette, subtle chromatic aberration, bokeh | shallow depth of field, bokeh, lens flare, vignette |
| Imperfection feel | Stone moss/weathering, wood cracking/patina, tile chipping/moss marks | Mottled moss, weathering traces, age patina |

### Outdoor Type Quick Reference

| Type | Core Elements | Atmosphere Words |
|---|---|---|
| Courtyard garden | Rockery, pond, flowers and trees, stone path | Flower shadows sparse, winding path to seclusion |
| Mountain forest bamboo sea | Ancient trees, bamboo groves, mountain rocks, clouds and mist | Peaks upon peaks, misty clouds |
| Streamside lakeside | Stream, pebbles, weeping willows, lotus | Stream babbling, willow shadows swaying |
| Ancient bridge pavilion | Stone arch bridge, pavilion, willow trees | Ancient pavilion old road, willows lush and green |
| Market street | Wine flag, stalls, lanterns | Lively marketplace, mundane world atmosphere |
| Rooftop terrace | Tiles, flying eaves, night sky | Drinking alone under moon, gentle breeze blowing |

---

## V. Main View Specification

### View Definition

> Single-frame main view, shot from the most representative angle of the scene, carrying spatial narrative and composition focus.

| Item | Constraint | Prompt |
|---|---|---|
| Perspective | Natural observation angle, composition bestreflecting scene subject and depth | hero shot, representative angle |
| Viewpoint height | Default eye level, special scenes may tilt up/down | eye level (default) |
| Composition | Subject centered or following rule of thirds, fore/mid/background layersclear | balanced composition |

### Frame Specifications

| Item | Constraint |
|---|---|
| Layout | Single frame (not collage, not multi-view, not split-screen) |
| Figures | **Strictly prohibited: any person, figure silhouette, human body contour** |
| Consistency | Unified style/material/tone/lighting |
| Lighting | Single light source logic, consistent light and shadow direction |
| Aspect ratio | Default 16:9 (or per caller specification) |

---

## VI. Prompt Template

```
Ancient style scene main view concept art,
real photography, photorealistic, shot on ARRI Alexa, 35mm film grain,
RAW photo, ultra realistic, hyper detailed,
shallow depth of field, natural lens vignette, subtle chromatic aberration, bokeh,
real photo texture, film grain feel, natural lighting, physical light and shadow,
scene design sheet, environment concept art, no people, no characters, no human figures,
{indoor/outdoor}, {scene type}, {dynasty style}, {season+time},
Foreground: {element}, midground: {element}, background: {element},
{tone description}, {weather/atmosphere element},
{material description}, aerial perspective, texture detail ultra-clear,
material natural wear traces, age patina, moss weathering, fabric natural drape folds,
natural light diffusion, volumetric light, Tyndall effect, caustic shadows,
single-frame composition, natural observation angle, composition represents scene subject and shows fore/mid/background layers,
No people in the frame
No text in the image
```

---

## VII. Constraint Rules

### Mandatory

| # | Rule |
|---|---|
| R1 | Scene must have "fore/mid/background layers" |
| R2 | Outdoor must include "aerial perspective" |
| R3 | Scene image must be a "single-frame main view", cannot splice multiple views/split-screen/grid |
| R4 | Composition must represent scene subject and show fore/mid/background layers |
| R5 | **Strictly prohibit any person** in scene image |
| R6 | Must include real photography keywords (real photography / photorealistic / RAW photo) |
| R7 | Must include lens optical characteristics (shallow depth of field / lens vignette / bokeh at least one) |
| R8 | Materials must have natural wear/traces of age, prohibit brand-new flawless "CG feel" |

### Strictly Prohibited

| # | Strictly Prohibited |
|---|---|
| X1 | Pure white/pure black/no scene background |
| X2 | Extreme weather (storms/thunder/lightning/blizzard unless story requires) |
| X3 | No depth/layers in scene |
| X4 | Vegetation/weather contradicts season |
| X5 | Any person, figure silhouette, human shadow or body contour |
| X6 | Frame spliced into multi-view/grid/split-screen layout |
| X7 | 3D render/CG animation/cartoon/game engine feel (disable 3D render, CGI, Unreal Engine, Unity etc.) |
| X8 | Material too clean and perfect, no use traces or age feel (avoid "plastic feel") |
| X9 | Lighting too uniform and flat, no depth of field blur, no lens optical characteristics |

---

