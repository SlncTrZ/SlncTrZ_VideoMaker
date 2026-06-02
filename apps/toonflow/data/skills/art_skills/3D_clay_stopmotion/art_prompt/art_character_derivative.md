# Clay Stop-Motion Character Derivative Asset Generation · Constraint Manual

---

## I. Layering Principles

1. **Face Unchanged** — After layering, facial features must be completely identical to the base model
2. **Posture Unchanged** — Maintain base model natural standing posture
3. **Layer-by-Layer Controlled** — Each layer described independently, easy to replace per layer
4. **Style Unification** — All costume elements follow the same clay aesthetic system
5. **Quality Unchanged** — Clay texture quality standards after layering must not be lower than the base model
6. **Pure Costume Scope** — Only makeup/hairstyle/clothing/accessories are layered; props, scenes, and environments are prohibited

---

## II. Layer Hierarchy

| Layer | Content | Description |
|---|---|---|
| L0 | Base Model | Base image base model, not modified |
| L1 | Makeup | Basic decorative color accents |
| L2 | Hairstyle | Bun/tied-up + simple hair accessories |
| L3 | Underlayer | Replace white basic underlayer |
| L4 | Outerwear/Main Garment | Jacket/robe/outerwear |
| L5 | Accessories | Headwear/earrings/necklace/belt |

> **Scope Boundary**: Character derivative assets only include L0–L5 layers (costume and styling), not props, scene environments, or posture actions.

---

## III. Makeup Constraints (L1)

### L1 Decision Principles

| Cue Type | Typical Cues | L1 Decision |
|---|---|---|
| No obvious facial emphasis | Only clothing/hairstyle changes | Basic decorative makeup |
| Subtle facial cues | Soft, smiling, complexion brightening | Light decorative makeup |
| Clear scene cues | Wedding, celebration, formal occasion | Formal decorative makeup |

### Female Makeup Style Matrix

| Style | Applicable Scenes | Core Prompt Keywords |
|---|---|---|
| Fresh Bare Makeup | Daily, first meeting | Natural makeup, clear and light |
| Sweet Warm Peach | Sweet romance, date | Pink blush, warm lip color |
| Festival Celebration | Celebration, wedding | Rich makeup, vibrant colors |
| Evening Banquet | Night, gathering | Warm eyeshadow, subtle lip sheen |

### Universal Base Skin (Shared across all makeup)

| Item | Constraint | Prompt |
|---|---|---|
| Texture | Matte clay texture | Matte clay, matte clay |
| Whiteness | Warm cream color | Warm cream skin, cream warm tone |
| Prohibited | Shine/greasy/mirror effect | — |

### By Area (Using Sweet Warm Peach as Example)

| Area | Constraint | Prompt |
|---|---|---|
| Blush | Warm pink, lightly swept on apple cheeks | Warm pink blush, soft apple cheeks |
| Eyeshadow | Warm brown/orange tones, very light | Warm brown eyeshadow, very light eye makeup |
| Lips | Warm pink/coral, matte | Warm pink lip color, matte lip |
| Brows | Natural curved brows, color matching hair | Natural curved brows, soft brow shape |

### Male Makeup

| Item | Constraint | Prompt |
|---|---|---|
| Base Skin | Matte clay texture, warm beige | Matte clay, warm beige |
| Principle | No-makeup look — looks natural but even skin tone | Natural skin tone, no-makeup look |
| Blush | Very light complexion, no obvious color buildup | Very light complexion, natural complexion |
| Lip Color | Natural blood color, matte | Natural lip color, matte lip |

---

## IV. Hairstyle Constraints (L2)

### Female Style Types

| Style | Description | Applicable | Prompt |
|---|---|---|---|
| Half-Up Bun | Top half bun + back loose hair | Daily, going out | Half-up bun, hair half-coiled |
| High Bun | High coiled bun, elegant | Formal, celebration | High bun, elegant bun |
| Low Bun | Low side bun, languid | Private, casual | Low bun, languid style |
| Double Buns | Twin symmetrical buns, youthful | Young characters | Double buns, youthful hairstyle |
| Fully Down | Long hair fully loose | Injured, vulnerable | Long hair loose, soft hair |

### Female Hair Accessories

