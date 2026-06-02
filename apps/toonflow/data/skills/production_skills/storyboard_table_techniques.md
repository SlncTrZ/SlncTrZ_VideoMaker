---
name: storyboard_table_techniques
description: >-
  General storyboard table technique reference.
  Covers storyboard splitting principles, establishing shot and shot merging rules, visual continuity iron laws, field writing guidelines, transition rules, and other general storyboard design techniques, for Agent activation use.
---
# General Storyboard Table Techniques

This document is a general technique reference for storyboard table design, applicable to all Agent scenarios requiring storyboard table construction.

---

## Storyboard Splitting Principles

**Start a new storyboard**: Scene/location switch, time jump, shot subject switch, obvious shot size change, important action node

**No need for new**: Continuous dialogue within the same frame, slight expression changes or small actions

Granularity: One independent frame = one storyboard, approximately every 50~100 words of script corresponds to 1~2 storyboards. Transitions with clear descriptions are also split separately.

---

## Establishing Shot and Shot Merging Rules (Anti-Redundancy)

**Establishing shot**: Each new scene/paragraph establishing requires at most 1~2 shots, prohibited from splitting into 3+ fragments.
- Recommended approach: 1 wide shot with slow push (establish + subject introduction in one shot), or 1 extreme wide shot establishing + 1 full shot introducing the subject
- Prohibited approach: redundant three-segment pattern of environment empty shot first → local details next → character arrival last

**Shot merge self-check**:
- Do not split into two shots if one can cover it — if a single shot with camera movement can simultaneously establish and introduce, do not split into two
- Shots continuously describing different parts of the same space (courtyard gate → vines → side rooms) should merge into one shot, using the visual description to cover multiple spatial layers
- Purely decorative shots (showing only environmental details without narrative progression) should merge into shots with narrative function
- **Director thinking check**: After writing, check — if a real director would combine 2~3 adjacent shots into one, the split is too fine and should be merged

**One-shot-through strategy**: When adjacent shots have **continuous action changes, mild scene changes (movement within the same scene), or gradual shooting angle changes**, you can annotate "one-shot-through" in `cameraMove` or `description`, merging multiple fragmented shots into one continuous long take.
- **Applicable scenes**: Character walking through space, following action from point A to point B, circling around character to show environment, establishing slow push to subject close-up, etc.
- **Annotation method**: Write the camera movement path in `cameraMove` (e.g., "one-shot-through: slow push wide shot → follow move into courtyard → settle to full shot"), describe the start and end frame content in `description`
- **Duration relaxation**: One-shot-through shots can exceed the single-shot 6s upper limit due to continuously updating information, but not exceed 12s
- **Risk note**: One-shot-through increases the difficulty of frame generation (high continuity requirement), only use when narrative fluency benefit clearly outweighs fragmented cutting, do not overuse

**Golden 6-second rule**: Non-dialogue shots accumulating over 6s without new information (dialogue/action/subject change) cause audience attention to break. Especially for establishing + transition type shots, prefer merging and compressing rather than dragging

---

## Visual Continuity Iron Laws (Observe Throughout Storyboard Design)

**① Action Continuity**: Character positions, action progress, and facing direction between adjacent shots must be physically and logically consistent. Previous shot hand reaches halfway → next shot must continue from halfway state, cannot suddenly retract.

**② Shot Size Progression Rule**: Shot size changes follow gradual focus or gradual release:
- Gradual focus: Wide shot → full shot → mid shot → medium close-up → close-up (emotional tightening)
- Gradual release: Close-up → medium close-up → mid shot → wide shot (emotional release)
- Prohibit continuous same shot size without narrative reason (3+ consecutive same shot size = visual fatigue)

**③ Viewing Axis Conservation**: 180-degree line principle — in dialogue/confrontation scenes, character frame positions remain fixed on the same side throughout, no axis jumping

**④ Facing Space Logic**: Dialogue both sides face each other, operating items face the item, gazing into distance face the distance. Prohibit indiscriminate facing the camera

