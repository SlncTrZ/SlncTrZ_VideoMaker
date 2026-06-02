---
name: art_character_derivative
description: 3D Guofeng Cyber Character Derivative Asset Generation · Constraint Manual
metaData: art_skills
---

# 3D Guofeng Cyber Character Derivative Asset Generation · Constraint Manual
## (Dual-Adapted Version: Ancient Traditional Scenes + Modern Urban Cyber Scenes)

---

## I. Overlay Principles (Dual-Scene Universal Core Rules)

1. **Face Unchanged** — After overlay, facial features must be 100% identical to the base model; face shifting, deformation, or stylistic tampering prohibited
2. **Posture Unchanged** — Maintain the base model's natural standing posture; any posture/action/body movement changes prohibited
3. **Layer-by-Layer Controllable** — Each layer independently described; ancient/cyber elements layered independently for easy layer replacement (change clothes without changing makeup, change cyber elements without changing guofeng foundation)
4. **Style Unified** — All styling elements follow the same aesthetic system; **ancient scenes take Eastern traditional aesthetics as core with cyber elements as lightweight optional fusion; urban scenes take guofeng form as foundation with cyber function as core expression**; avoid guofeng and cyber element fragmentation throughout
5. **Quality Not Degraded** — After overlay, quality standard not lower than base model; 3D PBR materials, cinematic lighting as universal baseline across all scenes
6. **Pure Styling Scope** — Only overlay makeup/hairstyle/clothing/accessories; props, scenes, environments, and actions prohibited
7. **One-Click Dual-Scene Adaptation** — When no explicit cyber/urban cues, default to pure ancient generation; when explicit cyber/urban cues present, auto-match guofeng cyber urban system without restructuring underlying logic

---

## II. Overlay Layers (Dual-Scene Fully Compatible Layered Structure)

| Layer | Content | Dual-Scene Adaptation Notes |
|---|---|---|
| L0 | Base Model | Basic image base model, face/body/standing posture fully locked, universal for ancient/urban scenes, no modifications |
| L1 | Makeup (Decision Layer) | First analyze user cues, then decide intensity and style of "base makeup / light makeup / formal makeup / cyber function makeup / urban commute makeup", includes two systems: ancient-exclusive traditional makeup, urban cyber-exclusive light-effect makeup |
| L2 | Hairstyling | Guofeng updo/bun/braid + traditional hair accessories/cyber function hair pieces, includes two systems: ancient traditional styling, urban cyber lightweight styling, high-precision hair strand standard universal across all scenes |
| L3 | Inner Garment/Base Layer | Replace white base inner garment; ancient scenes use traditional silk inner garment, urban scenes use guofeng functional fabric base layer, can incorporate controllable circuit patterns, micro-neon light strips |
| L4 | Outer Garment/Main Attire | Core dual-adaptation layer: ancient scenes use Chinese traditional formal wear/ceremonial wear/casual wear; urban scenes use **guofeng form as core cyber function wear** (must retain mandarin collar/curved front/frog buttons/ru skirt etc. Chinese core structures), pure Western-style function wear without guofeng core prohibited |
| L5 | Accessories | Traditional headwear/earrings/necklaces/waist ornaments/hand ornaments + guofeng cyber function accessories/light-sensitive components; ancient scenes use traditional accessories primarily with lightweight cyber accents; urban scenes use guofeng+cyber fusion accessories; pure Western cyber accessories prohibited throughout |

> **Scope Boundary**: Character derivative assets include only L0–L5 layers (styling/makeup/costume), excluding props (umbrella/sword/fan/book/lantern etc. handheld items), scene environments (indoor/outdoor/weather etc.), posture actions (walking/turning/waving etc.). These belong to other asset type categories; cyber function elements limited to L1-L5 styling scope, must not exceed boundaries to modify base model body structure.

---

## III. Makeup Constraints (L1 · Ancient + Urban Dual System)

### Base Model to Derivative Makeup Strategy (Critical)

> Although the character base model is makeup-free, derivative assets default to entering the makeup process. The system should analyze makeup needs based on user-provided cues, prioritize matching ancient/urban scene attributes, then decide intensity within the corresponding makeup system. When no explicit scene cues, default to ancient system; do not arbitrarily switch.

### L1 Cue Analysis and Makeup Decision

| Step | Processing Content | Decision Result |
|---|---|---|
| S1 | Extract user cues: facial state words, emotion words, intensity words, style words, scene words (ancient/urban) | Form "scene + makeup" dual-dimension requirement summary |
| S2 | Filter non-makeup cues: prop/scene/action/posture words not used as makeup basis | Prevent misjudgment |
| S3 | First match ancient/urban scene system, then match makeup style matrix and give intensity level | Ancient system: base makeup / light makeup / formal makeup; Urban system: commute makeup / business makeup / cyber function makeup |
| S4 | Generate final L1 prompt | Only output conclusion, not analysis process |

### Cue to Makeup Mapping (Execution Standard · Dual-Scene Adapted)

