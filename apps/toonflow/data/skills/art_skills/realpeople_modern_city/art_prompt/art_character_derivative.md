---
name: liveaction_urban_character_derivative
description: Live-action Urban Character Derivative Asset Generation · Constraint Manual
metaData: liveaction_urban_art_skills
---

# Live-Action Urban Character Derivative Asset Generation · Constraint Manual

---

## I. Styling Logic — Styling a Real Person

> Live-action urban does not discuss "material layering," "PBR rendering," or "modeling precision." What is discussed here is: a makeup artist working on a real face, a hairstylist handling real hair with real tools, a stylist taking a worn piece of clothing off a rack — and then the camera captures all of this.

1. **Makeup is "Second Skin," not "Facial Texture Map"** — Foundation merges with skin oils, eyeliner slightly shifts along the eye shape, lipstick shows uneven texture due to lip lines — makeup must have the realness of "just applied"
2. **Hair is Alive** — After styling, hair still sheds flyaways, roots have natural volume not a wig, the tight ponytail area has natural scalp pulltraces
3. **Clothing is "Worn on the Body," not "Worn on a Model"** — Shoulder lines may not be perfectly symmetrical (real body stances are asymmetrical), fabric creates natural folds with body movement, collar has slight deformation from on/off wear
4. **Styling Serves the Face, Not Obscures It** — The worst styling makes it impossible to recognize the base model. Derivative styling should enhance rather than conceal the character's core temperament

---

## II. Styling Layers

| Layer | Content | Live-Action Urban Understanding |
|---|---|---|
| L0 | Base model | Base image — bare-faced, basic hairstyle, basic daily clothing. No modification |
| L1 | Makeup | A makeup artist's work on a real face — base → brows/eyes → cheeks → lips. Decide intensity per scene |
| L2 | Hairstyling | Hairstylist using real tools — blow-dry/updo/braid/curl + hair accessories |
| L3 | Inner layer | Base layer — T-shirt/shirt/knit/camisole/base layer, replacing basic pieces |
| L4 | Outer layer | Jacket — suit/blazer/hoodie/dress/coat/workwear, determines overall outfit style |
| L5 | Accessories | Jewelry/hat/glasses/scarf/bag/watch — the final step of daily dressing |

> **Scope Boundary**: Styling only (makeup + hairstyle + clothing + accessories). Does not include props (phone/coffee cup/umbrella/book etc. handheld items), scene environments, or posture/movement.

---

## III. Makeup — A Makeup Artist's Work on a Real Face (L1)

### Core Principles

> Makeup is "second skin." The camera must be able to see the real skin beneath the makeup — pores not filled, fine lines not smoothed out, foundation not floating on the surface like a mask.

### Cue Analysis and Makeup Decision

| Step | Processing Content |
|---|---|
| S1 | Extract user cues: scene context, emotional atmosphere, facial state description |
| S2 | Filter non-makeup cues: prop/scene/action words not for makeup |
| S3 | Match scene → makeup intensity: bare-skin level / daily level / occasion level / gala level |
| S4 | Generate L1 prompt — only output conclusion |

### Scene → Makeup Intensity Mapping

| Scene | Makeup Intensity | Core Intent |
|---|---|---|
| At home/morning/bare-faced state | Bare-skin level — no makeup traces, only skin itself | Real skin texture, unadorned face |
| Daily commute/supermarket/walk | Daily level — light makeup, looks like "no makeup but good complexion" | Professional/life appropriate, unnoticeable elegance |
| Date/party/shopping | Occasion level — visible makeup but not excessive | Present makeup, still within "daily life" scope |
| Dinner/wedding/gala | Gala level — fulldelicate makeup | Makeup designed for camera and lights, but base still shows real skin |

### Female Makeup — Per Face Type Adaptation

#### Cool Restrained Type

