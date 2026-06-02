---
name: director_planning_style
description: Chinese Traditional 3D Constraints — Defines global constraints for Chinese Traditional 3D style in terms of color system, lighting schemes, texture direction, scene space elements, instrument selection, and ambient sound. Applicable to any narrative type.
metaData: director_skills
---

# Chinese Traditional 3D Constraints · Chinese Traditional 3D · Technique Reference

---

## I. Color System and Visual Tone

- **Color base** — The entire film uses moon white (C1), blue-green (C2), indigo (C4) as base colors. Overall color temperature leans neutral (4800-5500K), saturation mid-high (55-75%), presenting the elegant and grand tone of traditional Eastern aesthetics
- **Emotion palette driving** — Six emotional palettes (courtly splendor/landscape artistic conception/boudoir gentleness/wuxia solemnity/festive joy/moonlit serenity) correspond to different narrative segments. Paletteswitching should synchronize with the story arc
- **Cool/warm narrative contrast** — Warm colors (vermillion C3, golden yellow C5, rouge C7, gamboge C9) serve as visual signals for narrativeturn/twist, used for emotionalrising warm and festive segments; cool colors (indigo C4, ink black C6) used for solemnity, melancholy, serenity segments
- **Palette-first principle** — Paragraph planning must first bind emotional scenes (courtly splendor/landscape artistic conception/boudoir gentleness/wuxia solemnity/festive joy/moonlit serenity, etc.), then determine main color + secondary color and lighting scheme, avoiding "story arc is right but emotion color is wrong"
- **Prohibited color gamut** — High-saturation fluorescent colors, neon colors, modern digital color systems are all incompatible with this style

---

## II. Lighting Scheme System

- **Lighting is narrative** — 7 lighting schemes correspond to different emotional segments. The director shoulddetermine/confirm lighting tone direction at the paragraph level during planning, rather than specifying per shot
- **3D rendering lighting characteristics** — Volumetric light, ambient occlusion (AO), depth-of-field blur are the core lightingmeans of Chinese Traditional 3D style; all lighting schemes must reflect PBR physical material renderingtexture

| Lighting Scheme | Scheme Name | Huetendency | Applicable Emotions |
|---|---|---|---|
| A | Warm brilliance | Vermillion + golden yellow highlights + moon white base | Courtly splendor, majestic grandeur, festive celebration |
| B | Blue-green artistic conception | Blue-green + moon white mist + volumetric light diffusion | Landscape artistic conception, poetic distance, ethereal elegance |
| C | Soft warm shadow | Rouge warm tone + golden yellowaccents + soft shadows | Boudoir gentleness,soft and beautifulfine/delicate, daily warmth |
| D | Cool solemnity | Ink black + indigo + hard light contrast | Wuxia solemnity, cold sharpness, suppressed atmosphere |
| E | Window screen diffusion | Moon white base + natural side light + ambient occlusion | Indoor daytime, daily life, quiet elegance |
| F | Moonlit cool glow | Indigo + moon white cool light + golden yellow warm lightaccents | Moonlit serenity, peaceful beauty, yearning solitude |
| G | Festive warm light | Vermillion + gamboge + high-saturation warm light | Festival celebration, lively joy, rich colors |

- **Cool/warm light allocation** — Warm light (vermillion/golden yellow/gamboge) suitable used for splendor, gentleness, festive segments; cool light (indigo/ink black) suitable used for solemnity, melancholy, serenity segments. Director can adjust cool/warm switching points based on narrative needs
- **Atmosphere direction mapping** — The atmosphere direction of each scene should map to one of the above lighting schemes (A-G), ensuring visual consistency

---

## III. Texture Direction

