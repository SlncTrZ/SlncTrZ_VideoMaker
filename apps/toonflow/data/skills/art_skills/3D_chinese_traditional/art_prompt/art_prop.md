---
name: art_prop
description: Prop Image Generation · Constraint Manual
metaData: art_skills
---

# Prop Image Generation · Constraint Manual

---

## I. Prop Design Principles

1. **Function Readable** — Prop purpose clear at a glance, form serves function
2. **Texture Excellence** — Material texture must be clearly distinguishable (metal/jade/wood/cloth/paper)
3. **Era Consistency** — All props must fit the ancient Chinese worldview, no modern elements
4. **Scale Clarity** — Imply real prop size through reference objects or labels
5. **Pure Prop Independent Display** — Only the prop itself can appear in the image; no people, hands, or limbs allowed; props cannot be in a held/worn/grasped state; must be independently presented as still-life display

---

## II. Prop Categories and Aesthetic Constraints

### 2.1 Weapons

| Item | Constraint | Prompt |
|---|---|---|
| Type | Sword/knife/bow/spear/fan | {weapon type}, ancient Chinese weapon |
| Material | Fine steel/dark iron + gem inlay + silk tassel | Fine steel forged, gem inlay |
| Decoration | Scabbard/handle carving, tassels, subtle patterns | Exquisite carving, dangling tassels |
| Sheen | Cold metal sheen, blade reflection | Cold sheen, metal texture |
| Prompt | Ancient Chinese {weapon}, fine steel forged, exquisite carving | — |

### 2.2 Ornaments

| Item | Constraint | Prompt |
|---|---|---|
| Type | Hairpin/hair clasp/jade necklace/jade pendant/bracelet/earring | {ornament type}, ancient Chinese jewelry |
| Material | Gold/silver/jade/pearl/gemstone | Gold wire weaving, translucent jade |
| Craft | Extreme refinement, filigree/cloisonne/inlay | Fine craftsmanship, meticulous carving |
| Sheen | Pearlescent/jade luster/metal sheen | Pearlescent luster, metal sheen |
| Prompt | Ancient Chinese {ornament}, {material}, fine craftsmanship, meticulous carving | — |

### 2.3 Daily Utensils

| Item | Constraint | Prompt |
|---|---|---|
| Type | Tea set/wine set/incense burner/chessboard/scroll/lantern | {utensil type}, ancient Chinese utensil |
| Material | Porcelain/copper/bamboo/wood/paper | Warm celadon, antique bronze |
| Texture | Glaze/wood grain/bamboo joint clear | Glaze sheen, clear wood grain |
| Style | Elegant/luxurious switchable by scene | Elegant and antique / luxurious and refined |
| Prompt | Ancient Chinese {utensil}, {material} texture, clear texture | — |

### 2.4 Tokens/Key Props

| Item | Constraint | Prompt |
|---|---|---|
| Type | Token/medallion/scroll/medicine bottle/jade seal | {prop type}, ancient Chinese prop |
| Specialness | Must have recognizability, narrative symbolic meaning | Unique form, profound meaning |
| Aging | Age feel can be added per story need | Antique and mottled / brand new and refined |
| Prompt | Ancient Chinese {prop}, {material}, {state}, unique form | — |

---

## III. Multi-Angle Design Sheet Specifications

### View Definitions

| Position | View | Angle | Requirement | Prompt |
|---|---|---|---|---|
| Top Left | Front View | Front 0° | Complete front form of prop | front view |
| Top Right | Side View | Side 90° | Thickness/outline/structure clear | side view |
| Bottom Left | Back View | Back 180° | Back structure/decoration of prop | back view |
| Bottom Right | Detail Closeup | Local magnified | Material texture/craft details | detail closeup |

### Frame Specifications

| Item | Constraint |
|---|---|
| Layout | Same image four-grid (2x2), four perspectives |
| Background | Plain gray solid #B8B8B8 |
| Lighting | Even soft light, no hard shadows |
| Proportion | Each grid prop occupies 70%+ of grid space |
| Shadow | Natural ground micro-shadow allowed |
| Aspect Ratio | Recommended 1:1 |

---

## IV. Material Render Constraints

| Material | Render Requirement | Prompt |
|---|---|---|
| Metal | Reflection/highlights/cold sheen, micro-scratches visible | Metal texture, cold sheen, clear reflection |
| Jade | Inner glow, warm, slightly translucent | Translucent jade, warm like fat |
| Wood | Clear wood grain, annual rings visible | Clear wood grain, warm texture |
| Porcelain | Glaze sheen, even color | Glaze sheen, warm porcelain |
| Cloth/Paper | Fiber texture, natural edges | Fabric texture, antique paper |
| Gemstone | Refraction/internal light, clear facets | Brilliant gem, light refraction |

---

## V. Prompt Template

Ancient Chinese prop design sheet, 3D render style, high-precision modeling, PBR materials, Chinese traditional 3D, cinematic lighting,
{prop type}, {material description}, {craft/decoration description}, {state description},
Pure prop still-life display, prop independently displayed, no one holding, no one wearing,
Same image four-grid (2x2): top left front view + top right side view + bottom left back view + bottom right detail closeup,
Plain gray solid background, even soft light, no hard shadows,
Ultra-clear material texture, PBR material render, {material sheen description}
No text in the image,
No people, hands, fingers, or limbs may appear in the image; props cannot be in a held or worn state

---

## VI. Constraint Rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Must specify "plain gray solid background" |
| R2 | Must clearly state prop material and craft |
| R3 | Prop design must fit ancient Chinese worldview |

### Prohibited

| No. | Prohibited |
|---|---|
| X1 | Complex scene background |
| X2 | Prop and person in same image (this stage is pure prop image) |
| X3 | Any human figure, including full body, half body, or body parts (hands, fingers, arms etc.) |
| X4 | Prop in held, grasped, worn, or in-use state |
| X5 | Elements suggesting human presence (e.g., hand-holding marks, wearing perspective, usage posture) |