| Intensity | Makeup Intent | Prompt |
|---|---|---|
| Bare-skin level | No makeup — clean cool fair skin, eyebrows naturally unadorned, lip color is natural blood tone | No makeuptraces, natural cool fair skin texture, unadorned natural brows, lip color is own blood tone |
| Daily level | "I might have applied a bit of lip balm" — very light nude lip, brows lightly brushed, no eye makeuptraces | Very light nude lip balm, natural brow lightly brushed, no eye makeup feel, skin's own luster |
| Occasion level | Red lips are the only focus — matte brick red or brown-toned lipstick, brows/eyes restrained, emphasizing cool detachment | Matte brick red lip makeup (sole focus), ultra-fine eyeliner following outer eye, clean shap brow, rest nearly bare |
| Gala level | Cool-toned smoky but not heavy — gray-brown light smoky, contour shaping, matte dark red lips, retaining bone structure | Gray-brown light smoky eye makeup, light contour under cheekbones, matte dark red lips, retaining facial bone structure |

#### Gentle Healing Type

| Intensity | Makeup Intent | Prompt |
|---|---|---|
| Bare-skin level | Warm fair translucent skin, inherent light pink cheeks, soft brows | Warm fair translucent bare skin, natural pink cheeks, soft brow shape, no makeup feel |
| Daily level | Hydrating glow — luminous base, pink blush lightly swept, lip balm texture | Luminous base, pink blush naturally blended, transparent lip balm, soft eyes |
| Occasion level | Warm-toned soft — apricot eye shadow, cream blush, glossy lip glaze, overall warm | Warm apricot eye shadow naturally blended, cream blush, glossy lip glaze, warm and gentle |
| Gala level | Warm-toneddelicate makeup — champagne pearl eye makeup, luminous base, rose bean lip,delicate without losing gentleness | Champagne pearl eye makeup, luminous highlight, rose bean lip color,delicate gentle complete look |

#### Urban Capable Type

| Intensity | Makeup Intent | Prompt |
|---|---|---|
| Bare-skin level | Neutral clean skin, sharp eyebrows but unlined | Neutral clean bare skin, sharp brow shape unadorned, natural lip color, unadorned face |
| Daily level | "Office light makeup" — matte base, sharp brow shape, MLBB lip color (my lips but better) | Matte natural base, sharp brow lightly drawn, MLBB lip color, unnoticeable propriety |
| Occasion level | Sharp but not fierce — clear eyeliner, contour shaping, low-saturation rose lip | Sharp clear eyeliner, facial contour shaping, low saturation rose lip, capable and powerful |
| Gala level | Fulldelicate makeup — matte base, structural contour, true red or plum lip, full presence | Mattedelicate base, structural contour shaping, true red/plum lip, complete but facial structure still distinguishable |

#### Youthful Energetic Type

| Intensity | Makeup Intent | Prompt |
|---|---|---|
| Bare-skin level | Collagen is the makeup — skin that doesn't need makeup is already bright | Full collagen feel bare skin, natural rosy cheeks, bright eyes, no makeup needed |
| Daily level | "Just a touch of color" — tinted lip balm, clear brow gel, very light cream blush | Tinted lip balm, clear brow gel, cream blush lightly patted, can't tell it's makeup |
| Occasion level | Bright lively — orange/coral blush, glossy lip glaze, light pearl eye shadow | Orange-toned vibrant youthful blush, glossy lip glaze, light pearl eye shadow, bright girlish feel |
| Gala level |delicate without aging — clear base, juice lip glaze, micro-shimmer eye shadow, retaining youthful feel | Clear base retaining skin texture, juice lip glaze, micro-shimmer eye shadow,delicate without masking youth |

#### Mundane World Type

| Intensity | Makeup Intent | Prompt |
|---|---|---|
| Bare-skin level | Sun-exposed face — sun marks, natural uneven skin tone, no makeup | Sun-exposed natural face, real uneven skin tone, unadorned skin, life's own face |
| Daily level | "Just applied some moisturizer and went out" — very light tinted sunscreen, own lip color | Very light tint, almost invisible base, own lip color, just-washed natural state |
| Occasion level | Simple and decent — natural lipstick, brows slightly tidied, light non-powder base | Natural lipstick, slightly tidied brows, light no-powder base, simple decency |
| Gala level | Dressed up but not affected — warm earth-tone eye shadow, brick red/brown red lip, base visible skin texture | Warm earth-tone eye makeup, brick red/brown red lip, base retaining skin texture, dressed up but not fake |

