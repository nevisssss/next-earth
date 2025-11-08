# Renewus – Climate Action Planner

Renewus is a hackathon-ready Next.js MVP that pairs youth (and any motivated neighbour) with climate-action roles in under a minute. The experience stitches together lightweight datasets, a transparent hybrid matcher, and supportive micro-learning nudges so teams can demo impact quickly.

## ✨ What you ship in one screenful

1. **Path selection** – choose between helping hospitals, supporting post-disaster communities, or joining the green workforce.
2. **Your profile** – share country, age, skills, language, and equity context.
3. **Recommendations** – receive three high-signal roles with ASDI/NOAA-backed risk context, micro-learning links, and clipboard-friendly save.
4. **Updates & opportunities** – browse curated climate/disaster headlines and training items filtered by country/topic.

## 🧠 How the matching works

- `app/lib/recommend.ts` combines hazard fit, Jaccard skill overlap, and an equity boost to score roles.
- `data/risk_by_country.json` and `data/roles.json` drive the pipeline; both are tiny, human-curated JSON catalogs.
- `/api/recommend` validates input, calls the scorer, and returns three roles plus a compact risk snapshot.
- `/api/recommend/track` stores in-memory click analytics for quick demo dashboards.
- `/docs/prompt.md` holds the guardrailed LLM system prompt (kept deterministic for expo demos).

## 📦 Project structure

```
app/
  page.tsx                   # Screen 1 – path selection
  profile/page.tsx           # Screen 2 – user profile form
  suggestions/page.tsx       # Screen 3 – recommendations
  updates/page.tsx           # Screen 4 – updates feed
  api/
    recommend/route.ts       # Recommendation endpoint
    recommend/track/route.ts # Click tracking endpoint
    news/route.ts            # Static climate/disaster feed
  components/                # Shared UI widgets (cards, chips, news list, etc.)
  lib/                       # Data loaders, scorer, analytics, shared types

data/
  risk_by_country.json       # Flood/cyclone/heat scores for demo countries
  roles.json                 # 15 curated roles with skills + learning links

docs/
  architecture.mmd           # High-level diagram (Mermaid source)
  prompt.md                  # Renewus system prompt for the LLM
```

## 🚀 Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:3000` to walk through the four-screen flow. The profile and recommendation state are stored in `sessionStorage`, so page reloads keep your inputs during a demo.

### Testing the APIs directly

```bash
# Recommendation sampler
curl -X POST http://localhost:3000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
        "path": "post_disaster",
        "country": "Philippines",
        "age": 19,
        "skills": ["first aid", "organizing"],
        "language": "en",
        "equityFlag": true
      }' | jq

# Static news feed
curl "http://localhost:3000/api/news?country=Philippines&topic=climate" | jq
```

## 🧪 Linting

```bash
npm run lint
```

## 📊 Data sources

- **Risk scores** – seeded from public ASDI/NOAA climate risk references.
- **Roles & learning links** – curated from IFRC, WHO, FEMA, FAO, SEI, and allied training portals (all open resources).
- **News feed** – static but structured for quick swaps with trusted APIs (ReliefWeb, GDACS, etc.).

## 🛣️ Demo narrative cheat sheet

1. Problem → youth want to help after climate shocks but lack fit-for-them roles.
2. Solution → Renewus blends local hazard data + personal skills into three actionable matches.
3. Live flow → path → profile → recommendations → save plan → updates.
4. Impact → emphasise equity boost and learning click-throughs.
5. Architecture → highlight scoring weights, JSON catalogs, and optional LLM why-box.
6. Roadmap → more countries, SMS, partner feeds.

## 📹 Demo video

Record a 60–90 second walkthrough (Loom/YouTube) and drop the link here once ready.

