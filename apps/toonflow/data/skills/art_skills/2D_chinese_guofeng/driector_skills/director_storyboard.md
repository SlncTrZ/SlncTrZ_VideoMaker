---
name: director_storyboard
description: Director storyboard prompt techniques · Chinese-style Anime Neo-Chic
metaData: director_skills
---

# Storyboard Prompts · Chinese-style Anime Neo-Chic · Style-Specific Techniques

---

## Scope

This Skill is dedicated to generating storyboard prompts for the **Chinese-style Anime Neo-Chic** style.

---

## Emotion → Face/Eye Expression Word Mapping

| Emotion Input | Face Words | Eye Words | Micro-expression Supplement |
|----------|--------|--------|-----------|
| Tenderness / Deep Affection | Gentle expression, eyes full of emotion | Focused soft gaze, warm eyes | Slight smile at corners of mouth, healing expression |
| Determination / Courage | Serious expression, clear bright eyes | Firm gaze, looking forward | Chin slightly raised, resolute expression |
| Shyness / Bashfulness | Flushed cheeks, evasive eyes | Shy glance, downcast eyes | Lips gently pressed, cute expression |
| Sharpness / Solemnity | Cold stern expression, piercing gaze | Sharp eyes, steady gaze | Jaw tightened, dignified expression |
| Joy / Cheerfulness | Bright expression, crescent eyes | Bright eyes, lively gaze | Slight blush on cheeks, animated expression |
| Sadness / Melancholy | Mournful expression, dim eyes | Eyes holding tears, downcast gaze | Corners of mouth turned down, sorrowful expression |
| Surprise / Delight | Eyes slightly wide, animated expression | Bright eyes, focused gaze | Mouth slightly open, surprised expression |
| Contemplation / Introspection | Gentle expression, distant gaze | Vacant stare, unfocused eyes | Calm expression, reserved temperament |
| Fatigue / Weariness | Hazy eyes, soft expression | Slightly tired eyes, gentle look | Slight yawn, languid expression |
| Anticipation / Hope | Eyes shining, lively expression | Hopeful eyes, sparkling gaze | Corner of mouth upturned, animated expression |

---

## Lighting and Atmosphere Vocabulary (Chinese-style Anime Neo-Chic)

### Time-of-Day Lighting

| Time Period | Main Light Words | Tone Words | Atmosphere Words |
|--------|--------|--------|--------|
| Early Morning | Soft morning light, warm side illumination | Moon White + Turquoise | Thin mistpermeating, fresh air |
| Noon | Bright sunlight, direct soft light | Vermillion + Gold highlights | Clear light and shadow, vivid colors |
| Evening / Dusk | Backlit silhouette, warm gradient | Vermillion + Indigo gradient | Sunset afterglow, rim light |
| Night | Cool background + warm light accents | Indigo dominant + warm yellow specks | Tranquil and cozy, soft lighting |
| Rainy Day | Diffused cool light, no main light source | Turquoise + Moon White | Moist air, low contrast |

### Emotional Lighting

| Emotional Tone | Light Type | Additional Constraints |
|----------|----------|----------|
| Ethereal Xianxia | Soft diffused light, flowing dynamics | Turquoise tones, depth of field blur, cel shading |
| Courtly Elegance | Warm lighting, localized highlights | Vermillion tones, highlight emphasis, depth of field layering |
| Girl's Everyday Life | Localized soft light, soft shadows | Rouge tones, close-up shots, fresh atmosphere |
| Solemn Wuxia | Cool shadows, hard light contrast | Indigo + Ink Black, low saturation, tense atmosphere |
| Moonlit Poetry | Moonlight illumination, warm-cool contrast | Indigo background, warm light accents, aesthetic atmosphere |

---

## Scene Texture Constraint Words (By Scene Type)

