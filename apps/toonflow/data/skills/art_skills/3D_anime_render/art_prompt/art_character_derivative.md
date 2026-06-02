# 3D Anime Render Urban Character Derivative Asset Generation · Constraint Manual

---

## I. Layering Principles

1. **Face Unchanged** — After layering, facial features must be completely identical to the base model, no facial shift
2. **Posture Unchanged** — Maintain the base model's natural standing posture, no posture/action/body changes
3. **Layer-by-Layer Controlled** — Each layer described independently, easy to replace per layer (change clothes without changing makeup)
4. **Style Unification** — All costume elements follow the same urban animation aesthetic system
5. **Quality Unchanged** — Quality standards after layering must not be lower than the base model
6. **Pure Costume Scope** — Only makeup/hairstyle/clothing/accessories are layered; props, scenes, environments, and actions are prohibited

---

## II. Layer Hierarchy

| Layer | Content | Description |
|---|---|---|
| L0 | Base Model | Base image base model, not modified |
| L1 | Makeup (Decision Layer) | First analyze user cues, then decide intensity: "base makeup / light makeup / formal makeup" |
| L2 | Hairstyle | Loose/messy bun/bun/half-up + hair accessories |
| L3 | Underlayer | Replace white basic underlayer |
| L4 | Outerwear/Main Garment | Modern urban clothing |
| L5 | Accessories | Headwear/earrings/necklace/belt/hand accessories |

> **Scope Boundary**: Character derivative assets only include L0–L5 layers (costume and styling), not props (umbrella/phone/computer/coffee etc. handheld items), scene environments (indoor/outdoor/weather etc.), or posture actions (walking/turning/waving etc.). These belong to other asset categories.

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
| Explicit sick/weak cues | Pale complexion, very light lip color, slightly red under eyes | Sickly pear makeup (light makeup) |
| Explicit formal ceremony cues | Formal attire, ceremony, luxurious appearance | Formal makeup (controlled) |

> Judgment Principle: All derivative assets must have makeup; first look at facial cues to determine intensity and style; prop, scene, or posture changes alone cannot elevate makeup intensity.

### Female Makeup Style Matrix

| Style | Applicable Scenes | Core Prompt Keywords |
|---|---|---|
| Elegant Bare Makeup | Daily, first meeting, work | Elegant makeup, lightly brushed brows, bare makeup clear face |
| Cold Glamour Makeup | Formal, confrontation, power | Cold glamour makeup, sharp brows and eyes, thin lips cool |
| Soft Peach Makeup | Sweet romance, ambiguous, heart-fluttering | Peach makeup, slightly red eye corners, moist lip color |
| Sickly Pear Makeup | Injured, weak | Pale complexion, very light lip color, slightly red under eyes |
| Luxurious Evening Makeup | Formal dinner, dressed up | Elaborate makeup, bright lip color |

### Universal Base Skin (Shared across all makeup)

| Item | Constraint | Prompt |
|---|---|---|
| Texture | Cel-shaded render, soft sheen | Cartoon skin, soft skin texture |
| Whiteness | Cool fair skin, translucent not pale | Milky skin, milky white skin |
| Inner Glow | Soft glow from within | Inner glow, skin translucent and luminous |
| Prohibited | Matte/dead white/waxy/greasy/overexposed | — |

### Base Makeup Detail (Default Tier)

| Item | Constraint | Prompt |
|---|---|---|
| Brows | Lightly groomed along base model brow shape, not changing brow type | Natural brow grooming, clean brow shape |
| Eyes | Very light eye makeup, emphasizing clarity and brightness | Clear eyes, very light inner eyeliner |
| Cheeks | Very light complexion brightening, no obvious color buildup | Natural cheek complexion, subtle complexion lift |
| Lips | Nude pink or light pink color, restrained | Natural moist lip color, light pink lip color |
| Overall | Visible makeup but very light feel | Base makeup, no-makeup makeup look, natural refinement |

### By Area (Using Elegant Bare Makeup as Example)

