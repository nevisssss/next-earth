'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import PathCards from '../components/PathCards/PathCards';
import SkillChips from '../components/SkillChips/SkillChips';
import type { PathChoice, RecommendRequest } from '../lib/types';

const PATH_STORAGE_KEY = 'renewus:selectedPath';
const PROFILE_STORAGE_KEY = 'renewus:profile';

const AGE_OPTIONS = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];

type ProfileDraft = RecommendRequest & { equityFlag: boolean };

function loadStoredProfile(): ProfileDraft | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.sessionStorage.getItem(PROFILE_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as ProfileDraft;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const fallbackPath = useMemo(() => {
    const urlPath = searchParams.get('path');
    if (urlPath === 'help_hospitals' || urlPath === 'post_disaster' || urlPath === 'green_workforce') {
      return urlPath as PathChoice;
    }

    if (typeof window !== 'undefined') {
      const stored = window.sessionStorage.getItem(PATH_STORAGE_KEY);
      if (stored === 'help_hospitals' || stored === 'post_disaster' || stored === 'green_workforce') {
        return stored as PathChoice;
      }
    }

    return 'post_disaster';
  }, [searchParams]);

  const storedProfile = useMemo(() => loadStoredProfile(), []);

  const [path, setPath] = useState<PathChoice>(storedProfile?.path ?? fallbackPath);
  const [country, setCountry] = useState<string>(storedProfile?.country ?? '');
  const [age, setAge] = useState<number>(storedProfile?.age ?? 19);
  const [skills, setSkills] = useState<string[]>(storedProfile?.skills ?? ['organizing']);
  const [language, setLanguage] = useState<string>(storedProfile?.language ?? '');
  const [equityFlag, setEquityFlag] = useState<boolean>(storedProfile?.equityFlag ?? false);
  const [error, setError] = useState<string | null>(null);
  const [countries, setCountries] = useState<string[]>([]);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [isLoadingCountries, setIsLoadingCountries] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.sessionStorage.setItem(PATH_STORAGE_KEY, path);
  }, [path]);

  useEffect(() => {
    let cancelled = false;

    async function loadCountries() {
      setIsLoadingCountries(true);
      setCountriesError(null);

      try {
        const response = await fetch('/api/countries');
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json() as { countries?: { name?: string }[] };
        const options = (data.countries ?? [])
          .map((entry) => entry?.name)
          .filter((name): name is string => Boolean(name));

        if (cancelled) {
          return;
        }

        setCountries(options);

        setCountry((current) => {
          if (storedProfile?.country && options.includes(storedProfile.country)) {
            return storedProfile.country;
          }

          if (!storedProfile?.country && current && options.includes(current)) {
            return current;
          }

          if (!storedProfile?.country && options.length > 0 && !current) {
            return options[0];
          }

          if (storedProfile?.country && !options.includes(storedProfile.country) && options.length > 0) {
            return options[0];
          }

          return current;
        });
      } catch (fetchError) {
        console.error('profile_country_load_failed', fetchError);
        if (!cancelled) {
          setCountriesError('We could not load the country list.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCountries(false);
        }
      }
    }

    loadCountries();

    return () => {
      cancelled = true;
    };
  }, [storedProfile?.country]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!path) {
      setError('Select how you want to help first.');
      return;
    }

    if (!country) {
      setError('Choose a country to continue.');
      return;
    }

    const payload: ProfileDraft = {
      path,
      country,
      age,
      skills,
      language: language || undefined,
      equityFlag,
    };

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(payload));
    }

    router.push('/suggestions');
  };

  return (
    <div className="min-h-screen bg-emerald-50/40 px-4 py-10 text-slate-900 sm:px-8">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-10">
        <header className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">Step 2</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Tell us about you</h1>
          <p className="max-w-2xl text-base text-slate-600">
            We combine your profile with local risk to surface three practical roles and learning boosts.
          </p>
        </header>

        <section className="grid gap-6">
          <h2 className="text-lg font-semibold text-slate-800">Confirm or adjust your path</h2>
          <PathCards selected={path} onSelect={setPath} />
        </section>

        <form onSubmit={handleSubmit} className="grid gap-8 rounded-2xl bg-white/80 p-6 shadow-lg sm:p-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Country
              <select
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                disabled={isLoadingCountries || countries.length === 0}
                className="w-full rounded-lg border border-emerald-200 bg-white px-4 py-3 text-base text-slate-800 focus:border-emerald-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                {isLoadingCountries ? (
                  <option value="" disabled>
                    Loading countries...
                  </option>
                ) : null}
                {!isLoadingCountries && countries.length === 0 ? (
                  <option value="" disabled>
                    No countries available
                  </option>
                ) : null}
                {countries.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {countriesError ? (
                <span className="text-xs text-red-600">{countriesError}</span>
              ) : null}
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Age
              <select
                value={age}
                onChange={(event) => setAge(Number(event.target.value))}
                className="w-full rounded-lg border border-emerald-200 bg-white px-4 py-3 text-base text-slate-800 focus:border-emerald-400 focus:outline-none"
              >
                {AGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-3 text-sm font-medium text-slate-700">
            Skills & strengths
            <SkillChips value={skills} onChange={setSkills} />
            <span className="text-xs font-normal text-slate-500">
              Add anything that feels relevant—first aid, carpentry, radio, teaching.
            </span>
          </label>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Preferred language (optional)
              <input
                type="text"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                placeholder="English"
                className="w-full rounded-lg border border-emerald-200 bg-white px-4 py-3 text-base text-slate-800 focus:border-emerald-400 focus:outline-none"
              />
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={equityFlag}
                onChange={(event) => setEquityFlag(event.target.checked)}
                className="mt-1 h-4 w-4 accent-emerald-600"
              />
              <span>
                I&apos;m in a high-risk or low-connectivity area. <br />
                <span className="text-xs text-slate-500">We use this to boost equity-focused matches.</span>
              </span>
            </label>
          </div>

          {error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="inline-flex items-center justify-center rounded-full border border-transparent px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              ← Back
            </button>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-8 py-3 text-base font-semibold text-white shadow transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            >
              Generate my matches
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