| Scene Type | Mandatory Constraint Words |
|----------|-----------|
| Xianxia Scene | Clouds and mist swirling, flying eaves and pavilions, flowing robes, turquoise mountains and waters, cel shading |
| Court Scene | Vermillion palace walls, golden-glazed tiles, carved beams and painted rafters, white marble railings, neo-chic decoration |
| Boudoir Interior | Folding screens, carved window lattices, gauze curtains, classical furniture, delicate brushwork |
| Wuxia Scene | Bamboo forest / snowy ground / cliff, cool tones, oppressive atmosphere, sharp lines, neo-chic style |
| Festival Celebration | Lanterns / ribbons / fireworks, high-saturation warm colors, lively atmosphere, bustling crowds |
| Night Street Scene | Lanterns / street lamps / shops, warm light accents, cool background, reflective surfaces, Japanese rendering |

---

## Fixed Style Anchor Words (All Outputs Must Include)

**Chinese-style Anime Anchor (Required):**

Chinese-style anime, neo-chic aesthetics, Japanese animation rendering, cel shading, delicate brushwork

**Character Texture (Required for Character Shots):**

Anime Chinese-style design, clear lines, cel shading coloring, exquisite costume details, rich lighting layers

**Scene Texture (Required for Scene Shots):**

Chinese-style anime scene, rich traditional architectural details, Japanese rendering techniques, delicate lighting texture

**Consistency Anchor (Required for Reference Image Mode):**

Maintain character design consistent with reference image, maintain scene style consistent with reference image, maintain unified lighting and color tone

**Style Closing (Fixed):**

Chinese-style anime cinematic quality, Eastern classical charm, neo-chic style, Japanese animation rendering techniques

**Quality Lock Words (All Outputs Must Include, Placed After Style Closing):**

Mode A (Chinese) — Default (when scene has no in-frame text requirement):
Chinese-style anime high-definition rendering, high detail, delicate lines, cel shading texture, cinematic quality, no subtitles, no watermark, no title overlay

Mode A (Chinese) — In-frame text scenes (when scene descriptions contain prop text such as plaques / couplets / books):
Chinese-style anime high-definition rendering, high detail, delicate lines, cel shading texture, cinematic quality, no subtitles, no watermark, no title overlay, text on in-scene props such as plaques and couplets legible

Mode B (English) — Default:
Chinese style anime, neo-chic aesthetic, Japanese animation rendering technique, cel shading, fine brushstrokes, cinematic quality, high detail, no subtitles, no captions, no watermark, no title overlay

Mode B (English) — In-frame text scenes:
Chinese style anime, neo-chic aesthetic, Japanese animation rendering technique, cel shading, fine brushstrokes, cinematic quality, high detail, no subtitles, no captions, no watermark, no title overlay, legible text on in-scene props such as plaques and couplets

**Negative Prompt Template (Required for Mode B, Placed at End of Prompt):**

> ⚠️ Seedream (Mode A) **does not support negative prompts**. Negative words are only applicable to Mode B. Mode A ensures image quality through texture anchors and quality locks in the positive prompt.

Mode B (English):
no photorealistic, no realistic photography, no 3D render, no low-poly, no rough modeling, no plastic texture, no harsh lines, no western fantasy, no cyberpunk, no sci-fi, no modern elements, no cartoon style without anime quality, no subtitles, no captions, no watermark, no title overlay, no UI text

---

## Aesthetic Prohibitions (Strictly Avoid During Generation)

The following words/styles must not appear in output prompts:

- ❌ Photorealistic photography / 3D realistic rendering / photo-realistic terms
- ❌ High-saturation fluorescent colors / neon colors / digitally intense
- ❌ Western fantasy / cyberpunk / overly modern elements
- ❌ Rough lines / blurry quality / low-precision modeling
- ❌ Cartoon / anime style without refined quality
- ❌ Flat design lacking anime depth
- ❌ Chaotic colors / lighting errors / perspective errors
- ❌ Modern architecture / modern clothing elements

