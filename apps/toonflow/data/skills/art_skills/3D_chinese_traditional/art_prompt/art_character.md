---
name: art_character
description: Character Base Image Generation · Constraint Manual
metaData: art_skills
---

# Character Base Image Generation · Constraint Manual

---

## I. Base Image Principles

1. **Design is the Soul** — Character design is the core anchor, Chinese traditional 3D styling, flowing lines
2. **Base Model is Foundation** — Base underlayer clothing + bare face, subsequent costume styling are all overlay layers
3. **Four-View Consistency** — Face/body type/hairstyle/base clothing highly consistent across views
4. **Classical Temperament** — Even without makeup, the character's temperament (elegant/gentle/heroic) must be conveyed

---

## II. Face Constraints

> Facial feature parameters are no longer fixed. AI freely generates features driven by character description (gender/age/personality/temperament), ensuring differentiation between characters.

### General Requirements

| Item | Constraint |
|---|---|
| Features | Naturally derived from character description, no preset face/eye/eyebrow/nose/lip shapes |
| Style Base | Chinese traditional 3D render, high-precision modeling, PBR materials, cinematic lighting |
| Temperament | Must extract overall temperament keywords from character description (e.g., elegant and gentle/refined and heroic/chivalrous tenderness) and write into prompt |
| Expression | Neutral micro-expression, fitting character temperament |

---

## III. Skin Texture Constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Skin Tone | Pink-white base, even all over, fair and luminous | Pink-white base, fair and luminous, 3D modeling skin tone |
| Glow | PBR material render, natural sheen, non-matte | PBR material render, natural sheen, soft texture |
| Texture | High-precision modeling, clear texture, soft edges | High-precision modeling, clear texture, soft edges |
| Exposed Skin | Face/neck/hands | Delicate hands, soft neck lines |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Skin Tone | Fair base, even all over, healthy texture | Fair base, healthy texture, 3D modeling skin tone |
| Glow | PBR material render, natural sheen | PBR material render, natural sheen, soft texture |
| Texture | High-precision modeling, clean and sharp | High-precision modeling, 3D render, soft |

---

## IV. Body Type Constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Height | Specified by character setting, default range 160-170cm | {height}cm tall, {height description such as: tall elegant woman} |
| Head-to-Body Ratio | 7 to 7.5 heads tall, classical proportion | 7 heads tall proportion, classical proportion |
| Shoulders & Neck | Swan neck, elegant shoulder-neck line | Swan neck, elegant shoulders and neck |
| Hands | Slender and fair, natural fingers | Slender and fair, natural fingers |
| Posture | Classical temperament, elegant and upright | Elegant posture, upright bearing |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Height | Specified by character setting, default range 175-185cm | {height}cm tall, {height description such as: tall imposing man} |
| Head-to-Body Ratio | 7 to 7.5 heads tall, classical proportion | 7 heads tall proportion, classical proportion |
| Shoulders & Neck | Broad shoulders, strong neck | Broad shoulders, strong neck |
| Hands | Defined knuckles, natural fingers | Defined knuckles, natural fingers |
| Posture | Refined and heroic, upright and proper | Heroic posture, upright bearing |

---

## V. Base Hairstyle Constraints

> Only defines natural hairstyles; hair accessories are added in the costume derivative stage.

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Hair Color | Ink black, no other colors allowed | Ink black long hair, jet black silk |
| Hair Length | Waist-length long hair | Hair reaching waist, long hair |
| Hair Texture | High-precision modeling, clear strands | High-precision modeling, clear strands |
| Style | Natural loose, no hair accessories | Long hair naturally falling, no hair accessories |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Hair Color | Ink black, no other colors allowed | Ink black long hair, jet black like ink |
| Hair Length | Shoulder-length or tied-up | Shoulder-length long hair, tied-up |
| Hair Texture | High-precision modeling, clear strands | High-precision modeling, clear strands |
| Style | Natural loose or half-tied, no crown | Long hair naturally falling, half-tied long hair |

---

## VI. Base Clothing Constraints

