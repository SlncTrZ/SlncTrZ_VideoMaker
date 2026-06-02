# Character Base Image Generation · Constraint Manual

---

## I. Base Image Principles

1. **Face is Soul** — Facial features are the character's only anchor point, pore-leveldelicate rendering
2. **Character-First** — Base attire is determined by character description (identity/occupation/gender/scene) as their regular wear; subsequent specific styling as overlay layers
3. **Four-View Consistent** — Face/body type/hairstyle/base clothing highly unified across views
4. **Cool and Subtle** — Makeup-free state still needs to reflect character temperament (cool/warm/charming)

---

## II. Face Constraints

> No longer fixed facial feature parameters; driven by character description (gender/age/personality/temperament) for AI to freely generate facial features, ensuringappearance differentiation between characters.

### General Requirements

| Item | Constraint |
|---|---|
| Facial features | Naturally deduced from character description, no preset face shape/eye shape/brow shape/nose shape/lip shape |
| Style base | Ancient real-person realistic photography, pore-leveldelicate rendering, natural lighting, physical light and shadow |
| Temperament | Must extract overall temperament keywords from character description (e.g. cool/warm/charming/heroic) and write into prompt |
| Expression | Neutral micro-expression, conforming to character temperament |

---

## III. Skin Constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Skin tone | Cool fair skin, even all over, translucent pale | Cool fair skin, milk skin, milky white skin |
| Luster | Glossy skin, inner glow, non-matte non-oily | Glossy skin, luminous skin, dewy skin |
| Texture | Delicate, retain micro-pore texture | Delicate skin, pores subtly visible |
| Exposed skin | Face/neck/collar bone/hands | Elegant shoulder and neck lines, fair translucent skin |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Skin tone | Fair translucent, healthy feel, even all over | Fair translucent skin, cream skin |
| Luster | Fresh glossy, natural luster | Glossy skin, translucent fresh skin |
| Texture | Clean neat, visible pores | Delicate skin texture, clear face |

---

## IV. Body Type Constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Height | Specified by character setting, default range 160-170cm, height expressed through head-to-body ratio conversion | {height}cm tall, {height description e.g. tall slender woman} |
| Head-to-body ratio | 7 to 8 heads tall, head-to-body ratio = height ÷ head length, strictly constrain full bodyproportion | 7-8 heads tall proportion, slender figure |
| Height conversion | Head length = height ÷ head-to-body ratio (e.g. 165cm ÷ 7.5 = 22cm head length), accordingly constrain head and body segment proportions | Well-proportioned, harmonious head-to-body ratio |
| Shoulders and neck | Swan neck, elegant shoulder-neck line | Swan neck, elegant shoulders and neck |
| Hands | Slender fair, clear knuckles, five fingers normal | Slender fair hands, clear knuckles |
| Body posture | Classical lady, reserved dignified | Dignified posture, elegant bearing |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Height | Specified by character setting, default range 175-185cm, height expressed through head-to-body ratio conversion | {height}cm tall, {height description e.g. tall imposing man} |
| Head-to-body ratio | 7.5 to 8.5 heads tall, head-to-body ratio = height ÷ head length, strictly constrain full bodyproportion | 7.5-8.5 heads tall proportion, tall figure |
| Height conversion | Head length = height ÷ head-to-body ratio (e.g. 180cm ÷ 8 = 22.5cm head length), accordingly constrain head and body segment proportions | Well-proportioned, harmonious head-to-body ratio, broad shoulders narrow waist |
| Shoulders and neck | Broad shoulders, powerful neck | Broad shoulders narrow waist |
| Hands | Clear knuckles, wide palms, five fingers normal | Clear finger knuckles |
| Body posture | Warrior/scholar posture (per character) | Straight posture, composed bearing |

### Height-Head-to-Body Ratio Conversion Reference

| Height (cm) | Head-to-Body Ratio | Head Length (cm) | Applicable Description |
|---|---|---|---|
| 155-160 | 7.0 | ~22cm | Petite delicate |
| 160-165 | 7.0-7.5 | ~22cm | Slim slender |
| 165-170 | 7.5 | ~22cm | Tall elegant (female default) |
| 170-175 | 7.5-8.0 | ~22cm | Slender straight |
| 175-180 | 8.0 | ~22.5cm | Tall heroic (male default) |
| 180-185 | 8.0-8.5 | ~22cm | Towering straight |
| 185-190 | 8.5 | ~22cm | Tall powerful |

---

## V. Base Hairstyle Constraints

> Only defines natural loose hair/simple binding; hair accessories added in styling derivative stage.

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Hair color | Pure black, no brown/highlights | Black long hair, ink hair like waterfall |
| Hair length | Waist-length or longer | Waist-length long hair |
| Hair quality | Every strand distinct, clear silk texture | Hair strands distinctly visible, delicate hair rendering |
| Style | Natural loose, center/side part, no hair accessories | Long hair naturally loose, black hair like waterfall |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Hair color | Pure black or ink color | Ink hair, black hair like ink |
| Hair length | Medium-long to long hair | Long hair, shoulder-length long hair |
| Hair quality | Every strand distinct, clear texture | Hair strands distinctly visible, delicate hair rendering |
| Style | Natural loose or half-tied, no hair crown | Long hair naturally loose, half-tied long hair |

---

## VI. Base Clothing Constraints

> Base clothing is determined by character description (identity/dynasty/occupation/scene) as their most natural regular attire, serving as the character's "daily default state"; formal attire/special derivatives added in styling derivative stage. **Underwear as base layer prohibited**.

