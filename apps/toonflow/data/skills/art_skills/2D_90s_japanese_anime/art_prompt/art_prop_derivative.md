# 90s Retro Japanese Anime Style - Prop Derivative State Generation · Constraint Manual

---

## I. Derivative Principles

1. **Shape Anchored** — Prop's core shape/outline recognizable across all states
2. **State Readable** — State differences must be immediately obvious
3. **Narrative Service** — Each state variant serves a specific story beat
4. **Gradual Degradation** — Damage/aging states should follow reasonable physical logic
5. **Pure Prop Independent Display** — Only the prop itself may appear in the frame; no people, hands, or limbs allowed; props must not be in a held/worn/grasped state

---

## II. State Types

### 2.1 Usage States

| State | Description | Applicable Props | Prompt Keywords |
|---|---|---|---|
| Brand New | Intact, like-new luster | All props | Brand new, intact |
| Daily Use | Light wear, natural patina | Weapons/utensils/accessories | Daily use marks, slight wear |
| Aged | Clear signs of age, dull color | Utensils/tokens/scrolls | Old, aged look |

### 2.2 Damage States

| State | Description | Applicable Props | Prompt Keywords |
|---|---|---|---|
| Minor Damage | Small cracks/chips/light wear | Porcelain/jade/weapons | Fine cracks, slight chips |
| Damaged | Clear cracks/breaks/shattering | Porcelain/accessories/weapons | Clear cracks, shattered |
| Fragment | Only parts remaining/shattered | Porcelain/jade/tokens | Fragment, shards |

### 2.3 Special States

| State | Description | Applicable Props | Prompt Keywords |
|---|---|---|---|
| Bloodstained | Blood stains attached | Weapons/tokens | Bloodstains, blood-soaked |
| Waterlogged/Wet | Water stains, wet reflection | Scrolls/tokens/clothing | Waterlogged, wet |
| Burned/Scorched | Charred edges, fire marks | Scrolls/tokens/wooden items | Charred edges, fire marks |
| Glowing/Activated | Inner energy, radiating light | Tokens/artifacts/jade | Faint glow, inner radiance |
| Wrapped/Sealed | Wrapped in cloth/box | Tokens/accessories/secret items | Wrapped, sealed |

---

## III. State Variant Image Specifications

### Single State Image

| Item | Constraint |
|---|---|
| Background | Warm beige #F8F4E8 (same as design sheet) |
| Lighting | Soft cinematic light, even lighting, no hard shadows |
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
| Metal | Bright luster → light patina | Patina → rust spots | Notches/curling/breakage |
| Jade | Translucent warm → light wear | Wear → surface micro-cracks | Cracks/shattering/chipped corners |
| Wood | New wood grain → natural patina | Patina → dull color | Cracking/breakage/insect damage |
| Porcelain | Glaze luster → micro-scratches | Scratches → dull glaze | Cracks/shattering/chips |
| Cloth/Paper | Brand new flat → slight wrinkles | Wrinkles → yellowing brittle | Tears/char damage |

---

## V. Prompt Template

### Single State Variant

```
Based on {prop name} design sheet, 90s retro Japanese anime style, hand-drawn flat coloring, soft warm tones,
{prop type}, {material description},
Current state: {state name}, {state visual description},
{material surface change description},
pure prop still life display, prop independently displayed, no one holding, no one wearing,
same frame quad-grid (2×2): top left front view (front view) + top right side view (side view) + bottom left back view (back view) + bottom right detail close-up (detail closeup),
warm beige background, soft cinematic light, even soft light, no hard shadows,
ultra-clear material texture, hand-drawn texture, state details distinguishable
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
| R3 | Must use quad-grid (2×2) layout |
| R4 | Must specify "warm beige background," soft cinematic light |

### Prohibited

| Number | Prohibition |
|---|---|
| X1 | Prop unrecognizable after state change |
| X2 | Damage violating physical logic |
| X3 | Overly gory/horrific damage depiction |
| X4 | Any human figure appearing |
| X5 | Prop in a held, grasped, worn, or in-use state |
| X6 | Elements suggesting the presence of a person |
