---
name: director_storyboard
description: Director Storyboard Prompt Technique · Stop-Motion Clay Texture
metaData: director_skills
---

# Storyboard Prompts · Stop-Motion Clay · Style-Specific Technique

---

## Scope of Application

This Skill is dedicated to generating storyboard prompts for the **stop-motion clay texture** style.

---

## Emotion → Facial Expression/Eye Word Mapping

| Emotion Input | Facial Expression Words | Eye Words | Micro-expression Supplement |
|----------|--------|--------|-----------|
| Heart-throb / Joy | Cheeks slightly flushed,implicit expression | Eyes bright, gaze gentle | Lips slightly raised, clay impressions |
| Sadness / Loss | Low spirits, soft expression | Eyes dim, gaze wandering | Eyebrows slightly furrowed, restrained expression |
| Surprise / Curiosity | Eyes widened, vivid expression | Eyes focused, curious gaze | Mouth slightly open, natural movement |
| Tenderness / Deep affection | Soft expression, gentle brows and eyes | Eyes focused, affectionate gaze | Lips slightly raised, restrained warm expression |
| Determination / Courage | Serious expression, firm eyes | Clear gaze, focused look | Firm expression, bright temperament |
| Shyness / Bashfulness | Face flushed, natural expression | Eyes lowered, dare not look directly | Hands pinch clay clothes, gentle movement |
| Warmth / Being moved | Soft expression, eyes crinkled with smile | Warm eyes, gentle gaze | Lips raised, sincere expression |
| Loneliness / Nostalgia | Quiet expression, distant eyes | Gaze unfocused, seeming lost in thought | Calm expression, quiet temperament |
| Happiness / Elation | Bright smile, shining eyes | Lively expression, vivid look | Body leaning forward, light movement |
| Tension / Anxiety | Slightly stiff expression, browsslightly furrowed | Eyes wandering, uncertain gaze | Fingers clenched, tense movement |

---

## Light Atmosphere Word Bank (Stop-Motion Clay)

### Time-of-Day Lighting

| Time Period | Main Light Words | Tone Words | Atmosphere Words |
|--------|--------|--------|---------|
| Early Morning | Soft morning light, scattered light | Warm yellow + light blueaccents | Fresh feeling, light through window |
| Afternoon | Soft oblique side light, diffused light | Warm toneas main | Dappled light and shadow, warm feeling |
| Dusk/Sunset | Backlit warm tone, orange afterglow | Amber warm + pinkaccents | Long stretched shadows, nostalgic feel |
| Night | Moonlight cool tone,partial warm light | Light blue main + warm coloraccents | Quiet feel, light layering |
| Indoor Daily | Warm side light, uniform and soft | Warm yellowas main | Warm feeling, family atmosphere |
| Fantasy/Magic | Fantasy light effects, magical light particles | Colorful light spots, soft focus effect | Dreamy feel, magical atmosphere |

### Emotional Lighting

| Emotional Tone | Light Type | Supplementary Constraints |
|----------|----------|---------|
| Heart-throb / Warmth | Soft side light, warm diffusion | Shallow depth of field, background slightly blurred |
| Sadness / Loss | Cool side light, low-key lighting |partial dark areas preserved on face |
| Fantasy / Dreamy | Magical light effects, colorful light dots | Glow control, soft rim light |
| Nostalgia / Memory | Soft focus warm light,fog effect effect | Edges slightly blurred, overall soft |
| Daily / Warmth | Uniform diffused light, neutral warm tone | Light soft, no obvious shadows |
| Night / Quiet | Moonlight cool tone,partial warm light | Light-dark contrast, clear layering |

---

## Scene Texture Constraint Words (By Scene Type)

| Scene Type | Mandatory Constraint Words |
|----------|-----------|
| Retro Log Cabin | Clear wood texture, clay brick wall, warm color lights, retro furniture |
| Fantasy Forest | Trees clay texture, light spot effect, magical light particles, natural ground |
| Indoor Daily | Wall clay texture, furniture details, warm color lights, daily clutter |
| Street Square | Stone pavement clay texture, retro architecture, street lamp warm light, clay crowd |
| Cafe/Restaurant | Wooden table and chair clay texture, warm color lights, blurred street view outside window |
| Garden/Courtyard | Flowers and plants clay modeling, soil texture, dappled sunlight, bench details |
| Cave/Underground | Rock clay texture, cave lighting, shadow layering, mysterious atmosphere |
| Castle/Palace | Stone brick clay texture, ornate decoration, warm color lights, grand space |

---

## Fixed Style Anchor Words (Must be included in all output)

**Stop-Motion Anchor (Mandatory):**

Stop-motion animation style, clay texture, visible finger impressions, clay texture material, warm tone lighting

**Clay Texture (Mandatory for all output):**

Clear clay texture, visible finger impressions, obvious material graininess,retain handcraftedtraces

**Character Material (Mandatory for character shots):**

3D cartoon character, fantasy style, soft shallow depth of field, clear clay material details

**Light Layering (Mandatory for lighting scenes):**

Cinematic light layering, clear light-dark contrast, soft and natural light effects, warm tonedominant

**Atmosphere Anchor (Mandatory):**

Healing nostalgic atmosphere, stop-motion animation aesthetic, warm emotional expression, handcrafted texture

**Quality Lock Words (Must be included in all output, placed after style closing):**

Mode A (Chinese) — Default:
High-definition quality, clear clay texture, soft colors,image without color noise or grain, shallow depth of field effect

Mode A (Chinese) — In-frame text scenes (when scene description contains prop text such as signs/labels):
High-definition quality, clear clay texture, soft colors,image without color noise or grain, shallow depth of field effect, signs/labels and other prop textclearcan readable 

