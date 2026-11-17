# Which Way

Project proposal for Design, Build, Ship (MPCS 51238)

## 1. One-line description

A tool that helps someone facing a big decision, like buying a car, leasing one, or staying on public transit, structure it and compare their options.

## 2. My users

**Who they are:** people facing a big decision, such as whether to buy a car, lease one, or keep using public transit.

**What they do today without this:** (Person 3, in their own words)

> "Recently, I had to figure out whether buying a car, leasing one, or relying on public transportation made the most sense. I compared the monthly costs, insurance, maintenance, parking, and how often I'd actually need a car. I also looked at commute times and convenience."

> "The annoying part was that all the information was scattered across different websites, and comparing the true long-term costs wasn't straightforward. Every option had hidden trade-offs, so it was difficult to make an apples-to-apples comparison."

**Why they'd come back:** Big decisions take time, so they return to update their options and compare again.

### What they told me

I started with a broader "second brain" memory idea. These are my notes from three conversations (notes, not direct quotes):

**Friend 1:** said they sometimes forget movie and restaurant recommendations. Forgot a restaurant recommendation someone had given them. Tried Googling it, exploring search suggestions, and guessing based on the area to figure out which restaurant it was.

**Person 2:** we talked about forgetting ideas. Felt the Personal AI Companion idea was probably something AI already does today, particularly retaining context and personalizing responses. Their main question was: How would it actually be different from existing AI assistants?

**Person 3:** we talked about making smarter decisions, for example whether to buy a car, keep using public transit, or lease one. The tool I'm building came from this conversation. Was still indecisive about whether to buy, lease, or rely on public transportation. They had compared costs, insurance, maintenance, parking, commute times, and convenience, but found it difficult to compare the true long-term costs because information was scattered across different websites.

## 3. My focus

**Focus:** Holistic Journey

**Why:** I chose Holistic Journey because v1 is due in two weeks, and I want one person to get from sign-up to a finished comparison working on the live site, without going deep on one area.

## 4. My roadmap

| Week | Milestone | What I'll build |
|---|---|---|
| Nov 10 | Project starts | Set up Next.js, Clerk sign-up and Supabase, and get the site live on Vercel. |
| Nov 17 | v1 works end to end, with real people signing up | v1 (see "In v1" below) |
| Nov 24 | No class | No class. |
| Dec 1 | v2 at the project fair | v2 (see "Waits for v2" below) |

### In v1

Sign up, create any big decision (personal, professional, or spending), list the options and what matters, see a side-by-side comparison, and come back to it later. Buy, lease, or transit is just the origin example.

### Waits for v2

Anything beyond the basic comparison.

### Leaving out

The memory features from my first idea (saving recommendations and ideas, natural-language search).

### How I'll know it works

5 real people sign up and complete a comparison

**Constraint:** free tiers only.

## 5. Tech stack, MCP servers and CLIs

| Tool | Why it fits |
|---|---|
| Next.js | One framework for the pages and the server code, and it deploys straight to Vercel. |
| Tailwind | Quick styling without separate CSS files. |
| Clerk | Sign-up and login in v1. |
| Supabase | Stores each person's decisions, options and comparisons so they can come back to them later. |
| Vercel | Free hosting that redeploys from GitHub on every push. |
| AI model | Plain logic for v1, no AI model. |
| MCP servers | none yet |
| CLIs | none yet |

## Scope update

**SCOPE UPDATE (supersedes "v1 covers the car decision only"):** Which Way is a general decision tool. A person can create any big decision (personal, professional, or spending), list options, define criteria, and compare. Buy/lease/transit is just the origin example.
