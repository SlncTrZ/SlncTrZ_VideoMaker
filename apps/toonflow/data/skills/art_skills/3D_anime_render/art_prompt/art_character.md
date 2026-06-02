# art_character_3d.md
# 3D Anime Character Base Image Generation · Constraint Manual

---

## I. Base Image Principles

1. **Face is the Soul** — Facial features are the character's sole anchor, cel-level fine rendering
2. **Character First** — Base attire is determined by character description (identity/occupation/gender/scene) for their regular clothing; subsequent costuming is a layering
3. **Four-View Consistency** — Face/body type/hairstyle/base clothing are highly consistent across all views
4. **Warm & Healing** — Even without makeup, the character's temperament (cheerful/gentle/energetic) must be conveyed

---

## II. Face Constraints

> Facial feature parameters are no longer fixed. AI freely generates features driven by character description (gender/age/personality/temperament), ensuring differentiation between characters.

### General Requirements

| Item | Constraint |
|---|---|
| Features | Naturally derived from character description, no preset face/eye/eyebrow/nose/lip shapes |
| Style Base | 3D cel-shaded animation render, warm color palette, cartoon proportions, joyful healing atmosphere |
| Temperament | Must extract overall temperament keywords from character description (e.g., warm/energetic/healing/sunny) and write into prompt |
| Expression | Neutral micro-expression, fitting character temperament |

---

## III. Skin Texture Constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Skin Tone | Warm fair skin, even all over, luminous | Warm fair skin, peach skin, peach skin |
| Glow | Soft glow skin, inner glow, non-matte | Soft glow skin, inner glow, soft glow |
| Texture | Delicate smooth, cel-shaded render texture | Delicate skin, cel-shaded texture |
| Exposed Skin | Face/neck/collarbone/hands | Elegant shoulder and neck lines, skin warm and luminous |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Skin Tone | Warm beige, healthy look, even all over | Warm beige, healthy skin tone |
| Glow | Fresh soft glow, natural sheen | Soft glow skin, skin fresh and clear |
| Texture | Clean delicate, cel-shaded sheen | Delicate skin texture, fresh complexion |

---

## IV. Body Type Constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Height | Specified by character setting, default range 155-165cm | {height}cm tall, {height description such as: petite girl} |
| Head-to-Body Ratio | 6-7 heads tall, head-body ratio = height ÷ head length | 6-7 heads tall proportion, petite figure |
| Height Conversion | Head length = height ÷ head ratio (e.g. 160cm ÷ 6.5 = 24.6cm head length) | Cute proportion, coordinated head-body ratio |
| Shoulders & Neck | Smooth shoulders and neck, flowing lines | Smooth shoulder line, elegant neck |
| Hands | Small rounded, soft knuckles | Rounded small hands, distinct knuckles |
| Posture | Energetic girl, light physique | Light posture, agile bearing |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Height | Specified by character setting, default range 170-180cm | {height}cm tall, {height description such as: tall cute boy} |
| Head-to-Body Ratio | 6.5-7.5 heads tall, head-body ratio = height ÷ head length | 6.5-7.5 heads tall proportion, well-proportioned figure |
| Height Conversion | Head length = height ÷ head ratio (e.g. 175cm ÷ 7 = 25cm head length) | Cute proportion, coordinated head-body ratio |
| Shoulders & Neck | Rounded shoulders, natural neck | Rounded shoulders, natural neck line |
| Hands | Rounded palms, soft knuckles | Rounded palms, distinct knuckles |
| Posture | Sunny boy / Gentle senior (per character) | Straight posture, sunny demeanor |

### Height-to-Head Ratio Reference

| Height (cm) | Head Ratio | Head Length (cm) | Applicable Description |
|---|---|---|---|
| 150-155 | 6.0 | ~25cm | Petite and cute |
| 155-160 | 6.0-6.5 | ~25cm | Sweet and petite |
| 160-165 | 6.5 | ~24.6cm | Fresh girl (female default) |
| 165-170 | 6.5-7.0 | ~25cm | Slender girl |
| 170-175 | 7.0 | ~25cm | Handsome boy |
| 175-180 | 7.0-7.5 | ~25cm | Sunny boy (male default) |
| 180-185 | 7.5 | ~25cm | Handsome and tall |

---

## V. Base Hairstyle Constraints

> Only defines natural loose hair / simple tied hair. Hair accessories are added in the costume derivative stage.

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Hair Color | Warm brown / light chestnut / chocolate | Warm brown long hair, chestnut like gold |
| Hair Length | Shoulder-length or long hair | Hair reaching shoulders |
| Hair Texture | Each strand distinct, silky clear, cel-shaded texture | Each hair strand distinct, delicate hair rendering |
| Style | Natural loose, middle/side part, no hair accessories | Long hair naturally falling, smooth like a waterfall |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Hair Color | Warm brown / dark coffee | Dark brown short hair, coffee-colored hair |
| Hair Length | Short to medium-long hair | Short hair, ear-length short hair |
| Hair Texture | Each strand distinct, clear texture | Each hair strand distinct, delicate hair rendering |
| Style | Natural loose or side part, no hair accessories | Short hair naturally falling, side-parted style |

---

## VI. Base Clothing Constraints

> Base clothing is determined by the character description (identity/occupation/gender/scene) to find their most natural regular attire, serving as the character's "daily default state"; formal wear / special derivatives are added in the costume derivative stage. **No underwear as base layer**.

