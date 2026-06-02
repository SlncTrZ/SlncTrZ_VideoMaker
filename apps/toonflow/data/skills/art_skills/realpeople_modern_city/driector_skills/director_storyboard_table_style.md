---
name: liveaction_urban_storyboard_table
description: Storyboard table live-action urban constraints — defines the lighting and atmosphere specifications,cinematographytexture, action rhythm, environmental dynamics, camera movement and transitiontaboo/prohibition for live-action urban style in storyboard tables, with deep adaptation for Seedance 2.0. Applicable to any urban narrative type.
metaData: director_skills, seedance2.0_adapted
---

# Storyboard Table Live-Action Urban Constraints · Live-Action Urban · Technique Reference

---

## I. Storyboard Table Positioning

The storyboard table is the director's core tool for transforming script into camera language. These constraints areoriented for Seedance 2.0 video generation, using concrete, model-executable language for all lighting, action, and spatial descriptions. No abstract emotionalgeneral, no render parameters the model cannot understand.

---

## II. Seedance 2.0 Description Iron Rules

> All descriptions in the live-action urban storyboard table must follow the following translation principle — translate "director's intent" into "AI-executable physical instructions."

| Prohibited Abstract Expression | Seedance 2.0 Concrete Replacement |
|---|---|
| She is sad | Eyes and brows lowered, unfocused gaze toward the ground, corners of mouth naturally downturned, right hand unconsciously rubbing left wrist |
| The sunlight is nice | Afternoon sunlight entering at 45° from the left window (about 4500K warm white), projecting rectangular window frame shadows on the floor |
| The street is lively | Storefront warm yellow lights all on (about 3000K), five pedestrians slowly walking along the pedestrian street, one pushing a stroller |
| He turns and leaves | Slowly rotating about 90° to the right, facing the right side of the frame, right foot steps out about 0.6m first, left foot follows, entire process about 2 seconds |
| The atmosphere is oppressive | Side hard window light (cool white about 5000K) single source at an angle, rest of room deep dark but with faintoutline visible, light ratio about 1:8 |
| Wind blows the curtain | White gauze curtain billowed about 15cm by wind from outside the window, then falls back, repeating in cycles of about 2 seconds |

---

## III. Lighting & Atmosphere — Seedance 2.0 Physical Light Source Description

### 3.1 Lighting Consistency Within Same Scene

A scene should not have more than two core lighting schemes unless there is a narrative-driven light source change (e.g., someone turns on a desk lamp, daylight after sunrise exceeds indoor lights, walking from indoors to outdoors). Light source changes must be annotated in the storyboard table with triggering events.

### 3.2 Light Source Syntax (must be included in every shot)
[Light] Key Light: {light source type}, {direction}, {color temperature K}, {hardness/softness}
[Light] Fill/Ambient Light: {light source type}, {direction}, {color temperature K}
[Ratio] About 1:{X}
### 3.3 Emotion → Light Source Matrix

| Emotion | Light Recipe (directlyfill in Seedance 2.0) | Visual Keywords |
|---|---|---|
| Workplace Restraint | Window cool white key light (5000-5500K) from floor-to-ceiling window side, screen cool light (6500K) filling face. Ratio about 1:3 | Neutral-cool, clear materials |
| Daily Relaxation | Large-area window light diffusion (5000K), softened by curtains. Ratio about 1:1.5 low contrast | Clear, low contrast, healing |
| Warm Intimacy | Desk lamp warm key light (2800-3200K), shadowsretain objectoutline. Ratio about 1:4 | Warmenvelop, intimate |
| Street Life | Mixed light sources — sodium lamp streetlights warm yellow (2000-2200K) primary, store cool white (4000K)partial contrast. Ratio about 1:5 | Warm primary, lively |
| Rainy Night Solitude | Wet road reflecting streetlight warm yellow patches (2800K), ambient cool tone (6000K sky diffusion), rain streaks on window glass scattering. Ratio about 1:6 | Cool-warm coexistence, poetic solitude |
| Suspense Tension | Side hard window light (cool white 5000K) single source, large ratio about 1:8, shadows deep but with faintoutline. Ratio about 1:8 | Oppressive, uncertain |
| Healing Rebirth | Abundant natural light diffusion (5000-5500K), sky light + ground reflection fill. Ratio about 1:1.5 | High-key clear, hope |
| Late Night Vulnerability | Single warm source — desk lamp/window streetlight (2800-3200K) forming island lighting, one side of face bright, one side dark. Ratio about 1:8 | Minimal light source, intimate vulnerability |

