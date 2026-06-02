# Anime Character Derivative Asset Generation · Constraint Manual

---

## I. Overlay Principles

1. **Face Unchanged** — Facial features after overlay must be identical to base model, no facial drift
2. **Pose Unchanged** — Maintain base model's natural standing pose, no pose/action/posture changes
3. **Layer-by-Layer Control** — Each layer independently described for easy layer replacement (change clothes without changing makeup)
4. **Style Uniformity** — All costume elements follow the same aesthetic system
5. **Texture Not Degraded** — Texture standard after overlay not lower than base model
6. **Pure Costume Scope** — Only overlay makeup/hairstyle/clothing/accessories/footwear; prohibit introducing props, scenes, environments, actions

---

## II. Overlay Layers

| Layer | Content | Description |
|---|---|---|
| L0 | Base Model | Base character model, no modification |
| L1 | Makeup (Decision Layer) | Analyze user clues first, then decide intensity: "basic makeup / light makeup / formal makeup" |
| L2 | Hairstyle | Bun/updo/braid + hair accessories |
| L3 | Undergarment/Inner Layer | Replace white base undergarment |
| L4 | Outerwear/Main Garment | Modern urban differentiated clothing (shirt/jacket/dress/suit, etc.) |
| L5 | Accessories | Jewelry/watch/glasses/bags, etc. |
| L6 | Footwear | High heels/short boots/loafers/sneakers, etc., complete coordination with overall outfit |

> **Scope Boundary**: Character derivative assets only include L0–L6 layers (costume and makeup), not including props (phone/book/umbrella/coffee cup, etc.), scene environments (indoor/outdoor/weather, etc.), or pose actions (walking/turning/raising hand, etc.). These belong to other asset type scopes.

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
| Mild facial clues | Soft, smiling, slight lash flutter, slightly enhanced complexion | Light makeup (very light) |
| Clear illness/frailty clues | Pale complexion, very light lip color, slightly red under eyes | Sickly pear makeup (light makeup) |
| Clear formal ceremony clues | Formal attire, ceremony, formal occasion | Formal makeup (controlled) |

> Judging Principle: All derivative assets require makeup; first look at facial clues to determine intensity and style; props, scenes, and pose changes alone cannot raise makeup intensity.

### Female Makeup Style Matrix

| Style | Applicable Scene | Core Prompt Keywords |
|---|---|---|
| Elegant Plain Makeup | Daily, first meeting, workplace | Elegant makeup, lightly brushed brows, plain makeup clear face |
| Cold Frost Makeup | Formal, confrontation, business | Cold elegant makeup, sharp brows and eyes, thin lips cold |
| Soft Peach Makeup | Sweet romance, flirtation, date | Peach makeup, slightly red at outer eye, moist lip color |
| Sickly Pear Makeup | Injured, weak | Pale complexion, very light lip color, slightly red under eyes |
| Luxurious Evening Makeup | Party, banquet | Heavy makeup magnificent, vermilion lips bright eyes |

### General Base Skin (Shared by All Makeup)

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Texture | Cel shading texture, smooth delicate | Cel shading skin texture, smooth skin |
| Fairness | Cool fair skin, translucent not pallid | Cool fair skin, fair complexion |
| Inner Glow | Soft glow from within | Inner glow feel, translucent skin |
| Prohibited | Matte/dead white/waxy/oily/overexposed | — |

### Basic Makeup Detail (Default Level)

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Eyebrows | Lightly groomed along base model's brow shape, no change to brow type | Natural brow grooming, clean brow shape |
| Eyes | Very light eye embellishment, emphasizing clarity and brightness | Eyes clear translucent, very light inner eyeliner |
| Cheeks | Very light complexion brightening, no obvious color stacking | Natural cheek complexion, slight complexion lift |
| Lips | Nude pink or light pink coloring, restrained | Natural moist lip color, light pink lip color |
| Overall | Noticeable makeup exists, but very light makeup feel | Basic makeup, no-makeup makeup feel, natural |

### Male Makeup

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Base Skin | Cel shading texture, fresh natural | Cel shading skin texture, fresh skin |
| Principle | No-makeup makeup — looks like no makeup but skin is excellent | No-makeup makeup, naturally good skin |
| Eyebrows | Natural thick eyebrows, no drawn brows | Natural brow shape, heroic brow shape |
| Lip Color | Natural blood color, slightly moist | Natural lip color, blood color feel |

---

## IV. Hairstyle Constraints (L2)

### Female Style Types

