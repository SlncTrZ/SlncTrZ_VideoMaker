---
name: director_storyboard
description: Director storyboard prompt techniques · 90s Japanese Anime Aesthetic
metaData: director_skills
---

# Storyboard Prompts · 90s Japanese Anime · Style-Specific Techniques

---

## Scope

This Skill is dedicated to generating storyboard prompts for the **90s Japanese Anime Aesthetic** style.

---

## Emotion → Face/Eye Expression Word Mapping

| Emotion Input | Face Words | Eye Words | Micro-expression Supplement |
|----------|--------|--------|-----------|
| Heartthrob / Joy | Slight smile at the corners of the mouth, faint blush on cheeks | Bright eyes, gentle gaze | Crescent-shaped eyes, reserved expression |
| Sadness / Loss | Downcast expression, slightly reddened eyes | Dim eyes, wandering gaze | Slightly furrowed brows, restrained expression |
| Surprise / Shock | Slightly stunned expression, wide eyes | Surprised eyes, focused gaze | Raised eyebrows, animated expression |
| Tenderness / Deep Affection | Soft expression, warm brows and eyes | Focused gaze, affectionate look | Slight smile, restrained warmth |
| Determination / Resolve | Serious expression, firm eyes | Clear eyes, focused gaze | Determined expression, bright temperament |
| Shyness / Bashfulness | Flushed cheeks, evasive eyes | Downcast gaze, unable to look directly | Fingers gently touching cheek, natural expression |
| Warmth / Being Moved | Soft expression, eyes crinkling with smile | Warm eyes, gentle gaze | Corner of mouth upturned, sincere expression |
| Loneliness / Nostalgia | Quiet expression, distant gaze | Vacant stare, lost in thought | Calm expression, tranquil temperament |
| Happiness / Elation | Bright smile, crescent eyes | Bright eyes, animated expression | Arms open, light movements |
| Nervousness / Anxiety | Slightly stiff expression, slight frown | Wandering eyes, uncertain gaze | Fingers lightly pinching clothes, natural movements |

---

## Lighting and Atmosphere Vocabulary (90s Japanese Anime)

### Time-of-Day Lighting

| Time Period | Main Light Words | Tone Words | Atmosphere Words |
|--------|--------|--------|---------|
| Early Morning | Soft morning light, diffused light | Warm yellow tint + light blue accents | Fresh feeling, light filtering through leaves |
| Afternoon | Soft side lighting, diffused light | Warm tones dominant | Dappled light and shadow, warm feeling |
| Dusk / Sunset | Backlit warm tones, orange afterglow | Amber warm + pink accents | Long shadows stretching, nostalgic feeling |
| Night | Cool moonlight, localized warm light | Light blue dominant + warm color accents | Quiet feeling, layered light and shadow |
| Rainy Day | Diffused cool light, even and soft | Gray-blue tint + localized warm colors | Wet feeling, fresh feeling |
| Memory / Flashback | Soft-focus warm light, misty effect | Warm yellow dominant, slightly faded | Nostalgic feeling, blurred edges |

### Emotional Lighting

| Emotional Tone | Light Type | Additional Constraints |
|----------|----------|---------|
| Heartthrob / Tenderness | Soft side light, warm diffused light | Shallow depth of field, slight background blur |
| Sadness / Loss | Cool side light, low-key lighting | Partial shadow retention on face |
| Nostalgia / Memory | Soft-focus warm light, misty effect | Slight edge blur, overall softness |
| Romance / Sweetness | Backlit warm tones, rim light | Warm halo, slight background overexposure |
| Everyday / Warmth | Even diffused light, neutral warm tones | Soft light, no obvious shadows |
| Night / Serenity | Cool moonlight, localized warm light | Light-dark contrast, clear layering |

---

## Scene Texture Constraint Words (By Scene Type)

| Scene Type | Mandatory Constraint Words |
|----------|-----------|
| Japanese School | Wooden floor texture, chalkboard writing, green trees outside window, classroom window grids |
| Japanese Residence | Tatami mat texture, sliding door wooden frame, warm-colored lighting, traditional room layout |
| Street / Plaza | Stone pavement, utility poles, convenience store sign, bicycles parked |
| Cafe / Restaurant | Wooden tables and chairs, warm-colored pendant lights, street view outside window, coffee cup details |
| Park / Green Space | Grass texture, tree shadows, bench, distant buildings |
| Train / Carriage | Seat fabric, window reflections, scenery outside window, handrail details |
| Bedroom / Private Space | Bedding folds, desk lamp warm light, desk stationery, lived-in atmosphere |
| Shrine / Temple | Torii gate wooden pillars, stone paths, maple leaves / cherry blossoms, incense burner smoke |

---

## Fixed Style Anchor Words (All Outputs Must Include)

**90s Anime Anchor (Required):**

90s Japanese anime style, hand-drawn texture, flat coloring, clear flowing lines, soft warm tones

**Line Texture (Required for All Outputs):**

Fine flowing lines, clear contour lines, consistent line weight, no breaks, no rough edges

**Coloring Texture (Required for Character Shots):**

Flat coloring, even color, no obvious gradients, moderate color saturation

**Lighting Layers (Required for Scenes with Lighting):**

Cinematic lighting layers, clear contrast between light and dark, soft natural light effects

**Atmosphere Anchor (Required):**

Nostalgic healing atmosphere, Japanese anime aesthetics, warm emotional expression

**Quality Lock Words (All Outputs Must Include, Placed After Style Ending):**

Mode A (Chinese) — Default:
High-definition quality, clear lines, even coloring, soft colors, no noise, no grain in image

