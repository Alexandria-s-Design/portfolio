/* =====================================================================
   Alexandria's Design — Motion orchestration
   GSAP + ScrollTrigger + Lenis. Respects prefers-reduced-motion.
   ===================================================================== */

(function () {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Sticky nav border on scroll ---------------------------------- */
  const nav = document.querySelector(".nav");
  if (nav) {
    const onScroll = () => {
      nav.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  if (reducedMotion) {
    /* No motion — words & reveals stay visible (CSS default). */
    return;
  }

  /* ---- Lenis smooth scroll ------------------------------------------ */
  let lenis;
  if (window.Lenis) {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  if (!window.gsap) return;

  if (window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* Hero headline reveal handled by pure CSS (word-rise keyframe animation). */

  /* ---- Hero supporting elements fade-up ----------------------------- */
  gsap.from(".hero__pill, .hero__lede, .hero__ctas", {
    opacity: 0,
    y: 16,
    duration: 0.9,
    ease: "power2.out",
    stagger: 0.12,
    delay: 0.6,
  });

  /* ---- Impact counters ---------------------------------------------- */
  if (window.ScrollTrigger) {
    document.querySelectorAll(".impact__num").forEach((el) => {
      const target = parseFloat(el.dataset.count || "0");
      const suffix = el.dataset.suffix || "";
      const obj = { v: 0 };

      ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        once: true,
        onEnter: () => {
          if (Number.isNaN(target) || target === 0) {
            // Non-numeric label (e.g. "WOSB"); just fade in
            gsap.from(el, { opacity: 0, y: 20, duration: 0.8, ease: "power2.out" });
            return;
          }
          gsap.to(obj, {
            v: target,
            duration: 1.6,
            ease: "power2.out",
            onUpdate: () => {
              el.textContent = Math.round(obj.v).toLocaleString() + suffix;
            },
          });
        },
      });
    });
  }

  /* ---- Generic reveal-on-scroll ------------------------------------- */
  if (window.ScrollTrigger) {
    document.documentElement.classList.add("js-reveal-anim");
    gsap.utils.toArray(".reveal").forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 90%",
        once: true,
        onEnter: () => el.classList.add("is-in"),
      });
    });
    /* Refresh once layout settles so any pre-screen elements get is-in. */
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
  }
})();

/* =====================================================================
   Playable demo — branching scenario logic
   ===================================================================== */
(function () {
  const shell      = document.getElementById("demoShell");
  if (!shell) return;

  const question   = document.getElementById("demoQuestion");
  const outcome    = document.getElementById("demoOutcome");
  const verdict    = document.getElementById("demoVerdict");
  const feedback   = document.getElementById("demoFeedback");
  const rationale  = document.getElementById("demoRationale");
  const again      = document.getElementById("demoAgain");
  const reset      = document.getElementById("demoReset");
  const stepLabel  = document.getElementById("demoStep");
  const choices    = shell.querySelectorAll(".demo__choice");

  const responses = {
    A: {
      tone: "mixed",
      verdict: "Defensible — but heavy-handed.",
      headline: "It's a safe call. It's also an expensive one.",
      rationale: "Pulling a Care Manager from the field for a documented but narrow gap creates a service disruption for members already in their care plan, triggers backfill costs, and signals to staff that any flag means immediate suspension. CalAIM contemplates remediation pathways, not blanket benching. Save full removals for ethics, fraud, or member-safety issues.",
    },
    B: {
      tone: "good",
      verdict: "That's the move.",
      headline: "That's the answer a seasoned compliance lead picks.",
      rationale: "Document the gap. Schedule targeted retraining. Retain the assignment under supervisor sign-off so member care isn't disrupted while the gap closes. This satisfies audit expectations, protects continuity of care, and treats your Care Manager as a professional. It also gives you a clean paper trail when the auditor returns.",
    },
    C: {
      tone: "bad",
      verdict: "Don't do this.",
      headline: "Re-issuing without remediation is the move that ends careers.",
      rationale: "If the auditor flagged it, the record speaks louder than your assertion. Re-issuing a certificate without addressing the underlying gap is a documentation failure that compounds into compliance failure — and in some jurisdictions, fraud. Always close the gap, document the closure, then let the records do the explaining.",
    },
  };

  function showOutcome(key) {
    const r = responses[key];
    if (!r) return;

    verdict.className = "demo__verdict demo__verdict--" + (r.tone === "good" ? "good" : r.tone === "bad" ? "bad" : "mixed");
    verdict.textContent = r.verdict;
    feedback.textContent = r.headline;
    rationale.textContent = r.rationale;

    question.style.display = "none";
    outcome.classList.add("is-shown");
    stepLabel.textContent = "Outcome · feedback delivered";
    reset.hidden = false;
  }

  function resetDemo() {
    outcome.classList.remove("is-shown");
    question.style.display = "";
    stepLabel.textContent = "Scenario · 1 of 1";
    reset.hidden = true;
    /* Refocus the first choice for keyboard users */
    if (choices[0]) choices[0].focus();
  }

  choices.forEach((btn) => {
    btn.addEventListener("click", () => showOutcome(btn.dataset.choice));
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        showOutcome(btn.dataset.choice);
      }
    });
  });

  again.addEventListener("click", resetDemo);
  reset.addEventListener("click", resetDemo);
})();