| Style | Description | Applicable | Prompt Keywords |
|---|---|---|---|
| Natural Loose Hair | Long hair naturally falling | Daily, workplace | Natural loose hair, smooth long hair |
| Half-Up Hair | Top half tied, bottom half loose | Daily, commute | Half-up hair, half tied |
| Ponytail | High ponytail/low ponytail | Sports, casual | High ponytail, low ponytail |
| Updo | Elegant updo | Formal occasion | Elegant updo, updo |
| Twin Tails | Youthful twin tails | Lively scene | Twin tails, youthful hairstyle |
| Fully Tied Hair | Bun/messy bun | Home, casual | Messy bun, hair bun |

### Female Hair Accessories

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Style | Simple refined, matching attire | Simple hair accessories, refined hair clips |
| Material | Metal/pearlescent/fabric | Metal hair clips, pearlescent hair accessories |
| Craftsmanship | Refined craftsmanship, clear details | Fine craftsmanship, clear details |

### Male Style Types

| Style | Applicable | Prompt Keywords |
|---|---|---|
| Side Part Short Hair | Daily, business | Side part short hair, business hairstyle |
| Messy Medium Hair | Casual, artistic | Messy medium hair, artistic hairstyle |
| Neat Short Hair | Sports, neat | Neat short hair, fresh hairstyle |
| Medium-Long Hair | Formal, artistic | Medium-long hair, artistic hairstyle |

---

## V. Clothing Constraints (L3+L4)

### Female Clothing Matrix

| Style | Type | Applicable | Prompt Keywords |
|---|---|---|---|
| Business Formal | Suit skirt set/shirt + dress pants | Workplace, formal | Business formal, professional suit |
| Casual Daily | T-shirt + jeans/dress | Daily, casual | Casual wear, daily clothing |
| Date Outfit | Dress/skirt | Date, dating occasion | Date outfit, pretty dress |
| Sporty Casual | Sportswear/hoodie/sweatpants | Sports, casual | Sportswear, casual sports |
| Evening Gown | Formal evening gown | Party, banquet | Evening gown, formal dress |

### Differentiated Dressing Principles

| Item | Constraint | Description |
|---|---|---|
| Character Distinction | Determine dressing refinement and cuts based on age, occupation, personality, financial status | Prohibit all characters same style same color same matching |
| Same Style Differentiation | Even for same workplace wear, differentiate skirt/pants/jacket style/inner layering | Maintain unified aesthetics, no uniform treatment |
| Scene Adaptation | Switch clothing plans for commute, date, home, banquet | Clothing should change with situation |

### Female Clothing General Constraints

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Main Color | Soft color palette primarily, low saturation, but different characters need their own color focus | Soft tones, low-saturation colors, character-specific color scheme |
| Material | Modern fabric texture, clear texture | Modern fabric, clear texture |
| Texture | Clear clothing fabric texture | Clear clothing texture, fabric texture |
| Layers | Clear clothing layers, proper matching, no cookie-cutter templated dressing | Clear clothing layers, proper coordination |

### Male Clothing Matrix

| Style | Applicable | Prompt Keywords |
|---|---|---|
| Business Formal | Shirt/suit/casual blazer | Business formal, suit set |
| Casual Daily | Casual shirt/T-shirt + casual pants | Casual wear, daily clothing |
| Sporty Casual | Sportswear/hoodie/sweatpants | Sportswear, casual sports |
| Formal Attire | Formal dress, suit | Formal attire, suit dress |
| Home Casual | Homewear, casual wear | Homewear, casual clothing |

### Footwear Design (L6)

| Category | Applicable | Prompt Keywords |
|---|---|---|
| Female Commuter Shoes | Workplace, formal | Pointed high heels, kitten heels, loafers, delicate leather |
| Female Daily Shoes | Casual, date | Open-toe flats, short boots, white sneakers, refined shoe shape |
| Male Commuter Shoes | Business, formal | Leather shoes, derby shoes, loafers, clean crisp shoe surface |
| Unisex Casual Shoes | Daily, sports | Sneakers, canvas shoes, simple casual shoes, matching clothing |

> Footwear must clearly specify style, material, and color scheme, and be consistent with clothing style; prohibit omitting foot design or defaulting all characters to wear the same shoe.

---

## VI. Accessories Constraints (L5)

### Female Accessories

| Type | Constraint | Prompt Keywords |
|---|---|---|
| Jewelry | Simple refined, not overly exaggerated | Simple jewelry, refined earrings |
| Watch | Refined watch, stylish wristwatch | Stylish watch, refined wristwatch |
| Bag | Shoulder bag/handbag, clear texture | Handbag, textured bag |
| Glasses | Stylish glasses/sunglasses (optional) | Stylish glasses, refined sunglasses |
| Belt | Refined belt, clear details | Refined belt, stylish belt |

### Male Accessories

| Type | Constraint | Prompt Keywords |
|---|---|---|
| Watch | Stylish watch, clear texture | Stylish watch, refined wristwatch |
| Glasses | Stylish glasses/sunglasses (optional) | Stylish glasses, refined sunglasses |
| Belt | Refined belt, clear details | Refined belt, stylish belt |
| Tie | Tie/bow tie (formal occasions) | Stylish tie, refined bow tie |