### Attire Selection Principles

| Character Identity | Default Attire Direction |
|---|---|
| Lady/miss | Plain colored ancient long skirt (soft flowing) |
| Gentleman/scholar | Plain colored ancient long gown |
| Warrior/knight | Light combat wear / battle robe casual |
| Commoner/street | Simple short jacket / coarse cloth skirt |
| Palace maid/servant | Simple palace attire / maid costume |
| Character description unclear | Plain colored ancient casual wear (long skirt/long gown matched by gender) |

### Attire Uniform Rules

- Clothing style must be consistent with ancient real-person realistic aesthetic (Chinese traditional colors, realistic materials)
- Low saturation colors, no complex patterns/decorations,for easy subsequent derivative overlay
- Four views clothing style fully identical
- Base clothing is "daily default state", focus remains on face and body posture
- Underwear/revealing/sexualized base layer prohibited

---

## VII. Four-View Sheet Specification

### View Definitions

| Position | View | Angle | Shot Size | Requirement | Prompt |
|---|---|---|---|---|---|
| Left 1 | Portrait closeup | Front eye level | Top of head to collarbone | From top of head to collarbonecomplete display without cropping, face 60%+, facial features clear | portrait closeup, face detail, head to collarbone complete, no crop |
| Left 2 | Front view | Front 0° | Full body standing | Facing camera, arms natural, from top of head to solescomplete display | front view, full body head to toe, height mark |
| Right 2 | Side view | Right 90° | Full body standing | Pure side outline clear, from top of head to solescomplete display | side view, profile, full body head to toe, height mark |
| Right 1 | Back view | Rear 180° | Full body standing | Back of head/back/hair ends/feet clear, from top of head to solescomplete display | back view, rear view, full body head to toe, height mark |

### Frame Specifications

| Item | Constraint |
|---|---|
| Layout | Same frame left to right side-by-side four views |
| Background | Pure neutral gray #E8E8E8 |
| Standing posture | Natural standing, feet parallel slightly apart, arms naturally hanging or slightly extended |
| Full body display | Full body standing mustcomplete frame from top of head to soles, strictly prohibit cropping top of head or feet |
| Closeup display | Portrait closeup mustcomplete frame from top of head to collarbone, strictly prohibit cropping top of head, hair, forehead, chin all must be complete |
| Expression | Neutral micro-expression, conforming to character temperament |
| Lighting | Even soft light, front main light + bilateral fill light, no hard shadows |
| Consistency | Four views' skin tone/body type/hairstyle/face/base clothing completely identical |
| Aspect ratio | Recommended 4:1 or 3:1 |

---

## VIII. Prompt Template

```
{gender} character four-view sheet, real-person realistic photography, ancient realistic documentary, high contrast, ultimate detail,
character design sheet, character turnaround,
{facial features corresponding to character description - naturally deduced from character description}, {overall temperament}, makeup-free natural,
{skin tone}, glossy skin, translucent luminous skin, delicate skin, pores subtly visible,
{height description e.g. 170cm tall, tall slender woman}, {head-to-body ratio e.g. 7.5 heads tall proportion}, {body description}, {posture description},
{hair color}{hair length}, hair strands distinctly visible, {base style}, no hair accessories,
{regular ancient attire corresponding to character identity e.g. plain colored long skirt/plain colored long gown/light combat wear/coarse short jacket}, Chinese traditional colors low saturation, no complex patterns,
Same frame left to right side-by-side: portrait closeup + front view + side view + back view,
Portrait closeup from top of head to collarbonecomplete display, no cropping top of head, head to collarbone complete,
Full body standing from top of head to solescomplete display, full body head to toe, no cropping top of head or feet,
Natural standing, pure neutral gray background, even soft light, no hard shadows,
Four-view consistency, delicate face rendering, delicate hair rendering
No text in the image
```

---

## IX. Constraint Rules

### Mandatory

| # | Rule |
|---|---|
| R1 | Must be "makeup-free natural" state |
| R2 | Must declare appropriate regular ancient attire as base clothing based on character description (e.g. lady→plain colored long skirt, scholar→plain colored long gown, warrior→light combat wear); underwear as base layer prohibited |
| R3 | Must declare "no hair accessories, no accessories" |
| R4 | Must specify "pure neutral gray background" |
| R5 | Must specify "four-view consistency" |
| R6 | Full body standing mustcomplete display from top of head to soles, strictly prohibit cropping |
| R7 | Must declare character height and constrain full body proportions through head-to-body ratio conversion (female default 160-170cm/7-8 heads, male default 175-185cm/7.5-8.5 heads) |
| R8 | Portrait closeup mustcomplete display from top of head to collarbone, strictly prohibit cropping top of head |

### Strictly Prohibited

| # | Strictly Prohibited |
|---|---|
| X1 | Underwear/revealing/sexualized base layer; attireclear inconsistent with character description; overly complex patterns/decorations interfering with subsequent styling overlay |
| X2 | Direct top hard light/direct bottom light/colored light |
| X3 | Overly whitened to bloodless / skin tone gray |
| X4 | Complex scene background (must be pure gray background) |
| X5 | Exaggerated expression/dynamic posture |
| X6 | Full body standing cropping top of head or feet; mustcomplete frame from head to toe |
| X7 | Portrait closeup cropping top of head; mustcomplete frame from top of head to collarbone |
| X8 | Ignoring height and head-to-body ratio constraints; height must be clearly stated and reflected in full body proportions through head-to-body ratio conversion |