| Cue Type | Typical Cues | Scene Match | L1 Decision |
|---|---|---|---|
| No clear scene/facial emphasis cues | Only clothing/hairstyle changes, no emotion/state emphasis | Ancient default | Base makeup |
| Mild facial cues | Gentle, smiling, slight eyelash flutter, slightly improved complexion | Ancient/urban universal | Light makeup (very light) |
| Clear ancient daily cues | Daily, boudoir, going out, leisure, literati gathering | Ancient scene | Base makeup (natural translucent) |
| Clear ancient formal ceremony cues | Grand wedding, ceremony, court, important occasion | Ancient scene | Formal makeup (refined luxurious) |
| Clear urban daily cues | Commute, urban daily, leisure outing | Urban cyber scene | Urban commute makeup (translucent natural + very light texture) |
| Clear urban formal cues | Business, holographic meeting, urban gala | Urban cyber scene | Urban business makeup (refined matte + cool-toned texture) |
| Clear cyber function cues | Cyber, function, night mission, mission, neon, futuristic | Urban cyber scene | Cyber function makeup (controllable light effect, fused with guofeng) |

> Judgment principles:
> 1. All derivative assets must have makeup; first check scene cues to match system, then check facial cues to determine intensity and style; props, scenes, posture changes must not independently raise makeup intensity
> 2. Cyber function cues can only trigger urban cyber system makeup; without corresponding cues, do not arbitrarily add cyber light-effect makeup
> 3. Ancient scenes without explicit cyber cues: prohibit adding any cyber light effects/function makeup, ensuring pure ancient scene full compatibility

### Female Makeup Style Matrix (Dual-Scene Full Coverage)

| System | Style | Applicable Scenes | Core Prompt |
|---|---|---|---|
| Ancient system | Elegant natural makeup | Ancient daily, first meeting, boudoir, literati gathering | Elegant makeup, lightly brushed brows, natural fresh face |
| Ancient system | Court noble makeup | Ancient court, formal, power, ceremony | Refined makeup, sharp brow shape, rosy lip color |
| Ancient system | Romantic peach makeup | Ancient dating, heart-fluttering, sweet scenes | Peach blossom makeup, slightly reddened eye tail, moist lip color |
| Ancient system | Grand wedding makeup | Ancient wedding, ceremony | Rich gorgeous makeup, vermilion lips and phoenix eyes |
| Ancient system | Festival celebration makeup | Ancient festival, gathering | Bright colors, pastel makeup |
| Urban cyber system | Urban commute makeup | Urban daily, commute, leisure outing | Translucent natural look, natural brow shape, even base makeup, no exaggerated colors |
| Urban cyber system | Urban business makeup | Urban business, holographic meeting, formal occasions | Matte cool-toned base, sharp brow shape, deep eye makeup, low-saturation textured lip color |
| Urban cyber system | Cyberstreaming light makeup | Urban night outing, cyber scene, function leisure | Slight neon light effect at eye tail, skin-adherent circuit pattern, lip color with fine shimmer, light non-heavy makeup |
| Urban cyber system | Function cool-toned makeup | Urban mission, action, strong aura scenes | Matte cool-toned base, sharp brow shape, deep eye makeup, local matte function texture, no exaggerated light effects |

### Universal Base Skin (All Makeup · Dual-Scene Shared)

| Item | Constraint | Prompt |
|---|---|---|
| Texture | PBR material rendering, naturally translucent, controllable texture, 3D texture unified across all scenes | PBR material, natural luster, soft texture, delicate skin texture |
| Whiteness | Fair pink base, translucent not pale | Fair pink base, fair and translucent |
| Inner glow | Soft glow from within | Inner glow, skin translucent luminous |
| Cyber adaptation | Only urban cyber system can add skin-level circuit patterns, micro-neon light effects; must not cover base model skin texture; ancient system prohibited | Skin-adherent circuit pattern, controllable micro-neon light effect, naturally fused with skin |
| Prohibited | Matte/dead white/waxy/oily/overexposed, large-area cyber coating covering base model, harsh strong light, adding cyber elements without authorization in ancient scenes | — |

### Base Makeup Detail (Ancient Default Level · Dual-Scene Universal)

| Item | Constraint | Prompt |
|---|---|---|
| Brows | Lightly groom following base model brow shape, do not change brow type | Natural brow grooming, clean brow shape |
| Eyes | Very light eye decoration, emphasizing translucency and brightness | Clear eyes, very light eye shadow |
| Cheeks | Very light complexion brightening, pastel blush | Natural cheek color, pastel blush |
| Lips | Light pink or vermilion coloring, restrained | Natural moist lip color, light pink lips |
| Overall | Visible makeup but very light feel | Base makeup, natural makeup feel, soft texture |

### Male Makeup (Dual-Scene Adapted)

| System | Item | Constraint | Prompt |
|---|---|---|---|
| Ancient universal | Base skin | PBR material rendering, fair translucent, fresh natural | PBR material, fair translucent, natural luster |
| Ancient universal | Core principle | Natural look — appears makeup-free but excellent skin | Natural look, naturally good skin |
| Ancient universal | Brows | Natural thick brows, do not change base model brow shape | Natural straight brows, heroic brow shape |
| Ancient universal | Lip color | Natural blood color, slightly moist | Natural lip color, blood tone |
| Urban cyber system | Cyber adaptation | Can only add local matte function texture, very light circuit pattern, no exaggerated light effects, disabled without clear cues | Very light skin-adherent circuit pattern, matte function texture, no strong light |
| Urban cyber system | Urban business makeup | Matte translucent base, sharp brow shape, no excess makeup feel | Clear matte base, sharp brow shape, natural look texture |

---

## IV. Hairstyling Constraints (L2 · Ancient + Urban Dual System)

### Female Styling Types (Dual-Scene Full Coverage)

