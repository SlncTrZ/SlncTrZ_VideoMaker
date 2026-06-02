---
name: art_character_derivative
description: Character Derivative Asset Generation · Constraint Manual
metaData: art_skills
---

# Character Derivative Asset Generation · Constraint Manual

---

## I. Layering Principles

1. **Face Unchanged** — After layering, facial features must be completely identical to the base model, no facial shift
2. **Posture Unchanged** — Maintain base model natural standing posture, no posture/action/body changes
3. **Layer-by-Layer Controlled** — Each layer described independently, easy to replace per layer (change clothes without changing makeup)
4. **Style Unification** — All costume elements follow the same aesthetic system
5. **Quality Unchanged** — Quality standards after layering must not be lower than the base model
6. **Pure Costume Scope** — Only makeup/hairstyle/clothing/accessories are layered; props, scenes, environments, and actions are prohibited

---

## II. Layer Hierarchy

| Layer | Content | Description |
|---|---|---|
| L0 | Base Model | Base image base model, not modified |
| L1 | Makeup (Decision Layer) | First analyze user cues, then decide intensity: "base makeup / light makeup / formal makeup" |
| L2 | Hairstyle | Bun/tied-up/braids + hair accessories |
| L3 | Underlayer | Replace white basic underlayer |
| L4 | Outerwear/Main Garment | Chinese traditional attire/formal wear/casual wear |
| L5 | Accessories | Headwear/earrings/necklace/belt/hand accessories |

> **Scope Boundary**: Character derivative assets only include L0–L5 layers (costume and styling), not props (umbrella/sword/fan/book/lantern etc. handheld items), scene environments (indoor/outdoor/weather etc.), or posture actions (walking/turning/waving etc.). These belong to other asset categories.

---

## III. Makeup Constraints (L1)

### Base Model to Derivative Makeup Strategy (Key)

> Although the character base model is bare-faced, derivative assets default to the makeup workflow. The system should analyze makeup requirements based on user-provided cues and decide intensity between base makeup, light makeup, and formal makeup, rather than keeping bare skin.

### L1 Cue Analysis and Makeup Decision

| Step | Processing Content | Decision Result |
|---|---|---|
| S1 | Extract user cues: facial state words, emotion words, intensity words | Form makeup requirement summary |
| S2 | Filter non-makeup cues: prop/scene/action/posture words are not basis for makeup | Prevent misjudgment |
| S3 | Match makeup style matrix and assign intensity tier | Base makeup / Light makeup / Formal makeup |
| S4 | Generate final L1 prompt | Only output conclusion, not analysis process |

### Cue to Makeup Mapping (Execution Criteria)

| Cue Type | Typical Cues | L1 Decision |
|---|---|---|
| No obvious facial emphasis | Only clothing/hairstyle changes, no emotion/state emphasis | Base makeup |
| Subtle facial cues | Gentle, smiling, eyelash flutter, slight complexion lift | Light makeup (very light) |
| Clear daily cues | Daily, going out, casual | Base makeup (natural translucent) |
| Clear formal ceremony cues | Wedding, ceremony, important occasion | Formal makeup (refined luxurious) |

> Judgment Principle: All derivative assets must have makeup; first look at facial cues to determine intensity and style; prop, scene, or posture changes alone cannot elevate makeup intensity.

### Female Makeup Style Matrix

| Style | Applicable Scenes | Core Prompt Keywords |
|---|---|---|
| Elegant Bare Makeup | Daily, first meeting, boudoir | Elegant makeup, lightly brushed brows, bare makeup clear face |
| Court Noble Makeup | Court, formal, power | Refined makeup, sharp brow shape, red lip color |
| Romantic Peach Makeup | Date, heart-fluttering, sweet | Peach makeup, slightly red eye corners, moist lip color |
| Grand Wedding Makeup | Wedding, ceremony | Elaborate makeup, vermilion lips and phoenix eyes |
| Festival Celebration Makeup | Celebration, gathering | Bright colors, pastel makeup |

### Universal Base Skin (Shared across all makeup)

| Item | Constraint | Prompt |
|---|---|---|
| Texture | PBR material render, natural luminous | PBR material, natural sheen, soft texture |
| Whiteness | Pink-white base, translucent not pale | Pink-white base, fair and luminous |
| Inner Glow | Soft glow from within | Inner glow, skin translucent and luminous |
| Prohibited | Matte/dead white/waxy/greasy/overexposed | — |

### Base Makeup Detail (Default Tier)

