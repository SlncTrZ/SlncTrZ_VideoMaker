---
name: art_character_derivative
description: Character Derivative Asset Generation · Constraint Manual
metaData: art_skills
---

# Character Derivative Asset Generation · Constraint Manual

---

## I. Overlay Principles

1. **Face Unchanged** — Facial features after overlay must be identical to base model, no facial drift
2. **Pose Unchanged** — Maintain base model's natural standing pose, no pose/action/posture changes
3. **Layer-by-Layer Control** — Each layer independently described for easy layer replacement (change clothes without changing makeup)
4. **Style Uniformity** — All costume elements follow the same aesthetic system
5. **Texture Not Degraded** — Texture standard after overlay not lower than base model
6. **Pure Costume Scope** — Only overlay makeup/hairstyle/clothing/accessories; prohibit introducing props, scenes, environments, actions

---

## II. Overlay Layers

| Layer | Content | Description |
|---|---|---|
| L0 | Base Model | Base character model, no modification |
| L1 | Makeup (Decision Layer) | Analyze user clues first, then decide intensity: "basic makeup / light makeup / formal makeup" |
| L2 | Hairstyle | Bun/updo/braid + hair accessories |
| L3 | Undergarment/Inner Layer | Replace white base undergarment |
| L4 | Outerwear/Main Garment | Ancient-style formal wear/ceremonial dress/regular wear, etc. |
| L5 | Accessories | Headwear/earrings/necklace/waist accessories/hand accessories |

> **Scope Boundary**: Character derivative assets only include L0–L5 layers (costume and makeup), not including props (umbrella/sword/fan/book/lantern, etc.), scene environments (indoor/outdoor/weather, etc.), or pose actions (walking/turning/raising hand, etc.). These belong to other asset type scopes.

---

## III. Makeup Constraints (L1)

### Base Model to Derivative Makeup Strategy (Key)

> The base model is makeup-free, but derivative assets default to entering the makeup process. The system should analyze makeup requirements based on user-provided clues and decide intensity among basic makeup, light makeup, and formal makeup, rather than staying makeup-free.

### L1 Clue Analysis and Makeup Decision

| Step | Processing Content | Decision Result |
|---|---|---|
| S1 | Extract user clues: facial state words, emotion words, intensity words | Form makeup requirement summary |
| S2 | Filter non-makeup clues: prop/scene/action/pose words not used as makeup basis | Prevent misjudgment |
| S3 | Match makeup style matrix and assign intensity level | Basic makeup / Light makeup / Formal makeup |
| S4 | Generate final L1 prompt | Output only the conclusion, not the analysis process |

### Clue to Makeup Mapping (Execution Standard)

| Clue Type | Typical Clues | L1 Decision |
|---|---|---|
| No prominent facial emphasis clues | Only clothing/hairstyle changes, no emphasis on emotion or state | Basic makeup |
| Mild facial clues | Gentle, smiling, slight lash flutter, slightly enhanced complexion | Light makeup (very light) |
| Clear daily clues | Daily, going out, casual | Basic makeup (natural translucent) |
| Clear formal ceremony clues | Wedding, ceremony, important occasion | Formal makeup (refined luxurious) |

> Judging Principle: All derivative assets require makeup; first look at facial clues to determine intensity and style; props, scenes, and pose changes alone cannot raise makeup intensity.

### Female Makeup Style Matrix

| Style | Applicable Scene | Core Prompt Keywords |
|---|---|---|
| Elegant Plain Makeup | Daily, first meeting, boudoir | Elegant makeup, lightly brushed brows, plain makeup clear face |
| Courtly Noble Makeup | Court, formal, power | Refined makeup, sharp brow shape, red lip color |
| Romantic Peach Makeup | Date, heart-fluttering, sweet | Peach makeup, slightly red at outer eye, moist lip color |
| Grand Wedding Makeup | Wedding, ceremony | Heavy makeup magnificent, vermilion lips phoenix eyes |
| Festive Celebration | Celebration, gathering | Bright colors, pastel makeup |

### General Base Skin (Shared by All Makeup)

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Texture | Cel shading flat coloring, natural luminous | Cel shading texture, natural luster, soft texture |
| Fairness | Pink-white base, translucent not pallid | Pink-white base, fair and luminous |
| Inner Glow | Soft glow from within | Inner glow feel, translucent glowing skin |
| Prohibited | Matte/dead white/waxy/oily/overexposed | — |