| System | Style | Description | Applicable Scenes | Prompt |
|---|---|---|---|---|
| Ancient system | High bun cloud hair | High bun updo + traditional hair accessories | Ancient court, formal, ceremony | High bun cloud hair, delicate updo, traditional Chinese style |
| Ancient system | Double loop bun | Double loop symmetrical, girlish | Ancient young character, daily | Double loop bun, girlish style, Chinese traditional styling |
| Ancient system | Side sagging bun | Low side bun, languid feel | Ancient daily, leisure, boudoir | Side sagging bun, languid side bun, Chinese traditional styling |
| Ancient system | Loose hair | Long hair fully loose, naturally falling | Ancient boudoir, private, nighttime | Long hair loose, naturally falling, Chinese traditional texture |
| Ancient system | High ponytail | High tied, neat and capable | Ancient martial arts, action scenes | High tied ponytail, neat capable, Chinese traditional tying |
| Ancient system | Half-up style | Top half tied up + back loose hair | Ancient daily, going out | Half-up cloud bun, naturally loose, Chinese traditional styling |
| Urban cyber system | Guofeng half-up low ponytail | Chinese half-up + low ponytail, neat not dragging | Urban commute, daily outing | Guofeng half-up low ponytail, Chinese braid accent, capable daily, high-precision hair strands |
| Urban cyber system | Guofeng high-tie function bun | Chinese high bun + function structure fixed, can embed micro-neon light strip | Urban formal, holographic gala, function scenes | Guofeng high-tie function bun, titanium alloy hair piece fixing, embedded controllable micro-neon light strip |
| Urban cyber system | Guofeng semi-mechanical braid | Chinese three-strand braid + function braid rope, micro-light tassel accent | Urban leisure, night outing, cyber scenes | Guofeng semi-mechanical braid, Chinese braid foundation, function braid rope, light-sense tassel accent |
| Urban cyber system | Guofeng high ponytail | Chinese tied up + high ponytail, function hair clip fixing | Urban function, action, mission scenes | Guofeng high ponytail, Chinese tied foundation, function hair clip fixing, neat capable |

### Female Hair Accessories (Dual-Scene Adapted)

| System | Constraint | Prompt |
|---|---|---|
| Ancient system | Luxurious delicate, matching attire, pure traditional Chinese materials and craftsmanship, no cyber elements (disabled without clear cues) | Luxurious hair accessories, delicate craftsmanship, gold and silver hairpins, full of pearls and jade, fine carving |
| Urban cyber system | Guofeng form as core, matching attire, traditional materials + cyber function materials fusion, controllable light effects | Guofeng cyber hair accessories, delicate craftsmanship, gold-silver-jade + titanium alloy function parts, controllable micro-neon light strip, holographic projection accent |

### Male Styling Types (Dual-Scene Full Coverage)

| System | Style | Applicable Scenes | Prompt |
|---|---|---|---|
| Ancient system | Half-crown tied | Ancient daily, literati, gathering | Half-crown tied, jade hairpin binding, Chinese traditional styling |
| Ancient system | Full crown high tie | Ancient formal, court, ceremony | Full crown high tie, jade crown binding, Chinese traditional style |
| Ancient system | Loose hair over shoulders | Ancient private, nighttime scenes | Loose hair over shoulders, long hair like ink, Chinese traditional texture |
| Ancient system | High ponytail tie | Ancient combat, martial arts scenes | High tied battle hair, neat ponytail, Chinese traditional tying |
| Urban cyber system | Guofeng function half-crown tied | Urban daily, commute, business scenes | Guofeng function half-crown tied, Chinese tied foundation, matte titanium alloy hair piece, neat capable |
| Urban cyber system | Guofeng low ponytail tied | Urban leisure, daily outing | Guofeng low ponytail tied, Chinese tied foundation, minimalist function hair clip, natural texture |
| Urban cyber system | Guofeng high-tie function hair | Urban function, mission, night outing scenes | Guofeng high-tie function hair, Chinese tied foundation, full-wrap function hair crown, matte craftsmanship |

---

## V. Clothing Constraints (L3+L4 · Dual-Scene Core Adaptation Layer)

### Core Red Line (Dual-Scene Universal · Non-Negotiable)
**All clothing must take Chinese traditional form as absolute core**; ancient scenes strictly follow Chinese clothing cutting logic; urban cyber scenes must retain at least 1 Chinese core structure among mandarin collar/curved front/frog buttons/ru skirt/duijin/large sleeves; pure Western-style suits, pure function jackets, pure Western cyberpunk clothing without guofeng core prohibited; ensure guofeng foundation is not lost in ancient + urban scenes.

### Female Clothing Matrix (Dual-Scene Full Coverage)

