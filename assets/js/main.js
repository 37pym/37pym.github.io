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

  /* セクションの送りはブラウザ標準のスクロール＋CSS scroll-snap に任せる。
     （JS でスクロールに連動させる transform 方式は、ネイティブより常に1フレーム
     遅れてカクつく原因になるため廃止） */
})();