### Male Makeup

> The highest standard for male makeup is "can't tell he's wearing makeup."

| Intensity | Applicable Scenes | Prompt |
|---|---|---|
| Bare-skin level | Default for all scenes | Unadorned real male skin, natural oil luster, poresclear visible, real shaved jaw texture |
| Daily level | Close-up/studio shoot/important conversation | Very light even skin tone (invisible powder feel), brows lightly brushed with clear brow gel, natural lip color with lip balm texture — overall can't tell it's makeup |
| Occasion level | Wedding/gala/close-up | Even clean skin (retaining pore texture), brows lightly shaped, natural moist lip color — visibly well-groomed but foundation undetectable |

---

## IV. Hairstyling — Real Hair in the Hairstylist's Hands (L2)

### Female Hairstyles

#### By Styling Method

| Method | Type | Hairstyle Description | Adapts to Face Type |
|---|---|---|---|
| Natural fall | Long straight | Natural smooth straight hair, slightly inward-curled ends, center or side parting, flyaways naturally scattered at forehead and nape | Cool Restrained/Gentle Healing/Urban Capable |
| Natural fall | Lazy loose waves | Large-arc lazy wavy hair, naturally voluminous roots, uneven wave pattern (not identical curling iron), flyaways framing face | Gentle Healing/Youthful Energetic |
| Natural fall | Collarbone layered short | Shoulder length, layered choppy ends, one side tucked behind ear showing ear accessory, nape flyaways natural | Urban Capable/Cool Restrained |
| Natural fall | Small wool curls | Full medium-small curls, airy and voluminous, naturally standing roots, handcrafted feel not mechanically uniform | Youthful Energetic/Mundane World |
| Tied up | High ponytail | Tied at high crown, naturally voluminous roots, ponytail has natural curve not straight drop, forehead and temple flyaways natural scattered | Youthful Energetic/Urban Capable/sports scenes |
| Tied up | Low ponytail/low bun | Tied at nape or behind ear, loose not tight, nape flyaways natural, "casually tied" relaxed feel | Gentle Healing/Mundane World/home scenes |
| Tied up | Bun | Wrapped at crown or back of head, loose not tight, flyaways around face and neck | Home/daily/sports |
| Braided | Single side braid | Side braid, loose with handcrafted feel, natural flyaways incorporated, tip naturally frizzy | Gentle Healing/Youthful Energetic |
| Braided | Double braid | Symmetrical braids on both sides, moderate tightness, suitable for youthful styling | Youthful Energetic |
| Short | Ear-length short | Above or below ear length, neat or choppy ends, one side tucked behind ear, clean nape | Urban Capable/Cool Restrained |
| Short | Boyish choppy short | Layered choppy short, nape tapered, forehead flyaways naturally scattered | Cool Restrained/Urban Capable/androgynous style |

#### Real Hair State in Front of the Camera (Shared Across All Styles)

| State | Prompt |
|---|---|
| Flyaways | Forehead flyaways naturally scattered, temple baby hairs, nape flyaways, natural uneven hairline |
| Roots | Roots naturally voluminous not pressed against scalp, parting area naturally visible scalp |
| Ends | Ends naturally frizzy/split, tied ends have natural curve |
| Luster | Natural reflection of healthy hair — not oily not matte, translucent warm contour in backlight |
| Strictly prohibited | Wig-like neat edges, CG strands individually distinct, no flyaways, stiff styling |

### Male Hairstyles

| Style | Description | Adapts to Face Type |
|---|---|---|
| Neat short | Sides tapered, top left long for styling, natural hair direction, forehead visible | Tough Mature/Urban Capable (male face) |
| Layered fringe | Forehead fringe slightly covering brows, top voluminous layered, sides natural transitioning | Sunny Youthful/Gentle Introverted |
| Side-part short | Side parting, one side swept back, business clean but not greasy hard shell | Cool Restrained/Gentle Introverted |
| Crew cut/buzz | Very short, scalp visible, natural hairline, clear head shape contour | Tough Mature/Mundane World |
| Mullet | Short front long back, back hair long at nape, layered sharp, "not carefully cut" casual feel | Sunny Youthful/Cool Restrained |
| Mid-length | Shoulder length, naturally falling or half tied, natural texture | Cool Restrained/artistic temperament |
| Curly/textured | Natural curls or light perm, airy voluminous, not stiff | Sunny Youthful/Gentle Introverted |

