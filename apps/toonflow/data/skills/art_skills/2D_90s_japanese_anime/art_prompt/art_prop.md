# 90s Retro Japanese Anime Style - Prop Image Generation · Constraint Manual

---

## I. Prop Design Principles

1. **Functional Readability** — Prop purpose is immediately clear, form serves function
2. **Extreme Texture** — Material texture must be clearly distinguishable (metal/jade/wood/cloth/paper)
3. **Period Style** — All props align with 90s worldview, unified style
4. **Clear Scale** — Hint at prop's real size through reference objects or annotations
5. **Pure Prop Independent Display** — Only the prop itself may appear in the frame; no people, hands, or limbs allowed; props must not be in a held/worn/grasped state; must be presented independently as still life arrangement

---

## II. Prop Classification and Aesthetic Constraints

### 2.1 Weapon Class

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Type | Sword/blade/bow/spear/scythe | {weapon type}, 90s weapon |
| Material | Metal + gem decoration + ribbon | Metallic luster, gem decoration |
| Decoration | Engraving, tassels, retro patterns | Fine engraving, retro patterns |
| Luster | Metallic luster, gem reflection | Metallic luster, brilliant gems |
| Prompt | 90s {weapon}, forged metal, gem decoration | — |

### 2.2 Jewelry/Accessory Class

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Type | Hair accessory/necklace/bracelet/ring | {accessory type}, 90s jewelry |
| Material | Metal/gem/ribbon/pearl | Metallic luster, transparent gem |
| Craftsmanship | Hand-drawn texture, retro style | Fine craftsmanship, 90s style |
| Luster | Gem luster/metallic luster | Brilliant gems, metallic luster |
| Prompt | 90s {accessory}, {material}, fine craftsmanship | — |

### 2.3 Daily Utensil Class

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Type | Teaware/books/musical instruments/stationery | {utensil type}, 90s utensil |
| Material | Metal/wood/paper/ceramic | Clear material texture |
| Texture | Flowing lines, soft colors | Flowing lines, clear texture |
| Style | Simple/luxurious switch by scene | Simple refined / luxurious refined |
| Prompt | 90s {utensil}, {material} texture, flowing lines | — |

### 2.4 Token/Key Prop Class

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Type | Token/medallion/scroll/vial/magic prop | {prop type}, 90s prop |
| Specialness | Must have recognizability, narrative symbolic meaning | Unique shape, symbolic meaning |
| Condition | Can add wear and tear per story needs | Old / brand new |
| Prompt | 90s {prop}, {material}, {condition}, unique shape | — |

---

## III. Multi-Angle Character Sheet Specifications

### View Definitions

| Position | View | Angle | Requirement | Prompt Keywords |
|---|---|---|---|---|
| Top Left | Front View | Front 0° | Complete front form of prop | front view |
| Top Right | Side View | Side 90° | Clear thickness/outline/structure | side view |
| Bottom Left | Back View | Back 180° | Back structure/decoration of prop | back view |
| Bottom Right | Detail Close-up | Local Zoom | Material texture/craft details | detail closeup |

### Image Specifications

| Item | Constraint |
|---|---|
| Layout | Quad-grid (2×2) in one frame, four angles |
| Background | Warm beige #F8F4E8 |
| Lighting | Soft cinematic light, even soft light, no hard shadows |
| Proportion | Each prop occupies 70%+ of its cell |
| Shadow | Natural ground micro-shadow allowed |
| Aspect Ratio | Recommended 1:1 |

---

## IV. Material Rendering Constraints

| Material | Rendering Requirement | Prompt Keywords |
|---|---|---|
| Metal | Clear luster, distinct lines | Metallic texture, clear luster |
| Jade | Translucency, warmth | Jade-like translucency, warm |
| Wood | Clear grain, distinct lines | Clear wood grain, natural texture |
| Ceramic | Smooth surface, even luster | Ceramic luster, smooth surface |
| Cloth/Paper | Fiber texture, clear edges | Fabric texture, clear paper texture |
| Gem | Translucency, refraction | Transparent gem, refraction feel |

---

## V. Prompt Template
```
90s retro Japanese anime style prop design sheet, hand-drawn flat coloring, soft warm tones, fine flowing lines, cinematic lighting,
{prop type}, {material description}, {craftsmanship/decoration description}, {condition description},
pure prop still life display, prop independently displayed, no one holding, no one wearing,
same frame quad-grid (2×2): top left front view + top right side view + bottom left back view + bottom right detail close-up,
warm beige background, soft cinematic light, even soft light, no hard shadows,
ultra-clear material texture, hand-drawn texture, {material luster description}
no text in the image,
no people, hands, fingers, or limbs may appear in the frame; props must not be in a grasped or worn state
```

---

## VI. Constraint Rules

### Mandatory

| Number | Rule |
|---|---|
| R1 | Must specify "warm beige background #F8F4E8" |
| R2 | Must clearly define prop material and craftsmanship |
| R3 | Prop design must align with 90s worldview style |

### Prohibited

| Number | Prohibition |
|---|---|
| X1 | Complex scene backgrounds |
| X2 | Prop and person in same frame |
| X3 | Any human figure appearing |
| X4 | Prop in a held, grasped, worn, or in-use state |
| X5 | Elements suggesting the presence of a person |
