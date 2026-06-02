# Anime Prop Derivative State Generation · Constraint Manual

---

## I. Derivative Principles

1. **Shape Anchored** — Prop's core shape/outline recognizable across all states
2. **State Readable** — State differences must be immediately obvious, viewers can instantly distinguish
3. **Narrative Service** — Each state variant serves a specific story beat
4. **Gradual Degradation** — Damage/aging states should follow reasonable physical logic
5. **Pure Prop Independent Display** — Only the prop itself may appear in the frame; no people, hands, or limbs allowed; props must not be in a held/worn/grasped state; must be presented independently as still life arrangement

---

## II. State Types

### 2.1 Usage States

| State | Description | Applicable Props | Prompt Keywords |
|---|---|---|---|
| Brand New | Intact, like-new luster | All props | Brand new, intact, like-new luster |
| Daily Use | Light wear, natural patina | Office supplies/utensils/personal items | Daily use marks, natural wear |
| Aged | Clear signs of age, dull color | Daily utensils/personal items | Old mottled, aged look, dull color |

### 2.2 Damage States

| State | Description | Applicable Props | Prompt Keywords |
|---|---|---|---|
| Minor Damage | Small cracks/chips/light wear | Glass/phone screen/notebook | Fine cracks, slight chips |
| Damaged | Clear cracks/breaks/shattering | Glass/ceramic/plastic | Clear cracks, shattered, broken |
| Fragment | Only parts remaining/shattered | Glass/ceramic/token | Fragment, shards, only half remaining |

### 2.3 Special States

| State | Description | Applicable Props | Prompt Keywords |
|---|---|---|---|
| Stain | Stain residue/liquid residue | Cup/clothing/paper | Stain residue, liquid marks |
| Fingerprint | Fingerprint, use marks | Phone screen/glass/metal surface | Clear fingerprints, use marks |
| Wear | Edge wear, paint chipping | Electronic devices/furniture/accessories | Edge wear, paint chip marks |
| Folded | Book/paper fold marks | Book/paper/token | Fold marks, clear creases |
| Water Stain | Water stain, wet reflection | Paper/clothing/fabric | Water stain residue, wet reflection |

---

## III. State Variant Image Specifications

### Single State Image

| Item | Constraint |
|---|---|
| Background | Pure neutral gray `#E8E8E8` (same as design sheet) |
| Lighting | Even lighting, no hard shadows |
| Angle | Consistent with front view of original design sheet |
| Proportion | Prop occupies 70%+ of frame |

### State Comparison Image

| Item | Constraint |
|---|---|
| Layout | 2-3 states displayed side by side in one frame |
| Label | State name labeled below each state |
| Consistency | Angle/lighting/background completely consistent, only state differs |

---

## IV. Material State Change Rules

| Material | Brand New → Daily | Daily → Aged | Damage Manifestation |
|---|---|---|---|
| Metal | Bright luster → micro-scratches | Scratches → oxidation spots | Notches/curling/breakage |
| Glass | Clear translucent → micro-scratches | Scratches → cracks/shattering | Cracks/shattering/chips |
| Wood | New wood grain → natural patina | Patina → dull color | Cracking/insect damage/wear |
| Plastic | Brand new smooth → micro-scratches | Scratches → aging discoloration | Cracks/deformation/fading |
| Paper | Brand new flat → micro-creases | Creases → yellowing brittle | Tears/char damage/stains |
| Ceramic | Glaze luster → micro-scratches | Scratches → dull glaze | Cracks/shattering/chips |

---

## V. Prompt Template

### Single State Variant

Based on {prop name} design sheet,
anime style, cel shading, modern urban style,
cinematic composition, ultra detailed, 8K, high quality,
shallow depth of field, film grain, lens vignette,
cel shading anime style, modern urban style, dramatic low-key lighting,
prop derivative design sheet, item concept art, no people, no characters, no human figures,
{prop type}, {material description},
Current state: {state name}, {state visual description},
{material surface change description},
pure prop still life display, prop independently displayed, no one holding, no one wearing,
same frame quad-grid (2×2): top left front view (front view) + top right side view (side view) + bottom left back view (back view) + bottom right detail close-up (detail closeup),
pure neutral gray background, even soft light, no hard shadows,
ultra-clear material texture, cel shading texture, state details distinguishable
no text in the image,
no people, hands, fingers, or limbs may appear in the frame; props must not be in a grasped or worn state

---

## VI. Constraint Rules

### Mandatory

| Number | Rule |
|---|---|
| R1 | Prop core shape/outline recognizable across all states |
| R2 | State changes must follow physical logic |
| R3 | Must use quad-grid (2×2) layout: top left front view + top right side view + bottom left back view + bottom right detail close-up |
| R4 | Must specify "pure neutral gray background," even soft light, no hard shadows |
| R5 | Must include "anime style" keywords (anime style / cel shading) |
| R6 | Must include depth of field features (shallow depth of field / vignette at least one), maintain anime cel shading style |

### Prohibited

| Number | Prohibition |
|---|---|
| X1 | Prop unrecognizable after state change |
| X2 | Damage violating physical logic (metal rusting changes that don't match material, etc.) |
| X3 | Overly gory/horrific damage depiction |
| X4 | Any human figure appearing, including full body, half body, or partial (hands, fingers, arms, etc.) |
| X5 | Prop in a held, grasped, worn, or in-use state |
| X6 | Elements suggesting the presence of a person (e.g., holding marks, wearing perspective, use posture) |
| X7 | Using realistic photography/3D rendering related terms |
| X8 | High-saturation fluorescent/neon colors |
