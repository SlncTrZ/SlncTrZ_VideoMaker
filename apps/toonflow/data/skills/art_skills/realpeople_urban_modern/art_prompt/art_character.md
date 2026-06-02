# Character Base Image Generation · Urban Realistic Constraint Manual

---

## I. Base Image Principles

1. **Face is Soul** — Features are the character's only anchor, pore-leveldelicate rendering
2. **Character First** — Base attire determined by character description (identity/occupation/gender/scene) for standard outfit; subsequent specific styling is a layering step
3. **Four-View Consistent** — Face/body/hairstyle/base clothing highly unified across views
4. **Natural Real** — Makeup-free state must stillreflecting character temperament (capable/gentle/cool/warm)
5. **Live Photography** — Anchored in real photography, retaining real skin texture (pores/minor imperfections)

---

## II. Face Constraints

> No longer fixing facial feature parameters; character description (gender/age/personality/temperament) drives AI to freely generate features, ensuring differentiation between characters.

### General Requirements

| Item | Constraint |
|---|---|
| Features | Naturally derived from character description, no preset face shape/eye shape/eyebrow shape/nose shape/lip shape |
| Style base | Real-person realistic photography, pore-leveldelicate rendering, realistic materials, natural light and shadow |
| Temperament | Must extract overall temperament keywords from character description (e.g. capable/gentle/cool/warm) and include in prompt |
| Expression | Neutral micro-expression, matching character temperament |

---

## III. Skin Texture Constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Skin tone | Natural skin tone, even across body, can be slightly fair/ slightly warm | Natural skin tone, even complexion |
| Luster | Natural luster, not matte not oily | Natural skin, healthy luster |
| Texture | Delicate, retaining subtly pore texture, can have minor imperfections | Delicate skin, micro-visible pores |
| Exposed skin | Face/neck/collarbone/hands/partial arms | Natural shoulder-neck lines, healthy skin |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Skin tone | Natural skin tone, can be slightly wheat, even across body | Natural skin tone, healthy complexion |
| Luster | Natural luster, fresh clean feel | Natural skin, fresh texture |
| Texture | Clean sharp, visible pores, can have fine imperfections | Real skin texture,clear pores |

---

## IV. Body Constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Height | Per character design setting, default range 155-175cm | {height}cm tall |
| Head-to-body ratio | 7-8 heads, strictly constrained full body proportions | 7-8 heads tall proportion |
| Shoulder-neck | Natural shoulder-neck line, visible collarbone | Natural shoulder-neck lines |
| Hands | Natural hand shape, normal knuckles, clean nails | Natural hands, slender fingers |
| Posture | Natural standing, relaxed posture | Natural posture, relaxed stance |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Height | Per character design setting, default range 170-185cm | {height}cm tall |
| Head-to-body ratio | 7.5-8.5 heads, strictly constrained full body proportions | 7.5-8.5 heads tall proportion |
| Shoulder-neck | Natural shoulders, strong neck | Natural shoulders, neck-shoulder lines |
| Hands | Natural hand shape, moderate palms, normal knuckles | Natural hands, slender fingers |
| Posture | Natural standing, upright posture | Upright posture, natural stance |

---

## V. Base Hairstyle Constraints

> Only defines natural loose/simple tied styles; hair accessories added in styling derivative step.

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Hair color | Natural color (black/dark brown), prohibit bleached/dyed | Natural hair color, dark brown |
| Length | Shoulder-length/waist-length or longer, per character design setting | Natural long hair, shoulder-length hair |
| Texture |clear strands, real texture | Distinct hair strands |
| Style | Natural loose, simple ponytail/half-up, no accessories | Natural hairstyle, no accessories |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Hair color | Natural color (black/dark brown), prohibit bleaching | Natural hair color, black/dark brown |
| Length | Short/mid-length, per character design setting | Short hair, shoulder-length mid-long hair |
| Texture |clear strands, real texture | Distinct hair strands |
| Style | Natural loose/simple tied, no accessories | Natural hairstyle, no accessories |

---

## VI. Base Clothing Constraints

> Base clothing determined by character description (identity/occupation/gender/scene) for the most natural standard outfit, as the character's "daily default state"; formal wear/special derivatives added in styling derivative step. **Prohibit underwear as base layer.**

### Outfit Selection Principles

| Character Role | Default Outfit Direction |
|---|---|
| Student | Modern school uniform / academic wear |
| Office worker | Business casual (shirt+trousers/skirt, suit) |
| Home/casual | Urban casual (hoodie/T-shirt+jeans/dress) |
| Fashion/date | Urban trendy attire |
| Special profession | Corresponding professional wear (doctor/police/teacher etc.) |
| Character description unclear | Urban daily wear, low saturation neutral tones |

