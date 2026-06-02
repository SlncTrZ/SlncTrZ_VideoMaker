# Prop Derivative State Generation · Constraint Manual (Live-Action Urban Version)

---

## I. Derivative Principles

1. **Form Anchored** — Prop core form/contour identifiable across all states
2. **State Readable** — State differences must beimmediately clear, viewer can immediately distinguish
3. **Narrative Service** — Each state variant serves a specific story node
4. **Gradual Degradation** — Damage/aging states should have plausible physical logic

---

## II. State Types

### 2.1 Usage States

| State | Description | Applicable Props | Prompt |
|---|---|---|---|
| Brand new | Intact, luster like new | All props | Brand new, intact, luster like new |
| Daily use | Slight wear, natural traces | Electronics/daily items | Daily use traces, natural wear |
| Aged |clear use traces, aging | Leather goods/fabric | Use traces, natural aging |

### 2.2 Damage States

| State | Description | Applicable Props | Prompt |
|---|---|---|---|
| Slightly damaged | Small scratches/small cracks | Phone/laptop | Fine scratches, slight cracks |
| Damaged |clear cracks/breakage | Electronics/glass items | Cracksclear, shattered |
| Fragment | Only partial remaining/fragments | Glass/ceramic items | Fragment, broken piece |

### 2.3 Special States

| State | Description | Applicable Props | Prompt |
|---|---|---|---|
| Stains | Stain residue | All props | Stains, dirty |
| Water marks | Water stains, wet reflections | Paper products/fabric | Water stains, wet traces |
| Scratches |clear scratches | Metal/glass |clear scratches, scratch marks |
| Wear | Surface wear | Leather/fabric | Weartraces, aging |
| Broken screen | Cracked screen | Electronics | Cracked screen, cracks |

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
| Metal | Bright luster → micro-scratches | Scratches → oxidation spots | Dent/bend/break |
| Glass | Transparent → micro-scratches | Scratches →clear cracks | Shatter/chip |
| Plastic | New luster → micro-wear | Wear → fading | Crack/deformation |
| Leather | Smooth → micro-wrinkles | Wrinkles → cracks | Tear/wear |
| Fabric | Brand new → micro-wrinkles | Wrinkles → fading | Tear/stains |

---

## V. Prompt Template

### Single State Variant

```

Based on {prop name} design sheet, real-person realistic photography style, natural lighting, ultimate detail,
{prop type}, {material description},
Current state: {state name}, {state visual description},
{material surface change description},
Same frame 4-grid (2×2): top-left front view + top-right side view + bottom-left back view + bottom-right detail close-up,
Pure neutral gray background, even soft light, no hard shadows,
Material texture ultra-clear, texture realistic, state details distinguishable

```


---

## VI. Constraint Rules

### Mandatory

| # | Rule |
|---|---|
| R1 | Prop core form/contour identifiable across all states |
| R2 | State changes must conform to physical logic |
| R3 | Must use 4-grid (2×2) layout |
| R4 | Must specify "pure neutral gray background", even soft light, no hard shadows |

### Strictly Prohibited

| # | Strictly Prohibited |
|---|---|
| X1 | Prop unrecognizable after state change |
| X2 | Damage violating physical logic (e.g. metal rusting) |
| X3 | Over-damage causing unrecognizability |

---

