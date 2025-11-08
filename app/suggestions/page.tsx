'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import RiskSummary from '../components/RiskSummary/RiskSummary';
import RoleCard from '../components/RoleCard/RoleCard';
import type { RecommendResponse, Recommendation, PathChoice, RecommendRequest } from '../lib/types';

const PROFILE_STORAGE_KEY = 'renewus:profile';

interface ProfileDraft extends RecommendRequest {
  equityFlag: boolean;
}

function loadProfileFromStorage(): ProfileDraft | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = window.sessionStorage.getItem(PROFILE_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as ProfileDraft;
    if (parsed && parsed.path) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

async function trackRoleClick(roleId: string, path: PathChoice, country: string) {
  try {
    await fetch('/api/recommend/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId, path, country }),
    });
  } catch (error) {
    console.warn('track_role_click_failed', error);
  }
}

export default function SuggestionsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileDraft | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [risk, setRisk] = useState<RecommendResponse['countryRisk'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadProfileFromStorage();
    if (!stored) {
      router.replace('/');
      return;
    }
    setProfile(stored);
  }, [router]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function fetchRecommendations() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Unable to fetch recommendations');
        }

        const data = (await response.json()) as RecommendResponse;
        if (!cancelled) {
          setRecommendations(data.recommendations);
          setRisk(data.countryRisk);
        }
      } catch (fetchError) {
        if (!cancelled) {
          console.error(fetchError);
          setError('We could not generate matches. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchRecommendations();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [profile]);

  const handleSavePlan = useCallback(async () => {
    if (!navigator.clipboard) {
      setToast('Clipboard access is not available in this browser.');
      return;
    }

    if (!profile) {
      return;
    }

    const lines = [
      'Renewus Climate Action Plan',
      `Path: ${profile.path.replace('_', ' ')}`,
      `Country: ${profile.country}`,
      `Age: ${profile.age}`,
      '',
    ];

    recommendations.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.title} (${Math.round(item.score * 100)}% match)`);
      item.microlearning.forEach((learning) => {
        lines.push(`   - ${learning.title}: ${learning.link}`);
      });
      lines.push(`   Why: ${item.why}`);
      lines.push('');
    });

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setToast('Plan copied! Share it with a mentor or friend.');
      setTimeout(() => setToast(null), 4000);
    } catch {
      setToast('Unable to copy right now. Try again later.');
    }
  }, [profile, recommendations]);

  const handleInterested = useCallback(
    (roleId: string) => {
      if (!profile) {
        return;
      }
      void trackRoleClick(roleId, profile.path, profile.country);
    },
    [profile],
  );

  const pageTitle = useMemo(() => {
    if (!profile) {
      return 'Finding the best fit roles…';
    }
    return `Top roles for ${profile.country}`;
  }, [profile]);

  return (
    <div className="min-h-screen bg-emerald-50/40 px-4 py-10 text-slate-900 sm:px-8">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">Step 3</p>
            <h1 className="text-3xl font-semibold sm:text-4xl">{pageTitle}</h1>
            {profile ? (
              <p className="max-w-2xl text-base text-slate-600">
                Based on {profile.country}, age {profile.age}, and skills {profile.skills.join(', ') || 'you shared'},
                here is your tailored climate action trio.
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleSavePlan}
            className="mt-2 inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            Save plan
          </button>
        </header>

        {toast ? <p className="rounded-xl bg-emerald-100 px-4 py-3 text-sm text-emerald-900 shadow">{toast}</p> : null}

        {error ? (
          <div className="rounded-2xl bg-red-50 px-6 py-6 text-red-700 shadow">
            <p className="font-semibold">{error}</p>
            <button
              type="button"
              onClick={() => {
                if (profile) {
                  setProfile({ ...profile });
                }
              }}
              className="mt-3 inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          </div>
        ) : null}

        {risk ? <RiskSummary risk={risk} /> : null}

        <section className="grid gap-6">
          {loading ? <p className="text-base text-slate-600">Crunching data…</p> : null}

          {!loading && recommendations.length === 0 ? (
            <p className="text-base text-slate-600">
              We couldn&apos;t find a strong match yet. Head back to update your skills or try another path.
            </p>
          ) : null}

          <div className="grid gap-6">
            {recommendations.map((item) => (
              <RoleCard key={item.id} recommendation={item} onInterested={handleInterested} />
            ))}
          </div>
        </section>

        <footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => router.push('/profile')}
            className="inline-flex items-center justify-center rounded-full border border-transparent px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            ← Edit profile
          </button>

          <button
            type="button"
            onClick={() => router.push('/updates')}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-slate-800"
          >
            See latest updates →
          </button>
        </footer>
      </main>
    </div>
  );
}