| System | Style | Core Style | Applicable Scenes | Prompt |
|---|---|---|---|---|
| Ancient system | Ancient daily long skirt | Chinese ru skirt form, flowing hem, traditional embroidery | Ancient daily, boudoir, gathering, outing | Guofeng ru skirt long dress, flowing dress, silk texture, traditional Suzhou embroidery pattern, multi-layer layering |
| Ancient system | Court ceremonial robe | Chinese ceremonial form, large sleeves, layered hem, luxurious embroidery | Ancient court, formal, ceremony, power scenes | Guofeng court ceremonial robe, luxurious dress, Chinese large-sleeve robe, gold thread embroidery, layered hem |
| Ancient system | Light casual wear | Chinese short jacket, mandarin collar curved front, fitted cut, neat not dragging | Ancient action, martial arts, outing scenes | Guofeng light casual wear, short jacket cut, mandarin collar curved front, cotton-linen silk texture, neat capable |
| Ancient system | Sleepwear | Thin silk inner garment, plain colored silk, loose comfortable | Ancient indoor, nighttime, private scenes | Guofeng sleepwear, loose comfortable, thin silk material, plain colored simple |
| Ancient system | Wedding dress | Phoenix crown and cape form, layered red attire, traditional wedding pattern | Ancient wedding, grand wedding ceremony | Guofeng grand wedding dress, phoenix crown and cape, layered red dress, gold thread embroidery, Chinese wedding dress form |
| Urban cyber system | Guofeng commute daily wear | Chinese mandarin collar/curved front shirt, modified short ru skirt, function fabric splicing, daily not exaggerated | Urban daily, commute, leisure outing | Guofeng cyber commute daily wear, Chinese mandarin collar curved front, modified ru skirt cut, silk and matte function fabric splicing, minimalist embroidery, capable daily |
| Urban cyber system | Guofeng business formal wear | Chinese duijin suit form, modified Tang suit structure, premium matte fabric, minimalist luxurious | Urban business, holographic meeting, formal occasions | Guofeng cyber business formal wear, Chinese duijin Tang suit foundation, premium matte fabric, three-dimensional cutting, minimalist Chinese pattern, luxurious understated |
| Urban cyber system | Light function guofeng daily wear | Chinese short jacket + function vest, curved front frog buttons + magnetic buckles, fitted cut, light capable | Urban action, night outing, function leisure scenes | Light function guofeng daily wear, Chinese curved front short jacket, function vest splicing, magnetic frog buttons, matte function fabric, capable neat |
| Urban cyber system | Guofeng cyber grand wedding/ceremony dress | Chinese phoenix crown and cape/ceremonial dress form, titanium alloy three-dimensional structure, layered hem, controllable micro-neon light strip | Urban grand wedding, holographic gala, important occasions | Guofeng cyber ceremony dress, Chinese ceremonial core form, silk and 3D printed structure splicing, gold thread embroidery and circuit pattern fusion, controllable micro-neon light strip |
| Urban cyber system | Guofeng function sleepwear | Chinese curved front inner garment, thin gauze and function lining splicing, loose comfortable, micro-shine texture | Urban indoor, nighttime, private scenes | Guofeng function sleepwear, Chinese curved front form, loose comfortable, thin gauze and function fabric splicing, micro-shine texture |

### Female Clothing Universal Constraints (Dual-Scene Adapted)

| Item | Constraint | Prompt |
|---|---|---|
| Main color | Ancient scenes default Chinese traditional colors; urban scenes can pair low-saturation cyber cool-tone contrast, controllable neon color accents; high-saturation harsh color combinations prohibited | Chinese traditional colors, guofeng cyber color scheme, low-saturation contrast, controllable neon color accent |
| Material | Ancient scenes default silk + embroidery + pearlescent fabric; urban scenes can splice matte function fabric, high-gloss reflective strips, 3D printed structural parts; must retain guofeng core fabric foundation | Silk texture, embroidery detail, ancient scenes pure traditional fabric; urban scenes traditional fabric and function fabric splicing, 3D printed three-dimensional structure |
| Texture | Ancient scenes default Chinese traditional patterns; urban scenes can fuse traditional patterns with circuit textures, cyber patterns, ultra-clear texture; pure cyber texture without guofeng core prohibited | Clear clothing texture, ultra-clear texture, ancient scenes pure Chinese traditional pattern; urban scenes traditional pattern and circuit texture deep fusion |
| Shoulders | Ancient scenes default guofeng cloud shoulder/draped silk; urban scenes can pair function shoulder armor/structural decoration, must unify with Chinese form | Ancient scenes cloud shoulder magnificent, draped silk flowing; urban scenes guofeng shoulder armor accent, unified with overall form |
| Layers | Multi-layer layering, clear layers, guofeng inner and outer wear logic unified; urban scene function structure must not destroy layering logic | Multi-layer layering, clear hierarchy, Chinese form logic unified |
| Light effect | Only urban cyber scenes can add embedded micro-neon light strip, controllable light effect not harsh, does not destroy clothing texture, no overexposure; ancient scenes disabled without clear cues | Urban scenes embedded micro-neon light strip, controllable light effect, no overexposure, naturally fused with clothing |

### Male Clothing Matrix (Dual-Scene Full Coverage)

| System | Style | Applicable Scenes | Prompt |
|---|---|---|---|
| Ancient system | Scholar literati attire | Ancient daily, study, gathering, outing | Guofeng scholar literati attire, long gown form, mandarin collar curved front, silk linen texture, traditional pattern embroidery |
| Ancient system | Warrior combat attire | Ancient combat, training, action scenes | Guofeng warrior combat attire, battle robe form, mandarin collar fitted, durable fabric, capable neat |
| Ancient system | Court ceremonial robe | Ancient court, ceremony, gala | Guofeng court robe, formal ceremonial form, large sleeves wide robe, luxurious fabric, traditional pattern |
| Ancient system | Casual wear | Ancient leisure, private, daily outing | Guofeng casual wear, simple style, comfortable fabric, Chinese mandarin collar, loose appropriate |
| Ancient system | Grand ceremonial robe | Ancient formal, celebration, important occasion | Guofeng grand ceremonial robe, luxurious delicate, Chinese ceremonial form, premium fabric, gold thread embroidery |
| Urban cyber system | Guofeng business commute attire | Urban daily, commute, business meeting | Guofeng business commute attire, Chinese mandarin collar Tang suit foundation, modified suit cut, premium matte fabric, minimalist Chinese pattern, capable appropriate |
| Urban cyber system | Guofeng function leisure wear | Urban daily, leisure outing, light function scenes | Guofeng function leisure wear, Chinese curved front short jacket, function fabric splicing, magnetic frog buttons, loose comfortable, daily versatile |
| Urban cyber system | Warrior function combat attire | Urban action, mission, night outing scenes | Guofeng warrior function combat attire, Chinese battle robe foundation, matte function fabric, three-dimensional protective structure, mandarin collar fitted, capable neat |
| Urban cyber system | Guofeng grand ceremony attire | Urban holographic gala, formal occasions, wedding | Guofeng grand ceremony attire, Chinese ceremonial core form, luxurious fabric, titanium alloy structure accent, traditional pattern and circuit pattern fusion |

