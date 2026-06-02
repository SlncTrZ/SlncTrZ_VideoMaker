---
name: storyboard_prompt_techniques
description: >-
  General storyboard prompt technique reference.
  Covers prompt parsing mapping rules, shot size vocabulary, output format specifications, prompt structure framework, image quality specifications, image asset annotation rules, character position consistency rules, etc., for Agent activation use.
---
# Storyboard Prompts · General Basic Techniques

> The following are **general basic specifications** for storyboard prompt generation, applicable to all visual styles. Style anchoring words, emotion mapping, lighting vocabulary, scene texture, aesthetic prohibitions, and other **style-related content** are defined by style-specific techniques (`director_storyboard`).

---

## Applicable Modes

This specification only supports the following two **reference image consistency mode** outputs:

- **Mode A**: Seedream (doubao-seedream)
- **Mode B**: Nanobanana (Gemini)

> ⚠️ **Does not generate text-to-image mode prompts**, all outputs are based on the **reference image (image-to-image / ControlNet / character consistency)** workflow premise.

---

## Storyboard Table Content Fidelity Principle (Highest Priority)

Prompt generation is **format conversion**, not **creative writing**. The storyboard table is the prompt's **sole content source**; all visual information must be faithful to the corresponding storyboard table row, only adapting expression format and wording to image generation model requirements.

### Core Principle: Visual Description is the Backbone, Not Raw Material

The storyboard table's "Visual Description" field carries the shot's full visual information and is the **backbone content** of the prompt body. Style words, image quality words, lighting words, and other modifier vocabulary are **auxiliary decoration** serving the visual description. When they compete for token budget, **visual description takes priority**; prefer reducing style words over deleting visual elements from the description.

### Iron Laws

