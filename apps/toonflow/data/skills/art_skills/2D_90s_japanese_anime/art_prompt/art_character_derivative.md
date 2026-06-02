# 90s Retro Japanese Anime Style - Character Derivative Asset Generation · Constraint Manual

---

## I. Overlay Principles

1. **Face Unchanged** — Facial features after overlay must be identical to base model, no facial drift
2. **Pose Unchanged** — Maintain base model's natural standing pose, no pose/action/posture changes
3. **Layer-by-Layer Control** — Each layer independently described for easy layer replacement (change clothes without changing makeup)
4. **Style Uniformity** — All costume elements follow the 90s retro hand-drawn flat coloring aesthetic system, but without templated replication
5. **Character Difference Retention** — Different characters should retain clothing differences based on age, identity, personality, and occasion, avoiding "everyone wears the same outfit"
6. **Texture Not Degraded** — Hand-drawn texture standard after overlay not lower than base model
7. **Pure Costume Scope** — Only overlay makeup/hairstyle/clothing/footwear/accessories; prohibit introducing props, scenes, environments, actions

---

## II. Overlay Layers

| Layer | Content | Description |
|---|---|---|
| L0 | Base Model | Base character model, no modification |
| L1 | Makeup (Decision Layer) | Analyze user clues to determine makeup intensity |
| L2 | Hairstyle | Bun/updo/braid + hair accessories |
| L3 | Undergarment/Inner Layer | Replace white base undergarment |
| L4 | Outerwear/Main Garment | Kimono/modern wear/retro wear, etc. |
| L5 | Footwear | Shoe type/socks/shoe material/color scheme |
| L6 | Accessories | Headwear/earrings/necklace/waist accessories/hand accessories |

> **Scope Boundary**: Character derivative assets only include L0–L6 layers, not including props, scene environments, or pose actions.

---

## III. Makeup Constraints (L1)

### Base Model to Derivative Makeup Strategy (Key)

> The base model is makeup-free, but derivative assets default to entering the makeup process. The system should analyze makeup requirements based on user clues and decide intensity among basic makeup/light makeup/formal makeup.

### Clue to Makeup Mapping

| Clue Type | Typical Clues | L1 Decision |
|---|---|---|
| No prominent facial emphasis clues | Only clothing/hairstyle changes | Basic makeup |
| Mild facial clues | Smiling, slightly enhanced complexion | Light makeup |
| Clear illness/frailty clues | Pale complexion, very light lip color | Sickly makeup |
| Clear formal ceremony clues | Formal attire, ceremony | Formal makeup |

### Female Makeup Style Matrix

| Style | Applicable Scene | Core Prompt Keywords |
|---|---|---|
| Daily Light Makeup | Daily, first meeting | Light makeup, natural makeup, nostalgic feel |
| Date Makeup | Date, date | Sweet makeup, warm pink, good complexion |
| Formal Makeup | Banquet, ceremony | Refined makeup, noticeable eye makeup |
| Sickly Makeup | Injured, weak | Pale complexion, light lip color, light eye makeup |
| Retro Makeup | Nostalgic scene, classic | Retro makeup, 90s style |

### General Base Skin

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Texture | Flat coloring, even tone | Flat coloring, even skin |
| Fairness | Warm fair skin, soft not harsh | Warm fair skin, soft fair |
| Inner Glow | Retain soft glow in flat coloring | Translucent skin, soft luster |
| Prohibited | Excessive digital/oily/heavy texture | — |

### Male Makeup

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Base Skin | Healthy complexion, flat coloring | Healthy complexion, flat coloring |
| Principle | No-makeup makeup — looks like no makeup but skin is good | No-makeup makeup, naturally good skin |
| Eyebrows | Natural thick eyebrows, no drawn brows | Natural sword brows, heroic brow shape |
| Lip Color | Natural blood color, slightly moist | Natural lip color, blood color feel |

---

## IV. Hairstyle Constraints (L2)

### Female Style Types