#### Real Hair State in Front of the Camera (Male Shared)

| State | Prompt |
|---|---|
| Short hair texture | Scalp visible with short hair, natural hair direction, temple-to-stubble natural transition |
| Daily state | No gel hard shell feel, hair naturally voluminous or slightly flat (matching daily life), wind-blown natural mess |
| Hairline | Natural hairline (allow slight recession), possible slight thinning at corners, not wig-style neat |
| Strictly prohibited | Gel hard shell reflection, wig-like neat edges, CG strands, unnaturally perfect hairstyle |

---

## V. Clothing — Real Outfits, Not Modeled Costumes (L3+L4)

### Live-Action Urban Clothing Logic

> 3D projects discuss "material rendering," "PBR physical properties," "multi-layer structural stitching." Live-action urban discusses: where was this piece of clothing bought? How many times has it been worn? Why was it chosen today?

- **Layering comes from weather and occasion, not from "design layers"**: T-shirt under a shirt because of temperature difference between morning and evening, trench coat because it's windy today, knit cardigan because the office AC is too cold
- **Clothes show wearing traces**: collar slightly deformed, cuffs have friction marks, jeans knees have stretch texture, white T-shirt slightly aged after washing
- **Fitted not tight**: clothing conforming to body but not tight, shoulder seam at natural position (may be slightly off due to posture), pant length just right or slightly stacked on shoes
- **Real contemporary Chinese urban outfits** — not K-drama, not Japanese magazine, not European/American street style

### Female Clothing Matrix

| Style | Core Pieces | Applicable Scenes | Prompt |
|---|---|---|---|
| Commuter professional | Blazer/shirt/trouser/mid-length skirt/trench coat | Office, business meeting, daily commute | Commuter professional outfit, blazer+shirt+straight-leg trousers, camel/navy/black tones, fabric natural drape, fitted not tight |
| Casual daily | T-shirt/sweatshirt/jeans/wide-leg pants/knit cardigan | Weekend outing, supermarket, café, walk | Casual daily outfit, loose sweatshirt+straight-leg jeans, cream white/gray/khaki tones, cotton natural texture |
| Gentle date | Knit dress/floral midi skirt/cashmere cardigan/French blouse | Date, friend gathering, afternoon tea | Gentle date outfit, knit dress+short cardigan, cream/soft pink/light apricot tones, soft fabric texture |
| Street style | Oversize hoodie/cargo pants/denim jacket/baseball cap | Shopping, trends, music festival, nightlife | Street style outfit, oversize hoodie+cargo wide-leg pants, black/gray/olive tones, casual attitude |
| Sport outdoor | Yoga pants/sports bra/quick-dry tee/windbreaker/sneakers | Gym, outdoor running, cycling, hiking | Sport outfit, yoga pants+sports bra+loose quick-dry tee, dark tones, functional fabric natural texture |
| Academic artistic | Knit vest+shirt/pleated skirt/canvas shoes/wool jacket | Campus, bookstore, library, exhibition | Academic artistic outfit, knit vest layered over shirt+pleated skirt, navy/burgundy/plaid, scholarly feel |
| Lazy home | Loose cotton loungewear/knit robe/fleece jacket | Home daily, morning, late night | Home outfit, loose cotton long-sleeve+home pants, cream white/light gray/light blue, soft skin-friendly texture |

### Male Clothing Matrix