### Unified Dressing Rules

- Outfit style must match urban realistic photography aesthetic (natural tones, realistic materials)
- Colors low saturation neutral, no complex patterns/decoration,for easy subsequent derivative layering
- Four-view clothing style fully consistent
- Base clothing is "daily default state," focus remains on face and posture
- Strictly prohibit underwear/exposure/sexualized base layer

---

## VII. Four-View Design Sheet Specifications

### View Definitions

| Position | View | Angle | Shot Size | Requirement | Prompt |
|---|---|---|---|---|---|
| Left 1 | Portrait close-up | Front eye level | Head to collarbone | Complete display from head to collarbone, face 60%+, featuresclear | portrait closeup, face detail, head to collarbone complete |
| Left 2 | Front view | Front 0° | Full body standing | Facing camera, arms natural, complete display from head to toe | front view, full body head to toe |
| Right 2 | Side view | Right 90° | Full body standing | Pure side profileclear, complete display from head to toe | side view, profile, full body head to toe |
| Right 1 | Back view | Back 180° | Full body standing | Back of head/back/hair ends/feetclear, complete display from head to toe | back view, rear view, full body head to toe |

### Frame Specifications

| Item | Constraint |
|---|---|
| Layout | Same frame left to right side-by-side four views |
| Background | Pure neutral gray #E8E8E8 |
| Stance | Natural standing, feet parallel slightly apart, arms naturally hanging |
| Full body display | Full body standing must be complete from head to toe, forbid cropping |
| Close-up display | Portrait close-up must be complete from head to collarbone, forbid cropping crown |
| Expression | Neutral micro-expression, matching character temperament |
| Lighting | Even soft light, front main light + bilateral fill, no hard shadows |
| Consistency | Four views' skin tone/body/hairstyle/face/base clothing fully consistent |
| Aspect ratio | Recommend 4:1 or 3:1 |

---

## VIII. Prompt Template

```
{male/female} character four-view design sheet, real-person realistic photography, urban realistic documentary, high contrast, ultimate detail,
character design sheet, character turnaround,
{feature characteristics derived from character description - naturally derived from description}, {overall temperament}, natural state,
{skin tone}, natural skin, healthy skin, delicate skin, micro-visible pores,
{height description, e.g.: 170cm tall, tall slender woman}, {head-to-body ratio, e.g.: 7.5 heads tall proportion}, {body description}, {posture description},
{hair color}{hair length}, distinct hair strands, {base style}, no accessories,
{role-appropriate standard attire, e.g.: modern school uniform/business casual/urban casual wear}, low saturation neutral colors, no complex patterns,
Same frame left to right side-by-side: portrait close-up + front view + side view + back view,
Portrait close-up complete display from head to collarbone, do not crop crown,
Full body standing complete display from head to toe, do not crop crown and feet,
Natural standing, pure neutral gray background, even soft light, no hard shadows,
Four-view consistency, delicate face rendering, delicate hair rendering, real skin texture
No text in the image
```


---

## IX. Constraint Rules

### Mandatory

| # | Rule |
|---|---|
| R1 | Must be "natural state" |
| R2 | Must declare appropriate standard attire as base clothing based on character description (e.g. student→uniform, office worker→business casual, home→urban casual); prohibit underwear as base layer |
| R3 | Must declare "no hair accessories, no accessories" |
| R4 | Must specify "pure neutral gray background" |
| R5 | Must specify "four-view consistency" |
| R6 | Full body standing must be complete from head to toe, forbid cropping |
| R7 | Must declare character height and constrain full body proportions via head-to-body ratio |
| R8 | Portrait close-up must be complete from head to collarbone, forbid cropping crown |
| R9 | Skin must retain real texture, no excessive smoothing |

### Strictly Prohibited

| # | Strictly Prohibited |
|---|---|
| X1 | Underwear/exposure/sexualized base layer; attireclear inconsistent with character description; overly complex patterns/decoration interfering with subsequent styling layering |
| X2 | Direct top hard light/direct bottom light/colored light |
| X3 | Excessive whitening/excessive smoothing to textureless |
| X4 | Complex scene background (must be pure gray background) |
| X5 | Exaggerated expression/dynamic posture |
| X6 | Full body standing cropping crown or feet, must be complete head to toe |
| X7 | Portrait close-up cropping crown, must be complete head to collarbone |
| X8 | Ignoring height and head-to-body ratio constraints |

