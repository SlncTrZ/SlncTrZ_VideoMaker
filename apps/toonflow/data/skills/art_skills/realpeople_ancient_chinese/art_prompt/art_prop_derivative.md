# Prop Derivative State Generation · Constraint Manual

---

## I. Derivative Principles

1. **Form Anchored** — Prop core form/contour identifiable across all states
2. **State Readable** — State differences must beimmediately clear, viewer can immediately distinguish
3. **Narrative Service** — Each state variant serves a specific story node
4. **Gradual Degradation** — Damage/aging states should have plausible physical logic
5. **Pure Prop Independent Display** — Frame can only contain the prop itself, strictly prohibit any person, hand, limb; prop must not be in held/worn/grasped state, must be independently presented as still-life display

---

## II. State Types

### 2.1 Usage States

| State | Description | Applicable Props | Prompt |
|---|---|---|---|
| Brand new | Intact, luster like new | All props | Brand new, intact, luster like new |
| Daily use | Slight wear, natural patina | Weapons/utensils/jewelry | Daily use traces, natural patina |
| Aged |clear age feel, dull color | Utensils/tokens/scrolls | Antique mottled, age feel, color dull |

### 2.2 Damage States

| State | Description | Applicable Props | Prompt |
|---|---|---|---|
| Slightly damaged | Small cracks/small nicks/slight wear | Porcelain/jade pendant/weapon | Fine cracks, slight nicks |
| Broken |clear cracks/breakage/shattered | Porcelain/jewelry/weapon | Cracksclear, shattered, broken |
| Fragment | Only partial remaining/fragments | Porcelain/jade pendant/token | Fragment, broken piece, only half remaining |

### 2.3 Special States

| State | Description | Applicable Props | Prompt |
|---|---|---|---|
| Blood-stained | Blood residue attached | Weapon/clothing/token | Bloodstains mottled, blood-stained |
| Soaked/wet | Water stains, wet reflections | Scroll/token/clothing | Water-soaked, paper wet, ink bleeding |
| Burnt/scorched | Charred edges, fire marks | Scroll/token/wood items | Edges charred, fire burn marks |
| Glowing/activated | Inner energy, radiating light | Token/magic artifact/jade | Slightly glowing, inner brilliance |
| Wrapped/sealed | Wrapped in cloth/box | Token/jewelry/secret item | Silk cloth wrapped, wood box sealed |

---

## III. State Variant Frame Specifications

### Single State Image

| Item | Constraint |
|---|---|
| Background | Pure neutral gray #E8E8E8 (consistent with design sheet) |
| Lighting | Even illumination, no hard shadows |
| Angle | Consistent with original design sheet front view |
| Ratio | Prop occupies 70%+ of frame subject |

### State Comparison Image

| Item | Constraint |
|---|---|
| Layout | Same frame side-by-side display of 2-3 states |
| Annotation | State name annotated below each state |
| Consistency | Angle/lighting/background fully identical, only state differs |

---

## IV. Material State Change Rules

| Material | Brand New → Daily | Daily → Aged | Damage performance |
|---|---|---|---|
| Metal | Bright luster → slight patina | Patina → rust spots | Nick/curled edge/break |
| Jade | Translucent warm → slight wear | Wear → surface micro-cracks | Crack/shatter/missing corner |
| Wood | New wood texture → natural patina | Patina → color dull | Crack/break/worm-eaten |
| Porcelain | Glaze luster → micro-scratches | Scratches → glaze dull | Crack/shatter/nick |
| Fabric/paper | Brand new flat → slight crease | Crease → yellowed brittle | Tear/scorch/ink bleeding |

---

## V. Prompt Template

### Single State Variant

```
Based on {prop name} design sheet, real-person realistic photography style, ancient realistic documentary, high contrast, ultimate detail,
{prop type}, {material description},
Current state: {state name}, {state visual description},
{material surface change description},
Pure prop still-life display, prop independently displayed, no one holding, no one wearing,
Same frame 4-grid (2×2): top-left front view + top-right side view + bottom-left back view + bottom-right detail close-up,
Pure neutral gray background, even soft light, no hard shadows,
Material texture ultra-clear, texture realistic, state details distinguishable
No text in the image,
No person, hand, finger, or limb may appear in the frame; prop must not be in grasped or worn state
```

---

## VI. Constraint Rules

### Mandatory

| # | Rule |
|---|---|
| R1 | Prop core form/contour identifiable across all states |
| R2 | State changes must conform to physical logic |
| R3 | Must use 4-grid (2×2) layout: top-left front view + top-right side view + bottom-left back view + bottom-right detail close-up |
| R4 | Must specify "pure neutral gray background", even soft light, no hard shadows |

### Strictly Prohibited

| # | Strictly Prohibited |
|---|---|
| X1 | Prop unrecognizable after state change |
| X2 | Damage violating physical logic (jade rusting etc.) |
| X3 | Overly gory/horrifying damage depiction |
| X4 | Any human figure, including full body, half body,close-up part (hand, finger, arm etc. limbs) |
| X5 | Prop in held, grasped, worn, or in-use state |
| X6 | Elements suggesting human presence (such as hand-holding marks, wearing perspective, use posture) |

---

