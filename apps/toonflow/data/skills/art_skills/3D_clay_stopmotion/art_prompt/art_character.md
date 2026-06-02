# Clay Stop-Motion Character Base Image Generation · Constraint Manual

---

## I. Base Image Principles

1. **Clay Texture is the Soul** — Surface visible hand-sculpting marks, finger impressions/clay texture clearly distinguishable
2. **3D Cartoon Base Model** — Base underlayer is simplified clay character form, subsequent costume styling are all overlay layers
3. **Four-View Consistency** — Face/body type/hairstyle/base clothing highly consistent across views
4. **Healing Atmosphere** — Even without makeup, the character's personality (soft/round/warm) must be conveyed

---

## II. Face Constraints

> Facial feature parameters are no longer fixed. AI freely generates features driven by character description (gender/age/personality/temperament), ensuring differentiation between characters.

### General Requirements

| Item | Constraint |
|---|---|
| Features | Naturally derived from character description, no preset face/eye/eyebrow/nose/lip shapes; overall maintain clay roundness (no sharp edges) |
| Style Base | Clay stop-motion animation, 3D cartoon render, matte clay texture, warm-toned lighting |
| Temperament | Must extract overall temperament keywords from character description (e.g., warm healing/steady reliable/lively warm) and write into prompt |
| Expression | Neutral micro-expression, fitting character temperament |

---

## III. Skin Texture Constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Skin Tone | Warm cream color, soft and even | Warm cream skin, soft skin tone |
| Glow | Matte clay texture, no highlights | Matte clay texture, matte clay texture |
| Texture | Clear clay texture, visible sculpting marks | Clay surface, hand-sculpting marks |
| Exposed Skin | Face/neck/hands | Skin warm, clay texture |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Skin Tone | Warm beige, soft and even | Warm beige skin, soft skin tone |
| Glow | Matte clay texture, no highlights | Matte clay texture, matte clay texture |
| Texture | Clear clay texture, visible finger impressions | Clay surface, clear hand marks |

---

## IV. Body Type Constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Height | Default 155-165cm, expressed through head-to-body ratio | {height}cm tall |
| Head-to-Body Ratio | 6 to 7 heads tall, big head small body | 6-7 heads tall, round proportion |
| Shoulders & Neck | Round shoulder line, no sharp angles | Round shoulders and neck, soft lines |
| Hands | Round fingers, simplified joints | Round small hands, simplified hand details |
| Posture | Soft curves, no aggressive posture | Soft posture, round curves |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Height | Default 170-180cm, expressed through head-to-body ratio | {height}cm tall |
| Head-to-Body Ratio | 6.5 to 7.5 heads tall | 6.5-7.5 heads tall, round proportion |
| Shoulders & Neck | Round broad shoulders, soft shoulders | Round shoulders, gentle shoulder line |
| Hands | Round palms, simplified knuckles | Round palms, simplified knuckles |
| Posture | Steady and generous, soft lines | Steady posture, round lines |

---

## V. Base Hairstyle Constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Hair Color | Warm brown, chestnut, dark brown and other natural shades | Warm brown long hair, chestnut hair |
| Hair Length | Shoulder-length or waist-length | Shoulder-length hair |
| Hair Texture | Clay sculpted, blocky hair bundles | Clay hairstyle, blocky hair bundles |
| Style | Naturally falling, simple tied, no complex hair accessories | Natural hair bundles, simple tied hair |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Hair Color | Warm brown, dark brown, black | Warm brown short hair, dark hairstyle |
| Hair Length | Short or medium-long hair | Short hair, medium-long hair |
| Hair Texture | Clay sculpted, blocky hair bundles | Clay hairstyle, blocky hair bundles |
| Style | Naturally falling, simple tied | Natural hair bundles, simple hairstyle |

---

## VI. Base Clothing Constraints

> Base clothing is simplified form, no complex details.

### Female Base Clothing

