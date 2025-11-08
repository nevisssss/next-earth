import { RecommendRequest, RecommendResponse, Role, RiskSnapshot } from './types';
import {
  getDefaultRiskSnapshot,
  getRiskSnapshots,
  getRoles,
  isValidPath,
} from './data';

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
  const secondSentence = `ASDI/NOAA data and your ${skillsPhrase} align well with this role.`;

  return `${firstSentence} ${secondSentence}`;
}

export async function recommend(request: RecommendRequest): Promise<RecommendResponse> {
  const normalizedPath = request.path;
  if (!isValidPath(normalizedPath)) {
    throw new Error('Invalid path choice');
  }

  const riskSnapshots = await getRiskSnapshots();
  const roles = await getRoles();

  const normalizedSkills = uniqueSkills(request.skills ?? []);

  const risk = riskSnapshots.find((snapshot) => snapshot.country.toLowerCase() === request.country.toLowerCase())
    ?? getDefaultRiskSnapshot();

  const candidates = roles.filter((role) => role.path === normalizedPath);
  const pool = candidates.length > 0 ? candidates : roles;

  const scored = pool.map((role) => {
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

  const recommendations = scored.map(({ role, score }) => ({
    id: role.id,
    title: role.title,
    score: Number(score.toFixed(4)),
    microlearning: role.microlearning,
    why: buildSupportiveWhy(role, risk, normalizedSkills, request),
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