### Basic Makeup Detail (Default Level)

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Eyebrows | Lightly groomed along base model's brow shape, no change to brow type | Natural brow grooming, clean brow shape |
| Eyes | Very light eye embellishment, emphasizing clarity and brightness | Eyes clear translucent, very light eyeshadow |
| Cheeks | Very light complexion brightening, pastel blush | Natural cheek complexion, pastel blush |
| Lips | Light pink or vermilion coloring, restrained | Natural moist lip color, light pink lip color |
| Overall | Noticeable makeup exists, but very light makeup feel | Basic makeup, natural makeup feel, soft texture |

### Male Makeup

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Base Skin | Cel shading flat coloring, fair and luminous, fresh and natural | Cel shading texture, fair and luminous, natural luster |
| Principle | No-makeup makeup — looks like no makeup but skin is excellent | No-makeup makeup, naturally good skin |
| Eyebrows | Natural thick eyebrows, no drawn brows | Natural sword brows, heroic brow shape |
| Lip Color | Natural blood color, slightly moist | Natural lip color, blood color feel |

---

## IV. Hairstyle Constraints (L2)

### Female Style Types

| Style | Description | Applicable | Prompt Keywords |
|---|---|---|---|
| High Bun with Cloud Hair | High coiled bun + hair accessories | Court, formal | High bun cloud hair, refined coiled bun |
| Double Ring Bun | Double symmetrical rings, youthful | Young characters | Double ring bun, youthful style |
| Dangling Bun (Dama Ji) | Low side bun, languid | Daily, casual | Dangling bun, languid side bun |
| Hair Down | Long hair fully loose, natural | Boudoir, intimate | Long hair loose, naturally falling |
| High Ponytail | Tied high, neat | Martial arts, action | High ponytail, neat and tidy |
| Half-Up Hair | Top half tied + back hair loose | Daily, going out | Half-up cloud bun, natural loose hair |

### Female Hair Accessories

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Style | Luxurious and refined, matching attire | Luxurious hair accessories, refined craftsmanship |
| Material | Gold/silver + beads/jade + tassels | Gold and silver hairpins, bejeweled headdress |
| Craftsmanship | Delicate lines, clear details | Fine craftsmanship, delicate carving |

### Male Style Types

| Style | Applicable | Prompt Keywords |
|---|---|---|
| Half-Up with Crown | Daily, scholar | Half-up with crown, jade hairpin tied |
| Full Crown High Tied | Formal, court | Full crown high tied, jade crown bound hair |
| Hair Down Over Shoulders | Intimate, injured | Hair down over shoulders, ink-black long hair |
| High Ponytail Battle Style | Combat, martial arts | High tied war hair, neat ponytail |

---

## V. Clothing Constraints (L3+L4)

### Female Clothing Matrix

| Style | Type | Applicable | Prompt Keywords |
|---|---|---|---|
| Ancient-Style Long Dress | Long dress, flowing | Daily, boudoir | Ancient-style long dress, flowing garments |
| Court Ceremonial Dress | Ceremonial, luxurious | Court, formal | Court ceremonial dress, noble gown |
| Light Casual Wear | Short jacket, lightweight | Action, martial arts | Light casual wear, short jacket |
| Nightwear | Thin gauze inner shirt, plain color | Indoor, nighttime | Nightwear, loose and comfortable |
| Wedding Gown | Phoenix crown with Xiapei, layered red attire | Wedding | Phoenix crown Xiapei, layered red garments |

### Female Clothing General Constraints

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Main Color | Chinese traditional colors as default | Chinese traditional colored clothing, refined attire |
| Material | Silk + embroidery + pearlescent fabric | Silk texture, embroidery details |
| Texture | Texture must be ultra-clear | Clear clothing texture, ultra-clear texture |
| Shoulders | Pibo/cloud shoulder/decoration | Magnificent cloud shoulder, shoulder decoration |
| Layers | Multi-layered wearing, clear layers | Multi-layer layering, distinct levels |

### Male Clothing Matrix

| Style | Applicable | Prompt Keywords |
|---|---|---|
| Scholar's Attire | Daily, study | Scholar's attire, long robe |
| Warrior's Battle Dress | Combat, martial training | Warrior's battle dress, war robe |
| Court Robe | Court, ceremony | Court robe, formal ceremonial dress |
| Casual Wear | Leisure, intimate | Casual wear, simple style |
| Formal Dress | Formal, celebration | Ceremonial dress, luxurious refined |

---

## VI. Accessories Constraints (L5)

### Female Accessories

| Type | Constraint | Prompt Keywords |
|---|---|---|
| Headwear | Luxurious and refined, not thin | Luxurious headdress, bejeweled |
| Earrings | Dangling tassels/jade dang | Tassel earrings, dangled jade dang |
| Necklace | Yingluo (ancient necklace)/neck ring | Magnificent yingluo, refined neck ring |
| Waist Accessories | Palace ribbon/jade pendant | Flowing palace ribbon, jade pendant at waist |
| Hand Accessories | Jade bangle/armlet | Translucent jade bangle, refined armlet |