> 💡 **Exception**: Certain modern rendering techniques (such as volumetric light, depth of field blur) may be used reasonably, but should maintain the Chinese-style anime aesthetic foundation.

---

## Complete Generation Example

> The following shows a comparison of the same input using Mode A and Mode B respectively. In actual use, **only output one of them**.

### Input (Storyboard Table Row Data)

| No. | Scene Description | Scene | Related Asset Name | Duration | Shot Size | Camera Movement | Character Action | Emotion | Lighting Atmosphere |
|------|---------|------|-------------|------|------|------|---------|------|----------|
| 1 | Ancient-dressed girl standing before palace, holding flower branch, gentle eyes | Palace | Ancient-dressed girl | 6s | Medium Shot | Slow push-in | Standing sideways holding flower, gentle gaze | Gentle / Elegant | Warm lighting |

### Example Output A (Mode A · Seedream)

[Prompt]
Chinese-style anime, neo-chic aesthetics, Japanese animation rendering, cel shading, delicate brushwork, anime Chinese-style design, clear lines, cel shading coloring, exquisite costume details, rich lighting layers, medium shot composition, ancient-dressed girl standing before palace, holding flower branch standing sideways, gentle expression, gentle gaze, vermillion palace wall background, gold highlight accents, volumetric light atmosphere, depth of field blur, Chinese-style anime cinematic quality, Eastern classical charm, neo-chic style, Japanese animation rendering techniques, Chinese-style anime high-definition rendering, high detail, delicate lines, cel shading texture, cinematic quality, no subtitles, no watermark, no title overlay.
Based on the reference image of ancient-dressed girl, maintain consistent: face features, hairstyle, costume details. Generate a new scene: standing in front of palace at dusk, holding flower branch. Keep visual style identical to reference.


### Example Output B (Mode B · Nanobanana)

```xml
<role>
You are an anime storyboard artist.
Maintain strict visual continuity across all shots.
</role>
<character_reference>
Image [1]: ancient-dressed girl — Chinese-style anime design, elegant attire, neo-chic aesthetics
</character_reference>
<continuity_rules>
- Same outfit, hairstyle, face features across ALL shots
- Same cel shading style, Japanese animation rendering
- Same scene lighting, Chinese anime aesthetic
- Do NOT introduce photorealistic or western fantasy elements
</continuity_rules>
<shot>
Medium shot, ancient Chinese girl in elegant traditional attire standing before palace, holding flower branch, gentle expression, soft gaze, cinematic lighting, volumetric fog, depth of field blur, cel shading with fine brushstrokes, Chinese style anime, neo-chic aesthetic, Japanese animation rendering technique, high detail, no subtitles, no captions, no watermark, no title overlay.
</shot>
<negative>
no photorealistic, no realistic photography, no 3D render, no low-poly, no rough modeling, no plastic texture, no harsh lines, no western fantasy, no cyberpunk, no sci-fi, no modern elements, no cartoon style without anime quality, no subtitles, no captions, no watermark, no title overlay, no UI text
</negative>
```

## Quick Reference Card

### Emotion → Visual Word Quick Lookup

| Emotion | Face Keywords | Lighting Match |
|------|-----------|---------|
| Tenderness | Gentle expression, focused gaze | Soft diffused light + warm light |
| Determination | Serious expression, clear bright eyes | Warm side light + clear contours |
| Shyness | Flushed cheeks, evasive eyes | Warm side light + blush |
| Sharpness | Cold stern expression, piercing gaze | Cool shadows + hard light |
| Joy | Bright expression, crescent eyes | Warm lighting + high saturation |
| Sadness | Mournful expression, dim eyes | Cool shadows + low contrast |
| Fatigue | Hazy eyes, soft expression | Soft light + low contrast |
| Contemplation | Gentle expression, distant gaze | Volumetric light + mist |
| Anticipation | Eyes shining, lively expression | Warm side light + highlights |