Mode A (Chinese) — In-frame text scenes (when scene descriptions contain prop text such as signs/plaques):
High-definition quality, clear lines, even coloring, soft colors, no noise, no grain in image, text on signs and props legible

Mode B (English) — Default:
high-quality 90s anime style, clear line art, even flat coloring, soft warm tones, no noise, no grain, no digital artifacts

Mode B (English) — In-frame text scenes:
high-quality 90s anime style, clear line art, even flat coloring, soft warm tones, no noise, no grain, no digital artifacts, legible text on signs and props

**Negative Prompt Template (Required for Mode B, Placed at End of Prompt):**

> ⚠️ Seedream (Mode A) **does not support negative prompts**. Negative words are only applicable to Mode B. Mode A ensures image quality through texture anchors and quality locks in the positive prompt.

Mode B (English):
no modern anime style, no digital 3D rendering, no CG animation, no cel-shading, no heavy shading, no gradient fills, no plastic look, no oversaturated colors, no neon colors, no cyberpunk, no sci-fi elements, no futuristic design

---

## Aesthetic Prohibitions (Strictly Avoid During Generation)

The following words/styles must not appear in output prompts:

- ❌ Modern Japanese anime style (e.g., post-Shinkai Makoto, MAPPA style)
- ❌ 3D rendering / CG animation / digital painting related terms
- ❌ High-saturation fluorescent colors / neon color palettes
- ❌ Modern clothing / modern architectural elements
- ❌ Heavy shadows / excessive contrast / dark style
- ❌ Cartoon proportions, big eyes, chibi-style deformations
- ❌ Cyberpunk / steampunk / western fantasy elements
- ❌ Overlaid text outside the frame (subtitles, watermarks, title cards, narration overlays, etc. — UI layer text; the frame must be a pure visual image)

> 💡 **Exception**: Prop text that exists within the story world (signs, road signs, labels, books, etc., that naturally appear in the scene) **is not within the prohibited scope**. When such content is included in storyboard scene descriptions, it should be faithfully described and required to be clear.

---

## Complete Generation Example

> The following shows a comparison of the same input using Mode A and Mode B respectively. In actual use, **only output one of them**.

### Input (Storyboard Table Row Data)

| No. | Scene Description | Scene | Related Asset Name | Duration | Shot Size | Camera Movement | Character Action | Emotion | Lighting Atmosphere |
|------|---------|------|-------------|------|------|------|---------|------|----------|
| 1 | On Asakusa Station platform, evening sun casts golden light on the girl | Station | Asakusa Station | 5s | Medium Shot | Slow push-in | Holding school bag, smiling sideways into the distance | Anticipation / Warmth | Sunset backlight warm tones |

### Example Output A (Mode A · Seedream)

[Prompt]
90s Japanese anime style, hand-drawn texture, flat coloring, clear flowing lines, soft warm tones, medium shot composition, character half-body in frame, fine flowing lines, clear contour lines, consistent line weight, no breaks, no rough edges, flat coloring, even color, no obvious gradients, moderate color saturation, girl standing on Asakusa Station platform, holding school bag, smiling sideways into the distance, eyes filled with anticipation and warmth, sunset backlight warm tones, long shadows stretching, nostalgic atmosphere, wooden platform texture visible, utility poles in background, cinematic lighting layers, clear contrast between light and dark, soft natural light effects, nostalgic healing atmosphere, Japanese anime aesthetics, warm emotional expression, high-definition quality, clear lines, even coloring, soft colors, no noise, no grain in image.
Based on the reference image of girl, maintain consistent: face features, hairstyle, costume details. Generate a new scene: standing on a train station platform at sunset, holding a school bag, smiling at the distance. Keep character appearance identical to reference.

### Example Output B (Mode B · Nanobanana)

```xml
<role>
You are a 90s anime storyboard artist.
Maintain strict visual continuity across all shots.
</role>
<character_reference>
Image [1]: girl — black long hair in twin tails, gentle eyes, school uniform, slim body shape
</character_reference>
<continuity_rules>
- Same wardrobe, hairstyle, face features across ALL shots
- Same environment, lighting style, color grade
- Only framing, angle, action, expression may change
- Do NOT introduce new characters not in reference images
</continuity_rules>
<shot>
Medium shot, character standing on a train station platform at sunset, holding a school bag with one hand, smiling gently at the distance, eyes filled with expectation and warmth, warm sunset backlight, long shadows, nostalgic atmosphere, wooden platform texture visible, electric poles in background, cinematic lighting layers, clear contrast between light and dark, soft natural light effects, healing anime aesthetic, high-quality 90s anime style, clear line art, even flat coloring, soft warm tones, no noise, no grain, no digital artifacts.
</shot>
<negative>
no modern anime style, no digital 3D rendering, no CG animation, no cel-shading, no heavy shading, no gradient fills, no plastic look, no oversaturated colors, no neon colors, no cyberpunk, no sci-fi elements, no futuristic design
</negative>
```

## Quick Reference Card

### Emotion → Visual Word Quick Lookup

| Emotion | Face Keywords | Lighting Match |
|------|-----------|---------|
| Heartthrob | Faint blush on cheeks, crescent eyes | Soft side light warm tones |
| Sadness | Downcast expression, slightly reddened eyes | Cool side light, low-key |
| Tenderness | Soft expression, warm brows and eyes | Even diffused warm light |
| Nostalgia | Calm expression, distant gaze | Soft-focus warm light, misty |
| Being Moved | Eyes crinkling with smile, sincere expression | Backlit warm tones, halo |
| Loneliness | Quiet expression, vacant eyes | Cool side light, shadows |
| Happiness | Bright smile, bright eyes | Even diffused warm light |
