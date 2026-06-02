# Scene Image Generation · Flat Design Constraint Manual

---

## I. Scene Aesthetic Principles

1. **Spatial Narrative** — Scene carries mood and narrative function, not just a backdrop
2. **Flat Layers** — Foreground/midground/background distinguished by color blocks, no depth perspective
3. **Color Block First** — All scenes must be expressed through color blocks, reject gradients/light and shadow
4. **Flat Anchored** — All visuals standard to flat vector illustration, reject 3D rendering/CG animation texture; pursue simple lines, solid color fill

---

## II. Seasonal Palette Mapping

| Season | Main Color | Accent Color | Prompt Keywords |
|---|---|---|---|
| Spring | Emerald green + peach pink | Moon white, light yellow | Flat spring colors, green peach pink |
| Summer | Emerald green + lotus pink | Sky blue, lotus white | Flat summer lotus, emerald green lotus pink |
| Autumn | Crimson red + golden | Amber, dusk gray | Flat autumn maple, crimson red golden |
| Winter | Pure white + frost silver | Ink jade black, ice blue | Flat winter snow, pure white frost silver |

---

## III. Indoor Scenes

### Spatial Specifications

| Dimension | Constraint | Prompt Keywords |
|---|---|---|
| Style | Ancient residence/palace/study/boudoir, Wei-Jin to Tang-Song | Ancient {dynasty} style, flat ancient-style |
| Material | Solid color blocks, line outlining | Flat sandalwood, flat jade, flat silk gauze |
| Tone | Low-saturation solid color blocks | Flat warm colors, flat elegant |
| Depth | Foreground/midground/background color block distinction | Foreground {color block}, midground {color block}, background {color block} |
| Texture | No texture, solid color fill | No texture, flat texture, flat texture |
| Lighting | No lighting, pure flat color blocks | No light and shadow, flat lighting, no lighting |
| Lens Feel | No depth of field blur, pure flat | No depth of field, flat perspective, no depth |
| Wear | No wear, solid color perfect | No wear, flat perfect, no wear |

### Indoor Type Quick Reference

| Type | Core Elements | Atmosphere Keywords |
|---|---|---|
| Boudoir/Bedroom | Gauze curtain, dresser, bronze mirror, vase | Flat warm, simple intimate |
| Study/Library | Bookshelf, scrolls, brush and ink, chessboard | Flat quiet, simple elegant |
| Great Hall/Main Hall | Tall pillars, plaque, curtains, candlesticks | Flat solemn, simple magnificent |
| Courtyard Corridor | Corridor pillars, stone railings, flowers and trees, lanterns | Flat winding path, simple lantern shadows |
| Kitchen/Dining Hall | Stove, steamer, food vessels | Flat homey, simple daily |

---

## IV. Outdoor Scenes

### Spatial Specifications

| Dimension | Constraint | Prompt Keywords |
|---|---|---|
| Type | Courtyard/mountain forest/streamside/old bridge/market | {scene}, {season}, {time}, flat ancient-style |
| Weather | Sunny/cloudy/mist/light rain/snowfall | Flat mist, flat light rain |
| Vegetation | Plum/bamboo/pine/peach blossom/willow/lotus (must match season) | Flat peach blossom, flat emerald bamboo |
| Water Body | Stream/lake/waterfall must have solid color expression | Flat stream, flat lake surface |
| Architecture | Flying eaves and bracketing, green tiles white walls, stone bridge wooden pavilion | Flat flying eaves, flat stone bridge |
| Atmospheric Perspective | No atmospheric perspective, pure flat | No perspective, flat distant view, flat far |
| Lighting | No lighting, pure flat color blocks | No lighting, flat daylight, no light |
| Lens Feel | No depth of field blur, pure flat | No depth of field, flat perspective, no depth |
| Wear | No wear, solid color perfect | No weathering, flat perfect, no weathering |

### Outdoor Type Quick Reference

| Type | Core Elements | Atmosphere Keywords |
|---|---|---|
| Courtyard Garden | Rockery, pond, flowers and trees, stone path | Flat flower shadows, simple winding path |
| Mountain Forest Bamboo Sea | Ancient trees, bamboo grove, rocks, clouds and mist | Flat layered peaks, simple clouds and mist |
| Streamside Lakeside | Stream, pebbles, weeping willow, lotus | Flat stream water, simple weeping willow |
| Old Bridge Pavilion | Stone arch bridge, pavilion, willow tree | Flat old bridge, simple pavilion |
| Market Street | Wine flag, stalls, lanterns | Flat marketplace, simple lively |
| Rooftop Terrace | Tiles, flying eaves, night sky | Flat tiles, simple night sky |

---

## V. Main View Specifications

### View Definition

> Single frame main view, shot from the most representative angle of the scene, carrying spatial narrative and composition focus.

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Perspective | Natural observation perspective, composition best showing scene subject and color block layers | hero shot, representative angle |
| Eye Level | Default human eye level, special scenes can be high/low angle | eye level (default) |
| Composition | Subject centered or following rule of thirds, clear foreground/midground/background color block hierarchy | balanced composition |

### Image Specifications

| Item | Constraint |
|---|---|
| Layout | Single frame (no collage, no multi-view, no split screen) |
| Characters | **No people, human figures, or body outlines allowed** |
| Consistency | Unified style/material/tone |
| Lighting | No lighting, solid color fill, no light and shadow logic |
| Aspect Ratio | Default 1:1 (or per caller setting) |

---

## VI. Prompt Template

```
Flat ancient-style scene main view concept art,
2d flat design, vector art, flat illustration,
minimalist, clean lines, solid colors,
flat scene, environment design, no people, no characters, no human figures,
{indoor/outdoor}, {scene type}, {dynasty style}, {season+time},
Foreground: {color block element}, Midground: {color block element}, Background: {color block element},
{tone description}, {weather/atmosphere element},
{material description}, no perspective, solid color fill,
no years of marks, no wear, flat perfect,
no lighting, no shadows, solid color flat painting,
single frame composition, natural observation perspective, composition representative of the scene subject showing foreground/midground/background color block hierarchy,
no people in the frame
no text in the image
```

---

## VII. Constraint Rules

### Mandatory

| Number | Rule |
|---|---|
| R1 | Scene must have "foreground/midground/background color block layers" |
| R2 | Outdoor must be "flat distant view" without atmospheric perspective |
| R3 | Scene image must be "single frame main view," no multi-view collage/split screen/grid |
| R4 | Composition must represent scene subject and show foreground/midground/background color block hierarchy |
| R5 | **No people allowed** in scene images |
| R6 | Must specify "flat style" keywords (2d flat design, vector art) |
| R7 | Must specify "no light and shadow no gradient" |
| R8 | Materials must be solid color fill, prohibit complex texture/aged feel |

### Prohibited

| Number | Prohibition |
|---|---|
| X1 | Pure white/pure black/no scene background |
| X2 | Extreme weather (storm/lightning/blizzard, unless required by story) |
| X3 | Scene without layers/no color block distinction |
| X4 | Vegetation/weather contradicting season |
| X5 | Any people, human figures, human silhouettes, or human body outlines appearing |
| X6 | Image assembled into multi-view/grid/split-screen layout |
| X7 | 3D rendering/CG animation/cartoon/game engine texture (disable 3D render, CGI, Unreal Engine, Unity, etc.) |
| X8 | Materials too complex, color blocks not clearly distinguishable |
| X9 | Adding light and shadow/shading/gradient/three-dimensional effects |