### 3.4 Cool-Warm Tones & Narrative Stages

- **Cool light dominant** (5000K+): Workplace restraint, suspense tension, cool solitude, rainy night
- **Warm light dominant** (2000-3500K): Warm intimacy, street life, home daily, golden hour
- **Cool-warm coexistence**: Transition moments (blue hour + first warm lights), rainy night (cool environment + warm patches)
- **Light source change = narrative signal**: Window sky from cool white to warm gold sunset = passage of time; Office cool white to street warm yellow streetlight = scene and emotional shift

### 3.5 Seedance 2.0 Lighting Adaptation Points

- Color temperature numbers help the model calibrate white balancetendency: `color temperature about 3200K` is better than `warm light`
- Light ratio numbers help the model establish light-dark awareness: `light ratio about 1:4` is better than `soft shadows`
- Light source must haveclear source: `entering at 45° from the left window` is better than `side light`
- Ambient light reflection path description: `wet road reflecting streetlight warm yellow patches` is better than `ground has warm reflection`

---

## IV. Environmental Dynamics — Let the Image Breathe

### 4.1 Dynamic Density

Every 3-4 shots, arrange at least one shot with environmental dynamics. Even static dialogue scenes are no exception — at least in one shot, leaves outside the window are moving, steam from a coffee cup is rising, or curtains are stirred by breeze.

### 4.2 Urban Environmental Dynamic Elements (Seedance 2.0 Executable)

| Scene | Describable Environmental Dynamics |
|---|---|
| Indoor | Curtains gently billowed about 10cm by breeze then fall back (about 2-second cycle), steam slowly rising from coffee cup, small insects occasionally flying through desk lamp range, car lights from outside occasionally sweeping across ceiling |
| Street | Street tree leaves rustling and swaying, distant pedestrians waiting at crosswalk then walking by, bicycle slowly riding through mid-ground, accumulated water on roadside rippling when wheels pass |
| Café/Restaurant | Coffee machine steam rising, light and shadow at window seats changing brightness as clouds move outside, bartender wiping cups in repeated motion, wind chimes at door ringing when pushed open |
| Office | Blind stripe shadows slowly moving as outdoor light angle changes, computer screensaver switching, water cooler occasionally making gurgling bubble sounds, printerspit out paper |
| Late Night Venue | Convenience store automatic door repeatedly opening and closing, traffic light projecting alternating red/green shadows on sidewalk, occasional distant car headlights sweeping a band of light across ceiling |
| Rooftop | Clothes on drying line being blown by wind, distant city skyline lights occasionally turning on or off, clouds slowly moving across the sky |

### 4.3 Seedance 2.0 Environmental Dynamic Description Standards

- Dynamics must have specific trajectory and speed: `leaves blown by wind, about 2-3 slight sways per second` is better than `tree is moving`
- Light dynamics must be consistent with spatial light source logic: `when clouds cover the sun, indoor window light area shrinks about 40%, lasting about 3 seconds thenrecovery`
- Prohibit dynamics without source: no wind = curtains don't move. Indoor windows not open = no wind

---

## V. Character Action Rhythm — Seedance 2.0 Physical Logic Concrete Representation

### 5.1 Action Description Iron Rules

All character actions must describe: **trajectory + speed/duration + body part coordination + impact on surrounding objects**.

### 5.2 Daily Action Concrete Library

