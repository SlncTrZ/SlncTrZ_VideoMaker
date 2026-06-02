# Character Derivative Asset Generation · Flat Design Constraint Manual

---

## I. Overlay Principles

1. **Outline Unchanged** — Line outline after overlay must be identical to base model, no outline drift
2. **Pose Unchanged** — Maintain base model's natural standing pose, no pose/action/posture changes
3. **Layer-by-Layer Control** — Each layer independently described for easy layer replacement (change clothes without changing makeup)
4. **Style Uniformity** — All costume elements follow the same flat aesthetic system
5. **Color Block Not Degraded** — Color block standard after overlay not lower than base model
6. **Pure Costume Scope** — Only overlay makeup/hairstyle/clothing/accessories; prohibit introducing props, scenes, environments, actions

---

## II. Overlay Layers

| Layer | Content | Description |
|---|---|---|
| L0 | Base Model | Base character model, no modification |
| L1 | Makeup (Decision Layer) | Analyze user clues first, then decide intensity: "basic makeup / light makeup / formal makeup" |
| L2 | Hairstyle | Bun/updo/braid + hair accessories |
| L3 | Undergarment/Inner Layer | Replace white base undergarment |
| L4 | Outerwear/Main Garment | Large-sleeved robe/straight robe/overcoat, etc. |
| L5 | Accessories | Headwear/earrings/necklace/waist accessories/hand accessories |

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
| Mild facial clues | Gentle, smiling, slightly enhanced complexion | Light makeup (very light) |
| Clear illness/frailty clues | Pale complexion, very light lip color | Sickly pear makeup (light makeup) |
| Clear formal ceremony clues | Formal attire, ceremony, magnificent appearance | Formal makeup (controlled) |

### Female Makeup Style Matrix

| Style | Applicable Scene | Core Prompt Keywords |
|---|---|---|
| Elegant Plain Makeup | Daily, first meeting, boudoir | Flat makeup, elegant color blocks, simple makeup |
| Cold Frost Makeup | Formal, confrontation, power | Flat cold makeup, simple lines, color block makeup |
| Soft Peach Makeup | Sweet romance, flirtation, heart-fluttering | Flat peach makeup, pink tones, color block expression |
| Sickly Pear Makeup | Injured, weak | Flat sick makeup, pale skin tone, light color lips |
| Luxurious Phoenix Makeup | Wedding, formal attire | Flat heavy makeup, rich color blocks, refined lines |

### General Base Skin (Shared by All Makeup)

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Texture | Single color fill, no gradient | Single color skin, flat skin, solid skin |
| Fairness | Light single color, even | Light skin tone, single color skin tone |
| Inner Glow | No inner glow, pure flat | No luster, no translucency |
| Prohibited | Gradient/shadow/three-dimensionality | — |

### Basic Makeup Detail (Default Level)

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Eyebrows | Line outlining, single color fill | Line eyebrows, flat brow shape |
| Eyes | Simplified color blocks, no pupil details | Flat eyes, color block eyes |
| Cheeks | Very light color block, no obvious color stacking | Very light blush, color block complexion |
| Lips | Single color coloring, restrained | Single color lips, flat lips |
| Overall | Noticeable makeup exists, but color blocks very light | Basic flat makeup, no-makeup flat makeup |

---

## IV. Hairstyle Constraints (L2)

### Female Style Types

| Style | Description | Applicable | Prompt Keywords |
|---|---|---|---|
| Half-Up Cloud Bun | Top bun + back hair loose | Daily, going out | Flat cloud bun, simple coiled bun |
| Flying Immortal Bun | High bun flying upward, simple lines | Fairy realm, appearance | Flat flying bun, line high bun |
| Dangling Bun (Dama Ji) | Low side bun, languid lines | Intimate, flirtatious | Flat dangling bun, line side bun |
| Double Ring Bun | Symmetrical double buns, youthful lines | Young characters | Flat double bun, simple double rings |
| Fully Loose Hair | Long hair fully down, with simple accessory | Injured, disheveled | Flat loose hair, line long hair |
| High Ponytail | Tied high, neat, simple lines | Martial arts, action | Flat ponytail, line tied hair |

### Female Hair Accessories

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Style | Flat ornamentation, geometric shapes | Flat hair accessories, geometric decoration |
| Material | Line outlining, single color fill | Line accessories, color block hair accessories |
| Craftsmanship | Simple lines, minimal craftsmanship | Simple lines, flat craftsmanship |

### Male Style Types

| Style | Applicable | Prompt Keywords |
|---|---|---|
| Half-Up with Crown | Daily, scholar | Flat tied hair, line crown |
| Full Crown High Tied | Formal, court | Flat full crown, line tied hair |
| Hair Down Over Shoulders | Intimate, injured | Flat loose hair, line long hair |
| War Ponytail | Combat, martial arts | Flat war hair, line ponytail |