### Male Accessories

| Type | Constraint | Prompt Keywords |
|---|---|---|
| Hair Crown | Jade crown/gold crown, refined | Jade crown bound hair |
| Waist Belt | Broad waist belt/leather belt | Broad waist belt, distinct texture |
| Jade Pendant | Translucent warm | Jade pendant at waist |
| Weapon | Sword/fan/flute (optional) | Long sword at side, folding fan half hidden |

---

## VII. Costume Combination Quick Reference

| Scene | Makeup | Hairstyle | Clothing | Accessories |
|---|---|---|---|---|
| Boudoir Daily | Elegant plain makeup | Hair down/half-up | Ancient-style long dress | Moderate |
| First Meeting | Elegant plain makeup | Half-up/dangling bun | Ancient-style long dress | Moderate to many |
| Romantic Interaction | Romantic peach makeup | Half-up/dangling bun | Ancient-style long dress/light | Moderate |
| Formal Appearance | Courtly noble makeup | High bun with cloud hair | Court ceremonial dress | Extremely elaborate |
| Nighttime Intimate | Elegant/peach makeup | Hair down/dangling bun | Nightwear | Extremely simple |
| Wedding Ceremony | Grand wedding makeup | High bun with cloud hair | Wedding gown | Extremely elaborate |
| Martial Arts Action | Plain makeup (very light) | Tied high ponytail | Light casual wear | Simple |

---

> **🔍 Uncovered Scene Inference Rules**
>
> When the user-described scene/situation is not in the above table, infer based on this style's core genes:
>
> | Inference Dimension | Chinese-Style Anime Genes |
> |---|---|
> | Makeup Intensity | Default elegant plain makeup; festival/ceremony/formal keywords→courtly noble makeup; sweet/romantic/heart-fluttering→peach makeup |
> | Hairstyle | Daily/boudoir→half-up or dangling bun; formal/appearance→high bun with cloud hair; intimate/night→hair down; action→tied high ponytail |
> | Clothing | Emotional scenes/daily→ancient-style long dress (soft flowing); power/formal→court ceremonial dress; action/fight→light casual wear |
> | Accessory Density | Daily→moderate; formal→extremely elaborate (bejeweled hair accessories + yingluo + waist accessories); intimate/casual→simple; action→simple |
> | Color Tendency | Chinese traditional colors as anchor (frost white/moon white/vermillion/indigo); night scene/intimate→lower saturation; festive→warm red + gold |

## VIII. Four-View Character Sheet Specifications

> After derivative costume overlay, still need to output four-view character sheet to ensure costume and makeup consistency across all angles.

### View Definitions

| Position | View | Angle | Shot Type | Requirement | Prompt Keywords |
|---|---|---|---|---|---|
| Left 1 | Portrait Close-up | Front, eye level | Face to collarbone | Face 60%+, facial features/makeup clear | portrait closeup, face detail, makeup detail |
| Left 2 | Front View | Front 0° | Full Body | Facing camera, full front of clothing | front view, height mark |
| Right 2 | Side View | Right 90° | Full Body | Pure side profile, side layers of clothing | side view, profile, height mark |
| Right 1 | Back View | Back 180° | Full Body | Back of head hair accessories/back clothing/hair ends clear | back view, rear view, height mark |

### Image Specifications

| Item | Constraint |
|---|---|
| Layout | Four views side by side left to right in one frame |
| Background | Moon white solid #E8EAF5 |
| Standing Pose | Natural stance, feet parallel slightly apart, arms naturally at sides or slightly extended (**no pose changes allowed**) |
| Expression | Micro-expression matching makeup style (e.g., elegant plain makeup→calm, peach makeup→smiling), limited to facial micro-expressions, no limb movements |
| Lighting | Even soft light, front key light + bilateral fill light, no hard shadows |
| Consistency | Face/makeup/hairstyle/hair accessories/clothing/accessories completely consistent across four views |
| Aspect Ratio | Recommended 4:1 or 3:1 |

---

## IX. Prompt Template

### Output Format Constraints

