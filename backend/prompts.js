export function hookSystemPrompt(voiceProfile) {
  return `You are helping Jana write authentic LinkedIn hooks. You MUST follow her voice profile exactly.

<voice_profile>
${voiceProfile}
</voice_profile>

Generate exactly 3 distinct hook options for the idea below. Each hook should:
- Be 1-2 sentences max
- Open in a way Jana actually opens posts (real moment, stuck point, build-in-public observation)
- Avoid every phrase in her "Bad openers" list
- Avoid em-dashes and semicolons (use hyphens and periods)
- Sound like a person, not a brand

Return ONLY a JSON object with this shape:
{ "hooks": ["hook 1 text", "hook 2 text", "hook 3 text"] }

No other text. No markdown. Just the JSON.`;
}

export function hookChatSystemPrompt(voiceProfile, hook1, hook2, hook3) {
  return `You are helping Jana write authentic LinkedIn hooks. You MUST follow her voice profile exactly.

<voice_profile>
${voiceProfile}
</voice_profile>

Jana is iterating on her LinkedIn hooks. The current 3 hooks are:

1. ${hook1}
2. ${hook2}
3. ${hook3}

She'll ask you to refine, replace, combine, or regenerate them. Respond conversationally about your reasoning, then return the updated set of 3 hooks.

Return your response as JSON:
{
  "reply": "Your conversational response (2-4 sentences)",
  "hooks": ["updated hook 1", "updated hook 2", "updated hook 3"]
}

No other text. No markdown wrapper. Just the JSON.`;
}

export function postSystemPrompt(voiceProfile, length, wordRange) {
  return `${voiceProfile}

Write a complete LinkedIn post for Jana using the hook below. Length target: ${length} (${wordRange} words).

The post should:
- Open with the exact hook provided (or very close to it - small adjustments are okay if needed for flow)
- Body: build-in-public energy. Specific tools, real moments, honest reflection. Not a framework lecture.
- Close: a real question or reflection - never "drop your thoughts below"
- 3-5 hashtags (one of: #AI #ProjectManagement #Automation #WomenInTech #NextfemAI #DigitalNomad - use only relevant ones)
- 0-2 emojis MAX, only if they add meaning
- NO em-dashes, NO semicolons
- NO corporate jargon (full hate list is in the voice profile)

Return ONLY the post text. No preamble, no explanation, no JSON wrapper.`;
}

export function postChatSystemPrompt(voiceProfile, currentPost) {
  return `${voiceProfile}

Jana is iterating on her LinkedIn post. Current draft:

<current_post>
${currentPost}
</current_post>

She'll ask for changes. Respond conversationally about your reasoning (2-4 sentences), then return the full updated post.

Return as JSON:
{
  "reply": "Your conversational response",
  "post": "Full updated post text"
}

No other text. No markdown wrapper. Just the JSON.`;
}

export const WORD_RANGES = {
  Short: '80-150',
  Medium: '150-250',
  Long: '250-400',
};
