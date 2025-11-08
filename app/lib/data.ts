import fs from 'node:fs/promises';
import path from 'node:path';
import { PathChoice, RiskSnapshot, Role } from './types';

const RISK_FILE = path.join(process.cwd(), 'data', 'risk_by_country.json');
const ROLES_FILE = path.join(process.cwd(), 'data', 'roles.json');

let cachedRisk: RiskSnapshot[] | null = null;
let cachedRoles: Role[] | null = null;

const fallbackRisk: RiskSnapshot[] = [
  { country: 'Philippines', flood: 0.8, cyclone: 0.9, heat: 0.4, source: 'ASDI/NOAA' },
  { country: 'Kenya', flood: 0.6, cyclone: 0.2, heat: 0.7, source: 'ASDI/NOAA' },
  { country: 'India', flood: 0.7, cyclone: 0.6, heat: 0.8, source: 'ASDI/NOAA' },
];

const fallbackRoles: Role[] = [
  {
    id: 'role_01',
    title: 'Community Shelter Coordinator Assistant',
    path: 'post_disaster',
    skills: ['first aid', 'organizing', 'communication'],
    hazard_fit: { flood: 0.9, cyclone: 0.8, heat: 0.2 },
    microlearning: [
      { title: 'Shelter Operations 101', link: 'https://humanitarian.atlassian.net/wiki/spaces/Shelter/overview' },
      { title: 'Emergency Comms Basics', link: 'https://www.ifrc.org/resources/emergency-communication-guidelines' },
    ],
  },
  {
    id: 'role_02',
    title: 'Rapid Needs Assessment Volunteer',
    path: 'post_disaster',
    skills: ['data collection', 'observation', 'communication'],
    hazard_fit: { flood: 0.7, cyclone: 0.6, heat: 0.3 },
    microlearning: [
      { title: 'Disaster Assessment Basics', link: 'https://www.unisdr.org/files/2758_FieldManualVersion20.pdf' },
    ],
  },
  {
    id: 'role_03',
    title: 'Emergency Logistics Runner',
    path: 'post_disaster',
    skills: ['organizing', 'coordination', 'communication'],
    hazard_fit: { flood: 0.8, cyclone: 0.7, heat: 0.5 },
    microlearning: [
      { title: 'Logistics in Emergencies', link: 'https://www.wfp.org/publications/logistics-emergencies' },
    ],
  },
  {
    id: 'role_04',
    title: 'Disaster Relief Radio Operator',
    path: 'post_disaster',
    skills: ['radio', 'communication', 'coordination'],
    hazard_fit: { flood: 0.6, cyclone: 0.8, heat: 0.3 },
    microlearning: [
      { title: 'Humanitarian Radio Intro', link: 'https://www.humanitarianresponse.info/en/operations/global/telecommunications' },
    ],
  },
  {
    id: 'role_05',
    title: 'Relief Supplies Inventory Lead',
    path: 'post_disaster',
    skills: ['organizing', 'inventory', 'documentation'],
    hazard_fit: { flood: 0.7, cyclone: 0.5, heat: 0.4 },
    microlearning: [
      { title: 'Warehouse Management 101', link: 'https://www.humanitarianlogistics.org/' },
    ],
  },
  {
    id: 'role_06',
    title: 'Hospital Triage Support',
    path: 'help_hospitals',
    skills: ['first aid', 'communication', 'calm under pressure'],
    hazard_fit: { flood: 0.5, cyclone: 0.6, heat: 0.4 },
    microlearning: [
      { title: 'Basics of Triage', link: 'https://www.cdc.gov/cpr/readiness/healthcare/triage.htm' },
    ],
  },
  {
    id: 'role_07',
    title: 'Mobile Clinic Volunteer',
    path: 'help_hospitals',
    skills: ['first aid', 'community outreach', 'transport'],
    hazard_fit: { flood: 0.6, cyclone: 0.5, heat: 0.6 },
    microlearning: [
      { title: 'Mobile Health Readiness', link: 'https://www.who.int/initiatives/mobile-health' },
    ],
  },
  {
    id: 'role_08',
    title: 'Cooling Center Organizer',
    path: 'help_hospitals',
    skills: ['organizing', 'community outreach', 'communication'],
    hazard_fit: { flood: 0.3, cyclone: 0.2, heat: 0.9 },
    microlearning: [
      { title: 'Extreme Heat Response', link: 'https://www.cdc.gov/disasters/extremeheat/index.html' },
    ],
  },
  {
    id: 'role_09',
    title: 'Hospital Supply Chain Tracker',
    path: 'help_hospitals',
    skills: ['inventory', 'spreadsheets', 'communication'],
    hazard_fit: { flood: 0.5, cyclone: 0.4, heat: 0.4 },
    microlearning: [
      { title: 'Health Supply Logistics', link: 'https://openwho.org/courses/health-logistics' },
    ],
  },
  {
    id: 'role_10',
    title: 'Patient Navigation Volunteer',
    path: 'help_hospitals',
    skills: ['communication', 'language support', 'empathy'],
    hazard_fit: { flood: 0.4, cyclone: 0.5, heat: 0.5 },
    microlearning: [
      { title: 'Basics of Patient Navigation', link: 'https://navigation.academy/navigation-basics' },
    ],
  },
  {
    id: 'role_11',
    title: 'Solar Maintenance Trainee',
    path: 'green_workforce',
    skills: ['basic tools', 'safety', 'electrical aptitude'],
    hazard_fit: { flood: 0.4, cyclone: 0.5, heat: 0.7 },
    microlearning: [
      { title: 'Intro to Solar Safety', link: 'https://www.solarenergy.org/training-resources/' },
    ],
  },
  {
    id: 'role_12',
    title: 'Climate Smart Agriculture Aide',
    path: 'green_workforce',
    skills: ['community outreach', 'agriculture', 'organizing'],
    hazard_fit: { flood: 0.6, cyclone: 0.4, heat: 0.7 },
    microlearning: [
      { title: 'Climate Smart Agriculture Overview', link: 'https://www.fao.org/climate-smart-agriculture/en/' },
    ],
  },
  {
    id: 'role_13',
    title: 'Community Energy Auditor',
    path: 'green_workforce',
    skills: ['data collection', 'communication', 'basic math'],
    hazard_fit: { flood: 0.5, cyclone: 0.3, heat: 0.6 },
    microlearning: [
      { title: 'Household Energy Survey', link: 'https://www.energypedia.info/wiki/Household_Energy_Surveys' },
    ],
  },
  {
    id: 'role_14',
    title: 'Mangrove Restoration Crew',
    path: 'green_workforce',
    skills: ['field work', 'teamwork', 'ecology'],
    hazard_fit: { flood: 0.8, cyclone: 0.6, heat: 0.5 },
    microlearning: [
      { title: 'Mangrove Basics', link: 'https://www.conservation.org/priorities/mangroves' },
    ],
  },
  {
    id: 'role_15',
    title: 'Green Construction Apprentice',
    path: 'green_workforce',
    skills: ['basic tools', 'safety', 'learning mindset'],
    hazard_fit: { flood: 0.5, cyclone: 0.4, heat: 0.6 },
    microlearning: [
      { title: 'Intro to Resilient Construction', link: 'https://www.fema.gov/emergency-managers/risk-management/building-science' },
    ],
  },
];

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function getRiskSnapshots(): Promise<RiskSnapshot[]> {
  if (cachedRisk) {
    return cachedRisk;
  }

  const fileData = await readJsonFile<RiskSnapshot[]>(RISK_FILE);
  cachedRisk = Array.isArray(fileData) && fileData.length > 0 ? fileData : fallbackRisk;
  return cachedRisk;
}

export async function getRoles(): Promise<Role[]> {
  if (cachedRoles) {
    return cachedRoles;
  }

  const fileData = await readJsonFile<Role[]>(ROLES_FILE);
  cachedRoles = Array.isArray(fileData) && fileData.length > 0 ? fileData : fallbackRoles;
  return cachedRoles;
}

export function invalidateCaches() {
  cachedRisk = null;
  cachedRoles = null;
}

export function getRoleById(roleId: string, roles: Role[]): Role | undefined {
  return roles.find((role) => role.id === roleId);
}

export function getDefaultRiskSnapshot(): RiskSnapshot {
  return { country: 'Unknown', flood: 0.5, cyclone: 0.5, heat: 0.5, source: 'ASDI/NOAA (default)' };
}

export function isValidPath(path: string): path is PathChoice {
  return path === 'help_hospitals' || path === 'post_disaster' || path === 'green_workforce';
}

