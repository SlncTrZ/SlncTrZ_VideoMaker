# Prop Image Generation · Constraint Manual

---

## I. Prop Design Principles

1. **Function Readable** — Prop purposeimmediately clear, form serves function
2. **Ultimate Texture** — Material textures must be clearly distinguishable (metal/jade/wood/fabric/paper)
3. **Era Consistent** — All props must conform to ancient Chinese worldview, forbid modern elements
4. **Scale Clear** — Imply prop real size through reference objects or annotations
5. **Pure Prop Independent Display** — Frame can only contain the prop itself, strictly prohibit any person, hand, limb; prop must not be in held/worn/grasped state, must be independently presented as still-life display

---

## II. Prop Classification and Aesthetic Constraints

### 2.1 Weapon Class

| Item | Constraint | Prompt |
|---|---|---|
| Type | Sword/blade/bow/spear/fan | {weapon type}, ancient weapon |
| Material | Fine steel/dark iron + gem inlay + silk tassel | Cold gleam, fine steel forged |
| Decoration | Scabbard/hilt carving, tassels, subtle pattern | Exquisite carving, tassels hanging |
| Luster | Metal cold luster, blade edge reflection | Cold gleam shimmering, metal texture |
| Prompt | Ancient {weapon}, fine steel forged, cold gleam, exquisite carving | — |

### 2.2 Jewelry Class

| Item | Constraint | Prompt |
|---|---|---|
| Type | Hairpin/hair clasp/necklace/jade pendant/bracelet/earring | {jewelry type}, ancient jewelry |
| Material | Gold/silver/jade/pearl/gemstone | Gold silk woven, jade translucent |
| Craft | Ultimate precision, filigree/inlay/cloisonne | Master craftsmanship, finely carved |
| Luster | Pearl luster/jade warmth/metal gloss | Pearl luster gleaming, metal gloss |
| Prompt | Ancient {jewelry}, {material}, master craftsmanship, finely carved | — |

### 2.3 Daily Utensil Class

| Item | Constraint | Prompt |
|---|---|---|
| Type | Tea set/wine set/incense burner/chessboard/book scroll/lantern | {utensil type}, ancient utensil |
| Material | Porcelain/copper/bamboo/wood/paper | Celadon warm, red copper antique |
| Texture | Glaze surface/wood grain/bamboo node clear | Glaze surface luster, clear wood grain |
| Style | Elegant/luxurious per scene switch | Elegant antique / luxurious refined |
| Prompt | Ancient {utensil}, {material} texture, clear texture | — |

### 2.4 Token/Key Prop Class

| Item | Constraint | Prompt |
|---|---|---|
| Type | Token/medallion/scroll/medicine bottle/jade seal | {prop type}, ancient prop |
| Specialness | Must have recognizability, narrative symbolic meaning | Unique shape, profound meaning |
| Aging | Can add age feel per story need | Antique mottled / brand new refined |
| Prompt | Ancient {prop}, {material}, {condition}, unique shape | — |

---

## III. Multi-Angle Design Sheet Specifications

### View Definitions

| Position | View | Angle | Requirement | Prompt |
|---|---|---|---|---|
| Top-left | Front view | Front 0° | Complete front form of prop | front view |
| Top-right | Side view | Side 90° | Thickness/contour/structure clear | side view |
| Bottom-left | Back view | Back 180° | Back structure/decoration of prop | back view |
| Bottom-right | Detail close-up | Local close-up view | Material texture/craft detail | detail closeup |

### Frame Specifications

| Item | Constraint |
|---|---|
| Layout | Same frame 4-grid (2×2), four views top-left/bottom-left/top-right/bottom-right |
| Background | Pure neutral gray #E8E8E8 |
| Lighting | Even soft light, no hard shadows |
| Ratio | Each grid prop occupies 70%+ of grid subject |
| Shadow | Allow natural ground micro-shadow |
| Aspect ratio | Recommend 1:1 |

---

## IV. Material Render Constraints

| Material | Render Requirement | Prompt |
|---|---|---|
| Metal | Reflection/highlight/cold luster, slight scratches subtly visible | Metal texture, cold luster, clear reflection |
| Jade | Internal light transmission, warm, slightly translucent | Jade translucent, warm like fat |
| Wood | Clear wood grain, annual rings visible | Clear wood grain, warm texture |
| Porcelain | Glaze surface luster, even color | Glaze luster, porcelain warm |
| Fabric/paper | Fiber texture, natural edges | Fabric texture, paper antique |
| Gemstone | Refraction/internal light, clear facets | Gemstone sparkling, light refraction |

---

## V. Prompt Template

```
Ancient prop design sheet, real-person realistic photography style, ancient realistic documentary, high contrast, ultimate detail,
{prop type}, {material description}, {craft/decoration description}, {condition description},
Pure prop still-life display, prop independently displayed, no one holding, no one wearing,
Same frame 4-grid (2×2): top-left front view + top-right side view + bottom-left back view + bottom-right detail close-up,
Pure neutral gray background, even soft light, no hard shadows,
Material texture ultra-clear, texture realistic, {material luster description}
No text in the image,
No person, hand, finger, or limb may appear in the frame; prop must not be in grasped or worn state
```

---

## VI. Constraint Rules

### Mandatory

| # | Rule |
|---|---|
| R1 | Must specify "pure neutral gray background" |
| R2 | Must explicit prop material and craft |
| R3 | Prop design must conform to ancient Chinese worldview |

### Strictly Prohibited

| # | Strictly Prohibited |
|---|---|
| X1 | Complex scene background |
| X2 | Prop and person in same frame (this stage is pure prop image) |
| X3 | Any human figure, including full body, half body,close-up part (hand, finger, arm etc. limbs) |
| X4 | Prop in held, grasped, worn, or in-use state |
| X5 | Elements suggesting human presence (such as hand-holding marks, wearing perspective, use posture) |

---