| Item | Constraint | Prompt |
|---|---|---|
| Style | Vintage warm, not too complex | Vintage hair accessories, warm decoration |
| Material | Clay material, simple metal | Clay hair accessory, simple metal |
| Decoration | Flowers/beads/ribbons | Flower hair accessory, bead embellishment |

### Male Style Types

| Style | Applicable | Prompt |
|---|---|---|
| Half-Crown Tied | Daily, simple | Half-crown tied, natural tied |
| Full Crown High Tied | Formal, ceremony | High crown tied, formal hairstyle |
| Hair Down to Shoulders | Private, casual | Hair down to shoulders, natural long hair |
| Ponytail Tied | Action, activity | Ponytail tied, neat hairstyle |

---

## V. Clothing Constraints (L3+L4)

### Female Clothing Matrix

| Style | Garment Type | Applicable | Prompt |
|---|---|---|---|
| Daily Long Dress | Simple long dress | Daily, casual | Simple long dress, daily attire |
| Formal Long Dress | Layered long dress | Formal, celebration | Layered long dress, magnificent gown |
| Light Casual Wear | Short top + skirt | Action, activity | Light casual wear, short top and skirt |
| Nightwear | Loose long dress | Indoor, night | Loose nightwear, comfortable long dress |
| Wedding Gown | Red layered long dress | Wedding | Red wedding dress, layered red attire |

### Female Clothing General Constraints

| Item | Constraint | Prompt |
|---|---|---|
| Main Color | Warm tones primarily, low saturation | Warm-toned clothes, soft colors |
| Material | Clay sculpted, simple texture | Clay material, simple texture |
| Texture | Clear visible texture | Clear clothing texture |
| Layers | Simple layering, distinct layers | Simple layers, clear layering |

### Male Clothing Matrix

| Style | Garment Type | Applicable | Prompt |
|---|---|---|---|
| Vintage Casual | Long robe | Daily, home | Vintage long robe, daily casual |
| Action Wear | Adventure wear | Adventure, action | Action wear, adventure clothing |
| Outer Robe | Overcoat | Entrance, night travel | Outer robe, dark cloak |
| Casual Wear | Casual clothes | Leisure, private | Everyday clothes, casual |
| Formal Attire | Ceremonial wear | Celebration, ceremony | Formal wear, ceremonial clothing |

---

## VI. Accessory Constraints (L5)

### Female Accessories

| Type | Constraint | Prompt |
|---|---|---|
| Headwear | Not too complex, warm style | Simple headwear, warm decoration |
| Earrings | Small earrings/earrings | Small earrings, delicate earrings |
| Necklace | Simple necklace/collar | Simple necklace, refined collar |
| Belt | Simple belt/jade pendant | Simple belt, small jade pendant |
| Handwear | Simple bracelet | Simple bracelet, small bracelet |

### Male Accessories

| Type | Constraint | Prompt |
|---|---|---|
| Hair Crown | Simple hair crown/jade hairpin | Simple hair crown, jade hairpin |
| Waist Belt | Simple waist belt/leather belt | Simple waist belt, distinct texture |
| Jade Pendant | Translucent and warm | Waist jade pendant, warm jade pendant |
| Decoration | Simple pendant/sword (optional) | Simple pendant, small sword |

---

## VII. Costume Combination Quick Reference

| Scene | Makeup | Hairstyle | Clothing | Accessories |
|---|---|---|---|---|
| Daily Boudoir | Fresh Bare | Half-Up Bun | Daily Long Dress | Simple |
| First Meeting | Fresh Bare | Half-Up/High Bun | Daily Long Dress | Moderate |
| Sweet Interaction | Sweet Warm Peach | Half-Up/Low Bun | Daily Long Dress | Moderate |
| Formal Appearance | Festival Celebration | High Bun | Formal Long Dress | Complex |
| Night Talk | Fresh/Peach | Fully Down/Low Bun | Nightwear | Minimal |
| Wedding Ceremony | Festival Celebration | High Bun | Wedding Gown | Complex |

---

