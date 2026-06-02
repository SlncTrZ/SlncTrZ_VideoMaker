# Character Derivative Asset Generation · Constraint Manual

---

## I. Overlay Principles

1. **Face Unchanged** — After overlay, facial features must be completely consistent with base model; face shifting prohibited
2. **Posture Unchanged** — Maintain base model's natural standing posture; any posture/action/body movement changes prohibited
3. **Layer-by-Layer Controllable** — Each layer independently described,for easy layer replacement (change clothes without changing makeup)
4. **Style Unified** — All styling elements follow the same aesthetic system
5. **Quality Not Degraded** — After overlay, quality standard not lower than base model
6. **Pure Styling Scope** — Only overlay makeup/hairstyle/clothing/accessories; props, scenes, environments, actions prohibited

---

## II. Overlay Layers

| Layer | Content | Description |
|---|---|---|
| L0 | Base Model | Basic image base model, no modification |
| L1 | Makeup (Decision Layer) | First analyze user cues, then decide intensity of "base makeup / light makeup / formal makeup" |
| L2 | Hairstyling | Updo/bun/braid + hair accessories |
| L3 | Inner garment/Base layer | Replace white base inner garment |
| L4 | Outer garment/Main attire | Large-sleeve robe/straight skirt/cape etc. |
| L5 | Accessories | Headwear/earrings/necklace/waist ornaments/hand ornaments |

> **Scope Boundary**: Character derivative assets include only L0–L5 layers (styling/makeup/costume), excluding props (umbrella/sword/fan/book/lantern etc. handheld items), scene environments (indoor/outdoor/weather etc.), posture actions (walking/turning/waving etc.). These belong to other asset type categories.

---

## III. Makeup Constraints (L1)

### Base Model to Derivative Makeup Strategy (Critical)

> Although the character base model is makeup-free, derivative assets default to entering the makeup process. The system should analyze makeup needs based on user-provided cues and decide intensity among base makeup, light makeup, and formal makeup, rather than staying makeup-free.

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
| Mild facial cues | Gentle, smiling, slight eyelash flutter, slightly improved complexion | Light makeup (very light) |
| Clear illness/weakness cues | Pale face, very light lip color, slightly red under eyes | Delicate sick makeup (light) |
| Clear formal ceremony cues | Formal attire, ceremony, luxurious appearance | Formal makeup (controlled) |

> Judgment principles: All derivative assets must have makeup; first check facial cues to determine intensity and style; props, scenes, posture changes must not independently raise makeup intensity.

### Female Makeup Style Matrix

| Style | Applicable Scenes | Core Prompt |
|---|---|---|
| Elegant natural makeup | Daily, first meeting, boudoir | Elegant makeup, lightly brushed brows, natural fresh face |
| Cool frosty makeup | Formal, confrontation, power | Cool makeup, sharp brows and eyes, thin cold lips |
| Soft peach makeup | Sweet romance, ambiguous, heart-fluttering | Peach blossom makeup, slightly reddened eye tail, moist lip color |
| Delicate sick makeup | Injured, weak | Pale face, very light lip color, slightly red under eyes |
| Luxurious phoenix makeup | Grand wedding, formal attire | Rich gorgeous makeup, vermilion lips and phoenix eyes |

### Universal Base Skin (All Makeup Shared)

| Item | Constraint | Prompt |
|---|---|---|
| Texture | Glossy skin, naturally translucent | Glossy skin, cream porcelain skin, luminous skin |
| Whiteness | Cool fair skin, translucent not pale | Milk skin, milky white skin |
| Inner glow | Soft glow from within | Inner glow, translucent luminous skin |
| Prohibited | Matte/dead white/waxy/oily/overexposed | — |

### Base Makeup Detail (Default Level)

| Item | Constraint | Prompt |
|---|---|---|
| Brows | Lightly groom following base model brow shape, do not change brow type | Natural brow grooming, clean brow shape |
| Eyes | Very light eye decoration, emphasizing translucency and brightness | Clear eyes, very light inner eyeliner |
| Cheeks | Very light complexion brightening, notclear piled color | Natural cheek color, subtle complexion boost |
| Lips | Nude pink or light pink coloring, restrained | Natural moist lip color, light pink lip color |
| Overall | Visible makeup but very light feel | Base makeup, natural look makeup feel, natural refined |

### Detailed by Area (Using Elegant Natural Makeup as Example)

