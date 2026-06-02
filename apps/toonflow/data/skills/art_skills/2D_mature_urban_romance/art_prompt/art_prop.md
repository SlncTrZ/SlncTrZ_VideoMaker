# Anime Prop Image Generation · Constraint Manual

---

## I. Prop Design Principles

1. **Functional Readability** — Prop purpose is immediately clear, form serves function
2. **Extreme Texture** — Material texture must be clearly distinguishable (metal/plastic/wood/glass/fabric)
3. **Style Uniformity** — All props must align with modern urban romance worldview, no incongruous elements
4. **Clear Scale** — Hint at prop's real size through reference objects or annotations
5. **Pure Prop Independent Display** — Only the prop itself may appear in the frame; no people, hands, or limbs allowed; props must not be in a held/worn/grasped state; must be presented independently as still life arrangement

---

## II. Prop Classification and Aesthetic Constraints

### 2.1 Office Supplies

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Type | Pen/notebook/folder/glasses | Office {type}, modern office supplies |
| Material | Metal/plastic/leather/paper | Metal pen clip, leather notebook |
| Decoration | Simple design, brand logo (optional) | Simple design, refined brand logo |
| Luster | Matte/slight luster/metallic reflection | Matte texture, metallic reflection |
| Prompt | Modern {prop}, simple design, clear texture | — |

### 2.2 Drinkware/Utensils

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Type | Coffee cup/glass/travel mug | Coffee cup, glass, travel mug |
| Material | Glass/ceramic/metal/plastic | Transparent glass, ceramic coffee cup |
| Decoration | Brand logo/pattern (optional) | Simple brand logo, no pattern |
| Luster | Glass reflection, ceramic glaze luster, metallic luster | Clear glass reflection, warm ceramic |
| Prompt | Modern {prop}, clear material, cel shading texture | — |

### 2.3 Personal Items

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Type | Phone/watch/glasses/keys | Modern {prop}, personal item |
| Material | Metal/glass/plastic/leather | Glass screen, metal frame |
| Decoration | Simple design, brand logo (optional) | Simple design, refined logo |
| Luster | Glass reflection, metallic luster | Clear glass reflection, metallic texture |
| Prompt | Modern {prop}, clear material, refined details | — |

### 2.4 Daily Utensils

| Item | Constraint | Prompt Keywords |
|---|---|---|
| Type | Book scroll/decorative painting/aromatherapy/lamp | Modern {prop}, daily utensil |
| Material | Wood/glass/metal/fabric | Wooden book cover, glass lampshade |
| Texture | Clear material texture, natural edges | Clear wood grain, translucent glass |
| Style | Simple modern/warm homey | Simple modern, warm homey |
| Prompt | Modern {prop}, clear material, coordinated atmosphere | — |

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
| Background | Pure neutral gray `#E8E8E8` |
| Lighting | Even soft light, no hard shadows |
| Proportion | Each prop occupies 70%+ of its cell |
| Shadow | Natural ground micro-shadow allowed |
| Aspect Ratio | Recommended 1:1 |

---

## IV. Material Rendering Constraints

| Material | Rendering Requirement | Prompt Keywords |
|---|---|---|
| Metal | Reflection/highlight/luster, slight scratches visible | Metallic texture, clear reflection, slight scratches visible |
| Glass | Translucent, reflection, refraction effect | Translucent glass, clear reflection, natural refraction |
| Wood | Clear wood grain, growth rings visible | Clear wood grain, natural texture |
| Ceramic | Glaze luster, even color | Smooth glaze, even color |
| Plastic | Matte/slight luster, clear edges | Plastic texture, clear edges |
| Fabric | Fiber texture, natural edges | Fabric texture, natural fibers |
| Leather | Clear texture, soft luster | Leather texture, natural luster |

---

## V. Prompt Template

Anime prop design sheet,
anime style, cel shading, modern urban style,
cinematic composition, ultra detailed, 8K, high quality,
shallow depth of field, film grain, lens vignette,
cel shading anime style, modern urban style, dramatic low-key lighting,
prop design sheet, item concept art, no people, no characters, no human figures,
{prop type}, {material description}, {craftsmanship/decoration description}, {condition description},
pure prop still life display, prop independently displayed, no one holding, no one wearing,
same frame quad-grid (2×2): top left front view + top right side view + bottom left back view + bottom right detail close-up,
pure neutral gray background, even soft light, no hard shadows,
ultra-clear material texture, cel shading texture, {material luster description}
no text in the image,
no people, hands, fingers, or limbs may appear in the frame; props must not be in a grasped or worn state

---

## VI. Constraint Rules

### Mandatory

| Number | Rule |
|---|---|
| R1 | Must specify "pure neutral gray background" |
| R2 | Must clearly define prop material and craftsmanship |
| R3 | Prop design must align with modern urban romance worldview |
| R4 | Must include "anime style" keywords (anime style / cel shading) |
| R5 | Must include depth of field features (shallow depth of field / vignette at least one), maintain anime cel shading style |

### Prohibited

| Number | Prohibition |
|---|---|
| X1 | Complex scene backgrounds |
| X2 | Prop and person in same frame (this step is pure prop image) |
| X3 | Any human figure appearing, including full body, half body, or partial (hands, fingers, arms, etc.) |
| X4 | Prop in a held, grasped, worn, or in-use state |
| X5 | Elements suggesting the presence of a person (e.g., holding marks, wearing perspective, use posture) |
| X6 | Using realistic photography/3D rendering related terms |
| X7 | High-saturation fluorescent/neon colors |
| X8 | Ancient-style/fantasy/sci-fi elements conflicting with modern urban romance worldview |