> No special constraints for base clothing. Female wears plain classical long dress, male wears plain classical long robe. Formal attire is added in the costume derivative stage.

### Female Base Clothing

Plain classical long dress, primarily basic colors, no patterned decorations.

### Male Base Clothing

Plain classical long robe, primarily basic colors, no patterned decorations.

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
| Left 1 | Portrait Closeup | Front, eye level | Top of head to collarbone | Full display from top of head to collarbone, face 60%+, features clear | portrait closeup、face detail |
| Left 2 | Front View | Front 0° | Full Body | Facing camera, arms naturally, full display from top of head to soles | front view、full body |
| Right 2 | Side View | Right 90° | Full Body | Pure side profile clear, full display from top of head to soles | side view、profile、full body |
| Right 1 | Back View | Rear 180° | Full Body | Back of head/back/hem/feet clear, full display from top of head to soles | back view、rear view、full body |

### Frame Specifications

| Item | Constraint |
|---|---|
| Layout | Four views side by side from left to right in one image |
| Background | Plain gray solid #B8B8B8 |
| Stance | Natural standing, feet parallel slightly apart, arms naturally at sides |
| Full Body Display | Full body figure must be fully captured from top of head to soles, no cropping |
| Closeup Display | Portrait closeup must be fully captured from top of head to collarbone, no cropping |
| Expression | Neutral micro-expression, fitting character temperament |
| Lighting | Even soft light, front key light + bilateral fill, no hard shadows |
| Consistency | Skin tone/body type/hairstyle/face/base clothing completely consistent across four views |
| Aspect Ratio | Recommended 4:1 or 3:1 |

---

## VIII. Prompt Template

{gender} character four-view design sheet, 3D render style, high-precision modeling, PBR materials, Chinese traditional 3D, cinematic lighting,
character design sheet, character turnaround,
{facial feature description derived from character description}, {overall temperament}, bare-faced state,
{skin tone}, PBR material render, 3D render translucent texture, high-precision modeling, rich light and shadow layers,
{height description e.g.: 165cm tall, tall elegant woman}, {head-to-body ratio e.g.: 7 heads tall proportion}, {body description}, {posture description},
{hair color}{hair length}, high-precision clear strands, {base style}, no hair accessories,
(female: plain classical long dress / male: plain classical long robe), basic colors, no patterned decoration,
Same image left to right side by side: portrait closeup + front view + side view + back view,
Portrait closeup from top of head to collarbone complete display, no cropping of top of head, head to collarbone complete,
Full body figure from top of head to soles complete display, full body head to toe, no cropping of top of head and feet,
Natural standing, plain gray solid background, even soft light, no hard shadows,
Four-view consistency, clear 3D ancient style modeling, clear high-precision modeling,
No text in the image


---

## IX. Constraint Rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Must be "bare-faced state" |
| R2 | Must declare base clothing (female: plain classical long dress; male: plain classical long robe) |
| R3 | Must declare "no hair accessories, no accessories" |
| R4 | Must specify "plain gray solid background" |
| R5 | Must specify "four-view consistency" |
| R6 | Full body figure must be fully displayed from top of head to soles, no cropping |
| R7 | Must declare character height and constrain body proportions via head-to-body ratio conversion (female default 160-170cm/7 heads, male default 175-185cm/7 heads) |
| R8 | Portrait closeup must be fully displayed from top of head to collarbone, no cropping of top of head |

### Prohibited

| No. | Prohibited |
|---|---|
| X1 | Any clothing/accessories/makeup beyond base clothing |
| X2 | Direct overhead hard light/direct bottom light/cool colored light |
| X3 | Excessive whitening to bloodless / grayish skin tone |
| X4 | Complex scene background (must be solid color) |
| X5 | Exaggerated expressions/dynamic poses |
| X6 | Full body figure cropping top of head or soles, must be fully captured from head to toe |
| X7 | Portrait closeup cropping top of head, must be fully captured from top of head to collarbone |
| X8 | Ignoring height and head-to-body ratio constraints; height must be clearly declared and reflected in body proportions through head-to-body ratio conversion |
