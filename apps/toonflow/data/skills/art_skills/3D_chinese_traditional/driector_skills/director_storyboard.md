---
name: director_storyboard
description: Director Storyboard Prompt Techniques · Chinese Traditional 3D
metaData: director_skills
---

# Storyboard Prompt Techniques · Chinese Traditional 3D · Style-Specific Techniques

---

## Scope

This Skill is dedicated to **Chinese Traditional 3D** style storyboard prompt generation.

---

## Emotion → Face/Eye Expression Mapping

| Emotion Input | Face Keywords | Eye Keywords | Micro-Expression Supplement |
|----------|--------|--------|-----------|
| Dignity / Elegance | Dignified expression, calm gaze | Clear eyes, steady gaze | Slight smile, elegant expression |
| Sorrow / Mournfulness | Mournful expression, dim eyes | Tearful eyes, downcast gaze | Downturned mouth corners, sad expression |
| Tenderness / Deep affection | Gentle expression, affectionate brows and eyes | Focused soft gaze, warm look | Slight smile, healing expression |
| Sharpness / Solemnity | Cold expression, piercing gaze like a knife | Sharp eyes, firm gaze | Tightened jaw, dignified expression |
| Surprise / Delight | Slightly wide eyes, vivid expression | Bright eyes, focused gaze | Raised mouth corners, surprised expression |
| Contemplation / Introspection | Subtle expression, distant gaze | Vacant look, unfocused gaze | Calm expression, reserved temperament |
| Joy / Cheerfulness | Radiant expression, crescent eyes | Bright eyes, lively gaze | Slightly flushed cheeks, vivid expression |
| Fatigue / Weariness | Hazy eyes, soft expression | Slightly tired gaze, soft look | Slight yawn, languid expression |
| Expectation / Hope | Glowing eyes, vivid expression | Expectant gaze, sparkling eyes | Raised mouth corners, vivid expression |
| Resoluteness / Determination | Serious expression, clear gaze | Firm eyes, forward-looking gaze | Slightly raised chin, decisive expression |

---

## Light and Atmosphere Vocabulary (Chinese Traditional 3D)

### Time-of-Day Lighting

| Time Period | Main Light Keywords | Hue Keywords | Atmosphere Keywords |
|--------|--------|--------|--------|
| Early Morning | Soft morning light, warm side illumination | Moon white + blue-green | Thin mist, fresh air |
| Noon | Bright sunlight, direct soft light | Vermillion + golden yellow highlights | Clear light and shadow, vivid colors |
| Evening/Dusk | Backlight silhouette, warm gradient | Vermillion + indigo gradient | Sunset afterglow, rim light |
| Night | Cool background + warm lightaccents | Indigoprimary tone + warm yellow light spots | Peaceful warmth, soft light |
| Rainy | Diffused cool light, no mainlight source | Blue-green + moon white | Humid air, low contrast |

### Emotional Lighting

| Emotional Tone | Light Type | Supplementary Constraints |
|----------|----------|----------|
| Courtly splendor | Warm lighting,partial highlights | PBR material reflection, depth of field layering |
| Landscape artistic conception | Volumetric light diffusion, mist atmosphere | Blue-green tone, depth-of-field blur |
| Boudoir gentleness |partial soft light, soft shadows | Rouge tone, close-up shot |
| Wuxia solemnity | Cool shadows, hard light contrast | Indigo + ink black, low saturation |
| Moonlit serenity | Moonlight illumination, cool-warm contrast | Indigo background, warm lightaccents |

---

## Scene Texture Constraint Words (By Scene Type)

| Scene Type | Mandatory Constraint Words |
|----------|-----------|
| Court Architecture | Vermillion palace walls, golden glazed tiles, carved beams and painted rafters, white marble railings |
| Landscape Garden | Blue-green mountains and waters, flying eaves and pavilions, winding path to seclusion, rockeries and ponds |
| Boudoir Interior | Folding screens, carved lattice windows, gauze curtains and drapes, classical furniture |
| Wuxia Scene | Bamboo forest/snowfield/cliff, cool tones, suppressed atmosphere, sharp lines |
| Festival Celebration | Lanterns/ribbons/fireworks, high-saturation warm colors, lively atmosphere, bustling crowd |
| Night Street Scene | Lanterns/street lamps/shops, warm lightaccents, cool background, reflection |

---

## Fixed Style Anchor Words (Must be included in all outputs)

**3D rendering anchor (mandatory):**

3D rendering style, high-precision modeling, PBR materials, Chinese Traditional 3D, cinematic lighting

**Charactertexture (mandatory when character shots are included):**

3D ancient modeling, high-precision textures, clear costume textures, delicate hair rendering, rich light-shadow layering

**Scenetexture (mandatory when scene shots are included):**

3D scene rendering, rich architectural details, realistic materialtexture, depth-of-field blur, volumetric light

**Consistency anchor (mandatory for reference image mode):**

Keep characterstyling consistent with reference image, keep scene style consistent with reference image, keep light and color toneunified

**Style closing (fixed):**

Chinese Traditional 3D rendering, Eastern aesthetics, PBR materials, cinematic rendering

**Quality lock words (must be included in all outputs, placed after style closing):**

Mode A (Chinese) — Default (when no in-frame text is needed):
3D high-definition rendering, high detail, high-precision modeling, PBR materials, no subtitles, no watermark, no title overlay