| Area | Constraint | Prompt |
|---|---|---|
| Base | Light and translucent, water-glazed subtle sheen | Light base makeup, water-glaze cream skin |
| Brows | Distant mountain brows/willow leaf brows, gray-brown lightly brushed | Distant mountain dark brows, lightly brushed brows |
| Eyes | Very light eyeshadow, inner eyeliner, long lashes | Clear eye makeup, long lashes |
| Blush | Very light thin powder, lightly swept on apple cheeks | Very light blush, thin powder slightly flushed |
| Lips | Moist light pink, subtle sheen | Moist light pink lip color |

### Male Makeup

| Item | Constraint | Prompt |
|---|---|---|
| Base Skin | Cel-shaded render, fair and translucent, fresh and natural | Cartoon skin, cream skin, luminous skin |
| Principle | No-makeup look — looks like no makeup but great skin | No-makeup look, naturally good skin |
| Brows | Natural thick brows, not drawn | Naturally heroic brows, handsome brow shape |
| Lip Color | Natural blood color, slightly moist | Natural lip color, blood color feel |

---

## IV. Hairstyle Constraints (L2)

### Female Style Types

| Style | Description | Applicable | Prompt |
|---|---|---|---|
| Natural Loose | Long hair naturally falling, soft and shiny | Daily, casual | Natural loose, soft long hair |
| High Ponytail | High tied ponytail, energetic and neat | Sports, commute | High ponytail, energetic ponytail |
| Low Ponytail | Low tied ponytail, elegant and simple | Daily, business | Low ponytail, elegant ponytail |
| Half-Up | Upper half tied + lower half naturally falling | Daily, date | Half-up, half-tied hairstyle |
| Double Ponytails | Side ponytails, youthful and lively | Lively scenes | Double ponytails, lively hairstyle |
| Elegant Bun | Bun/messy bun, formal feel | Formal occasions | Elegant bun, low bun |

### Female Hair Accessories

| Item | Constraint | Prompt |
|---|---|---|
| Style | Modern urban style, simple and refined, matching outfit | Modern hair accessories, urban style |
| Material | Metal/fabric/acrylic | Metal hair clip, fabric hair accessory |
| Craft | Exquisite craftsmanship, cartoon-style presentation | Fine craftsmanship, refined decoration |

### Male Style Types

| Style | Applicable | Prompt |
|---|---|---|
| Fresh Short Hair | Daily, business | Fresh short hair, neat hairstyle |
| Side Part/Middle Part | Formal, commute | Side-parted hairstyle, middle-parted hairstyle |
| Fluffy Messy | Casual, artistic | Fluffy hairstyle, messy casual |
| Medium-Length Natural | Casual, artistic | Medium-long hair, naturally falling |

---

## V. Clothing Constraints (L3+L4)

### Female Clothing Matrix

| Style | Garment Type | Applicable | Prompt |
|---|---|---|---|
| Urban Commute | Shirt/blazer/skirt | Work, daily | Commute clothing, urban professional wear |
| Casual Everyday | T-shirt/jeans/hoodie | Daily, casual | Casual clothing, comfortable outfit |
| Evening Gown | Dress/formal gown | Banquet, date | Evening gown, elegant dress |
| Sportswear | Tracksuit/sports vest | Sports, fitness | Sportswear, energetic outfit |
| Formal Attire | Haute couture dress | Formal occasions | Formal attire, luxurious dress |

### Female Clothing General Constraints

| Item | Constraint | Prompt |
|---|---|---|
| Main Color | Warm tones primarily, urban feel | Warm-toned clothing, urban color palette |
| Material | Real material feel + cel-shaded render | Clear clothing texture, cel-shaded material |
| Texture | Clear texture but not overly realistic | Clear clothing texture, cartoon material quality |
| Shoulders | Natural shoulders, moderate decoration | Natural shoulders, moderate decoration |
| Layers | Moderate layering, not overly complex | Moderate layers, clean and distinct |

### Male Clothing Matrix

| Style | Garment Type | Applicable | Prompt |
|---|---|---|---|
| Urban Casual | Shirt/jeans/casual jacket | Daily, casual | Casual clothing, urban style |
| Business Formal | Suit/shirt/tie | Work, formal | Business formal, professional styling |
| Sportswear | Tracksuit/sportswear | Sports, fitness | Sportswear, energetic outfit |
| Daily Casual | T-shirt/jeans/hoodie | Casual, private | Daily casual, comfortable outfit |
| Formal Attire | Haute couture suit/formal wear | Formal occasions | Formal attire, luxurious styling |

