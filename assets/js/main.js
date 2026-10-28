// 37pym portfolio — interactions
// landing-page-design / Part B: IntersectionObserver ベースのリビール、base curve、reduced-motion 尊重

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Hero mosaic: セルを複製して -50% ループをシームレスに --- */
  const mosaic = document.querySelector("[data-mosaic]");
  if (mosaic) {
    mosaic.querySelectorAll(".mcol").forEach((col) => {
      Array.prototype.slice.call(col.children).forEach((cell) => {
        col.appendChild(cell.cloneNode(true));
      });
    });
  }

  /* --- Intro 解除: 一度 hidden 状態を描画してから transition で表示 --- */
  if (document.documentElement.classList.contains("intro")) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.documentElement.classList.remove("intro");
      });
    });
  }

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

  /* --- Section pin + scrub (PC 限定・ネイティブスクロール) --- */
  /* 各セクションの上端が画面上端に達すると固定し、固定中は中身をスクロール量に
     連動して上へ送る。送り切ると固定が解け、次のセクションが下から上がってくる。
     スタック版(#works-stack)は自前の position:sticky を持つため対象外（壊さない）。 */
  const pinMq = window.matchMedia("(min-width: 960px)");
  let pins = [];
  let pinBuilt = false;
  let pinTicking = false;

  function pinMeasure() {
    const vh = window.innerHeight;
    pins.forEach((p) => {
      let extra = p.sec.offsetHeight - vh; // 中身が画面より高い分だけ送る
      if (extra < 4) extra = 0;            // 1画面に収まるセクションは送らない
      p.extra = extra;
      p.track.style.height = vh + extra + "px";
    });
  }

  function pinUpdate() {
    pins.forEach((p) => {
      let ty = 0;
      if (p.extra > 0) {
        let prog = -p.track.getBoundingClientRect().top / p.extra;
        prog = prog < 0 ? 0 : prog > 1 ? 1 : prog;
        ty = -(prog * p.extra);
      }
      p.sec.style.transform = "translate3d(0," + ty + "px,0)";
    });
  }

  function onPinScroll() {
    if (pinTicking) return;
    pinTicking = true;
    requestAnimationFrame(() => {
      pinUpdate();
      pinTicking = false;
    });
  }

  function buildPins() {
    if (pinBuilt) return;
    document.querySelectorAll("#main > section").forEach((sec) => {
      if (sec.id === "works-stack") return; // 既存 sticky を壊さないため除外
      const track = document.createElement("div");
      track.className = "pin";
      const stage = document.createElement("div");
      stage.className = "pin__stage";
      sec.parentNode.insertBefore(track, sec);
      track.appendChild(stage);
      stage.appendChild(sec);
      pins.push({ track, stage, sec, extra: 0 });
    });
    pinBuilt = true;
    pinMeasure();
    pinUpdate();
    window.addEventListener("scroll", onPinScroll, { passive: true });
  }

  function teardownPins() {
    if (!pinBuilt) return;
    window.removeEventListener("scroll", onPinScroll);
    pins.forEach((p) => {
      p.track.parentNode.insertBefore(p.sec, p.track);
      p.sec.style.transform = "";
      p.track.remove();
    });
    pins = [];
    pinBuilt = false;
  }

  function syncPins() {
    if (reduceMotion || !pinMq.matches) teardownPins();
    else buildPins();
  }

  syncPins();
  if (pinMq.addEventListener) pinMq.addEventListener("change", syncPins);
  else if (pinMq.addListener) pinMq.addListener(syncPins);

  let pinResizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(pinResizeTimer);
    pinResizeTimer = setTimeout(() => {
      if (pinBuilt) {
        pinMeasure();
        pinUpdate();
      }
    }, 150);
  });
  window.addEventListener("load", () => {
    if (pinBuilt) {
      pinMeasure();
      pinUpdate();
    }
  });
})();