| Style | Description | Applicable | Prompt Keywords |
|---|---|---|---|
| Twin Tails | Ponytails on both sides, common in 90s | Young girl, daily | Twin tails, 90s style |
| High Ponytail | Ponytail at top of head, neat | Sports, action | High ponytail, neat |
| Long Hair Down | Long hair fully down, gentle | Gentle, daily | Long hair down, smooth |
| Side Ponytail | Ponytail on one side, asymmetrical | Playful, personality | Side ponytail, playful |
| Braids | Braided style, refined | Formal, occasion | Braids, refined hairstyle |
| Bun | Bun on top of head, cute | Cute, daily | Bun, cute |

### Female Hair Accessories

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Style | Common in 90s, matching clothing | 90s hair accessories, retro style |
| Material | Ribbon/beads/metals | Ribbon hair accessories, beaded hair accessories |
| Craftsmanship | Hand-drawn texture, matching 90s | Hand-drawn hair accessories, 90s style |

### Male Style Types

| Style | Applicable | Prompt Keywords |
|---|---|---|
| Short Hair | Daily, neat | Short hair, neat |
| Medium-Long Hair | Daily, refined | Medium-long hair, refined |
| Long Hair Tied Up | Formal, battle | Long hair tied up, handsome |
| Hair Down Over Shoulders | Casual, gentle | Hair down over shoulders, gentle |

---

## V. Clothing and Footwear Constraints (L3+L4+L5)

> **Note**: The following styles are style references, not rigid uniform templates. Priority should be given to free combination based on character identity, age, occupation, personality, and occasion, as long as the overall look maintains 90s retro Japanese anime aesthetic.

### Female Clothing Matrix

| Style | Type | Applicable | Prompt Keywords |
|---|---|---|---|
| Daily Casual Wear | T-shirt/jeans/dress | Daily, campus | Casual wear, comfortable |
| Kimono/Hanfu | Traditional attire | Occasion, theme | Kimono, Hanfu |
| Sportswear | Athletic wear, hoodie | Sports, casual | Sportswear, energetic |
| Formal Dress | Gown, 90s style | Banquet, formal | Formal dress, elegant |
| Uniform | School uniform, 90s uniform | Campus, workplace | Uniform, neat |

### Female Clothing General Constraints

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Main Color | Can choose warm, neutral, or low-saturation cool colors per character setting, avoid monotony | Nostalgic color scheme, character-specific color scheme |
| Material | Clear fabric texture, can choose cotton/knit/uniform wool/silk per identity | Clear fabric texture, flat coloring |
| Texture | Flowing lines, soft colors, retain 90s hand-drawn feel | Flowing lines, soft colors |
| Layers | Clear layers, rich details, complexity should match character identity | Clear layers, detailed clarity |

### Male Clothing Matrix

| Style | Applicable | Prompt Keywords |
|---|---|---|
| Daily Casual Wear | T-shirt/jeans | Daily, casual |
| Uniform | School uniform, 90s uniform | Uniform, neat |
| Suit | Formal wear, formal | Suit, formal |
| Sportswear | Athletic wear, hoodie | Sports, energetic |
| Kimono/Hanfu | Traditional, occasion | Kimono, Hanfu |

### Footwear Design Matrix (L5)

| Style | Common Female Shoe Types | Common Male Shoe Types | Prompt Keywords |
|---|---|---|---|
| Daily Campus | Loafers, Mary Janes, short socks with leather shoes | Loafers, sneakers | Campus shoes, retro Japanese, simple shoe design |
| Daily Casual | Canvas shoes, low-top sneakers, short boots | Canvas shoes, casual shoes, low-top sneakers | Casual shoes, comfortable, nostalgic color scheme |
| Formal Occasion | Low heels, strappy leather shoes, short boots | Leather shoes, short boots | Formal footwear, refined, clean lines |
| Traditional Attire | Geta, embroidered flats, cloth shoes | Geta, cloth shoes, traditional short boots | Traditional footwear, matching attire |
| Action/Sports | Lightweight sneakers, lace-up short boots | Sneakers, functional short boots | Lightweight footwear, easy movement |

