/* ==========================================================
   Coursera Automation — Setup Guide
   by Raushan Raj
   ========================================================== */

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  /* ------------------------------------------------------
     Elements
  ------------------------------------------------------ */
  const csrfInput  = $("csrf");
  const uuInput    = $("uu");
  const cauthInput = $("cauth");
  const jsonOutput = $("json-output");

  const generateBtn = $("generate");
  const copyBtn     = $("copy");
  const saveBtn     = $("save");

  const urlInput   = $("course-url");
  const slugOutput = $("slug-output");
  const extractBtn = $("extract");
  const copySlugBtn = $("copy-slug");

  const themeToggle = $("theme-toggle");

  /* ------------------------------------------------------
     Theme
  ------------------------------------------------------ */
  function applyTheme(dark) {
    document.body.classList.toggle("dark", dark);
    themeToggle.textContent = dark ? "Light mode" : "Dark mode";
    themeToggle.setAttribute("aria-pressed", String(dark));
  }

  let saved = null;
  try { saved = localStorage.getItem("theme"); } catch (e) { /* storage blocked */ }

  if (saved === "dark") {
    applyTheme(true);
  } else if (saved === null && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches) {
    // no saved choice — follow the operating system on first visit
    applyTheme(true);
  }

  themeToggle.addEventListener("click", () => {
    const dark = !document.body.classList.contains("dark");
    applyTheme(dark);
    try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch (e) {}
  });

  /* ------------------------------------------------------
     Output helpers
  ------------------------------------------------------ */
  function show(el, text, isError) {
    el.textContent = text;
    el.classList.toggle("err", !!isError);
  }

  // navigator.clipboard needs a secure context. Opened straight from disk
  // (file://) it can fail, so fall back to a temporary textarea.
  async function toClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.top = "-1000px";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        ta.remove();
        return ok;
      } catch (e2) {
        return false;
      }
    }
  }

  async function copyFrom(source, button, label) {
    const text = (typeof source === "string" ? source : source.textContent).trim();
    if (!text) return;

    const ok = await toClipboard(text);
    button.textContent = ok ? "Copied ✓" : "Copy failed";
    setTimeout(() => { button.textContent = label; }, 1800);
  }

  /* ------------------------------------------------------
     Step 2 — config.json
  ------------------------------------------------------ */
  function readCookies() {
    return {
      csrf:  csrfInput.value.trim(),
      uu:    uuInput.value.trim(),
      cauth: cauthInput.value.trim()
    };
  }

  function buildConfig(c) {
    return {
      cookies: {
        CAUTH: c.cauth,
        "CSRF3-Token": c.csrf,
        "__204u": c.uu
      }
    };
  }

  function missingFields(c) {
    const missing = [];
    if (!c.csrf)  missing.push("CSRF3-Token");
    if (!c.uu)    missing.push("__204u");
    if (!c.cauth) missing.push("CAUTH");
    return missing;
  }

  generateBtn.addEventListener("click", () => {
    const c = readCookies();
    const missing = missingFields(c);

    if (missing.length) {
      show(jsonOutput, "Still needed: " + missing.join(", "), true);
      return;
    }

    show(jsonOutput, JSON.stringify(buildConfig(c), null, 4), false);
  });

  copyBtn.addEventListener("click", () => {
    if (jsonOutput.classList.contains("err")) return;
    copyFrom(jsonOutput, copyBtn, "Copy JSON");
  });

  saveBtn.addEventListener("click", () => {
    const c = readCookies();
    const missing = missingFields(c);

    if (missing.length) {
      show(jsonOutput, "Still needed: " + missing.join(", "), true);
      return;
    }

    const blob = new Blob(
      [JSON.stringify(buildConfig(c), null, 4)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "config.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    saveBtn.textContent = "Saved ✓";
    setTimeout(() => { saveBtn.textContent = "Save config.json"; }, 1800);
  });

  /* ------------------------------------------------------
     Step 4 — course slug
  ------------------------------------------------------ */
  function extractSlug() {
    const raw = urlInput.value.trim();

    if (!raw) {
      show(slugOutput, "Paste a Coursera course URL first.", true);
      return;
    }

    let url;
    try {
      url = new URL(raw);
    } catch (e) {
      show(slugOutput, "That isn't a valid URL. It should start with https://", true);
      return;
    }

    const parts = url.pathname.split("/").filter(Boolean);
    const i = parts.indexOf("learn");

    if (i !== -1 && parts[i + 1]) {
      show(slugOutput, parts[i + 1], false);
    } else {
      show(slugOutput, "No slug found. The URL should look like coursera.org/learn/course-name", true);
    }
  }

  extractBtn.addEventListener("click", extractSlug);

  urlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") extractSlug();
  });

  copySlugBtn.addEventListener("click", () => {
    if (!slugOutput.textContent.trim() || slugOutput.classList.contains("err")) {
      show(slugOutput, "Extract a valid course slug first.", true);
      return;
    }
    copyFrom(slugOutput, copySlugBtn, "Copy slug");
  });

  /* ------------------------------------------------------
     Click an output block to select all of it
  ------------------------------------------------------ */
  [jsonOutput, slugOutput].forEach((el) => {
    el.addEventListener("click", () => {
      if (!el.textContent.trim() || el.classList.contains("err")) return;
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });
  });

  /* ------------------------------------------------------
     Reading progress bar
  ------------------------------------------------------ */
  const pbar = $("pbar");

  function updateBar() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    pbar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
  }

  addEventListener("scroll", updateBar, { passive: true });
  addEventListener("resize", updateBar);
  updateBar();

  /* ------------------------------------------------------
     Step reveal + rail scroll-spy + progress ring
  ------------------------------------------------------ */
  const steps = Array.prototype.slice.call(document.querySelectorAll(".step"));
  const links = Array.prototype.slice.call(document.querySelectorAll(".rail a"));
  const ring = $("ring");
  const ringTxt = $("ringtxt");
  const CIRC = 150.8; // 2 * pi * r, r = 24

  const reduceMotion = window.matchMedia
    && matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    steps.forEach((s) => s.classList.add("in"));
  } else {
    steps.forEach((s) => {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -10% 0px", threshold: 0.06 });
      io.observe(s);
    });
  }

  function setRing(index) {
    if (!ring) return;
    const pct = (index + 1) / links.length;
    ring.style.strokeDashoffset = String(CIRC * (1 - pct));
    ringTxt.textContent = Math.round(pct * 100) + "%";
  }

  function markActive(index) {
    links.forEach((link, i) => {
      link.classList.toggle("on", i === index);
      link.classList.toggle("done", i < index);
    });
    setRing(index);
  }

  if ("IntersectionObserver" in window) {
    const byStepId = {};
    links.forEach((link, i) => { byStepId[link.dataset.t] = i; });

    steps.forEach((s) => {
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const i = byStepId[entry.target.id];
          if (i !== undefined) markActive(i);
        });
      }, { rootMargin: "-25% 0px -60% 0px" }).observe(s);
    });
  }
})();
