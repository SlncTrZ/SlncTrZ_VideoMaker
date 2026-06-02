# 90s Retro Japanese Anime Style - Scene Image Generation · Constraint Manual

---

## I. Scene Aesthetic Principles

1. **Spatial Narrative** — Scene carries mood and narrative function, not just a backdrop
2. **Layered Depth** — All scenes must have foreground/midground/background, no flatness
3. **Texture First** — Material expression of lines/colors/light and shadow must be clear
4. **90s Anchored** — All visuals standard to 90s retro Japanese anime, reject modern CG/3D rendering; pursue hand-drawn line features (flowing lines, block shading) and cinematic lighting (soft warm light, volumetric light)

---

## II. Seasonal Palette Mapping

| Season | Main Color | Accent Color | Prompt Keywords |
|---|---|---|---|
| Spring | Pink + light green | Light yellow, lavender | Spring pink, cherry blossoms in bloom |
| Summer | Emerald green + blue | Light blue, white | Summer emerald, blue sky white clouds |
| Autumn | Golden + orange red | Brown, dark green | Autumn golden, maple leaves turning red |
| Winter | White + gray | Dark blue, light blue | Winter white, snowflakes falling |

---

## III. Indoor Scenes

### Spatial Specifications

| Dimension | Constraint | Prompt Keywords |
|---|---|---|
| Style | 90s Japanese room/Western room | {style} style |
| Material | Wood/stone/cloth/glass primarily | Wooden furniture, fabric decoration |
| Tone | Low-saturation warm tones/soft cool tones | Warm tones/cool tones |
| Depth | Foreground/midground/background layers | Foreground {element}, midground {element}, background {element} |
| Texture | Flowing lines, soft colors | Flowing lines, soft colors |
| Lighting | Natural light/artificial light, soft cinematic light | Natural lighting, soft cinematic light |
| Line Quality | Clear outlines, block shading | Clear lines, block shading |
| Wear | Walls with use marks, furniture natural wear | Use marks, natural wear |

### Indoor Type Quick Reference

| Type | Core Elements | Atmosphere Keywords |
|---|---|---|
| Bedroom/Boudoir | Bed/wardrobe/dresser | Warm intimate, comfortable |
| Study/Library | Bookshelf/desk/chair | Quiet, scholarly |
| Living Room/Main Hall | Sofa/coffee table/decorations | Comfortable, warm |
| Corridor/Balcony | Railing/plants/decorations | Airy, open |
| Kitchen/Dining Room | Dining table/kitchenware | Warm, homey |

---

## IV. Outdoor Scenes

### Spatial Specifications

| Dimension | Constraint | Prompt Keywords |
|---|---|---|
| Type | Courtyard/mountain forest/street/plaza | {scene}, {season}, {time} |
| Weather | Sunny/cloudy/rainy/snowy | Sunny day, rainy day, snowy day |
| Vegetation | Trees/flowers/grass (must match season) | Trees, flowers, grass |
| Architecture | 90s architecture/Japanese architecture | 90s architecture/Japanese architecture |
| Atmospheric Perspective | Must have atmospheric perspective, distant areas grayer | Atmospheric perspective, distant blur |
| Lighting | Natural light as sole source, soft cinematic light | Natural lighting, soft cinematic light |
| Line Quality | Clear outlines, block shading | Clear lines, block shading |
| Wear | Walls with use marks, ground with wear | Use marks, wear marks |

### Outdoor Type Quick Reference

| Type | Core Elements | Atmosphere Keywords |
|---|---|---|
| Courtyard Garden | Plants/small bridge/pond | Peaceful, beautiful |
| Mountain Forest/Park | Trees/rocks/paths | Natural, open |
| Street/Market | Buildings/stalls/pedestrians | Lively, everyday atmosphere |
| Riverside/Lakeside | Water surface/bridge/trees | Peaceful, beautiful |
| Rooftop/Terrace | Railing/sky/distant view | Open, free |

---

## V. Main View Specifications

### View Definition

> Single frame main view, shot from the most representative angle of the scene, carrying spatial narrative and composition focus.

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Perspective | Natural observation perspective, composition best showing scene subject and depth | hero shot, representative angle |
| Eye Level | Default human eye level, special scenes can be high/low angle | eye level (default) |
| Composition | Subject centered or following rule of thirds, clear foreground/midground/background hierarchy | balanced composition |

### Image Specifications

| Item | Constraint |
|---|---|
| Layout | Single frame (no collage, no multi-view, no split screen) |
| Characters | **No people, human figures, or body outlines allowed** |
| Consistency | Unified style/material/tone/lighting |
| Lighting | Single light source logic, consistent light and shadow direction |
| Aspect Ratio | Default 16:9 (or per caller setting) |

---

## VI. Prompt Template
```
90s retro Japanese anime style scene main view concept art,
90s anime style, hand-drawn flat coloring, soft warm tones, fine flowing lines, cinematic lighting,
scene design sheet, environment concept art, no people, no characters, no human figures,
90s retro style, nostalgic healing atmosphere,
{indoor/outdoor}, {scene type}, {season+time},
Foreground: {element}, Midground: {element}, Background: {element},
{tone description}, {weather/atmosphere element},
{material description}, atmospheric perspective, ultra-clear line details,
flowing lines, block shading, use marks,
soft cinematic light, background glow, natural lighting,
single frame composition, natural observation perspective, composition representative of the scene subject showing foreground/midground/background hierarchy,
no people in the frame
no text in the image
```

---

## VII. Constraint Rules

### Mandatory

| Number | Rule |
|---|---|
| R1 | Scene must have "foreground/midground/background layers" |
| R2 | Outdoor must include "atmospheric perspective" |
| R3 | Scene image must be "single frame main view," no multi-view collage/split screen/grid |
| R4 | Composition must represent scene subject and show foreground/midground/background hierarchy |
| R5 | **No people allowed** in scene images |
| R6 | Must include 90s keywords (90s anime style / hand-drawn / warm tone) |
| R7 | Must include line features (flowing lines, block shading — at least one) |
| R8 | Materials must show signs of use, prohibit flawless "CG feel" |

### Prohibited

| Number | Prohibition |
|---|---|
| X1 | Pure white/pure black/no scene background |
| X2 | Extreme weather (storm/lightning/blizzard, unless required by story) |
| X3 | Scene without depth/layers |
| X4 | Vegetation/weather contradicting season |
| X5 | Any people, human figures, or human silhouettes appearing |
| X6 | Image assembled into multi-view/grid/split-screen layout |
| X7 | 3D rendering/CG animation/modern style texture |
| X8 | Materials too clean and perfect, no signs of use |
| X9 | Lighting too even and flat, no soft cinematic light |
