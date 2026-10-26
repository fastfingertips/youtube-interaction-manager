(() => {
    const basePath = globalThis.location.pathname.includes('/store/') ? '../' : './';
    const themeStorageKey = 'youtube-interaction-manager-theme';

    const internalLinks = [
        { href: `${basePath}index.html`, label: 'Home', key: 'home' },
        { href: `${basePath}guide.html`, label: 'Guide', key: 'guide' },
        { href: `${basePath}privacy.html`, label: 'Privacy Policy', key: 'privacy' },
    ];

    const externalLinks = [
        { href: 'https://github.com/fastfingertips/youtube-interaction-manager', label: 'GitHub' },
        { href: 'https://github.com/fastfingertips/youtube-interaction-manager/issues', label: 'Report Issues' },
        { href: 'https://github.com/fastfingertips/youtube-interaction-manager/blob/main/LICENSE', label: 'MIT License' },
    ];

    function getCurrentPage() {
        const path = globalThis.location.pathname.toLowerCase();
        if (path.includes('guide')) return { name: 'Guide', key: 'guide' };
        if (path.includes('privacy')) return { name: 'Privacy Policy', key: 'privacy' };
        return { name: 'Home', key: 'home' };
    }

    function renderLinks(links, currentKey) {
        return links
            .map((link) => {
                const isActive = Boolean(link.key && currentKey && link.key === currentKey);
                if (isActive) {
                    return `<span class="site-header-nav-current" aria-current="page">${link.label}</span>`;
                }
                return `<a href="${link.href}">${link.label}</a>`;
            })
            .join('');
    }

    function getSystemTheme() {
        try {
            if (globalThis.matchMedia('(prefers-color-scheme: light)').matches) {
                return 'light';
            }
            if (globalThis.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }
        } catch {
            return 'dark';
        }

        return 'dark';
    }

    function getStoredTheme() {
        try {
            const storedTheme = globalThis.localStorage.getItem(themeStorageKey);
            return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : null;
        } catch {
            return null;
        }
    }

    function setTheme(theme) {
        document.documentElement.dataset.theme = theme;
        document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
            button.textContent = theme === 'dark' ? '☾' : '☼';
            button.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
            button.setAttribute('title', theme === 'dark' ? 'Dark theme' : 'Light theme');
        });
    }

    function saveTheme(theme) {
        try {
            globalThis.localStorage.setItem(themeStorageKey, theme);
        } catch {
        }
    }

    function renderHeader(target) {
        const current = getCurrentPage();

        target.innerHTML = `
            <button class="site-theme-toggle" type="button" data-theme-toggle aria-label="Toggle theme"></button>
            <header class="site-header">
                <div class="site-header-main">
                    <h1><a href="${basePath}index.html" class="site-header-home-link">YouTube Interaction Manager</a></h1>
                    <p class="site-tagline">Smart interaction manager for YouTube. Auto-like, auto-dislike, and more.</p>
                </div>
                <nav class="site-header-nav" aria-label="Site navigation">
                    ${renderLinks(internalLinks, current.key)}
                </nav>
            </header>
        `;
    }

    function renderFooter(target) {
        target.innerHTML = `
            <footer class="site-footer">
                <p class="site-footer-credit">
                    Made by <a href="https://github.com/fastfingertips">fastfingertips</a> · <a href="https://bugra.co">bugra.co</a>
                </p>
                <img class="site-footer-heart" src="${basePath}heart.gif" alt="" aria-hidden="true" title="giphy: jamestacher">
                <nav class="site-footer-groups" aria-label="Repository links">
                    ${renderLinks(externalLinks)}
                </nav>
            </footer>
        `;
    }

    setTheme(getStoredTheme() || getSystemTheme());
    document.querySelectorAll('[data-site-header]').forEach(renderHeader);
    document.querySelectorAll('[data-site-footer]').forEach(renderFooter);
    setTheme(document.documentElement.dataset.theme);

    function initStickyHeader() {
        const headerContainers = document.querySelectorAll('[data-site-header]');
        if (!headerContainers.length) return;

        let isCompact = false;
        const compactThreshold = 60;
        const uncompactThreshold = 10;

        const updateHeader = () => {
            const y = globalThis.scrollY || document.documentElement.scrollTop || 0;
            if (!isCompact && y > compactThreshold) {
                isCompact = true;
                headerContainers.forEach((el) => el.classList.add('is-compact'));
            } else if (isCompact && y <= uncompactThreshold) {
                isCompact = false;
                headerContainers.forEach((el) => el.classList.remove('is-compact'));
            }
        };

        globalThis.addEventListener('scroll', updateHeader, { passive: true });
        updateHeader();
    }

    initStickyHeader();

    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
        button.addEventListener('click', () => {
            const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
            saveTheme(nextTheme);
            setTheme(nextTheme);
        });
    });
})();
