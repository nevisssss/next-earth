# Renewus – Climate Action Planner

Renewus is a hackathon-ready Next.js MVP that pairs youth (and any motivated neighbour) with climate-action roles in under a minute. The experience stitches together lightweight datasets, a transparent hybrid matcher, and supportive micro-learning nudges so teams can demo impact quickly.

Install dependencies, then run the development server:

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

