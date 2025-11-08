'use client';

import { useEffect, useMemo, useState } from 'react';

import NewsList from '../components/NewsList/NewsList';
import type { NewsItem, RecommendRequest } from '../lib/types';

const PROFILE_STORAGE_KEY = 'renewus:profile';

interface ProfileDraft extends RecommendRequest {
  equityFlag: boolean;
}

function loadProfile(): ProfileDraft | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = window.sessionStorage.getItem(PROFILE_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as ProfileDraft;
    return parsed;
  } catch {
    return null;
  }
}

const TOPICS = [
  { value: 'climate', label: 'Climate & adaptation' },
  { value: 'disaster', label: 'Disaster response' },
  { value: 'training', label: 'Training opportunities' },
];

export default function UpdatesPage() {
  const [profile] = useState<ProfileDraft | null>(() => loadProfile());
  const [country, setCountry] = useState<string>(profile?.country ?? 'Philippines');
  const [topic, setTopic] = useState<string>('climate');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => {
    if (!profile) {
      return 'Fresh climate action updates';
    }
    return `Updates for ${profile.country}`;
  }, [profile]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function fetchNews() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ country, topic });
        const response = await fetch(`/api/news?${params.toString()}`, { signal: controller.signal });
        if (!response.ok) {
          throw new Error('Request failed');
        }
        const data = (await response.json()) as { items: NewsItem[] };
        if (!cancelled) {
          setNews(data.items);
        }
      } catch (fetchError) {
        if (!cancelled) {
          console.error(fetchError);
          setError('We could not load updates right now.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchNews();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [country, topic]);

  return (
    <div className="min-h-screen bg-emerald-50/40 px-4 py-10 text-slate-900 sm:px-8">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">Step 4</p>
            <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
            <p className="max-w-2xl text-base text-slate-600">
              Stay ahead with local headlines, alerts, and training links tuned to your focus area.
            </p>
          </div>
          <a
            href="/suggestions"
            className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-emerald-700 shadow transition hover:bg-emerald-100"
          >
            ← Back to matches
          </a>
        </header>

        <section className="flex flex-col gap-6 rounded-2xl bg-white/80 p-6 shadow-lg sm:flex-row sm:items-end sm:justify-between sm:p-8">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Country
            <select
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className="w-full rounded-lg border border-emerald-200 bg-white px-4 py-3 text-base text-slate-800 focus:border-emerald-400 focus:outline-none"
            >
              {[country, 'Philippines', 'Kenya', 'India'].filter((value, index, self) => self.indexOf(value) === index).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Focus
            <select
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              className="w-full rounded-lg border border-emerald-200 bg-white px-4 py-3 text-base text-slate-800 focus:border-emerald-400 focus:outline-none"
            >
              {TOPICS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </section>

        {loading ? <p className="text-base text-slate-600">Loading updates…</p> : null}
        {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

        <NewsList items={news} />

        <footer className="rounded-2xl bg-emerald-100 px-6 py-6 text-sm text-emerald-900 shadow">
          <p className="m-0 font-semibold">More coming soon</p>
          <p className="mt-2 text-emerald-900/80">
            Imagine adding SMS alerts, WhatsApp digests, and direct partner feeds from trusted NGOs. This MVP keeps it simple but
            designed for field use.
          </p>
        </footer>
      </main>
    </div>
  );
}
