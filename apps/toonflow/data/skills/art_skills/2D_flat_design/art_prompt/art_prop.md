# Prop Image Generation · Flat Design Constraint Manual

---

## I. Prop Design Principles

1. **Functional Readability** — Prop purpose is immediately clear, form serves function
2. **Minimalist Color Blocks** — Material texture must be distinguished by color blocks, no complex details
3. **Era Consistency** — All props must align with ancient-style worldview, no modern elements
4. **Clear Scale** — Hint at prop's real size through reference objects or annotations
5. **Pure Prop Independent Display** — Only the prop itself may appear in the frame; no people, hands, or limbs allowed; props must not be in a held/worn/grasped state; must be presented independently as still life arrangement

---

## II. Prop Classification and Aesthetic Constraints

### 2.1 Weapon Class

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Type | Sword/blade/bow/spear/fan | {weapon type}, flat ancient-style weapon |
| Material | Solid color blocks, line outlining | Flat sword, line weapon, solid color sword |
| Decoration | Line carving, color block decoration | Line decoration, flat carving |
| Luster | No luster, solid color fill | No luster, flat weapon, matte sword |
| Prompt | Flat ancient-style {weapon}, solid color weapon, line decoration | — |

### 2.2 Jewelry/Accessory Class

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Type | Hairpin/hair clasp/yingluo/jade pendant/bracelet/earring | {accessory type}, flat ancient-style jewelry |
| Material | Solid color blocks, single color fill | Flat jewelry, color block jewelry, solid color jewelry |
| Craftsmanship | Simple lines, minimal craftsmanship | Flat craftsmanship, line jewelry |
| Luster | No luster, no reflection | No luster, flat jewelry, matte finish |
| Prompt | Flat ancient-style {accessory}, {material}, simple craftsmanship, line jewelry | — |

### 2.3 Daily Utensil Class

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Type | Teaware/wine vessel/incense burner/chessboard/book scroll/lantern | {utensil type}, flat ancient-style utensil |
| Material | Solid color blocks, line outlining | Flat utensil, color block utensil, solid color object |
| Texture | Color block distinction, no texture | Flat texture, no texture, flat texture |
| Style | Simple/elegant or luxurious switch by scene | Flat simple / flat luxurious |
| Prompt | Flat ancient-style {utensil}, {material} color block, clear lines | — |

### 2.4 Token/Key Prop Class

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Type | Token/medallion/scroll/vial/jade seal | {prop type}, flat ancient-style prop |
| Specialness | Flat shape, simple recognizability | Flat shape, simple prop |
| Condition | Can add flat aging effect | Flat old item / flat new item |
| Prompt | Flat ancient-style {prop}, {material} color block, flat condition, simple shape | — |

---

## III. Multi-Angle Character Sheet Specifications

### View Definitions

| Position | View | Angle | Requirement | Prompt Keywords |
|---|---|---|---|---|
| Top Left | Front View | Front 0° | Complete front form of prop | front view |
| Top Right | Side View | Side 90° | Clear thickness/outline/structure | side view |
| Bottom Left | Back View | Back 180° | Back structure/decoration of prop | back view |
| Bottom Right | Detail Close-up | Local Zoom | Line/color block details | detail closeup |

### Image Specifications

| Item | Constraint |
|---|---|
| Layout | Quad-grid (2×2) in one frame, four angles |
| Background | Pure neutral gray #E8E8E8 |
| Lighting | No light and shadow, pure flat color blocks |
| Proportion | Each prop occupies 70%+ of its cell |
| Shadow | No shadow, pure flat |
| Aspect Ratio | Recommended 1:1 |

---

## IV. Material Rendering Constraints

| Material | Rendering Requirement | Prompt Keywords |
|---|---|---|
| Metal | Solid color fill, no reflection | Flat metal, solid color metal, solid metal |
| Jade | Solid color fill, no translucency | Flat jade, solid color jade, solid jade |
| Wood | Solid color fill, no wood grain | Flat wood, solid color wood, solid wood |
| Ceramic | Solid color fill, no glaze | Flat ceramic, solid color ceramic, solid porcelain |
| Cloth/Paper | Solid color fill, no fiber | Flat fabric, solid color fabric, solid fabric |
| Gem | Solid color fill, no refraction | Flat gem, solid color gem, solid gem |

---

## V. Prompt Template

```
Flat ancient-style prop design sheet,
2d flat design, vector art, flat illustration,
minimalist, clean lines, solid colors,
{prop type}, {material description}, {craftsmanship/decoration description}, {condition description},
pure prop still life display, prop independently displayed, no one holding, no one wearing,
same frame quad-grid (2×2): top left front view + top right side view + bottom left back view + bottom right detail close-up,
pure neutral gray background, no light and shadow, no gradient,
clear lines, distinct color blocks, {material luster description}
no text in the image,
no people, hands, fingers, or limbs may appear in the frame; props must not be in a grasped or worn state
```

---

## VI. Constraint Rules

### Mandatory

| Number | Rule |
|---|---|
| R1 | Must specify "pure neutral gray background" |
| R2 | Must clearly define prop material and craftsmanship (flat expression) |
| R3 | Prop design must align with ancient-style worldview |

### Prohibited

| Number | Prohibition |
|---|---|
| X1 | Complex scene backgrounds |
| X2 | Prop and person in same frame (this step is pure prop image) |
| X3 | Any human figure appearing, including full body, half body, or partial (hands, fingers, arms, etc.) |
| X4 | Prop in a held, grasped, worn, or in-use state |
| X5 | Elements suggesting the presence of a person (e.g., holding marks, wearing perspective, use posture) |
| X6 | Adding gradient/shadow/highlight/three-dimensional effects |
| X7 | Materials too complex, color blocks not clearly distinguishable |
| X8 | Modern elements, non-ancient-style design |
