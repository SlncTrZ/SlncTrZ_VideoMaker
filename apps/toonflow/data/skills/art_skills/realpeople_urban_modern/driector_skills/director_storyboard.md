---
name: director_storyboard
description: Director storyboard prompt technique · Live-Action Urban Photorealism
metaData: director_skills
---

# Storyboard Prompts · Live-Action Urban Photorealism · Style-Specific Technique

---

## Scope of Application

This Skill is dedicated to **Live-Action Urban Photorealism** style storyboard prompt generation.

---

## Emotion → Facial/Eye Word Mapping

| Emotional Input | Facial Words | Eye Words | Micro-Expression Supplement |
|----------|--------|--------|-----------|
| Heartbeat / Joy | Corners of mouth slightly raised, smile in eyes | Eyes bright, gaze focused | Cheeks slightly flushed, expression natural |
| Sadness / Loss | Face calm, expression low | Eyes dim, gaze wandering | Brows slightly furrowed, expression reserved |
| Anger / Pressure | Brows and eyes sharp, expression stern | Eyes blazing, gaze forceful | Lip line tight, imposing aura |
| Tenderness / Deep Affection | Expression soft, brows and eyes warm | Eyes focused, gaze deep | Corners of mouth slightly lifted, expression restrained and warm |
| Determination / Resolution | Expression serious, face calm | Eyes determined, gaze clear | Brows and eyescalm, demeanor capable |
| Surprise / Shock | Expression slightly stunned, face slightly changes | Eyes widening, gaze suddenlyfocus | Brows slightly raised, lips slightly parted |
| Indifference / Detachment | Face cold, expressionindifferent | Eyes distant, gaze without ripples | Expression nearly frozen, demeanor detached |
| Joy / Elation | Expression lively, smile bright | Eyes bright and spirited, curved smiling eyes | Corners of mouth raised, expression vivid and natural |
| Nervousness / Panic | Expression slightly bewildered, demeanor flustered | Eyes wandering, looking around | Brows slightly furrowed, expression vivid andreal |
| Endurance / Restraint | Expression reserved, face calm | Eyes deep, suppressed emotion behind eyes | Lip line tight, Adam's apple slightly moves |

---

## Lighting Atmosphere Vocabulary (Live-Action Urban Photorealism)

### Time-of-Day Lighting

| Time Period | Key Light Words | Tone Words | Atmosphere Words |
|--------|--------|--------|---------|
| Early Morning | Diffused morning light, soft diffusion | Cool white/neutral tones | City awakening feel, fresh air |
| Afternoon | Soft angled side light, diffused scattered light | Warm tones primary, light warm | Dappled light and shadow, clear layers |
| Evening/Dusk | Warm side-backlight, angled afterglow | Warm tones primary,partial warm light accents | Long shadows stretching, warm light feel |
| Night | Window light cool blue, indoor warm point source | Cool-warm contrast | Deep light and shadow, strong light-dark contrast |
| Rainy/Overcast | Diffused cool light, no main light source | Gray-blue primary tone | Humid air feel, low saturation |
| Office/Indoor | Ceiling light + ambient light | Neutral gray tone | Soft and even, professional feel |

### Emotional Lighting

| Emotional Tone | Light Type | Additional Constraints |
|----------|----------|---------|
| Heartbeat/Warmth | Soft side-backlight, diffused warm lightpartial | Rim lighttrace, shallow depth of field softening background |
| Confrontation/Oppression | Hard side light, high contrast strong lighting | Shadows sharp, clear light-dark division |
| Oppression/Sadness | Diffused cool light, ceiling light or side cool light | Low-key lighting,partial shadow on face retained |
| Mystery/Solemnity | Cool blue side light, backlight silhouette | Light halo control, precise rim light |
| Ethereal/Mood | Scattered soft light, backlight slight overexposure | Atmospheric perspective, distant viewfade out |

---

## Scene Texture Constraint Words (by Scene Type)

| Scene Type | Mandatory Constraint Words |
|----------|-----------|
| Office | Glass partition reflections, clean office desktop, computer screen light, modern office chair |
| Café/Restaurant | Wooden table and chair texture, coffee cup detail, warm pendant light, blurred street view outside window |
| Home Space | Sofa fabric texture, carpet texture, desk lamp warm light, daily clutter detail |
| Street/Plaza | Asphalt road reflection, building facade detail, neon sign, blurred crowd |
| Mall/Indoor Space | Marble floor reflection, glass shop window, modern lighting, commercial space depth |
| Inside Car | Seat leather texture, window reflection, dashboard light, blurred street view outside window |
| Bedroom/Private Space | Bed sheet wrinkles, bedside lamp warm light, clothes casually placed, sense of life |

---

## Fixed Style Anchor Words (All Outputs Must Include)

**Live-Action Photorealism Anchor (Mandatory):**

Live-action photographic photography, cinematic quality, surrealistic documentary, strong contrast,extreme/ultimate detail,ultra-clear texture

**Character Texture (Mandatory when character shots are included):**

Delicate skin, delicate facial rendering,three-dimensional facial features, each hair strand clearly defined, delicate hair rendering

**Attire Texture (Mandatory when character shots are included):**

Modern attire fabric textureclear,ultra-clear texture detail, clothing naturally draping with movement, modern tailored fit

**Consistency Anchor (Mandatory in reference image mode):**

Maintain character face consistent with reference image, maintain attire colors consistent with reference image, maintain unified scene lighting style

**Style Closing (Fixed):**

Urban realistic aesthetics, modern Eastern temperament, cinematic storyboard composition

**Quality Lock Words (All outputs must include, placed after style closing):**

Mode A (Chinese) — Default (whenimage has no in-frame text requirements):
Ultra-clear 4K quality, high detail, natural sharpness, realistic clarity, no subtitles, no watermark, no title overlay