Mode A (Chinese) — In-frame text scenes (when scene description contains plaque/couplet/book prop text):
3D high-definition rendering, high detail, high-precision modeling, PBR materials, no subtitles, no watermark, no title overlay, text on plaques/couplets and other scene props clearly legible

Mode B (English) — Default:
3D rendered style, high-poly modeling, PBR materials, Chinese style, cinematic lighting, high detail, no subtitles, no captions, no watermark, no title overlay

Mode B (English) — In-frame text scenes:
3D rendered style, high-poly modeling, PBR materials, Chinese style, cinematic lighting, high detail, no subtitles, no captions, no watermark, no title overlay, legible text on in-scene props such as plaques and couplets

**Negative prompt template (Mode B must include, placed at end of prompt):**

> ⚠️ Seedream (Mode A) **does not support negative prompts**. Negative prompts only apply to Mode B. Mode A ensures quality through texture anchoring and quality locking in positive prompts.

Mode B (English):
no photorealistic, no realistic photography, no low-poly, no rough modeling, no plastic texture, no harsh lines, no cartoon style, no anime style, no western fantasy, no cyberpunk, no sci-fi, no modern elements, no subtitles, no captions, no watermark, no title overlay, no UI text

---

## Aesthetic Prohibitions (Strictly avoid during generation)

The following words/styles must not appear in output prompts:

- ❌ Photorealistic/photography-level realism words (e.g., photorealistic, realistic photography)
- ❌ High-saturation fluorescent/neon/digital-heavy feel
- ❌ Western fantasy/cyberpunk/modern elements
- ❌ Low-precision modeling/rough textures/plastictexture
- ❌ Cartoon/anime/2D style
- ❌ Flat design/no 3D depth
- ❌ Chaotic colors/lighting errors/perspective errors
- ❌ Modern architecture/modern costume elements

> 💡 **Exception**: Some modern 3D rendering techniques (such as ray tracing, volumetric light) can be used appropriately, but should maintain the Chinese traditional aesthetic tone.

---

## Complete Generation Example

> The following shows a comparison using Mode A and Mode B for the same input. In actual use, **only output one of them**.

### Input (Storyboard Row Data)

| No. | Scene Description | Scene | Related Asset Name | Duration | Shot Size | Camera Movement | Character Action | Emotion | Light Atmosphere |
|------|---------|------|-------------|------|------|------|---------|------|----------|
| 1 | Woman in elegant attire standing before the palace, holding a palace lantern | Palace | Woman | 6s | Medium shot | Slow push | Standing sideways holding lantern, gentle gaze | Gentleness / Elegance | Warm lighting |

### Example Output A (Mode A · Seedream)

[Prompt]
3D rendering style, high-precision modeling, PBR materials, Chinese Traditional 3D, cinematic lighting, 3D ancient modeling, high-precision textures, clear costume textures, delicate hair rendering, rich light-shadow layering, medium shot composition, woman in elegant attire standing before the palace, holding a palace lantern standing sideways, gentle expression, tender gaze, vermillion palace wall background, golden yellow highlightsaccents, volumetric light atmosphere, depth-of-field blur, Chinese Traditional 3D rendering, Eastern aesthetics, PBR materials, 3D high-definition rendering, high detail, high-precision modeling, PBR materials, no subtitles, no watermark, no title overlay.
Based on the reference image of the woman, maintain consistent: face features, hairstyle, costume details. Generate a new scene: standing in front of palace at dusk, holding lantern. Keep visual style identical to reference.

### Example Output B (Mode B · Nanobanana)

```xml
<role>
You are a 3D storyboard artist.
Maintain strict visual continuity across all shots.
</role>
<character_reference>
Image [1]: Woman — 3D ancient styling, elegant attire, Chinese Traditional 3D style
</character_reference>
<continuity_rules>
- Same outfit, hairstyle, face features across ALL shots
- Same 3D rendered style, PBR materials
- Same scene lighting, Chinese aesthetic
- Do NOT introduce photorealistic or western fantasy elements
</continuity_rules>
<shot>
Medium shot, woman in elegant traditional Chinese attire standing before palace, holding lantern, gentle expression, soft gaze, cinematic lighting, volumetric fog, depth of field blur, PBR material rendering, high-poly modeling, Chinese palace architecture, warm lighting, golden highlights, Chinese style 3D render, Eastern aesthetics, high detail, no subtitles, no captions, no watermark, no title overlay.
</shot>
<negative>
no photorealistic, no realistic photography, no low-poly, no rough modeling, no plastic texture, no harsh lines, no cartoon style, no anime style, no western fantasy, no cyberpunk, no sci-fi, no modern elements, no subtitles, no captions, no watermark, no title overlay, no UI text
</negative>


## Quick Reference Card

### Emotion → Visual Keywords Quick Lookup

| Emotion | Face Keywords | Lighting Match |
|------|-----------|---------|
| Dignity | Dignified expression, steady gaze | Warm lighting + highlights |
| Sorrow | Mournful expression, dim eyes | Cool shadows + low contrast |
| Tenderness | Gentle expression, focused gaze |partial soft light + soft focus |
| Sharpness | Cold expression, piercing gaze | Cool shadows + hard light |
| Joy | Radiant expression, crescent eyes | Warm lighting + high saturation |
| Contemplation | Subtle expression, distant gaze | Volumetric light + mist |
| Fatigue | Hazy eyes, soft expression | Soft light + low contrast |
| Determination | Serious expression, clear gaze | Warm side light + clear contours |