---

## VI. Accessory Constraints (L5)

### Female Accessories

| Type | Constraint | Prompt |
|---|---|---|
| Headwear | Modern urban style, not thin | Modern hair accessories, refined headwear |
| Earrings | Delicate studs/dangling earrings | Delicate earrings, urban style |
| Necklace | Delicate necklace/choker | Delicate necklace, simple design |
| Belt | Simple belt/decorative belt | Simple belt, urban accessory |
| Handwear | Delicate bracelet/watch | Delicate watch, urban accessory |

### Male Accessories

| Type | Constraint | Prompt |
|---|---|---|
| Glasses | Modern glasses/sunglasses | Modern glasses, fashionable accessory |
| Belt | Simple belt/leather belt | Simple belt, urban style |
| Watch | Delicate watch/sports watch | Delicate watch, urban accessory |
| Bag | Urban backpack/briefcase | Urban backpack, practical accessory |
| Keychain | Simple keychain | Simple keychain, urban detail |

---

## VII. Costume Combination Quick Reference

| Scene | Makeup | Hairstyle | Clothing | Accessories |
|---|---|---|---|---|
| Daily Commute | Elegant Bare Makeup | Half-up/Ponytail | Urban Commute Wear | Simple |
| Casual Date | Soft Peach Makeup | Half-up/Loose | Casual Everyday Wear | Moderate |
| Business Meeting | Cold Glamour Makeup | Half-up/Tied-up | Business Formal | Delicate |
| Sports/Fitness | Light Makeup | Ponytail/Tied-up | Sportswear | Minimal |
| Formal Dinner | Luxurious Evening Makeup | Bun/Half-up | Evening Gown | Maximal |
| Weekend Shopping | Light Makeup | Loose/Half-up | Casual Everyday Wear | Moderate |
| Sports Competition | Light Makeup | Ponytail/Tied-up | Sportswear | Minimal |

---

> **🔍 Uncovered Scene Inference Rules**
>
> When the user-described scene/situation is not in the above table, infer according to this style's core genes:
>
> | Inference Dimension | 3D Anime Render Urban Gene |
> |---|---|
> | Makeup Intensity | Default elegant bare makeup; formal/business→cold glamour; sweet/date→soft peach; weak/injured→sickly pear; dinner/dressed up→luxurious evening |
> | Hairstyle | Daily/commute→half-up or ponytail; casual/date→natural loose; formal→bun; sports→high ponytail; double ponytails for youthful lively scenes |
> | Clothing | Full urban scene coverage; occasion formality determines clothing refinement (commute<daily<date<dinner); 3D cel-shaded material always maintained |
> | Accessory Complexity | Sports→minimal; daily/commute→simple; date→moderate delicate; formal dinner→maximal |
> | Quality Baseline | Cel-shaded render + soft light and shadow always locked; prohibit sliding to realistic photography or flat 2D quality |

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
| Background | Clean neutral gray #E8E8E8 |
| Stance | Natural standing, feet parallel slightly apart, arms naturally at sides or slightly extended (**no posture changes**) |
| Expression | Micro-expression fitting makeup style (e.g., elegant bare makeup→calm, peach makeup→smiling), facial micro-expression only, no limb movements |
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
| Prohibited Props | **No prop interaction**, do not output umbrellas/phones/computers/coffee or other handheld or interactive items (props belong to prop asset category) |
| Prohibited Posture Changes | **Do not change base model posture**, do not output walking/turning/waving/sideways/running or any body or posture changes, maintain natural standing |
| Format | Directly output usable prompt code block, no headers, tables, explanations, or plan comparisons |

### Complete Costume Layering (Four View)