| Area | Constraint | Prompt |
|---|---|---|
| Base | Light translucent, glossy subtly luster | Light base, glossy cream skin |
| Brows | Distant mountain brows/willow leaf brows, gray-brown lightly brushed | Distant mountain dark brows, lightly brushed moth brows |
| Eyes | Very light eye shadow, inner eyeliner, long lashes | Clear eye makeup, long lashes |
| Blush | Very light thin powder, lightly brushed on apple cheeks | Very light blush, thin powder |
| Lips | Moist light pink, micro luster | Moist light pink lip color |

### Male Makeup

| Item | Constraint | Prompt |
|---|---|---|
| Base skin | Glossy cream skin, fair translucent, fresh natural | Glossy skin, cream skin, luminous skin |
| Principle | Natural look — appears makeup-free but excellent skin | Natural look, naturally good skin |
| Brows | Natural thick brows, no eyebrow drawing | Natural straight brows, heroic brow shape |
| Lip color | Natural blood color, slightly moist | Natural lip color, blood tone |

---

## IV. Hairstyling Constraints (L2)

### Female Styling Types

| Style | Description | Applicable | Prompt |
|---|---|---|---|
| Half-up cloud bun | Top half tied up + back loose hair | Daily, going out | Half-up cloud bun, black hair half tied |
| Flying immortal bun | High bun flying upward, elegant | Fairy scene, appearance | Flying immortal bun, high bun flying |
| Side sagging bun | Low side bun, languid | Private, ambiguous | Side sagging bun, languid side bun |
| Double loop bun | Double bun symmetrical, girlish | Young character | Double loop bun, girlish double buns |
| Fully loose hair | Long hair fully loose, with simple hair accessory | Injured, downcast | Long hair loose, black hair like waterfall |
| Ponytail tie | High tied capable | Martial arts, action | High tied ponytail, capable neat |

### Female Hair Accessories

| Item | Constraint | Prompt |
|---|---|---|
| Style | Maximalist, matching clothing | Maximalist hair accessories, magnificent delicate |
| Material | Metal + beads and jade + tassels | Gold thread tassels, full of pearls and jade |
| Craft | Master craftsmanship, ultra-fine | Master craftsmanship, finely carved |

### Male Styling Types

| Style | Applicable | Prompt |
|---|---|---|
| Half-crown tied | Daily, literati | Half-crown tied, jade hairpin binding |
| Full crown high tie | Formal, court | Full crown high tie, jade crown binding |
| Loose hair over shoulders | Private, injured | Loose hair over shoulders, long hair like ink |
| Battle ponytail tie | Combat, martial arts | High tied battle hair, neat ponytail |

---

## V. Clothing Constraints (L3+L4)

### Female Clothing Matrix

| Style | Form | Applicable | Prompt |
|---|---|---|---|
| Ethereal flowing attire | Multi-layer large-sleeve robe, Wei-Jin style | Daily, fairy scene | Large-sleeve robe, multi-layer clothing, flowing fabric |
| Dignified formal wear | Curved hem robe/ru skirt | Court, banquet | Curved hem robe, dignified magnificent |
| Light casual wear | Narrow-sleeve ru skirt/short jacket | Action, martial arts | Narrow-sleeve short jacket, light capable |
| Sleepwear | Thin silk inner shirt, plain colored | Indoor, nighttime | Plain colored sleepwear, loose comfortable |
| Grand wedding dress | Phoenix crown and cape, layered red attire | Wedding | Phoenix crown and cape, layered red dress |

### Female Clothing Universal Constraints

| Item | Constraint | Prompt |
|---|---|---|
| Main color | White/moon white/silver gray as default | White delicate clothing, plain clothes like snow |
| Material | Thick flowing + embroidery + pearlescent fabric | Thick flowing fabric, pearlescent embroidery |
| Texture | Texture must be ultra-clear | Clear clothing texture, ultra-clear texture |
| Shoulders | Shoulder ornaments/draped silk/cloud shoulder | Magnificent cloud shoulder, shoulder decoration |
| Layers | Multi-layer layering, clear layers | Multi-layer layering, clear hierarchy |

### Male Clothing Matrix

| Style | Applicable | Prompt |
|---|---|---|
| Literati elegant attire | Daily, study | Wide-sleeve long gown, moon white clothing |
| Warrior combat attire | Combat, training | Narrow-sleeve combat wear, dark colored battle suit |
| Black cape | Appearance, night travel | Ink black cape, fluttering cloak |
| Casual wear | Leisure, private | Plain colored casual wear, simple easy wear |
| Formal court robe | Court, ceremony | Formal court robe, luxurious ceremonial robe |

---

## VI. Accessories Constraints (L5)

### Female Accessories

