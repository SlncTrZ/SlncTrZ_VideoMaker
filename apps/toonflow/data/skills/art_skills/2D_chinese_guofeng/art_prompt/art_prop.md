---
name: art_prop
description: Prop Image Generation · Constraint Manual
metaData: art_skills
---

# Prop Image Generation · Constraint Manual

---

## I. Prop Design Principles

1. **Functional Readability** — Prop purpose is immediately clear, form serves function
2. **Extreme Texture** — Material texture must be clearly distinguishable (metal/jade/wood/cloth/paper/ceramic)
3. **Era Consistency** — All props must align with ancient-style worldview, no modern elements
4. **Clear Scale** — Hint at prop's real size through reference objects or annotations
5. **Pure Prop Independent Display** — Only the prop itself may appear in the frame; no people, hands, or limbs allowed; props must not be in a held/worn/grasped state; must be presented independently as still life arrangement

---

## II. Prop Classification and Aesthetic Constraints

### 2.1 Weapon Class

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Type | Sword/blade/bow/spear/fan | {weapon type}, ancient-style weapon |
| Material | Fine steel/dark iron + gem inlay + silk tassel | Fine steel forged, gem inlaid |
| Decoration | Scabbard/handle carving, tassels, dark pattern | Fine carving, dangling tassels |
| Luster | Metallic cold luster, blade reflection | Cold luster, metallic texture |
| Style | Chinese-style anime | Neo-Chinese style, anime rendering |

### 2.2 Jewelry/Accessory Class

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Type | Hairpin/hair clasp/yingluo/jade pendant/bracelet/earring | {accessory type}, ancient-style jewelry |
| Material | Gold/silver/jade/pearl/gem | Gold wire weaving, translucent jade |
| Craftsmanship | Extremely fine, filigree/cloisonné/inlay | Fine craftsmanship, meticulously carved |
| Luster | Pearl luster/jade warmth/metallic luster | Pearly luster, metallic luster |
| Style | Chinese-style anime | Refined and luxurious, neo-Chinese style |

### 2.3 Daily Utensil Class

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Type | Teaware/wine vessel/incense burner/chessboard/book scroll/lantern | {utensil type}, ancient-style utensil |
| Material | Ceramic/copper/bamboo/wood/paper | Warm celadon, antique bronze |
| Texture | Glaze/wood grain/bamboo nodes clear | Glossy glaze, clear wood grain |
| Style | Neo-Chinese | Simple and elegant / luxurious refined |
| Rendering | Cel shading flat coloring | Anime texture, delicate brushwork |

### 2.4 Token/Key Prop Class

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Type | Token/medallion/scroll/vial/jade seal | {prop type}, ancient-style prop |
| Specialness | Must have recognizability, narrative symbolic meaning | Unique shape, profound meaning |
| Aging Effect | Can add age effect as story requires | Old mottled / brand new refined |
| Style | Chinese-style anime | Neo-Chinese style, anime feel |

### 2.5 Four Treasures of Study Class (New)

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Type | Brush/ink/paper/inkstone | {study type}, four treasures of study |
| Material | Bamboo/wood/jade/ceramic | Bamboo brush handle, ceramic inkstone |
| Texture | Wood grain/glaze/brush tip clear | Fine brush tip, warm inkstone |

### 2.6 Festive Prop Class (New)

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Type | Lantern/firework/couplet/fu character | {festive type}, festive prop |
| Material | Paper/cloth/bamboo/silk | Silk lantern, paper couplet |
| Texture | Paper grain/fabric texture clear | Clear texture, fine texture |
| Style | Joyful and lively | Bright colors, lively atmosphere |

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
| Background | Moon white solid #E8EAF5 |
| Lighting | Even soft light, no hard shadows |
| Proportion | Each prop occupies 70%+ of its cell |
| Shadow | Natural ground micro-shadow allowed |
| Aspect Ratio | Recommended 1:1 |

---

## IV. Material Rendering Constraints

| Material | Rendering Requirement | Prompt Keywords |
|---|---|---|
| Metal | Reflection/highlight/cold luster, slight scratches visible | Metallic texture, cold luster, clear reflection |
| Jade | Inner glow, warm, slightly translucent | Jade-like translucency, warm as fat |
| Wood | Clear wood grain, growth rings visible | Clear wood grain, warm texture |
| Ceramic | Glaze luster, even color | Glossy glaze, warm ceramic texture |
| Cloth/Paper | Fiber texture, natural edges | Fabric texture, antique paper |
| Gem | Refraction/internal light, clear facets | Brilliant gem, light refraction |
| Cel Shading Texture | Even flat coloring, clear lines | Cel shading flat coloring, delicate brushwork |

---

## V. Prompt Template

Chinese-style anime prop design sheet,
Chinese-style anime, neo-Chinese aesthetic, Japanese anime rendering, cel shading flat coloring, delicate brushwork, cinematic texture,
{prop type}, {material description}, {craftsmanship/decoration description}, {condition description},
pure prop still life display, prop independently displayed, no one holding, no one wearing,
same frame quad-grid (2×2): top left front view + top right side view + bottom left back view + bottom right detail close-up,
moon white solid background, even soft light, no hard shadows,
ultra-clear material texture, fine texture, {material luster description}
Chinese-style anime HD rendering, high detail, delicate lines, cel shading feel,
no subtitles, no watermarks, no overlapping title text in the frame,
no people, hands, fingers, or limbs may appear in the frame; props must not be in a grasped or worn state

---

## VI. Constraint Rules

### Mandatory

| Number | Rule |
|---|---|
| R1 | Must specify "moon white solid background" |
| R2 | Must clearly define prop material and craftsmanship |
| R3 | Prop design must align with ancient-style worldview |
| R4 | Must use "quad-grid" layout: front + side + back + close-up |
| R5 | Must include "Chinese-style anime + cel shading flat coloring" keywords |

### Prohibited

| Number | Prohibition |
|---|---|
| X1 | Complex scene backgrounds |
| X2 | Prop and person in same frame (this step is pure prop image) |
| X3 | Any human figure appearing, including full body, half body, or partial (hands, fingers, arms, etc.) |
| X4 | Prop in a held, grasped, worn, or in-use state |
| X5 | Elements suggesting the presence of a person (e.g., holding marks, wearing perspective, use posture) |
| X6 | Modern elements appearing in ancient-style props |
