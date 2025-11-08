import { NextResponse } from 'next/server';
import type { NewsItem } from '@/app/lib/types';

interface NewsEntry extends NewsItem {
  country: string;
  topics: string[];
}

const NEWS_DATA: NewsEntry[] = [
  {
    country: 'Philippines',
    topics: ['climate', 'disaster'],
    title: 'Philippines expands community-led flood early warning pilots',
    source: 'ASEAN News',
    url: 'https://asean.org/community-flood-warning-philippines',
    publishedAt: '2024-07-08T09:30:00Z',
  },
  {
    country: 'Philippines',
    topics: ['disaster'],
    title: 'Cyclone-prep volunteers complete rapid shelter training in Eastern Visayas',
    source: 'Relief Watch',
    url: 'https://reliefwatch.example/ph-shelter-training',
    publishedAt: '2024-07-11T12:05:00Z',
  },
  {
    country: 'Philippines',
    topics: ['training', 'climate'],
    title: 'DOE opens 200 slots for solar maintenance trainees under green jobs push',
    source: 'Energy Pulse',
    url: 'https://energy.gov.ph/solar-trainee-call',
    publishedAt: '2024-07-02T08:00:00Z',
  },
  {
    country: 'Kenya',
    topics: ['climate'],
    title: 'Kenyan youth groups launch heatwave-ready cooling centers in Nairobi',
    source: 'Daily Climate',
    url: 'https://dailyclimate.example/ke-cooling-centers',
    publishedAt: '2024-07-06T07:15:00Z',
  },
  {
    country: 'Kenya',
    topics: ['training'],
    title: 'AgriTech hub offers climate-smart agriculture bootcamp for dryland farmers',
    source: 'AgriTech Hub',
    url: 'https://agritechhub.example/bootcamp',
    publishedAt: '2024-06-28T10:00:00Z',
  },
  {
    country: 'Kenya',
    topics: ['disaster'],
    title: 'Red Cross mobilises rapid assessment teams after Tana River floods',
    source: 'Kenya Red Cross',
    url: 'https://redcross.example/tana-river-update',
    publishedAt: '2024-07-09T15:45:00Z',
  },
  {
    country: 'India',
    topics: ['climate'],
    title: 'Community mangrove brigades restore 25 hectares in Odisha',
    source: 'Coastal Resilience',
    url: 'https://coastalresilience.example/odisha-mangroves',
    publishedAt: '2024-07-05T05:30:00Z',
  },
  {
    country: 'India',
    topics: ['training'],
    title: 'National Skill Mission adds resilient construction apprenticeship track',
    source: 'Skill Mission',
    url: 'https://skillmission.example/resilient-construction',
    publishedAt: '2024-07-01T11:20:00Z',
  },
  {
    country: 'India',
    topics: ['disaster'],
    title: 'Cyclone readiness drill engages 1,500 volunteers in Andhra Pradesh',
    source: 'Disaster Ready',
    url: 'https://disasterready.example/andhra-drill',
    publishedAt: '2024-07-10T13:00:00Z',
  },
];

function normalise(value: string | null): string {
  return value ? value.trim().toLowerCase() : '';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const countryParam = normalise(searchParams.get('country'));
  const topicParam = normalise(searchParams.get('topic'));

  const items = NEWS_DATA.filter((item) => {
    const matchesCountry = countryParam ? item.country.toLowerCase() === countryParam : true;
    const matchesTopic = topicParam ? item.topics.includes(topicParam) : true;
    return matchesCountry && matchesTopic;
  }).map((item) => ({
    title: item.title,
    source: item.source,
    url: item.url,
    publishedAt: item.publishedAt,
  } satisfies NewsItem));

  return NextResponse.json({ items });
}
