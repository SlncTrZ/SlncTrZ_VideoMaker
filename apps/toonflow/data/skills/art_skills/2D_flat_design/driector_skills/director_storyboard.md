---
name: director_storyboard
description: Director storyboard prompt techniques · 2D Flat Design
metaData: director_skills
---

# Storyboard Prompts · 2D Flat Design · Style-Specific Techniques

---

## Scope

This Skill is dedicated to generating storyboard prompts for the **2D Flat Design** style.

---

## Emotion → Face/Eye Expression Word Mapping

| Emotion Input | Face Words | Eye Words | Micro-expression Supplement |
|----------|--------|--------|-----------|
| Heartthrob / Joy | Simple lines, orange color blocks | Round eyes, bright gaze | Simple smile, flat design |
| Sadness / Loss | Simple lines, cool tones | Oval eyes, soft gaze | Corners of mouth turned down, flat design |
| Surprise / Curiosity | Round eyes, enlarged expression | Focused eyes, curious look | O-shaped mouth, flat design |
| Tenderness / Deep Affection | Soft lines, warm tones | Focused gaze, soft eyes | Corners of mouth turned up, flat design |
| Determination / Courage | Straight lines, cool tones | Firm eyes, concentrated gaze | Clear expression, flat design |
| Shyness / Bashfulness | Pink color blocks, rounded lines | Eyes looking down, unable to look directly | Blush on cheeks, flat design |
| Warmth / Being Moved | Warm-toned lines, soft expression | Warm eyes, gentle gaze | Corner of mouth upturned, flat design |
| Loneliness / Nostalgia | Cool-toned lines, simple expression | Vacant eyes, lost in thought | Calm expression, flat design |
| Happiness / Elation | Rounded lines, bright expression | Crescent eyes, animated expression | Light movements, flat design |
| Nervousness / Anxiety | Thinner lines, brow symbols | Smaller eyes, uncertain gaze | Tense hand position, flat design |

---

## Color Atmosphere Vocabulary (Flat Design)

### Hue Usage

| Scene Type | Main Color Words | Secondary Color Words | Atmosphere Words |
|--------|--------|--------|---------|
| Daily Life | Bright blue + cream white | Warm orange accents | Simple, modern feel |
| Office Space | Cool gray + cool blue | White + light gray | Rational, efficient feel |
| Leisure Space | Warm orange + warm pink | Cream white + light yellow | Relaxed, comfortable feel |
| Romantic Scene | Warm pink + warm orange | Cream white + light purple | Cozy, sweet feel |
| Night Scene | Deep blue + purple | Warm yellow accents | Quiet, mysterious feel |
| Memory Scene | Light yellow + light gray | Warm pink accents | Nostalgic, soft feel |

### Emotional Color Blocks

| Emotional Tone | Color Block Type | Additional Constraints |
|----------|----------|---------|
| Heartthrob / Tenderness | Warm contrasting color blocks | More negative space, main color prominent |
| Sadness / Loss | Cool single color block | Reduced saturation, larger negative space |
| Happiness / Vitality | Multi-color contrasting blocks | High saturation, rich colors |
| Nostalgia / Memory | Low-saturation single color block | Unified tone, more negative space |
| Everyday / Warmth | Warm main color block | Soft contrast, moderate negative space |
| Night / Tranquility | Cool main color block | Warm accents, clear layering |

---

## Scene Texture Constraint Words (By Scene Type)

| Scene Type | Mandatory Constraint Words |
|----------|-----------|
| Flat Character | Geometric shapes, simple lines, no shadows no gradients, pure color block fills |
| Flat Scene | Solid color background, geometric shapes, simple structure, no textures no details |
| Office Space | Simple furniture, geometric shapes, cool tones, modern design feel |
| Home Space | Minimal furniture, warm tones, geometric lines, cozy atmosphere |
| Cityscape | Simplified buildings, geometric shapes, cool tones, modern urban feel |
| Natural Environment | Geometric trees, solid color grass, simple shapes, flat-design nature |
| Transportation Scene | Simplified vehicles, geometric shapes, cool tones, modern transport feel |
| Interior Space | Clean partitions, solid color walls, geometric doors and windows, modern minimalism |

---

## Fixed Style Anchor Words (All Outputs Must Include)

**Flat Style Anchor (Required):**

2D flat design, Flat Design, no shadows no gradients, pure color blocks, simple lines

**Color Block Texture (Required for All Outputs):**

Pure color fills, no textures no gradients, geometric shapes, flat design

**Contour Lines (Required for All Outputs):**

Clear contour lines, consistent line weight, no breaks, no rough edges

**Color Layering (Required for All Outputs):**

Moderate color saturation, clear color block contrast, no complex lighting layers

**Atmosphere Anchor (Required):**

Minimalist modern atmosphere, flat design aesthetics, clear emotional expression, modern visual feel

**Quality Lock Words (All Outputs Must Include, Placed After Style Closing):**

Mode A (Chinese) — Default:
High-definition quality, clear lines, pure colors, no noise, no grain in image, no shadows no gradients