### Footwear General Constraints

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Style Unity | Footwear should coordinate with the main garment's era, but shoe type can vary freely per character identity | Unified with attire, retro Japanese |
| Clear Structure | Shoe opening/heel/laces/sock layers clearly defined | Clear shoe shape, clear structure |
| Color Scheme | Can echo main garment color, accent color, or character's personal signature color, not fixed to one logic | Low-saturation color scheme, nostalgic colors |
| Texture | Hand-drawn flat coloring, flowing lines, avoid modern sneaker exaggeration | Hand-drawn footwear, flat coloring |
| Prohibited | No bare feet, no missing footwear design, no modern exaggerated sneaker tech look | — |

---

## VI. Accessories Constraints (L6)

### Female Accessories

| Type | Constraint | Prompt Keywords |
|---|---|---|
| Headwear | Headband/hair clip/bow | Hair accessory, refined |
| Earrings | Earrings/studs | Earrings, small and delicate |
| Necklace | Necklace/pendant | Necklace, refined |
| Hand Accessories | Bracelet/bangle | Bracelet, slender |
| Bag | Bag, shoulder bag | Bag, stylish |

### Male Accessories

| Type | Constraint | Prompt Keywords |
|---|---|---|
| Glasses | Glasses/sunglasses | Glasses, stylish |
| Watch | Watch | Watch, refined |
| Ring | Ring | Ring, simple |
| Scarf | Scarf | Scarf, warm |

---

## VII. Costume Combination Quick Reference

| Scene | Makeup | Hairstyle | Clothing | Footwear | Accessories |
|---|---|---|---|---|---|
| Daily Campus | Daily light makeup | Twin tails/long hair down | Uniform/daily casual | Loafers/Mary Janes/sneakers | Simple |
| First Meeting | Daily light makeup | Long hair down/side ponytail | Daily casual | Canvas shoes/low heels | Moderate |
| Sweet Date | Date makeup | Side ponytail/bun | Casual/kimono | Low heels/geta | Moderate to many |
| Formal Occasion | Formal makeup | Braids/high ponytail | Formal gown/formal wear | Low heel leather shoes/short boots | Elaborate |
| Gentle Intimate | Daily light makeup | Long hair down | Daily casual | Soft-soled shoes/canvas shoes | Simple |
| Intense Action | Daily light makeup (very light) | High ponytail | Sportswear | Sneakers/functional short boots | Simple |
| Retro Scene | Retro makeup | Braids/twin tails | Kimono/retro wear | Geta/cloth shoes | Moderate |

> **🔍 Uncovered Scene Inference Rules**
>
> When the user-described scene/situation is not in the above table, infer based on this style's core genes:
>
> | Inference Dimension | 90s Retro Japanese Anime Genes |
> |---|---|
> | Makeup Intensity | Default daily light makeup (flat coloring, nostalgic feel); formal/ceremony→formal makeup; date/heart-fluttering→date makeup; retro theme→retro makeup |
> | Hairstyle | Daily/young girl→twin tails or long hair down; sports/action→high ponytail; formal→braids; playful/personality→side ponytail; cute→bun |
> | Clothing | Anchor to 90s style with free variation: choose from school uniform, uniform, casual wear, kimono, knitwear, jacket, dress, etc. by character setting, avoid high homogeneity between characters |
> | Footwear | Match with clothing and identity: loafers, canvas shoes, leather shoes, short boots, geta, etc., no fixed single answer |
> | Accessory Density | Daily→simple (90s style hair accessories + basic accessories); formal→moderate to elaborate; action/sports→simple or none |
> | Texture Baseline | Hand-drawn flat coloring always locked; flowing lines, soft warm tones; forbid digital feel/3D rendering/modern CG texture |

---

## VIII. Four-View Character Sheet Specifications

### View Definitions

| Position | View | Angle | Shot Type | Requirement | Prompt Keywords |
|---|---|---|---|---|---|
| Left 1 | Portrait Close-up | Front, eye level | Face to collarbone | Face 60%+, facial features/makeup clear | portrait closeup, face detail |
| Left 2 | Front View | Front 0° | Full Body | Facing camera, full front of clothing | front view, full body |
| Right 2 | Side View | Right 90° | Full Body | Pure side profile, side layers of clothing | side view, profile |
| Right 1 | Back View | Back 180° | Full Body | Back of head hair accessories/back clothing clear | back view, rear view |

