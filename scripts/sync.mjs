// Fetches the contribution calendar and public repo count into data/github.json.
// Uses the GitHub GraphQL API when GITHUB_TOKEN is set (as in the workflow),
// otherwise falls back to public endpoints so it also runs locally.
// Usage: node scripts/sync.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const login = process.env.GH_LOGIN || "Arnav-Code-hub";
const token = process.env.GITHUB_TOKEN;
const LEVEL = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

async function viaGraphQL() {
  const query = `query($login: String!) {
    user(login: $login) {
      repositories(ownerAffiliations: OWNER, privacy: PUBLIC) { totalCount }
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount contributionLevel } }
        }
      }
    }
  }`;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json", "User-Agent": "profile-sync" },
    body: JSON.stringify({ query, variables: { login } }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(JSON.stringify(json.errors || json));
  const user = json.data.user;
  const cal = user.contributionsCollection.contributionCalendar;
  const days = cal.weeks.flatMap((w) => w.contributionDays).map((d) => ({
    date: d.date, count: d.contributionCount, level: LEVEL[d.contributionLevel] ?? 0,
  }));
  return { repos: user.repositories.totalCount, total: cal.totalContributions, days };
}

async function viaPublic() {
  const cal = await (await fetch(`https://github-contributions-api.jogruber.de/v4/${login}?y=last`)).json();
  const user = await (await fetch(`https://api.github.com/users/${login}`, { headers: { "User-Agent": "profile-sync" } })).json();
  const days = cal.contributions.map((d) => ({ date: d.date, count: d.count, level: d.level }));
  return { repos: user.public_repos, total: days.reduce((a, d) => a + d.count, 0), days };
}

const data = token ? await viaGraphQL() : await viaPublic();
const out = { updated: new Date().toISOString().slice(0, 10), login, ...data };
mkdirSync(join(root, "data"), { recursive: true });
writeFileSync(join(root, "data/github.json"), JSON.stringify(out, null, 1));
console.log(`synced ${out.days.length} days, ${out.total} contributions, ${out.repos} repos (${token ? "graphql" : "public"})`);