Mode A (Chinese) — In-frame text scenes (when scene descriptions contain prop text such as signs/plaques):
High-definition quality, clear lines, pure colors, no noise, no grain in image, no shadows no gradients, text on signs and props legible

Mode B (English) — Default:
high-quality 2D flat design, clean lines, pure colors, no shadows, no gradients, no noise, no artifacts

Mode B (English) — In-frame text scenes:
high-quality 2D flat design, clean lines, pure colors, no shadows, no gradients, no noise, no artifacts, legible text on signs and props

**Negative Prompt Template (Required for Mode B, Placed at End of Prompt):**

> ⚠️ Seedream (Mode A) **does not support negative prompts**. Negative words are only applicable to Mode B. Mode A ensures image quality through texture anchors and quality locks in the positive prompt.

Mode B (English):
no 3D rendering, no photorealism, no shadows, no gradients, no textures, no realistic lighting, no realistic materials, no complex details, no detailed backgrounds, no realistic faces, no realistic hair, no realistic clothing

---

## Aesthetic Prohibitions (Strictly Avoid During Generation)

The following words/styles must not appear in output prompts:

- ❌ Realistic rendering / photorealistic style
- ❌ Shadows / gradients / texture related terms
- ❌ High-saturation fluorescent colors / excessive contrast color palettes
- ❌ Complex details / fine texture descriptions
- ❌ 3D perspective / depth descriptions
- ❌ Realistic characters / realistic clothing / realistic architecture
- ❌ Overlaid text outside the frame (subtitles, watermarks, title cards, narration overlays, etc. — UI layer text; the frame must be a pure visual image)

> 💡 **Exception**: Prop text that exists within the story world (signs, road signs, labels, books, etc., that naturally appear in the scene) **is not within the prohibited scope**. When such content is included in storyboard scene descriptions, it should be faithfully described and required to be clear.

---

## Complete Generation Example

> The following shows a comparison of the same input using Mode A and Mode B respectively. In actual use, **only output one of them**.

### Input (Storyboard Table Row Data)

| No. | Scene Description | Scene | Related Asset Name | Duration | Shot Size | Camera Movement | Character Action | Emotion | Lighting Atmosphere |
|------|---------|------|-------------|------|------|------|---------|------|----------|
| 1 | Flat style two people meeting, orange and blue color block contrast, simple background | City | Character A/B | 5s | Medium Shot | Static | Looking at each other smiling, simple lines | Heartthrob / Warmth | Warm contrast + negative space |

### Example Output A (Mode A · Seedream)

[Prompt]
2D flat design, Flat Design, no shadows no gradients, pure color blocks, simple lines, medium shot composition, two flat characters half-body in frame, pure color fills, no textures no gradients, geometric shapes, flat design, clear contour lines, consistent line weight, no breaks, no rough edges, moderate color saturation, clear color block contrast, no complex lighting layers, flat style two people meeting, orange and blue color block contrast, simple background, looking at each other smiling, simple lines, bright eyes, warm contrast, plenty of negative space, minimalist modern atmosphere, flat design aesthetics, clear emotional expression, modern visual feel, high-definition quality, clear lines, pure colors, no noise, no grain in image, no shadows no gradients.
Based on the reference image of Character A/B, maintain consistent: face features, hairstyle, costume details. Generate a new scene: two flat characters meeting in city, orange and blue color block contrast, simple background, smiling and looking at each other. Keep character appearance identical to reference.

### Example Output B (Mode B · Nanobanana)

```xml
<role>
You are a 2D flat design storyboard artist.
Maintain strict visual continuity across all shots.
</role>
<character_reference>
Image [1]: Character A/B — flat design characters, geometric shapes, simple lines, pure colors
</character_reference>
<continuity_rules>
- Same color palette, face features, hairstyle across ALL shots
- Same environment, background color, geometric style
- Only framing, angle, action, expression may change
- Do NOT introduce new characters not in reference images
</continuity_rules>
<shot>
Medium shot, two flat characters meeting in city, orange and blue color block contrast, simple background, smiling and looking at each other, geometric shapes, simple lines, pure colors, no shadows, no gradients, clean lines, high-quality 2D flat design, no noise, no artifacts.
</shot>
<negative>
no 3D rendering, no photorealism, no shadows, no gradients, no textures, no realistic lighting, no realistic materials, no complex details, no detailed backgrounds, no realistic faces, no realistic hair, no realistic clothing
</negative>
```

## Quick Reference Card

### Emotion → Visual Word Quick Lookup

| Emotion | Face Keywords | Color Match |
|------|-----------|---------|
| Heartthrob | Rounded lines, orange color blocks | Warm pink + warm orange contrast |
| Sadness | Straight lines, cool tones | Cool blue + gray single color |
| Tenderness | Soft lines, warm tones | Warm yellow + cream white soft |
| Romance | Curved lines, pink tones | Warm pink + warm orange contrast |
| Being Moved | Upturned lines, warm tones | Warm orange + warm yellow main colors |
| Loneliness | Cool-toned lines, simple expression | Cool blue + purple single color |
| Happiness | Rounded lines, bright expression | Warm orange + yellow contrast |
