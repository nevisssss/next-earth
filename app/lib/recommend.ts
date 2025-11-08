import { RecommendRequest, RecommendResponse, Role, RiskSnapshot } from './types';
import { getRiskSnapshots, getRoles, isValidPath } from './data';

const EQUITY_BONUS = 0.1;

const hazardWeights: Record<keyof Role['hazard_fit'], number> = {
  flood: 0.5,
  cyclone: 0.3,
  heat: 0.2,
};

const hazardDescription: Record<keyof Role['hazard_fit'], string> = {
  flood: 'flood',
  cyclone: 'cyclone',
  heat: 'extreme heat',
};

function normalizeSkill(skill: string): string | null {
  const normalized = skill?.toLowerCase().trim();
  return normalized ? normalized : null;
}

function uniqueSkills(skills: string[]): string[] {
  const set = new Set<string>();
  skills.forEach((skill) => {
    const normalized = normalizeSkill(skill);
    if (normalized) {
      set.add(normalized);
    }
  });
  return Array.from(set);
}

function jaccardSimilarity(userSkills: string[], roleSkills: string[]): number {
  if (userSkills.length === 0 || roleSkills.length === 0) {
    return 0;
  }
  const roleNormalized = uniqueSkills(roleSkills);
  const intersection = userSkills.filter((skill) => roleNormalized.includes(skill));
  const union = new Set([...userSkills, ...roleNormalized]);
  return union.size === 0 ? 0 : intersection.length / union.size;
}

function computeHazardFit(role: Role, risk: RiskSnapshot): number {
  return (role.hazard_fit.flood * risk.flood * hazardWeights.flood +
    role.hazard_fit.cyclone * risk.cyclone * hazardWeights.cyclone +
    role.hazard_fit.heat * risk.heat * hazardWeights.heat);
}

function clampScore(score: number): number {
  if (Number.isNaN(score)) {
    return 0;
  }
  if (score < 0) {
    return 0;
  }
  if (score > 1) {
    return 1;
  }
  return score;
}

function formatHazardList(hazards: string[]): string {
  if (hazards.length === 0) {
    return '';
  }
  if (hazards.length === 1) {
    return hazards[0];
  }
  if (hazards.length === 2) {
    return `${hazards[0]} and ${hazards[1]}`;
  }
  return `${hazards[0]}, ${hazards[1]}, and ${hazards[2]}`;
}

function selectTopHazards(role: Role, risk: RiskSnapshot, limit = 2): string[] {
  const hazardScores = (Object.keys(role.hazard_fit) as (keyof Role['hazard_fit'])[])
    .map((key) => ({ key, score: role.hazard_fit[key] * risk[key] }))
    .sort((a, b) => b.score - a.score);

  const filtered = hazardScores.filter((entry) => entry.score >= 0.3);
  const selected = (filtered.length > 0 ? filtered : hazardScores).slice(0, limit);
  return selected.map((entry) => hazardDescription[entry.key]);
}

function buildSupportiveWhy(
  role: Role,
  risk: RiskSnapshot,
  userSkills: string[],
  request: RecommendRequest,
): string {
  if (!risk) {
    return 'Based on limited data, this is a general fit.';
  }

  const hazardList = selectTopHazards(role, risk);
  const roleSkillSet = role.skills
    .map((skill) => normalizeSkill(skill))
    .filter((skill): skill is string => Boolean(skill));
  const matchingSkills = userSkills.filter((skill) => roleSkillSet.includes(skill));

  if (hazardList.length === 0 && matchingSkills.length === 0) {
    return `Based on limited data, this is a general fit.`;
  }

  const hazardPhrase = hazardList.length > 0
    ? `${formatHazardList(hazardList)} risks in ${request.country || 'your area'}`
    : 'local needs';

  const skillsPhrase = matchingSkills.length > 0
    ? `${matchingSkills.length === 1 ? matchingSkills[0] : formatHazardList(matchingSkills)} skills`
    : 'your willingness to learn';

  const firstSentence = `${hazardPhrase} make the ${role.title.toLowerCase()} impactful for you.`;
  const secondSentence = `${risk.source} data and your ${skillsPhrase} align well with this role.`;

  return `${firstSentence} ${secondSentence}`;
}