**⑤ Information Control Awareness**: Each shot must be aware of "what the audience knows and doesn't know at this moment" —
- Showing hand not face = suspense; sound before picture = anticipation; only showing back = detachment; full reveal = climax payoff

**⑥ Beat Density Constraint**: Number of actions/events per shot must match duration, prevent stuffing too much content —
- 1 physical action = 1 beat, 1 camera movement = 1 beat, 1 short line of dialogue (≤10 chars) = 1 beat
- 2~3s shot: max 1 beat; 4~6s shot: max 2 beats; 7s+ shot: max 3 beats

**⑦ Head-Tail Safety Zone**: The first 0.5s and last 0.5s of each shot are safety transition zones, do not place key actions or dialogue start points. First 0.5s for environment establishment or subject static reveal, last 0.5s for natural action closure.

---

## Field Writing Guidelines

**description** (Visual Description): One sentence describing the core frame content (15~50 chars), including visible **subject + action/state + environment space**, no psychological activity. Must reflect spatial layering (foreground/midground/background at least two layers). E.g., "Foreground curtain gently sways, midground Hou Mansion carriage arrives at Luoyan Mountain abandoned courtyard", "Mother Cheng jumps off the carriage, surveys the dilapidated courtyard, distant mountains fade into dusk"

> **🚫 Prohibit lighting/tone descriptions**: description and all fields must **not** contain `light`/`shadow`/`color temperature`/`tone`/`warm color`/`cold color`/`backlight`/`bright-dark`/`high contrast` and similar lighting-related terms. Lighting is fully handled automatically by the scene asset image referenced by that shot — special lighting needs like night scene/rainy day/firelight should be expressed by referencing the corresponding **scene derivative** (Night Version/Rainy Day Version/Firelight Version). As in the example, the original text "under the afterglow" is also a violation and should be deleted.

**shotSize** (Shot Size):

| Shot Size | Description | Narrative Semantics |
|-----------|-------------|---------------------|
| Extreme Wide Shot | Full environment view | Establishing / Loneliness / Insignificance |
| Wide Shot | Scene and character relationship | Spatial relationship / Atmosphere rendering |
| Full Shot | Character full body with environment | Character entrance / Full body reveal |
| Mid Shot | Above knees | Daily narrative / Dialogue |
| Medium Close-Up | Above chest | Emotional conveyance / Dialogue focus |
| Close-Up | Face or object detail | Emotional intensification / Key prop |
| Extreme Close-Up | Extreme detail | Emotional nuke / Decisive moment (use sparingly, 2~3 times per entire film) |

**cameraMove** (Camera Movement): Fill `Static` when no camera movement. Camera movement must annotate start and end direction.

| Camera Movement | Description | Narrative Semantics |
|-----------------|-------------|---------------------|
| Push In | From far to near, emphasize subject | Emotional progression / Discovery / Peeking |
| Pull Out | From near to far, show environment | Emotional detachment / Reveal full picture / Farewell |
| Pan | Fixed position rotating sweep | Environment exposition / Searching |
| Track | Follow subject movement | Companionship / Tracking |
| Top-Down | From top to bottom | Observation / Insignificance / Overview |
| Low-Angle | From bottom to top | Heroization / Oppression |

**action** (Character Action): Specific action description of character/subject in the frame (5~40 chars), fill `Empty shot` when no character action. Format is `(Bridging description)Action description`. Requirements:
- **Bridging description at the beginning**: Enclosed in half-width parentheses, placed at the very front of the action description. First shot write `(Opening)`; other shots write `(Bridging from previous shot: bridging action)`, e.g., `(Bridging from previous shot: slow push settle ~ group freeze)`, `(Bridging from previous shot: arm half-raised state → continue raising)`
- **Action chain writing**: Write continuous physical action chain + speed/rhythm ("slowly raise right hand → fingertips tremble slightly → suddenly clench fist"), prohibit writing only static end state. Multiple characters' actions separated by `;`, ordered by associated asset name, e.g., `Li Wu's right hand rubs sleeve → left arm pulls rabbit plushie closer to chest; Nie Wei's gaze locks onto rabbit direction`
- **This column no longer writes facing/spatial relationship**: Facing and spatial relationship have been split into independent columns (`orientation` / `spatialRelation`), do not repeat annotation within action, avoid `|` conflict with markdown table column separators