Mode B (English) — Default:
high-quality stop-motion animation, clear clay texture, warm lighting, soft shallow depth of field, no digital artifacts, no plastic look

Mode B (English) — In-frame text scenes:
high-quality stop-motion animation, clear clay texture, warm lighting, soft shallow depth of field, no digital artifacts, no plastic look, legible text on props and signs

**Negative Prompt Template (Mode B must include, placed at end of prompt):**

> ⚠️ Seedream (Mode A) **does not support negative prompts**. Negative words only apply to Mode B. Mode A ensures image quality through texture anchoring and quality locking in positive words.

Mode B (English):
no modern digital 3D, no CGI rendering, no smooth plastic, no oversaturated colors, no neon colors, no cyberpunk, no sci-fi elements, no sharp edges, no clean lines, no vector art, no cartoon flat coloring, no cel-shading

---

## Aesthetic Prohibitions (Strictly Avoid During Generation)

The following words/styles must not appear in output prompts:

- ❌ Modern 3D animation style (Pixar/Disney later style)
- ❌ Smooth plastic/modern CG rendering related words
- ❌ High-saturation fluorescent colors/neon colors
- ❌ Modern scenes/modern architectural elements
- ❌ Heavy shadows/excessive contrast/dark style
- ❌ Cartoon proportions, big eyes, chibi and otherdeformation descriptions
- ❌ Cyberpunk/steampunk/Western fantasy elements
- ❌ Overlaid text on frame (subtitles, watermarks, title cards, narrationoverlay text and other UI layer text; the frame must be a pure visual image)

> 💡 **Exception**: Prop text within the story world (signs, road signs, labels, books and othertext naturally present in the scene) **does not fall within the prohibited range**. When such content is included in storyboard scene descriptions, it should betruthfully described andrequire textclear.

---

## Complete Generation Examples

> The following is acomparisondisplay of Mode A and Mode B for the same input. In actual use, **output only one of them**.

### Input (Storyboard Row Data)

| No. | Scene Description | Scene | Related Asset Name | Duration | Shot Scale | Camera Movement | Character Action | Emotion | Light Atmosphere |
|------|---------|------|-------------|------|------|------|---------|------|----------|
| 1 | Inside a retro log cabin, two clay figurines smile at each other under warm light | Log cabin | Protagonist A/B | 5s | Medium shot | Slow push | Sitting across from each other, hands gently touching, tender smile | Heart-throb / Sweet | Warm side light + soft shallow depth of field |

### Example Output A (Mode A · Seedream)

[Prompt]
Stop-motion animation style, clay texture, visible finger impressions, clay texture material, warm tone lighting, medium shot composition, two clay figurines half-body in frame, clear clay texture, visible finger impressions, obvious material graininess,retain handcraftedtraces, 3D cartoon character, fantasy style, soft shallow depth of field, clear clay material details, inside a retro log cabin, two clay figurines sitting across from each other under warm light, hands gently touching, tender smile, eyes full of heart-throb and sweetness, warm side light, soft shallow depth of field, clear wood texture, clay brick wall texture, cinematic light layering, clear light-dark contrast, soft and natural light effects, healing nostalgic atmosphere, stop-motion animation aesthetic, warm emotional expression, high-definition quality, clear clay texture, soft colors,image without color noise or grain, shallow depth of field effect.
Based on the reference image of Protagonist A/B, maintain consistent: face features, hairstyle, costume details. Generate a new scene: two clay characters sitting across from each other inside a retro wooden room at warm light, touching hands gently, smiling tenderly. Keep character appearance identical to reference.

### Example Output B (Mode B · Nanobanana)

```xml
<role>
You are a stop-motion claymation director.
Maintain strict visual continuity across all shots.
</role>
<character_reference>
Image [1]: Protagonist A/B — clay figurines, soft rounded features, warm earthy tones, small cute proportions
</character_reference>
<continuity_rules>
- Same clay texture, color palette, face features across ALL shots
- Same environment, lighting style, color grade
- Only framing, angle, action, expression may change
- Do NOT introduce new characters not in reference images
</continuity_rules>
<shot>
Medium shot, two clay characters sitting across from each other inside a retro wooden room at warm light, hands gently touching, smiling tenderly, eyes filled with warmth and affection, warm side light, soft shallow depth of field, wooden texture visible, clay brick wall texture, cinematic lighting layers, clear contrast between light and dark, soft natural light effects, healing nostalgic atmosphere, stop-motion animation aesthetic, high-quality stop-motion, clear clay texture, warm lighting, no digital artifacts, no plastic look.
</shot>
<negative>
no modern digital 3D, no CGI rendering, no smooth plastic, no oversaturated colors, no neon colors, no cyberpunk, no sci-fi elements, no sharp edges, no clean lines, no vector art, no cartoon flat coloring, no cel-shading
</negative>
```

## Quick Reference Card

### Emotion → Visual Word Quick Lookup

| Emotion | Facial Expression Keywords | Light Matching |
|------|-----------|---------|
| Heart-throb | Cheeks slightly flushed, clay impressions | Soft side light warm tone |
| Sadness | Low spirits, soft expression | Cool side light low-key |
| Tenderness | Soft expression, gentle brows and eyes | Uniform diffused warm light |
| Fantasy | Eyes widened, colorful light dots | Fantasy light effects glow |
| Being moved | Eyes crinkled with smile, sincere expression | Warm side light soft |
| Loneliness | Quiet expression, gaze unfocused | Cool side light dark areas |
| Happiness | Bright smile, shining eyes | Warm diffused light |