Simplified dress or top+skirt, low saturation warm tones, no patterned decoration.

### Male Base Clothing

Simplified shirt+pants, low saturation warm tones, no patterned decoration.

### Attire Uniform Rules

- Clothing style unified, ensuring no color interference for subsequent clothing layering
- Basically covering except face/hands/neck
- Four-view clothing style completely consistent
- Base clothing is only a safe base layer, focus on face and body

---

## VII. Four-View Character Sheet Specifications

### View Definitions

| Position | View | Angle | Framing | Requirement | Prompt |
|---|---|---|---|---|---|
| Left 1 | Portrait Closeup | Front, eye level | Top of head to collarbone | Face 60%+, features clear | portrait closeup、face detail |
| Left 2 | Front View | Front 0° | Full Body | Facing camera, full from head to toe | front view、full body |
| Right 2 | Side View | Right 90° | Full Body | Side profile clear, full from head to toe | side view、profile、full body |
| Right 1 | Back View | Rear 180° | Full Body | Back of head/back/hem/feet clear | back view、rear view、full body |

### Frame Specifications

| Item | Constraint |
|---|---|
| Layout | Four views side by side from left to right in one image |
| Background | Clean neutral gray #E8E8E8 |
| Stance | Natural standing, feet parallel slightly apart, arms naturally at sides |
| Full Body Display | Full body figure must be fully captured from head to toe, no cropping |
| Closeup Display | Portrait closeup must be fully captured from top of head to collarbone, no cropping |
| Expression | Neutral micro-expression, fitting character personality |
| Lighting | Warm soft light, front key light + bilateral fill, no hard shadows |
| Consistency | Skin tone/body type/hairstyle/face/base clothing completely consistent across four views |
| Aspect Ratio | Recommended 4:1 or 3:1 |

---

## VIII. Prompt Template

```
Clay stop-motion {gender} character four-view design sheet, stop-motion style, 3D cartoon render, warm-toned lighting,
character design sheet, character turnaround,
{facial feature description derived from character description, overall maintain clay roundness}, {overall temperament},
{skin tone}, matte clay texture, clear clay texture, hand-sculpting marks,
{height description}, {head-to-body ratio e.g.: 7 heads tall proportion}, {body description}, {posture description},
{hair color}{hair length}, clay hairstyle, {base style}, no complex hair accessories,
(female: simplified dress / male: simplified shirt+pants), low saturation warm tones, no patterns,
Same image left to right side by side: portrait closeup + front view + side view + back view,
Portrait closeup from top of head to collarbone complete display, head to collarbone complete,
Full body figure from top of head to soles complete display, full body head to toe,
Natural standing, clean neutral gray background, warm soft light, no hard shadows,
Four-view consistency, delicate clay texture rendering, soft healing expression
No text in the image
```

---

## IX. Constraint Rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Must be "matte clay texture" state |
| R2 | Must declare base clothing (female: simplified dress; male: simplified shirt+pants) |
| R3 | Must declare "no complex hair accessories, no modern accessories" |
| R4 | Must specify "clean neutral gray background" |
| R5 | Must specify "four-view consistency" |
| R6 | Full body figure must be fully displayed from head to toe, no cropping |
| R7 | Must specify character height and constrain body proportions via head-to-body ratio (default 6-7 heads) |
| R8 | Portrait closeup must be fully displayed from top of head to collarbone, no cropping |

### Prohibited

| No. | Prohibited |
|---|---|
| X1 | Realistic photography texture/photorealistic |
| X2 | Cold hard lighting/hard shadows/high contrast |
| X3 | Sharp angles/aggressive posture |
| X4 | Complex scene background (must be pure gray) |
| X5 | Exaggerated expressions/dynamic poses |
| X6 | Full body figure cropping top of head or soles |
| X7 | Portrait closeup cropping top of head |
| X8 | Ignoring height and head-to-body ratio constraints |
