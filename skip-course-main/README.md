# Skip Course

> Complete Coursera course items in minutes, straight from your terminal.

A Python CLI that walks a Coursera course's item tree and marks each item complete by talking to Coursera's own API — no Selenium, no headless browser, no clicking through lectures one at a time.

<p align="center">
  <img src="./web-final/img.png" width="900" alt="Skip Course running in a terminal">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.9%2B-3776AB?logo=python&logoColor=white" alt="Python 3.9+">
  <img src="https://img.shields.io/badge/HTTP-httpx-005571" alt="httpx">
  <img src="https://img.shields.io/badge/CLI-click-000000" alt="click">
  <img src="https://img.shields.io/badge/status-active-0FA97D" alt="Active">
</p>

---

## Author

**Raushan Raj**

Python • Automation • Web

- GitHub: [@raushanraj00](https://github.com/raushanraj00)
- Repository: [skip_course_by_rau](https://github.com/raushanraj00/skip_course_by_rau)

---

## About

Coursera tracks progress per course item — lectures, readings, widgets, coach exercises and so on. Skip Course authenticates as you using your existing browser session cookies, fetches the full item tree for a course, and submits the appropriate completion call for each item type.

Because it speaks directly to the API instead of driving a browser, a full course usually finishes in a couple of minutes rather than hours.

The repository also ships a small web utility that generates your `config.json` and pulls the slug out of a course URL, so you never have to hand-edit JSON.

---

## Features

- **No browser automation.** Plain authenticated HTTP requests via `httpx`.
- **Handles every common item type** — lectures, supplements, coach items, ungraded widgets and LTI launches, each with its own completion path.
- **Runs items concurrently** with a 6-worker thread pool, dropping to sequential for item types that require ordering.
- **Resumes intelligently.** Re-checks progress on every pass and only touches what's still pending.
- **Self-healing auth.** If your session expires mid-run, it re-reads cookies from Chrome, Firefox or Edge and writes them back to your config.
- **Skips what it shouldn't touch** — peer-graded work, staff-graded assignments and discussion prompts are reported and left alone.
- **Clear per-item output** with status and elapsed time.
- **Companion web helper** for config generation and slug extraction.

---

## Requirements

- Python 3.9 or newer
- An active Coursera account enrolled in the course you're targeting

Dependencies (installed in one step below):

```
click
loguru
httpx
browser-cookie3
pydantic==2.11.7
requests==2.32.3
```

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/raushanraj00/skip_course_by_rau.git
cd skip_course_by_rau
```

### 2. Confirm Python is installed

```bash
python --version
```

If that fails, grab Python from [python.org/downloads](https://www.python.org/downloads/) — or follow [this walkthrough](https://www.youtube.com/watch?v=ddGTXBhaGWA) — then reopen your terminal.

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

> If the terminal appears to hang on `pyproject.toml`, press <kbd>Ctrl</kbd> + <kbd>C</kbd> and run the command again. This is a pip quirk, not a failure.

---

## Configuration

Skip Course reads its cookies from:

```
~/.skip-course/config.json
```

On Windows that resolves to:

```
C:\Users\<YOUR_USERNAME>\.skip-course\config.json
```

The file has one job — hold three Coursera session cookies:

```json
{
    "cookies": {
        "CAUTH": "your-cauth-value",
        "CSRF3-Token": "your-csrf3-token-value",
        "__204u": "your-204u-value"
    }
}
```

### Option A — let it fetch them for you

If you're logged into Coursera in Chrome, Firefox or Edge, just run the tool. When no cookies are configured it reads them straight from your browser via `browser-cookie3` and saves them itself. Nothing to do.

### Option B — use the web helper

Open `web-final/index.html` in your browser. Paste your three cookie values, click **Generate JSON**, then **Save config.json**, and move the downloaded file into the folder above. The page also extracts course slugs for you.

### Option C — copy them by hand

Log into Coursera, then:

1. Right-click the page → **Inspect**
2. Open the **Application** tab
3. Go to **Cookies → coursera.org**
4. Copy the values of `CAUTH`, `CSRF3-Token` and `__204u`

<p align="center">
  <img src="./web-final/cookie.png" width="820" alt="Locating Coursera cookies in Chrome DevTools">
</p>

---

## Usage

```bash
python -m raushan.main "course-slug"
```

The slug is the segment after `/learn/` in a course URL:

```
https://www.coursera.org/learn/machine-learning/home
                              └──────┬───────┘
                                   slug
```

So:

```bash
python -m raushan.main "machine-learning"
```

Pass the slug only — not the full URL.

### What you'll see

```
142 items found. Starting...

✔ Welcome to the Course                                     done      1.2s
✔ Course Overview Reading                                   done      0.8s
→ Week 1 Discussion Prompt                                  skipped   0.0s
✔ Introduction to Regression                                done      1.4s
...

All 142 items completed.
```

Status meanings: `✔ done` submitted successfully, `→ skipped` intentionally left alone (manual work), `✘ failed` couldn't be completed and won't be retried this run.

---

## How it works

1. Loads cookies from config, or reads them from your browser.
2. Authenticates and resolves your Coursera user ID.
3. Fetches the course's full material tree by slug.
4. Pulls the set of already-completed item IDs.
5. Splits everything still pending into a concurrent batch and a sequential batch.
6. Dispatches each item to a handler based on its `typeName`.
7. Repeats from step 4 until nothing actionable is left, then reports totals.

Locked items and items that failed once are excluded from later passes, so the loop always terminates.

---

## Project structure

```
skip_course_by_rau/
│
├── raushan/
│   ├── __init__.py
│   ├── main.py             # CLI entry point, CourseRunner, item dispatch
│   ├── config.py           # config file + browser cookie handling
│   ├── session_utils.py    # CSRF header helpers
│   ├── assessment/         # assessment queries, solver, types
│   ├── coach/              # coach item solver
│   ├── discussion/         # discussion solver
│   └── watcher/            # video progress reporting
│
├── web-final/              # helper site (current)
│   ├── index.html
│   ├── style.css
│   ├── main.js
│   ├── img.png
│   └── cookie.png
│
├── web/                    # helper site (previous version)
│
├── requirements.txt
└── README.md
```

---

## Web helper

A single-page setup guide that walks through the whole process and does the fiddly parts for you:

- Generate `config.json` from your three cookie values
- Copy the JSON, or download the file directly
- Extract a course slug from any Coursera URL
- Copy the slug
- Light and dark mode

Everything runs locally in the page — no cookie value is ever uploaded anywhere.

To use it, open `web-final/index.html`. To publish it, drop the `web-final` folder onto any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages).

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `ModuleNotFoundError: No module named 'x'` | `pip install x` — or `python3 -m pip install x` if that fails |
| `Cookies are invalid` | Log into Coursera in your browser, close it, then rerun. Cookies must come from a live session |
| `Course fetch failed` | Confirm you're actually enrolled in that course, and that the slug is correct |
| Terminal hangs on `pyproject.toml` | <kbd>Ctrl</kbd> + <kbd>C</kbd>, then rerun `pip install -r requirements.txt` |
| Run stops with items remaining | Those items are locked or need manual submission — the summary line tells you how many |
| No slug found | Use only the part after `/learn/`, not the whole URL |

---

## Contributing

Issues and pull requests are welcome — bug reports, new item-type handlers, and setup improvements especially.

---

## Support

If this saved you some time, a ⭐ on the repository helps others find it.

---

## Disclaimer

This project was built as an exercise in Python automation, authenticated HTTP requests and developer tooling. It interacts with Coursera using your own credentials.

You are responsible for complying with Coursera's Terms of Service, your institution's academic integrity policies, and any applicable rules for the courses you take. Use it at your own discretion.

---

<p align="center">
  Built by <b>Raushan Raj</b>
</p>