---

## VI. Accessories Constraints (L5 · Dual-Scene Adapted)

### Female Accessories (Dual-Scene Separate System)

| System | Type | Constraint | Prompt |
|---|---|---|---|
| Ancient system | Headwear | Luxurious delicate, not thin, pure Chinese traditional material, matching hairstyle and clothing | Luxurious headwear, full of pearls and jade, gold and silver hairpins, jade step pendants, fine carving |
| Ancient system | Earrings | Traditional dangling tassels/jade earrings, unified with overall style | Tassel earrings, jade ear pendants, jade ear ornaments, gold and silver inlay |
| Ancient system | Necklace | Traditional necklace/collar, Chinese traditional form | Magnificent necklace, delicate collar, gold-silver-jade inlay |
| Ancient system | Waist ornaments | Traditional waist ribbon/jade pendant, Chinese traditional craftsmanship | Flowing waist ribbon, jade pendant at waist, jade step ornaments, delicate weaving |
| Ancient system | Hand ornaments | Traditional jade bangle/armlet, Chinese traditional form | Translucent jade bangle, delicate armlet, gold-silver-jade material |
| Urban cyber system | Headwear | Guofeng form as core, traditional material + cyber function material fusion, matching hairstyle and clothing, controllable light effect | Guofeng cyber headwear, pearls-jade + titanium alloy function parts, controllable micro-neon light strip, holographic projection accent, delicate craftsmanship |
| Urban cyber system | Earrings | Traditional jade earrings + cyber function earring fusion, light-sense tassel controllable not exaggerated | Guofeng function earrings, jade inlay + titanium alloy material, controllable micro-neon light-sense tassel, delicate compact |
| Urban cyber system | Necklace | Traditional necklace + function collar fusion, Chinese form as core | Guofeng function collar, necklace structure + titanium alloy material, embedded controllable micro-light, delicate fitting |
| Urban cyber system | Waist ornaments | Traditional waist ribbon/jade pendant + function waistband fusion, magnetic buckles, three-dimensional structure | Guofeng function waistband, wide waistband + waist ribbon splicing, jade pendant at waist, titanium alloy magnetic buckles, clear texture |
| Urban cyber system | Hand ornaments | Traditional jade bangle + function bracelet fusion, Chinese form as core, no exaggerated design | Guofeng function bracelet, translucent jade bangle + titanium alloy material, controllable micro-light, delicate fitting |

### Male Accessories (Dual-Scene Separate System)

| System | Type | Constraint | Prompt |
|---|---|---|---|
| Ancient system | Hair crown | Traditional jade crown/gold crown, delicate craftsmanship, Chinese traditional form, matching hairstyle and clothing | Jade crown hair tie, gold crown hair tie, jade carving, delicate craftsmanship |
| Ancient system | Waistband | Traditional wide waistband/leather belt, Chinese traditional form, clear texture | Wide waistband, leather belt, jade belt hook, clear texture |
| Ancient system | Jade pendant | Traditional translucent warm jade pendant, Chinese traditional craftsmanship, worn at waist | Jade pendant at waist, translucent warm, Hetian jade quality, delicate carving |
| Ancient system | Waist accessories | Sword/fan/flute limited to fixed waist ornaments, **handheld props prohibited**, Chinese traditional form | Fixed sword ornament at waist, folded fan hanging at waist, bamboo flute waist ornament, no handheld interaction |
| Urban cyber system | Hair crown | Traditional jade crown form + titanium alloy function material, matte craftsmanship, delicate modeling, matching hairstyle and clothing | Guofeng function hair crown, Chinese crown ornament foundation, matte titanium alloy material, jade inlay, delicate craftsmanship |
| Urban cyber system | Waistband | Traditional wide waistband form + function structure, magnetic buckles, three-dimensional cutting, clear texture | Guofeng function waistband, Chinese waistband foundation, matte function fabric, titanium alloy magnetic buckles, three-dimensional structure |
| Urban cyber system | Jade pendant | Traditional jade form + acrylic light-sense material, translucent warm, controllable micro-light, worn at waist | Guofeng light-sense jade pendant, traditional form, acrylic + jade material, translucent warm, controllable micro-light |
| Urban cyber system | Waist accessories | Traditional form + function material, limited to fixed waist ornaments, **handheld props prohibited** | Waist function sword fixed ornament, titanium alloy folding fan waist hanger, no handheld interaction |

---

## VII. Styling Combination Quick Reference (Dual-Scene Full Coverage)