Mode B (English) — Default:
ultra-sharp 4K, high detail, crisp textures, naturalistic sharpness, photorealistic clarity, no subtitles, no captions, no watermark, no title overlay

Mode B (English) — In-frame text scenes:
ultra-sharp 4K, high detail, crisp textures, naturalistic sharpness, photorealistic clarity, no subtitles, no captions, no watermark, no title overlay, legible text on in-scene props such as screens, posters, and signage

**Negative Prompt Template (Mode B must include, placed at end of prompt):**

> ⚠️ Seedream (Mode A) does **not support negative prompts**; negative prompts only apply to Mode B. Mode A ensures image quality through texture anchoring and quality locking in positive prompts.

Mode B (English):
no plastic skin, no beauty filter, no studio lighting, no centered composition, no oversaturation, no AI generated look, no motion blur, no noise, no blurry, no out of focus, no subtitles, no captions, no watermark, no title overlay, no UI text, no ancient costume, no hanfu, no traditional Chinese architecture

---

## Aesthetic Prohibited Items (Strictly Avoid During Generation)

The following words/styles must not appear in output prompts:

- ❌ Ancient style/ancient/hanfu/traditional architecture related words
- ❌ Anime/cartoon/illustration/CG render related words
- ❌ Missing modern elements (mustclear modern scenes)
- ❌ Warm yellow main tone words (use "local warm lighting accents" instead)
- ❌ Soft focus/haze/low contrast filter words
- ❌ Clashing/mismatched/neon/fluorescent color schemes
- ❌ Cartoon proportions, big eyes, chibi and otherdeformation descriptions
- ❌ Cyberpunk/steampunk/ empty empty Western fantasy elements
- ❌ Overlaid text outsideimage (subtitles, watermarks, title cards, narrationoverlay text, title text and other UI layer text;image must be purely visual)

> 💡 **Exception**: In-story prop text (character looking at phone/computer screen, posters, street signs, shop signs and other naturally existing text in scenes) **does not belong to the prohibited range**. When storyboard scene descriptions include such content, accurately describe its existence and require the text to be clear.

---

## Complete Generation Examples

> The following shows acomparison of Mode A and Mode B for the same input. In actual use, **output only one of them**.

### Input (Storyboard Table Row Data)

| No. | Scene Description | Scene | Related Asset Name | Duration | Shot Size | Camera Movement | Character Action | Emotion | Lighting Atmosphere |
|------|---------|------|-------------|------|------|------|---------|------|----------|
| 1 | Lin Wan standing alone by café window, raindrops sliding outside | Café | Lin Wan | 4s | Medium Shot | Slow Push | Holding coffee cup, gaze looking out window | Longing / Expectation | Warm side light + cool blue window light |

### Example Output A (Mode A · Seedream)

[Prompt]
Live-action photographic photography, cinematic quality, surrealistic documentary, strong contrast,extreme/ultimate detail,ultra-clear texture, medium shot composition, character half-body in frame, delicate skin, delicate facial rendering,three-dimensional facial features, each hair strand clearly defined, delicate hair rendering, female protagonist standing by café window, both hands naturally holding a cup of coffee, gaze looking out window, expression both expectant and slightly longing, café warm side light, cool blue rainy light outside windowtrace character edge, wooden table and chair textureclear, raindrop details on glass window, modern Eastern temperament, cinematic storyboard composition, ultra-clear 4K quality, natural sharpness, realistic clarity, no subtitles, no watermark, no title overlay.
Based on the reference image of Lin Wan, maintain consistent: face features, hairstyle, costume details. Generate a new scene: standing by the cafe window on a rainy day, holding a coffee cup, gazing outside. Keep character appearance identical to reference.

### Example Output B (Mode B · Nanobanana)

```xml
<role>
You are a cinematographer and storyboard artist.
Maintain strict visual continuity across all shots.
</role>
<character_reference>
Image [1]: Lin Wan — black long hair tied in a half ponytail, gentle eyes, modern casual outfit, slim body shape
</character_reference>
<continuity_rules>
- Same wardrobe, hairstyle, face features across ALL shots
- Same environment, lighting style, color grade
- Only framing, angle, action, expression may change
- Do NOT introduce new characters not in reference images
</continuity_rules>
<shot>
Medium shot, character standing by a cafe window on a rainy day, holding a coffee cup with both hands, gazing outside with an expression of expectation and longing, warm side light, cold blue window light creating rim light effect, wooden table texture, raindrops on glass visible, modern cinematic realism, ultra-sharp 4K, high detail, crisp textures, photorealistic clarity, no subtitles, no captions, no watermark, no title overlay.
</shot>
<negative>
no plastic skin, no beauty filter, no studio lighting, no centered composition, no oversaturation, no AI generated look, no motion blur, no noise, no blurry, no out of focus, no subtitles, no captions, no watermark, no title overlay, no UI text, no ancient costume, no hanfu, no traditional Chinese architecture
</negative>
```

## Quick Reference Card

### Emotion → Visual Word Quick Reference

| Emotion | Facial Keywords | Light Matching |
|------|-----------|---------|
| Heartbeat | Corners of mouth slightly raised, smile in eyes | Warm side light |
| Sadness | Face calm, eyes dim | Diffused cool light |
| Anger | Brows and eyes sharp, eyes blazing | Hard side light high contrast |
| Tenderness | Expression soft, eyes focused | Scattered warm lightpartial |
| Determination | Expression serious, eyes determined | Neutral gray tone |
| Indifference | Face cold, eyes distant | Cool blue side light |
| Endurance | Face calm, emotion suppressed in eyes | Low-key cool light, shadows retained |

