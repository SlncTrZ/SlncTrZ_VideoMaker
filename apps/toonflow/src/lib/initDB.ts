import { Knex } from "knex";
import { v4 as uuid } from "uuid";
import { getEmbedding } from "@/utils/agent/embedding";

interface TableSchema {
  name: string;
  builder: (table: Knex.CreateTableBuilder) => void;
  initData?: (knex: Knex) => Promise<void>;
}

export default async (knex: Knex, forceInit: boolean = false): Promise<void> => {
  const tables: TableSchema[] = [
    // User table
    {
      name: "o_user",
      builder: (table) => {
        table.integer("id").notNullable();
        table.text("name");
        table.text("password");
        table.primary(["id"]);
        table.unique(["id"]);
      },
      initData: async (knex) => {
        await knex("o_user").insert([{ id: 1, name: "admin", password: "admin123" }]);
      },
    },
    // Project table
    {
      name: "o_project",
      builder: (table) => {
        table.integer("id");
        table.string("projectType");
        table.string("imageModel");
        table.string("imageQuality");
        table.string("videoModel");
        table.text("name");
        table.text("intro");
        table.text("type");
        table.text("artStyle");
        table.text("directorManual");
        table.text("mode");
        table.text("videoRatio");
        table.integer("createTime");
        table.integer("userId");
        table.primary(["id"]);
        table.unique(["id"]);
      },
    },
    // Art style table
    {
      name: "o_artStyle",
      builder: (table) => {
        table.integer("id").notNullable();
        table.string("name");
        table.text("fileUrl");
        table.text("label");
        table.text("prompt");
        table.primary(["id"]);
        table.unique(["id"]);
      },
      initData: async (knex) => {},
    },
    // Agent deploy table
    {
      name: "o_agentDeploy",
      builder: (table) => {
        table.integer("id").notNullable();
        table.string("model");
        table.string("key");
        table.string("modelName");
        table.text("vendorId");
        table.string("desc");
        table.string("name");
        table.integer("temperature");
        table.integer("maxOutputTokens");
        table.boolean("disabled").defaultTo(false);
        table.primary(["id"]);
        table.unique(["id"]);
      },
      initData: async (knex) => {
        await knex("o_agentDeploy").insert([
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "scriptAgent",
            name: "Script Agent",
            desc: "Reads original text to generate story skeletons and adaptation strategies. Recommended: models with strong text comprehension and generation capabilities",
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "productionAgent",
            name: "Production Agent",
            desc: "Schedules and manages workflows. Recommended: models with strong logical reasoning and task management capabilities",
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "universalAi",
            name: "General AI",
            desc: "Used for novel event extraction, asset prompt generation, dialogue extraction and other auxiliary functions. Recommended: models with strong text processing capabilities",
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "ttsDubbing",
            name: "TTS Dubbing",
            desc: "Generates character dubbing based on script content, supports multiple voice styles and emotions",
            disabled: false
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "scriptAgent:decisionAgent",
            name: "Script Agent: Decision Layer",
            desc: "Decision layer",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "scriptAgent:supervisionAgent",
            name: "Script Agent: Supervision Layer",
            desc: "Supervision layer",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "scriptAgent:storySkeletonAgent",
            name: "Script Agent: Story Skeleton",
            desc: "Story skeleton generation",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "scriptAgent:adaptationStrategyAgent",
            name: "Script Agent: Adaptation Strategy",
            desc: "Adaptation strategy generation",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "scriptAgent:scriptAgent",
            name: "Script Agent: Script Generation",
            desc: "Script generation",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "productionAgent:decisionAgent",
            name: "Production Agent: Decision Layer",
            desc: "Decision layer",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "productionAgent:supervisionAgent",
            name: "Production Agent: Supervision Layer",
            desc: "Supervision layer",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "productionAgent:deriveAssetsAgent",
            name: "Production Agent: Derived Assets",
            desc: "Derived assets",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "productionAgent:generateAssetsAgent",
            name: "Production Agent: Asset Generation",
            desc: "Asset generation",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "productionAgent:directorPlanAgent",
            name: "Production Agent: Director Planning",
            desc: "Director planning",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "productionAgent:storyboardGenAgent",
            name: "Production Agent: Storyboard Generation",
            desc: "Storyboard generation",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "productionAgent:storyboardPanelAgent",
            name: "Production Agent: Storyboard Panel",
            desc: "Storyboard panel generation",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "productionAgent:storyboardTableAgent",
            name: "Production Agent: Storyboard Table",
            desc: "Storyboard table generation",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "productionAgent:ttsAgent",
            name: "Production Agent: TTS",
            desc: "Text-to-speech generation using configured TTS vendor. Converts character dialogue into voice audio.",
            disabled: false,
          },
        ]);
      },
    },
    // Settings table
    {
      name: "o_setting",
      builder: (table) => {
        table.text("key");
        table.text("value");
        table.primary(["key"]);
        table.unique(["key"]);
      },
      initData: async (knex) => {
        await knex("o_setting").insert([
          {
            key: "tokenKey",
            value: uuid().slice(0, 8),
          },
          {
            key: "messagesPerSummary",
            value: 10,
          },
          {
            key: "shortTermLimit",
            value: 5,
          },
          {
            key: "summaryMaxLength",
            value: 500,
          },
          {
            key: "summaryLimit",
            value: 10,
          },
          {
            key: "ragLimit",
            value: 3,
          },
          {
            key: "deepRetrieveSummaryLimit",
            value: 5,
          },
          {
            key: "modelOnnxFile",
            value: '["all-MiniLM-L6-v2", "onnx", "model_fp16.onnx"]',
          },
          {
            key: "modelDtype",
            value: "fp16",
          },
          {
            key: "switchAiDevTool",
            value: "0",
          },
        ]);
      },
    },
    // Task center table
    {
      name: "o_tasks",
      builder: (table) => {
        table.integer("id").notNullable();
        table.integer("projectId");
        table.string("taskClass");
        table.string("relatedObjects");
        table.string("model");
        table.text("describe");
        table.string("state");
        table.integer("startTime");
        table.text("reason");
        table.primary(["id"]);
        table.unique(["id"]);
      },
      initData: async (knex) => {},
    },
    // Prompt table
    {
      name: "o_prompt",
      builder: (table) => {
        table.integer("id").notNullable();
        table.string("name");
        table.string("type");
        table.text("data");
        table.text("useData");
        table.primary(["id"]);
        table.unique(["id"]);
      },
      initData: async (knex) => {
        await knex("o_prompt").insert([
          {
            name: "Event Extraction",
            type: "eventExtraction",
            data: `# Event Extraction Instructions\n\nYou are a novel text analysis assistant. Each time the user provides the original text of a chapter, you extract structured event information for that chapter.\n\n## \u26a0\ufe0f Output Constraints (Highest Priority — Violating Any Is a Failure)\n\n1. Your **complete response** is a single line, starting with \`|\` and ending with \`|\`, with exactly 7 fields\n2. The **first character** of the response must be \`|\`, and the **last character** must be \`|\`\n3. No characters before \`|\` — no lead-in, no explanation, no "Based on...", no "The following is..."\n4. No characters after \`|\` — no summary, no extraction notes, no adaptation suggestions\n5. Do not output header rows, separator lines, Markdown headings, emoji, or code block markers\n\n## Output Format\n\n\`\`\`\n| Chapter X {Chapter Title} | {Characters} | {Core Event} | {Main Plot Relevance} | {Info Density} | {Est. Episode Length} | {Emotional Intensity} |\n\`\`\`\n\n### Field Specification\n\n| Field | Format Requirement | Example |\n|------|----------|------|\n| Chapter | \`Chapter X {Chapter Title}\` | \`Chapter 1 Career Crisis and a Wish\` |\n| Characters | Characters with actual screen time, separated by commas | \`Lin Yi, Bai Yourong\` |\n| Core Event | 30-60 characters, must include action + result | \`Professional magician Lin Yi's career collapses due to the debunking trend; in despair he makes a wish and triggers a magic system binding\` |\n| Main Plot Relevance | **Must** be \`Strong/Medium/Weak (3-8 char reason)\` | \`Strong (motivation established + system activated)\` |\n| Info Density | \`High\` / \`Medium\` / \`Low\` | \`High\` |\n| Est. Episode Length | **Must** be \`X seconds\`, do not use minutes | \`50 seconds\` |\n| Emotional Intensity | Text labels joined by \`+\`, no star ratings/numbers | \`Plot Twist+Mystery\` |\n\n**Main Plot Relevance Criteria**: Strong = directly advances the protagonist arc; Medium = supplements worldbuilding/character relationships/foreshadowing; Weak = transition/atmosphere.\n\n**Est. Episode Length Reference**: High density + high emotion → 45-60s; Medium → 35-45s; Low → 25-35s.\n\n**Available Emotion Tags**: \`Conflict\`, \`Horror\`, \`Emotional\`, \`Plot Twist\`, \`Climax\`, \`Narrative\`, \`Comedy\`, \`Mystery\`, \`Emotional Breakdown\`.\n\n## Output Examples\n\nThe following two examples show the **complete response** — nothing else besides this single line:\n\n\`\`\`\n| Chapter 1 Career Crisis and a Wish | Lin Yi | Professional magician Lin Yi's career collapses due to the debunking trend; dejected, he sighs "if only I could do magic," and accidentally triggers a magical system binding | Strong (protagonist motivation established + system activated) | High | 50 seconds | Plot Twist+Mystery |\n\`\`\`\n\`\`\`\n| Chapter 12 Mountain Rest | Ling Xuan, Su Wanqing | Ling Xuan and Su Wanqing rest in the mountains; Su Wanqing recalls childhood memories, their relationship slightly eases but makes no real progress | Weak (atmospheric transition) | Low | 25 seconds | Narrative+Emotional |\n\`\`\`\n\n## Extraction Rules\n\n- Stay true to the original text — do not speculate, fabricate, or add plot points not present in the original\n- Use the character's primary name from the text and keep it consistent\n- When multiple parallel event threads exist, pick the one that most impacts the protagonist and briefly mention the others\n- For dialogue-heavy chapters, focus on what the conversation achieves rather than recounting the dialogue`,
          },
          {
            name: "Script Asset Extraction",
            type: "scriptAssetExtraction",
            data: `---\nname: universal_agent\ndescription: An assistant specialized in extracting assets (characters, scenes, props) from script content and generating structured asset lists.\n---\n\n# Script Assets Extract\n\nYou are a professional script content analysis assistant, specialized in identifying and extracting all involved assets (characters, scenes, props) from script text, and generating structured descriptions and prompts for each asset usable in downstream production workflows.\n\n## When to Use\n\nThe user provides script content. You need to read through each paragraph and extract all involved assets (characters, scene locations, prop items), outputting as a structured asset list. The produced asset descriptions will be used for subsequent AI image generation and production workflows.\n\n## System Mapping\n\n- Asset Types:\n  - \`role\` — Character (corresponds to \`o_assets.type = "role"\`)\n  - \`scene\` — Scene (corresponds to \`o_assets.type = "scene"\`)\n  - \`tool\` — Prop (corresponds to \`o_assets.type = "tool"\`)\n- Downstream Usage: Asset prompt generation → AI asset image generation → Storyboard production\n\n## Output Requirements\n\n**Must return results by calling the \`resultTool\`**, direct output of asset lists in plain text, Markdown tables, or JSON code blocks is prohibited.\nThe \`resultTool\` schema performs strict validation on field types and enum values. When calling, strictly follow the field definitions below to ensure correct data structure, complete fields, and matching types.\n\nEach asset object contains the following fields:\n\n| Field | Type | Required | Description |\n| ---- | ---- | ---- | ---- |\n| \`name\` | string | Yes | Asset name, using the original term from the script without additional description |\n| \`desc\` | string | Yes | Asset description, 30-80 characters of visual description |\n| \`prompt\` | string | Yes | Generation prompt, in English, for AI image generation |\n| \`type\` | enum | Yes | Asset type: \`role\` / \`scene\` / \`tool\`  |\n\n## Extraction Rules\n\n### Role\n\n- Extract all named characters that appear in the script\n- \`desc\`: Include visual elements such as appearance features, clothing style, physique and temperament\n- \`prompt\`: English prompt describing the character's appearance features, suitable for AI character image generation\n- When the same character has multiple names, use the most common one as \`name\`\n- Unnamed extras (such as "passerby", "soldier") can be skipped, unless their appearance has important visual significance to the story\n\n### Scene\n\n- Extract all scenes/locations that appear in the script\n- \`desc\`: Include visual elements such as spatial structure, lighting atmosphere, key furnishings, color tone\n- \`prompt\`: English prompt describing the overall visual style of the scene, suitable for AI scene image generation\n- Different states of the same scene (such as day/night) should not be extracted repeatedly; just note them in the \`desc\`\n\n### Tool\n\n- Extract important props/items that appear in the script\n- \`desc\`: Include visual elements such as appearance shape, color and material, size reference, special effects\n- \`prompt\`: English prompt describing the prop's appearance details, suitable for AI prop image generation\n- Only extract props with independent visual significance or story function; common items can be skipped\n\n\n## Prompt Generation Guidelines\n\n- Use comma-separated keyword/phrase format\n- Prioritize describing **visual features**, avoid abstract concepts\n- Include style keywords (such as anime style, manga style, etc., determined by project style)\n- Character prompt example: \`a young man, sharp eyebrows, black hair, pale skin, wearing a gray Taoist robe, slender build, cold expression\`\n- Scene prompt example: \`dark cave interior, glowing crystals on walls, misty atmosphere, dim blue lighting, stone altar in center\`\n- Prop prompt example: \`ancient jade pendant, oval shape, translucent green, carved dragon pattern, glowing faintly\`\n\n## Extraction Process\n\n1. Read through the entire script, identify all appearing characters, scenes, and props\n2. Generate structured \`name\`, \`desc\`, \`prompt\`, \`type\` for each asset\n3. Deduplicate: do not extract the same asset repeatedly\n4. **Must output the complete asset list by calling the \`resultTool\`**, do not split into multiple calls, submit all assets at once in the \`assetsList\` array\n\n## Extraction Principles\n\n1. **Faithful to Script**: All extraction based on actual content in the script, do not fabricate non-existent assets\n2. **Visual Priority**: Descriptions and prompts focus on visual features to facilitate AI image generation\n3. **Concise and Practical**: Only extract assets that have practical meaning for production, avoid over-extraction\n4. **Accurate Classification**: Strictly classify according to role/scene/tool, do not confuse\n5. **Prompt Quality**: English prompts should be specific and actionable, directly usable for AI image generation\n\n## Notes\n\n- The asset list should **not contain the script content itself**, only extract the assets used\n- Characters' personal belongings that have an independent story function should be extracted separately as props\n- Fixed furnishings in scenes do not need to be individually extracted as props, unless the item has an independent story function`,
          },
          {
            name: "Video Prompt Generation",
            type: "videoPromptGeneration",
            data: `# Video Prompt Generation Skill\n\nYou are a **Video Prompt Generation Agent**, responsible for reading storyboard information and outputting video prompts in the format corresponding to the specified AI video model.\n\n---\n\n## Input Format\n\n### 1. Model and Mode (Required)\n\n\n#### Mode Routing Rules\n\n| Condition | Matched Mode | Description |\n|------|----------|------|\n| Model name is \`Seedance2.0\` / \`seedance 2.0\` / \`Jimeng 2.0\` | **Seedance 2.0** | Fixed mode, regardless of multi-ref flag |\n| Model name is \`Wan2.6\` / \`wan 2.6\` / \`Wanxiang 2.6\` | **Wan 2.6** | Fixed mode, single image (first frame) + narrative text, no end frame |\n| Any other model + \`multi-ref:yes\` | **General Multi-Ref Mode** | Supports multi-ref references for character/scene/storyboard images |\n| Any other model + \`multi-ref:no\` | **General First/End Frame Mode** | First frame/first+end frame + plain text description |\n\n> The model name is for recording only; the actual prompt format is determined by the matched mode.\n\n### 2. Asset Info\n\n\`\`\`\nAsset Info [id, type, name], [id, type, name], ...\n\`\`\`\n\n- \`id\`: Asset unique identifier (e.g. \`A001\`)\n- \`type\`: Asset type, values \`character\` / \`scene\` / \`prop\`\n- \`name\`: Asset name (e.g. \`Shen Ci\`, \`City Wall\`, \`Long Sword\`)\n\n### 3. Storyboard Information\n\nStoryboards are passed in as a list of \`<storyboardItem>\` XML tags, each structured as follows:\n\n\`\`\`xml\n<storyboardItem\n  videoDesc='(Visual description, scene, associated asset names, duration, shot size, camera movement, character action, emotion, lighting atmosphere, dialogue, sound effects, associated asset IDs)'\n  prompt='Pending generation'\n  track='Group'\n  duration='Recommended video duration'\n  associateAssetsIds="[List of asset IDs required for this storyboard]"\n  shouldGenerateImage="true"\n></storyboardItem>\n\`\`\`\n\n#### Input Field Description\n\n| Attribute | Description | Source |\n|------|------|------|\n| \`videoDesc\` | **Core Input**: Structured visual description of the storyboard, including visual description, scene, associated asset names, duration, shot size, camera movement, character action, emotion, lighting atmosphere, dialogue, sound effects, associated asset IDs | Filled by user/upstream system |\n| \`prompt\` | **Existing Field**: Upstream generated storyboard image prompt, used as auxiliary reference context, **do not modify** | Already filled by upstream system |\n| \`track\` | Storyboard group identifier | Filled by user/upstream system |\n| \`duration\` | Recommended video duration (seconds) | Filled by user/upstream system |\n| \`associateAssetsIds\` | List of asset IDs associated with this storyboard | Filled by user/upstream system |\n| \`shouldGenerateImage\` | Whether to generate storyboard image, default \`true\` | Filled by user/upstream system |\n\n---\n\n## Task Goal\n\nRead all \`<storyboardItem>\` attributes, combine with asset information, and integrate all storyboards into a complete video prompt according to the specified model's prompt format.\n\n---\n\n## Output Format\n\nIntegrate all storyboards into **one complete video prompt** output (not individual per-item):\n\n| Mode | Integration Method |\n|------|----------|\n| **General Multi-Ref Mode** | \`[References]\` aggregates all \`@ImageN \` references;\`[Instruction]\` describes the complete narrative in chronological order |\n| **General First/End Frame Mode** | Plain text 5-dimension (Visual/Motion/Camera/Audio/Narrative), no \`@ImageN \` references, continuous timeline (\`[Motion]\` 0s to total duration, each segment minimum 1 second), single continuous shot throughout, no cuts |\n| **Seedance 2.0** | \`Generate a video consisting of the following N storyboards\`, each corresponding to a \`StoryboardN<duration-ms>\` segment |\n| **Wan 2.6** | Single-image first frame mode, only one storyboard per input, outputs one narrative-style English prompt (three-part structure: style tone → subject action + scene environment + lighting atmosphere → camera closing), no \`@ImageN \` references |\n\n- Only output the video prompt text, do not output XML tags, do not attach explanations\n\n---\n\n## videoDesc Parsing Rules\n\nExtract from \`videoDesc\` parentheses the following structured fields separated by comma:\n\n\`\`\`\n({Visual Description}, {Scene}, {Associated Asset Names}, {Duration}, {Shot Size}, {Camera Movement}, {Character Action}, {Emotion}, {Lighting Atmosphere}, {Dialogue}, {Sound Effects}, {Associated Asset IDs})\n\`\`\`\n\n| No. | Field | Usage | Example |\n|------|------|------|------|\n| 1 | Visual Description | Narrative backbone of the prompt | Shen Ci stands alone on the city wall gazing at the vast land |\n| 2 | Scene | Match scene asset | City Wall |\n| 3 | Associated Asset Names | Match character/prop assets | Shen Ci/City Wall |\n| 4 | Duration | Control duration parameter | 4s |\n| 5 | Shot Size | Control camera shot size | Full shot |\n| 6 | Camera Movement | Control camera movement | Static |\n| 7 | Character Action | Prompt action description | Standing with hands clasped behind back, robes billowing in the wind |\n| 8 | Emotion | Prompt emotional atmosphere | Resolute and determined |\n| 9 | Lighting Atmosphere | Prompt lighting description | Dusk cold-toned side-backlight |\n| 10 | Dialogue | Prompt dialogue/audio segment | No dialogue / Specific dialogue content |\n| 11 | Sound Effects | Prompt sound effect description | Wind sound, robe rustling |\n| 12 | Associated Asset IDs | For asset ID to character label mapping | A001/A002 |\n\n---\n\n## Asset Reference Numbering Rules\n\nAll models uniformly use \`@ImageN \` format to reference assets and storyboard images, numbered consecutively in input order:\n\n1. **Assets**: based on the appearance order of \`[id, type, name]\` starting from \`@Image1 \` numbering (no distinction between character/scene/prop)\n2. **Storyboard Images**: Each \`<storyboardItem>\` corresponds to one storyboard image, numbered consecutively after assets\n3. **Skip items without storyboard images**: When \`shouldGenerateImage="false"\` that storyboard has no generated image, **no storyboard image number is assigned**, subsequent numbers shift accordingly\n\n#### Example\n\nInput 3 assets + 2 storyboards:\n\n\`\`\`\nAsset Info[A001, character, Shen Ci], [A002, character, Su Jin], [A003, scene, City Wall]\n\`\`\`\n\n\`\`\`xml\n<storyboardItem ...>  <!-- Storyboard 1 -->\n<storyboardItem ...>  <!-- Storyboard 2 -->\n\`\`\`\n\nNumbering result:\n\n| Input Item | Reference Label | Description |\n|--------|----------|------|\n| [A001, character, Shen Ci] | \`@Image1 \` | Shen Ci reference image |\n| [A002, character, Su Jin] | \`@Image2 \` | Su Jin reference image |\n| [A003, scene, City Wall] | \`@Image3 \` | City Wall reference image |\n| storyboardItem 1st | \`@Image4 \` | Storyboard image 1 |\n| storyboardItem 2nd | \`@Image5 \` | Storyboard image 2 |\n\n---\n\n## Model Prompt Generation Rules\n\n### I. General Multi-Ref Mode\n\n#### Core Principles\n- MVL Multimodal Fusion: Natural language + image references in the same semantic space\n- The storyboard image sequence controls action/timeline/composition, scene reference images ensure environmental consistency\n- All assets and storyboard images uniformly use \`@ImageN \` references\n- **Strictly follow videoDesc**: Prompt content strictly based on the visual description, duration, shot size, camera movement, character action, emotion, lighting atmosphere, dialogue, sound effect fields in videoDesc, do not fabricate additional content\n- **Dialogue must not be missing**: Storyboards with dialogue in videoDesc must reflect dialogue-related description in Instruction\n- **Dialogue type annotation**: Distinguish between regular dialogue (dialogue), inner monologue (inner monologue OS), voiceover (voiceover VO), annotate in parentheses in Instruction\n\n#### Prompt Generation Template\n\n\`\`\`\n[References]\n@Image1 : [{Character A Name} Reference Image]\n@Image2 : [{Character B Name} Reference Image]\n@Image3 : [{Scene Name} Reference Image]\n@Image4 : [Storyboard Image 1]\n\n[Instruction]\nBased on the storyboard @Image4 :\n@Image1 {Action/State Description (English)},\n@Image2 {Action/State Description (English)},\nset in the {Scene Description (English)} of @Image3 ,\n{Camera/Camera Movement Description (English)},\n{Emotional Tone (English)},\n{Dialogue Description (English, with dialogue/OS/VO annotation) / No dialogue},\n{Sound Effect Description (English)}.\n\`\`\`\n\n#### Generation Constraints\n1. **Instruction must be in English**\n2. **Strictly follow videoDesc**: Prompt content strictly based on videoDesc's Visual Description, Duration, Shot Size, Camera Movement, Character Action, Emotion, Lighting Atmosphere, Dialogue, Sound Effects fields, do not fabricate additional information\n3. **Character Action** extracted from the 'Character Action' field in videoDesc, translated into concise English action description\n4. **Dialogue must not be missing**: Storyboards with dialogue in videoDesc must reflect dialogue content in Instruction (keep original language, do not translate)\n5. **Dialogue type annotation**: Regular dialogue annotate \`(dialogue)\`; inner monologue annotate \`(inner monologue, OS)\`; voiceover annotate \`(voiceover, VO)\`\n6. **Camera style** use standard tags:\`cinematic\` / \`wide-angle\` / \`close-up\` / \`slow motion\` / \`surround shooting\` / \`handheld\`\n7. **Spatial relationships** use standard verbs:\`wearing\` / \`holding\` / \`standing on\` / \`following behind\` / \`sitting in\`\n8. Single storyboard corresponds to single \`@ImageN \`, do not describe across multiple frames\n9. No need to describe character appearance (handled by reference images)\n10. No duration annotation (handled by model inference)\n11. **No storyboard image**: When \`shouldGenerateImage="false"\` that storyboard has no image, do not list it in \`[References]\`, do not use \`@ImageN \` to reference it in \`[Instruction]\`, replace with plain text description of the visual content\n\n#### KlingOmni Complete Example\n\nInput:\n\n\`\`\`\nModel: KlingOmni\nAsset Info[A001, character, Shen Ci], [A002, character, Su Jin], [A003, scene, City Wall]\n\`\`\`\n\n\`\`\`xml\n<storyboardItem videoDesc='(Shen Ci stands alone on the city wall gazing at the vast land, City Wall, Shen Ci/City Wall, 4s, Full shot, Static, Standing with hands clasped behind back, robes billowing in the wind, Resolute and determined, Dusk cold-toned side-backlight, No dialogue, Wind sound, robe rustling, A001/A003)' prompt='Full shot, Eye-level slightly low angle, on the city wall, Shen Ci stands with hands behind back, robes fluttering, dusk cold-toned side-backlight...' track='main' duration='4' associateAssetsIds="["A001","A003"]" shouldGenerateImage="true" ></storyboardItem>\n<storyboardItem videoDesc='(Su Jin ascends the city wall toward Shen Ci, City Wall, Su Jin/Shen Ci/City Wall, 4s, Medium shot, Tracking, Su Jin walks up the steps toward Shen Ci, Worried, Dusk afterglow dimming, No dialogue, Footsteps and wind sound, A001/A002/A003)' prompt='Medium shot, tracking, Su Jin walks up the steps toward Shen Ci on the city wall...' track='main' duration='4' associateAssetsIds="["A001","A002","A003"]" shouldGenerateImage="true" ></storyboardItem>\n\`\`\`\n\nOutput:\n\n\`\`\`\n[References]\n@Image1 : [Shen Ci reference image]\n@Image2 : [Su Jin reference image]\n@Image3 : [City Wall reference image]\n@Image4 : [Storyboard Image 1]\n@Image5 : [Storyboard Image 2]\n\n[Instruction]\nBased on the storyboard from @Image4 to @Image5 :\n@Image1 standing alone atop the city wall, hands clasped behind back, robes billowing in the wind, gazing across the vast land,\n@Image2 ascending the steps toward @Image1 , expression worried,\nset in the ancient city wall environment of @Image3 ,\nwide shot transitioning to medium tracking shot, cinematic,\nresolute determination shifting to concerned anticipation, dusk cold-toned side-backlit atmosphere fading,\nno dialogue,\nwind howling, fabric flapping, footsteps on stone.\n\`\`\`\n\n---\n\n### II. General First/End Frame Mode\n\n#### Core Principles\n- **Plain text prompt**: **Do not use any \`@ImageN \` references** (do not reference character assets, scene assets, or storyboard images), all content described in plain text\n- **Five-dimension structure**: Visual / Motion / Camera / Audio / Narrative\n- **Strictly follow videoDesc**: Prompt content strictly based on the visual description, duration, shot size, camera movement, character action, emotion, lighting atmosphere, dialogue, sound effect fields in videoDesc, do not fabricate additional content\n- **Dialogue must not be missing**: Storyboards with dialogue in videoDesc must \`[Audio]\` include the complete dialogue content\n- **Dialogue type annotation**: distinguish between regular dialogue (dialogue, lip-sync active), Inner monologue (inner monologue OS, silent lips), Voiceover (voiceover VO, silent lips), and in \`[Audio]\` clearly annotate\n- **Non-speaking subjects annotate \`silent\`** — to prevent erroneous lip-sync generation\n- **Single continuous shot throughout**: One shot from beginning to end, no cuts\n- **Timeline segmentation**: Each segment minimum 1 second, annotate with \`0s-Xs\`\n\n#### Prompt Generation Template\n\n\`\`\`\n[Visual]\n{Subject A Name}: {Appearance Summary}, {Position/Posture}, {speaking state speaking/silent}.\n{Subject B Name}: {Appearance Summary}, {Position/Posture}, {speaking state}.\n{Scene Description}, {Prop Description}.\n{Visual Style Tags}.\n\n[Motion]\n0s-{X}s: {Subject A Name} {Action Description Segment 1}.\n{X}s-{Y}s: {Subject B Name} {Action Description Segment 2}.\n\n[Camera]\n{Shot types}, {Camera Movement}, {Single Continuous Shot Throughout Description}.\n\n[Audio]\n{Xs-Ys}: "{Dialogue Content}" — {Speaker Name} ({dialogue / inner monologue OS / voiceover VO}), {lip-sync active / silent lips}.\n{Sound Effect Description}.\n\n[Narrative]\n{Plot Point Summary}, {Narrative Position}.\n\`\`\`\n\n#### Generation Constraints\n1. **All in English**\n2. **do not use any \`@ImageN \` references**: Do not reference character assets, scene assets, or storyboard images in the prompt, all content described in plain text\n3. **Subjects described with text**: Briefly describe subject appearance features in [Visual] (such as clothing, hairstyle and other key distinguishing features)\n4. **Strictly follow videoDesc**: Prompt content strictly based on videoDesc's Visual Description, Duration, Shot Size, Camera Movement, Character Action, Emotion, Lighting Atmosphere, Dialogue, Sound Effects fields, do not fabricate additional information\n5. **Each subject must have speaking state annotated**: \`speaking\` / \`silent\` / \`speaking simultaneously\`\n6. **Dialogue must not be missing**: Storyboards with dialogue in videoDesc must \`[Audio]\` include the complete dialogue content (keep original language, do not translate)\n7. **Dialogue type annotation**: Regular dialogue annotate \`dialogue, lip-sync active\`; inner monologue annotate \`inner monologue (OS), silent lips\`; voiceover annotate \`voiceover (VO), silent lips\`\n8. **Motion timeline** each segment minimum 1 second, not exceeding total duration\n9. **Single continuous shot throughout**: Camera segment describes one shot, no cuts\n10. **Visual style** refer to the 'Visual Style Constraints' section in the Assistant\n11. **Shot types** select from:\`Wide establishing shot / Over-the-shoulder / Medium shot / Close-up / Wide shot / POV / Dutch angle / Crane up / Dolly right / Whip pan / Handheld / Slow motion\`\n\n#### Seedance 1.5 Pro Complete Example\n\nInput:\n\n\`\`\`\nModel: Seedance1.5\nAsset Info[A001, character, Shen Ci], [A002, character, Su Jin], [A003, scene, City Wall]\n\`\`\`\n\n\`\`\`xml\n<storyboardItem videoDesc='(Shen Ci stands alone on the city wall gazing at the vast land, City Wall, Shen Ci/City Wall, 4s, Full shot, Static, Standing with hands clasped behind back, robes billowing in the wind, Resolute and determined, Dusk cold-toned side-backlight, No dialogue, Wind sound, robe rustling, A001/A003)' prompt='Full shot, Eye-level slightly low angle, on the city wall, Shen Ci stands with hands behind back, robes fluttering, dusk cold-toned side-backlight...' track='main' duration='4' associateAssetsIds="["A001","A003"]" shouldGenerateImage="true" ></storyboardItem>\n<storyboardItem videoDesc='(Su Jin ascends the city wall toward Shen Ci, City Wall, Su Jin/Shen Ci/City Wall, 4s, Medium shot, Tracking, Su Jin walks up the steps toward Shen Ci, Worried, Dusk afterglow dimming, No dialogue, Footsteps and wind sound, A001/A002/A003)' prompt='Medium shot, tracking, Su Jin walks up the steps toward Shen Ci on the city wall...' track='main' duration='4' associateAssetsIds="["A001","A002","A003"]" shouldGenerateImage="true" ></storyboardItem>\n\`\`\`\n\nOutput:\n\n\`\`\`\n[Visual]\nShen Ci: male, dark flowing robes, hair tied up, standing alone atop city wall, hands clasped behind back, robes billowing, silent.\nSu Jin: female, light-colored dress, hair partially down, ascending steps toward Shen Ci, expression worried, silent.\nAncient city wall, vast open land beyond, dusk sky fading.\nCinematic, photorealistic, 4K, high contrast, desaturated tones, shallow depth of field.\n\n[Motion]\n0s-4s: Shen Ci stands still on city wall edge, robes flutter in wind, hair sways gently. Gaze fixed on distant horizon.\n4s-8s: Su Jin climbs the last few steps onto the wall, walks toward Shen Ci. Shen Ci remains still, unaware. Su Jin slows as she approaches.\n\n[Camera]\nWide establishing shot, static for first 4 seconds capturing the lone figure. Then smooth transition to medium tracking shot following the woman ascending steps, single continuous take throughout, no cuts.\n\n[Audio]\n0s-4s: Wind howling across wall, fabric flapping rhythmically. No dialogue.\n4s-8s: Footsteps on stone, robes rustling. No dialogue.\nShen Ci — silent. Su Jin — silent.\n\n[Narrative]\nLone figure on city wall, then arrival of a companion. Tension between determination and concern. Single continuous take.\n\`\`\`\n\n---\n\n### III. Seedance 2.0\n\n#### Core Principles\n- **Structured 12-dimension encoding**: uniformly use \`@ImageN \` to reference assets and storyboard images, duration \`<duration-ms>\`\n- **Timbre parameter 9-dimension detailed description** (required when dialogue exists)\n- **Millisecond-level duration control**: Single storyboard minimum duration 1000ms (1 second)\n- **Chinese prompt**\n- **Strictly follow videoDesc**: Each storyboard description strictly based on the visual description, duration, shot size, camera movement, character action, emotion, lighting atmosphere, dialogue, sound effect fields in videoDesc, do not fabricate additional content\n- **Dialogue must not be missing**: storyboards with dialogue in videoDesc, must output complete dialogue and timbre description\n- **Dialogue type annotation**: Distinguish between regular dialogue (use 'say:'), inner monologue (use 'inner OS:'), voiceover (use 'voiceover VO:'), and match corresponding lip-sync state descriptions\n\n#### Prompt Generation Template\n\n**Single storyboard template:**\n\n\`\`\`\nVisual style and type: {Style}, {Tone}, {Type}\n\nGenerate a video consisting of the following 1 storyboard:\n\nScene:\nStoryboard transition: None\n\nStoryboard 1<duration-ms>{Milliseconds}</duration-ms>: Time: {Day/Night/Morning/Dusk}, scene image: @Image{Scene Number}, Camera shot: {Shot Size}, {Angle}, {Camera Movement}, @Image{Character Number} {Action/Expression/Gaze/Position Description}. {Dialogue and Timbre Description (if any)}. {Background Environment Detail}. {Lighting Atmosphere}. {Camera Movement Detail}.\n\`\`\`\n\n**Multi-storyboard template:**\n\n\`\`\`\nVisual style and type: {Style}, {Tone}, {Type}\n\nGenerate a video consisting of the following {N} storyboards:\n\nScene:\nStoryboard transition: {Global Transition Description}\n\nStoryboard 1<duration-ms>{Milliseconds}</duration-ms>: Time:{...}, scene image:@Image{Scene Number}, Camera shot:{...}, @Image{Character Number} {...}.{...}.\nStoryboard 2<duration-ms>{Milliseconds}</duration-ms>: ...\n...\n\`\`\`\n\n#### Timbre Generation Rules (Required when dialogue exists)\n\nDialogue Format: \`@Image{Character Number} say: "{Dialogue Content}" Timbre: {9 dimensions description}\`\n\n9-dimension Fill in order:\n\n\`\`\`\n{Gender}, {Age Timbre}, {Pitch}, {Tone Texture}, {Voice Thickness}, {Articulation}, {Breath}, {Speed}, {Special Texture}\n\`\`\`\n\n> When timbre information is not specified in desc, infer from the reference table below based on character type:\n\n| Character Type Characteristics | Default Timbre |\n|------------|---------|\n| Male authoritative/domineering character | Male voice, middle-aged timbre, deep pitch, rich and powerful tone, heavy voice, standard pronunciation, extremely steady breath, slower pace |\n| Female gentle/sweet character | Female voice, young timbre, medium-high pitch, bright and crisp tone, clear and soft voice, full steady breath, with gentle sincerity |\n| Male young/ordinary character | Male voice, young timbre, medium pitch, clean tone, moderate voice thickness, clear pronunciation, steady breath, moderate pace |\n| Female lively/extroverted character | Female voice, young timbre, higher pitch, crisp and lively tone, light voice, full breath, faster pace, with smile and warmth |\n| Villain/cold character | Male voice, middle-aged timbre, deep pitch, dry and dark tone, gravelly voice, steady breath, very slow pace, with threatening feel |\n\n#### No-Dialogue Storyboard Handling\n- Do not write \`say: \` and timbre section\n- Annotate after action description \`No dialogue\`\n\n#### Dialogue Type Format\n\n| Dialogue Type | Format | Lip-sync Description |\n|----------|------|----------|\n| Regular dialogue | \`@Image{Character Number} say: "{Dialogue}" Timbre: {9 dimensions}\` | Character lips open and close speaking |\n| Inner monologue | \`@Image{Character Number} Inner OS: "{Dialogue}" Timbre: {9 dimensions}\` | Character lips remain closed |\n| Voiceover | \`@Image{Character Number} Voiceover VO: "{Dialogue}" Timbre: {9 dimensions}\` | Character lips remain closed (or character is not in frame) |\n\n#### Generation Constraints\n1. **Chinese prompt**\n2. **Strictly follow videoDesc**: Each storyboard content strictly based on videoDesc's Visual Description, Duration, Shot Size, Camera Movement, Character Action, Emotion, Lighting Atmosphere, Dialogue, Sound Effects fields, do not fabricate additional information\n3. **Dialogue must not be missing**: storyboards with dialogue in videoDesc, must output complete dialogue and timbre\n4. **Dialogue type correct annotation**: Regular dialogue use 'say:', Inner monologue use 'Inner OS:', Voiceover use 'Voiceover VO:'\n5. **Single storyboard minimum duration 1000ms (1 second)**\n6. **Duration unit**: Convert seconds from videoDesc × 1000 into milliseconds for \`<duration-ms>\`\n\n#### Seedance 2.0 Complete Example\n\nInput:\n\n\`\`\`\nModel: Seedance2.0\nAsset Info[A001, character, Shen Ci], [A002, character, Su Jin], [A003, scene, City Wall]\n\`\`\`\n\n\`\`\`xml\n<storyboardItem videoDesc='(Shen Ci stands alone on the city wall gazing at the vast land, City Wall, Shen Ci/City Wall, 4s, Full shot, Static, Standing with hands clasped behind back, robes billowing in the wind, Resolute and determined, Dusk cold-toned side-backlight, No dialogue, Wind sound, robe rustling, A001/A003)' prompt='Full shot, Eye-level slightly low angle, on the city wall, Shen Ci stands with hands behind back, robes fluttering, dusk cold-toned side-backlight...' track='main' duration='4' associateAssetsIds="["A001","A003"]" shouldGenerateImage="true" ></storyboardItem>\n<storyboardItem videoDesc='(Su Jin ascends the city wall toward Shen Ci, City Wall, Su Jin/Shen Ci/City Wall, 4s, Medium shot, Tracking, Su Jin walks up the steps toward Shen Ci, Worried, Dusk afterglow dimming, Su Jin says: You are alone here again, Footsteps and wind sound, A001/A002/A003)' prompt='Medium shot, tracking, Su Jin walks up the steps toward Shen Ci on the city wall...' track='main' duration='4' associateAssetsIds="["A001","A002","A003"]" shouldGenerateImage="true" ></storyboardItem>\n\`\`\`\n\nOutput:\n\n\`\`\`\nVisual style and type: Realistic live-action, cinematic style, cool tones, period style\n\nGenerate a video consisting of the following 2 storyboards:\n\nScene:\nStoryboard transition: Smooth camera transition from full shot to medium tracking shot, focus shifting from Shen Ci alone to Su Jin's arrival.\n\nStoryboard 1<duration-ms>4000</duration-ms>: Time: Dusk, scene image: @Image3, Camera shot: Full shot, Eye-level slightly low angle, Static camera, @Image1 standing alone on the city wall, hands clasped behind back, robes billowing in the wind, gazing at the vast land, resolute expression, unwavering eyes. No dialogue. Background shows ancient city wall with clear brick texture, vast land in the distance, cold-warm alternating skyline. Dusk slanted residual light side-backlight, predominantly cold tones, long shadows stretching, rim light faintly outlining the figure. Static camera.\n\nStoryboard 2<duration-ms>4000</duration-ms>: Time: Dusk, scene image: @Image3, Camera shot: Medium shot, Eye-level, Tracking shot, @Image2 climbing the steps, walking toward @Image1 on the city wall, face directed toward @Image1, expression slightly worried, @Image2 say: "You are alone here again." Timbre: Female voice, young timbre, medium-high pitch, bright and crisp tone, clear and soft voice, clean articulation, full steady breath, moderate pace, with gentle sincerity. Background city wall steps with clear texture, afterglow dimming, cold-warm alternating skyline deepening. Camera tracking Su Jin.\n\`\`\`\n\n---\n\n### IV. Wan 2.6\n\n#### Core Principles\n- **Single-image first frame mode**: classified as First/End Frame Mode, but only has First Frame (Storyboard Images), no End Frame\n- **Single storyboard input/output**: each time only one \`<storyboardItem>\` and its associated asset information is input, output is also one complete narrative-style prompt\n- **Narrative English prompt**: describe the scene like writing a story, do not list tags (Do not write \`4K, cinematic, high quality\` and similar stacking)\n- **Three-part structure**: style tone → subject action + scene environment + lighting atmosphere → camera closing\n- **Plain text prompt**: **Do not use any \`@ImageN \` references** in the prompt, all content described in plain text\n- **Strictly follow videoDesc**: Prompt content strictly based on the visual description, duration, shot size, camera movement, character action, emotion, lighting atmosphere, dialogue, sound effect fields in videoDesc, do not fabricate additional content\n- **Dialogue must not be missing**: Storyboards with dialogue in videoDesc must reflect dialogue-related description in the prompt\n- **Dialogue type annotation**: Distinguish between regular dialogue (dialogue), inner monologue (inner monologue OS), voiceover (voiceover VO), annotate in parentheses in the prompt\n\n#### Prompt Generation Template\n\nEach time input one storyboard, output one complete prompt (no number prefix), format as follows:\n\n\`\`\`\n{Style Tone One-Sentence Description},\n{Subject Name} {Appearance Summary}, {Specific Action/Posture Description}, {Emotion indicated through action}.\n{Scene background subject}, {Specific Environmental Objects}, {Spatial Sense}, {Time/Weather}.\n{Light Direction/Color Temperature} {Texture Description}, {Emotion implied through lighting}.\n{Dialogue Description (if any, including dialogue/OS/VO annotation)/ No dialogue}.\n{Sound Effect Description}.\n{Shooting Style}, {Shot Size}, {Angle}, {Camera Movement}.\n\`\`\`\n\n#### Narrative Writing Key Points\n\n| Principle | Description | Example |\n|------|------|------|\n| Style tone first | One sentence defining overall atmosphere | \`A cinematic epic scene\` / \`A melancholic cinematic scene\` |\n| Subject + action tightly coupled | Subject directly followed by action, appearance details embedded in the subject description | \`A young man in dark flowing robes stands alone atop the city wall, hands clasped behind back\` |\n| Emotion implied through action | Do not directly state 'He is sad' | ❌ \`He is sad.\` → ✅ \`head drops slowly, shoulders slumped\` |\n| Environment integrated into narrative | Do not list environmental attributes | ❌ \`The sky is blue. The grass is green.\` → ✅ \`hazy blue sky stretches over the emerald valley\` |\n| Lighting as separate sentence | Lighting direction + color temperature + texture + emotion | \`Warm golden hour light streams from behind, casting long shadows across the stone floor\` |\n| Camera language closing | One sentence to highlight | \`Captured in a wide establishing shot from a low-angle perspective, static camera\` |\n| No tag stacking | Do not write \`4K, cinematic, high quality\` | \`cinematic\` integrate into style tone |\n\n#### Generation Constraints\n1. **All in English**\n2. **do not use any \`@ImageN \` references**: Do not reference character assets, scene assets, or storyboard images in the prompt, all content described in plain text\n3. **Narrative description**: construct the scene like writing a novel, prohibit tag listing and config checklist style writing\n4. **Subjects described with text**: briefly describe subject appearance features (such as clothing, hairstyle and other key distinguishing features), embedded in subject description\n5. **Strictly follow videoDesc**: Prompt content strictly based on videoDesc's Visual Description, Duration, Shot Size, Camera Movement, Character Action, Emotion, Lighting Atmosphere, Dialogue, Sound Effects fields, do not fabricate additional information\n6. **Dialogue must not be missing**: Storyboards with dialogue in videoDesc must include the complete dialogue content in prompt (keep original language, do not translate)\n7. **Dialogue type annotation**: Regular dialogue annotate \`(dialogue)\`; inner monologue annotate \`(inner monologue, OS)\`; voiceover annotate \`(voiceover, VO)\`\n8. **Single input/output**: each time only process one storyboard, output one prompt, no number prefix\n9. **No need to annotate Duration**: Duration is controlled by the model side, do not write Duration parameter in prompt\n10. **Camera description integrated into narrative**: do not use bracket tags, use complete sentences to describe camera\n11. **Visual style** refer to the 'Visual Style Constraints' section in the Assistant\n\n#### Wan 2.6 Complete Example\n\n**Example 1: No dialogue storyboard**\n\nInput:\n\n\`\`\`\nModel: Wan2.6\nAsset Info[A001, character, Shen Ci], [A003, scene, City Wall]\n\`\`\`\n\n\`\`\`xml\n<storyboardItem videoDesc='(Shen Ci stands alone on the city wall gazing at the vast land, City Wall, Shen Ci/City Wall, 4s, Full shot, Static, Standing with hands clasped behind back, robes billowing in the wind, Resolute and determined, Dusk cold-toned side-backlight, No dialogue, Wind sound, robe rustling, A001/A003)' prompt='Full shot, Eye-level slightly low angle, on the city wall, Shen Ci stands with hands behind back, robes fluttering, dusk cold-toned side-backlight...' track='main' duration='4' associateAssetsIds="["A001","A003"]" shouldGenerateImage="true" ></storyboardItem>\n\`\`\`\n\nOutput:\n\n\`\`\`\nA cinematic epic scene with a cold, desaturated palette,\nA lone man in dark flowing robes stands atop an ancient city wall, hands clasped behind his back, robes and hair billowing in the wind, gaze fixed on the vast land stretching to the horizon, jaw set firm, eyes unwavering.\nThe weathered stone battlements frame the endless expanse below, rolling terrain fading into haze beneath a heavy dusk sky, clouds layered in muted golds and slate greys.\nCold side-backlight from the setting sun carves a sharp silhouette, long shadows stretching across the stone floor, a faint warm rim outlining the figure against the cool atmosphere.\nNo dialogue.\nWind howling across the open wall, fabric flapping rhythmically.\nCaptured in a wide establishing shot from a slightly low angle, static camera, single continuous take.\n\`\`\`\n\n**Example 2: With dialogue storyboard**\n\nInput:\n\n\`\`\`\nModel: Wan2.6\nAsset Info[A001, character, Shen Ci], [A002, character, Su Jin], [A003, scene, City Wall]\n\`\`\`\n\n\`\`\`xml\n<storyboardItem videoDesc='(Su Jin ascends the city wall toward Shen Ci, City Wall, Su Jin/Shen Ci/City Wall, 4s, Medium shot, Tracking, Su Jin walks up the steps toward Shen Ci, Worried, Dusk afterglow dimming, Su Jin says: You are alone here again, Footsteps and wind sound, A001/A002/A003)' prompt='Medium shot, tracking, Su Jin walks up the steps toward Shen Ci on the city wall...' track='main' duration='4' associateAssetsIds="["A001","A002","A003"]" shouldGenerateImage="true" ></storyboardItem>\n\`\`\`\n\nOutput:\n\n\`\`\`\nA melancholic cinematic scene, dusk tones deepening,\nA young woman in a light-colored dress ascends the final stone steps onto the city wall, her gaze locked on the lone figure ahead, brow slightly furrowed, pace slowing as she approaches, lips parting softly.\nThe ancient city wall stretches behind her, weathered stairs leading up from below, the distant skyline dimming as the last traces of golden hour fade into twilight.\nFading warm light mingles with rising cool blue tones, the contrast between the two figures softened by the diffused remnants of sunset.\n"You are alone here again." — Su Jin (dialogue).\nFootsteps on stone, wind sweeping across the battlements, fabric rustling.\nA medium tracking shot follows the woman from behind as she ascends and approaches, handheld camera with subtle movement, single continuous take.\n\`\`\`\n\n---\n\n## Constraints\n\n- **Only output video prompt**: do not attach any explanations, comments, or additional descriptions, only output video prompt text\n- **Strictly follow videoDesc** (common to all modes): Prompt content strictly based on the visual description, duration, shot size, camera movement, character action, emotion, lighting atmosphere, dialogue, sound effect fields in videoDesc, do not fabricate additional content\n- **Dialogue must not be missing** (common to all modes): Storyboards with dialogue in videoDesc must fully reflect dialogue content in the prompt, no omissions\n- **Dialogue keep original input** (common to all modes): Dialogue content must not be translated, must keep the original language from videoDesc\n- **Dialogue type annotation** (common to all modes): Must distinguish between regular dialogue (dialogue / say), Inner monologue (OS / inner OS), Voiceover (VO / Voiceover VO), and correctly annotate in the prompt\n- **Minimum time span 1 second** (common to all modes): For time segmentation (Motion timeline / duration-ms) in all modes, the minimum granularity is 1 second (1000ms), intervals below 1 second such as 0.5 seconds are prohibited\n- **Visual style**: style-related descriptions refer to the 'Visual Style Constraints' section in the Assistant, do not define styles within this Skill\n- **Strictly follow matched Mode format**: do not mix different Mode formats\n- **Do not modify original input**: do not rewrite \`<storyboardItem>\` fields; existing storyboard image prompts in \`prompt\` are for visual reference only\n- **Do not fabricate Assets or Dialogue**: only use the Asset Info from input; if no dialogue, annotate "No dialogue" / \`No dialogue\`\n- **Duration unit conversion**: Seedance 2.0's \`<duration-ms>\` needs seconds converted to milliseconds\n`,
          },
          {
            name: "Audio Timbre Binding",
            type: "audioBindPrompt",
            data: `You are a timbre matching assistant.\nYour task is: Based on the name and description of the given character asset, select the most suitable timbre from the candidate audio list.\nMatching rules:\n1. Prioritize semantic matching based on character traits such as gender, age, and personality against the timbre description;\n2. Each character can only match one timbre;\n3. If there is no suitable timbre in the candidate list, do not return an audioId;`,
          },
        ]);
      },
    },
    // Model prompt binding table
    {
      name: "o_modelPrompt",
      builder: (table) => {
        table.integer("id").notNullable();
        table.string("vendorId");
        table.string("model");
        table.text("fileName");
        table.text("path");
        table.primary(["id"]);
        table.unique(["id"]);
      },
      initData: async (knex) => {},
    },
    // Novel original text table
    {
      name: "o_novel",
      builder: (table) => {
        table.integer("id").notNullable();
        table.integer("chapterIndex");
        table.text("reel");
        table.text("chapter");
        table.text("chapterData");
        table.integer("projectId");
        table.integer("eventState");
        table.text("event");
        table.text("errorReason");
        table.integer("createTime");
        table.primary(["id"]);
        table.unique(["id"]);
      },
    },
    // Novel event table
    {
      name: "o_event",
      builder: (table) => {
        table.integer("id").notNullable();
        table.string("name");
        table.string("detail");
        table.integer("createTime");
        table.primary(["id"]);
        table.unique(["id"]);
      },
    },
    // Event-chapter table
    {
      name: "o_eventChapter",
      builder: (table) => {
        table.integer("id").notNullable();
        table.integer("eventId").unsigned().references("id").inTable("o_event");
        table.integer("novelId").unsigned().references("id").inTable("o_novel");
        table.primary(["id"]);
        table.unique(["id"]);
      },
    },
    // Script table
    {
      name: "o_script",
      builder: (table) => {
        table.integer("id").notNullable();
        table.text("name");
        table.text("content");
        table.integer("projectId");
        table.integer("extractState");
        table.integer("createTime");
        table.text("errorReason");
        table.primary(["id"]);
        table.unique(["id"]);
      },
    },
    // Assets table
    {
      name: "o_assets",
      builder: (table) => {
        table.integer("id").notNullable();
        table.text("name");
        table.text("prompt");
        table.text("remark");
        table.text("type");
        table.text("describe");
        table.integer("scriptId"); // Script ID
        table.integer("imageId").unsigned().references("id").inTable("o_image");
        table.integer("assetsId");
        table.integer("projectId");
        table.integer("flowId"); // Workflow ID
        table.integer("startTime");
        table.string("promptState");
        table.integer("audioBindState");
        table.text("promptErrorReason");
        table.primary(["id"]);
        table.unique(["id"]);
      },
      initData: async (knex) => {},
    },
    // Generated image table
    {
      name: "o_image",
      builder: (table) => {
        table.integer("id").notNullable();
        table.text("filePath");
        table.text("type");
        table.integer("assetsId");
        table.text("model");
        table.text("resolution");
        table.text("state");
        table.text("errorReason");
        table.primary(["id"]);
        table.unique(["id"]);
      },
    },
    // Storyboard table
    {
      name: "o_storyboard",
      builder: (table) => {
        table.integer("id").notNullable();
        table.integer("scriptId");
        table.text("prompt");
        table.text("filePath");
        table.text("duration");
        table.text("state");
        table.integer("trackId");
        table.text("reason");
        table.text("track");
        table.text("videoDesc");
        table.integer("shouldGenerateImage"); // 0 = no, 1 = yes
        table.integer("projectId");
        table.integer("flowId"); // Workflow ID
        table.integer("index");
        table.integer("createTime");
        table.primary(["id"]);
        table.unique(["id"]);
      },
    },
    // Flow data - agent work data
    {
      name: "o_agentWorkData",
      builder: (table) => {
        table.integer("id").notNullable();
        table.integer("projectId");
        table.integer("episodesId");
        table.string("key"); // Alternative indexing
        table.string("data");
        table.integer("createTime");
        table.integer("updateTime");
        table.primary(["id"]);
        table.unique(["id"]);
      },
    },
    // Video table
    {
      name: "o_video",
      builder: (table) => {
        table.integer("id").notNullable();
        table.text("filePath");
        table.text("errorReason");
        table.integer("time");
        table.text("state");
        table.integer("scriptId");
        table.integer("projectId");
        table.integer("videoTrackId");
        table.primary(["id"]);
        table.unique(["id"]);
      },
    },
    // Video track table
    {
      name: "o_videoTrack",
      builder: (table) => {
        table.integer("id").notNullable();
        table.integer("videoId");
        table.integer("projectId");
        table.integer("scriptId");
        table.text("state");
        table.text("reason");
        table.text("prompt");
        table.integer("selectVideoId");
        table.integer("duration");
        table.primary(["id"]);
        table.unique(["id"]);
      },
    },
    // Vendor config table
    {
      name: "o_vendorConfig",
      builder: (table) => {
        table.string("id").notNullable();
        table.text("inputValues"); // Input values JSON
        table.text("models"); // Model config JSON
        table.integer("enable"); // Whether to enable vendor
        table.primary(["id"]);
        table.unique(["id"]);
      },
      initData: async (knex) => {
        await knex("o_vendorConfig").insert([
          {
            id: "toonflow",
            inputValues: "{}",
            models: "[]",
            enable: 0,
          },
          {
            id: "deepseek",
            inputValues: "{}",
            models: "[]",
            enable: 0,
          },
          {
            id: "atlascloud",
            inputValues: "{}",
            models: "[]",
            enable: 0,
          },
          {
            id: "volcengine",
            inputValues: "{}",
            models: "[]",
            enable: 0,
          },
          {
            id: "minimax",
            inputValues: "{}",
            models: "[]",
            enable: 0,
          },
          {
            id: "openai",
            inputValues: "{}",
            models: "[]",
            enable: 0,
          },
          {
            id: "klingai",
            inputValues: "{}",
            models: "[]",
            enable: 0,
          },
          {
            id: "vidu",
            inputValues: "{}",
            models: "[]",
            enable: 0,
          },
        ]);
      },
    },
    // Image workflow table
    {
      name: "o_imageFlow",
      builder: (table) => {
        table.integer("id").notNullable();
        table.text("flowData").notNullable();
        table.primary(["id"]);
        table.unique(["id"]);
      },
    },
    {
      name: "o_assets2Storyboard",
      builder: (table) => {
        table.integer("storyboardId").notNullable();
        table.integer("assetId").notNullable();
        table.primary(["storyboardId", "assetId"]);
        table.unique(["storyboardId", "assetId"]);
      },
    },
    {
      name: "o_scriptAssets",
      builder: (table) => {
        table.integer("scriptId").notNullable();
        table.integer("assetId").notNullable();
        table.primary(["scriptId", "assetId"]);
        table.unique(["scriptId", "assetId"]);
      },
    },
    {
      name: "o_skillList",
      builder: (table) => {
        table.text("id").notNullable();
        table.text("md5").notNullable();
        table.text("path").notNullable();
        table.text("name").notNullable(); // File name
        table.text("description").notNullable(); // Description
        table.text("embedding"); // Vector embedding JSON
        table.text("type").notNullable(); // "main" | "references"
        table.integer("createTime").notNullable();
        table.integer("updateTime").notNullable();
        table.integer("state").notNullable(); // 1=normal, 0=generating description, -1=description empty, -2=attribution empty, -3=md5 changed, -4=file not found
        table.primary(["id"]);
      },
      initData: async (knex) => {
        const list = [
          {
            id: "4fb36012e56e395b425569987f5dab0e",
            md5: "fca3c269c5f325a65dafa663c9bb9773",
            path: "production_agent_decision.md",
            name: "production_agent_decision",
            description: "",
            embedding: "",
            type: "main",
            createTime: 1774447310118,
            updateTime: 1774447310118,
            state: -1,
          },
          {
            id: "017b6338d7aa227cd614ec1fb25fd83e",
            md5: "2610b80abe4bd048fe61c73adc7388ac",
            path: "production_agent_execution.md",
            name: "production_agent_execution",
            description: "",
            embedding: "",
            type: "main",
            createTime: 1774447310118,
            updateTime: 1774447310118,
            state: -1,
          },
          {
            id: "f03c8e67b61580de9ea5b9d166521b67",
            md5: "d41d8cd98f00b204e9800998ecf8427e",
            path: "production_agent_supervision.md",
            name: "production_agent_supervision",
            description: "",
            embedding: "",
            type: "main",
            createTime: 1774447310118,
            updateTime: 1774447310118,
            state: -1,
          },
          {
            id: "50b49d8af5d364665b463c23f6a4d8bb",
            md5: "fbba66e0df2426996277b299710c3033",
            path: "script_agent_decision.md",
            name: "script_agent_decision",
            description: "",
            embedding: "",
            type: "main",
            createTime: 1774447310118,
            updateTime: 1774447310118,
            state: -1,
          },
          {
            id: "427727727e1095c54b6840cd21382d82",
            md5: "7e5911242af7233854d533278c6a8ccb",
            path: "script_agent_execution.md",
            name: "script_agent_execution",
            description: "",
            embedding: "",
            type: "main",
            createTime: 1774447310118,
            updateTime: 1774447310118,
            state: -1,
          },
          {
            id: "02848fb0dd582fd926502c77ecf9679c",
            md5: "7a8b6a311b015cd47bf17cc52b935348",
            path: "script_agent_supervision.md",
            name: "script_agent_supervision",
            description: "",
            embedding: "",
            type: "main",
            createTime: 1774447310118,
            updateTime: 1774447310118,
            state: -1,
          },
          {
            id: "a1e818cc03a0b355b239ac1fb0512969",
            md5: "1fd22029e8047aa30b0dfd703cb837ed",
            path: "universal_agent.md",
            name: "universal_agent",
            description: "",
            embedding: "",
            type: "main",
            createTime: 1774447310118,
            updateTime: 1774447310118,
            state: -1,
          },
          {
            id: "3e5efec258c8d8e6a39bcef12f8ee058",
            md5: "efccb0464cfd472861b49ebf737d4820",
            path: "references/event_extract.md",
            name: "event_extract",
            description:
              "Text analysis assistant for novel-to-short-drama adaptation. Extracts structured info per chapter: characters, core events, mainline relations, info density, estimated duration, and emotional intensity. Outputs in Markdown tables with summary stats to aid content planning and duration estimation.",
            embedding: "",
            type: "references",
            createTime: 1774447310118,
            updateTime: 1774450165911,
            state: 1,
          },
          {
            id: "52c51fa8655f899a1b7aae9b6aad7251",
            md5: "783678aaab829b34e7c30a414c356bf6",
            path: "references/novel_character_extract.md",
            name: "novel_character_extract",
            description:
              "Character extraction assistant for novel content analysis. Identifies and outputs structured visual descriptions of all important characters from the source text, including appearance, attire, physique, and state variants for art production and AI character image generation.",
            embedding: "",
            type: "references",
            createTime: 1774447310118,
            updateTime: 1774450080903,
            state: 1,
          },
          {
            id: "6d46cdca10b2f49e07e515885d1387a0",
            md5: "10544d12c4ef011e6b3b63a99b8c7fa8",
            path: "references/novel_props_extract.md",
            name: "novel_props_extract",
            description:
              "Prop/item extraction assistant for novels. Identifies weapons, artifacts, potions, and other props, generating structured visual description tables with appearance, material, size, function, and state variants for art production and AI generation.",
            embedding: "",
            type: "references",
            createTime: 1774447310118,
            updateTime: 1774450094771,
            state: 1,
          },
          {
            id: "1864df75d1d65f76e275046649ecaef8",
            md5: "65603aa495a541f54c55b7f30e149f45",
            path: "references/novel_scene_extract.md",
            name: "novel_scene_extract",
            description:
              "Scene information extraction assistant for novels. Identifies various scene locations and outputs standardized scene asset tables with spatial descriptions, lighting atmosphere, key furnishings, and color tone for art production and AI concept art generation.",
            embedding: "",
            type: "references",
            createTime: 1774447310118,
            updateTime: 1774450161878,
            state: 1,
          },
          {
            id: "7fbce6f90d7d85496ba9817e9622e640",
            md5: "830559e8f2cd5d0fa8e6df48a164fe2d",
            path: "references/video_dialogue_extract.md",
            name: "video_dialogue_extract",
            description:
              "AI assistant config for extracting structured dialogue, narration, and sound effects from video storyboard prompts. Defines output format (shot number, character, dialogue type, performance direction), extraction rules, and processing flow for converting storyboard descriptions into standardized dialogue tables.",
            embedding: "",
            type: "references",
            createTime: 1774447310118,
            updateTime: 1774450180712,
            state: 1,
          },
          {
            id: "31fb5c5a1f514ec1e66b4eba9f22d4db",
            md5: "43e63450efe0c9af8a3a40b036d36cb4",
            path: "references/pipeline.md",
            name: "pipeline",
            description:
              "Four-stage pipeline document for short-drama adaptation projects covering event extraction, story skeleton, adaptation strategy, and script writing in serial execution flow. Defines collaboration norms across decision, execution, and supervision layers, plus dispatch, review, and fix interaction formats with quality gates.",
            embedding: "",
            type: "references",
            createTime: 1774451946248,
            updateTime: 1774451984533,
            state: 1,
          },
          {
            id: "27dc2dfc901de2180227d0269217583a",
            md5: "7d353be4bab7a794436d9abff2b9c6ee",
            path: "references/adaptation_format.md",
            name: "adaptation_format",
            description:
              "Standard format specification for adaptation strategy output. Covers three modules: core adaptation principles, deletion decisions, and world-building presentation strategy. Defines dimensions and elements for each module to guide literary adaptation for vertical short dramas.",
            embedding: "",
            type: "references",
            createTime: 1774452010535,
            updateTime: 1774452022083,
            state: 1,
          },
          {
            id: "d49fa09504fe784a8e6eb102756c6d56",
            md5: "2ef08a7479f29d74986999ceb02092c8",
            path: "references/event_format.md",
            name: "event_format",
            description:
              "Standard output format for event tables in film/TV adaptation projects. Includes file header, event table, field specifications (chapter, character, core event, mainline relation, emotional intensity, estimated duration), and summary statistics template for phase 1 event extraction and episode count/compression ratio estimation.",
            embedding: "",
            type: "references",
            createTime: 1774452010535,
            updateTime: 1774452030858,
            state: 1,
          },
          {
            id: "797906c2ddf0750f050bcdeae23eae3d",
            md5: "f5e7fe6db7e05db69d5dc327c4c538f2",
            path: "references/script_format.md",
            name: "script_format",
            description:
              "Output format specification for vertical short drama scripts. Defines standard format requirements for file header, beat structure, storyboard, scene description, dialogue, and transition annotations, with duration control parameters and self-check checklist for AI video generation and director production.",
            embedding: "",
            type: "references",
            createTime: 1774452010535,
            updateTime: 1774452042934,
            state: 1,
          },
          {
            id: "1abd8675c0c3e62b20c0b151d2ec0fb1",
            md5: "a587532c737ce15022e1522021f099bb",
            path: "references/skeleton_format.md",
            name: "skeleton_format",
            description:
              "Standardized format for story skeleton files (skeleton.md). Covers story core, character growth arcs, three-act structure, episode decision template, global deletion record, paywall hook design, and self-check checklist for converting chapter event lists into structured episode adaptation plans.",
            embedding: "",
            type: "references",
            createTime: 1774452010535,
            updateTime: 1774452057184,
            state: 1,
          },
          {
            id: "0b7828d7a6ab458a4b201122f08d6c16",
            md5: "120b3c856f1b2a8a429e11319e8c95fe",
            path: "references/quality_criteria.md",
            name: "quality_criteria",
            description:
              "Quality review standards manual for film/TV/short-drama projects. Covers detailed review rules for four modules: event table, story skeleton, adaptation strategy, and script. Defines requirements for format compliance, character name consistency, duration reasonableness, visual executability, and scene atmosphere coherence to ensure content accuracy and production feasibility.",
            embedding: "",
            type: "references",
            createTime: 1774452068093,
            updateTime: 1774452087877,
            state: 1,
          },
          {
            id: "5c1772b5f9c420d9eae9ca02914ba087",
            md5: "c710ab7d237e1f0c5aa3d208e0f5b484",
            path: "references/plan.md",
            name: "plan",
            description:
              "Specification for AI agent execution plans. Includes task overview, step list (with number, name, details, expected output, and dependencies), execution order annotations, and a standard reply template for decomposing user requests into concrete steps executable by sub-agent tools.",
            embedding: "",
            type: "references",
            createTime: 1774452098447,
            updateTime: 1774452109574,
            state: 1,
          },
          {
            id: "75a45cf996015ca819582873887ec301",
            md5: "6045d76873fd58b8b87a914a21a38439",
            path: "references/derive_assets_extraction.md",
            name: "derive_assets_extraction",
            description:
              "Technical guide for extracting visual state variants (derives) of each asset based on script content and existing asset list, using tool functions to read and write data for subsequent image generation reference.",
            embedding: "",
            type: "references",
            createTime: 1774452119499,
            updateTime: 1774452129516,
            state: 1,
          },
          {
            id: "fce75f69d704c19bebcb356bc1bd6e81",
            md5: "a3b3432854970f22949ba47236a6532f",
            path: "references/storyboard_generation.md",
            name: "storyboard_generation",
            description:
              "Tool guide for generating structured storyboard panels from scripts and asset lists. Covers storyboard splitting principles, field filling rules, and tool invocation flow for converting scripts into storyboard data with scene descriptions, camera language, dialogue, and AI prompt keywords.",
            embedding: "",
            type: "references",
            createTime: 1774452119499,
            updateTime: 1774452140873,
            state: 1,
          },
        ];
        await Promise.all(
          list.map(async (item) => {
            const embedding = await getEmbedding(item.description);
            item.embedding = JSON.stringify(embedding);
          }),
        );
        await knex("o_skillList").insert(list);
      },
    },
    {
      name: "o_skillAttribution",
      builder: (table) => {
        table.text("skillId").notNullable().references("id").inTable("o_skillList").onDelete("CASCADE");
        table.text("attribution").notNullable(); // "production_agent_decision.md" | "production_agent_execution.md" | "production_agent_supervision.md" | "script_agent_decision.md" | "script_agent_execution.md" | "script_agent_supervision.md" | "universal_agent.md"
        table.primary(["skillId", "attribution"]);
        table.index(["attribution"]);
      },
      initData: async (knex) => {
        await knex("o_skillAttribution").insert([
          {
            skillId: "52c51fa8655f899a1b7aae9b6aad7251",
            attribution: "universal_agent.md",
          },
          {
            skillId: "6d46cdca10b2f49e07e515885d1387a0",
            attribution: "universal_agent.md",
          },
          {
            skillId: "1864df75d1d65f76e275046649ecaef8",
            attribution: "universal_agent.md",
          },
          {
            skillId: "3e5efec258c8d8e6a39bcef12f8ee058",
            attribution: "universal_agent.md",
          },
          {
            skillId: "7fbce6f90d7d85496ba9817e9622e640",
            attribution: "universal_agent.md",
          },
          {
            skillId: "31fb5c5a1f514ec1e66b4eba9f22d4db",
            attribution: "script_agent_decision.md",
          },
          {
            skillId: "27dc2dfc901de2180227d0269217583a",
            attribution: "script_agent_execution.md",
          },
          {
            skillId: "d49fa09504fe784a8e6eb102756c6d56",
            attribution: "script_agent_execution.md",
          },
          {
            skillId: "797906c2ddf0750f050bcdeae23eae3d",
            attribution: "script_agent_execution.md",
          },
          {
            skillId: "1abd8675c0c3e62b20c0b151d2ec0fb1",
            attribution: "script_agent_execution.md",
          },
          {
            skillId: "0b7828d7a6ab458a4b201122f08d6c16",
            attribution: "script_agent_supervision.md",
          },
          {
            skillId: "5c1772b5f9c420d9eae9ca02914ba087",
            attribution: "production_agent_decision.md",
          },
          {
            skillId: "75a45cf996015ca819582873887ec301",
            attribution: "production_agent_execution.md",
          },
          {
            skillId: "fce75f69d704c19bebcb356bc1bd6e81",
            attribution: "production_agent_execution.md",
          },
        ]);
      },
    },
    // Memory table (message=original message, summary=compressed summary)
    {
      name: "memories",
      builder: (table) => {
        table.text("id").notNullable();
        table.text("isolationKey").notNullable(); // Memory isolation key
        table.text("type").notNullable(); // 'message' | 'summary'
        table.text("role"); // 'user' | 'assistant'
        table.text("name");
        table.text("content").notNullable();
        table.text("embedding"); // Vector embedding JSON
        table.text("relatedMessageIds"); // Summary-associated message ID list JSON
        table.integer("summarized").defaultTo(0); // Whether message has been summarized 0/1
        table.integer("createTime").notNullable();
        table.primary(["id"]);
        table.index(["isolationKey", "type"]);
        table.index(["isolationKey", "summarized"]);
      },
    },
    {
      name: "o_assetsRole2Audio",
      builder: (table) => {
        table.integer("assetsRoleId").notNullable();
        table.integer("assetsAudioId").notNullable();
        table.primary(["assetsAudioId", "assetsRoleId"]);
        table.unique(["assetsAudioId", "assetsRoleId"]);
      },
    },
  ];

  for (const t of tables) {
    const tableExists = await knex.schema.hasTable(t.name);
    if (!tableExists || forceInit) {
      if (tableExists && forceInit) {
        await knex.schema.dropTable(t.name);
        console.log("[DB Init] Dropped and recreating existing table:", t.name);
      } else {
        console.log("[DB Init] Creating table:", t.name);
      }
      await knex.schema.createTable(t.name, t.builder);
      if (t.initData) {
        await t.initData(knex);
        console.log("[DB Init] Initialized table data:", t.name);
      }
    }
  }
};