| System | Scene | Makeup | Hairstyle | Clothing | Accessories |
|---|---|---|---|---|---|
| Ancient system | Boudoir daily | Elegant natural makeup | Loose hair/half-up style | Ancient daily long skirt | Medium (traditional simple accessories) |
| Ancient system | First meeting/gathering | Elegant natural makeup | Half-up/side sagging bun | Ancient daily long skirt | Medium-to-many (delicate traditional accessories) |
| Ancient system | Romantic interaction | Romantic peach makeup | Half-up/side sagging bun | Ancient daily long skirt/light casual wear | Medium |
| Ancient system | Court ceremony formal appearance | Court noble makeup | High bun cloud hair | Ancient court ceremonial robe | Maximum (traditional luxurious accessories) |
| Ancient system | Nighttime private | Elegant/peach makeup | Loose hair/side sagging bun | Ancient sleepwear | Minimal (no excess accessories) |
| Ancient system | Grand wedding ceremony | Grand wedding makeup | High bun cloud hair | Ancient grand wedding dress | Maximum (phoenix crown and cape full set) |
| Ancient system | Martial arts/action | Natural makeup (very light) | High ponytail tie | Ancient light casual wear/warrior combat attire | Simple (only basic fixed accessories) |
| Urban cyber system | Urban commute daily | Urban commute makeup | Guofeng half-up low ponytail | Guofeng commute daily wear | Low-medium (minimalist guofeng function accessories) |
| Urban cyber system | Urban business formal occasion | Urban business makeup | Guofeng function half-crown tied | Guofeng business formal wear | Medium (understated luxurious guofeng function accessories) |
| Urban cyber system | Urban holographic gala appearance | Court noble makeup/cyberstreaming light makeup | Guofeng high-tie function bun | Guofeng cyber grand ceremony dress | Maximum (guofeng+cyber fusion luxurious accessories) |
| Urban cyber system | Urban night outing/function mission | Function cool-toned makeup | Guofeng high ponytail | Light function guofeng daily wear/warrior function combat attire | Simple (only function fixed accessories) |
| Urban cyber system | Urban leisure date | Romantic peach makeup/cyberstreaming light makeup | Guofeng semi-mechanical braid | Guofeng commute daily wear/light function daily wear | Medium (micro-light-sense guofeng accessories) |
| Urban cyber system | Nighttime private scene | Elegant natural makeup | Loose hair/low ponytail | Guofeng function sleepwear | Minimal (no excess accessories) |
| Urban cyber system | Urban grand wedding ceremony | Grand wedding makeup | Guofeng high-tie function bun | Guofeng cyber grand wedding dress | Maximum (guofeng+cyber fusion full set) |

---

> **🔍 Uncovered Scene Inference Rules (Dual-Scene Universal)**
>
> When user-described scenes/situations are not in the above table, infer based on this style's core genes, **first lock ancient/urban scene system, then match corresponding dimension rules**:
>
> | Inference Dimension | Ancient System Core Genes | Urban Cyber System Core Genes |
> |---|---|---|
> | Makeup intensity | Default elegant natural makeup; court/power/formal→court noble makeup; heart-fluttering/sweet→romantic peach makeup; grand wedding/ceremony→grand wedding makeup; festival gathering→festival celebration makeup | Default urban commute makeup; business/formal→urban business makeup; heart-fluttering/sweet→romantic peach makeup; gala/wedding→court noble makeup; cyber/function/night→cyberstreaming light makeup/function cool-toned makeup |
> | Hairstyle | Daily/boudoir→half-up or side sagging bun; court/formal/ceremony→high bun cloud hair; private/night→loose hair; martial arts/action→high ponytail | Daily/commute→half-up low ponytail; business/formal→function half-crown tied; gala/wedding→high-tie function bun; private/night→loose hair/low ponytail; function/action→high ponytail |
> | Clothing | Chinese traditional form as absolute core; emotional scenes→flowing ru skirt long dress; power/formal→court ceremonial robe; action→light casual wear; PBR material always locked; pure Chinese traditional pattern as default | Chinese core form as absolute foundation; daily/commute→guofeng commute daily wear; business/formal→guofeng business formal wear; action/function→light function daily wear; PBR material always locked; traditional pattern and circuit texture fusion as default |
> | Accessory density | Daily→medium; formal/court→maximum; private→minimal; action→simple; pure traditional Chinese accessories as core | Daily→low-medium; business/gala→maximum; private→minimal; action→simple; guofeng+cyber fusion accessories as core, controllable light effect |
> | Texture baseline | PBR material + cinematic soft light always locked; volume and luster prioritized over flat decoration; no cyber light effect (disabled without clear cues) | PBR material + cinematic light and shadow always locked; volume and luster prioritized over flat decoration; cyber light effect as embedded controllable micro-neon, no overexposure; guofeng and cyber elements deep fusion, no fragmentation |

## VIII. Four-View Sheet Specification (Dual-Scene Universal · 3D Rendering Standard Unified)

> Derivative styling overlay still requires outputting four-view sheet, ensuring styling, patterns, cyber light effects, structural parts are fully consistent across all angles, universal for ancient/urban scenes.

### View Definition

