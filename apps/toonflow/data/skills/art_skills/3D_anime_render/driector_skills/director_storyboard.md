---
name: director_storyboard
description: Director Storyboard Prompt Techniques · 3D Anime Render
metaData: director_skills
---

# Storyboard Prompt Techniques · 3D Anime Render · Style-Specific Techniques

---

## Scope

This Skill is dedicated to **3D anime render** style storyboard prompt generation.

---

## Emotion → Face/Eye Expression Mapping

| Emotion Input | Face Keywords | Eye Keywords | Micro-Expression Supplement |
|----------|--------|--------|-----------|
| Heart flutter / Joy | Slightly raised mouth corners, slightly flushed cheeks | Bright eyes, gentle gaze | Crescent-shaped eyes, lively expression |
| Sadness / Loss | Low expression, red-rimmed eyes | Dim eyes, wandering gaze | Slightly furrowed brows, reserved expression |
| Surprise / Curiosity | Wide eyes, vivid expression | Focused gaze, curious look | Slightly open mouth, naturalaction/movement |
| Tenderness / Deep affection | Soft expression, warm brows and eyes | Focused gaze, deep look | Slight smile, restrained warm expression |
| Determination / Courage | Serious expression, firm eyes | Clear gaze, focused look | Firm expression, bright temperament |
| Shyness / Bashfulness | Flushed cheeks, natural expression | Downcast gaze, not daring to look directly | Fingers lightly touching cheek, gentleaction/movement |
| Warmth / Emotion | Soft expression, eyes crinkling with smile | Warm gaze, soft look | Raised mouth corners, sincere expression |
| Loneliness / Nostalgia | Quiet expression, distant gaze | Vacant look, seems lost in thought | Calm expression, quiet temperament |
| Happiness / Elation | Bright smile, sparkling eyes | Lively eyes, vivid expression | Leaning forward, lightaction/movement |
| Nervousness / Unease | Slightly stiff expression, slightly furrowed brows | Wandering gaze, uncertain look | Fingers clenched, tenseaction/movement |

---

## Light and Atmosphere Vocabulary (3D Anime Render)

### Time-of-Day Lighting

| Time Period | Main Light Keywords | Hue Keywords | Atmosphere Keywords |
|--------|--------|--------|---------|
| Early Morning | Soft morning light, scattered rays | Warm yellow tone + light blueaccents | Freshness, light streaming through windows |
| Afternoon | Soft oblique side light, diffused rays | Warm toneas main | Dappled light and shadow, warmth |
| Dusk/Sunset | Backlight glow, orange afterglow | Warm orange + pinkaccents | Long stretched shadows, romantic feel |
| Night | Neon halos,partial warm light | Warm orangeprimary tone + cool coloraccents | Urban feel, light-shadow layering |
| Indoor Daily | Warm side light, uniform soft | Warm yellowas main | Cozy feel, home atmosphere |
| City Empty Shot | Diffused glow, soft halos | Warm orangeprimary tone | Open feel, urban aesthetic |

### Emotional Lighting

| Emotional Tone | Light Type | Supplementary Constraints |
|----------|----------|---------|
| Heart flutter / Warmth | Soft side light, warm diffused | Shallow depth of field, slight background blur |
| Sadness / Loss | Cool side light, low-key lighting |partialshadow retention on face |
| Romance / Sweetness | Backlight glow, rim light | Warm light halos, slight background overexposure |
| Nostalgia / Memory | Soft-focus warm light,fog effect effect | Slight edge blur, overall soft |
| Daily / Warmth | Uniform diffused light, neutral warm tone | Soft light, no obvious shadows |
| Night / Urban | Neon halos, cool-warm contrast | Light-dark contrast, clear layering |

---

## Scene Texture Constraint Words (By Scene Type)

| Scene Type | Mandatory Constraint Words |
|----------|-----------|
| Modern Urban | Detailed building structures, skyscrapers, glass curtain walls, city skyline |
| Cafe/Restaurant | Wooden tables and chairs, warm lighting, street view outside window, coffee cup details |
| Home Space | Modern furniture, warm desk lamp, daily clutter details, cozy atmosphere |
| Office | Glass partitions, desks, computer screens, modern office chairs |
| Street/Plaza | Asphalt road, streetlights, pedestrians, modern architecture |
| Mall/Indoor | Marble floor, glass shop windows, commercial space, lighting |
| Park/Greenspace | Grass texture, tree shadows, benches, distant buildings |
| Car/Public Transport | Seat fabric, window reflection, dashboard light, blurred street view outside |

---

## Fixed Style Anchor Words (Must be included in all outputs)

**3D anime anchor (mandatory):**

3D anime render, cel shadingtexture, cinematic lighting, high-detail materials

**Outline lines (mandatory for all outputs):**

Clear outline lines, bright cartoon rendering, uniform consistent outline lines, no broken lines no rough edges

**Material texture (mandatory when material shots are included):**

High-detail materials, realistic materials combined with cartoon proportions, clear material textures, delicate surfacetexture

**Light-shadow layering (mandatory when lighting scenes are included):**

Soft light-shadow layering, clear light-dark contrast, soft natural lighting effects, warm tonedominant

**Atmosphere anchor (mandatory):**

Joyful healing atmosphere, 3D anime aesthetic, warm emotional expression, modern urban atmosphere

**Quality lock words (must be included in all outputs, placed after style closing):**

Mode A (Chinese) — Default:
8K ultra HD, clear lines, delicate materials, rich colors, nocolor noise no noise

Mode A (Chinese) — In-frame text scenes (when scene description contains sign/signage prop text):
8K ultra HD, clear lines, delicate materials, rich colors, nocolor noise no noise, text on signs/signage and other props clearly readable