**orientation** (Facing Direction): Independent column, character face direction annotation in the frame. Format:
- Multiple characters listed in `associateAssetsNames` order, separated by `;`: `Character A-3/4 front facing right;Character B-3/4 front facing left`
- Single character can omit character name: `Facing right`
- Empty shots and pure object close-ups fill `—`
- Facing must comply with 180° viewing axis rules (locked within the same scene, changes must provide turn/turn-head bridging action in `action` and synchronously update this column), specific values refer to the facing reference table below

**spatialRelation** (Spatial Relationship): Independent column, relative positioning of characters in multi-character frames. Format:
- Listed in `associateAssetsNames` order, separated by `、`: `Character A(position)、Character B(position)`
- Position values refer to the spatial relationship reference table below (9 positions)
- Single-character shots can fill one item `Character(position)` or fill `—`; pure object close-ups, empty shots fill `—`
- Must be self-consistent with facing, shot size, camera movement (a character facing right should have their gaze/interaction target on their right side); same scene same group character positions must be stable, movement must be given bridging actions in `action` and synchronously update this column

**Complete field example** (5-person group shot):
- `action`: `(Opening) Wide shot slowly pushes toward the group, five people stand loosely — Li Wu slightly left, left arm holds rabbit plushie; Nie Wei's gaze drawn to that white object`
- `orientation`: `Li Wu-3/4 front facing right;Nie Wei-3/4 front facing left;He Cunyu-3/4 front facing left;Qiu Tong-3/4 front facing left;Anna-front facing`
- `spatialRelation`: `Li Wu(Front-left)、Anna(Front-right)、Nie Wei(Back-left)、He Cunyu(Mid-back)、Qiu Tong(Back-right)`

**Facing Reference Table** (for orientation column):

| Facing Value | Meaning | Typical Scene |
|--------------|---------|---------------|
| Facing right | Horizontally facing frame right | 180° line left-side character, facing right target |
| Facing left | Horizontally facing frame left | 180° line right-side character, facing left target |
| Front | Facing camera directly | Monologue, declaration, looking at viewers |
| 3/4 front facing right | 3/4 side slightly right toward camera | Dialogue subject (frame-left character) |
| 3/4 front facing left | 3/4 side slightly left toward camera | Dialogue subject (frame-right character) |
| Full side facing right | Full side profile toward right | Monologue, contemplation |
| Full side facing left | Full side profile toward left | Monologue, contemplation |
| 3/4 back facing right | 3/4 back side slightly right | Detachment, departure |
| 3/4 back facing left | 3/4 back side slightly left | Detachment, departure |
| Back | Back to camera | Mysterious entrance, farewell, gazing into distance |

> Can stack pitch modifiers: `Facing right slightly looking up`, `3/4 front facing left slightly looking down`.

**Spatial Relationship Reference Table** (for spatialRelation column, mandatory for multi-character scenes):

The frame is divided into a 3×3 position grid of "left/center/right" columns × "front/mid/back" layers, front = near camera/foreground layer, back = far from camera/background layer; front/back can also express height difference (e.g., overlooking the kneeling person occupies「Mid-front」, standing pressuring person occupies「Mid-back」).

| Position Value | Meaning | Typical Usage |
|----------------|---------|---------------|
| Front-left | Left side of frame, near camera | Subject positioned left foreground, often as dominant speaker |
| Front-center | Center of frame, near camera | Single subject centered, character partially blocked by foreground half-body |
| Front-right | Right side of frame, near camera | Subject positioned right foreground |
| Mid-left | Left side of frame, midground layer | Group middle section left position |
| Mid-center | Center of frame, midground layer | Core subject centered, dialogue dominant |
| Mid-right | Right side of frame, midground layer | Group middle section right position |
| Back-left | Left side of frame, back (background) | Back row left position, companion |
| Back-center | Center of frame, back | Back row centered, blocked by foreground or occupying high position |
| Back-right | Right side of frame, back | Back row right position, observer |