| Action | Seedance 2.0 Executable Description |
|---|---|
| Stand up | Both hands pressing chair armrests, knees moving forward, after 0.5s body center of gravity shifts to feet, then 1s later standing straight — entire process about 2s, pause about 0.5s after standing |
| Turn head | Head slowly rotating about 30° to the right, gaze moving from desktop files to out the window, rotation process about 1s, after in position gaze pauses in the distance about 1s |
| Drink coffee | Right hand holding cup handle, cupapproach lips, tilting cup about 15°, liquid touching upper lip, small sip about 1s, cup lowering back to original position about 1s |
| Walk to window | Stand up from office chair (about 2s), walk towards the right side floor-to-ceiling window at constant speed about 4 steps (about 3m distance, takes about 3s), stop about 0.5m from window |
| Sit down | Lean forward slightly bend knees, buttockscontact seat surface, pressing down about 2cm (spring/foam deformation), back naturally leaning toward chair back — entire process about 1.5s |
| Put down item | Right hand holding coffee cup lowering from chest height to desktop, cup bottomcontact wooddesktop producing slightcollide sound, fingers releasing from cup handle — entire process about 1s |
| Push door enter | Right hand holding door handle turning down about 30°, pushing door inward about 70°, body following door in, right foot stepping over threshold first — entire process about 2s |
| Look at phone | Right hand picking up phone from desktop (about 15cm long), thumb clicking screen bottom to wake, screen cool light illuminating right side of face, eyes slightly squinting focusing on screen — entire process about 3s |
| Put on jacket | Right handentering right sleeve, left hand reaching backentering left sleeve, both shoulders slightly extending back to let jacket fit over shoulders, collar naturally flipping out — entire process about 4s |
| Hug | A stepping forward about 0.5m, armssurrounding B's shoulders and back, hands lightly overlapping on B's back, faceapproach B's ear side, holding for about 3s |

### 5.3 Action Rhythm & Narrative Scene

- **Daily Narrative/Dialogue Scenes**: Actionscalm and steady restrained, each micro-action annotated with duration and trajectory. Rhythms slow — not slow, but "not rushed"
- **Emotional Fluctuation Scenes**: Action range and speed slightly increased. Character may unconsciously increase frequency of fingers tapping the table during dialogue, breathing causing more noticeable shoulder rise and fall
- **Conflict Scenes**: Actions crisp and clean, but still have physical trajectory. Hits/showing must be specific to "right hand pushing onthe other left shoulder front,the other center of gravity shifting backward about 20cm"
- Prohibit: Rapid action stacking without narrative reason, teleportation without physical logic, vague descriptions like "made a gesture"

### 5.4 Clothing Dynamics

Live-action clothing dynamics are natural assets of the image — not "fabric simulation parameters," but "trench coat hem blown up about 20° by wind," "scarf end slipping off one shoulder," "skirt hem swaying about 10cm with each step." Annotate clothing dynamic details in storyboard table scene descriptions.

---

## VI. Spatial Logic Concrete Representation — Seedance 2.0 Spatial Coordinate System

### 6.1 Spatial Information Must Be Declared Per Shot
Horizontal position: Left/center/right of frame, or left third of frame
Depth position: {value} meters from camera, foreground/mid-ground/background
Character relationship to scene: {value} meters from {fixed object}
(If more than two people) Relative distance and facing direction of Character A and B
### 6.2 Position Connectivity Example
【Segment A End】
A standing in front of floor-to-ceiling window, about 0.5m from window, facing outside, positioned center-right of frame, about 4m from camera.
Outside the window is afternoon city skyline, sunlight entering at an angle from the right window.
A holds a coffee cup in right hand at chest height, cup about 15cm from lips.

【Segment B Start】
A's coffee cup just lowered about 10cm from lips, cup still at chest position. A still standing at the floor-to-ceiling window (position unchanged).
Outside the window, the sky has turned to blue hour — sky deep blue-purple, city building contour lights and streetlights already on.
Indoor desk lamp already on (side table on left side of frame), warm yellow light (about 3000K) illuminating A's left cheek.
### 6.3 Spatial Changes Must Be Concrete

