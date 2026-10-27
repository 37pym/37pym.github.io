// 37pym portfolio — interactions
// landing-page-design / Part B: IntersectionObserver ベースのリビール、base curve、reduced-motion 尊重

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Navigation toggle (mobile) --- */
  const nav = document.querySelector("[data-nav]");
  if (nav) {
    const toggle = nav.querySelector("[data-nav-toggle]");
    const closeMenu = () => {
      nav.classList.remove("is-open");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    };
    if (toggle) {
      toggle.addEventListener("click", () => {
        const open = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }
    // メニュー内リンククリックで閉じる
    nav.querySelectorAll(".nav__panel a").forEach((a) => {
      a.addEventListener("click", closeMenu);
    });
    // Esc で閉じる
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* --- Scroll reveal (once) --- */
  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("is-visible"));
    } else {
      const io = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
      );
      revealEls.forEach((el) => io.observe(el));
    }
  }

  /* --- Tagline word-by-word reveal (B11) --- */
  const tagline = document.querySelector("[data-tagline]");
  if (tagline) {
    // テキストノードを語単位の span に分解
    const raw = tagline.textContent;
    tagline.textContent = "";
    const frag = document.createDocumentFragment();
    raw.split(/(\s+)/).forEach((token) => {
      if (/^\s+$/.test(token)) {
        frag.appendChild(document.createTextNode(token));
      } else if (token.length) {
        const span = document.createElement("span");
        span.className = "tagline__word";
        span.textContent = token;
        frag.appendChild(span);
      }
    });
    tagline.appendChild(frag);

    const words = tagline.querySelectorAll(".tagline__word");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      words.forEach((w) => w.classList.add("is-on"));
    } else {
      const io = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-on");
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 1, rootMargin: "0px 0px -35% 0px" }
      );
      words.forEach((w) => io.observe(w));
    }
  }

  /* --- Bar graphs (profile page) --- */
  const bars = document.querySelectorAll("[data-bar]");
  if (bars.length) {
    const setWidth = (el) => {
      const v = el.getAttribute("data-bar");
      el.style.width = v + "%";
    };
    if (reduceMotion || !("IntersectionObserver" in window)) {
      bars.forEach(setWidth);
    } else {
      const io = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setWidth(entry.target);
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      bars.forEach((el) => io.observe(el));
    }
  }

  /* --- Works sticky stack: scroll-driven scale (比較用 / B7: rAF スロットル) --- */
  const stack = document.querySelector("[data-stack]");
  if (stack && !reduceMotion) {
    const cards = Array.prototype.slice.call(stack.querySelectorAll(".stack__card"));
    const N = cards.length;
    if (N) {
      const cs = getComputedStyle(stack);
      const top = parseFloat(cs.getPropertyValue("--stack-top")) || 112;
      const peek = parseFloat(cs.getPropertyValue("--stack-peek")) || 14;
      const SHRINK = 0.02; // 1枚あたりの縮小率
      const RANGE = 420;   // 次カードが覆い被さる距離(px)
      let ticking = false;

      const update = () => {
        ticking = false;
        for (let i = 0; i < N; i++) {
          if (i === N - 1) {
            cards[i].style.transform = "scale(1)";
            continue;
          }
          const target = 1 - (N - 1 - i) * SHRINK;
          const nextTop = cards[i + 1].getBoundingClientRect().top;
          const pinned = top + (i + 1) * peek;
          let p = 1 - (nextTop - pinned) / RANGE;
          if (p < 0) p = 0;
          if (p > 1) p = 1;
          const scale = 1 - p * (1 - target);
          cards[i].style.transform = "scale(" + scale.toFixed(4) + ")";
        }
      };
      const onScroll = () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      update();
    }
  }
})();