**emotion** (Emotion): Emotional tone conveyed by the frame (2~10 chars), described with concrete perceptible terms. E.g., "Cold arrognat contempt", "Painful despair", "Tense oppressive". Prohibit generic terms like "Happy", "Sad".

**scene**: The scene name where this storyboard is located, corresponding to the scene in the script

**associateAssetsNames**: List of **visible** asset names in the frame (including characters partially appearing characters/objects), for intuitive identification of associated content

**duration**: Basic reference — close-up/expression 2~3s · dialogue medium close-up 3~5s · full body reveal 3~5s · action 2~4s · wide shot/empty shot/transition 3~5s · complex scene 5~8s. **Single shot not exceeding 8s**, exceeding requires splitting.

**When containing dialogue, duration must be sufficient to speak all lines and match emotional speech rate**:

| Emotional State | Speech Rate Reference | Example Scene |
|-----------------|----------------------|---------------|
| Anger, urgent, arguing | ~4 chars/s | Scolding, urging, panicking |
| Normal dialogue, narration | ~3 chars/s | Daily conversation, calm statement |
| Sadness, deep emotion, contemplation | ~2 chars/s | Confession, mourning, memory |
| Whisper, weak, dying | ~2 chars/s | Weak voice, ear whisper |

Calculation method: Dialogue word count ÷ corresponding speech rate (round up) = base seconds, then add pause margin:
- Each punctuation pause in dialogue (comma, period, ellipsis, dash, etc.) +0.3~0.5s
- Emotional turn/tone change point +0.5s
- Final `duration` = base seconds + accumulated pauses + 1s safety margin (round up)

**lines**: Character dialogue original text, **must be copied verbatim from the script**. Multiple characters arranged in `Character Name: Dialogue` format. No dialogue fill `No dialogue`. One dialogue line corresponds to one shot, avoid stuffing multiple characters' multiple rounds of dialogue in a single shot.

**sound** (Sound Effects): Pure sound effect description, layered by «ambient sound layer + action sound layer». E.g., "distant wind howling + sword clanging sound". No sound effects fill `No sound effects`.

> **🚫 Strictly prohibit music/soundtrack**: This pipeline's final product **contains absolutely no background music**. The `Sound Effects` column only carries real sound sources (ambient sounds + action sounds + foley); any "BGM", "soundtrack", "melody", "orchestra/piano/harp/flute as atmosphere enhancement" text is **a violation** and will be judged as a serious issue during review. If the script involves instrument playing as plot action (e.g., character playing piano), only write specific physical sound sources like "fingertip plucking metal vibration sound + resonance box hum".

**associateAssetsIds**: IDs of **visible** assets in the frame (actual `id` field values obtained from assets data), do not fabricate non-existent IDs.
- **Character present = reference**: All characters appearing in the frame, whether as subject or only partially visible (such as back view, hand, blurred silhouette, etc.), as long as identifiable within the frame, must reference their corresponding asset ID
- **Scene asset required**: Each storyboard must reference the scene asset ID (type `scene`) corresponding to its setting; if a derivative scene asset matching the current frame state exists for that scene, use the derivative scene asset ID, otherwise use the main scene asset ID. Missing scene asset ID is considered incomplete field
- **Parent/derivative asset selection rule**: Select asset ID based on the plot frame's required state — if the shot requires a derivative state of a main asset, **only use the derivative asset ID**; only select the main asset ID when no matching derivative state exists; same parent asset must not appear in both parent and derivative form simultaneously within the same storyboard

---

## Transition Rules

- **Within same scene**: Default hard cut between shots
- **Across scenes**: Insert 1 empty shot storyboard (2~3s) for emotional buffer, empty shot content related to the atmosphere of surrounding scenes
- **Across paragraphs**: Can annotate "dissolve transition" or "fade in/fade out" in description
- Prohibit fancy transitions (wipe, rotate, venetian blind, etc.)