---

## VII. Costume Combination Quick Reference

| Scene | Makeup | Hairstyle | Clothing | Accessories | Footwear |
|---|---|---|---|---|---|
| Workplace Commute | Elegant plain makeup | Half-up/updo | Business formal (can differentiate suit skirt/dress pants/trench layering) | Simple jewelry/watch | High heels/loafers/leather shoes |
| First Date | Soft peach makeup | Natural loose hair | Date outfit (dress/knit set/skirt) | Refined jewelry/bag | Flats/short boots |
| Daily Casual | Basic makeup | Ponytail/natural loose hair | Casual daily (T-shirt jeans/shirt layering/hoodie) | Simple accessories | White sneakers/canvas shoes |
| Formal Occasion | Cold frost makeup | Updo/half-up | Business formal/evening gown | Refined jewelry/watch | High heels/dress shoes/leather shoes |
| Sporty Casual | Basic makeup (very light) | High ponytail/neat short hair | Sporty casual | Sports watch/sports accessories | Sneakers |
| Party Gathering | Formal makeup | Elegant updo/loose hair | Evening gown/fashion wear | Refined jewelry/refined accessories | Stiletto heels/short boots/dress shoes |
| Home Casual | Makeup-free/basic makeup | Messy bun/natural loose hair | Home casual wear | None or few accessories | Soft slippers/simple home shoes |

---

> **🔍 Uncovered Scene Inference Rules**
>
> When the user-described scene/situation is not in the above table, infer based on this style's core genes:
>
> | Inference Dimension | Anime Urban Romance Genes |
> |---|---|
> | Makeup Intensity | Default elegant plain makeup; tension/confrontation/authority words→cold frost makeup; sweet romance/flirtation/heart-fluttering→soft peach makeup; weak/injured→sickly pear makeup; evening/party→luxurious evening makeup |
> | Hairstyle | Workplace/commute→half-up or updo; daily/romance→natural loose hair; sports/action→high ponytail; formal occasion→elegant updo |
> | Clothing | Modern urban scene priority; higher emotional intensity→higher clothing refinement; tension scene→business formal/cool colors |
> | Accessory Density | Daily→simple; date→refined jewelry + bag; formal/evening→refined jewelry + watch; sports→simple or none |
> | Color Tendency | Cool fair skin + low-saturation urban color scheme; romantic scene→warm pink tones; confrontation/tension→cool gray + black-white contrast |

## VIII. Four-View Character Sheet Specifications

> After derivative costume overlay, still need to output four-view character sheet to ensure costume and makeup consistency across all angles.

### View Definitions

| Position | View | Angle | Shot Type | Requirement | Prompt Keywords |
|---|---|---|---|---|---|
| Left 1 | Portrait Close-up | Front, eye level | Face to collarbone | Face 60%+, facial features/makeup clear | `portrait closeup`, `face detail`, `makeup detail` |
| Left 2 | Front View | Front 0° | Full Body | Facing camera, full front of clothing | `front view`, `height mark` |
| Right 2 | Side View | Right 90° | Full Body | Pure side profile, side layers of clothing | `side view`, `profile`, `height mark` |
| Right 1 | Back View | Back 180° | Full Body | Back of head hair accessories/back clothing/hair ends clear | `back view`, `rear view`, `height mark` |

### Image Specifications

| Item | Constraint |
|---|---|
| Layout | Four views side by side left to right in one frame |
| Background | Pure neutral gray `#E8E8E8` |
| Standing Pose | Natural stance, feet parallel slightly apart, arms naturally at sides or slightly extended (**no pose changes allowed**) |
| Expression | Micro-expression matching makeup style (e.g., elegant plain makeup→calm, peach makeup→smiling), limited to facial micro-expressions, no limb movements |
| Lighting | Even soft light, front key light + bilateral fill light, no hard shadows |
| Consistency | Face/makeup/hairstyle/hair accessories/clothing/accessories/footwear completely consistent across four views |
| Aspect Ratio | Recommended 4:1 or 3:1 |

---

## IX. Prompt Template

### Output Format Constraints

| Item | Constraint |
|---|---|
| Output Content | **Output prompt text only**, no other content |
| Prohibited Output | Quick reference tables, layered construction plans, visual constraint tables, prohibited items tables, derivative plans, output suggestions, core element tables, and all non-prompt content |
| Prohibited Scene | Character derivative assets **do not include scene/environment descriptions**, do not output any scene/environment/weather/background narrative content (scenes belong to scene asset scope) |
| Prohibited Props | **No prop interaction**, do not output phones/books/umbrellas/coffee cups or other handheld or interactive items (props belong to prop asset scope) |
| Prohibited Pose Changes | **Do not change base model pose**, do not output walking/turning/raising hand/sideways/running or any action or posture changes, maintain natural standing |
| Format | Directly output usable prompt code block, no need for titles, tables, explanations, plan comparisons |

