import fs from 'node:fs/promises';
import path from 'node:path';
import { CountryRecord, PathChoice, RiskSnapshot, Role } from './types';

const RISK_FILE = path.join(process.cwd(), 'data', 'risk_by_country.json');
const ROLES_FILE = path.join(process.cwd(), 'data', 'roles.json');
const COUNTRY_FILE = path.join(process.cwd(), 'data', 'csvjson.json');

let cachedRisk: RiskSnapshot[] | null = null;
let cachedRoles: Role[] | null = null;
let cachedCountries: CountryRecord[] | null = null;

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function ensureDataset<T>(data: T[] | null, label: string): T[] {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`${label} dataset is missing or empty.`);
  }
  return data;
}

function normalizeCountry(entry: unknown): CountryRecord | null {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const record = entry as Record<string, unknown>;
  const name = [record.country, record.Country, record.name]
    .find((value) => typeof value === 'string') as string | undefined;
  const iso2 = [record.iso2, record.ISO2]
    .find((value) => typeof value === 'string') as string | undefined;
  const iso3 = [record.iso3, record.ISO3]
    .find((value) => typeof value === 'string') as string | undefined;

  if (!name || !iso2 || !iso3) {
    return null;
  }

  const region = [record.region, record.Region]
    .find((value) => typeof value === 'string') as string | undefined;
  const incomeGroup = [record.incomeGroup, record.income_group, record.IncomeGroup]
    .find((value) => typeof value === 'string') as string | undefined;

  const populationRaw = [record.population, record.Population]
    .find((value) => typeof value === 'number' || typeof value === 'string');
  const population = typeof populationRaw === 'number'
    ? populationRaw
    : typeof populationRaw === 'string' && populationRaw.trim().length > 0
      ? Number.parseInt(populationRaw, 10)
      : undefined;

  return {
    name,
    iso2: iso2.toUpperCase(),
    iso3: iso3.toUpperCase(),
    region: region,
    incomeGroup,
    population: Number.isFinite(population) ? population : undefined,
  };
}

export async function getRiskSnapshots(): Promise<RiskSnapshot[]> {
  if (cachedRisk) {
    return cachedRisk;
  }

  const fileData = await readJsonFile<RiskSnapshot[]>(RISK_FILE);
  cachedRisk = ensureDataset(fileData, 'Risk');
  return cachedRisk;
}

export async function getRoles(): Promise<Role[]> {
  if (cachedRoles) {
    return cachedRoles;
  }

  const fileData = await readJsonFile<Role[]>(ROLES_FILE);
  cachedRoles = ensureDataset(fileData, 'Role');
  return cachedRoles;
}

export async function getCountries(): Promise<CountryRecord[]> {
  if (cachedCountries) {
    return cachedCountries;
  }

  const fileData = await readJsonFile<unknown[]>(COUNTRY_FILE);
  const normalized = ensureDataset(fileData, 'Country')
    .map((entry) => normalizeCountry(entry))
    .filter((entry): entry is CountryRecord => Boolean(entry));

  if (normalized.length === 0) {
    throw new Error('Country dataset is missing or empty.');
  }

  cachedCountries = normalized.sort((a, b) => a.name.localeCompare(b.name));
  return cachedCountries;
}

export function invalidateCaches() {
  cachedRisk = null;
  cachedRoles = null;
  cachedCountries = null;
}

export function getRoleById(roleId: string, roles: Role[]): Role | undefined {
  return roles.find((role) => role.id === roleId);
}

export function isValidPath(path: string): path is PathChoice {
  return path === 'help_hospitals' || path === 'post_disaster' || path === 'green_workforce';
}