Mode B (English) — Default:
8K ultra HD, clear cel-shading, detailed materials, warm tones, no digital artifacts, no grain, no noise

Mode B (English) — In-frame text scenes:

8K ultra HD, clear cel-shading, detailed materials, warm tones, no digital artifacts, no grain, no noise

Mode B (English) — In-frame text scenes:

8K ultra HD, clear cel-shading, detailed materials, warm tones, no digital artifacts, no grain, no noise, legible text on signs and props

**Negative prompt template (Mode B must include, placed at end of prompt):**

> ⚠️ Seedream (Mode A) **does not support negative prompts**. Negative prompts only apply to Mode B. Mode A ensures quality through texture anchoring and quality locking in positive prompts.

Mode B (English):
no photorealism, no realistic rendering, no CG realism, no dark tones, no heavy shading, no oversaturated colors, no neon colors, no cyberpunk, no sci-fi elements, no futuristic design, no plastic look, no cartoon flat coloring without depth

---

## Aesthetic Prohibitions (Strictly avoid during generation)

The following words/styles must not appear in output prompts:

- ❌ Realistic rendering/photorealistic realism style
- ❌ Dark tones/heavy shadows/excessive contrast style
- ❌ High-saturation fluorescent colors/neon color system
- ❌ Lack of modern elements (must clearly indicate modern scenes)
- ❌ Cartoon proportions, big eyes, chibi and otherdeformation descriptions
- ❌ Cyberpunk/steampunk/ empty empty Western fantasy elements
- ❌ Overlaid on-screen text (subtitles, watermarks, title cards, narrationoverlay text and other UI layer text; the frame must be purely visual)

> 💡 **Exception**: Prop text within the story world (signs, street signs, signage, books and other naturally occurring text in the scene) **is not within the prohibited range**. When the storyboard scene description includes such content, describe its existence truthfully and require the text to be clear.

---

## Complete Generation Example

> The following shows a comparison using Mode A and Mode B for the same input. In actual use, **only output one of them**.

### Input (Storyboard Row Data)

| No. | Scene Description | Scene | Related Asset Name | Duration | Shot Size | Camera Movement | Character Action | Emotion | Light Atmosphere |
|------|---------|------|-------------|------|------|------|---------|------|----------|
| 1 | On a dusk street, a girl stands at the intersection, sunset glow spilling over her hair | Street | Girl | 5s | Medium shot | Slow push | Holding shopping bag, smiling sideways into the distance | Expectation / Warmth | Dusk glow + warm side light |

### Example Output A (Mode A · Seedream)

[Prompt]
3D anime render, cel shadingtexture, cinematic lighting, high-detail materials, medium shot composition, character half body in frame, clear outline lines, bright cartoon rendering, uniform consistent outline lines, no broken lines no rough edges, high-detail materials, realistic materials combined with cartoon proportions, clear material textures, delicate surfacetexture, on a dusk street, a girl stands at the intersection, holding a shopping bag, smiling sideways into the distance, eyes full of expectation and warmth, sunset glow spilling over her hair, backlight glow, warm orangeprimary tone, pinkaccents, soft light-shadow layering, clear light-dark contrast, soft natural lighting effects, joyful healing atmosphere, 3D anime aesthetic, warm emotional expression, modern urban atmosphere, 8K ultra HD, clear lines, delicate materials, rich colors, nocolor noise no noise.
Based on the reference image of the girl, maintain consistent: face features, hairstyle, costume details. Generate a new scene: standing on a street corner at sunset, holding a shopping bag, smiling gently into the distance. Keep character appearance identical to reference.

### Example Output B (Mode B · Nanobanana)

```xml
<role>
You are a 3D animation storyboard artist.
Maintain strict visual continuity across all shots.
</role>
<character_reference>
Image [1]: Girl — long brown hair, gentle eyes, modern casual outfit, slim body shape
</character_reference>
<continuity_rules>
- Same wardrobe, hairstyle, face features across ALL shots
- Same environment, lighting style, color grade
- Only framing, angle, action, expression may change
- Do NOT introduce new characters not in reference images
</continuity_rules>
<shot>
Medium shot, character standing on a street corner at sunset, holding a shopping bag with one hand, smiling gently into the distance, eyes filled with expectation and warmth, sunset backlight on hair, warm cel-shading, detailed materials, clear outline lines, cinematic lighting, warm tones, soft shallow depth of field, modern urban aesthetic, healing atmosphere, high-quality 3D animation, 8K ultra HD, clear line art, detailed materials, no digital artifacts, no grain.
</shot>
<negative>
no photorealism, no realistic rendering, no CG realism, no dark tones, no heavy shading, no oversaturated colors, no neon colors, no cyberpunk, no sci-fi elements, no futuristic design, no plastic look, no cartoon flat coloring without depth
</negative>
```

## Quick Reference Card

### Emotion → Visual Keywords Quick Lookup

| Emotion | Face Keywords | Lighting Match |
|------|-----------|---------|
| Heart flutter | Slightly raised mouth corners, slightly flushed cheeks | Backlight glow warm tone |
| Sadness | Low expression, red-rimmed eyes | Cool side light low-key |
| Tenderness | Soft expression, warm brows and eyes | Uniform diffused warm light |
| Romance | Focused gaze, deep look | Backlight warm tone halos |
| Emotion | Eyes crinkling with smile, sincere expression | Warm side light soft |
| Loneliness | Quiet expression, vacant look | Cool side lightshadow area |
| Happiness | Bright smile, sparkling eyes | Warm diffused light |
| Sweetness | Bright eyes, lively expression | Backlight rim light |