```
Using the character base image as base, img2img overlay costume and styling,
3D animation render, cinematic lighting, vibrant cel-shaded texture, high-detail materials, joyful healing atmosphere, cartoon urban style, high-detail cartoon materials, moderate cartoon proportions, warm color palette, 8K ultra HD, cinematic composition, soft light and shadow layers, bright cartoon render style, warm and healing, {gender} character four-view design sheet,
anime style, cel-shaded, 3D animation render, film lighting,
character design sheet, character turnaround,
Keep base image face unchanged, {overall temperament},
[L1·Makeup] Decide based on user cues: {base makeup/light makeup/formal makeup}; use {makeup style}, cel-shaded skin, {brow makeup}, {eye makeup}, {lip makeup},
[L2·Hairstyle] {style type}, smooth hair rendering, {hair accessory description},
[L3+L4·Clothing] {main color}{garment type}, {material}, {decorative technique}, clear clothing texture, cel-shaded material,
[L5·Accessories] {headwear}, {earrings}, {necklace}, {belt},
Same image left to right side by side: portrait closeup + front view + side view + back view,
Natural standing, clean neutral gray background, even soft light, no hard shadows,
Four-view consistency, delicate face rendering, delicate hair rendering, clear texture details,
Cel-shaded render style, soft light and shadow, moderate cartoon proportions, realistic material combination,
8K ultra HD, cinematic composition,
No text in the image
```

---

## X. Constraint Rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Face after layering must be consistent with base model |
| R2 | Clothing must use "clear clothing texture + cel-shaded material" |
| R3 | Female accessories must be "modern urban style + exquisite craftsmanship" |
| R4 | Makeup/hairstyle/clothing/accessories style unified |
| R5 | Must output four-view design sheet (portrait closeup + front view + side view + back view) |
| R6 | Must specify "clean neutral gray background" |
| R7 | Must specify "four-view consistency" |
| R8 | **Only output prompt text** — prohibit outputting quick reference tables/layered plans/visual constraints/prohibited items/derivative plans/output suggestions or any non-prompt content |
| R9 | **Prohibit including scene descriptions** — character derivative assets do not involve scenes/environments/weather/background narrative, scenes are independent asset type |
| R10 | **Prohibit prop interaction** — no handheld/interactive items (umbrella/phone/computer etc.), props are independent asset type |
| R11 | **Posture must remain unchanged** — must maintain base model natural standing posture, prohibit any action/body/pose changes |
| R12 | **L1 must analyze before deciding** — first parse user facial cues, then determine base makeup/light makeup/formal makeup |
| R13 | **All derivative assets require makeup** — normally do not stay bare-faced, at least use base makeup |
| R14 | **Makeup intensity controlled** — even with makeup, must be restrained, no modern heavy makeup/exaggerated colorful makeup effects |
| R15 | **Props/scenes/actions not basis for intensity upgrade** — prop, environment, or action information alone cannot elevate base makeup to stronger makeup |
| R16 | Must include 3D animation render keywords (cel-shaded, 3D animation render, anime style) |
| R17 | Must include 8K ultra HD, cinematic composition keywords |
| R18 | Must include cinematic lighting keywords (film lighting) |

### Prohibited

| No. | Prohibited |
|---|---|
| X1 | Facial shift after layering |
| X2 | Accessories too simple/modern (female) |
| X3 | Makeup/clothing styles conflicting |
| X4 | Complex scene background (must be pure gray) |
| X5 | Inconsistent costume/styling across four views |
| X6 | Outputting any content beyond prompt text (tables/plans/suggestions/explanations/variants etc.) |
| X7 | Adding scene descriptions to character derivative assets (mountain paths/rain scenes/indoor/streets/weather and other environmental elements) |
| X8 | Outputting "Key Elements Quick Reference" "Layered Construction Plan" "Visual Constraints" "Prohibited Items" "Derivative Plans" and similar sections |
| X9 | Adding any prop interaction (handheld phone/computer/coffee/bag etc.) |
| X10 | Changing base model posture (walking/turning/waving/sideways/running/bowing/looking up etc.) |
| X11 | Adding expression-posture linkage descriptions (e.g., "walking 45° sideways with slight smile" narrative descriptions) |
| X12 | Applying fixed makeup without analyzing user cues |
| X13 | Incorrectly staying bare-faced, causing derivative assets to lack proper makeup |
| X14 | Mistakingly upgrading makeup only because of prop/scene/action words, causing wrong makeup intensity decision |
| X15 | Using realistic photography terms (e.g., real photography, photorealistic, RAW photo etc.) |
| X16 | Cel-shaded texture over or underdone, must maintain moderation |
