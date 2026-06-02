---
name: art_scene
description: Scene Image Generation · Constraint Manual
metaData: art_skills
---

# Scene Image Generation · Constraint Manual

---

## I. Scene Aesthetic Principles

1. **Spatial Narrative** — Scene carries mood and narrative function, not just a backdrop
2. **Layered Depth** — All scenes must have foreground/midground/background, no flatness
3. **Texture First** — Material textures for wood/stone/cloth/water, etc., must be ultra-clear
4. **Anime Anchored** — All visuals standard to Chinese-style anime, reject 3D realistic/CG animation texture; pursue delicate lines, cel shading flat coloring, Japanese rendering

---

## II. Seasonal Palette Mapping

| Season | Main Color | Accent Color | Prompt Keywords |
|---|---|---|---|
| Spring | Blue-green + vermilion | Moon white, gamboge | Spring green verdant, peach blossoms blazing |
| Summer | Blue-green + indigo | Moon white, blue-green | Summer lotus verdant, dense shade covering sun |
| Autumn | Ochre + golden | Vermilion, ochre | Autumn maple crimson, golden leaves falling |
| Winter | Moon white + indigo | Ink black, blue-green | Winter snow pure white, withered branches frosted |

---

## III. Indoor Scenes

### Spatial Specifications

| Dimension | Constraint | Prompt Keywords |
|---|---|---|
| Style | Ancient residence/palace/study/boudoir, Ming-Qing to Tang-Song | Ancient {dynasty} style |
| Material | Wood primarily, stone/jade/silk/gauze as supplement | Sandalwood furniture, jade screen, silk gauze curtains |
| Tone | Chinese traditional colors + moon white gauze + vermilion wood lacquer | Warm wood tones, elegant furnishings |
| Depth | Foreground/midground/background layers | Foreground {element}, midground {element}, background {element} |
| Texture | Wood grain/fabric drape/ceramic luster distinguishable | Clear texture, fine texture |
| Lighting | Natural light source primarily (window light/candlelight), soft light and shadow | Natural light diffusion, flickering candlelight, soft light and shadow |
| Lens Feel | Cel shading flat coloring blurring foreground/background, clear lines | cel shading wash, clear lines |
| Wear | Wood surfaces with use marks, stone surfaces with weathering, fabric with natural folds | Years of marks, natural wear, natural fabric folds |

### Indoor Type Quick Reference

| Type | Core Elements | Atmosphere Keywords |
|---|---|---|
| Boudoir/Bedroom | Gauze curtain, dresser, bronze mirror, vase | Warm intimate, gauze curtains lightly hanging |
| Study/Library | Bookshelf, scrolls, brush and ink, chessboard | Quiet elegant, ink fragrance filling |
| Great Hall/Main Hall | Tall pillars, plaque, curtains, candlesticks | Solemn magnificent, imposing |
| Courtyard Corridor | Corridor pillars, stone railings, flowers and trees, lanterns | Winding path secluded, lantern shadows flickering |
| Kitchen/Dining Hall | Stove, steamer, food vessels | Homey atmosphere, warm daily |

---

## IV. Outdoor Scenes

### Spatial Specifications

| Dimension | Constraint | Prompt Keywords |
|---|---|---|
| Type | Courtyard/mountain forest/streamside/old bridge/market | {scene}, {season}, {time} |
| Weather | Sunny/cloudy/mist/light rain/snowfall | Mist pervasive, drizzle like silk |
| Vegetation | Plum/bamboo/pine/peach blossom/willow/lotus (must match season) | Peach blossoms blazing, emerald bamboo grove |
| Water Body | Stream/lake/waterfall must have light reflection | Babbling stream, lake surface like mirror |
| Architecture | Flying eaves and bracketing, green tiles white walls, stone bridge wooden pavilion | Flying eaves upturned corners, stone arch bridge |
| Atmospheric Perspective | Must have atmospheric perspective, distant blur | Distant mountains like brows, atmospheric perspective |
| Lighting | Natural light as sole source, sunlight/moonlight must have Japanese rendering effect | Natural lighting, Japanese rendering, soft light and shadow |
| Lens Feel | Cel shading flat coloring blur, clear lines | cel shading wash, clear lines |
| Wear | Stone surface moss/weathering, wood surface patina, tile fragments | Mottled moss, weathering marks, years of patina |

### Outdoor Type Quick Reference

| Type | Core Elements | Atmosphere Keywords |
|---|---|---|
| Courtyard Garden | Rockery, pond, flowers and trees, stone path | Flower shadows sparse, winding path secluded |
| Mountain Forest Bamboo Sea | Ancient trees, bamboo grove, rocks, clouds and mist | Layered peaks, misty clouds |
| Streamside Lakeside | Stream, pebbles, weeping willow, lotus | Babbling stream, willow shadows dancing |
| Old Bridge Pavilion | Stone arch bridge, pavilion, willow tree | Pavilion ancient road, willow branches gently swaying |
| Market Street | Wine flag, stalls, lanterns | Lively marketplace, worldly life |
| Rooftop Terrace | Tiles, flying eaves, night sky | Drinking alone under moon, gentle breeze |

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

Chinese-style anime scene main view concept art,
Chinese-style anime, neo-Chinese aesthetic, Japanese anime rendering, cel shading flat coloring, delicate brushwork,
Japanese anime style, cel shading, fine brushstrokes,
cel shading flat coloring, delicate lines, natural lighting, Japanese rendering,
scene design sheet, environment concept art, no people, no characters, no human figures,
{indoor/outdoor}, {scene type}, {dynasty style}, {season+time},
Foreground: {element}, Midground: {element}, Background: {element},
{tone description}, {weather/atmosphere element},
{material description}, atmospheric perspective, ultra-clear texture details,
natural material wear marks, years of patina, natural fabric folds,
soft light and shadow, Japanese rendering, natural light diffusion, fine texture,
single frame composition, natural observation perspective, composition representative of the scene subject showing foreground/midground/background hierarchy,
no people in the frame
no text in the image

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
| R6 | Must include Chinese-style anime keywords (Chinese style anime / cel shading / fine brushstrokes) |
| R7 | Must include lens optical features (cel shading flat coloring / delicate lines / Japanese rendering) |
| R8 | Materials must have natural wear/years of marks, prohibit flawless "CG feel" |

### Prohibited

| Number | Prohibition |
|---|---|
| X1 | Pure white/pure black/no scene background |
| X2 | Extreme weather (storm/lightning/blizzard, unless required by story) |
| X3 | Scene without depth/layers |
| X4 | Vegetation/weather contradicting season |
| X5 | Any people, human figures, human silhouettes, or human body outlines appearing |
| X6 | Image assembled into multi-view/grid/split-screen layout |
| X7 | 3D realistic/CG animation/cartoon/game engine texture (disable 3D render, CGI, Unreal Engine, Unity, etc.) |
| X8 | Materials too clean and perfect, no signs of use or aged feel (avoid "plastic feel") |
| X9 | Lighting too even and flat, no depth of field blur, no lens optical features |
