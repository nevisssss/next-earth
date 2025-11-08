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
      { title: 'Shelter Ops 101', link: 'https://humanitarian.atlassian.net/wiki/spaces/Shelter/overview' },
      { title: 'Emergency Comms 101', link: 'https://www.ifrc.org/resources/emergency-communication-guidelines' },
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
    title: 'Community Health Clinic Support',
    path: 'help_hospitals',
    skills: ['first aid', 'record keeping', 'communication'],
    hazard_fit: { flood: 0.6, cyclone: 0.5, heat: 0.4 },
    microlearning: [
      { title: 'Community Health Essentials', link: 'https://www.who.int/health-topics/community-health' },
    ],
  },
  {
    id: 'role_04',
    title: 'Emergency Logistics Runner',
    path: 'post_disaster',
    skills: ['organizing', 'coordination', 'communication'],
    hazard_fit: { flood: 0.8, cyclone: 0.7, heat: 0.5 },
    microlearning: [
      { title: 'Logistics in Emergencies', link: 'https://www.wfp.org/publications/logistics-emergencies' },
    ],
  },
  {
    id: 'role_05',
    title: 'Climate Resilient Agriculture Aide',
    path: 'green_workforce',
    skills: ['community outreach', 'agriculture', 'organizing'],
    hazard_fit: { flood: 0.6, cyclone: 0.4, heat: 0.7 },
    microlearning: [
      { title: 'Climate Smart Agriculture Overview', link: 'https://www.fao.org/climate-smart-agriculture/en/' },
    ],
  },
  {
    id: 'role_06',
    title: 'Solar Maintenance Trainee',
    path: 'green_workforce',
    skills: ['basic tools', 'safety', 'electrical aptitude'],
    hazard_fit: { flood: 0.4, cyclone: 0.5, heat: 0.7 },
    microlearning: [
      { title: 'Intro to Solar Safety (2h)', link: 'https://www.solarenergy.org/training-resources/' },
    ],
  },
  {
    id: 'role_07',
    title: 'Hospital Triage Support',
    path: 'help_hospitals',
    skills: ['first aid', 'communication', 'calm under pressure'],
    hazard_fit: { flood: 0.5, cyclone: 0.6, heat: 0.4 },
    microlearning: [
      { title: 'Basics of Triage', link: 'https://www.cdc.gov/cpr/readiness/healthcare/triage.htm' },
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
    title: 'Community Resilience Workshop Host',
    path: 'green_workforce',
    skills: ['communication', 'facilitation', 'organizing'],
    hazard_fit: { flood: 0.5, cyclone: 0.4, heat: 0.6 },
    microlearning: [
      { title: 'Resilience Training Toolkit', link: 'https://www.preparecenter.org/toolkit/' },
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