### Attire Selection Principles

| Character Identity | Default Attire Direction |
|---|---|
| Student | School uniform / Academy wear |
| Office Worker | Business casual (shirt + pants/skirt, light blazer) |
| Home/Casual | Urban casual (hoodie/t-shirt + pants/dress) |
| Energetic/Lively | Sportswear / Modified school uniform |
| Special Occupation | Occupation-appropriate clothing (doctor/police/teacher etc.) |
| Role Description Unclear | Urban daily wear, warm color palette |

### Attire Uniform Rules

- Clothing style must align with 3D anime cel-shaded render aesthetic (warm color palette, cartoon proportions)
- Colors mainly warm tones, no complex patterns/ornaments, easy for subsequent derivative layering
- Four-view clothing style completely consistent
- Base clothing is "daily default state," focus remains on face and body
- No underwear/exposure/sexualized base

---

## VII. Four-View Character Sheet Specifications

### View Definitions

| Position | View | Angle | Framing | Requirement | Prompt |
|---|---|---|---|---|---|
| Left 1 | Portrait Closeup | Front, eye level | Top of head to collarbone | Full display from top of head to collarbone without cropping, face 60%+, features clear | portrait closeup、face detail、head to collarbone complete、no crop |
| Left 2 | Front View | Front 0° | Full Body | Facing camera, arms naturally at sides, full display from top of head to soles | front view、full body head to toe、height mark |
| Right 2 | Side View | Right 90° | Full Body | Pure side profile clear, full display from top of head to soles | side view、profile、full body head to toe、height mark |
| Right 1 | Back View | Rear 180° | Full Body | Back of head/back/hem/feet clear, full display from top of head to soles | back view、rear view、full body head to toe、height mark |

### Frame Specifications

| Item | Constraint |
|---|---|
| Layout | Four views side by side from left to right in one image |
| Background | Clean neutral gray #E8E8E8 |
| Stance | Natural standing, feet parallel slightly apart, arms naturally at sides or slightly extended |
| Full Body Display | Full body figure must be fully captured from top of head to soles, no cropping of head or feet |
| Closeup Display | Portrait closeup must be fully captured from top of head to collarbone, no cropping of top of head, hair/forehead/chin must all be complete |
| Expression | Neutral micro-expression, fitting character temperament |
| Lighting | Even soft light, front key light + bilateral fill, no hard shadows |
| Consistency | Skin tone/body type/hairstyle/face/base clothing completely consistent across four views |
| Aspect Ratio | Recommended 4:1 or 3:1 |

---

## VIII. Prompt Template

```
{gender} character four-view design sheet, 3D animation render, cinematic lighting, vibrant cel-shaded texture, high-detail materials, joyful healing atmosphere, cartoon urban style, high-detail cartoon materials, moderate cartoon proportions, warm color palette, 8K ultra HD, cinematic composition, soft light and shadow layers, bright cartoon render style, warm and healing,
character design sheet，character turnaround，
{facial feature description derived from character description}，{overall temperament}，bare-faced no makeup，
{skin tone}，soft glow skin, skin translucent and luminous, delicate skin, cel-shaded texture，
{height description e.g.: 165cm tall, petite cute girl}，{head-to-body ratio e.g.: 6.5 heads tall proportion}，{body description}，{posture description}，
{hair color}{hair length}，each hair strand distinct，{base style}，no hair accessories，
{character identity-appropriate regular attire e.g.: school uniform / business casual / urban casual}，warm tones, no complex patterns，
same image left to right side by side: portrait closeup + front view + side view + back view，
portrait closeup from top of head to collarbone complete display, no cropping of top of head, head to collarbone complete，
full body figure from top of head to soles complete display, full body head to toe, no cropping of top of head and feet，
natural standing, clean neutral gray background, even soft light, no hard shadows，
four-view consistency, delicate face rendering, delicate hair rendering
no text in the image
```


---

## IX. Constraint Rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Must be "bare-faced, no makeup" |
| R2 | Must declare appropriate regular attire based on character description as base clothing (e.g. student→school uniform, office worker→business casual, home→urban casual); no underwear as base layer |
| R3 | Must declare "no hair accessories, no accessories" |
| R4 | Must specify "clean neutral gray background" |
| R5 | Must specify "four-view consistency" |
| R6 | Full body figure must be fully displayed from top of head to soles, no cropping |
| R7 | Must declare character height and constrain body proportions via head-to-body ratio conversion (female default 155-165cm/6-7 heads, male default 170-180cm/6.5-7.5 heads) |
| R8 | Portrait closeup must be fully displayed from top of head to collarbone, no cropping of top of head |

### Prohibited

| No. | Prohibited |
|---|---|
| X1 | Underwear/exposure/sexualized base; attire clearly inconsistent with character description; overly complex patterns/ornaments interfering with subsequent costume layering |
| X2 | Direct overhead hard light/direct bottom light/colored light |
| X3 | Excessive whitening to bloodless / grayish skin tone |
| X4 | Complex scene background (must be pure gray) |
| X5 | Exaggerated expressions/dynamic poses |
| X6 | Full body figure cropping top of head or soles, must be fully captured from head to toe |
| X7 | Portrait closeup cropping top of head, must be fully captured from top of head to collarbone |
| X8 | Ignoring height and head-to-body ratio constraints; height must be clearly declared and reflected in body proportions through head-to-body ratio conversion |
