/* =====================================================================
   Alexandria's Design — Experience layer behaviors (lane pages)
   Runs after motion.js (which owns Lenis, nav, counters, .reveal).
   Everything here is progressive enhancement: content is readable
   without JS, and animation is skipped under prefers-reduced-motion.
   ===================================================================== */

(function () {
  "use strict";

  document.documentElement.classList.add("js");

  /* Native image drag-and-drop cancels pointer interactions
     (compare slider, ward pan, door parallax) — disable it. */
  document.querySelectorAll(
    ".compare img, .ward__panel img, .door__window img, .estab__media img, .scene img, .two-up img"
  ).forEach(function (img) {
    img.setAttribute("draggable", "false");
    img.addEventListener("dragstart", function (e) { e.preventDefault(); });
  });

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = !!window.gsap;
  var hasST = !!window.ScrollTrigger;

  /* -------------------------------------------------------------------
     1. Establishing shot — content fade-up + subtle image parallax
     ------------------------------------------------------------------- */
  if (!reduced && hasGsap) {
    document.querySelectorAll("[data-estab]").forEach(function (sec) {
      var bits = sec.querySelectorAll(
        ".estab__kicker, .estab__line, .estab__sub, .estab__ctas"
      );
      if (bits.length) {
        gsap.from(bits, {
          opacity: 0,
          y: 26,
          duration: 1.0,
          ease: "power2.out",
          stagger: 0.12,
          delay: 0.15,
        });
      }
      var img = sec.querySelector(".estab__media img");
      if (img && hasST) {
        gsap.fromTo(
          img,
          { yPercent: -3, scale: 1.06 },
          {
            yPercent: 3,
            scale: 1.06,
            ease: "none",
            scrollTrigger: {
              trigger: sec,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      }
    });

    /* Caption scenes (dossier stills): caption rises as scene enters. */
    if (hasST) {
      document.querySelectorAll(".scene figcaption").forEach(function (cap) {
        gsap.from(cap, {
          opacity: 0,
          y: 28,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: { trigger: cap, start: "top 88%", once: true },
        });
      });
    }
  }

  /* -------------------------------------------------------------------
     2. Drawers — smooth expand/collapse on <details class="drawer">
     ------------------------------------------------------------------- */
  document.querySelectorAll("details.drawer").forEach(function (d) {
    var summary = d.querySelector("summary");
    var body = d.querySelector(".drawer__body");
    if (!summary || !body) return;

    summary.addEventListener("click", function (e) {
      if (reduced) return; /* native instant toggle */
      e.preventDefault();
      if (d.dataset.anim === "1") return;
      d.dataset.anim = "1";

      if (d.open) {
        var h0 = body.offsetHeight;
        body.style.height = h0 + "px";
        body.style.overflow = "hidden";
        requestAnimationFrame(function () {
          body.style.transition = "height 0.45s cubic-bezier(0.25,1,0.5,1), opacity 0.3s";
          body.style.height = "0px";
          body.style.opacity = "0";
        });
        window.setTimeout(function () {
          d.open = false;
          body.removeAttribute("style");
          delete d.dataset.anim;
        }, 470);
      } else {
        d.open = true;
        var h1 = body.offsetHeight;
        body.style.height = "0px";
        body.style.overflow = "hidden";
        body.style.opacity = "0";
        requestAnimationFrame(function () {
          body.style.transition = "height 0.55s cubic-bezier(0.25,1,0.5,1), opacity 0.45s 0.08s";
          body.style.height = h1 + "px";
          body.style.opacity = "1";
        });
        window.setTimeout(function () {
          body.removeAttribute("style");
          delete d.dataset.anim;
          if (hasST) ScrollTrigger.refresh();
        }, 580);
      }
    });
  });

  /* -------------------------------------------------------------------
     3. Hotspot groups — one capability card open at a time
        Container: [data-hotspots]; spots: .hotspot[data-target="id"];
        cards: .hs-card[id]; close: [data-close].
     ------------------------------------------------------------------- */
  document.querySelectorAll("[data-hotspots]").forEach(function (group) {
    var spots = group.querySelectorAll(".hotspot");
    var cards = group.querySelectorAll(".hs-card");

    function closeAll() {
      cards.forEach(function (c) { c.classList.remove("is-open"); });
      spots.forEach(function (s) {
        s.classList.remove("is-active");
        s.setAttribute("aria-expanded", "false");
      });
    }

    spots.forEach(function (spot) {
      spot.setAttribute("aria-expanded", "false");
      spot.addEventListener("click", function () {
        var card = group.querySelector("#" + spot.dataset.target);
        if (!card) return;
        var wasOpen = card.classList.contains("is-open");
        closeAll();
        if (!wasOpen) {
          card.classList.add("is-open");
          spot.classList.add("is-active");
          spot.setAttribute("aria-expanded", "true");
        }
      });
    });

    group.querySelectorAll("[data-close]").forEach(function (btn) {
      btn.addEventListener("click", closeAll);
    });
  });

  /* -------------------------------------------------------------------
     4. Door panels (index) — pointer parallax inside the window
     ------------------------------------------------------------------- */
  if (!reduced) {
    document.querySelectorAll(".door").forEach(function (door) {
      var img = door.querySelector(".door__window img");
      if (!img) return;
      door.addEventListener("mousemove", function (e) {
        var r = door.getBoundingClientRect();
        var dx = (e.clientX - r.left) / r.width - 0.5;
        var dy = (e.clientY - r.top) / r.height - 0.5;
        img.style.transform =
          "translate3d(" + (dx * -14).toFixed(1) + "px," + (dy * -10).toFixed(1) + "px,0) scale(1.08)";
      });
      door.addEventListener("mouseleave", function () {
        img.style.transform = "";
      });
    });
  }

  /* -------------------------------------------------------------------
     5. Ward pan strip — drag-to-pan with momentum (mouse); native
        touch scrolling is left alone.
     ------------------------------------------------------------------- */
  document.querySelectorAll("[data-ward]").forEach(function (vp) {
    var dragging = false;
    var captured = false;
    var moved = 0;
    var lastX = 0;
    var vel = 0;
    var rafId = null;

    function inertia() {
      vel *= 0.94;
      vp.scrollLeft += vel;
      if (Math.abs(vel) > 0.4) {
        rafId = requestAnimationFrame(inertia);
      }
    }

    vp.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse") return;
      dragging = true;
      captured = false;
      moved = 0;
      lastX = e.clientX;
      vel = 0;
      if (rafId) cancelAnimationFrame(rafId);
    });
    vp.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX;
      lastX = e.clientX;
      moved += Math.abs(dx);
      vel = -dx;
      vp.scrollLeft -= dx;
      /* Capture only once a real drag starts, so plain clicks on
         hotspots inside the strip still hit their target. */
      if (!captured && moved > 6) {
        captured = true;
        vp.classList.add("is-dragging");
        try { vp.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
      }
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      vp.classList.remove("is-dragging");
      if (!reduced && Math.abs(vel) > 1) {
        rafId = requestAnimationFrame(inertia);
      }
    }
    vp.addEventListener("pointerup", endDrag);
    vp.addEventListener("pointercancel", endDrag);

    /* A real drag should not fire the hotspot underneath the pointer. */
    vp.addEventListener(
      "click",
      function (e) {
        if (moved > 8) {
          e.stopPropagation();
          e.preventDefault();
          moved = 0;
        }
      },
      true
    );
  });

  /* -------------------------------------------------------------------
     6. Compare slider — drag handle, clip-path reveal, keyboard support
     ------------------------------------------------------------------- */
  document.querySelectorAll("[data-compare]").forEach(function (c) {
    var handle = c.querySelector(".compare__handle");
    if (!handle) return;
    var pos = 50;

    function set(p) {
      pos = Math.max(4, Math.min(96, p));
      c.style.setProperty("--pos", pos + "%");
      handle.setAttribute("aria-valuenow", String(Math.round(pos)));
    }

    function fromEvent(e) {
      var r = c.getBoundingClientRect();
      set(((e.clientX - r.left) / r.width) * 100);
    }

    var dragging = false;
    c.addEventListener("pointerdown", function (e) {
      dragging = true;
      c.setPointerCapture(e.pointerId);
      fromEvent(e);
    });
    c.addEventListener("pointermove", function (e) {
      if (dragging) fromEvent(e);
    });
    c.addEventListener("pointerup", function () { dragging = false; });
    c.addEventListener("pointercancel", function () { dragging = false; });

    handle.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); set(pos - 4); }
      if (e.key === "ArrowRight") { e.preventDefault(); set(pos + 4); }
    });

    set(50);
  });

  /* -------------------------------------------------------------------
     7. Shelf covers (academy) — tilt-on-hover
     ------------------------------------------------------------------- */
  if (!reduced) {
    document.querySelectorAll(".cover").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var dx = (e.clientX - r.left) / r.width - 0.5;
        var dy = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          "rotateY(" + (dx * 9).toFixed(2) + "deg) rotateX(" + (dy * -7).toFixed(2) + "deg) translateY(-4px)";
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  }

  /* -------------------------------------------------------------------
     8. Format / level picker (index) — click a card to select it
     ------------------------------------------------------------------- */
  (function () {
    var summary = document.getElementById("pickerSummary");
    var summaryText = document.getElementById("pickerText");
    if (!summary || !summaryText) return;

    var picked = { format: null, level: null };

    function refresh() {
      var parts = [];
      if (picked.format) parts.push(picked.format);
      if (picked.level) parts.push(picked.level);
      if (parts.length) {
        summaryText.textContent = parts.join(" · ");
        summary.hidden = false;
      }
    }

    document.querySelectorAll("[data-picker]").forEach(function (grid) {
      var kind = grid.dataset.picker; /* "format" | "level" */
      var cards = grid.querySelectorAll("[data-pick]");
      cards.forEach(function (card) {
        card.addEventListener("click", function (e) {
          if (e.target.closest("a") || e.target.closest("summary") || e.target.closest("details")) return;
          cards.forEach(function (x) { x.classList.remove("is-selected"); });
          card.classList.add("is-selected");
          picked[kind] = card.dataset.pick;
          refresh();
        });
      });
    });
  })();

  /* -------------------------------------------------------------------
     9. Mailto forms — compose an email from the fields; nothing can
        silently vanish because the user's own mail app sends it.
     ------------------------------------------------------------------- */
  document.querySelectorAll("form[data-mailto]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var lines = [];
      form.querySelectorAll("input[name], select[name], textarea[name]").forEach(function (el) {
        if (el.type === "hidden" || !el.value) return;
        var label = el.dataset.label || el.name;
        lines.push(label + ": " + el.value);
      });
      var subject = form.dataset.subject || "Project inquiry";
      var nameField = form.querySelector('[name="name"]');
      if (nameField && nameField.value) subject += " from " + nameField.value;
      var href =
        "mailto:" + (form.dataset.mailto || "info@alexandriasdesign.com") +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(lines.join("\n"));
      var note = form.querySelector(".mailto-note");
      if (note) note.hidden = false;
      window.location.href = href;
    });
  });
})();
