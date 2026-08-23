# Digital Alpha Technologies

## Full Stack Engineer (Frontend-Focused) — Take-Home Assignment

Hi, and thanks for your interest in joining Digital Alpha Technologies.

This assignment is meant to reflect the kind of work you'd actually do here: taking a written brief for a data-heavy financial app and building a working slice of it end to end, frontend through database. Please read the whole thing before you start coding. It's short.

> **You have 24 hours from the time this email reaches you.**

We're not expecting a finished startup. Plan for something like a solid day of focused work, scope accordingly, and please don't lose a night of sleep over it. We'd much rather see a smaller feature set done well than everything half-built.

---

## What you're building

A consumer app for paying credit-card bills, earning reward coins on payments, and looking at your own spending. You'll build the core of it: a transactions and rewards dashboard, backed by a real API and database.

The idea is deliberately simple so the interesting part is how you build it, not what it is.

Call the project whatever you like. There's no fixed name and no design file. The look and feel is yours to decide, and we do pay attention to visual quality and polish, so treat the UI seriously.

Wherever the brief leaves something open (and it does in a few places), make a reasonable product call and note it down. We're genuinely interested in the assumptions you make, so keep track of them as you go.

---

# Requirements

## Transactions dashboard

The dataset attached with this email (`transactions.json`) has around **10,000 transactions**.

Show them in a table that stays smooth with the full set loaded. Pagination or virtualization is up to you, just be ready to explain why you picked one.

Users should be able to:

- Filter by category
- Filter by date range
- Filter by amount range
- Filter by payment status
- Combine filters
- Search merchant names as they type
- Sort by date
- Sort by amount
- Click a row to open its full detail somewhere sensible

A drawer or modal is your call.

## Spend analytics

Give the user a view of:

- Spending by category
- A monthly spending trend over time

At a minimum, clicking a slice of a chart should filter the transaction table.

Making it fully two-way, where table filters also reshape the charts, is a nice step up if you have time.

Keep this responsive with the full dataset.

## Rewards

Users earn coins on successful payments:

- **1 coin per ₹100 spent**
- Coins are **capped per transaction**

Their coin balance should always be visible somewhere.

Let them redeem coins against a small catalogue of **4–6 rewards** that you define, such as:

- Vouchers
- Cashback
- Other suitable rewards

The redeem flow should be:

1. Select
2. Confirm
3. Done

If redemption fails:

- The UI must recover cleanly.
- The balance must not be left in an incorrect state.
- The backend must reject a redemption when the balance is too low.
- The backend must reject a reward that doesn't exist.
- Use sensible HTTP status codes.

---

# Where to focus

You won't finish everything perfectly in a day, and you're not expected to.

Get the earlier things solid before reaching for the later ones.

## Core — do these first, do them well

- Transactions table on the full 10k rows with filtering, search, and sorting while staying smooth.
- One spend chart: category breakdown or monthly trend.
- Rewards:
  - Visible coin balance
  - Working redeem flow
  - Select and confirm flow
  - Balance updates
  - Backend rejects invalid or unaffordable redemptions
- PostgreSQL with a schema and a one-command seed.
- Deployed app, or a short demo video if deployment isn't possible in time.

## Nice to have — if the core is solid

- The second chart.
- One-way chart-to-table filtering.
- Server-side pagination, filtering, and sorting instead of doing everything in the browser.
- Optimistic balance updates with clean rollback if redemption fails.
- A polished hand-built modal with:
  - Focus trap
  - Escape to close

## Bonus — genuinely optional

- Two-way cross-filtering between charts and table.
- A test or two.
- Accessibility touches.
- A walkthrough video even if the app is deployed.

> **A tight, well-built core beats every feature half-done.**

---

# Tech we expect

## Frontend

This is where most of your time should go: roughly **70–75%**.

Use:

- React with TypeScript
- **Next.js preferred**

Build a small internal component system with:

- Design tokens for colour, spacing, and typography
- Reusable components such as:
  - `Button`
  - `Card`
  - `Table`
  - `Modal`

### Important table constraint

Build the **Table yourself**, without a component library.

Do **not** use:

- MUI
- Ant
- Chakra
- shadcn
- Other component libraries for the table

This is a major area of evaluation. The table should demonstrate:

- Good CSS
- Sticky header
- Proper hover states
- Focus states
- Loading state
- Empty state
- Error state
- Responsive layout down to **360px** wide

For everything else, including the modal or drawer, you may use a library.

A clean hand-built modal with a focus trap and Escape-to-close behavior is a positive signal if you have time.

Charting libraries are allowed, including:

- Recharts
- Chart.js
- D3

## Backend

