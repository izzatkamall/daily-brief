# Technical Assessment — Full-Stack + Mobile + AI Automation

**Candidate:** Izzat
**Prepared by:** [Your name]
**Estimated effort:** 3–5 days (part-time), submit within 7 days of receipt

## Purpose

This is a small, self-contained project meant to evaluate practical skills across three areas: web development, Android app development, and AI automation. It's intentionally scoped small — we're evaluating how you approach the problem and the quality of your work, not asking for a production-grade system.

## The Project: "Daily Brief" — a mini task tracker with an AI-generated summary

Build a small task-tracking system with three parts:

### 1. Web app (Web Development)
- A simple web app (any modern stack of your choice — React/Vue/plain JS frontend + a backend of your choice) that lets a user:
  - Create, edit, complete, and delete tasks (title, description, due date, priority)
  - View a list of tasks, filterable by status (open/completed) and priority
- Expose these operations via a REST or GraphQL API that the Android app will also use.
- Include basic auth (a single hardcoded user or simple login is fine — auth isn't the focus).

### 2. Android app (Mobile Development)
- A native Android app (Kotlin or Java) that talks to the same backend API from part 1.
- Must support: viewing the task list, creating a task, marking a task complete.
- Should work against the same live backend (not a separate mock), so the web and mobile clients stay in sync.

### 3. AI automation feature
- Add one automated feature powered by an AI/LLM API (OpenAI, Anthropic, Gemini, or similar — your choice, use a free/trial tier):
  - Once a day (or on-demand via a button), generate a short natural-language "Daily Brief" summarizing open tasks — e.g., what's overdue, what's due today, and a suggested priority order.
  - Show this summary in both the web app and the Android app.
- Briefly document how this automation is triggered (real scheduled job vs. on-demand call is fine either way — explain your choice).

## Deliverables

1. Source code for all three parts, in a public or shareable Git repository (GitHub/GitLab/Bitbucket).
2. A short `README.md` covering:
   - Setup/run instructions for the web app, backend, and Android app.
   - Which AI provider/API you used and why.
   - Any tradeoffs or shortcuts you took, and what you'd do differently with more time.
3. A 2–3 minute screen recording (Loom or similar) walking through: creating a task on web, seeing it appear on Android, and triggering the AI summary.

## Evaluation criteria

- **Correctness:** the three parts work together end-to-end (web ↔ API ↔ Android, plus the AI summary).
- **Code quality:** readable, reasonably organized, sensible naming and structure.
- **Judgment:** sensible scope decisions for a time-boxed task — we're not expecting polish, but we are looking at what you prioritized.
- **Communication:** clarity of the README and the walkthrough video.

## Submission

Reply with the repository link and the recording link. Happy to answer questions by email or phone if anything here is unclear.