| Abstract (Prohibited) | Seedance 2.0 Concrete |
|---|---|
| She walked closer | A walks from the background of the frame (about 5m from camera, door frame position) toward the camera at constant speed for 4 steps (about 3m), stopping about 2m from camera — takes about 4s |
| The two face each other | A positioned center-left of frame (about 3m from camera), B positioned center-right (about 3m from camera), facing each other, about 0.8m apart |
| From indoor to outdoor | A walks from indoors (about 3m from camera) toward door, pushes door open (door rotates inward about 80°), right foot steps over threshold, entering outdoor street — outdoor streetlight warm yellow light instantly replacing indoor cool white fluorescent light |

---

## VII. Camera Movement Standards — Seedance 2.0 Camera Motion

### 7.1 Permitted Camera Movements

| Movement | Seedance 2.0 Description | Applicable Scenarios |
|---|---|---|
| Fixed | Camerapinstillness of, framestillness | Dialogue, daily, empty shot pause, emotional gaze |
| Handheld Slight Shake | Camera has slight irregular shaking (range about ±2cm), simulating handheld breathing feel | Emotional fluctuation, street walking, intimate following, subjective perspective |
| Gimbal Flow | Camera smoothuniform speed movement, no shaking | Urban wandering, character entrance, spatialdisplay, transitions |
| Slow Push | Camera slowly pushing toward subject, push rate about 0.3m per second | Emotionalrising warm, truth approaching, attention focusing |
| Slow Pull | Camera slowly pulling back, pull rate about 0.3m per second | Farewell, closing, revealing the full picture |
| Tracking | Camera maintaining about 2m distance from character, moving synchronously | Walking following, urban tracking |
| Pan/Tilt | Camera rotating horizontally/vertically in place | Gaze shift, spatial relationship establishment |

### 7.2 Prohibited Camera Movements

- Quick whip pans, fast push/pull without narrative purpose (push/pull rate exceeding 1m per second)
- Severe handheld shaking exceeding 3 seconds (unless subjective impact/dizziness narrative)
- Illogical fancy transitions — swipe, rotate, blinds, page flip and otherspecial effects transitions
- Unjustified 360° camera rotation

### 7.3 Live-Action Urban Camera Philosophy

- Fixed position is the first choice — let the audience see real people naturally existing in real spaces
- Handheld slight shake used in emotionalsegment — but shake rangedo not exceedconventional documentary style
- The start and end of moving shots must be steady, motionuniform speed — prohibit sudden acceleration or abrupt stop

---

## VIII. Transition Standards

### 8.1 Permitted Transition Methods

| Transition | Visual Execution | Narrative Function |
|---|---|---|
| Hard Cut | Direct switch | Shotswitching within same scene (default) |
| Light-Matched Transition | Two scenes switching under similar lighting logic | Passage of time, parallel narrative. Example: morning light outside A's window → morning light outside B's window |
| Space-Matched Transition | Two spacesecho in composition or elements | Scene jump. Example: office door closing → apartment door opening |
| Empty Shot Transition | Insert scene empty shot (3-5s) | Emotional buffer, chapter division, time passageimply |
| Focus Transition | Previous shot focus shifts from subject to background, next shot graduallyfocus on subject from blurred background | Spaceswitching, attention shift |

### 8.2 Prohibited Transitions

- Pure visualspecial effects transitions (page flip, swipe, blinds, mosaic)
- Rotation/zoom transitions without narrative logic
- Using more than two transition methods within the same scene

---

## IX. Audio-Visual Synchronization Planning (Seedance 2.0 Exclusive)

### 9.1 Ambient Sound Annotation Standards

Each scene annotates 1-2 core ambient sounds, written in the storyboard table's ambient sound column:

| Scene | Suggested Ambient Sound |
|---|---|
| Office | Keyboard clicks / Air conditioner low hum / Distant printer |
| Café | Coffee machine steam / Light clinking of cups / Faint background voices |
| Street Daytime | Traffic tire noise / Distant voices / Street tree leaves rustling in wind |
| Street Rainy Night | Rain hitting car windows and road / Occasional passing car splashing water |
| Home Night | Refrigerator low-frequency hum / Occasional passing car outside / Clock ticking |
| Rooftop | Wind sound / Distant city faint hum |
| Subway Station | Arrival announcement and brake sound / Footsteps ofcrowd flow |