- **3D rendering as anchor** — Core of Chinese Traditional 3D: high-precision modeling, PBR material rendering, volumetric light, ambient occlusion, depth-of-field blur, presenting cinematic 3D rendering visuals
- **PBR materialssupreme** — All costume andprops materials must be believable through PBR physical rendering: silk gloss and drape, wood texture and patina, metal reflection andtexture, jade translucency and warmth, porcelain glaze luster
- **Volumetric light and depth of field** — Volumetric light is the soul of Chinese Traditional 3D visuals: outdoor scenes must have atmospheric perspective and volumetric light scattering; indoor scenes create volumetric light effects through window light/candlelight; depth-of-field blur enhances spatial depth
- **Agedtexture** — Materials should not be too clean and perfect: wood surfaces with weartraces, stone surfaces with weathering cracks and moss, fabric with natural folds, tiles with moss and imperfections. Prohibit "plastic feel" and flawless new "CG feel"
- **3D is not cold** — Chinese Traditional 3D emphasizes the warmth of Eastern aesthetics, conveying emotion through materialtexture, light-shadow layering, and color matching, rather than relying on spectacle effects

---

## IV. Ancient Scene Space Elements

Unique scene elements of the ancient worldview and their visual narrative functions:

- **Gauze curtains/folding screens/door frames** — Natural frame composition props, creating "unfathomable" layering and spatial depth. The semi-transparent material of gauze curtains and lightpenetrate effects are visual highlights in 3D rendering
- **Courtyard/flowering trees/rain curtain** — Natural carriers of negative space composition; scene is emotion: garden full of blooming flowers = release, sitting alone in the rain = solitude, falling leaves = parting sorrow. Vegetation volumetric feel and light interaction in 3D scenes are especially important
- **Candlelight/moonlight/window light** — Light carriers of the ancient world, candlelight = warmth/privacy (Scheme C), moonlight = cool/serenity (Scheme F), window light = daily/peaceful (Scheme E). Volumetric light effects and PBR material reflection are key in 3D rendering
- **Flying eaves/brackets/blue tiles** — Iconic elements of ancient architecture; 3D modeling must reflect the exquisite details of carved beams and painted rafters, with aged materialtexture
- **Use empty scene shots between paragraphs for transition** — This style has rich scene assets (different time periods/weather/season variants). Scene transitions should use empty scene shots as emotional buffers, not hard cuts
- **Use visuals rather than dialogue at turning points** — Prioritize visual means (lightingsudden change, shot sizejump cut, empty shot metaphor) rather than relying on dialogue explanation

---

## V. Ancient Instruments and Ambient Sound

Sound element constraints under the ancient worldview:

### Instrument Selection

- **Xiao (vertical flute)** — Core instrument for desolate, lonely, sorrowful segments, best expresses cold mournfulness
- **Erhu** — Emotional surge, grief, yearning segments; the crying feel of bowed strings suits emotional outburst
- **Suona** — Segments withintense emotionalfluctuation (great joy or great sorrow, fateturn/twist, climax); use sparingly but when used, it's a nuclear bomb
- **Guqin** — Opening tuning/calm segments, paired with xiao, expressing landscape artistic conception
- **Pipa** — Point instrument for tense, urgent segments, suitable for wuxia solemnity scenes
- **Guzheng** — Atmosphere instrument for courtly splendor, festive celebration segments, ornate and elegant
- String foundation can enhance cinematic feel but should not overpower

### Instrument Combination Strategy

| Emotional Stage | Instrument Combination |
|---|---|
| Calm/Opening/Closing | Guqin solo or Guqin + Xiao |
| Landscape artistic conception/Ethereal | Xiao + Guqin + Di (bamboo flute) |
| Courtly splendor/Festive | Guzheng + Bianzhong (bell chimes) + Strings |
| Deepening sorrow | Xiao + Erhu |
| Emotional outburst/Fateturn/twist | Suona solo or Suona + Erhu |
| Wuxia solemnity/Tension | Pipaaccents + strings foundation |
| Gentle daily | Guqin + Di + light strings |

### Ancient Ambient Sound

- **Typical ambient sound layers** — Cicadas and insects chirping / Brook babbling / Wind through bamboo groves / Street vendor calls / Night rain dripping on eaves / Fabric rustling / Wind chimes tinkling / Birds chirping / Falling petals rustling
- **Mark 1-2 core ambient sounds per scene** to assist subsequent sound design. The richer the ambient sound layers, the more immersive the ancient scene