1. **Full visual description retention**: All visual elements (subjects, objects, spatial relationships, dynamic details, shot relationships) in the storyboard table's "Visual Description" field must appear completely in the prompt body, **no omissions allowed**
2. **Semantic equivalent conversion**: When converting storyboard table fields to prompts, only change the expression form (CN↔EN, prose↔keywords, narrative language↔visual description), **do not change semantics**. E.g., storyboard table writes "architectural space column shadows deep" → prompt must reflect the space column shadow dark tones, cannot replace with "gorgeous architecture" or other different semantics
3. **Prohibit creative divergence**: Do not add decorative visual elements not mentioned in the storyboard table (e.g., if storyboard table doesn't mention petals falling, prompt cannot add them); do not reinterpret scene atmosphere (storyboard table writes "cold arrogant contempt" cannot be changed to "sad lonely")
4. **Style words subordinate to content**: Style anchoring words, image quality locking words, scene texture words, and other style-related vocabulary are **auxiliary modifiers**, serving the storyboard table's defined visual content, must not overstep — when style words conflict with the storyboard table's specific description, the storyboard table prevails
5. **Field-by-field traceback verification**: After generating each prompt, must compare field by field against the corresponding storyboard table row, confirming the following mappings are all accurately reflected:

| Storyboard Table Field | Must Reflect in Prompt | Verification Point |
|------------------------|----------------------|--------------------|
| Visual Description | Core content of the prompt body【Visual】section | All visual subjects, spatial relationships, key details **zero omissions** retained |
| Scene | Environmental anchoring in the prompt body【Visual】section | Scene type consistent |
| Shot Size | Shot size framing word | Shot size matches (composite shot size takes first frame starting end) |
| Character Action | Subject posture and facing | Action semantics consistent, facing explicitly annotated |
| Emotion | Emotional expression word | Emotional tone consistent |
| Lighting Atmosphere | 【Lighting】section of the prompt body | Light source direction, color tone tendency, light-dark relationship fully consistent |

> ⚠️ **Verification fail = prompt invalid**, must correct before output. Most common failure mode: specific elements in the visual description get overridden and omitted by style template words.

---

## First Frame Identification Principle

The storyboard image is the **first frame reference for the video**. The model should determine the visual state of that frame based on the storyboard table's "Visual Description" semantics, not mechanically apply a "preparatory state" template.

**Judgment Logic**:

| Visual Description Type | Handling Method | Example |
|------------------------|----------------|---------|
| **Static moment** (stop to look up, stand and gaze, side-head sneer, lean over writing) | **Generate directly per description**, no action rewriting | "Character stops to look up at something" → prompt directly writes "stop to look up at something" |
| **Continuous action process** (walk through corridor, swing sword to strike, turn and leave) | Take the action's **starting moment frozen state** (not abstract preparatory state) | "Swing sword to strike" → "Sword already raised above head, blade tip pointing down, moment before striking" |
| **Camera movement** (slow push to mid shot, pull out to wide shot, fade in) | Take the **starting end shot size** as first frame composition | "Wide shot→mid shot" → first frame take "extreme wide shot" |
| **Transition effect** (black field fade in, dissolve transition) | Retain description but annotate as opening state | "Opening black field fade in" → "Frame emerges from black field, opening extreme wide shot..." |

**Judgment Basis**: Active verb tense and narrative density of the visual description.

> ❌ **Wrong approach**: Rewrite all actions to "about to happen" preparatory state, diluting action semantics
> - Storyboard table writes "stop to look up" → incorrectly rewritten as "about to raise head to look forward" (action weakened)
> - Storyboard table writes "cold sneer from above" → incorrectly rewritten as "mouth corner about to lift" (emotion weakened)
>
> ✅ **Correct approach**: Faithful to the storyboard table's action description, only take the starting end when the action is indeed a continuous process

---

## Parsing Mapping Rules

| Storyboard Field | Corresponding Prompt Handling |
|------------------|-------------------------------|
| Visual Description | **Backbone content**: Core information source for the prompt body【Visual】section. Must fully retain **all** visible subjects, spatial layers, key details, shot relationships from the visual description, only converting narrative language to visual description format. Strictly prohibited from deleting key elements, replacing with different semantics, or arbitrarily adding visual elements not present in the visual description |
| Scene | Integrate into【Visual】section as environmental anchoring, overlay scene texture constraint words from style-specific techniques |
| Shot Size | Shot framing word (see shot size vocabulary below), must match the storyboard table's「Shot Size」field. Composite shot sizes (e.g., "Wide shot→mid shot") take **first frame starting end** |
| Camera Movement | Only as storyboard production information, does not enter prompt, no camera movement notes output |
| Character Action | Based on the storyboard table's「Character Action」field, handled per "First Frame Identification Principle". Must retain action semantic connotation and explicit `｜Facing:` annotation |
| Emotion | Based on the storyboard table's「Emotion」field, select matching expression/eye words from the style-specific technique's emotion mapping table. Emotional tone must match the storyboard table |
| Lighting Atmosphere | Based on the storyboard table's「Lighting Atmosphere」field, **write as independent section**【Lighting】, fully retain light source direction, color tone tendency, light-dark relationship, texture details |
| Dialogue | Does not enter prompt, not output |
| Sound Effects | Does not enter prompt, not output |
| Associated Asset Name/ID | Only used for internal reference image binding, handled per "Image Asset Annotation Rules" |

---

## Shot Size Vocabulary (General)

| Shot Size Input | Mode B (Nanobanana) English Shot Word | Mode A (Seedream) Chinese Frame Word |
|----------------|---------------------------------------|--------------------------------------|
| Extreme wide shot / Extreme full shot | `extreme wide shot, establishing shot` | Extreme wide shot composition, full environment view, characters small in scene |
| Wide shot / Full shot | `wide shot, full shot, full body` | Full body in frame, wide shot composition, person-scene proportion coordinated |
| Mid shot | `medium shot, cowboy shot, knee shot` | Mid shot composition, character above knees in frame |
| Medium close-up | `medium close-up, upper body` | Medium close-up composition, upper body in frame, background blurred |
| Half body | `half body shot, bust shot` | Half body composition, above waist in frame, shallow depth of field |
| Close-up | `close-up, face focus` | Close-up composition, face or close-up detail magnified, background deeply blurred |
| Extreme close-up | `extreme close-up, macro detail` | Extreme close-up, extreme close-up detail, blurred background |
| Over-the-shoulder | `over the shoulder shot, two shot` | Over-the-shoulder composition, foreground character back blurred, distant character clear |

**Composite shot size handling**: If the storyboard table writes "Wide shot→mid shot", "Mid shot→close-up" and other camera movements, the storyboard image serves as first frame reference, **take the starting shot size on the left side of the arrow**.

---

## Output Format Specifications

Each storyboard **only outputs one mode's prompt body** (choose one), simultaneous output of both Mode A and Mode B for the same storyboard is not allowed.

**Mode Selection Rules**:

| Condition | Selected Mode |
|-----------|---------------|
| Target model is Seedream / Doubao series | Mode A (Chinese Prompt) |
| Target model is Nanobanana / Gemini series | Mode B (English JSON Prompt) |
| User did not specify model | Default Mode A, or ask user to confirm |
| Batch generation | Keep same mode throughout, no mid-process switching |

**Output Content Rules**:
- When selecting Mode A: Only output `[Prompt]` body (no negative prompt, Seedream does not support)
- When selecting Mode B: Only output `[JSON Prompt]` body (including `"negative"` field)
- In addition to the prompt body, the following content is not output by default: storyboard title, reference image binding explanation, dialogue notes, sound effect notes, constraint check, asset summary

---

## Prompt Structure Framework (Visual Description Priority)

### Structural General Rules

The prompt body adopts a **three-section structure**, ensuring the visual description occupies the backbone position:

```
【Visual】→ Carries the complete visual content from the storyboard table's「Visual Description」+「Scene」+「Shot Size」+「Character Action」+「Emotion」(backbone, highest information density)
【Lighting】→ Carries the light source, color tone, light-dark relationship from the storyboard table's「Lighting Atmosphere」(independent section, avoid being squeezed by style words)
【Style】→ Style anchoring words + image quality locking words + prohibition declarations (auxiliary modifier, brief)
```

> **Length allocation principle**: The 【Visual】 section is the highest information density and longest paragraph, must fully carry all visual elements from the storyboard table's「Visual Description」; 【Lighting】 is the second longest, independently carrying lighting atmosphere; 【Style】 is the shortest, only placing necessary style anchoring words and image quality locking words. The three sections' order cannot be reversed, length cannot be inverted — if style word length exceeds the visual section length, it is a failed output.

### Mode A: Seedream (API `reference_images`)

Mechanism: Reference images are passed through API parameter `reference_images`, use `@ImageN` in the prompt to directly bind reference images.

Prompt Structure:

```
@Image1 is {asset name}{asset type} @Image2 is {asset name}{asset type} ... ,

【Visual】{scene anchoring}, {shot size framing word}, {visual description complete transcription — retain all visual elements, spatial relationships, subject actions, facing, emotion}.

【Lighting】{light source direction}, {color tone tendency}, {light-dark relationship}, {texture details}.

【Style】{style anchoring word}, {image quality locking word}, prohibit off-frame subtitles, watermarks, UI text.

Keep @ImageN facial features, hairstyle, clothing completely consistent with the reference image.
```

**Key Rules**:
- 【Visual】section must fully carry all information from the storyboard table's「Visual Description」field, **no deletions**
- In the 【Visual】section, character/scene/prop names **must use `@ImageN` substitution** (not text names)
- Facing information must be explicitly written into the 【Visual】section (e.g., "3/4 front facing right")
- No longer append English section "Based on the reference image... Generate a new scene..."（`@ImageN` mechanism already handles reference image binding; appending an English section can cause duplicate and conflicting visual descriptions）

> `[Style anchoring word]`, `[Image quality locking word]` specific content is defined by **style-specific techniques**.

### Mode B: Nanobanana (Multimodal + JSON)

Mechanism: Reference image and prompt are input together as multimodal, prompt uses structured JSON to constrain character consistency.

Prompt Structure (fixed framework):

```json
{
  "role": "You are a cinematographer and storyboard artist. Maintain strict visual continuity across all shots.",
  "character_reference": [
    { "image": 1, "ref": "@Image1", "description": "[Key appearance description: hair color/hairstyle/clothing/body type]" },
    { "image": 2, "ref": "@Image2", "description": "[Key appearance description]" }
  ],
  "continuity_rules": [
    "Same wardrobe, hairstyle, face features across ALL shots",
    "Same environment, lighting style, color grade",
    "Only framing, angle, action, expression may change",
    "Do NOT introduce new characters not in reference images"
  ],
  "shot": {
    "scene_and_framing": "[Scene anchoring + shot size framing word]",
    "subject_and_action": "[Subject action + facing + emotion + all visual elements from visual description, use @ImageN to replace character/scene names]",
    "lighting": "[Light source direction + color tone + light-dark relationship + texture]",
    "style": "[Style anchoring word + image quality locking word]"
  },
  "negative": "[Negative prompt template, including no subtitles, no watermark, no UI text] (specific terms defined by style-specific techniques)"
}
```

**Key Rules**:
- The `shot` field is split into 4 sub-fields, forcing the visual description to occupy both `scene_and_framing` and `subject_and_action` positions exclusively, avoiding being squeezed by style words
- `subject_and_action` is the highest information density field, must fully carry the storyboard table's「Visual Description」+「Character Action」+「Emotion」
- Reference images are image input, not URL text
- Character description keeps 1-2 sentences of key features, avoid verbosity

---

## General Language and Quality Specifications

- Mode A (Seedream) prefers Chinese natural language paragraphs
- Mode B (Nanobanana) prefers English JSON structured prompts
- Prompts focus on "content expression + image quality sharpness", avoid vague terms
- Do not use expressions that cause blurry images (see「Image Quality Degradation Banned Words」table below)
- Mode B negative prompt follows the style-specific「Negative Prompt Template」, must be included for each entry, cannot be omitted; Mode A does not output negative prompt
- Image quality locking words follow the style-specific「Image Quality Locking Words」template, must be included for each entry

---

## Off-Frame Text vs On-Frame Text Rules

- **Off-frame text** (subtitles, watermark, title card, narration overlay, etc. UI layer overlay text) → **Absolutely prohibited**, must declare prohibition in the【Style】section and negative prompt
- **On-frame text** (text props naturally existing in the scene: character writing with a pen, handwriting on scrolls, plaques and signs, letter content, road signs, shop signs, etc.) → **Belongs to scene props**, when the visual description explicitly includes such content, should normally describe its existence in the【Visual】section, not restricted by the text prohibition rule
- **Judgment standard**: Whether the text exists **within the story world**. Text on a plaque = on-frame prop ✅; character dialogue at the bottom of the frame = off-frame subtitle ❌

---

## Image Quality Degradation Banned Words (Universal Across All Styles)

| Banned Writing | Model Behavior | Safe Alternative |
|----------------|----------------|------------------|
| `film grain` | Full frame adds noise, becomes blurry | `subtle cinematic texture` |
| `imperfect focus` / `out of focus` | Full frame out of focus | Delete directly |
| `edges not perfectly sharp` | Edges blurry | Delete directly |
| `slight natural deviation` | Overall resolution reduction | Delete directly |
| `not completely stable` | Frame blurry | Delete directly |
| `blurry background` (overuse) | Subject also blurry | `background bokeh, subject in sharp focus` |
| `hazy` / `foggy` (overuse) | Full frame fog effect | Only use when air perspective needed, simultaneously add `subject sharp` |
| `soft focus` / `dreamy effect` | Reduces overall sharpness | Delete directly |

> **Core principle**: Content can be "imperfect" (uneven lighting, asymmetrical composition), but image quality must be sharp.

---

## Batch Processing Specifications

When user inputs multiple rows of storyboard table:

1. **Process row by row in order**, no skipping, no merging
2. Each storyboard only outputs the target mode's prompt body (Prompt or JSON Prompt)
3. If multiple consecutive shots in the same scene, **scene texture words can be reused**, but emotion/lighting/shot size/action must be **independently processed per row**
4. Shots with the same associated asset name must use **consistent annotation wording**
5. Do not append any non-prompt blocks (such as asset reference summary, dialogue/sound effect notes, constraint check)

---

## Image Asset Annotation Rules

The `prompt` field of each storyboard must have the **image asset annotation** as prefix, and **use `@ImageN` directly in the prompt body to substitute the corresponding character/scene/prop name**, establishing a direct binding relationship between reference image and visual description. Annotation follows the reference order of assets in `associateAssetsIds`, starting from `@Image1` sequentially numbering.

**Format**: `@Image1 is {asset name}{asset type} @Image2 is {asset name}{asset type} ... , prompt text using @ImageN to replace character/scene names in the body`

**Type Mapping**:

| Asset type | Annotation Type Word |
|------------|---------------------|
| role       | character           |
| tool       | prop                |
| scene      | scene               |
| clip       | clip                |

**Rules**:
- Numbering starts from `@Image1`, incrementing sequentially by the `associateAssetsIds` array order
- Each referenced asset ID corresponds to one annotation item, **no omissions, no extras**
- Asset name uses the `name` field of that asset in the assets data
- Asset type filled according to the type mapping table above
- Annotation part and prompt body separated by `, `
- Derivative assets use their own `name` and the parent asset's `type`
- **Body binding (core)**: In the prompt body, all positions that would originally use character name/scene name/prop name **must be replaced with the corresponding `@ImageN` marker**, no longer using text names. This creates a direct reference relationship between the reference image and the visual subject in the frame, avoiding ambiguity caused by inconsistency between asset name and character name (e.g., when a derivative asset's name differs from the original character name, using `@ImageN` bypasses name ambiguity and directly points to the reference image)
- The same `@ImageN` can appear multiple times in the body (e.g., when a character is visible in both the foreground and reflective surface simultaneously)

**Example** (assuming `associateAssetsIds="[A, B, C]"` corresponds to Character Jia(role), Character Yi(role), A Scene(scene)):

❌ Wrong (body uses text names, disconnected from prefix annotation):
```
@Image1 is Character Jia character @Image2 is Character Yi character @Image3 is A Scene scene, Character Jia sneers coldly, looking down from above at kneeling Character Yi, pillar shadows deep in the scene...
```

✅ Correct (body uses @ImageN to directly bind reference images):
```
@Image1 is Character Jia character @Image2 is Character Yi character @Image3 is A Scene scene,

【Visual】Inside @Image3, mid shot composition, @Image1 stands tall on the left side of the frame, 3/4 side facing right, mouth corner slightly raised sneering coldly, looking down from above at @Image2 kneeling on the right side of the frame; @Image2 bends over prostrating, 3/4 back facing left, hands on the ground, shoulders and back tense...
```

---

## Character Position and Facing Consistency Rules

When generating each prompt, must follow these cross-storyboard character position and facing consistency constraints.

### One: Facing Retrieval Rules (Obtain Character Face Direction from Storyboard Table)

The storyboard table's「Character Action」field already includes explicit `｜Facing:` annotation, prompt generation should **directly prioritize extraction** and **explicitly write** the corresponding facing directional word in the prompt (such as `facing right` / `facing right`, `three-quarter view facing left` / `3/4 side facing left`).

**Retrieval Priority** (high→low):

| Priority | Clue Source | Handling Logic |
|----------|-------------|----------------|
| **1** | **Character Action field's `｜Facing:` annotation** | Storyboard table already explicitly annotated → **direct adoption**, no inference needed |
| 2 | **Explicit directional word in visual description** | Visual description directly mentions facing (such as "back to camera", "looking out the window", "facing the audience") → direct adoption (only when priority 1 is missing) |
| 3 | **Multi-character spatial relationship (180° viewing axis)** | Dialogue/confrontation/interaction scenes, two characters facing each other: frame-left character faces right, frame-right character faces left. Establish baseline on first appearance, lock for entire scene |
| 4 | **Shot size implication** | Over-the-shoulder shot: foreground character back/side-back to camera, distant character faces camera direction; close-up/medium close-up monologue: default 3/4 side |
| 5 | **Emotion and narrative semantics** | Loneliness/contemplation/memory → side profile or 3/4 back; confrontation/questioning → front or 3/4 front facing the other; avoidance/shyness → slightly turn head away from the other |
| 6 | **Scene spatial logic** | Greeting at door → face outward toward door; gazing at scenery → face scenery direction; leaning over writing → face desk looking down |

> **Normally only need to read priority 1**, the storyboard table has already annotated at the source. Priorities 2~6 serve only as fallback inference when the storyboard table annotation is missing.

**Retrieval Steps**:
1. Read the annotation content after `｜Facing:` in the current row's「Character Action」field
2. If the annotation exists and is complete → directly adopt, skip subsequent priorities
3. If the annotation is missing (such as empty shot row) → infer per priorities 2~6 one by one
4. Write the retrieved facing information into the prompt at the corresponding character's description position

**Facing Vocabulary**:

| Facing Type | Mode A (Chinese) | Mode B (English) | Applicable Scene |
|-------------|-----------------|------------------|------------------|
| Front | Front facing camera | facing camera, front view | Self-declaration, directly confronting audience gaze |
| 3/4 Front | 3/4 side slightly toward camera | three-quarter view facing camera | Dialogue subject, emotional conveyance |
| Full Side | Full side profile | profile view, side view | Monologue, contemplation, confrontation silhouette |
| 3/4 Back | 3/4 side back | three-quarter back view | Departure, detachment, memory |
| Back | Back to camera | back view, from behind | Mysterious entrance, farewell, gazing into distance |
| Facing Left | Facing frame left | facing left | 180° line right-side character, facing left target |
| Facing Right | Facing frame right | facing right | 180° line left-side character, facing right target |
| Slightly Looking Down | Slightly looking down | slightly looking down | Sadness, guilt, contemplation |
| Slightly Looking Up | Slightly looking up | slightly looking up | Arrogance, looking up, anticipation |

> Facing annotation must simultaneously include **horizontal facing** (facing left/right/camera) and **pitch tendency** (if any), such as "3/4 side facing right, slightly looking up".

### Two: Position and Facing Locking Rules

- **Frame position locking**: For the same character across multiple storyboards in the same scene, their left-right frame position (left side of frame / center / right side) must remain fixed, no unmotivated side jumping
- **Facing conservation**: Dialogue/confrontation scenes follow the 180° viewing axis — Character A facing right stays facing right throughout the scene, Character B facing left stays facing left throughout the scene; prompt must explicitly annotate through directional words (facing left / facing left, on the left side of frame / frame left, etc.)
- **Foreground-background layer consistency**: If Character A is in the foreground and Character B in the midground in storyboard N, their front-back relationship should not be unmotivatedly reversed in subsequent storyboards of the same scene
- **Position changes require action bridging**: When a character's frame position truly needs to change (such as character walking, turning), the preceding storyboard's prompt must include the corresponding displacement/turn action description, cannot jump positions without cause
- **Facing changes require action bridging**: When a character's facing truly needs to change (such as turning head, turning around), the current storyboard's prompt must include the turning action description (such as "slightly turn head toward frame left"), and the turn must be consistent with the storyboard table's「Character Action」field, cannot change facing without cause
- **Cross-scene reset allowed**: When switching to a completely new scene, frame positions and facing can be reassigned, but must remain consistent within the new scene

### Three: Reflective Surface Visual Relationships

When the frame contains reflective media (mirror, water surface, smooth metal, window glass, camera lens, etc.), must pay attention to the following rules:

- **Mirror flip**: The character's left-right facing in the reflective surface is opposite to the actual subject (entity facing right → mirror image facing left); the prompt must explicitly annotate the reflection direction relationship between the reflective body and the actual subject (such as "@Image1 facing right, @Image1 in the water reflection facing left")
- **Reflective surface does not change position baseline**: The character's frame position is based on the actual subject; the reflection in the reflective surface is not considered a character position change
- **Reflective surface content consistent with same-frame subject**: The character's clothing, hairstyle, expression, etc., visible in the reflective surface must match the same-frame subject, no deviation allowed
- **Reflective surface depth of field and clarity**: Depending on the reflective surface distance and material, the reflected image can appropriately reduce clarity (such as blurring caused by water surface ripples), but must annotate in the prompt (such as "water reflection slightly distorted")
- **Recognition trigger**: When the storyboard visual description or scene assets contain reflective elements such as mirrors, water surfaces, lakes, streams, glass, metal reflections, cameras/camcorders, this rule is automatically triggered

---

## Appendix: Complete Output Example

The following demonstrates the complete flow from input to output for one storyboard, for Agent reference. This example uses abstract placeholders (Character Jia, A Scene, Prop X, etc.), replace with the storyboard table's specific content in actual use.

### Input (A Row of Storyboard Table)

| Field | Content |
|-------|---------|
| Visual Description | Opening black field fade in, extreme wide shot of A Scene exit, crowd surging, conspicuous signpost stands on the right side of the frame, Character Jia carrying Prop X walks alone in the crowd, camera slowly pushes to mid shot, he grips Prop Y and suddenly stops to look up at the signpost, eyes tense yet determined |
| Scene | A Scene exit |
| Shot Size | Wide shot→mid shot |
| Character Action | Carrying backpack walking forward→suddenly stops→looks up at signpost→grips Prop Y slightly tightened｜Facing: 3/4 front facing right |
| Emotion | Nervous and determined coexisting |
| Lighting Atmosphere | Soft morning light from the left uniformly spreads, warm yellow base lightly stains the ground, signpost clearly lit, figures backlit slightly dark forming silhouette feel |
| Associated Asset IDs | [a, b, c, d] → Character Jia(role), Prop X(tool), Prop Y(tool), A Scene exit(scene) |

### Output (Mode A · Seedream)

```
@Image1 is Character Jia character @Image2 is Prop X prop @Image3 is Prop Y prop @Image4 is A Scene exit scene,

【Visual】@Image4, opening fades in from black field, extreme wide shot composition, crowd surging and flowing, on the right side of the frame stands a conspicuous signpost; @Image1 carrying @Image2 walks alone in the crowd, Prop Y tightly gripped in hand, body 3/4 front facing right, stops among the crowd, looks up at the signpost on the right side of the frame, eyes tense yet determined, expression nervous with resolve.

【Lighting】Soft morning light from the left uniformly spreads, warm yellow base lightly stains the ground, signpost brightly and clearly lit, surrounding figures backlit slightly dark forming silhouette contours, @Image1's figure half-lit half-backlit, facial contours slightly illuminated.

【Style】{style anchoring word}, {image quality locking word}, prohibit off-frame subtitles, watermarks, UI text.

Keep @Image1 facial features, hairstyle, clothing completely consistent with the reference image.
```

> The `{style anchoring word}` and `{image quality locking word}` in the【Style】section are provided by style-specific techniques (`director_storyboard`); this general specification does not hard-code specific terms.

### Verification Comparison

| Storyboard Table Field | Prompt Embodiment Location | Consistent |
|------------------------|---------------------------|------------|
| Opening black field fade in | 【Visual】"opening fades in from black field" | ✅ |
| A Scene exit | 【Visual】"@Image4" | ✅ |
| Extreme wide shot (first frame starting end) | 【Visual】"extreme wide shot composition" | ✅ |
| Crowd surging | 【Visual】"crowd surging and flowing" | ✅ |
| Signpost on the right | 【Visual】"on the right side of the frame stands a conspicuous signpost" | ✅ |
| Character Jia carrying Prop X walking alone | 【Visual】"@Image1 carrying @Image2 walks alone in the crowd" | ✅ |
| Gripping Prop Y | 【Visual】"Prop Y tightly gripped in hand" | ✅ |
| Stop and look up at signpost | 【Visual】"stops among the crowd, looks up at the signpost on the right side of the frame" | ✅ |
| Facing 3/4 front facing right | 【Visual】"body 3/4 front facing right" | ✅ |
| Tense yet determined | 【Visual】"eyes tense yet determined" | ✅ |
| Left side morning light + warm yellow base | 【Lighting】"Soft morning light from the left uniformly spreads, warm yellow base" | ✅ |
| Figures backlit silhouette | 【Lighting】"surrounding figures backlit slightly dark forming silhouette contours" | ✅ |

**Zero omissions, verification passed.**