export async function recommend(request: RecommendRequest): Promise<RecommendResponse> {
  const normalizedPath = request.path;
  if (!isValidPath(normalizedPath)) {
    throw new Error('Invalid path choice');
  }

  const riskSnapshots = await getRiskSnapshots();
  const roles = await getRoles();

  if (!riskSnapshots || riskSnapshots.length === 0) {
    throw new Error('Risk dataset is not configured.');
  }

  const normalizedSkills = uniqueSkills(request.skills ?? []);

  const fallbackRisk = riskSnapshots[0];
  const risk = riskSnapshots.find((snapshot) => snapshot.country.toLowerCase() === request.country.toLowerCase())
    ?? fallbackRisk;

  const candidates = roles.filter((role) => role.path === normalizedPath);
  const pool = candidates.length > 0 ? candidates : roles;

  const scored: ScoredRole[] = pool.map((role) => {
    const hazardFit = computeHazardFit(role, risk);
    const skillOverlap = jaccardSimilarity(normalizedSkills, role.skills);
    const equityBoost = request.equityFlag ? EQUITY_BONUS : 0;
    const rawScore = 0.4 * hazardFit + 0.4 * skillOverlap + 0.2 * equityBoost;
    const score = clampScore(rawScore);

    return {
      role,
      score,
      hazardFit,
      skillOverlap,
    };
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  let aiWhys: string[] | null = null;

  try {
    aiWhys = await generateAiWhyStatements(request, risk, scored, normalizedSkills);
  } catch (error) {
    console.error('ai_why_generation_failed', error);
  }

  const recommendations = scored.map(({ role, score }, index) => ({
    id: role.id,
    title: role.title,
    score: Number(score.toFixed(4)),
    microlearning: role.microlearning,
    why: aiWhys?.[index] ?? buildSupportiveWhy(role, risk, normalizedSkills, request),
  }));

  return {
    countryRisk: {
      flood: Number(risk.flood.toFixed(2)),
      cyclone: Number(risk.cyclone.toFixed(2)),
      heat: Number(risk.heat.toFixed(2)),
      source: risk.source,
    },
    recommendations,
  };
}

const SYSTEM_PROMPT = `You are Renewus, a concise and reliable climate-action guide. You never invent jobs or links. You ONLY choose from the provided roles list and the country risk object.

When given:
- user path (post_disaster | green_workforce | help_hospitals),
- user country,
- user age and skills,
- countryRisk = { flood, cyclone, heat, source },
- top 3 role objects (title, skills, microlearning[]),

Do:
1) For each role, produce a 1-2 sentence "why this fits here" that references the strongest hazards (e.g., high flood/cyclone), connects the user's skills to the role, and cites the risk source name once (e.g., "ASDI/NOAA data").
2) Keep the tone supportive, not alarmist. No extra roles or links.
3) Output JSON with only the why strings matching the 3 roles in order.

If data is missing, say "Based on limited data, this is a general fit."`;

type ScoredRole = {
  role: Role;
  score: number;
  hazardFit: number;
  skillOverlap: number;
};

function buildAiPayload(
  request: RecommendRequest,
  risk: RiskSnapshot,
  scored: ScoredRole[],
  normalizedSkills: string[],
) {
  return {
    path: request.path,
    country: request.country,
    age: request.age,
    skills: normalizedSkills,
    language: request.language ?? null,
    equityFlag: Boolean(request.equityFlag),
    countryRisk: {
      flood: Number(risk.flood.toFixed(2)),
      cyclone: Number(risk.cyclone.toFixed(2)),
      heat: Number(risk.heat.toFixed(2)),
      source: risk.source,
    },
    roles: scored.map(({ role }) => ({
      id: role.id,
      title: role.title,
      skills: role.skills,
      microlearning: role.microlearning,
    })),
  };
}

async function generateAiWhyStatements(
  request: RecommendRequest,
  risk: RiskSnapshot,
  scored: ScoredRole[],
  normalizedSkills: string[],
): Promise<string[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  if (scored.length === 0) {
    return [];
  }

  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  const payload = buildAiPayload(request, risk, scored, normalizedSkills);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 300,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: JSON.stringify({ prompt: 'Return an object {"whys": ["..."]} with exactly one why per role.', payload }),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI response missing content.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error(`OpenAI response was not valid JSON: ${error instanceof Error ? error.message : 'unknown error'}`);
  }

  const whys = Array.isArray((parsed as { whys?: unknown[] }).whys)
    ? (parsed as { whys: unknown[] }).whys
    : Array.isArray(parsed)
      ? parsed
      : null;

  if (!whys || whys.length !== scored.length) {
    throw new Error('OpenAI response did not include the expected number of explanations.');
  }

  return whys.map((entry) => (typeof entry === 'string' ? entry : String(entry)));
}