---

## V. Clothing Constraints (L3+L4)

### Female Clothing Matrix

| Style | Type | Applicable | Prompt Keywords |
|---|---|---|---|
| Simple Flowing Wear | Multi-layer large sleeve robe, flat lines | Daily, fairy realm | Flat large sleeves, line clothing |
| Dignified Ceremonial Dress | Curved hem robe/short jacket and skirt, geometric lines | Court, banquet | Flat curved hem, simple deep robe |
| Light Casual Wear | Narrow sleeve jacket and skirt/short jacket, simple lines | Action, martial arts | Flat narrow sleeves, simple short jacket |
| Nightwear | Thin gauze inner shirt, plain color flat | Indoor, nighttime | Flat nightwear, plain color clothing |
| Wedding Gown | Phoenix crown with Xiapei, layered color blocks | Wedding | Flat wedding gown, multi-layer color blocks |

### Female Clothing General Constraints

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Main Color | White/moon white/silver gray as default | White flat clothing, simple clothing |
| Material | Solid color blocks, no texture | Solid color clothing, no texture |
| Texture | Lines must be clear | Clear lines, distinct color blocks |
| Shoulders | Shoulder ornament/pibo/cloud shoulder lines | Line shoulder ornament, flat cloud shoulder |
| Layers | Multi-layer wearing, distinct color blocks | Multi-layer layering, flat layers |

### Male Clothing Matrix

| Style | Applicable | Prompt Keywords |
|---|---|---|
| Scholar's Elegant Wear | Daily, study | Flat long robe, simple clothing |
| Warrior's Battle Dress | Combat, martial training | Flat battle dress, simple war uniform |
| Dark Overcoat | Entrance, night travel | Flat overcoat, line cloak |
| Casual Wear | Leisure, intimate | Flat casual wear, simple casual clothes |
| Ceremonial Court Robe | Court, ceremony | Flat court robe, simple ceremonial robe |

---

## VI. Accessories Constraints (L5)

### Female Accessories

| Type | Constraint | Prompt Keywords |
|---|---|---|
| Headwear | Flat, geometric shapes | Flat headwear, geometric hair accessory |
| Earrings | Line tassels/jade dang | Line earrings, flat dang |
| Necklace | Line yingluo/neck ring | Line yingluo, flat neck ring |
| Waist Accessories | Line palace ribbon/jade pendant | Line palace ribbon, flat jade pendant |
| Hand Accessories | Line jade bangle/armlet | Line bracelet, flat armlet |

### Male Accessories

| Type | Constraint | Prompt Keywords |
|---|---|---|
| Hair Crown | Flat crown, simple lines | Flat crown, line crown |
| Waist Belt | Line waist belt, flat color block | Line waist belt, flat belt |
| Jade Pendant | Flat jade pendant, simple shape | Flat jade pendant, line pendant |
| Weapon | Sword/fan/flute (optional) | Flat sword, line fan |

---

## VII. Costume Combination Quick Reference

| Scene | Makeup | Hairstyle | Clothing | Accessories |
|---|---|---|---|---|
| Daily Boudoir | Elegant plain makeup | Half-up cloud bun | Simple flowing wear | Flat moderate |
| First Meeting | Elegant plain makeup | Half-up/flying immortal | Simple flowing wear | Flat moderate to many |
| Sweet Interaction | Soft peach makeup | Half-up/dangling | Simple/light | Flat moderate |
| Formal Appearance | Cold frost makeup | Flying immortal bun | Dignified ceremonial dress | Flat extremely elaborate |
| Nighttime Secret Talk | Elegant/peach makeup | Fully loose/dangling | Nightwear | Flat extremely simple |
| Injured Disheveled | Sickly pear makeup | Fully loose (messy) | Damaged casual wear | Flat extremely simple/none |
| Wedding Ceremony | Luxurious phoenix makeup | Flying immortal bun | Wedding gown | Flat extremely elaborate |
| Martial Arts Action | Plain makeup (very light) | Tied high ponytail | Light casual wear | Flat simple |

---

> **🔍 Uncovered Scene Inference Rules**
>
> When the user-described scene/situation is not in the above table, infer based on this style's core genes:
>
> | Inference Dimension | Flat Ancient-Style Genes |
> |---|---|
> | Makeup Intensity | Default elegant plain makeup (minimalist color blocks); formal/appearance→cold frost makeup; sweet romance/date→soft peach makeup; weakened/frailty→sickly pear makeup |
> | Hairstyle | Daily→half-up cloud bun or dangling bun; formal→flying immortal bun; intimate/night→fully loose hair; action→tied high ponytail |
> | Clothing | All clothing must be converted to flat color block expression; patterns extremely simplified; multi-layer wearing retaining outline feel only |
> | Accessory Density | Flat processing priority; formal→flat extremely elaborate (simplified to color block headwear + waist outline); daily→flat moderate |
> | Color Tendency | Low-saturation ancient-style color scheme (tea white/bamboo green/lotus root pink/brick red); no gradient; clear boundary lines |

