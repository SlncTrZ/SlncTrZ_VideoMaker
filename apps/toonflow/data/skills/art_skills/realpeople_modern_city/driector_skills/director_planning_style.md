---
name: director_planning_liveaction_urban
description: Live-Action Urban constraints — defines the global constraints on tone system, lighting schemes, texture direction, scene spatial elements, music selection, and ambient sound for the live-action urban style, with deep adaptation for Seedance 2.0. Applicable to any narrative type.
metaData: director_skills, seedance2.0_adapted
---

# Live-Action Urban Constraints · Live-Action Urban · Technique Reference

---

## I. Tone System & Image Baseline

- **Tone Base** — The entire film uses Urban White (#F5F2EC), Mist Gray (#9EA2A8), Navy (#2D3A4A) as base colors. Overall color temperature split between daytime neutral-warm (5000-5800K) and nighttime cool-warm coexistence (warm streetlight 2800-3200K + cool ambient 6000-8000K). Saturation medium-low (35-55%), presenting a "cinematic but not filtered" restrained urban tone — colors come from actual light sources, not from post-production grading
- **Light Source is Palette** — Not pairing "main color/accent color," but drivingimage color through light source color temperature and direction. Morning light 3500-4500K (warm white), noon 5500-6500K (cool white clear), golden hour 2800-3500K (warm gold), blue hour 8000-10000K (deep blue-purple), sodium streetlight 2000-2200K (warm orange-yellow), convenience store fluorescent 4000-5000K (cool white)
- **Cool-Warm Narrativecomparison** — Warm light (morning light/afternoon glow/desk lamp/sodium streetlight) for warmth, healing, intimacy, street lifesegment; cool light (noon daylight/overcast diffusion/blue hour/fluorescent) for restraint, detachment, solitude, suspensesegment. Key transitions can use light source color temperature change toimply emotional shift
- **Light First Principle** — Insegment planning, firstdetermine/confirm "where the light comes from, what color temperature," thendetermine/confirm theimage tone. Avoid "this shot has nice colors but the light source doesn't make sense"
- **Prohibited Color Range** — High saturation fluorescent colors, cheap filter grading (such as teal-orange preset/sepia preset), CG neoncolor overflow, abnormal color cast from non-real light sources

---

## II. Lighting Scheme System

- **Lighting is Narrative** — 7 lighting schemescorresponding different emotionalsegment. In the director planning phase, determine the lighting baseline direction at thesegment level, rather than specifying shot by shot. Each scheme must specify "light source + color temperature + light ratio," ensuring it can be physically simulated by Seedance 2.0
- **Live-Action Photography Lighting Characteristics** — Natural light window orchestration, practical light sources (desk lamp/streetlight/screen/neon/car light), environmental reflection (wet ground/glass curtain wall/water surface), handheld camera slight shake breathing feel, depth of field change guiding attention — core lighting techniques of the live-action urban style

| Scheme | Name | Light Recipe | Ratio | Applicable Emotion |
|---|---|---|---|---|
| A | Urban Gilded | Sunset window light 45° side entry (3000-3500K) + ambient fill (sky reflection 5500K) | 1:3 moderate contrast | Highlight moments, elite occasions, warm memories, important meetings |
| B | Daytime Clear | Large-area window light/skylight diffusion (5000-5500K), no hard shadows, curtain softened | 1:1.5 low contrast | Daily relaxation, urban wandering, healing fresh, office daytime |
| C | Warm Glow | Desk lamp/pendant/sodium streetlight warm main light (2800-3200K), shadowsretain detail | 1:4 warmenvelop | Home daily, street life, warm rhythm, late night intimacy |
| D | Cool Sharp Shadow | Side hard light (window cool white 5000K or streetlight cool tone) + deep shadows | 1:8 large ratio | Urban suspense, confrontation conflict, cool oppression, high pressure moments |
| E | Indoor Diffusion | Window light natural diffusion (4500-5500K) + indoor ceiling/screen cool light filling face, shadows soft | 1:2 soft transition | Indoor daytime, workplace office, solitude contemplation, healing tranquility |
| F | Rainy Night Glow | Wet ground reflecting streetlight (warm 2800K patches + cool 6000K ambient), rain streaks on window scattering light | 1:6 cool-warm coexistence | Rainy night solitary walk, longing solitude, artistic melancholy, suspenseforeshadowing |
| G | Blue Hour Poem | 20 minutes after sunset sky diffusion (8000-10000K deep blue-purple) + first lit artificial warm dots | 1:5 cool main warm dots | Transition moments, inner monologue, poetic pause, closing |

- **Cool-Warm Light Distribution** — Warm light (morning light/afternoon glow/desk lamp/sodium streetlight) suitable for warm healing, elite highlight, street lifesegment; cool light (noon daylight/overcast diffusion/blue hour/fluorescent) suitable for restrained detachment, suspense confrontation, cool solitudesegment. Cool-warm switching point = narrativeturn/twist point 
- **Atmosphere Direction Mapping** — Each scene's atmosphere direction should be able to map to one of the above lighting schemes (A-G). If narration requires mixed schemes (e.g., F+G), the dominant light source must beclear
- **Seedance 2.0 Lighting Adaptation Points**: Light source names understandable by AI ("sunset window light" better than "warm volumetric light"). Light ratio numbers help model establish light-dark awareness. Multi-light source scenes mustclear key + fill + ambientlayer hierarchy

---

## III. Texture Direction — Real World Before the Camera

> The only standard for live-action urban texture: material behavior captured by the camera, not material parameters generated by a render engine.

- **Skin Texture** — Pores visible, natural oil reflection in T-zone, natural redness on cheekbones, slight darkness around eyes — evidence of real skin "being alive." Seedance 2.0 prompt words: "visible skin pores, natural skin texture, not airbrushed, real skin texture" replace 3D project's "subsurface scattering/SSS"
- **Hair Texture** — Flyaway strands naturally scattered on forehead and nape, strands having natural aggregation and separation, hair edges appearing as translucent warmoutline under backlight, natural state when blown by wind or wet. Seedance 2.0 uses "flyaway hair strands, natural hair movement, backlit hair rim light" to replace "physics-level hair simulation"
- **Fabric Texture** — Cotton's soft micro-wrinkles, denim's twill weave and fading, knit's loop texture, leather's use patina and crease marks. Clothes show evidence of "being worn" — hem naturally slightly wrinkled, cuffs have wear from putting on/taking off. Seedance 2.0 uses "fabric texture with subtle wear, natural fabric drape, lived-in clothing"
- **Building Materials** — Water stains and micro-cracks on cement walls, reflections and handprints on glass curtain walls, wear patina on metal handrails,subtle scratches on ceramic tile floors, use marks on wooden surfaces. Seedance 2.0 uses "weathered building materials, real urban surfaces, not showroom clean"
- **Age Texture First** — Materials must not be too clean and perfect. Life traces (daily clutter on desktop, sticker residues on walls, floor wear) are not defects, they are the foundation of spatial narrative. Prohibit "brand new showroom" and "seamless render"
- **Seedance 2.0 Texture Adaptation Points**: Avoid CG terms like "PBR material," "physics-level rendering," "8K texture." Use instead "real texture, natural material surface, visible wear and use marks, not CGI." When describing slight imperfections, use "subtle" instead of modeling terms like "micro-detail"

---

## IV. Live-Action Urban Scene Spatial Elements

Scene elements unique to contemporary Chinese cities and their visual narrative function in Seedance 2.0 video:

- **Window/Floor-to-Ceiling Window/Glass Partition** — The most core composition and lighting prop in live-action urban. Window is the light entrance — the direction and color temperature of window light determine the entire indoor lighting logic. Glass partitions create "separated yet transparent" multi-layered space (foreground → glass → mid-ground → glass → background). In Seedance 2.0,emphasis describe "light entering through window at specific angle" to help the model understand light source direction
- **Street/Street Trees/Crosswalk/Traffic** — Spatialskeleton framework of outdoor scenes. Empty long street = loneliness, heavy traffic = urban detachment, wet road reflecting streetlights after rain = emotional density. In Seedance 2.0, street scenes mustclear "wet road surface reflecting streetlights" or "dry pavement with long afternoon shadows" and other optically descriptive elements executable by the model
- **Streetlight/Window Light/Screen Light/Car Light** — Core light source narrative carriers of the urban world. Streetlight warm yellow (2000-2200K sodium or 3000K LED) = warmth of the night; convenience store fluorescent cool white (4000-5000K) = safe island in the deep night city; phone screen cool blue reflecting on face = lonely companionship in solitary moments
- **Old Town Alleyways/High-rise Apartments/Office Buildings/Subway Stations** — Four types of urban architectural narrative containers. Old town's mottled walls and overhead wires = street life memories; high-rise floor-to-ceiling window overlooking the city = elite's loneliness or sense of control; office building glass partition successive reflections = workplace order and detachment; subway station fluorescent cool light + tunnel darkness = pause within urban flow
- **Use Scene Empty Shots Betweensegment** — Empty shots as emotional buffer, not hard cuts. Empty shots of the same space at different times/weather (e.g., rainy street → sunny street) canimply passage of time. In Seedance 2.0, empty shots must specify light source logic — empty shots also have emotion
- **Use Visuals Rather Than Dialogue at Turning Points** — Sudden lighting change (window light blocked by clouds → space suddenly darkens), shot size jump cut (medium shot → extreme close-up), spatial transition (indoor → street view outside window), focus drift — narrative completed by the camera

---

## V. Live-Action Urban Music & Ambient Sound

### 5.1 Music Instrument Selection

Live-action urban music primarily uses acoustic instruments with restrained electronic elements, pursuing "presence without stealing the scene":

- **Piano** — Core instrument for cool solitude, warmfine/delicate scenes. Best in single-note repetition or sparse chords — the silence between notes is as important as the notes themselves
- **String Section** — Driving force for emotional accumulation and release scenes. Mid-low register for laying foundation (warm but not oppressive), high register for light touch and immediate withdrawal at emotional high points
- **Acoustic Guitar** — Underlying tone for daily relaxation, healing, urban wandering scenes. Fingerpicking or light strumming texture,built-in "afternoon sunlight" warmth
- **Electric Guitar (Clean/Slight Overdrive)** — Emotional amplifier for urban nightlife, solitary street walking, mild melancholy scenes. Single-note melody lines or ambient arpeggios, use distortion sparingly
- **Electronic Ambient Pad** — Low-frequency foundation for urban suspense, night transition, time passage scenes. As aunderlying layer presence that "can be ignored but feels wrong if removed"
- **Harmonica/Accordion** — Highlight instrument for street life, nostalgic memory scenes. Not suitable for entire piece, local appearance is a narrative signal
- **Light Electronic Beat** — Rhythmic foundation for urban rhythm scenes (commuting montage, city night quick cuts). Breakbeat or minimal electronic drums,do not exceed 80BPM
- Use sparingly: Full orchestra tutti, heavy metal distortion, high-energy electronic dance music — these would make live-action urban become "music acting"

### 5.2 Music Combination Strategy

| Emotional Stage | Instrument Combination |
|---|---|
| Calm Opening/Daily Narrative | Piano solo or Piano + very light electronic Pad |
| Warm Healing/Relaxed Daily | Acoustic guitar + Piano + light string foundation |
| Professional Elite/Highlight Moment | Piano + Strings mid-high register + light electronic beat |
| Solitary Longing | Piano sparse single notes or Piano + harmonica accent |
| Emotional Turn/Fateful Moment | String section crescendo + Piano closing |
| Suspenseforeshadowing/Urban Night | Electronic ambient Pad + light electronic beat + clean electric guitar single note |
| Street Life/Nostalgic | Acoustic guitar + accordion/harmonica accent + very light strings |
| Ending/Aftertaste | Piano single notes gradually thinning → Ambient sound solo |

### 5.3 Live-Action Urban Ambient Sound

> Ambient sound is the "auditory material" of live-action urban scenes, determining spatial immersion. Each scene annotates 1-2 core ambient sounds.

**Core Ambient Sound Layers:**
- **Indoor Ambient Sound**: Air conditioner low hum / keyboard clicks / elevator chime / faucet drip / refrigerator compressor running / curtains lightly blown by wind / clock ticking
- **Outdoor Ambient Sound**: Traffic tire noise / distant voices / wind through buildings / street tree leaves rustling / bird calls / rain hitting car windows and road / construction muffled sounds / shared bike locking sound
- **Transition Ambient Sound**: Subway arrival announcement and brake sound / mall background music and flow of people / elevator running and door chime / corridor footsteps approaching from distance
- **Silence is Also an Ambient Sound**: Late-night apartment with only refrigerator low-frequency hum, street at 5am with no traffic — this "absence of sound" itself is narrative

Sound design philosophy:
- Ambient sounds are not pasted on, they are sounds the scene naturally carries
- "Removing" ambient sound at critical moments creates more emotional impact than "adding"special effects
- Changes in ambient sound canimply spatial transitions — from noisy street walking into quiet convenience store, the sound suddenly "becomes cleaner"

---

## VI. Seedance 2.0 Special Adaptation

### 6.1 Core Adaptation Principles

> Seedance 2.0 is a video model that prioritizes realistic physical simulation. The live-action urban style naturally resonates with Seedance 2.0 — but "photography terminology" needs to be translated into "physical instructions" the model can execute.

| Adaptation Dimension | General Prompt Writing | Seedance 2.0 Optimized Writing |
|---|---|---|
| Light Source Description | Warm window light | Afternoon sunlight entering at 45° from the right window, color temperature about 4500K warm white, projecting elongated window frame shadows on the floor |
| Expression | Gentle expression | Corners of mouth naturally slightly raised, fine smile lines appearing at outer eye corners, natural light dot in eyes when looking atthe other |
| Action | Turn around | Slowly rotate about 90° to the right, center of gravity shifting from left foot to right foot, entire process about 1.5s, coat hem naturally swaying when turning |
| Material | Real skin texture | Pores faintly visible on cheeks, slight oil reflection in T-zone, not smoothed not silicone texture |
| Weather | Rainy street | Light rain, wet road reflecting streetlight warm yellow patches, rain streaks on window glass slightly blurring the street view outside |

### 6.2 Quality Base (Seedance 2.0 Live-Action Urban Exclusive)
1080p, live-action film texture, real skin texture, natural light and shadow, 24fps cinematic frame rate, handheld breathing feel or gimbal flow, real grain structure, not CG not rendered
### 6.3 Light Effect Instructions (Seedance 2.0 Live-Action Urban Exclusive, select by lighting scheme)

| Lighting Scheme | Seedance 2.0 Light Effect Instructions |
|---|---|
| A Urban Gilded | Sunset natural light 45° side entry, color temperature about 3000-3500K warm gold, sky ambient light 5500K as shadow fill, light ratio about 1:3 |
| B Daytime Clear | Large-area window light diffusion, color temperature about 5000-5500K neutral cool white, curtain softened light, no hard shadows, light ratio about 1:1.5 low contrast |
| C Warm Glow | Desk lamp warm key light, color temperature 2800-3200K, shadowsretain objectoutline detail, light ratio about 1:4 warmenvelop |
| D Cool Sharp Shadow | Side hard window light, cool white 5000K key light, shadows deep but with detail, light ratio about 1:8 large ratio |
| E Indoor Diffusion | Window light natural diffusion 4500-5500K as key light, indoor ceiling neutral fill, soft shadow transition, light ratio about 1:2 |
| F Rainy Night Glow | Wet ground reflecting streetlight warm patches 2800K, ambient cool tone 6000K, rain streaks on window scattering light, light ratio about 1:6 cool-warm coexistence |
| G Blue Hour Poem | Sunset sky deep blue-purple diffusion about 8000-10000K, ground artificial warm dots first lit 2800K, light ratio about 1:5 cool main warm dots |

### 6.4 Physical Logic Concrete Representation (Live-Action Urban Exclusive)

> Seedance 2.0 can understand the physical laws of the real world. All actions must be described with specific values and physicalexpression, prohibiting "then," "accordingly," "appropriately."

| Scene | Abstract Writing (Prohibited) | Seedance 2.0 Concrete Writing |
|---|---|---|
| Stand up and leave | Then stand up | Both hands pressing chair armrests, knees moving forward, after 0.5s body center of gravity shifts to feet, then 1s later standing straight — entire process about 2s, pause 0.5s after standing |
| Turn head | Turn head to look out window | Head slowly rotating about 45° to the right, gaze moving from coffee cup on desktop to city skyline outside window, rotation process about 1s, after in position gaze pauses in the distance |
| Pour coffee | Poured a cup of coffee | Right hand holding coffee pot handle, spout tilting about 30°, dark brown coffee liquid pouring into white ceramic cup, liquid level rising from cup bottom to two-thirds of cup body, entire process about 3s, steam slowly rising from cup rim |
| Walking in rain | Walking alone in rain | Walking slowly on wet road, pace about one step per second, each step sole touching water surface createssubtle ripples, streetlight warm yellow light forming elongated reflections on wet road, rain visible under streetlight |

### 6.5 Spatial Logic Concrete Representation (Live-Action Urban Exclusive)

**Spatial Coordinate Definition Standard:**
- **Horizontal Position**: Left third of frame / Center of frame / Right of frame, or relative to scene fixed object ("1m from floor-to-ceiling window")
- **Depth Position**: Foreground (1-2m from camera) / Mid-ground (3-5m from camera) / Background / Distant view outside window
- **Between Characters**: Relative distance and facing ("A and B face each other, about 0.8m apart, A slightly left, B slightly right")
- **Person-Space Relationship**: Distance and direction relative to scene fixed objects

**Position Connectivity Example:**
【Segment A End】
A standing in front of floor-to-ceiling window, about 0.5m from window, facing outside, positioned center-right of frame.
Body slightly turned about 20° to the right, right hand lifting coffee cup to place on right side table.

【Segment B Start】
A's right hand just moved away from cup, cup on side table. A still standing at the floor-to-ceiling window, position unchanged.
Outside the window, the sky has turned from dusk to blue hour, indoor desk lamp already on.
### 6.6 @reference Mandatory Anchor Syntax

> Seedance 2.0 character/scene/prop consistency depends on the @reference syntax.
Character Anchor: Must reference @ImageX, specify usage
Example: @Image1_workplacefemale_commuter suit as character appearance reference, @Image2_office building_floor-to-ceiling window office as scene environment reference

Scene Anchor: Must reference the corresponding scene asset's @ImageX
Prop Anchor: If there is a handheld orcore prop, reference the corresponding @ImageX

### 6.7 Multi-Shot Sequence Best Practices (Seedance 2.0 Live-Action Urban)

> Seedance 2.0 recommends 2-3 shots per segment, total duration 4-12 seconds.
[Shot 1: Medium Shot · Fixed] In front of office floor-to-ceiling window, A standing sideways holding coffee cup looking outside.
Afternoon window light entering at 45° from right (about 4500K), projecting long window frame shadow on floor.
A positioned center-right of frame, about 3m from camera. Duration about 4s.

[Cut to]
[Shot 2: Close-Up · Slow Push] A's face slowly turning from side profile toward camera direction.
Corners of mouth slightly raised, gaze withdrawing from outside window, natural highlight points of window light in eyes.
Facial pores and skin texture visible, not smoothed. Duration about 3s.

[Cut to]
[Shot 3: Extreme Close-Up · Fixed] A's hand placing coffee cup on side table, cup bottom touching wooddesktop producing light sound.
Window light creating a warm gold rim light on the cup rim. Duration about 2s.

### 6.8 Live-Action Urban Seedance 2.0 Negative Words (do not exceed 7)
3D rendering, CG animation, plastic mask, smoothed skin, non-live-action texture, floating objects, screen flickering

---

## VII. Global Narrative Constraints

- **Empty Shot is Emotion** — Between each narrativesegment, suggest using scene empty shots (same space under different lighting) as emotional buffer. Empty shots are not "nothing to shoot," they are "let the audience catch their breath"
- **Light Continuity & Change** — Within the same space during daytimesegment, window light angle should continuously change over time. If a dialogue scene spans half an hour, the window light position should have shifted somewhat — Seedance 2.0 can understand this "reasonablenot fully consistent"
- **Character Light Source Consistency** — Within the same shot, the facial light source direction of all characters must be unified. If the key light comes from the left, everyone's left face should be the bright side
- **Avoid "Over-Directing"** — Live-Action Urban pursues "life captured by the camera," not "plot arranged by the screenwriter." Allow uncontrollable daily details in the frame (wind blowing curtains, a passing cat, slight shaking in a coffee cup)
- **The Value of Silence** — Not every shot needs to be filled with action and dialogue. A 3-second still close-up — the character just breathing, blinking, existing — is often more powerful than any dialogue

---

## VIII. Quick Decision Card

### Emotion → Lighting Scheme + Music Quick Reference

| Emotion | Lighting Scheme | Music Direction |
|---|---|---|
| Warm Daily | C Warm Glow or E Indoor Diffusion | Acoustic guitar + Piano |
| Workplace Restraint | E Indoor Diffusion or B Daytime Clear | Piano + Light strings |
| Solitary Longing | F Rainy Night Glow or G Blue Hour Poem | Piano sparse single notes |
| Highlight Moment | A Urban Gilded | Piano + String section |
| Suspense Tension | D Cool Sharp Shadow | Electronic Pad + Light beat |
| Healing Rebirth | B Daytime Clear | Acoustic guitar + Piano |
| Street Life | C Warm Glow | Acoustic guitar + Accordion |
| Poetic Pause | G Blue Hour Poem | Piano to ambient sound solo |
