# Scene Image Generation · Urban Realistic Constraint Manual

---

## I. Scene Aesthetic Principles

1. **Spatial Narrative** — Scene carries emotion and narrative function, not a pure backdrop
2. **Layered Depth** — All scenes must have foreground/midground/background, no flatness
3. **Texture First** — Concrete/glass/wood/metal/fabric etc. material textures must be ultra-clear
4. **Real Shot Anchor** — All imagery takes real photography as standard, reject 3D render/CG animation feel; pursue lens optical characteristics (depth of field blur, lens vignette, subtle chromatic aberration) and physical lighting (natural light diffusion, caustics, volumetric light)

---

## II. Seasonal Tone Mapping

| Season | Main Tone | Accent Tone | Prompt |
|---|---|---|---|
| Spring | Fresh Green + Light Pink | Sky Blue, Goose Yellow | Spring fresh green, peach blossom light pink |
| Summer | Emerald Green + Deep Blue | Sea Blue, White | Summer emerald green, deep blue sky |
| Autumn | Golden Yellow + Orange Red | Amber, Brown | Autumn golden yellow, fallen leaves orange red |
| Winter | Gray White + Cool Blue | Silver Gray, Ink Blue | Winter gray white, cool blue sky |

---

## III. Indoor Scenes

### Spatial Specifications

| Dimension | Constraint | Prompt |
|---|---|---|
| Style | Modern apartment/office/café/hotel/mall, modern simple/Scandinavian/industrial | Modern {style} style |
| Material | Concrete/glass/wood/metal/fabric primarily | Concrete wall, glass curtain wall, wood floor |
| Tone | Low saturation neutral + natural wood + accent color | Neutral tones, natural wood color, accent color |
| Depth | Fore/mid/background layers | Foreground {element}, midground {element}, background {element} |
| Texture | Wood grain/metal brushed/fabric texture distinguishable | Clear texture, realistic texture |
| Lighting | Natural light primarily (window light/desk lamp/ceiling light), soft diffused light, visible beam particles, caustic shadows | Natural light diffusion, desk lamp warm light, light beams through window |
| Lens feel | Shallow depth of field blurring fore/background, subtle lens vignette, natural color temperature shift | shallow depth of field, lens vignette, natural color cast |
| Imperfection feel | Wall with usetraces, floor with wear, fabric with natural folds | Usetraces, natural wear, fabric natural drape folds |

### Indoor Type Quick Reference

| Type | Core Elements | Atmosphere Words |
|---|---|---|
| Modern apartment | Sofa, coffee table, floor-to-ceiling window, greenery | Warm comfortable, modern simple |
| Office space | Desk, computer, files, greenery | Professional tidy, efficient atmosphere |
| Café | Counter, coffee machine, tables and chairs, decor | Relaxed pleasant, artistic atmosphere |
| Hotel room | Bed, bedside table, floor-to-ceiling window, TV | Comfortable luxurious, quiet atmosphere |
| Living room | Sofa, TV cabinet, rug, decorative painting | Warm daily, family atmosphere |

---

## IV. Outdoor Scenes

### Spatial Specifications

| Dimension | Constraint | Prompt |
|---|---|---|
| Type | Street/square/park/rooftop/parking lot | {scene}, {season}, {time} |
| Weather | Sunny/cloudy/mist/drizzle/snowfall | Mist pervasive, drizzle like silk |
| Vegetation | Street trees/flower beds/lawn/potted plants (must match season) | Street trees, flower bed greenery |
| Water body | Fountain/pond must have light reflection | Water surface reflection, fountain flow |
| Architecture | Modern architecture, glass curtain wall, metal structure | Modern building, glass curtain wall |
| Atmosphere | Must have aerial perspective, distant area slightly gray-blue | Distant gray-blue, aerial perspective |
| Lighting | Natural light as sole source, sunlight/streetlight must have volumetric light and scattering | Natural lighting, volumetric light, streetlight warm light |
| Lens feel | Shallow depth of field blur, lens vignette, subtle chromatic aberration, bokeh | shallow depth of field, bokeh, lens flare, vignette |
| Imperfection feel | Ground cracks/wall peeling/metal oxidation/glass scratches | Usetraces, natural wear |

### Outdoor Type Quick Reference

| Type | Core Elements | Atmosphere Words |
|---|---|---|
| City street | Streetlights, street trees, crosswalk | Urban daily, busy street |
| Commercial square | Buildings, fountain, billboards | Bustling lively, commercial atmosphere |
| Park green space | Lawn, trees, benches, walkway | Natural serene, leisure atmosphere |
| Rooftop terrace | Railings, city view, seating | Open view, city scenery |
| Underground parking | Parking spaces, lane markings, indicator lights | Cool industrial, quiet space |

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
Modern urban scene main view concept art,
real photography, photorealistic, shot on ARRI Alexa, 35mm film grain,
RAW photo, ultra realistic, hyper detailed,
shallow depth of field, natural lens vignette, subtle chromatic aberration, bokeh,
real photo texture, film grain feel, natural lighting, physical light and shadow,
scene design sheet, environment concept art, no people, no characters, no human figures,
{indoor/outdoor}, {scene type}, {style}, {season+time},
Foreground: {element}, midground: {element}, background: {element},
{tone description}, {weather/atmosphere element},
{material description}, aerial perspective, texture detail ultra-clear,
material natural wear traces, usetraces, wall peeling, metal oxidation,
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
| R8 | Materials must have natural wear/usetraces, prohibit brand-new flawless "CG feel" |

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
| X8 | Material too clean and perfect, no usetraces or age feel (avoid "plastic feel") |
| X9 | Lighting too uniform and flat, no depth of field blur, no lens optical characteristics |

---

