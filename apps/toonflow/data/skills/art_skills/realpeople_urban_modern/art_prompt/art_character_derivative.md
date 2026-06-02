# Character Derivative Asset Generation · Urban Realistic Constraint Manual

---

## I. Overlay Principles

1. **Face Unchanged** — After overlay, facial features must be fully consistent with base model, forbid face shift
2. **Posture Unchanged** — Maintain base model natural standing posture, forbid any posture/movement/body change
3. **Layer-by-Layer Controllable** — Each layer independently described,for easy layer replacement (change clothes without changing makeup)
4. **Style Unified** — All styling elements follow the same aesthetic system
5. **Quality Not Degraded** — After overlay, quality standard not lower than base model
6. **Pure Styling Scope** — Only overlay makeup/hairstyle/clothing/accessories, forbid introducing props, scenes, environments, actions

---

## II. Overlay Layers

| Layer | Content | Description |
|---|---|---|
| L0 | Base model | Base image, no modification |
| L1 | Makeup (Decision Layer) | First analyze user cues, then decide intensity of "base makeup / light makeup / formal makeup" |
| L2 | Hairstyling | Hairstyle design + hair accessories |
| L3 | Inner layer | Replace white base inner garment |
| L4 | Outer layer | T-shirt/shirt/suit/jacket/dress etc. |
| L5 | Accessories | Watch/glasses/earrings/necklace/belt/bracelet |

> **Scope Boundary**: Character derivative assets include only L0–L5 layers (styling/makeup/costume), excluding props (phone/keys/bag/pen etc. handheld items), scene environments (indoor/outdoor/weather etc.), posture actions (walking/turning/raising hand etc.). These belong to other asset type categories.

---

## III. Makeup Constraints (L1)

### Base Model to Derivative Makeup Strategy (Key)

> Although the character base model is in natural state, derivative assets default to entering makeup process. The system should analyze makeup needs based on user-provided cues and decide intensity among base makeup, light makeup, and formal makeup.

### L1 Cue Analysis and Makeup Decision

| Step | Processing Content | Decision Result |
|---|---|---|
| S1 | Extract user cues: facial state words, emotion words, intensity words | Form makeup requirement summary |
| S2 | Filter non-makeup cues: prop/scene/action/posture words not used as makeup basis | Prevent misjudgment |
| S3 | Match makeup style matrix and give intensity level | Base makeup / Light makeup / Formal makeup |
| S4 | Generate final L1 prompt | Only output conclusion, not analysis process |

### Cue to Makeup Mapping (Execution Standard)

| Cue Type | Typical Cues | L1 Decision |
|---|---|---|
| No clear facial emphasis cues | Only clothing/hairstyle changes, no emotion/state emphasis | Base makeup |
| Mild facial cues | Brightened complexion, energetic, natural smile | Light makeup (very light) |
| Clear workplace cues | Formal meeting, business occasion, important event | Formal makeup (controlled) |
| Clear casual cues | Daily outing, casual date, weekend activity | Light makeup / base makeup |

### Female Makeup Style Matrix

| Style | Applicable Scenes | Core Prompt |
|---|---|---|
| Bare makeup | Daily, commute, casual | Bare makeup, natural base, translucent |
| Workplace makeup | Meeting, business, formal |delicate professional makeup, capable |
| Date makeup | Date, dinner, party |delicate makeup, rosy complexion |
| Party makeup | Party, performance, event |delicate makeup, presence |

### Universal Base Skin (All Makeup Shared)

| Item | Constraint | Prompt |
|---|---|---|
| Texture | Natural skin, retaining texture | Natural skin, retaining texture |
| Whiteness | Natural skin tone, not overly fair | Natural skin tone, healthy complexion |
| Inner glow | Natural luster | Healthy skin luster |
| Prohibited | Excessive smoothing/mask-like/plastic feel | — |

### Base Makeup Detail (Default Level)

