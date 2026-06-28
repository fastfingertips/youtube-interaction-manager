(() => {
    const basePath = globalThis.location.pathname.includes('/store/') ? '../' : './';

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

    function renderHeader(target) {
        target.innerHTML = `
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
                <nav class="site-footer-groups" aria-label="Repository links">
                    ${renderLinks(externalLinks)}
                </nav>
            </footer>
        `;
    }

    document.querySelectorAll('[data-site-header]').forEach(renderHeader);
    document.querySelectorAll('[data-site-footer]').forEach(renderFooter);
})();