| Item | Constraint | Prompt |
|---|---|---|
| Brows | Lightly groomed along base model brow shape, not changing brow type | Natural brow grooming, clean brow shape |
| Eyes | Very light eye makeup, emphasizing clarity and brightness | Clear eyes, very light eyeshadow |
| Cheeks | Very light complexion brightening, pastel blush | Natural cheek complexion, pastel blush |
| Lips | Light pink or vermilion color, restrained | Natural moist lip color, light pink lip color |
| Overall | Visible makeup but very light feel | Base makeup, natural makeup feel, soft texture |

### Male Makeup

| Item | Constraint | Prompt |
|---|---|---|
| Base Skin | PBR material render, fair and luminous, fresh and natural | PBR material, fair and luminous, natural sheen |
| Principle | No-makeup look — looks like no makeup but great skin | No-makeup look, naturally good skin |
| Brows | Natural thick brows, not drawn | Naturally heroic brows, handsome brow shape |
| Lip Color | Natural blood color, slightly moist | Natural lip color, blood color feel |

---

## IV. Hairstyle Constraints (L2)

### Female Style Types

| Style | Description | Applicable | Prompt |
|---|---|---|---|
| High Chignon | High bun + hair accessories | Court, formal | High chignon, refined bun |
| Double Rings | Double symmetrical rings, youthful | Young characters | Double rings, youthful style |
| Side Bun | Low side bun, languid | Daily, casual | Side bun, languid side bun |
| Hair Down | Long hair fully down, natural | Boudoir, private | Long hair loose, naturally falling |
| High Ponytail | High tied, neat and capable | Martial arts, action | High ponytail, neat and capable |
| Half-Up | Hair top half-up + back loose | Daily, going out | Half-up chignon, naturally falling hair |

### Female Hair Accessories

| Item | Constraint | Prompt |
|---|---|---|
| Style | Luxurious refined, matching outfit | Luxurious hair accessories, refined craftsmanship |
| Material | Gold/silver + pearls/jade + tassels | Gold and silver hairpins, jewels and pearls |
| Craft | High-precision modeling, clear details | High-precision craftsmanship, fine carving |

### Male Style Types

| Style | Applicable | Prompt |
|---|---|---|
| Half-Crown Tied | Daily, scholar | Half-crown tied, jade hairpin |
| Full Crown High Tied | Formal, court | Full crown high tied, jade crown |
| Hair Down to Shoulders | Private, injured | Hair down to shoulders, long hair like ink |
| High Ponytail Tied | Battle, martial arts | High tied battle hair, neat ponytail |

---

## V. Clothing Constraints (L3+L4)

### Female Clothing Matrix

| Style | Garment Type | Applicable | Prompt |
|---|---|---|---|
| Classical Long Dress | Long dress, flowing | Daily, boudoir | Classical long dress, flowing gown |
| Court Formal Attire | Formal wear, luxurious | Court, formal | Court formal attire, luxurious dress |
| Light Casual Wear | Short top, lightweight | Action, martial arts | Light casual wear, short top |
| Nightwear | Sheer inner shirt, plain color | Indoor, night | Nightwear, loose comfortable |
| Wedding Gown | Phoenix crown and cape, layered red | Wedding | Phoenix crown and cape, layered red dress |

### Female Clothing General Constraints

| Item | Constraint | Prompt |
|---|---|---|
| Main Color | Chinese traditional tones as default | Chinese traditional tone clothing, refined attire |
| Material | Silk + embroidery + pearlescent fabric | Silk texture, embroidery details |
| Texture | Texture must be ultra-clear | Clear clothing texture, ultra-clear texture |
| Shoulders | Cape/cloud shoulder/decoration | Magnificent cloud shoulder, shoulder decoration |
| Layers | Multi-layered, distinct layers | Multi-layered wearing, clear layers |

### Male Clothing Matrix

| Style | Garment Type | Applicable | Prompt |
|---|---|---|---|
| Scholar Attire | Daily, study | Scholar attire, long robe |
| Martial Outfit | Battle, training | Martial outfit, battle robe |
| Court Dress | Court, ceremony | Court dress, formal attire |
| Casual Wear | Leisure, private | Casual wear, simple style |
| Formal Attire | Formal, celebration | Formal attire, luxurious refined |

---

## VI. Accessory Constraints (L5)

### Female Accessories