### Full Costume Overlay (Four-View)

Using the character base image as base image, img2img overlay costume and makeup,
anime {gender} character four-view character sheet, cel shading coloring, modern urban style, high contrast, extreme detail, 8K, ultra fidelity
character design sheet, character turnaround,
keep base face unchanged, {overall temperament},
【L1·Makeup】Decide based on user clues: {basic makeup/light makeup/formal makeup}; use {makeup style}, soft skin glow, {eyebrow makeup}, {eye makeup}, {lip makeup},
【L2·Hairstyle】{style type}, layered hair strands, {hair accessory description},
【L3+L4·Clothing】{main color}{style}, {material}, {decoration craftsmanship}, differentiate matching by character identity and scene, avoid same style same color for all characters, clear clothing texture, ultra-clear texture,
【L5·Accessories】{headwear}, {earrings}, {watch}, {bag},
【L6·Footwear】{shoe type}, {shoe material}, {heel/sole description}, consistent with clothing style,
same frame left to right side by side: portrait close-up + front view + side view + back view,
natural standing, pure neutral gray background, even soft light, no hard shadows,
four-view consistency, delicate facial rendering, delicate hair strand rendering, ultra-clear texture details
no text in the image

---

## X. Constraint Rules

### Mandatory

| Number | Rule |
|---|---|
| R1 | Face after overlay must be consistent with base model |
| R2 | Clothing must use "clear clothing texture + ultra-clear texture" |
| R3 | Female accessories must be "simple refined + clear craftsmanship" |
| R4 | Makeup/hairstyle/clothing/accessories/footwear style unified |
| R5 | Must output four-view character sheet (portrait close-up + front view + side view + back view) |
| R6 | Must specify "pure neutral gray background" |
| R7 | Must specify "four-view consistency" |
| R8 | **Output only the prompt** — no quick reference tables/layered plans/visual constraints/prohibited items/derivative plans/output suggestions or any non-prompt content |
| R9 | **No scene descriptions** — character derivative assets do not involve scenes/environments/weather/background narrative; scenes belong to independent asset type |
| R10 | **No prop interaction** — no handheld/interactive items (phone/book/umbrella/coffee cup, etc.); props belong to independent asset type |
| R11 | **Pose remains unchanged** — must maintain base model's natural standing pose, no action/posture/stance changes |
| R12 | **L1 must analyze first, then decide** — first parse user's facial clues, then determine basic makeup/light makeup/formal makeup |
| R13 | **All derivative assets need makeup** — normal cases do not stay makeup-free, at minimum use basic makeup |
| R14 | **Makeup intensity controlled** — even when applying makeup, must be restrained; no exaggerated colorful makeup effects |
| R15 | **Props/scenes/actions not grounds for intensity upgrade** — prop, environment, or action information alone should not raise basic makeup to stronger makeup |
| R16 | **Must clearly define footwear design** — at least two of shoe type, material, color must be clear; foot coordination cannot be omitted |
| R17 | **Clothing must be differentiated** — change outfit based on character identity, age, personality, scene; prohibit all characters using the same clothing template |

### Prohibited

| Number | Prohibition |
|---|---|
| X1 | Facial drift after overlay |
| X2 | Accessories too simple/exaggerated |
| X3 | Makeup/clothing/footwear styles conflicting with each other |
| X4 | Complex scene backgrounds (must be pure gray background) |
| X5 | Inconsistent costume/makeup across four views |
| X6 | Outputting anything other than the prompt (tables/plans/suggestions/explanations/variants, etc.) |
| X7 | Adding scene descriptions to character derivative assets (modern indoor/outdoor/weather, etc.) |
| X8 | Omitting footwear design, resulting in feet only having default base model or no clear matching |
| X9 | All characters using same style, same color, same cut clothing, lacking character differentiation |
| X10 | Outputting sections like "core element quick reference," "layered construction plan," "visual constraints," "prohibited items," "derivative plan" |
| X11 | Adding any prop interaction (holding phone/book/umbrella/coffee cup, etc.) |
| X12 | Changing base model pose (walking/turning/raising hand/sideways/running/bowing/looking up, etc.) |
| X13 | Adding expression and pose linkage descriptions (e.g., "turning 45° walking, corner of mouth slightly curved") |
| X14 | Not analyzing user clues before directly applying fixed makeup |
| X15 | Incorrectly staying makeup-free, causing derivative assets to lack required makeup |
| X16 | Mistakenly upgrading makeup solely due to prop/scene/action keywords, leading to incorrect makeup intensity decision |