| Item | Constraint |
|---|---|
| Output Content | **Output prompt text only**, no other content |
| Prohibited Output | Quick reference tables, layered construction plans, visual constraint tables, prohibited items tables, derivative plans, output suggestions, core element tables, and all non-prompt content |
| Prohibited Scene | Character derivative assets **do not include scene/environment descriptions**, do not output any scene/environment/weather/background narrative content (scenes belong to scene asset scope) |
| Prohibited Props | **No prop interaction**, do not output umbrellas/swords/fans/books/lanterns/wine glasses or other handheld or interactive items (props belong to prop asset scope) |
| Prohibited Pose Changes | **Do not change base model pose**, do not output walking/turning/raising hand/sideways/running or any action or posture changes, maintain natural standing |
| Format | Directly output usable prompt code block, no need for titles, tables, explanations, plan comparisons |

### Full Costume Overlay (Four-View)

Using the character base image as base image, img2img overlay costume and makeup,
Chinese-style anime, neo-Chinese aesthetic, Japanese anime rendering, cel shading flat coloring, delicate brushwork,
Ancient-style {gender} character four-view character sheet, Chinese-style anime, cel shading coloring, 8K, ultra fidelity
character design sheet, character turnaround,
keep base face unchanged, {overall temperament},
【L1·Makeup】Decide based on user clues: {basic makeup/light makeup/formal makeup}; use {makeup style}, cel shading flat coloring, {eyebrow makeup}, {eye makeup}, {lip makeup},
【L2·Hairstyle】{style type}, delicate clear hair strands, {hair accessory description},
【L3+L4·Clothing】{main color}{style}, {material}, {decoration craftsmanship}, clear clothing texture, cel shading flat coloring,
【L5·Accessories】{headwear}, {earrings}, {necklace}, {waist accessories},
same frame left to right side by side: portrait close-up + front view + side view + back view,
natural standing, moon white solid background, even soft light, no hard shadows,
four-view consistency, clear Chinese-style anime styling, clear delicate lines,
no text in the image

---

## X. Constraint Rules

### Mandatory

| Number | Rule |
|---|---|
| R1 | Face after overlay must be consistent with base model |
| R2 | Clothing must use "clear clothing texture + cel shading flat coloring" |
| R3 | Female accessories must be "luxurious and refined + fine craftsmanship" |
| R4 | Makeup/hairstyle/clothing/accessories style unified |
| R5 | Must output four-view character sheet (portrait close-up + front view + side view + back view) |
| R6 | Must specify "moon white solid background" |
| R7 | Must specify "four-view consistency" |
| R8 | **Output only the prompt** — no quick reference tables/layered plans/visual constraints/prohibited items/derivative plans/output suggestions or any non-prompt content |
| R9 | **No scene descriptions** — character derivative assets do not involve scenes/environments/weather/background narrative; scenes belong to independent asset type |
| R10 | **No prop interaction** — no handheld/interactive items (umbrella/sword/fan/book, etc.); props belong to independent asset type |
| R11 | **Pose remains unchanged** — must maintain base model's natural standing pose, no action/posture/stance changes |
| R12 | **L1 must analyze first, then decide** — first parse user's facial clues, then determine basic makeup/light makeup/formal makeup |
| R13 | **All derivative assets need makeup** — normal cases do not stay makeup-free, at minimum use basic makeup |
| R14 | **Makeup intensity controlled** — even when applying makeup, must be restrained; no modern heavy makeup/exaggerated colorful makeup effects |
| R15 | **Props/scenes/actions not grounds for intensity upgrade** — prop, environment, or action information alone should not raise basic makeup to stronger makeup |

### Prohibited

| Number | Prohibition |
|---|---|
| X1 | Facial drift after overlay |
| X2 | Accessories too simple/modern (female) |
| X3 | Makeup/clothing styles conflicting with each other |
| X4 | Complex scene backgrounds (must be solid color) |
| X5 | Inconsistent costume/makeup across four views |
| X6 | Outputting anything other than the prompt (tables/plans/suggestions/explanations/variants, etc.) |
| X7 | Adding scene descriptions to character derivative assets (street scenes/rain scenes/indoor/street/weather, etc.) |
| X8 | Outputting sections like "core element quick reference," "layered construction plan," "visual constraints," "prohibited items," "derivative plan" |
| X9 | Adding any prop interaction (holding umbrellas/swords/fans/books/lanterns/wine glasses, etc.) |
| X10 | Changing base model pose (walking/turning/raising hand/sideways/running/bowing/looking up, etc.) |
| X11 | Adding expression and pose linkage descriptions (e.g., "turning 45° walking, corner of mouth slightly curved") |
| X12 | Not analyzing user clues before directly applying fixed makeup |
| X13 | Incorrectly staying makeup-free, causing derivative assets to lack required makeup |
| X14 | Mistakenly upgrading makeup solely due to prop/scene/action keywords, leading to incorrect makeup intensity decision |
