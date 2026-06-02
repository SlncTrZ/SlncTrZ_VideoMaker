---
name: art_prop_derivative
description: Prop Derivative State Generation · Constraint Manual
metaData: art_skills
---

# Prop Derivative State Generation · Constraint Manual

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
| Daily Use | Light wear, natural patina | Weapons/utensils/accessories | Daily use marks, natural patina |
| Aged | Clear signs of age, dull color | Utensils/tokens/scrolls | Old mottled, aged look, dull color |

### 2.2 Damage States

| State | Description | Applicable Props | Prompt Keywords |
|---|---|---|---|
| Minor Damage | Small cracks/chips/light wear | Porcelain/jade/weapons | Fine cracks, slight chips |
| Damaged | Clear cracks/breaks/shattering | Porcelain/accessories/weapons | Clear cracks, shattered, broken |
| Fragment | Only parts remaining/shattered | Porcelain/jade/tokens | Fragment, shards, only half remaining |

### 2.3 Special States

| State | Description | Applicable Props | Prompt Keywords |
|---|---|---|---|
| Bloodstained | Blood stains attached | Weapons/tokens/scrolls | Mottled bloodstains, blood-soaked, anime rendering |
| Waterlogged/Wet | Water stains, wet reflection | Scrolls/tokens/paper | Waterlogged, paper wet, ink bleeding |
| Burned/Scorched | Charred edges, fire marks | Scrolls/tokens/wooden items | Charred edges, fire marks, carbonized |
| Glowing/Activated | Inner energy, radiating light | Tokens/artifacts/jade | Faint glow, inner radiance, cel shading light effect |
| Wrapped/Sealed | Wrapped in cloth/box | Tokens/accessories/secret items | Brocade wrapped, wooden box sealed, ancient-style packaging |

### 2.4 Environment Adaptation States (New)

| State | Description | Applicable Props | Prompt Keywords |
|---|---|---|---|
| Snow-covered | Snow accumulation covering | Weapons/utensils/tokens | Snow-covered, accumulated snow, winter feel |
| Rain-soaked | Rainwater wetness | Paper/cloth/wooden items | Rainwater wet, water stains, damp feel |
| Wind-eroded | Sand and wind wear | Outdoor utensils/weapons | Sandwind marks, wear, aged look |
| Rusted | Metal oxidation | Weapons/metal accessories | Rust spots, oxidation, aged look |

---

## III. State Variant Image Specifications

### Single State Image

| Item | Constraint |
|---|---|
| Background | Moon white solid #E8EAF5 (same as design sheet) |
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
| Metal | Bright luster → light patina | Patina → rust spots | Notches/curling/breakage |
| Jade | Translucent warm → light wear | Wear → surface micro-cracks | Cracks/shattering/chipped corners |
| Wood | New wood grain → natural patina | Patina → dull color | Cracking/breakage/insect damage |
| Porcelain | Glaze luster → micro-scratches | Scratches → dull glaze | Cracks/shattering/chips |
| Cloth/Paper | Brand new flat → slight wrinkles | Wrinkles → yellowing brittle | Tears/char damage/ink bleeding |

---

## V. Prompt Template

### Single State Variant

Based on {prop name} design sheet, Chinese-style anime prop derivative state,
Chinese-style anime, neo-Chinese aesthetic, Japanese anime rendering, cel shading flat coloring, delicate brushwork,
{prop type}, {material description},
Current state: {state name}, {state visual description},
{material surface change description},
pure prop still life display, prop independently displayed, no one holding, no one wearing,
same frame quad-grid (2×2): top left front view (front view) + top right side view (side view) + bottom left back view (back view) + bottom right detail close-up (detail closeup),
moon white solid background, even soft light, no hard shadows,
ultra-clear material texture, fine texture, state details distinguishable,
Chinese-style anime HD rendering, high detail, delicate lines, cel shading feel,
no subtitles, no watermarks, no overlapping title text in the frame,
no people, hands, fingers, or limbs may appear in the frame; props must not be in a grasped or worn state

---

## VI. Constraint Rules

### Mandatory

| Number | Rule |
|---|---|
| R1 | Prop core shape/outline recognizable across all states |
| R2 | State changes must follow physical logic |
| R3 | Must use quad-grid (2×2) layout: front + side + back + close-up |
| R4 | Must specify "moon white solid background," even soft light, no hard shadows |
| R5 | Must include "Chinese-style anime + cel shading flat coloring" keywords |

### Prohibited

| Number | Prohibition |
|---|---|
| X1 | Prop unrecognizable after state change |
| X2 | Damage violating physical logic (jade rusting, etc.) |
| X3 | Overly gory/horrific damage depiction |
| X4 | Any human figure appearing, including full body, half body, or partial (hands, fingers, arms, etc.) |
| X5 | Prop in a held, grasped, worn, or in-use state |
| X6 | Elements suggesting the presence of a person (e.g., holding marks, wearing perspective, use posture) |
