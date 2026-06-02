# Anime Scene Image Generation · Constraint Manual

---

## I. Scene Aesthetic Principles

1. **Spatial Narrative** — Scene carries mood and narrative function, not just a backdrop
2. **Layered Depth** — All scenes must have foreground/midground/background, no flatness
3. **Texture First** — Modern material textures must be ultra-clear (glass/metal/wood/fabric/wall)
4. **Cel Shading Anchored** — All visuals standard to anime style, emphasizing clear lines and cel shading coloring
5. **Dramatic Low-Key Lighting** — Light and shadow serve mood, maintain low-saturation cool tone base

---

## II. Seasonal Palette Mapping

| Season | Main Color | Accent Color | Prompt Keywords |
|---|---|---|---|
| Spring | Blue-green + soft pink | Light blue, light yellow | Spring green verdant, cherry blossoms delicate pink |
| Summer | Emerald green + azure blue | Sky blue, snow white | Summer trees lush, blue sky washed clean |
| Autumn | Orange yellow + brown red | Ochre, golden | Autumn leaves golden, maple crimson like fire |
| Winter | Pure white + cool blue | Gray white, light blue | Winter clear and cool, snowflakes white vast |

---

## III. Indoor Scenes

### Spatial Specifications

| Dimension | Constraint | Prompt Keywords |
|---|---|---|
| Style | Modern urban home/office/coffee shop/apartment | Modern {scene type} style |
| Material | Modern materials primarily, glass/metal/wood/fabric as supplement | Modern materials, glass reflection, wood texture |
| Tone | Low-saturation cool tones primarily, warm accents | Cool tones primarily, warm light accents |
| Depth | Foreground/midground/background layers | Foreground {element}, midground {element}, background {element} |
| Texture | Glass/metal/wood/fabric texture clear | Clear material, fine texture |
| Lighting | Natural light/artificial light, clear light and shadow layers | Natural light, light and shadow layers, indoor light |
| Lens Feel | Cinematic composition, shallow depth of field blur, lens optical features | `shallow depth of field`, `film grain` |
| Wear | Modern use marks, lived-in feel | Lived-in feel, use marks |

### Indoor Type Quick Reference

| Type | Core Elements | Atmosphere Keywords |
|---|---|---|
| Modern Apartment | Sofa/TV/bed/kitchen | Warm homey, lived-in feel |
| Business Office | Desk/computer/files/bookshelf | Professional neat, workplace atmosphere |
| Coffee Shop | Tables and chairs/coffee cups/counter/windows | Relaxed pleasant, urban casual |
| School Classroom | Desks/blackboard/bookshelf/chalkboard | Youthful campus, learning atmosphere |
| Hotel Room | Bed/bathroom/TV/nightstand | Comfortable modern, hotel atmosphere |

---

## IV. Outdoor Scenes

### Spatial Specifications

| Dimension | Constraint | Prompt Keywords |
|---|---|---|
| Type | City street/park/campus/commercial district | {scene}, {season}, {time} |
| Weather | Sunny/cloudy/mist/light rain/snowfall | Mist pervasive, drizzle like silk |
| Vegetation | Trees/flowers/lawn (must match season) | Green trees shade, flowers blooming |
| Water Body | Pool/fountain/river must have light reflection | Water surface ripples, clear reflections |
| Architecture | Modern architecture/glass curtain wall/brick wall | Modern city, building lines |
| Atmospheric Perspective | Must have atmospheric perspective, distant areas grayer/bluer | Distant mountains like brows, atmospheric perspective |
| Lighting | Natural light/artificial light, dramatic low-key lighting | Natural lighting, volumetric light, dramatic light and shadow |
| Lens Feel | Cinematic composition, shallow depth of field blur, anime lens features | `shallow depth of field`, `vignette`, `anime cinematic` |
| Wear | City use marks, years of marks | City marks, lived-in feel |

### Outdoor Type Quick Reference

| Type | Core Elements | Atmosphere Keywords |
|---|---|---|
| City Street | Streetlights/crosswalk/buildings/vehicles | Urban life, street atmosphere |
| Park Green Space | Trees/benches/lawn/path | Relaxing, natural atmosphere |
| Commercial District | Shops/billboards/pedestrians/streets | Bustling city, commercial atmosphere |
| Campus Scene | School buildings/playground/trees/benches | Youthful campus, learning atmosphere |
| Rooftop/Balcony | Railing/city view/plants | Open view, urban perspective |
| Subway/Bus Station | Platform/trains/pedestrians/signs | Commuter life, urban rhythm |

---

## V. Main View Specifications

### View Definition

> Single frame main view, shot from the most representative angle of the scene, carrying spatial narrative and composition focus.

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Perspective | Natural observation perspective, composition best showing scene subject and depth | `hero shot`, `representative angle` |
| Eye Level | Default human eye level, special scenes can be high/low angle | `eye level` (default) |
| Composition | Subject centered or following rule of thirds, clear foreground/midground/background hierarchy | `balanced composition` |

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

Anime scene main view concept art,
anime style, cel shading, modern urban style,
cinematic composition, dramatic low-key lighting,
ultra detailed, 8K, high quality,
shallow depth of field, film grain, lens vignette,
cel shading anime style, cinematic composition, dramatic low-key lighting,
scene design sheet, environment concept art, no people, no characters, no human figures,
{indoor/outdoor}, {scene type}, {modern style}, {season+time},
Foreground: {element}, Midground: {element}, Background: {element},
{tone description}, {weather/atmosphere element},
{material description}, atmospheric perspective, ultra-clear texture details,
modern material use marks, lived-in feel, natural wear,
natural light/artificial light, dramatic light and shadow, low-saturation cool tones,
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
| R6 | Must include "anime style" keywords (anime style / cel shading) |
| R7 | Must include depth of field features (shallow depth of field / vignette at least one), maintain anime cel shading style |
| R8 | Materials must have modern use marks/lived-in feel, prohibit flawless "3D rendering feel" |

### Prohibited

| Number | Prohibition |
|---|---|
| X1 | Pure white/pure black/no scene background |
| X2 | Extreme weather (storm/lightning/blizzard, unless required by story) |
| X3 | Scene without depth/layers |
| X4 | Vegetation/weather contradicting season |
| X5 | Any people, human figures, human silhouettes, or human body outlines appearing |
| X6 | Image assembled into multi-view/grid/split-screen layout |
| X7 | 3D rendering/CG animation/game engine texture (disable 3D render, CGI, Unreal Engine, Unity, etc.) |
| X8 | Materials too clean and perfect, no signs of use or aged feel (avoid "plastic feel") |
| X9 | Lighting too even and flat, no depth of field blur, no lens optical features |
