# Adaptive Tutor — Python Functions

Built for **Rebuild the Classroom** (LV8 Tech).

A one-subject adaptive tutor. It teaches Python functions — definition,
parameters vs arguments, return values, scope, and default-argument gotchas —
and on every turn decides, based on your actual answer, whether to **slow
down**, **reframe** with a different mental model, **jump ahead**, or **probe**
before teaching further. That decision is made live by an LLM call on the
server, not by a pre-written branching script.

The sidebar renders the session as a **commit graph**: each teaching turn is a
node, colored by what move the tutor made, so you can see the shape of your
own learning path as it happens — not just a progress bar.

## Run it

Works with **any one** of a Groq key, an xAI (Grok) key, or an Anthropic
key — set whichever one you have and the app picks the right API
automatically. Note: **Groq and xAI are different companies** despite the
similar names — a Groq key looks like `gsk_...` and only works with
`GROQ_API_KEY`; an xAI key looks like `xai-...` and only works with
`XAI_API_KEY`. Don't mix the two up or prepend one prefix onto the other's
key.

**macOS / Linux:**
```bash
cd adaptive-tutor
pip install -r requirements.txt
export GROQ_API_KEY=gsk_...        # or XAI_API_KEY=xai-..., or ANTHROPIC_API_KEY=sk-ant-...
python app.py
```

**Windows (cmd.exe):**
```bat
cd adaptive-tutor
pip install -r requirements.txt
set GROQ_API_KEY=gsk_...
py app.py
```
(Use `py` instead of `python` if plain `python` isn't recognized — that's a
Windows Store placeholder, not a missing install. In PowerShell, set the key
with `$env:GROQ_API_KEY="gsk_..."` instead of `set`.)

Then open **http://localhost:5000**.

Optional overrides:
- `TUTOR_MODEL_GROQ` — Groq model to use (defaults to `openai/gpt-oss-120b`)
- `TUTOR_MODEL_XAI` — Grok model to use (defaults to `grok-4-fast`)
- `TUTOR_MODEL` — Claude model to use (defaults to `claude-sonnet-5`)
- `PROVIDER=groq` / `PROVIDER=xai` / `PROVIDER=anthropic` — force a provider if you somehow have more than one key set

## How it works

- `app.py` — Flask app, one route to serve the page and one endpoint,
  `POST /api/turn`, that the frontend calls after every answer.
- `tutor_engine.py` — the actual educational logic. It serializes the full
  transcript so far, sends it to Claude with a system prompt that forces the
  model to name a diagnosis and pick one of four moves (`slow_down`,
  `reframe`, `jump_ahead`, `probe`) before it's allowed to teach anything, and
  validates the JSON contract that comes back.
- `static/app.js` — client-side state machine: renders the current
  explanation/question, submits answers, renders the commit-graph sidebar and
  the per-concept mastery bars.
- The full history (every prior explanation, question, and your answer) is
  sent back to the model on every turn — there is no server-side session
  store and no client-side storage. Refreshing the page starts a new session
  on purpose.

## Why this design

A chatbot bolted onto a textbook still delivers the same content in the same
order to everyone. Here, the "textbook" doesn't exist ahead of time in any
fixed sequence — the model is only allowed to move to a new concept once it
has stated why (rising mastery estimate), and it's required to change its
*teaching strategy*, not just its wording, when a student is stuck twice in a
row. Two students who each get one question wrong for different reasons
(a return-vs-print mixup vs. a scope mixup) will get genuinely different
explanations next, not the same one repeated more slowly.

## What's deliberately left out

- No accounts, no persistence across sessions, no progress saved to disk —
  scope was kept to depth on one subject and one session, per the brief.
- No hint system or partial-credit scoring; the model's `mastery_estimate` is
  a live belief, not a graded score.
- No authoring tool for other subjects yet — the system prompt is specific to
  Python functions on purpose (see "Extensibility" below for what generalizing
  this would take).

## Extensibility

The four-move contract (`slow_down` / `reframe` / `jump_ahead` / `probe`) and
the JSON schema in `tutor_engine.py` aren't specific to Python functions —
swapping the `CONCEPTS` list and the subject description in `SYSTEM_PROMPT`
is enough to retarget the same engine at a different topic. The commit-graph
frontend and mastery bars need no changes to do that.
