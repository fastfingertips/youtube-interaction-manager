(() => {
    const basePath = globalThis.location.pathname.includes('/store/') ? '../' : './';
    const themeStorageKey = 'youtube-interaction-manager-theme';

    const internalLinks = [
        { href: `${basePath}index.html`, label: 'Home' },
        { href: `${basePath}guide.html`, label: 'Guide' },
        { href: `${basePath}privacy.html`, label: 'Privacy Policy' },
    ];

    const externalLinks = [
        { href: 'https://github.com/fastfingertips/youtube-interaction-manager', label: 'GitHub' },
        { href: 'https://github.com/fastfingertips/youtube-interaction-manager/issues', label: 'Report Issues' },
        { href: 'https://github.com/fastfingertips/youtube-interaction-manager/blob/main/LICENSE', label: 'MIT License' },
    ];

    function renderLinks(links) {
        return links
            .map((link) => `<a href="${link.href}">${link.label}</a>`)
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
        target.innerHTML = `
            <button class="site-theme-toggle" type="button" data-theme-toggle aria-label="Toggle theme"></button>
            <header class="site-header">
                <div class="site-header-main">
                    <h1>YouTube Interaction Manager</h1>
                    <p class="site-tagline">Smart interaction manager for YouTube. Auto-like, auto-dislike, and more.</p>
                </div>
                <nav class="site-header-nav" aria-label="Site navigation">
                    ${renderLinks(internalLinks)}
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

    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
        button.addEventListener('click', () => {
            const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
            saveTheme(nextTheme);
            setTheme(nextTheme);
        });
    });
})();
