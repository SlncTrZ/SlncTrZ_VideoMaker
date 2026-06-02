# Prop Derivative State Generation · Flat Design Constraint Manual

---

## I. Derivative Principles

1. **Outline Anchored** — Prop's core shape/outline recognizable across all states
2. **State Readable** — State differences must be immediately obvious, viewers can instantly distinguish
3. **Narrative Service** — Each state variant serves a specific story beat
4. **Gradual Degradation** — Damage/aging states should follow reasonable physical logic
5. **Pure Prop Independent Display** — Only the prop itself may appear in the frame; no people, hands, or limbs allowed; props must not be in a held/worn/grasped state; must be presented independently as still life arrangement

---

## II. State Types

### 2.1 Usage States

| State | Description | Applicable Props | Prompt Keywords |
|---|---|---|---|
| Brand New | Intact, like-new solid color | All props | Flat brand new, intact, like-new solid color |
| Daily Use | Light wear, simple color block change | Weapons/utensils/accessories | Flat use marks, simple wear |
| Aged | Clear signs of age, dull color | Utensils/tokens/scrolls | Flat aged, aged look, dark color |

### 2.2 Damage States

| State | Description | Applicable Props | Prompt Keywords |
|---|---|---|---|
| Minor Damage | Small cracks/chips/light wear | Porcelain/jade/weapons | Flat minor damage, simple cracks |
| Damaged | Clear cracks/breaks/shattering | Porcelain/accessories/weapons | Flat damaged, simple break |
| Fragment | Only parts remaining/shattered | Porcelain/jade/tokens | Flat fragment, simple shards |

### 2.3 Special States

| State | Description | Applicable Props | Prompt Keywords |
|---|---|---|---|
| Bloodstained | Red color block attachment | Weapons/clothing/tokens | Flat bloodstained, red marks |
| Waterlogged/Wet | Color bleeding, wet feel | Scrolls/tokens/clothing | Flat waterlogged, color bleeding |
| Burned/Scorched | Black edges, flat fire marks | Scrolls/tokens/wooden items | Flat scorched black, simple fire marks |
| Glowing/Activated | Simple glowing color block, simple radiance | Tokens/artifacts/jade | Flat glowing, simple radiance |
| Wrapped/Sealed | Wrapped in cloth/box | Tokens/accessories/secret items | Flat wrapped, simple sealed |

---

## III. State Variant Image Specifications

### Single State Image

| Item | Constraint |
|---|---|
| Background | Pure neutral gray #E8E8E8 (same as design sheet) |
| Lighting | No light and shadow, pure flat color blocks |
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
| Metal | Solid color → simple patina color block | Patina → simple rust color block | Simple notch/curl/break |
| Jade | Solid color → simple wear color block | Wear → surface simple crack | Simple crack/shatter/chip |
| Wood | Solid color → simple patina color block | Patina → dull color | Simple crack/break/insect damage |
| Porcelain | Solid color → simple scratch color block | Scratch → dull glaze color block | Simple crack/shatter/chip |
| Cloth/Paper | Solid color flat → simple wrinkle color block | Wrinkle → yellowed brittle color block | Simple tear/char damage/bleeding |

---

## V. Prompt Template

### Single State Variant

```
Based on {prop name} design sheet,
2d flat design, vector art, flat illustration,
minimalist, clean lines, solid colors,
{prop type}, {material description},
Current state: {state name}, {state visual description},
{material surface change description},
pure prop still life display, prop independently displayed, no one holding, no one wearing,
same frame quad-grid (2×2): top left front view (front view) + top right side view (side view) + bottom left back view (back view) + bottom right detail close-up (detail closeup),
pure neutral gray background, no light and shadow, no gradient,
clear lines, distinct color blocks, state details distinguishable
no text in the image,
no people, hands, fingers, or limbs may appear in the frame; props must not be in a grasped or worn state
```


---

## VI. Constraint Rules

### Mandatory

| Number | Rule |
|---|---|
| R1 | Prop core shape/outline recognizable across all states |
| R2 | State changes must follow physical logic |
| R3 | Must use quad-grid (2×2) layout: top left front view + top right side view + bottom left back view + bottom right detail close-up |
| R4 | Must specify "pure neutral gray background," no light and shadow, no gradient |

### Prohibited

| Number | Prohibition |
|---|---|
| X1 | Prop unrecognizable after state change |
| X2 | Damage violating physical logic (jade rusting, etc.) |
| X3 | Overly gory/horrific damage depiction |
| X4 | Any human figure appearing, including full body, half body, or partial (hands, fingers, arms, etc.) |
| X5 | Prop in a held, grasped, worn, or in-use state |
| X6 | Elements suggesting the presence of a person (e.g., holding marks, wearing perspective, use posture) |
| X7 | Adding gradient/shadow/highlight/three-dimensional effects |
| X8 | State changes too complex, color blocks not clearly distinguishable |