| Item | Constraint | Prompt |
|---|---|---|
| Base | Light translucent, natural luster | Light base, natural luster |
| Brows | Lightly groom following base model brow shape | Natural brow grooming, clean brow shape |
| Eyes | Very light eye decoration, emphasizing translucency | Clear eyes, very light eyeliner |
| Cheeks | Very light complexion brightening | Natural cheek color |
| Lips | Natural lip color or light pink tint | Natural moist lip color |
| Overall | Visible makeup but very light feel | Base makeup, natural look makeup feel |

### Male Makeup

| Item | Constraint | Prompt |
|---|---|---|
| Base skin | Natural skin, fresh clean | Natural skin, fresh clean |
| Principle | Natural look — appears makeup-free but excellent skin | Natural look, naturally good skin |
| Brows | Natural brow shape, no eyebrow drawing | Natural brow shape |
| Lip color | Natural blood color, slightly moist | Natural lip color |

---

## IV. Hairstyling Constraints (L2)

### Female Styling Types

| Style | Description | Applicable | Prompt |
|---|---|---|---|
| Natural long hair | Long hair naturally falling | Daily, casual | Natural long hair, long hair over shoulders |
| Ponytail | High ponytail/low ponytail/half-ponytail | Sports, commute | High ponytail, capable ponytail |
| Updo | Bun/updo | Formal, dinner | Elegant updo, low bun |
| Short hair | Shoulder-length/chin-length short | Fashionable, capable | Shoulder-length short, chin-length hairstyle |
| Waves | Natural waves/large curls | Date, party | Natural curly hair, wavy hairstyle |
| Half-up | Half tied half down, simple accessories | Daily, commute | Half-up, half loose |

### Female Hair Accessories

| Item | Constraint | Prompt |
|---|---|---|
| Style | Simple modern, matching outfit | Simple hair accessories, modern hair accessories |
| Material | Metal/leather/acrylic | Metal hair clip, leather hairband |
| Craft |delicate craft,clear detail |delicate hair accessories,clear detail |

### Male Styling Types

| Style | Applicable | Prompt |
|---|---|---|
| Short hair | Daily, business, casual | Short hair, fresh short |
| Mid-length hair | Casual, artistic | Mid-length hair, shoulder-length hair |
| Side-part style | Business, formal | Side-part style, business hairstyle |
| Wavy style | Casual, fashionable | Wavy hairstyle, trendy hairstyle |

---

## V. Clothing Constraints (L3+L4)

### Female Clothing Matrix

| Style | Form | Applicable | Prompt |
|---|---|---|---|
| Business formal | Suit/shirt/skirt | Workplace, meeting | Professional suit, business formal |
| Casual fashion | T-shirt/jeans/casual pants | Daily, casual | Casual outfit, fashionable daily |
| Date outfit | Dress/shirt/skirt | Date, party | Dress, date outfit |
| Sport casual | Sportswear/hoodie/yoga pants | Sports, casual | Sportswear, casual sports |
| Dinner gown | Gown/evening wear | Dinner, event | Evening gown, elegant gown |

### Female Clothing Universal Constraints

| Item | Constraint | Prompt |
|---|---|---|
| Main color | Match scene, natural colors | Natural colors, harmonious tones |
| Material | Real fabric textureclear | Clear fabric texture |
| Texture | Texture must be ultra-clear | Clear clothing texture, ultra-clear texture |
| Layers | Clear layering, not excessive | Clear layers, natural matching |

### Male Clothing Matrix

| Style | Applicable | Prompt |
|---|---|---|
| Business formal | Workplace, meeting | Business suit, formal wear |
| Casual fashion | Daily, casual | Casual outfit, fashionable daily |
| Sport casual | Sports, casual | Sportswear, casual sports |
| Simple daily | Daily, commute | Simple outfit, daily casual |

---

## VI. Accessories Constraints (L5)

### Female Accessories