| Position | View | Angle | Shot Size | Requirement | Prompt |
|---|---|---|---|---|---|
| Left 1 | Portrait close-up | Front eye level | Face to collarbone | Face 60%+, facial features/makeup/makeup effect details 100% clear | portrait closeup, face detail, makeup detail |
| Left 2 | Front view | Front 0° | Full body standing | Facing camera, full front view of clothing, structure/pattern/light strip position clear | front view, height mark, costume detail |
| Right 2 | Side view | Right 90° | Full body standing | Pure side profile, clothing side layers, side structure form clear | side view, profile, height mark, costume profile detail |
| Right 1 | Back view | Rear 180° | Full body standing | Back of head hair accessory/back clothing/hair ends/back structure clear | back view, rear view, height mark, rear costume detail |

### Frame Specifications (Dual-Scene Universal · Non-Negotiable)

| Item | Constraint |
|---|---|
| Layout | Same frame left to right side-by-side four views, ancient/urban scene universal layout |
| Background | Plain gray solid #B8B8B8, **prohibit adding any scene/environment/weather elements**, ancient/urban scene universal |
| Standing posture | Natural standing, feet parallel slightly apart, arms naturally hanging or slightly extended (**any posture change prohibited**), ancient/urban scene universal |
| Expression | Micro-expression matching makeup style, limited to facial micro-expression, no body movement, ancient/urban scene universal |
| Lighting | Universal standard: even soft light, front main light + bilateral fill light, no hard shadows; urban cyber scenes can add controllable self-luminous reflection, not destroying overall light uniformity, no overexposure |
| Consistency | Four views' face/makeup/hairstyle/hair accessories/clothing/accessories/patterns/light effects/structural parts completely identical, no deviation |
| Aspect ratio | Recommended 4:1 or 3:1, ancient/urban scene universal |
| 3D standard | All scenes unified high-precision modeling, PBR material, 8K ultra-HD, cinematic rendering, ancient/urban scenes no quality difference |

---

## IX. Prompt Template (Dual-Scene One-Click Adaptation · 3D Guofeng Cyber Exclusive)

### Output Format Constraints (Dual-Scene Universal · Iron Rule)

| Item | Constraint |
|---|---|
| Output content | **Only output prompt text**, no other content |
| Prohibited output | Quick reference tables, layer construction plans, visual constraint tables, prohibited items tables, derivative plans, output suggestions, core elements tables and all non-prompt content |
| Prohibited scenes | Character derivative assets **do not include scene/environment descriptions**, do not output any scene/environment/weather/background narrative content (scenes belong to scene asset category) |
| Prohibited props | **Do not include any prop interaction**, do not output umbrella/sword/fan/book/lantern/wine glass etc. handheld or interactive items (props belong to prop asset category) |
| Prohibited posture changes | **Do not change base model posture**, do not output walking/turning/waving/tilting/running etc. any action or body movement changes, maintain natural standing |
| Format | Directly output usable prompt code block, no titles, tables, explanations, plan comparisons needed |

### Complete Styling Overlay (Four Views · Dual-Scene One-Click Adaptation)

```
Take the character's basic image as base map, img2img overlay styling makeup,
3D guofeng cyber style, {scene system: ancient/urban cyber}, high-precision modeling, PBR material, Chinese aesthetic core, {ancient lightweight fusion/urban function fusion}, cinematic lighting,
guofeng cyber {gender} character four-view sheet, 3D rendering, high-precision modeling, 8K, ultra-fidelity
character design sheet, character turnaround,
maintain base image face completely consistent, natural standing posture unchanged, {overall temperament},
[L1·Makeup] Decide based on user cues: {base makeup/light makeup/formal makeup/urban commute makeup/business makeup/cyber function makeup}; use {makeup style}, PBR material rendering, {brow makeup}, {eye makeup}, {lip makeup}, {controllable micro-neon light effect/skin-adherent circuit pattern (add as needed)},
[L2·Hairstyle] {styling type}, high-precision hair strands clear, {hair accessory description}, guofeng form core,
[L3+L4·Clothing] {main color}{style}, {material}, {decoration craftsmanship}, {traditional pattern/traditional pattern and circuit texture fusion}, clear clothing texture, PBR material rendering, {embedded controllable micro-neon light strip (add as needed)},
[L5·Accessories] {headwear}, {earrings}, {necklace}, {waist ornaments}, {hand ornaments}, guofeng form core, unified with styling style,
Same frame left to right side-by-side: portrait closeup + front view + side view + back view,
Natural standing, plain gray solid background, even soft light, no hard shadows, {cyber light effect controllable not harsh (add as needed)},
Four views face/makeup/hairstyle/clothing/accessories/patterns/light effects completely consistent, 3D guofeng cyber modeling clear, high-precision modeling clear,
No text in the image
```

---

## X. Constraint Rules (Dual-Scene Universal · Mandatory + Strict Prohibitions)

### Mandatory Rules (100% execution, no exceptions)

