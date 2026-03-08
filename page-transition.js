// Insert loader styles and HTML immediately so it blocks rendering flash
(function () {
    // Create the global loader HTML if it hasn't been added
    if (!document.getElementById('global-loader')) {
        const loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.innerHTML = `
            <div class="loader-spinner"></div>
            <div class="loader-text">Loading...</div>
        `;
        document.documentElement.appendChild(loader);
    }
    document.documentElement.classList.add('pause-animations');
})();

document.addEventListener('DOMContentLoaded', () => {
    const loaderEl = document.getElementById('global-loader');

    // Hide loader cleanly when page is fully loaded
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (loaderEl) loaderEl.classList.add('hidden');
            document.documentElement.classList.remove('pause-animations');
        }, 200);
    });

    // Fallback if window load takes too long
    setTimeout(() => {
        if (loaderEl) loaderEl.classList.add('hidden');
        document.documentElement.classList.remove('pause-animations');
    }, 2000);

    // Intercept navigation links
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');

        // Ignore links that don't transition pages
        if (!href ||
            href.startsWith('#') ||
            href.startsWith('javascript:') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:') ||
            link.target === '_blank' ||
            link.hasAttribute('download')) {
            return;
        }

        // Only intercept internal links (same origin)
        try {
            const url = new URL(href, window.location.origin);
            if (url.origin !== window.location.origin) return;
        } catch (err) {
            return; // Invalid URL, let browser handle it
        }

        // If it's a valid navigation, show the loader and delay
        e.preventDefault();

        if (loaderEl) {
            loaderEl.classList.remove('hidden');
        }

        setTimeout(() => {
            window.location.href = href;
        }, 400); // reduced loader time
    });
});
