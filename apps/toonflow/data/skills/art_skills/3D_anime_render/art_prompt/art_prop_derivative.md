# 3D Anime Render Urban Prop Derivative State Generation · Constraint Manual

---

## I. Derivative Principles

1. **Form Anchoring** — Prop core form/outline recognizable across all states
2. **State Readable** — State differences must be immediately obvious, viewers can instantly distinguish
3. **Narrative Service** — Each state variant serves a specific story node
4. **Progressive Degradation** — Damage/aging states should have reasonable physical logic (cel-shaded presentation)
5. **Pure Prop Independent Display** — Only the prop itself can appear in the image; no people, hands, or limbs allowed; props cannot be in a held/worn/grasped state; must be independently presented as still-life display

---

## II. State Types

### 2.1 Usage States

| State | Description | Applicable Props | Prompt |
|---|---|---|---|
| Brand New | Intact, shiny like new | All props | Brand new, intact, shiny like new |
| Daily Use | Light wear, natural use marks (cel-shaded) | All props | Daily use marks, light wear |
| Aged | Obvious use feel, dull color (cel-shaded) | Utensils/accessories/electronics | Use marks, sense of age, dull color |

### 2.2 Damage States

| State | Description | Applicable Props | Prompt |
|---|---|---|---|
| Light Damage | Small cracks/small chips/light wear (cel-shaded) | Glass/ceramic/electronics | Fine cracks, light chips |
| Broken | Obvious cracks/breakage/shatter (cel-shaded) | Glass/ceramic/electronics | Obvious cracks, shattered, broken |
| Fragment | Only part/fragments left (cel-shaded) | Glass/ceramic/electronics | Fragment, shard, only half remaining |

### 2.3 Special States

| State | Description | Applicable Props | Prompt |
|---|---|---|---|
| Charging/Working | Screen lit up/indicator light (cel-shaded) | Electronic devices | Screen lit up, working indicator light |
| Waterlogged/Wet | Water stains, wet reflection (cel-shaded) | Electronics/paper | Waterlogged, surface wet, reflection |
| Screen Damaged | Screen cracks/display abnormality | Electronic devices | Screen cracks, display abnormality |
| Battery Depleted | Indicator off/battery icon | Electronic devices | Battery depleted, indicator off |
| Stored/Carried | Storage bag/storage box | Accessories/electronics | Storage bag, storage box |

---

## III. State Variant Frame Specifications

### Single State Image

| Item | Constraint |
|---|---|
| Background | Clean neutral gray #E8E8E8 (same as design sheet) |
| Lighting | Even illumination, no hard shadows |
| Angle | Consistent with design sheet front view |
| Proportion | Prop occupies 70%+ of image subject |

### State Comparison Image

| Item | Constraint |
|---|---|
| Layout | Same image side-by-side display of 2-3 states |
| Label | State name labeled below each state |
| Consistency | Angle/lighting/background completely consistent, only state differs |

---

## IV. Material State Change Rules

| Material | Brand New → Daily | Daily → Aged | Damage Performance (cel-shaded) |
|---|---|---|---|
| Metal | Bright sheen → micro-scratches | Scratches → dull color | Notch/curled edge/break (cel-shaded treatment) |
| Glass | Transparency → micro-scratches | Scratches → surface wear | Crack/shatter/chip (cel-shaded treatment) |
| Plastic | Smooth → light scratches | Scratches → dull color | Crack/break/wear (cel-shaded treatment) |
| Leather | Smooth → natural wrinkles | Wrinkles → dull color | Wear/crack/fade (cel-shaded treatment) |
| Paper | Flat → light creases | Creases → yellowed | Tear/wear/ink bleed (cel-shaded treatment) |

---

## V. Prompt Template

### Single State Variant

```
Based on {prop name} design sheet, 3D animation render, cinematic lighting, vibrant cel-shaded texture, high-detail materials, joyful healing atmosphere, cartoon urban style, high-detail cartoon materials, moderate cartoon proportions, warm color palette, 8K ultra HD, cinematic composition, soft light and shadow layers, bright cartoon render style, warm and healing,
anime style, cel-shaded, 3D animation render,
{prop type}, {material description},
Current state: {state name}, {state visual description},
{material surface change description}, (cel-shaded treatment)
Pure prop still-life display, prop independently displayed, no one holding, no one wearing,
Same image four-grid (2x2): top left front view (front view) + top right side view (side view) + bottom left back view (back view) + bottom right detail closeup (detail closeup),
Clean neutral gray background, even soft light, no hard shadows,
Clear material texture, cel-shaded render, state details distinguishable, cel-shaded treatment,
8K ultra HD, cinematic composition,
No text in the image,
No people, hands, fingers, or limbs may appear in the image; props cannot be in a held or worn state
```

---

## VI. Constraint Rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Prop core form/outline recognizable across all states |
| R2 | State changes must follow physical logic (cel-shaded) |
| R3 | Must use four-grid (2x2) layout: top left front view + top right side view + bottom left back view + bottom right detail closeup |
| R4 | Must specify "clean neutral gray background", even soft light, no hard shadows |
| R5 | Must include 3D animation render keywords (cel-shaded, 3D animation render, anime style) |
| R6 | Must include 8K ultra HD, cinematic composition keywords |

### Prohibited

| No. | Prohibited |
|---|---|
| X1 | Prop unrecognizable after state change |
| X2 | Damage violating physical logic (e.g., electronics rusting) |
| X3 | Excessive gory/terrifying damage depiction (within cel-shaded limits) |
| X4 | Any human figure, including full body, half body, or body parts (hands, fingers, arms etc.) |
| X5 | Prop in held, grasped, worn, or in-use state |
| X6 | Elements suggesting human presence (e.g., hand-holding marks, wearing perspective, usage posture) |
| X7 | Using realistic photography terms (e.g., real photography, photorealistic, RAW photo etc.) |
| X8 | Overly realistic damage texture, breaking cel-shaded style consistency |
| X9 | Ancient/futuristic elements, non-modern urban style |