| Style | Core Pieces | Applicable Scenes | Prompt |
|---|---|---|---|
| Business formal | Suit set/white shirt/tie/dress shoes | Business meeting, formal occasion, important meeting | Business formal outfit, dark gray/navy suit set+white shirt, tailored fit, fabric crisp with drape |
| Business casual | Casual blazer+crewneck tee/knit+chinos | Daily commute, light business | Business casual outfit, casual blazer+crewneck white T+khaki chinos, no tie, relaxed with restraint |
| Daily casual | Solid tee/Henley long-sleeve/sweatshirt+straight-leg jeans | Weekend, daily, all informal occasions | Daily casual outfit, solid cotton tee+straight-leg jeans, black/white/gray/navy, fabric natural comfortable |
| Street brand | Printed hoodie/cargo pants/denim jacket/canvas shoes | Shopping, gathering, nightlife | Street brand outfit, printed hoodie+cargo tapered pants, black/olive/gray tones, relaxed attitude |
| Sports functional | Quick-dry tee/sport shorts/sport pants/sneakers | Gym, running, basketball court | Sport outfit, quick-dry tee+sport shorts, black/dark gray, functional fabric texture |
| Artistic cool | Drop-shoulder shirt/loose knit/wide-leg trousers/canvas shoes | Bookstore, exhibition, café | Artistic outfit, drop-shoulder cotton shirt+loose trousers, earth tones/cream white/navy, unstudied texture |

---

## VI. Accessories — The Final Step of Daily Dressing (L5)

### Female Accessories

| Category | Live-Action Urban Accessory Logic | Prompt |
|---|---|---|
| Earrings | Not "metal drops" — but "the pair picked up casually before going out." Small simple as primary, echo outfit style | Small silver studs/metal thin hoop earrings/pearl studs/acrylic geometric drops — matching {outfit style} |
| Necklace | Collarbone chain or mid-length necklace, conforming to neck natural curve, not floating, not embedded in skin | Fine collarbone chain/metal thin chain pendant/pearl short necklace — naturally conforming to neck |
| Watch/bracelet | Daily-worn watch, thin bracelet or ring, with usetraces (strap natural bent, metal subtly wear) | Leather strap watch/metal thin bracelet/simple ring — daily wear texture, with usetraces |
| Hat | Baseball cap/beret/knit beanie — brim with natural curve, cap body with weartraces | Baseball cap (brim natural curve)/beret (slightly tilted)/knit beanie (soft texture) |
| Glasses | Optical glasses or sunglasses, frame material natural, lenses slightly reflective but eyes still visible | Metal thin frame/acetate frame glasses, lenses subtly reflective but eyes still visible |
| Bag | Daily commute/going-out real bag — leather with using folds, canvas natural aged | Leather shoulder bag (natural using folds)/canvas tote (slightly aged)/crossbody small bag |

### Male Accessories

| Category | Prompt |
|---|---|
| Watch | Daily-worn watch — metal strap natural wear/leather strap benttraces/simple dial |
| Glasses | Metal thin frame/acetate frame glasses, lenses subtly reflective, nose pads natural conforming to |
| Hat | Baseball cap/beanie — natural wearing state, brim subtly curved, daily use feel |
| Bag | Backpack/messenger bag — canvas or leather material, with usetraces, straps natural bent |

---

## VII. Styling Combination Quick Reference

| Scene | Makeup Intensity | Hairstyle | Outfit Style | Accessories |
|---|---|---|---|---|
| Morning at home | Bare-skin level | Natural falling/casually tied | Lazy home | Minimal or none |
| Commute to work | Daily level | Sharp falling/low ponytail/side-part short | Commuter professional/business casual | Watch+simple bag |
| Weekend outing | Daily level | Lazy waves/layered fringe/mullet | Casual daily/daily casual | Bag+hat+watch |
| Date | Occasion level | Gentle waves/collarbone short/side-part | Gentle date/academic artistic | Earrings+necklace+bag |
| Café/bookstore | Daily level | Natural falling/layered short/mid-length | Academic artistic/artistic cool | Glasses+canvas bag |
| Gym/outdoor | Bare-skin level | High ponytail/bun/crew cut | Sport outdoor/sports functional | Sport watch+headband |
| Dinner/gala | Gala level |delicate waves/updo/side-part slicked | Formal wear (dress/suit) | Earrings+necklace+bracelet+delicate bag |
| Late night alone | Bare-skin level | Casual falling/slightly messy | Lazy home | None |
| Street night market | Occasion level | Wool curls/boxer braids/mullet | Street style/street brand | Earrings+baseball cap |
| Hospital/formal | Daily level | Neat tied/neat short | Simple solid outfit | Minimal |