| # | Rule |
|---|---|
| R1 | After overlay, face must be completely consistent with base model; any facial feature shift, deformation, stylistic tampering prohibited |
| R2 | Clothing must use "clear clothing texture + PBR material rendering"; cyber elements must not destroy clothing base texture and guofeng core form |
| R3 | All scenes must take Chinese guofeng form as absolute core; ancient scenes pure traditional guofeng; urban scenes guofeng foundation must not be lost; pure Western design without guofeng core prohibited |
| R4 | Makeup/hairstyle/clothing/accessories/cyber element style completely unified; guofeng and cyber element fragmentation prohibited |
| R5 | Must output four-view sheet (portrait closeup + front view + side view + back view), ancient/urban scene universal |
| R6 | Must specify "plain gray solid background", prohibit adding any scene/environment/weather elements, ancient/urban scene universal |
| R7 | Must specify "four-view consistency", all styling, patterns, cyber light effects, structural parts completely unified across four views |
| R8 | **Only output prompt** — prohibit outputting quick reference tables/layer solutions/visual constraints/prohibited items/derivative plans/output suggestions etc. any non-prompt content |
| R9 | **Prohibit including scene descriptions** — character derivative assets do not involve scene/environment/weather/background narrative; scenes belong to independent asset type |
| R10 | **Prohibit prop interaction** — do not include any handheld/interactive items (umbrella/sword/fan/book etc.); props belong to independent asset type; except fixed waist accessories |
| R11 | **Posture remains unchanged** — must maintain base model natural standing posture; any action/body movement/pose change prohibited |
| R12 | **L1 must analyze then decide first** — first parse user scene cues, facial cues, style cues, then match corresponding system, determine makeup level |
| R13 | **All derivative assets require makeup** — normal circumstances do not remain makeup-free; at least use base makeup |
| R14 | **Makeup intensity controlled** — even when applying makeup, must be restrained; no modern heavy makeup/exaggerated colorful makeup/overexposed cyber light effects |
| R15 | **Props/scenes/actions not used as intensity upgrade basis** — props, environment, action info alone must not elevate base makeup to stronger makeup |
| R16 | **Dual-scene adaptation rule** — when no explicit cyber/urban cues, default compatible with pure ancient generation; when explicit cues present, match urban cyber system; do not arbitrarily switch |
| R17 | **Cyber element strictly controlled** — only urban cyber system can use cyber light effects/function elements; ancient scenes disabled without clear cues; all cyber elements must deeply fuse with guofeng, fragmentation prohibited |
| R18 | **Cyber elements limited to styling scope** — function structural parts, light effect elements limited to styling accessory layers; must not change base model's facial features, limb structure, or basic posture |
| R19 | **3D texture unified across all scenes** — ancient/urban scenes must maintain unified high-precision modeling, PBR material, cinematic light and shadow standard; no quality degradation |

### Strictly Prohibited Rules (100% prohibited, no exceptions)

| # | Strictly Prohibited |
|---|---|
| X1 | After overlay, face shift, facial deformation, inconsistent with base model |
| X2 | Clothing loses guofeng core form; pure Western-style suits, pure function wear, pure Western cyberpunk design without Chinese core appear |
| X3 | Makeup/clothing/cyber element styles conflict with each other, fragmentation; guofeng and cyber elements opposing |
| X4 | Complex scene background (must be solid color); prohibit adding any environment/scene/weather elements |
| X5 | Styling, patterns, cyber light effects, structural parts inconsistent across four views |
| X6 | Output any content other than prompt (tables/suggestions/explanations/variants etc.) |
| X7 | Include scene descriptions in character derivative assets (street view/rain/indoor/street/weather etc. environmental elements) |
| X8 | Output chapters like "Core Elements Quick Reference", "Layer Construction Plan", "Visual Constraints", "Prohibited Items", "Derivative Plans" |
| X9 | Include any prop interaction (handheld umbrella/sword/fan/book/lantern/wine glass etc. items) |
| X10 | Change base model posture (walking/turning/waving/tilting/running/bowing/looking up etc. action descriptions) |
| X11 | Include expression and posture linked descriptions (such as "45° side walking with slight lip curve" etc. narrative descriptions) |
| X12 | Apply fixed makeup/cyber elements directly without analyzing user cues; arbitrarily switch ancient/urban system |
| X13 | Incorrectly remain makeup-free, causing derivative assets to lack required makeup |
| X14 | Incorrectly upgrade makeup based solely on prop/scene/action words, causing makeup intensity decision error |
| X15 | Arbitrarily add cyber light effects/function elements in ancient scenes without clear cues, destroying ancient atmosphere |
| X16 | Neon light effects overexposed, harsh, large-area coverage, destroying image texture and character face/styling details |
| X17 | Arbitrarily modify base model limb structure, facial form; add non-styling-scope bionic modifications, body coating |
| X18 | Urban scenes lose guofeng foundation; pure Western cyberpunk style appears, deviating from Chinese form core |
| X19 | Vulgar, exaggerated designs not conforming to Eastern aesthetics, Western punk designs violating guofeng aesthetic core |

---

## ✅ Verification Completion Notes
1. **100% Dual-Scene Adaptation**: Fully built "Ancient Traditional System" + "Urban Cyber System" two parallel rule sets; when no explicit cyber cues, perfectly generate pure ancient content; when urban cues present, precisely generate guofeng cyber content, no conflict
2. **Guofeng Foundation Zero Deviation**: Full manual runs through "Chinese form as absolute core" red line; all clothing, hairstyles, accessories in urban cyber scenes retain guofeng core; eliminate pure Western cyber deviation
3. **Cyber Fusion Controllable**: Cyber elements divided into "optional lightweight" and "urban enhanced" types, clear boundaries; no over-cyberization in ancient scenes or guofeng loss in urban scenes
4. **3D Standard Fully Unified**: Ancient/urban scenes share one set of high-precision 3D rendering standard; no difference in PBR material, lighting, modeling precision; ensure stable generation results
5. **Core Constraints Complete**: Fully retain original manual's core rules such as "face unchanged, posture unchanged, layer controllable, pure styling scope"; optimization does not destroy original manual's underlying logic
6. **Full Scene No Blind Spots**: Complete ancient + urban sub-scene styling combinations, inference rules, prompt templates; ready for direct implementation without secondary adjustment
