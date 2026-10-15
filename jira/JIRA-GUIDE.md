# 🎯 ElegAI — JIRA Setup Guide (for your professor)

This maps your entire project to JIRA the way software teams (and professors) expect:
**Epics → User Stories → Tasks**, with a sprint plan. You already *did* all this work — JIRA
just documents the plan.

---

## 1. Create the JIRA project (2 min)

1. Go to **atlassian.com** → **Try Jira free** (free plan = up to 10 users, plenty for a class project)
2. Click **Create project** → choose **Scrum** (or Kanban) template
3. Name it: **`ElegAI`** → Company-managed or Team-managed (either is fine; pick "Team-managed" for simplicity)
4. You get a **Backlog** and a **Board**

## 2. The hierarchy (how professors read JIRA)

```
EPIC        = a big feature (e.g. "AI Stylist & Recommendation Engine")
  └─ STORY  = one user need ("As a customer, I want to get AI recommendations…")
       └─ TASK/SUBTASK = the technical to-do ("Call Gemini API", "Build fallback scorer")
```

- **Epics** = the 10 modules below
- **Stories** = written as *"As a [person], I want [thing], so that [benefit]"* + acceptance criteria
- **Tasks** = smaller implementation steps (you can add these per story)

## 3. Your 10 Epics (copy these exactly)

1. **Project Setup & Foundation** — folder structure, env vars, Dockerfile
2. **Database Design & Data Model** — schema, seed data, auto-init
3. **Authentication & User Management** — register, login, logout, password reset, roles
4. **Customer Profile & Style Preferences** — measurements, style/color/fit prefs
5. **Product Catalog** — browse, search, filter, details, admin CRUD
6. **AI Stylist & Recommendation Engine** — recommendations, photo, fallback engine
7. **Shopping Cart** — add, update, remove
8. **Checkout & Order Management** — checkout, history, tracking, cancel
9. **Admin Console** — dashboard, inventory, orders, customers
10. **Deployment & Mobile** — cloud deploy, PWA / React Native

## 4. User stories (examples — full list in the CSV)

> **Story (Epic: AI Stylist):**
> *As a customer, I want to get AI recommendations based on my occasion, style, color, fit and
> measurements, so that I find the perfect formal outfit.*
>
> **Acceptance criteria:** POST /api/stylist/recommend returns up to 6 real products from the
> catalog with reasons; works with Gemini/OpenAI or the built-in engine.

> **Story (Epic: Authentication):**
> *As a customer, I want to log in and log out, so that my data stays private.*
>
> **Acceptance criteria:** login issues a JWT; protected routes return 401 without it; logout
> clears the token.

## 5. Sprint plan (4 sprints — present this as your timeline)

| Sprint | Epics | What you deliver |
|---|---|---|
| **Sprint 1** | 1–3 (Setup, Database, Auth) | Project structure + schema + you can register/login |
| **Sprint 2** | 4–6 (Profile, Catalog, AI Stylist) | Browsable catalog + AI recommendations |
| **Sprint 3** | 7–8 (Cart, Checkout, Orders) | Full purchase flow end to end |
| **Sprint 4** | 9–10 (Admin, Deploy) | Admin console + live cloud deployment |

## 6. JIRA fields to fill (professors look for these)

| Field | Suggestion |
|---|---|
| **Priority** | High = auth, catalog, cart, checkout; Medium = profile, admin, deploy |
| **Story Points** | Fibonacci 1 / 2 / 3 / 5 / 8 (2 = small, 5 = medium, 8 = big) |
| **Labels** | `frontend`, `backend`, `database`, `ai`, `security`, `devops` |
| **Status** | To Do → In Progress → In Review → Done (drag cards across on your board) |
| **Sprint** | assign stories to Sprint 1–4 above |

---

# 📥 Import everything with the CSV (skip the typing!)

**`jira-import.csv`** in this folder has all 10 epics + 31 stories ready to go.

**How to import:**
1. JIRA project → top menu **••• (More)** → **Import** → **CSV** (or go to the project settings → Import CSV)
2. Upload **`jira-import.csv`**
3. Map columns: **Issue Type** → Issue Type, **Summary** → Summary, **Description** → Description,
   **Epic Name** → Epic Name, **Epic Link** → Epic Link, **Priority** → Priority, **Labels** → Labels
4. Click **Import** → done, your whole backlog appears. 🎉

> **If stories don't link to epics automatically:** in the Backlog view, drag each story
> onto its epic — JIRA nests them. (Takes ~1 minute.)

# 💡 Extra credit ideas (mention these to your professor)

- **Burndown chart** — visible automatically in Scrum after a sprint starts
- **Definition of Done** — e.g. "code merged, tested, deployed, no console errors"
- **A couple of Bug issues** — real ones we fixed: *"TiDB insecure transport error"*, *"Docker dist path 404"* — shows you actually hit and fixed real problems

---

**That's it.** You now have a complete, professional JIRA board for ElegAI — 10 epics, 31 stories
with acceptance criteria, a 4-sprint timeline, and priorities. It maps 1:1 to the app you built.