> **🔍 Uncovered Scene Inference Rules**
>
> When the user-described scene/situation is not in the above table, infer according to this style's core genes:
>
> | Inference Dimension | Clay Stop-Motion Gene |
> |---|---|
> | Makeup Intensity | Default fresh bare (matte clay texture); sweet/daily→sweet warm peach; celebration/wedding→festival celebration; night/indoor→evening banquet |
> | Hairstyle | Daily→half-up bun; formal/celebration→high bun; private/casual→low bun or fully down; all hairstyles maintain clay sculpted feel |
> | Clothing | Vintage fantasy base; daily→simple long dress; formal→layered formal long dress; action→light casual wear; material always clay sculpted + simple texture |
> | Accessory Complexity | Keep warm not overly complex; celebration→complex (flowers + beads); daily→simple; action→minimal |
> | Quality Baseline | Matte clay texture always locked; no shine/metal reflection; warm cream skin tone priority |

## VIII. Four-View Character Sheet Specifications

### View Definitions

| Position | View | Angle | Framing | Requirement | Prompt |
|---|---|---|---|---|---|
| Left 1 | Portrait Closeup | Front, eye level | Face to collarbone | Face 60%+, facial features/makeup clear | portrait closeup、face detail |
| Left 2 | Front View | Front 0° | Full Body | Facing camera, full front view of clothing | front view、full body |
| Right 2 | Side View | Right 90° | Full Body | Pure side profile, side layers of clothing | side view、profile、full body |
| Right 1 | Back View | Rear 180° | Full Body | Back head hair accessory/back clothing/hem clear | back view、rear view、full body |

### Frame Specifications

| Item | Constraint |
|---|---|
| Layout | Four views side by side from left to right in one image |
| Background | Clean neutral gray #E8E8E8 |
| Stance | Natural standing, feet parallel slightly apart, arms naturally at sides |
| Expression | Micro-expression fitting makeup style, facial micro-expression only |
| Lighting | Warm soft light, front key light + bilateral fill, no hard shadows |
| Consistency | Face/makeup/hairstyle/hair accessory/clothing/accessory completely consistent across four views |
| Aspect Ratio | Recommended 4:1 or 3:1 |

---

## IX. Prompt Template

```
Using the character base image as base, clay stop-motion {gender} character four-view design sheet, stop-motion style, 3D cartoon render, warm-toned lighting,
character design sheet, character turnaround,
Keep base image face unchanged, {overall temperament},
[L1·Makeup] Decide based on user cues: {basic decorative makeup/light decorative makeup/formal decorative makeup}; use {makeup style}, matte clay texture, {brow makeup}, {eye makeup}, {lip makeup},
[L2·Hairstyle] {style type}, clay hairstyle, {hair accessory description},
[L3+L4·Clothing] {main color}{garment type}, {material}, {decorative technique}, clear clothing texture,
[L5·Accessories] {headwear}, {earrings}, {necklace}, {belt},
Same image left to right side by side: portrait closeup + front view + side view + back view,
Natural standing, clean neutral gray background, warm soft light, no hard shadows,
Four-view consistency, delicate clay texture rendering, soft healing expression
No text in the image
```

---

## X. Constraint Rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Face after layering must be consistent with base model |
| R2 | Clothing must use "clear clothing texture" |
| R3 | Female accessories must be "not too complex, warm style" |
| R4 | Makeup/hairstyle/clothing/accessories style unified |
| R5 | Must output four-view design sheet |
| R6 | Must specify "clean neutral gray background" |
| R7 | Must specify "four-view consistency" |
| R8 | **Only output prompt text** — prohibit outputting non-prompt content |
| R9 | **Prohibit including scene descriptions** |
| R10 | **Prohibit prop interaction** |
| R11 | **Posture must remain unchanged** |
| R12 | **L1 must analyze before deciding** |
| R13 | **All derivative assets require makeup** |
| R14 | **Makeup intensity must be restrained** |
| R15 | **Props/scenes/actions not basis for intensity upgrade** |

### Prohibited

| No. | Prohibited |
|---|---|
| X1 | Facial shift after layering |
| X2 | Accessories too simple/modern |
| X3 | Makeup/clothing styles conflicting |
| X4 | Complex scene background (must be pure gray) |
| X5 | Inconsistent costume/styling across four views |
| X6 | Outputting any content beyond prompt text |
| X7 | Adding any prop interaction |
| X8 | Changing base model posture |
| X9 | Adding expression-posture linkage descriptions |
| X10 | Applying fixed makeup without analyzing user cues |
| X11 | Incorrectly staying bare-faced |
| X12 | Mistakingly upgrading makeup only because of prop/scene/action words |