## VIII. Four-View Character Sheet Specifications

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
| Background | Pure neutral gray #E8E8E8 |
| Standing Pose | Natural stance, feet parallel slightly apart, arms naturally at sides or slightly extended (**no pose changes allowed**) |
| Expression | Micro-expression matching makeup style (e.g., elegant plain makeup→calm, peach makeup→smiling), limited to facial micro-expressions, no limb movements |
| Lighting | No light and shadow, pure flat color blocks |
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


```
Using the character base image as base image, img2img overlay costume and makeup,
Flat ancient-style {gender} character four-view character sheet,
2d flat design, vector art, flat illustration,
minimalist, clean lines, solid colors,
keep base outline unchanged, {overall temperament},
【L1·Makeup】Decide based on user clues: {basic makeup/light makeup/formal makeup}; use {makeup style}, single color skin, flat skin tone, {eyebrow makeup}, {eye makeup}, {lip makeup},
【L2·Hairstyle】{style type}, line hairstyle, {hair accessory description},
【L3+L4·Clothing】{main color}{style}, {material}, {decoration craftsmanship}, clear lines, distinct color blocks,
【L5·Accessories】{headwear}, {earrings}, {necklace}, {waist accessories},
same frame left to right side by side: portrait close-up + front view + side view + back view,
natural standing, pure neutral gray background, no light and shadow, no gradient,
four-view consistency, simple lines, color block fill,
no text in the image
```


---

## X. Constraint Rules

### Mandatory

| Number | Rule |
|---|---|
| R1 | Outline after overlay must be consistent with base model |
| R2 | Clothing must use "clear lines + distinct color blocks" |
| R3 | Female accessories must be "flat + geometric shapes" |
| R4 | Makeup/hairstyle/clothing/accessories style unified |
| R5 | Must output four-view character sheet (portrait close-up + front view + side view + back view) |
| R6 | Must specify "pure neutral gray background" |
| R7 | Must specify "four-view consistency" |
| R8 | **Output only the prompt** — no quick reference tables/layered plans/visual constraints/prohibited items/derivative plans/output suggestions or any non-prompt content |
| R9 | **No scene descriptions** — character derivative assets do not involve scenes/environments/weather/background narrative; scenes belong to independent asset type |
| R10 | **No prop interaction** — no handheld/interactive items (umbrella/sword/fan/book, etc.); props belong to independent asset type |
| R11 | **Pose remains unchanged** — must maintain base model's natural standing pose, no action/posture/stance changes |
| R12 | **L1 must analyze first, then decide** — first parse user's facial clues, then determine basic makeup/light makeup/formal makeup |
| R13 | **All derivative assets need makeup** — normal cases do not stay makeup-free, at minimum use basic makeup |
| R14 | **Makeup intensity controlled** — even when applying makeup, must be restrained; no modern flat heavy makeup/exaggerated colorful makeup effects |
| R15 | **Props/scenes/actions not grounds for intensity upgrade** — prop, environment, or action information alone should not raise basic makeup to stronger makeup |

### Prohibited

| Number | Prohibition |
|---|---|
| X1 | Outline drift after overlay |
| X2 | Accessories too simple/modern (female) |
| X3 | Makeup/clothing styles conflicting with each other |
| X4 | Complex scene backgrounds (must be pure gray background) |
| X5 | Inconsistent costume/makeup across four views |
| X6 | Outputting anything other than the prompt (tables/plans/suggestions/explanations/variants, etc.) |
| X7 | Adding scene descriptions to character derivative assets (mountain path/rain scenes/indoor/street/weather, etc.) |
| X8 | Outputting sections like "core element quick reference," "layered construction plan," "visual constraints," "prohibited items," "derivative plan" |
| X9 | Adding any prop interaction (holding umbrellas/swords/fans/books/lanterns/wine glasses, etc.) |
| X10 | Changing base model pose (walking/turning/raising hand/sideways/running/bowing/looking up, etc.) |
| X11 | Adding expression and pose linkage descriptions (e.g., "turning 45° walking, corner of mouth slightly curved") |
| X12 | Not analyzing user clues before directly applying fixed makeup |
| X13 | Incorrectly staying makeup-free, causing derivative assets to lack required makeup |
| X14 | Mistakenly upgrading makeup solely due to prop/scene/action keywords, leading to incorrect makeup intensity decision |
| X15 | Adding gradient/shadow/highlight/three-dimensional effects |