| Type | Constraint | Prompt |
|---|---|---|
| Headwear | Luxurious refined, not thin | Luxurious headwear, jewels and pearls |
| Earrings | Dangling tassels/jade danglers | Tassel earrings, jade danglers |
| Necklace | Jade necklace/collar | Magnificent jade necklace, refined collar |
| Belt | Palace sash/jade pendant | Flowing palace sash, waist jade pendant |
| Handwear | Jade bracelet/armlet | Translucent jade bracelet, refined armlet |

### Male Accessories

| Type | Constraint | Prompt |
|---|---|---|
| Hair Crown | Jade crown/gold crown, refined | Jade crown tied |
| Waist Belt | Wide waist belt/leather belt | Wide waist belt, distinct texture |
| Jade Pendant | Translucent and warm | Waist jade pendant |
| Weapon | Sword/fan/flute (optional) | Long sword at side, folding fan half-covered |

---

## VII. Costume Combination Quick Reference

| Scene | Makeup | Hairstyle | Clothing | Accessories |
|---|---|---|---|---|
| Boudoir Daily | Elegant Bare | Hair Down/Half-Up | Classical Long Dress | Moderate |
| First Meeting | Elegant Bare | Half-Up/Side Bun | Classical Long Dress | Moderate+ |
| Romantic Interaction | Romantic Peach | Half-Up/Side Bun | Classical Long Dress/Light | Moderate |
| Formal Appearance | Court Noble | High Chignon | Court Formal Attire | Maximal |
| Night Private | Elegant/Peach | Hair Down/Side Bun | Nightwear | Minimal |
| Wedding Ceremony | Grand Wedding | High Chignon | Wedding Gown | Maximal |
| Martial Action | Bare (very light) | Ponytail Tied | Light Casual Wear | Minimal |

---

> **🔍 Uncovered Scene Inference Rules**
>
> When the user-described scene/situation is not in the above table, infer according to this style's core genes:
>
> | Inference Dimension | Chinese Traditional 3D Render Gene |
> |---|---|
> | Makeup Intensity | Default elegant bare; court/power/formal→court noble; heart-flutter/sweet→romantic peach; wedding/ceremony→grand wedding; festival gathering→festival celebration |
> | Hairstyle | Daily/boudoir→half-up or side bun; court/formal→high chignon; private/night→hair down; martial/action→ponytail tied |
> | Clothing | Classical attire as base; emotional scenes→flowing long dress; power/formal→court formal; action→light casual; PBR material always maintained |
> | Accessory Complexity | Daily→moderate; formal/court→maximal (gold-silver hairpins + jade necklace + jade pendant); private→minimal; action→minimal |
> | Quality Baseline | PBR material + cinematic lighting always locked; volume and luster prioritized over flat decorative feel |

## VIII. Four-View Character Sheet Specifications

> After derivative costume layering, a four-view character sheet must still be output to ensure consistency of costume and styling across angles.

### View Definitions

| Position | View | Angle | Framing | Requirement | Prompt |
|---|---|---|---|---|---|
| Left 1 | Portrait Closeup | Front, eye level | Face to collarbone | Face 60%+, facial features/makeup clear | portrait closeup、face detail、makeup detail |
| Left 2 | Front View | Front 0° | Full Body | Facing camera, full front view of clothing | front view、height mark |
| Right 2 | Side View | Right 90° | Full Body | Pure side profile, side layers of clothing | side view、profile、height mark |
| Right 1 | Back View | Rear 180° | Full Body | Back head hair accessory/back clothing/hem clear | back view、rear view、height mark |

### Frame Specifications

| Item | Constraint |
|---|---|
| Layout | Four views side by side from left to right in one image |
| Background | Plain gray solid #B8B8B8 |
| Stance | Natural standing, feet parallel slightly apart, arms naturally at sides or slightly extended (**no posture changes**) |
| Expression | Micro-expression fitting makeup style (e.g., elegant bare→calm, peach→smiling), facial micro-expression only, no limb movements |
| Lighting | Even soft light, front key light + bilateral fill, no hard shadows |
| Consistency | Face/makeup/hairstyle/hair accessory/clothing/accessory completely consistent across four views |
| Aspect Ratio | Recommended 4:1 or 3:1 |

---

## IX. Prompt Template

### Output Format Constraints

