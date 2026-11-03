/* ==========================================================================
   NovaByte Solutions - interactive effects (vanilla JavaScript, no libraries)

   The page works without this file. JavaScript only adds the extras:
   loader, custom cursor, scroll parallax, pinned horizontal services,
   number counters, reveal-on-scroll, active nav link and neon particles.

   Core idea: every frame we measure how far the user has scrolled through
   a section (0 to 1) and move layers by different amounts (parallax).
   Values are eased with lerp() so movement glides smoothly.
   ========================================================================== */

(function () {
    "use strict";

    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const isPhone = () => window.innerWidth <= 576;

    // ---------- Helpers ----------
    const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => Array.from(document.querySelectorAll(sel));

    // 0 when a tall section's top reaches the top of the screen,
    // 1 when its bottom reaches the bottom of the screen.
    function stickyProgress(section) {
        const rect = section.getBoundingClientRect();
        const distance = rect.height - window.innerHeight;
        return distance > 0 ? clamp(-rect.top / distance) : 0;
    }

    // ---------- 1. Loader ----------
    const preloader = $(".preloader");
    const loadCount = $("#load-count");
    const loadStart = performance.now();
    const loadTime = reduceMotion ? 150 : 1500;

    (function tickLoader(now) {
        const t = clamp((now - loadStart) / loadTime);
        const eased = 1 - Math.pow(1 - t, 3);
        loadCount.textContent = Math.round(eased * 100);
        preloader.style.setProperty("--load", eased);
        if (t < 1) {
            requestAnimationFrame(tickLoader);
        } else {
            root.classList.add("is-loaded");
            // Once the letters have flown in, switch them to float + hover mode
            setTimeout(() => root.classList.add("intro-done"), 1800);
        }
    })(loadStart);

    // ---------- 2. Custom cursor (mouse devices only) ----------
    const dot = $(".cursor-dot");
    const ring = $(".cursor-ring");
    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { x: mouse.x, y: mouse.y };
    const tilt = { x: 0, y: 0, tx: 0, ty: 0 };

    if (finePointer && !reduceMotion) {
        root.classList.add("has-cursor");
    }

    window.addEventListener("mousemove", (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        tilt.tx = (e.clientX / window.innerWidth) * 2 - 1;
        tilt.ty = (e.clientY / window.innerHeight) * 2 - 1;
    });

    $$("a, button, .panel, .flip-card, .letter, label").forEach((el) => {
        el.addEventListener("mouseenter", () => ring.classList.add("is-hover"));
        el.addEventListener("mouseleave", () => ring.classList.remove("is-hover"));
    });

    // ---------- 3. Mobile menu closes after choosing a link ----------
    const navToggle = $("#nav-toggle");
    $$(".main-nav a").forEach((link) => {
        link.addEventListener("click", () => { navToggle.checked = false; });
    });

    // ---------- 4. Hero layers ----------
    // y = movement in vh, s = extra scale, m = mouse tilt in px
    const hero = $(".hero");
    const heroLayers = [
        { el: $(".layer-sky"), y: 0, s: 0.05, m: 4 },
        { el: $(".layer-moon"), y: -22, s: 0.25, m: 10 },
        { el: $(".layer-far"), y: -6, s: 0.15, m: 14 },
        { el: $(".layer-title"), y: -36, s: 0.3, m: 22, fade: true },
        { el: $(".layer-mid"), y: 6, s: 0.45, m: 30 },
        { el: $(".layer-near"), y: 24, s: 1.1, m: 46 },
        { el: $(".layer-floor"), y: 10, s: 0.4, m: 0 }
    ];
    const heroCopy = $(".hero-copy");
    const heroBottom = $(".hero-bottom");
    const heroVertical = $(".hero .vertical-text");

    // ---------- 5. About window parallax ----------
    const win = $(".window");
    const winFar = $(".win-far");
    const winMid = $(".win-mid");
    const winMoon = $(".small-moon");

    // ---------- 6. Services pinned track ----------
    const services = $(".services");
    const track = $(".services-track");
    const servicesBar = $(".services-progress");

    // ---------- 7. Header, progress line, active link ----------
    const header = $(".site-header");
    const progressBar = $(".progress");
    const sections = $$("main section[id]");
    const navLinks = $$(".main-nav a");
    const chapterItems = $$(".chapter-index li");
    const chapterOf = { home: 0, about: 1, services: 2, features: 3, team: 3, contact: 3 };

    const state = { hero: 0, services: 0, page: 0, win: 0 };
    const ease = reduceMotion ? 1 : 0.09;

    function frame() {
        const maxScroll = root.scrollHeight - window.innerHeight;
        const winRect = win.getBoundingClientRect();

        state.hero = lerp(state.hero, stickyProgress(hero), ease);
        state.services = lerp(state.services, isPhone() ? 0 : stickyProgress(services), ease);
        state.page = lerp(state.page, maxScroll > 0 ? window.scrollY / maxScroll : 0, ease);
        state.win = lerp(state.win, clamp(1 - (winRect.top + winRect.height) / (window.innerHeight + winRect.height)), ease);
        tilt.x = lerp(tilt.x, reduceMotion ? 0 : tilt.tx, 0.06);
        tilt.y = lerp(tilt.y, reduceMotion ? 0 : tilt.ty, 0.06);

        // Hero: each layer moves, grows and tilts by a different amount
        const p = state.hero;
        heroLayers.forEach((layer) => {
            const mx = -tilt.x * layer.m;
            const my = -tilt.y * layer.m * 0.4;
            layer.el.style.transform =
                `translate3d(${mx}px, calc(${p * layer.y}vh + ${my}px), 0) scale(${1 + p * layer.s})`;
            if (layer.fade) {
                layer.el.style.opacity = clamp(1 - (p - 0.35) * 2.5);
            }
        });
        heroCopy.style.opacity = clamp(1 - p * 4);
        heroCopy.style.transform = `translate3d(0, ${-p * 60}px, 0)`;
        heroVertical.style.opacity = clamp(1 - p * 4);
        heroBottom.style.opacity = clamp(1 - p * 4);
        heroBottom.style.visibility = p > 0.3 ? "hidden" : "visible";

        // About window: inner layers drift at different speeds
        winFar.style.transform = `translate3d(0, ${(state.win - 0.5) * 30}px, 0)`;
        winMid.style.transform = `translate3d(0, ${(state.win - 0.5) * -40}px, 0) scale(1.05)`;
        winMoon.style.transform = `translate3d(0, ${(state.win - 0.5) * 80}px, 0)`;

        // Services: slide the track sideways while the section is pinned
        if (isPhone()) {
            track.style.transform = "none";
        } else {
            const distance = Math.max(track.scrollWidth - window.innerWidth, 0);
            track.style.transform = `translate3d(${-state.services * distance}px, 0, 0)`;
            servicesBar.style.setProperty("--services", state.services);
        }

        // Page progress line and solid header after scrolling
        progressBar.style.setProperty("--progress", state.page);
        header.classList.toggle("is-scrolled", window.scrollY > window.innerHeight * 0.5);

        // Highlight the nav link of the section in the middle of the screen
        const middle = window.innerHeight * 0.45;
        sections.forEach((section) => {
            const r = section.getBoundingClientRect();
            if (r.top <= middle && r.bottom > middle) {
                navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${section.id}`));
                chapterItems.forEach((li, i) => li.classList.toggle("is-active", i === chapterOf[section.id]));
            }
        });

        // Cursor: the dot follows exactly, the ring trails behind
        ringPos.x = lerp(ringPos.x, mouse.x, 0.18);
        ringPos.y = lerp(ringPos.y, mouse.y, 0.18);
        dot.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0)`;
        ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;

        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // ---------- 8. Reveal on scroll ----------
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const group = Array.from(el.parentElement.children).filter((c) => c.classList.contains("reveal"));
            el.style.transitionDelay = `${Math.min(group.indexOf(el), 5) * 0.08}s`;
            el.classList.add("is-visible");
            revealObserver.unobserve(el);
        });
    }, { threshold: 0.15 });
    $$(".reveal").forEach((el) => revealObserver.observe(el));

    // ---------- 9. Number counters ----------
    const countObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = Number(el.dataset.target);
            const start = performance.now();
            const duration = reduceMotion ? 1 : 1800;
            (function count(now) {
                const t = clamp((now - start) / duration);
                el.textContent = Math.round((1 - Math.pow(1 - t, 3)) * target);
                if (t < 1) requestAnimationFrame(count);
            })(start);
            countObserver.unobserve(el);
        });
    }, { threshold: 0.6 });
    $$(".count").forEach((el) => {
        el.textContent = "0";
        countObserver.observe(el);
    });

    // ---------- 10. Floating neon particles ----------
    const canvas = $(".particles");
    const ctx = canvas.getContext("2d");
    const colors = ["255, 45, 149", "31, 169, 221", "143, 216, 242"];
    let particles = [];
    let dpr = 1;

    function makeParticle(anywhere) {
        return {
            x: Math.random() * window.innerWidth,
            y: anywhere ? Math.random() * window.innerHeight : window.innerHeight + 10,
            r: Math.random() * 1.8 + 0.4,
            speed: Math.random() * 0.4 + 0.15,
            drift: Math.random() * 0.6 - 0.3,
            phase: Math.random() * Math.PI * 2,
            color: colors[Math.floor(Math.random() * colors.length)]
        };
    }

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        const count = isPhone() ? 30 : 65;
        particles = Array.from({ length: count }, () => makeParticle(true));
    }

    function drawParticles(time) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.globalCompositeOperation = "lighter";
        particles.forEach((pt, i) => {
            pt.y -= pt.speed;
            pt.x += pt.drift + Math.sin(time / 1500 + pt.phase) * 0.2;
            if (pt.y < -10) particles[i] = makeParticle(false);
            const alpha = 0.35 + Math.sin(time / 600 + pt.phase) * 0.3;
            const glow = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pt.r * 5);
            glow.addColorStop(0, `rgba(${pt.color}, ${alpha})`);
            glow.addColorStop(1, `rgba(${pt.color}, 0)`);
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.r * 5, 0, Math.PI * 2);
            ctx.fill();
        });
        if (!reduceMotion) requestAnimationFrame(drawParticles);
    }

    window.addEventListener("resize", resize);
    resize();
    requestAnimationFrame(drawParticles);
})();