### 9.2 Audio-Visual Sync Annotation

Annotate key audio-visual sync points in the storyboard table:
- `t=2s` Light sound of coffee cup bottom touching desktop when put down
- `t=5s` Slight hinge creak when door pushed open — character entering indoors, outdoor street sound instantly muted when door closes
- `t=8s` Distant ambulance siren from outside window — character lifts head to look out window for about 1s

---

## X. Seedance 2.0 Storyboard Card Template

Each shot uses the following card format, filled shot by shot in the storyboard table:
【Shot X】Duration: {value}s | Shot Size: {extreme close-up/close-up/medium close-up/medium shot/full shot/wide full shot/empty shot}

Scene Description:
{Character action — including specific action trajectory, duration, body part coordination}
{Character expression — including eye direction, micro-expression details}
{Lighting logic — key light type + direction + color temperature K + light ratio}
{Environmental details — including specific props, material surfaces, use traces}
{Clothing dynamics — if wind-blown/action-related clothingexpression}

Spatial Coordinates:
Horizontal {left/center/right of frame, specific distance from edge} | Depth {value meters from camera}
{Distance and relationship to scene fixed objects}
{If more than two people, relative distance and facing direction}

Camera Movement: {fixed/handheld slight shake/slow push/slow pull/tracking/pan-tilt}
{Specific movement rate and start/end positions}

Transition: {hard cut/empty shot/light-match/space-match — annotate connectivity point between previous and next shot}

Ambient Sound: {Core ambient sounds 1-2}

Seedance 2.0 Key Anchor:
Character Anchor: @ImageX_{Character Name} {Appearance description}
Scene Anchor: @ImageX {Scene Name} {Space description}
{Prop Anchor: @ImageX {Prop Name} — if there is acore handheld/interactive prop}
---

## XI. Empty Shot Usage Standards

### 11.1 Empty Shot is NOT "Nothing to Shoot"

An empty shot is a vessel for emotion. Every empty shot must have a narrative purpose and specific visual content:

| Empty Shot Type | Narrative Purpose | Example |
|---|---|---|
| Scene Establishment | New space appearing for the first time — let the audience see clearly what place this is | Office wide shot: workstation arrangement, floor-to-ceiling windows, city outside windows |
| Emotional Buffer | Breather after high-emotionsegment | Raindrops sliding down the window glass outside, speed about 2cm per second |
| Time Passage | Implying time has passed | Sky outside the same window shifting from afternoon blue to blue-hour deep purple |
| Metaphorical Pause | Using objects to convey emotion | Half-drunk coffee cup on the table, lipstick mark on the rim |
| Transition Connection | Natural transition between two spaces | Fluorescent light tube in the stairwell — previous scene office, next scene rooftop |

### 11.2 Empty Shot Seedance 2.0 Description Standards

Empty shots must also follow the lighting + texture + dynamics description iron rules: Afternoon window light entering from the right at an angle (about 4500K), projecting blind stripe light patches on the empty meeting table, the patches slowly changing in width and position as clouds move outside the window, after about 5 seconds completely darkening — a cloud blocking the sun. The tabletop hassubtle scratches and cup ring marks from meetings.

---

## XII. Storyboard Table Quality Self-Checklist

After completing the storyboard table for each scene, the director checks item by item:

| Check Item | Pass Standard |
|---|---|
| Light Source Traceable | Every shot can answer "where the light comes from, what color temperature" |
| Action Executable | Every action has trajectory, duration, body part |
| Space Locatable | Every shot annotates the character's horizontal and depth positions |
| Position Connection | Same character's position/posturetransition across adjacent shots |
| Environmental Dynamics | Every 3-4 shots at least 1 with environmental dynamics |
| Language Not Vague | No unexecutable descriptions like "she is beautiful," "atmosphere is nice" |
| CG Terminology Zero | No PBR/SSR/AO/volumetric light/next-gen and other CG vocabulary |
| @reference Complete | Character/scene/core props all annotated with anchor references |
