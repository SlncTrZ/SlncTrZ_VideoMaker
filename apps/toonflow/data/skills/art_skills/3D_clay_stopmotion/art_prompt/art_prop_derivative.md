# Clay Stop-Motion Prop Derivative State Generation · Constraint Manual

---

## I. Derivative Principles

1. **Form Anchoring** — Prop core form/outline recognizable across all states
2. **State Readable** — State differences must be immediately obvious
3. **Narrative Service** — Each state variant serves a specific story node
4. **Progressive Degradation** — Damage/aging states should have reasonable physical logic
5. **Pure Prop Independent Display** — Only the prop itself can appear in the image

---

## II. State Types

### 2.1 Usage States

| State | Description | Applicable Props | Prompt |
|---|---|---|---|
| Brand New | Intact, matte and warm | All props | Brand new, intact, warm texture |
| Daily Use | Light wear, natural patina | Weapons/utensils/ornaments | Daily use marks, natural patina |
| Aged | Obvious age feel, soft color | Utensils/tokens/scrolls | Antique and mottled, sense of age, soft color |

### 2.2 Damage States

| State | Description | Applicable Props | Prompt |
|---|---|---|---|
| Light Damage | Small cracks/small chips/light wear | Porcelain/jade pendant/weapons | Fine cracks, light chips |
| Broken | Obvious cracks/breakage/shatter | Porcelain/ornaments/weapons | Obvious cracks, shattered, broken |
| Fragment | Only part/fragments left | Porcelain/jade pendant/tokens | Fragment, shard, only half remaining |

### 2.3 Special States

| State | Description | Applicable Props | Prompt |
|---|---|---|---|
| Bloodstained | Blood stains attached | Weapons/clothing/tokens | Bloodstained mottled, bloodstained |
| Waterlogged/Wet | Water stains, wet reflection | Scrolls/tokens/clothing | Waterlogged, paper wet, ink bleed |
| Burnt/Scorched | Scorched edges, fire marks | Scrolls/tokens/wood items | Scorched edges, fire marks |
| Glowing/Activated | Inner energy, micro-glow | Tokens/artifacts/jade | Slightly glowing, inner light |
| Wrapped/Sealed | Wrapped in cloth/box | Tokens/ornaments/secret items | Brocade wrapped, wooden box sealed |

---

## III. State Variant Frame Specifications

### Single State Image

| Item | Constraint |
|---|---|
| Background | Clean neutral gray #E8E8E8 (same as design sheet) |
| Lighting | Warm soft light, no hard shadows |
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

| Material | Brand New → Daily | Daily → Aged | Damage Performance |
|---|---|---|---|
| Clay | Matte warm → light wear | Wear → soft dull color | Notch/crack/shatter |
| Wood | New wood texture → natural patina | Patina → dull color | Crack/break/insect damage |
| Ceramic | Warm glaze → micro-scratches | Scratches → glaze dull | Crack/shatter/chip |
| Metal | Micro-sheen → light patina | Patina → oxidation marks | Notch/curled edge/break |
| Cloth/Paper | New flat → micro-creases | Creases → yellowed brittle | Tear/scorch/ink bleed |

---

## V. Prompt Template

### Single State Variant

```
Based on {prop name} design sheet, clay stop-motion ancient Chinese prop derivative state, stop-motion style, 3D cartoon render, warm-toned lighting,
{prop type}, {material description},
Current state: {state name}, {state visual description},
{material surface change description},
Pure prop still-life display, prop independently displayed, no one holding, no one wearing,
Same image four-grid (2x2): top left front view (front view) + top right side view (side view) + bottom left back view (back view) + bottom right detail closeup (detail closeup),
Clean neutral gray background, warm soft light, no hard shadows,
Ultra-clear material texture, clay matte texture, state details distinguishable
No text in the image,
No people, hands, fingers, or limbs may appear in the image; props cannot be in a held or worn state
```

---

## VI. Constraint Rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Prop core form/outline recognizable across all states |
| R2 | State changes must follow physical logic |
| R3 | Must use four-grid (2x2) layout |
| R4 | Must specify "clean neutral gray background", warm soft light, no hard shadows |

### Prohibited

| No. | Prohibited |
|---|---|
| X1 | Prop unrecognizable after state change |
| X2 | Damage violating physical logic |
| X3 | Excessive gory/terrifying damage depiction |
| X4 | Any human figure |
| X5 | Prop in held/worn/in-use state |
| X6 | Cold hard lighting/high contrast |
