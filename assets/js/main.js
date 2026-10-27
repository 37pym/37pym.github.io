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

  /* --- Section pin + scrub: セクションを固定して中身をスクロール --- */
  if (!reduceMotion) {
    const pinSecs = Array.prototype.slice.call(document.querySelectorAll("section.pin"));
    const pinItems = [];
    pinSecs.forEach(function (sec) {
      const vp = document.createElement("div");
      vp.className = "pin__vp";
      const tr = document.createElement("div");
      const keep = sec.className.split(/\s+/).filter(function (c) {
        return c && c !== "pin" && c !== "reveal"; // revealはtransform衝突するため外す
      });
      tr.className = "pin__tr " + keep.join(" ");
      while (sec.firstChild) tr.appendChild(sec.firstChild);
      vp.appendChild(tr);
      sec.appendChild(vp);
      sec.className = "pin"; // 外枠はスペーサーのみ（idは保持＝アンカー用）
      pinItems.push({ sec: sec, vp: vp, tr: tr, scrollable: 0 });
    });

    if (pinItems.length) {
      let pinTick = false;
      const pinScroll = function () {
        pinTick = false;
        pinItems.forEach(function (it) {
          if (it.scrollable <= 0) {
            it.tr.style.transform = "none";
            return;
          }
          let p = -it.sec.getBoundingClientRect().top / it.scrollable;
          if (p < 0) p = 0;
          if (p > 1) p = 1;
          it.tr.style.transform = "translateY(" + (-p * it.scrollable).toFixed(2) + "px)";
        });
      };
      const pinLayout = function () {
        const vh = window.innerHeight;
        pinItems.forEach(function (it) {
          it.vp.style.height = vh + "px";
          it.tr.style.transform = "none";
          it.scrollable = Math.max(0, it.tr.offsetHeight - vh);
          it.sec.style.height = vh + it.scrollable + "px";
        });
        pinScroll();
      };
      const pinReq = function () {
        if (!pinTick) {
          pinTick = true;
          requestAnimationFrame(pinScroll);
        }
      };
      window.addEventListener("scroll", pinReq, { passive: true });
      window.addEventListener("resize", pinLayout, { passive: true });
      window.addEventListener("load", pinLayout); // 画像・フォント確定後に再計測
      pinLayout();
    }
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
})();