| Type | Constraint | Prompt |
|---|---|---|
| Jewelry | Simpledelicate, not excessive | Simple earrings,delicate necklace |
| Watch | Simple/fashionable, matching style | Simple watch, fashionable wristwatch |
| Glasses | Plain/decoration frames, clean | Glasses,clear frame |
| Belt | Simple/fashionable, matching outfit | Belt, waist cincher |

### Male Accessories

| Type | Constraint | Prompt |
|---|---|---|
| Watch | Simple/business, matching style | Simple watch, business wristwatch |
| Glasses | Plain/decoration frames, clean | Glasses,clear frame |
| Belt | Simple/fashionable, matching outfit | Belt, leather belt |
| Accessories | Simpledelicate, not excessive | Simple accessories,delicate detail |

---

## VII. Styling Combination Quick Reference

| Scene | Makeup | Hairstyle | Clothing | Accessories |
|---|---|---|---|---|
| Daily commute | Bare makeup | Natural long/ponytail | Business formal/casual fashion | Watch/simple |
| Business meeting | Workplace makeup | Updo/ponytail | Business formal | Watch/simple jewelry |
| Weekend casual | Light makeup | Natural long | Casual fashion/sport casual | Simple |
| Date party | Date makeup | Waves/updo | Date outfit |delicate jewelry |
| Dinner event | Formal makeup | Elegant updo/waves | Dinner gown |delicate jewelry |
| Sports fitness | Bare makeup | High ponytail/bun | Sport casual | Simple |

---

> **🔍 Uncovered Scene Inference Rules**
>
> When user-described scenes/situations are not in the above table, infer based on this style's core genes:
>
> | Inference Dimension | Realistic Urban Genes |
> |---|---|
> | Makeup intensity | Default bare makeup (natural skin); business/formal→workplace makeup (capabledelicate); date/party→date makeup (rosy complexion); party/performance→party makeup; sports/outdoor→bare or light makeup |
> | Hairstyle | Commute/workplace→ponytail or half-up; casual/date→natural long or waves; sports→high ponytail or bun; formal→elegant updo; fashion occasion→short hair |
> | Clothing | Occasion determines refinement; workplace→business formal; casual→daily fashion; date→dress/skirt; sports→sport casual; dinner→gown; real fabric texture always maintained |
> | Accessory density | Sports→simple or none; daily→watch+simple; date→delicate jewelry; dinner→delicate full set |
> | Texture baseline | Real-person realistic photography anchored; natural skin texture + hair strand details always maintained; prohibit excessive smoothing/plastic feel/3D rendering |

## VIII. Four-View Design Sheet Specifications

### View Definitions

| Position | View | Angle | Shot Size | Requirement | Prompt |
|---|---|---|---|---|---|
| Left 1 | Portrait closeup | Front eye level | Face to collarbone | Face 60%+, facial features/makeupclear | portrait closeup, face detail, makeup detail |
| Left 2 | Front view | Front 0° | Full body standing | Facing camera, full front view of clothing | front view, height mark |
| Right 2 | Side view | Right 90° | Full body standing | Pure side profile, clothing side layers | side view, profile, height mark |
| Right 1 | Back view | Back 180° | Full body standing | Back of head hairstyle/back clothingclear | back view, rear view, height mark |

### Frame Specifications

| Item | Constraint |
|---|---|
| Layout | Same frame left to right side-by-side four views |
| Background | Pure neutral gray #E8E8E8 |
| Stance | Natural standing, feet parallel slightly apart, arms naturally hanging |
| Expression | Micro-expression matching makeup style, limited to facial micro-expression |
| Lighting | Even soft light, front main light + bilateral fill, no hard shadows |
| Consistency | Four views' face/makeup/hairstyle/clothing/accessories fully identical |
| Aspect ratio | Recommend 4:1 or 3:1 |

---

## IX. Prompt Template

### Output Format Constraints

