'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import PathCards from './components/PathCards/PathCards';
import type { PathChoice } from './lib/types';

const STORAGE_KEY = 'renewus:selectedPath';

const PATH_VALUES: PathChoice[] = [
  'help_hospitals',
  'post_disaster',
  'green_workforce',
];

const isPathChoice = (value: string | null): value is PathChoice =>
  value !== null && PATH_VALUES.includes(value as PathChoice);

export default function Home() {
  const router = useRouter();
  const [selectedPath, setSelectedPath] = useState<PathChoice | undefined>(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    return isPathChoice(stored) ? stored : undefined;
  });

  useEffect(() => {
    router.prefetch('/profile');
  }, [router]);

  useEffect(() => {
    if (typeof window === 'undefined' || !selectedPath) {
      return;
    }

    window.sessionStorage.setItem(STORAGE_KEY, selectedPath);
  }, [selectedPath]);

  const handleSelect = (path: PathChoice) => {
    setSelectedPath(path);
  };

  const handleContinue = () => {
    if (!selectedPath) {
      return;
    }

    router.push(`/profile?path=${selectedPath}`);
  };

  const pathDescription = useMemo(() => {
    switch (selectedPath) {
      case 'help_hospitals':
        return 'Pair frontline medical facilities with rapid-response helpers.';
      case 'post_disaster':
        return 'Coordinate volunteer energy for recovery and resilience.';
      case 'green_workforce':
        return 'Grow your career in sustainable infrastructure and jobs.';
      default:
        return 'Choose the path that best matches how you want to help.';
    }
  }, [selectedPath]);

  return (
    <div className="min-h-screen bg-emerald-50/40 text-slate-900">
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-12 px-6 py-16 sm:px-10 lg:px-16">
        <section className="flex flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">
            Renewus
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Match your skills to climate action in under a minute.
          </h1>
          <p className="max-w-2xl text-lg text-slate-600 sm:text-xl">
            Start by selecting the impact path that speaks to you. We will pair it
            with local risk data and tailored learning nudges.
          </p>
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="text-xl font-semibold text-slate-800">1. Pick your path</h2>
          <PathCards selected={selectedPath} onSelect={handleSelect} />
          <p className="rounded-lg border border-emerald-200 bg-white/70 p-4 text-sm text-emerald-900 shadow-sm">
            {pathDescription}
          </p>
        </section>

        <section className="mt-auto flex flex-col items-start gap-3 pb-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">
            You can refine your country, age, and skills on the next screen.
          </div>
          <button
            type="button"
            onClick={handleContinue}
            disabled={!selectedPath}
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-8 py-3 text-base font-medium text-white shadow transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-200"
          >
            Continue to your profile
          </button>
        </section>
      </main>
    </div>
  );
}