| Type | Constraint | Prompt |
|---|---|---|
| Headwear | Maximalist, not thin | Maximalist headwear, full of pearls and jade |
| Earrings | Dangling tassels/jade earrings | Tassel earrings, jade ear pendants |
| Necklace | Necklace/collar | Magnificent necklace, delicate collar |
| Waist ornaments | Waist ribbon/jade pendant | Flowing waist ribbon, jade pendant at waist |
| Hand ornaments | Jade bangle/armlet | Translucent jade bangle, delicate armlet |

### Male Accessories

| Type | Constraint | Prompt |
|---|---|---|
| Hair crown | Jade crown/gold crown, delicate | Jade crown hair tie |
| Waistband | Wide waistband/leather belt | Wide waistband, clear texture |
| Jade pendant | Translucent warm | Jade pendant at waist |
| Weapon | Sword/fan/flute (optional) | Long sword at side, folded fan half concealed |

---

## VII. Styling Combination Quick Reference

| Scene | Makeup | Hairstyle | Clothing | Accessories |
|---|---|---|---|---|
| Daily boudoir | Elegant natural makeup | Half-up cloud bun | Ethereal flowing attire | Medium |
| First meeting | Elegant natural makeup | Half-up/flying immortal | Ethereal flowing attire | Medium-to-many |
| Sweet romance interaction | Soft peach makeup | Half-up/side sagging | Ethereal/light | Medium |
| Formal appearance | Cool frosty makeup | Flying immortal bun | Dignified formal wear | Maximum |
| Nighttime intimate talk | Elegant/peach makeup | Fully loose/side sagging | Sleepwear | Minimal |
| Injured downcast | Delicate sick makeup | Fully loose (messy) | Damaged casual wear | Minimal/none |
| Grand wedding ceremony | Luxurious phoenix makeup | Flying immortal bun | Wedding dress | Maximum |
| Martial arts action | Natural makeup (very light) | Ponytail tie | Light casual wear | Simple |

---

> **🔍 Uncovered Scene Inference Rules**
>
> When user-described scenes/situations are not in the above table, infer based on this style's core genes:
>
> | Inference Dimension | Realistic Ancient Genes |
> |---|---|
> | Makeup intensity | Default elegant natural makeup (glossy skin + realistic hair strands); power/confrontation→cool frosty makeup; heart-fluttering/ambiguous→soft peach makeup; injured/weak→delicate sick makeup; grand wedding/ceremony→luxurious phoenix makeup |
> | Hairstyle | Daily/boudoir→half-up cloud bun; fairy scene/appearance→flying immortal bun; private/ambiguous→side sagging bun; injured downcast→fully loose hair; action→ponytail tie; hair strands must be distinctly visible |
> | Clothing | Realistic texture priority; daily→large-sleeve robe/soft flowing; formal→curved hem robe; action→narrow-sleeve casual wear; main color default white/moon white; texture must be ultra-clear |
> | Accessory density | Realistic craftsmanship maximalist (master craftsmanship finely carved); daily→medium; formal→maximum (full of pearls and jade + necklace + waist ribbon); action→simple; injured→minimal/none |
> | Texture baseline | Realistic photography anchored; glossy cream porcelain skin + hair strand detail always maintained; prohibit 3D rendering/CG feel |

## VIII. Four-View Sheet Specification

> Derivative styling overlay still requires outputting four-view sheet, ensuring styling is consistent across angles.

### View Definitions

| Position | View | Angle | Shot Size | Requirement | Prompt |
|---|---|---|---|---|---|
| Left 1 | Portrait closeup | Front eye level | Face to collarbone | Face 60%+, facial features/makeup clear | portrait closeup, face detail, makeup detail |
| Left 2 | Front view | Front 0° | Full body standing | Facing camera, full front view of clothing | front view, height mark |
| Right 2 | Side view | Right 90° | Full body standing | Pure side profile, clothing side layers | side view, profile, height mark |
| Right 1 | Back view | Rear 180° | Full body standing | Back of head hair accessory/back clothing/hair ends clear | back view, rear view, height mark |

### Frame Specifications

| Item | Constraint |
|---|---|
| Layout | Same frame left to right side-by-side four views |
| Background | Pure neutral gray #E8E8E8 |
| Standing posture | Natural standing, feet parallel slightly apart, arms naturally hanging or slightly extended (**any posture change prohibited**) |
| Expression | Micro-expression matching makeup style (e.g. elegant natural makeup→calm, peach makeup→smiling), limited to facial micro-expression, no body movement |
| Lighting | Even soft light, front main light + bilateral fill light, no hard shadows |
| Consistency | Four views' face/makeup/hairstyle/hair accessories/clothing/accessories completely identical |
| Aspect ratio | Recommended 4:1 or 3:1 |

