/**
 * Remove <think>...</think> tags and their content from deep think model output
 *
 * 1. stripThink(text)          — for non-streaming, removes <think> blocks from full text
 * 2. createThinkStreamFilter() — for streaming, returns a stateful filter that processes chunk by chunk
 */

/**
 * Non-streaming: remove <think>...</think> from full text
 */
export function stripThink(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

/**
 * Streaming: create a stateful chunk filter
 *
 * Usage:
 * ```ts
 * const filter = createThinkStreamFilter();
 * for await (const chunk of textStream) {
 *   const filtered = filter.push(chunk);
 *   if (filtered) msg.send(filtered);
 * }
 * ```
 */
export function createThinkStreamFilter() {
  let insideThink = false;
  let buffer = "";

  return {
    /**
     * Input a chunk, return filtered output text (may be empty)
     */
    push(chunk: string): string {
      let output = "";
      let i = 0;

      while (i < chunk.length) {
        if (insideThink) {
          // Inside <think>, looking for </think>
          const closeIdx = chunk.indexOf("</think>", i);
          if (closeIdx !== -1) {
            // Found closing tag, skip tag content
            insideThink = false;
            i = closeIdx + "</think>".length;
          } else {
            // Entire remaining chunk is inside think, discard all
            break;
          }
        } else {
          // Not inside <think>
          const openIdx = chunk.indexOf("<think>", i);
          if (openIdx !== -1) {
            // Found opening tag, output content before tag
            output += buffer + chunk.slice(i, openIdx);
            buffer = "";
            insideThink = true;
            i = openIdx + "<think>".length;
          } else {
            // No <think> found, but chunk may end with incomplete "<thi..."
            // Buffer may contain incomplete tag fragment starting with "<"
            const potentialStart = findPartialTag(chunk, i);
            if (potentialStart !== -1) {
              output += buffer + chunk.slice(i, potentialStart);
              buffer = chunk.slice(potentialStart);
            } else {
              output += buffer + chunk.slice(i);
              buffer = "";
            }
            break;
          }
        }
      }

      return output;
    },

    /**
     * Call on stream end, flush remaining buffer content
     */
    flush(): string {
      const remaining = buffer;
      buffer = "";
      return remaining;
    },
  };
}

/**
 * Check if chunk[startIdx..] ends with an incomplete "<think>" prefix
 * e.g. "<", "<t", "<th", "<thi", "<thin", "<think"
 * Return start position of incomplete prefix, -1 if not found
 */
function findPartialTag(chunk: string, startIdx: number): number {
  const tag = "<think>";
  // Only need to check up to tag.length - 1 chars at the end
  const searchStart = Math.max(startIdx, chunk.length - (tag.length - 1));
  for (let i = searchStart; i < chunk.length; i++) {
    const remaining = chunk.slice(i);
    if (tag.startsWith(remaining)) {
      return i;
    }
  }
  return -1;
}