| Item | Constraint |
|---|---|
| Output content | **Only output prompt text**, no other content |
| Prohibited output | Quick reference tables, layer construction plans, visual constraint tables, prohibited items tables, derivative plans, output suggestions, core elements tables and all non-prompt content |
| Prohibited scenes | Character derivative assets **do not include scene/environment descriptions**, do not output any scene/environment/weather/background narrative content |
| Prohibited props | **Do not include any prop interaction**, do not output phone/keys/bag/pen/glass etc. handheld or interactive items |
| Prohibited posture changes | **Do not change base model posture**, do not output walking/turning/raising hand/side-turning/running etc. any action |
| Format | Directly output usable prompt code block, no titles, tables, explanations, scheme comparisons needed |

### Complete Styling Overlay (Four Views)

```
Take the character's basic image as base map, img2img overlay styling makeup,
Urban {male/female} character four-view design sheet, real-person realistic photography, urban realistic documentary, strong contrast, ultimate detail, 8K, ultra-fidelity
character design sheet, character turnaround,
Maintain base image face unchanged, {overall temperament},
[L1·Makeup] Decide based on user cues: {base makeup/light makeup/formal makeup}; use {makeup style}, natural skin, {brow makeup}, {eye makeup}, {lip makeup},
[L2·Hairstyle] {styling type}, hair strands distinctly visible, {hair accessory description},
[L3+L4·Clothing] {main color}{style}, {material}, {craftsmanship}, clear clothing texture, ultra-clear texture,
[L5·Accessories] {headwear}, {earrings}, {necklace}, {watch},
Same frame left to right side-by-side: portrait closeup + front view + side view + back view,
Natural standing, pure neutral gray background, even soft light, no hard shadows,
Four-view consistency, delicate face rendering, delicate hair rendering, ultra-clear texture detail
No text in the image
```


---

## X. Constraint Rules

### Mandatory

| # | Rule |
|---|---|
| R1 | After overlay, face must be consistent with base model |
| R2 | Clothing must use "clear clothing texture + ultra-clear texture" |
| R3 | Makeup/hairstyle/clothing/accessories style unified |
| R4 | Must output four-view design sheet (portrait closeup + front view + side view + back view) |
| R5 | Must specify "pure neutral gray background" |
| R6 | Must specify "four-view consistency" |
| R7 | **Only output prompt** — prohibit outputting quick reference tables/layer solutions/visual constraints/prohibited items/derivative plans/output suggestions etc. any non-prompt content |
| R8 | **Prohibit including scene descriptions** — character derivative assets do not involve scene/environment/weather/background narrative |
| R9 | **Prohibit prop interaction** — do not include any handheld/interactive items (phone/bag/keys/pen etc.) |
| R10 | **Posture unchanged** — must maintain base model natural standing posture |
| R11 | **L1 must analyze then decide first** — first parse user facial cues, then determine base makeup/light makeup/formal makeup |
| R12 | **All derivative assets require makeup** — normally do not remain bare-faced, at least use base makeup |

### Strictly Prohibited

| # | Strictly Prohibited |
|---|---|
| X1 | Face shift after overlay |
| X2 | Makeup too exaggerated/modern heavy makeup |
| X3 | Makeup/clothing styles conflicting |
| X4 | Complex scene background (must be pure gray) |
| X5 | Styling inconsistent between four views |
| X6 | Output any content other than prompt (tables/schemes/suggestions/explanations/variants etc.) |
| X7 | Include scene descriptions in character derivative assets (indoor/outdoor/street/weather etc.) |
| X8 | Output chapters like "Core Elements Quick Reference", "Layer Construction Plan", "Visual Constraints", "Prohibited Items", "Derivative Plans" |
| X9 | Include any prop interaction (phone/bag/keys/pen/glass etc. handheld items) |
| X10 | Change base model posture (walking/turning/raising hand/side-turning/running/bowing etc. action descriptions) |
| X11 | Include expression and posture linked descriptions (such as "side 45° walking with slight lip curve" etc. narrative descriptions) |
| X12 | Apply fixed makeup directly without analyzing user cues |
| X13 | Incorrectly remain makeup-free, causing derivative assets to lack required makeup |

