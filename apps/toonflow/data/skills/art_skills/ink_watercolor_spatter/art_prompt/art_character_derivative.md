---
name: art_character_derivative
description: Character Derivative Generation · Ink and Watercolor Spatter Constraint Manual
metaData: art_skills
---

# Character Derivative Generation · Ink and Watercolor Spatter Constraint Manual

---

## I. Derivative Principles

1. **Ink Wash Face Unchanged** — Facial brush strokes identical to base, no facial drift, same ink dot eyes
2. **Pose Unchanged** — Maintain base model's organic ink-wash stance, no action/posture changes
3. **Wash Layer Control** — Each derivative layer as independent watercolor wash for easy layer replacement
4. **Style Uniformity** — All costume variants follow ink-wash aesthetic — bleeding edges, brush stroke drape, watercolor blooms
5. **Texture Not Degraded** — Wash texture after overlay not lower than base model
6. **Pure Costume Scope** — Only overlay makeup/hairstyle/clothing/accessories; no props, scenes, or actions

---

## II. Expression Derivative Table

| Emotion | Ink-Wash Expression | Prompt Keywords |
|---|---|---|
| Joy | Slight upward brush at mouth corners, watercolor bloom on cheeks (C10) | gentle smile, brush stroke joy, C10 blush bloom |
| Sadness | Drooping ink brows, watercolor tear pooling, wash fade at eyes | melancholic gaze, watercolor tear, ink wash sorrow |
| Anger | Sharp calligraphy brows, heavy C1 ink outline, red wash (C3) at eyes | sharp ink brows, C3 anger wash, heavy sumi-e line |
| Surprise | Wide ink dot eyes, watercolor splash around iris, raised brush brows | wide ink eyes, watercolor splash, raised stroke brows |
| Contemplation | Half-closed ink eyes, faint wash face, loose brush contour | meditative gaze, faint ink wash, loose contour |
| Serenity | Gentle ink line smile, even watercolor skin wash, calm brush posture | serene expression, even wash, calm brush stroke |

---

## III. Costume Derivative Table

| Variant Type | Ink-Wash Approach | Prompt Keywords |
|---|---|---|
| Formal/Ceremonial | Heavy C3 vermillion wash robe, gold leaf C9 accents, bold C1 calligraphy hemlines | vermillion wash robe, C3+C9, gold leaf accent, bold sumi-e hem |
| Combat/Action | Dry brush texture robe, C4 indigo wash, ink splatter at hems, torn edge bleeding | dry brush robe, C4 indigo, ink splatter hem, torn wash edge |
| Casual/Daily | Light C8 pale wash drape, minimal C1 outline, watercolor bloom folds | pale ink wash robe, C8, minimal contour, watercolor folds |
| Fantasy/Spiritual | C7 plum purple wash with C6 jade green bloom, ink drip patterns | plum wash robe, C7+C6, ink drip pattern, watercolor bloom |
| Seasonal | Cherry blossom C10 pink wash with C5 ochre accents, petal spatter | blossom wash robe, C10+C5, petal spatter, spring ink |
| Ceremonial/Mourning | Heavy C1 ink black wash, white C2 dry brush texture, C8 pale fade hem | ink black robe, C1 dry brush, C2 white wash fade, solemn |

---

## IV. Prompt Template

### Full Costume Overlay (Four-View)

Using the character base image as reference, img2img overlay costume and makeup,
ink and watercolor spatter style, neo-traditional ink-wash, sumi-e portrait, watercolor bleeding edges, expressive calligraphic lines,
{gender} character four-view character sheet, ink wash style,
keep base face unchanged, {overall temperament},
【L1·Makeup】{facial expression}, ink dot eyes, watercolor skin wash, {emotion-specific wash},
【L2·Hairstyle】{style}, watercolor wash gradient, brush stroke strands, ink drip ends,
【L3+L4·Clothing】{variant type}, {wash color} watercolor fill, C1 ink hemline, {texture description}, loose drape,
【L5·Accessories】{accessory type}, watercolor bloom, brush stroke detail,
same frame left to right: portrait close-up + front view + side view + back view,
natural standing, rice paper textured background {C2}, ink wash consistency,
four-view consistency, clear ink wash styling, watercolor spatter accents,
no text in the image

---

## V. Constraint Rules

### Mandatory

| Number | Rule |
|---|---|
| R1 | Face after overlay consistent with base — same brush stroke identity |
| R2 | Clothing must use "watercolor wash fill" + "loose C1 ink outline" |
| R3 | Makeup must be "watercolor bloom" not digital pigment |
| R4 | Must output four-view character sheet on rice paper background |
| R5 | Must specify "ink wash consistency" across views |
| R6 | **No scene descriptions** — character derivatives avoid environment narrative |
| R7 | **No prop interaction** — no handheld items |
| R8 | **Pose remains unchanged** — maintain organic ink-wash stance |

### Prohibited

| Number | Prohibition |
|---|---|
| X1 | Facial drift after overlay |
| X2 | Digital shading or airbrush texture |
| X3 | Solid flat backgrounds without paper grain |
| X4 | Inconsistent wash intensity across four views |
| X5 | Sharp perfect edges without ink bleed or brush variation |
| X6 | Prop interaction (swords/fans/umbrellas) in character derivative |
| X7 | Pose changes from base model |
| X8 | Modern or fitted clothing contradicting ink-wash flowing drape |