> **Uncovered Scene Inference Rules**: First judge scene's private/public attribute (private→bare-skin, public→daily level minimum); then judge formality level (formal→occasion/gala level); finally judge mood (romantic/social→occasion level). Makeup adapts to face type (see Chapter III), outfit adapts to scene temperature and atmosphere.

---

## VIII. Character Portrait Series — Four-Angle Photography Specifications

> Derivative styling overlay still requires outputting a four-angle studio series, ensuring makeup, hairstyle, and outfit consistency and recognizability across all real photo angles.

### Four-Angle Definitions

| Position | Angle | Shot Size | Photography Requirement |
|---|---|---|---|
| Left 1 | Front close-up | Top of head to upper clavicle | Face occupies 60%+, makeup detailclear visible (foundation-skin fusion, eyeliner precision, lip texture). Focal length 50-85mm |
| Left 2 | Front 0° | Full body | Full front outfit view, clothing drape layering, accessories fully presented. Complete head to toe |
| Right 2 | Right 90° | Full body | Sideoutline/silhouette+outfit side layers, hairstyle side state. Complete head to toe |
| Right 1 | Back 180° | Full body | Back hairstyle full view, back outfit, bag/hat back side. Complete head to toe |

### Frame Specifications

| Item | Photography Requirement |
|---|---|
| Layout | Same frame left to right side-by-side four angles, even spacing. Presented as "styling confirmation photo" layout |
| Background | Medium gray seamless backdrop paper #B0B0B0, no light spots no gradient no shadows |
| Stance | Maintain base model stance — natural daily standing posture with balance shift, not at attention not pose. **Prohibit changing posture due to outfit change** |
| Facial expression | Micro-expression matching makeup intensity and scene atmosphere — bare-skin level neutral natural, occasion level subtly containing smile, gala level calm confident. **Facial micro-expression only, no body movements** |
| Lighting | Studio soft light — front softbox main light + bilateral fill reflectors. Soft even light, clear direction, light ratio approx. 1:2 to 1:3, retaining facial three-dimensionality. Clothing and accessory material textureclear visible |
| Consistency | Four angles are continuous photographic records of the same person's same styling shoot. Face/makeup/hairstyle/outfit/accessories fully presented as same shoot |
| Aspect ratio | Recommend 4:1 or 16:4 wide format |

---

## IX. Prompt Template

### Output Format Constraints

| Item | Constraint |
|---|---|
| Output content | **Only output prompt text**, no analysis process, scheme comparison, quick reference tables, constraint explanations |
| Prohibited scenes | Does not include any scene/environment/weather/background descriptions |
| Prohibited props | Does not include any handheld/interactive items (props belong to independent assets) |
| Prohibited posture changes | Does not change base model stance, does not output any action/posture changes |
| Format | Directly output usable complete prompt |

### Complete Styling Overlay Prompt Template

Using character base image as base, img2img layering styling,
Live-action urban character styling portrait series, real-person live photography, studio soft lighting, medium gray seamless backdrop,
{male/female} portrait series, live-action style, non-3D non-render non-CG,
character portrait series, live-action photography, studio soft lighting,
Maintain base image face unchanged, {overall temperament},
[L1·Makeup] {makeup intensity — bare-skin/daily/occasion/gala level}, {makeup description}, makeup fusion with real skin, foundation not mask-like, skin pore texture still visible,
[L2·Hairstyle] {hairstyle description}, real hair texture, {flyaways/roots/ends real state description}, not wig not CG strands,
[L3+L4·Outfit] {outfit style}, {top description}+{bottom description}, {color}, {fabric natural texture}, clothes natural draping, with real wearing folds, not sample garment,
[L5·Accessories] {accessories description}, daily wearing texture, with usetraces, naturally conforming to body,
Same frame left to right side-by-side: portrait closeup + front full body + side full body + back full body,
Natural daily stance (weight shift), medium gray seamless backdrop paper #B0B0B0, studio even soft light, soft light ratio,
Four angles are continuous photographic records of the same styling shoot,
Clean frame no text no watermark no signature no border,
Real-person live photography quality, 35mm full-frame photography texture

