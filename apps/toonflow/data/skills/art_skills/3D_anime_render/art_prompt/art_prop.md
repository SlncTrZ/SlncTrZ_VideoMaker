# 3D Anime Render Urban Prop Image Generation · Constraint Manual

---

## I. Prop Design Principles

1. **Function Readable** — Prop purpose clear at a glance, form serves function
2. **Texture Excellence** — Material texture must be clearly distinguishable (metal/glass/plastic/wood/cloth), but cel-shaded render moderately simplified
3. **Era Consistency** — All props must fit the modern urban worldview, no ancient/futuristic elements
4. **Scale Clarity** — Imply real prop size through reference objects or labels
5. **Pure Prop Independent Display** — Only the prop itself can appear in the image; no people, hands, or limbs allowed; props cannot be in a held/worn/grasped state; must be independently presented as still-life display

---

## II. Prop Categories and Aesthetic Constraints

### 2.1 Office Supplies

| Item | Constraint | Prompt |
|---|---|---|
| Type | Notebook/pen/folder/calculator | {prop type}, urban office supply |
| Material | Plastic/metal/paper | Modern material, urban texture |
| Decoration | Simple design, brand logo | Simple design, urban style |
| Sheen | Moderate sheen, clear reflection | Moderate sheen, clear reflection |
| Prompt | 3D anime render urban {prop}, modern material, simple design | — |

### 2.2 Daily Utensils

| Item | Constraint | Prompt |
|---|---|---|
| Type | Coffee cup/water cup/tableware/lamp | {utensil type}, urban daily utensil |
| Material | Glass/ceramic/metal/plastic | Glass texture, modern design |
| Texture | Smooth surface, clear material | Smooth surface, clear material |
| Style | Simple/modern switchable by scene | Simple modern / urban style |
| Prompt | 3D anime render urban {utensil}, {material} texture, clear texture | — |

### 2.3 Electronic Devices

| Item | Constraint | Prompt |
|---|---|---|
| Type | Phone/tablet/headphones/camera | {device type}, urban electronic device |
| Material | Metal/glass/plastic | Modern device material, smooth texture |
| Craft | Exquisite craftsmanship, brand design | Exquisite craftsmanship, brand design |
| Sheen | Moderate reflection, screen glow effect | Moderate reflection, screen glow |
| Prompt | 3D anime render urban {device}, modern material, screen glow effect | — |

### 2.4 Clothing Accessories

| Item | Constraint | Prompt |
|---|---|---|
| Type | Glasses/watch/bag/keychain | {accessory type}, urban clothing accessory |
| Material | Metal/leather/fabric/glass | Leather texture, metal texture |
| Craft | Brand craftsmanship, refined design | Brand craftsmanship, refined design |
| Sheen | Moderate sheen, brand logo clear | Moderate sheen, brand logo clear |
| Prompt | 3D anime render urban {accessory}, {material}, brand design | — |

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
| Background | Clean neutral gray #E8E8E8 |
| Lighting | Even soft light, no hard shadows |
| Proportion | Each grid prop occupies 70%+ of grid space |
| Shadow | Natural ground micro-shadow allowed (cel-shaded treatment) |
| Aspect Ratio | Recommended 1:1 |

---

## IV. Material Render Constraints

| Material | Render Requirement | Prompt |
|---|---|---|
| Metal | Reflection/highlights/cold sheen (cel-shaded treatment), micro-scratches visible | Metal texture, cel-shaded sheen, clear reflection |
| Glass | Transparency/refraction/glow (cel-shaded simplified) | Glass texture, clear transparency |
| Plastic | Smooth surface/slight reflection | Plastic texture, smooth surface |
| Leather | Clear texture/natural wrinkles | Leather texture, natural texture |
| Paper | Surface texture/slight wrinkles | Paper texture, surface texture |
| Fabric | Fiber texture/natural folds | Fabric texture, natural texture |

---

## V. Prompt Template

```
3D animation render, cinematic lighting, vibrant cel-shaded texture, high-detail materials, joyful healing atmosphere, cartoon urban style, high-detail cartoon materials, moderate cartoon proportions, warm color palette, 8K ultra HD, cinematic composition, soft light and shadow layers, bright cartoon render style, warm and healing, prop design sheet,
anime style, cel-shaded, 3D animation render,
{prop type}, {material description}, {craft/decoration description}, {state description},
Pure prop still-life display, prop independently displayed, no one holding, no one wearing,
Same image four-grid (2x2): top left front view + top right side view + bottom left back view + bottom right detail closeup,
Clean neutral gray background, even soft light, no hard shadows,
Clear material texture, cel-shaded render, {material sheen description}, modern cartoon urban style,
8K ultra HD, cinematic composition,
No text in the image,
No people, hands, fingers, or limbs may appear in the image; props cannot be in a held or worn state
```

---

## VI. Constraint Rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Must specify "clean neutral gray background" |
| R2 | Must clearly state prop material and craft |
| R3 | Prop design must fit modern urban worldview |
| R4 | Must include 3D animation render keywords (cel-shaded, 3D animation render, anime style) |
| R5 | Must include 8K ultra HD, cinematic composition keywords |

### Prohibited

| No. | Prohibited |
|---|---|
| X1 | Complex scene background |
| X2 | Prop and person in same image (this stage is pure prop image) |
| X3 | Any human figure, including full body, half body, or body parts (hands, fingers, arms etc.) |
| X4 | Prop in held, grasped, worn, or in-use state |
| X5 | Elements suggesting human presence (e.g., hand-holding marks, wearing perspective, usage posture) |
| X6 | Using realistic photography terms (e.g., real photography, photorealistic, RAW photo etc.) |
| X7 | Overly realistic material texture, breaking cel-shaded style consistency |
| X8 | Ancient/futuristic elements, non-modern urban style |
