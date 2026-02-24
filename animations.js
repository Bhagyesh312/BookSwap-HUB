/**
 * animations.js — Shared scroll-reveal & micro-interaction logic
 * Include at the bottom of every page <body>
 */

/* ── 1. Intersection Observer: scroll-reveal ──────────────── */
(function () {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    observer.unobserve(entry.target); // animate once
                }
            });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    // Observe every element that has the data-animate attribute
    document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
})();

/* ── 2. Scroll-to-top button ──────────────────────────────── */
(function () {
    // Create the button dynamically so no HTML change is needed per page
    const btn = document.createElement('button');
    btn.id = 'scrollTopBtn';
    btn.title = 'Back to top';
    btn.textContent = '↑';
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 320);
    }, { passive: true });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();

/* ── 3. Ripple effect on all primary / action buttons ─────── */
(function () {
    const rippleTargets = document.querySelectorAll(
        '.btn, .nav-btn, .submit-btn, .action-btn, .buy-btn, .cart, .buy, .checkout, .details-add-btn, .toggle-btn, .option-btn'
    );

    rippleTargets.forEach((el) => {
        el.classList.add('ripple-host');
        el.addEventListener('click', function (e) {
            const rect = el.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 1.5;
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
            el.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
})();

/* ── 4. Navbar shrink on scroll ───────────────────────────── */
(function () {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        navbar.style.transition = 'padding 0.35s ease, box-shadow 0.35s ease';
        if (window.scrollY > 60) {
            navbar.style.boxShadow = '0 4px 30px rgba(62,39,35,0.45)';
        } else {
            navbar.style.boxShadow = '';
        }
    }, { passive: true });
})();

/* ── 5. Tilt effect on feature boxes ─────────────────────── */
(function () {
    const tiltEls = document.querySelectorAll('.box, .about-card, .sell-card');
    const MAX_TILT = 6; // degrees

    tiltEls.forEach((el) => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = (e.clientX - cx) / (rect.width / 2);
            const dy = (e.clientY - cy) / (rect.height / 2);
            el.style.transform = `perspective(800px) rotateY(${dx * MAX_TILT}deg) rotateX(${-dy * MAX_TILT}deg) translateY(-8px)`;
        });

        el.addEventListener('mouseleave', () => {
            el.style.transform = '';
            el.style.transition = 'transform 0.5s cubic-bezier(0.22,1,0.36,1)';
        });
    });
})();

/* ── 6. Typed text effect on hero heading (home page only) ── */
(function () {
    const heroHeading = document.querySelector('.hero-text h2');
    if (!heroHeading) return; // only on home page

    heroHeading.style.opacity = '0';
    setTimeout(() => {
        heroHeading.style.transition = 'opacity 0.6s ease';
        heroHeading.style.opacity = '1';
    }, 300);
})();

/* ── 7. Counter animation for numbers in hero stat row ──────
   (works if the page has elements with data-count attribute) */
(function () {
    const countEls = document.querySelectorAll('[data-count]');
    const countObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseInt(el.dataset.count, 10);
            let current = 0;
            const step = Math.ceil(target / 60);
            const timer = setInterval(() => {
                current = Math.min(current + step, target);
                el.textContent = current.toLocaleString();
                if (current >= target) clearInterval(timer);
            }, 20);
            countObserver.unobserve(el);
        });
    }, { threshold: 0.5 });

    countEls.forEach((el) => countObserver.observe(el));
})();

/* ── 8. About page — cinematic split-reveal observer ─────────
   Adds `in-view` class to .about-reveal-left / .about-reveal-right
   when they scroll into view, triggering the new CSS animations.  */
(function () {
    const rows = document.querySelectorAll('.about-reveal-left, .about-reveal-right');
    if (!rows.length) return; // only runs on about.html

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target); // trigger once
                }
            });
        },
        { threshold: 0.18, rootMargin: '0px 0px -60px 0px' }
    );

    rows.forEach((row) => observer.observe(row));
})();