| Item | Constraint |
|---|---|
| Output Content | **Only output prompt text**, no other content |
| Prohibited Output | Quick reference tables, layered construction plans, visual constraint tables, prohibited items lists, derivative plans, output suggestions, and all other non-prompt content |
| Prohibited Scenes | Character derivative assets **do not include scene/environment descriptions**, do not output any scene/environment/weather/background narrative content (scenes belong to scene asset category) |
| Prohibited Props | **No prop interaction**, do not output umbrellas/swords/fans/books/lanterns/wine cups or other handheld or interactive items (props belong to prop asset category) |
| Prohibited Posture Changes | **Do not change base model posture**, do not output walking/turning/waving/sideways/running or any body or posture changes, maintain natural standing |
| Format | Directly output usable prompt code block, no headers, tables, explanations, or plan comparisons |

### Complete Costume Layering (Four View)

Using the character base image as base, img2img overlay costume and styling,
3D render style, high-precision modeling, PBR materials, Chinese traditional 3D, cinematic lighting,
Ancient style {gender} character four-view design sheet, 3D render, high-precision modeling, 8K, ultra-fidelity
character design sheet, character turnaround,
Keep base image face unchanged, {overall temperament},
[L1·Makeup] Decide based on user cues: {base makeup/light makeup/formal makeup}; use {makeup style}, PBR material render, {brow makeup}, {eye makeup}, {lip makeup},
[L2·Hairstyle] {style type}, high-precision clear strands, {hair accessory description},
[L3+L4·Clothing] {main color}{garment type}, {material}, {decorative technique}, clear clothing texture, PBR material render,
[L5·Accessories] {headwear}, {earrings}, {necklace}, {belt},
Same image left to right side by side: portrait closeup + front view + side view + back view,
Natural standing, plain gray solid background, even soft light, no hard shadows,
Four-view consistency, clear 3D ancient style modeling, clear high-precision modeling,
No text in the image

---

## X. Constraint Rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Face after layering must be consistent with base model |
| R2 | Clothing must use "clear clothing texture + PBR material render" |
| R3 | Female accessories must be "luxurious refined + fine craftsmanship" |
| R4 | Makeup/hairstyle/clothing/accessories style unified |
| R5 | Must output four-view design sheet (portrait closeup + front view + side view + back view) |
| R6 | Must specify "plain gray solid background" |
| R7 | Must specify "four-view consistency" |
| R8 | **Only output prompt text** — prohibit outputting quick reference tables/layered plans/visual constraints/prohibited items/derivative plans/output suggestions or any non-prompt content |
| R9 | **Prohibit including scene descriptions** — character derivative assets do not involve scenes/environments/weather/background narrative, scenes are independent asset type |
| R10 | **Prohibit prop interaction** — no handheld/interactive items (umbrella/sword/fan/book etc.), props are independent asset type |
| R11 | **Posture must remain unchanged** — must maintain base model natural standing posture, prohibit any action/body/pose changes |
| R12 | **L1 must analyze before deciding** — first parse user facial cues, then determine base makeup/light makeup/formal makeup |
| R13 | **All derivative assets require makeup** — normally do not stay bare-faced, at least use base makeup |
| R14 | **Makeup intensity controlled** — even with makeup, must be restrained, no modern heavy makeup/exaggerated colorful makeup effects |
| R15 | **Props/scenes/actions not basis for intensity upgrade** — prop, environment, or action information alone cannot elevate base makeup to stronger makeup |

### Prohibited

| No. | Prohibited |
|---|---|
| X1 | Facial shift after layering |
| X2 | Accessories too simple/modern (female) |
| X3 | Makeup/clothing styles conflicting |
| X4 | Complex scene background (must be solid color) |
| X5 | Inconsistent costume/styling across four views |
| X6 | Outputting any content beyond prompt text (tables/plans/suggestions/explanations/variants etc.) |
| X7 | Adding scene descriptions to character derivative assets (street scenes/rain scenes/indoor/streets/weather and other environmental elements) |
| X8 | Outputting "Key Elements Quick Reference" "Layered Construction Plan" "Visual Constraints" "Prohibited Items" "Derivative Plans" and similar sections |
| X9 | Adding any prop interaction (handheld umbrella/sword/fan/book/lantern/wine cup etc.) |
| X10 | Changing base model posture (walking/turning/waving/sideways/running/bowing/looking up etc.) |
| X11 | Adding expression-posture linkage descriptions (e.g., "walking 45° sideways with slight smile" narrative descriptions) |
| X12 | Applying fixed makeup without analyzing user cues |
| X13 | Incorrectly staying bare-faced, causing derivative assets to lack proper makeup |
| X14 | Mistakingly upgrading makeup only because of prop/scene/action words, causing wrong makeup intensity decision |