---

## IX. Prompt Template

### Output Format Constraints

| Item | Constraint |
|---|---|
| Output content | **Only output prompt text**, no other content |
| Prohibited output | Quick reference tables, layer construction plans, visual constraint tables, prohibited items tables, derivative plans, output suggestions, core elements tables and all non-prompt content |
| Prohibited scenes | Character derivative assets **do not include scene/environment descriptions**, do not output any scene/environment/weather/background narrative content (scenes belong to scene asset category) |
| Prohibited props | **Do not include any prop interaction**, do not output umbrella/sword/fan/book/lantern/wine glass etc. handheld or interactive items (props belong to prop asset category) |
| Prohibited posture changes | **Do not change base model posture**, do not output walking/turning/waving/tilting/running etc. any action or body movement changes, maintain natural standing |
| Format | Directly output usable prompt code block, no titles, tables, explanations, plan comparisons needed |

### Complete Styling Overlay (Four Views)

```
Take the character's basic image as base map, img2img overlay styling makeup,
Ancient {gender} character four-view sheet, real-person realistic photography, ancient realistic documentary, high contrast, ultimate detail, 8K, ultra-fidelity
character design sheet, character turnaround,
Maintain base image face unchanged, {overall temperament},
[L1·Makeup] Decide based on user cues: {base makeup/light makeup/formal makeup}; use {makeup style}, glossy cream porcelain skin, {brow makeup}, {eye makeup}, {lip makeup},
[L2·Hairstyle] {styling type}, hair strands distinctly visible, {hair accessory description},
[L3+L4·Clothing] {main color}{style}, {material}, {decoration craftsmanship}, clear clothing texture, ultra-clear texture,
[L5·Accessories] {headwear}, {earrings}, {necklace}, {waist ornaments},
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
| R3 | Female accessories must be "maximalist + master craftsmanship" |
| R4 | Makeup/hairstyle/clothing/accessories style unified |
| R5 | Must output four-view sheet (portrait closeup + front view + side view + back view) |
| R6 | Must specify "pure neutral gray background" |
| R7 | Must specify "four-view consistency" |
| R8 | **Only output prompt** — prohibit outputting quick reference tables/layer solutions/visual constraints/prohibited items/derivative plans/output suggestions etc. any non-prompt content |
| R9 | **Prohibit including scene descriptions** — character derivative assets do not involve scene/environment/weather/background narrative; scenes belong to independent asset type |
| R10 | **Prohibit prop interaction** — do not include any handheld/interactive items (umbrella/sword/fan/book etc.); props belong to independent asset type |
| R11 | **Posture remains unchanged** — must maintain base model natural standing posture; any action/body movement/pose change prohibited |
| R12 | **L1 must analyze then decide first** — first parse user facial cues, then determine base makeup/light makeup/formal makeup |
| R13 | **All derivative assets require makeup** — normal circumstances do not remain makeup-free; at least use base makeup |
| R14 | **Makeup intensity controlled** — even when applying makeup, must be restrained; no modern heavy makeup/exaggerated colorful makeup effects |
| R15 | **Props/scenes/actions not used as intensity upgrade basis** — props, environment, action info alone must not elevate base makeup to stronger makeup |

### Strictly Prohibited

| # | Strictly Prohibited |
|---|---|
| X1 | Face shift after overlay |
| X2 | Accessories too simple/modern (female) |
| X3 | Makeup/clothing styles conflicting |
| X4 | Complex scene background (must be pure gray background) |
| X5 | Styling inconsistent between four views |
| X6 | Output any content other than prompt (tables/schemes/suggestions/explanations/variants etc.) |
| X7 | Include scene descriptions in character derivative assets (mountain path/rain/indoor/street/weather etc. environmental elements) |
| X8 | Output chapters like "Core Elements Quick Reference", "Layer Construction Plan", "Visual Constraints", "Prohibited Items", "Derivative Plans" |
| X9 | Include any prop interaction (handheld umbrella/sword/fan/book/lantern/wine glass etc. items) |
| X10 | Change base model posture (walking/turning/waving/tilting/running/bowing/looking up etc. action descriptions) |
| X11 | Include expression and posture linked descriptions (such as "45° side walking with slight lip curve" etc. narrative descriptions) |
| X12 | Apply fixed makeup directly without analyzing user cues |
| X13 | Incorrectly remain makeup-free, causing derivative assets to lack required makeup |
| X14 | Incorrectly upgrade makeup based solely on prop/scene/action words, causing makeup intensity decision error |