### Negative Avoidance Prompt

3D render, 3D modeling, CGI, Unreal Engine, Blender, PBR material, 8K modeling, game engine, cartoon, anime, 2D, illustration, hand drawn, painting,
plastic skin, wax face, silicone skin, airbrushed skin, perfect smooth skin, poreless, doll-like, mannequin,
symmetrical pose, mannequin pose, runway pose, model stance, military stance, exaggerated pose, action pose,
heavy makeup, dramatic makeup, makeup mask, foundation mask, fake lashes, colored contacts,
wig, fake hair, helmet hair, stiff hair, perfect hairline, CG hair strands,
brand new clothes, showroom clothes, stiff fabric, unrealistically clean, no wrinkles, mannequin clothes,
ancient style, period costume, Hanfu, xianxia, wuxia, Republican era, cyberpunk, sci-fi, Western fantasy, medieval,
text, watermark, signature, logo, border, frame

---

## X. Constraint Rules

### Mandatory

| # | Rule |
|---|---|
| R1 | After overlay, face must match base model — styling serves the face, does not obscure it |
| R2 | Makeup must fusion with real skin — foundation not mask-like, pore texture still visible, not AI-smooth |
| R3 | Hairstyle must present real hair texture — flyaways, root volume, frizzy ends, not wig not CG strands |
| R4 | Clothing must have real wearing traces — natural folds, fabric drape, not sample garment not brand new |
| R5 | Accessories must have daily wearing feel — conforming to body, with usetraces, not floating not embedded in skin |
| R6 | Must output four-angle studio series (close-up portrait + front + side + back full body) |
| R7 | Must specify "medium gray seamless backdrop paper #B0B0B0," prohibit adding scene environment |
| R8 | Must specify "four angles are continuous photographic records of the same styling shoot" |
| R9 | **Only output prompt** — do not output analysis process, quick reference tables, scheme comparison, or any non-prompt content |
| R10 | **Prohibit prop interaction** — do not include handheld items, props belong to independent assets |
| R11 | **Posture unchanged** — maintain base model stance, do not add any action/posture descriptions |
| R12 | **Prohibit scene/environment descriptions** — scenes belong to independent assets |
| R13 | L1 must decide based on scene→makeup intensity mapping: bare-skin level / daily level / occasion level / gala level |
| R14 | All derivative assets require a styling scheme — normally do not remain completely bare-faced and plain-clothed; at least enter daily level |

### Strictly Prohibited

| # | Strictly Prohibited |
|---|---|
| X1 | Strictly prohibit "3D render / 3D modeling / CG / PBR material / 8K modeling / UE engine / Blender" and all CG terminology |
| X2 | Strictly prohibit "2D hand-drawn / illustration / animation / anime" and all non-photographic media |
| X3 | Strictly prohibit "excessive smoothing / silicone face / wax mask / zero pores / AI-smooth skin" — real skin must exist under makeup |
| X4 | Strictly prohibit "wig / CG strands individually distinct / stiff neat hair / no flyaways" |
| X5 | Strictly prohibit "sample garment / brand new unwrinkled clothing / floating clothes / mannequin feel" |
| X6 | Strictly prohibit "model symmetrical stance / runway pose / military at attention / exaggerated movements" |
| X7 | Strictly prohibit "heavy makeup covering base model face to unrecognizable" |
| X8 | Strictly prohibit "ancient style / Hanfu / xianxia / wuxia / Republican era / cyberpunk / sci-fi / Western fantasy" and all non-contemporary urban attire |
| X9 | Strictly prohibit "exposure / see-through / vulgar / suggestive / violence and gore" |
| X10 | Strictly prohibit "watermark / text / LOGO / signature / border / AI generationtraces" |