### Image Specifications

| Item | Constraint |
|---|---|
| Layout | Four views side by side left to right in one frame |
| Background | Warm beige #F8F4E8 |
| Standing Pose | Natural stance, feet parallel slightly apart (**no pose changes allowed**) |
| Expression | Micro-expression matching makeup style (e.g., light makeup→natural, formal makeup→smile) |
| Lighting | Soft cinematic light, even soft light, no hard shadows |
| Consistency | Face/makeup/hairstyle/hair accessories/clothing/footwear/accessories completely consistent across four views |
| Aspect Ratio | Recommended 4:1 or 3:1 |

---

## IX. Prompt Template

```
Using the character base image as base image, img2img overlay costume and makeup,
90s anime style, retro Japanese anime style, {gender} character four-view character sheet, hand-drawn flat coloring, soft warm tones, cinematic lighting,
character design sheet, character turnaround,
keep base face unchanged, {overall temperament},
【L1·Makeup】{basic makeup/light makeup/formal makeup}; use {makeup style}, even skin, {eyebrow makeup}, {eye makeup}, {lip makeup},
【L2·Hairstyle】{style type}, smooth hair strands, {hair accessory description},
【L3+L4·Clothing】{main color}{style}, {material}, {decoration craftsmanship}, clothing lines flowing, clear texture,
【L5·Footwear】{shoe style}, {shoe material}, {socks/shoe opening design}, unified with clothing,
【L6·Accessories】{headwear}, {earrings}, {necklace}, {waist accessories},
same frame left to right side by side: portrait close-up + front view + side view + back view,
natural standing, pure neutral gray background, soft cinematic light, no hard shadows,
four-view consistency, delicate facial rendering, delicate hair strand rendering, clear texture details
no text in the image
```

---

## X. Constraint Rules

### Mandatory

| Number | Rule |
|---|---|
| R1 | Face after overlay must be consistent with base model |
| R2 | Clothing must have "flowing lines + clear structure" 90s hand-drawn texture, but styles should vary by character |
| R3 | Female accessories must maintain 90s style and match clothing, not forced to same combination |
| R4 | Makeup/hairstyle/clothing/footwear/accessories must be unified in style, but not templated to the point characters lose difference |
| R5 | Must output four-view character sheet (portrait close-up + front view + side view + back view) |
| R6 | Must specify "warm beige background #F8F4E8" |
| R7 | Must specify "four-view consistency" |
| R8 | **Output only the prompt** — no tables/schemes/explanations/variants |
| R9 | **No scene descriptions** — no scene/environment/weather descriptions |
| R10 | **No prop interaction** — no handheld/interactive items |
| R11 | **Pose remains unchanged** — must maintain base model's natural standing pose |
| R12 | **L1 analyze first, then decide** — first parse user's facial clues, then determine makeup intensity |
| R13 | **All derivative assets need makeup** — at minimum use basic makeup |
| R14 | **Makeup intensity controlled** — no overly exaggerated makeup |
| R15 | **Props/scenes/actions not grounds for intensity upgrade** — these alone should not raise basic makeup level |

### Prohibited

| Number | Prohibition |
|---|---|
| X1 | Facial drift after overlay |
| X2 | Accessories too simple/modern (female) |
| X3 | Makeup/clothing/footwear styles conflicting with each other |
| X4 | Complex scene backgrounds (must be warm-tone background) |
| X5 | Inconsistent costume/makeup across four views |
| X6 | Outputting anything other than the prompt |
| X7 | Adding scene descriptions to character derivative assets |
| X8 | Outputting sections like "quick reference table," "plan," "suggestion" |
| X9 | Adding any prop interaction |
| X10 | Changing base model pose |
| X11 | Adding expression and pose linkage descriptions |
| X12 | Not analyzing user clues before applying fixed makeup |
| X13 | Incorrectly keeping makeup-free, resulting in missing required makeup |
| X14 | Mistakenly upgrading makeup solely due to prop/scene/action keywords |