Use Python with either:

- FastAPI
- Flask

Keep these reasonably separated:

- Routes
- Business logic
- Data access

Minimum endpoints:

- Fetch transactions
- Get coin balance
- Get rewards catalogue
- Redeem rewards

The redeem endpoint must include proper validation and error responses.

Server-side pagination, filtering, and sorting is considered the stronger approach, but get the endpoints working first.

## Database

**PostgreSQL is mandatory.**

- PostgreSQL 18 is preferred.
- PostgreSQL 16 or newer is acceptable if the host doesn't offer 18.
- SQLite is not accepted.
- MongoDB is not accepted.
- In-memory stores are not accepted.

Design an actual schema rather than dumping the JSON into a single column.

Include a seed script that:

- Sets up the schema.
- Loads the provided data.
- Runs in one documented command.

---

# Deploying it

Ideally, deploy both:

- Frontend
- Backend

Connect them to a hosted PostgreSQL database.

Free tiers are fine.

Examples:

### Frontend

- Vercel
- Netlify

### Backend

- Render
- Railway
- Fly

### PostgreSQL

- Neon
- Supabase
- Railway

If time runs short and you can't deploy:

1. Record a short screen video of the app running locally.
2. Walk through the main features.
3. Put the video link in the README.

Possible platforms include:

- Google Drive
- Zoom recording
- Anything accessible to the reviewers

If the app is deployed, the video is optional.

---

# On AI tools

Use them.

Add an `AI-USAGE.md` file to the repository describing:

- Which AI tools you used
- Where you used them
- At least **two real examples** of AI output that you:
  - Threw away, or
  - Had to fix
- Why the output was discarded or changed

You should also know your own code thoroughly.

If you reach the next round, you may be asked to walk through the submission and modify it live.

---

# Version control

Work in a **public GitHub repository**.

Commit as you go, using meaningful commit messages.

One giant final commit containing the entire project:

- Tells the reviewers nothing about your process.
- Counts against the submission.

The commit history will be reviewed.

---

# What to send back

Reply to the email within 24 hours with:

- The public GitHub repository link.
- Your deployed frontend URL.
- Your deployed backend URL.
- Or, if you couldn't deploy, the demo video link.
- A few lines explaining:
  - What's done
  - What isn't done
  - The 2–3 biggest assumptions you made

---

# What should be inside the repository

## `README.md`

Include:

- What the project does
- The tech stack
- Local setup in under five minutes
- The PostgreSQL seed command
- Live URLs
- An honest:
  - Done list
  - Not-done list
  - Known issues list

## `ASSUMPTIONS.md`

Capture the product decisions you made where the brief was vague.

## `DECISIONS.md`

Document important technical choices, such as:

- State management
- Pagination vs. virtualization
- Schema design
- Other meaningful architectural decisions

Include a brief explanation of **why** you made each choice.

## `AI-USAGE.md`

Document AI usage as described above.

## Database schema and seed script

Include the schema and the script required to seed the provided dataset.

---

# Nice extras

None of these are required:

- A short walkthrough video, even if deployed.
- A test or two.
- Even one meaningful test on the redeem endpoint.
- Accessibility touches such as:
  - Semantic markup
  - Keyboard support

---

# How the submission will be evaluated

Roughly in this order of weight:

1. **Frontend engineering**
   - React patterns
   - Component design and reuse
   - TypeScript
   - State management

2. **CSS and UI craft**
   - Especially the hand-built table
   - Responsiveness
   - Interaction states
   - Overall polish

3. **Handling the full 10k-row dataset**
   - Performance
   - Responsiveness
   - Any data-related observations

4. **Judgment behind assumptions and decisions**

5. **Backend and database fundamentals**
   - API design
   - Validation
   - Schema
   - Seed process

6. **Process**
   - Commit history
   - Clear README
   - Honesty about unfinished work

> **Depth beats breadth. A tight scope done really well is stronger than every feature being touched with none of them solid.**

---

# Things that can get the submission set aside

A submission may be rejected if:

- It doesn't run by following its own README.
- It isn't using PostgreSQL.
- There is neither a deployed link nor a demo video.
- The repository turns out to be lifted from an existing project.

---

# Ground rules

The 24-hour clock starts when the email lands in your inbox.

The submission is evaluated based on whatever is:

- Pushed
- Live

at the deadline.

The assignment is only used to evaluate candidates.

Your work:

- Remains yours.
- Will not be used commercially by Digital Alpha Technologies.
- Can remain in your public portfolio.

If you move forward, the next step is a technical interview where you'll walk through the submission and extend it live.

---

**Engineering Team**  
Digital Alpha Technologies
