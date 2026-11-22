// Turns content/site.json into the finished static pages.
// Used by build.mjs (Node) and by the admin page (browser), so both produce the same files.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

// Only safe link types get through; anything else (javascript:, data: ...) is dropped.
const safeUrl = (u) => {
  const s = String(u ?? '').trim();
  return /^(https?:\/\/|mailto:|tel:|#)/i.test(s) || /^[\w./-]+([?#].*)?$/.test(s) ? s : '';
};
const isExternal = (u) => /^https?:\/\//i.test(u);
const asset = (path, base) => esc(isExternal(safeUrl(path)) ? safeUrl(path) : base + safeUrl(path).replace(/^\//, ''));
const ext = (u) => (isExternal(u) ? ' target="_blank" rel="noopener"' : '');
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

export const slugify = (s) => String(s ?? '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const line = (d, size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${d}</svg>`;
const solid = (d, size = 17) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${d}</svg>`;
const ARROW = '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';

const SERVICE_ICONS = {
  pencil: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  browser: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 9h20M9 14l-2 2 2 2M15 14l2 2-2 2"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
  cloud: '<path d="M7 18a4.5 4.5 0 01-.4-9A6 6 0 0118 8.5 4.8 4.8 0 0117.5 18z"/>',
  shield: '<path d="M12 2l8 3v6c0 5-3.4 9-8 11-4.6-2-8-6-8-11V5zM8.5 12l2.5 2.5 4.5-5"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.8 2.8M16.2 16.2L19 19M19 5l-2.8 2.8M7.8 16.2L5 19"/>',
};
export const SERVICE_ICON_NAMES = Object.keys(SERVICE_ICONS);

const SOCIALS = {
  github: ['GitHub', solid('<path d="M12 2a10 10 0 00-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 015 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0012 2z"/>', 18)],
  linkedin: ['LinkedIn', solid('<path d="M4.98 3.5a2.5 2.5 0 11-.01 5 2.5 2.5 0 01.01-5zM3 9h4v12H3zM9 9h3.8v1.7h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6.1V21h-4v-5.5c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21H9z"/>')],
  facebook: ['Facebook', solid('<path d="M14 8V6c0-.9.2-1.4 1.6-1.4H18V1h-3.4C10.9 1 10 3 10 5.6V8H7v4h3v11h4V12h3.3l.5-4z"/>')],
  instagram: ['Instagram', line('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/>', 17)],
  whatsapp: ['WhatsApp', line('<path d="M3 21l1.6-4.6A8.5 8.5 0 1112 20.5a8.4 8.4 0 01-4.4-1.2z"/>', 17)],
  x: ['X', line('<path d="M4 4l16 16M20 4L4 20"/>', 17)],
  youtube: ['YouTube', line('<rect x="2" y="5" width="20" height="14" rx="4"/><path d="M10 9l5 3-5 3z"/>', 17)],
  website: ['Website', line('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>', 17)],
};
export const SOCIAL_NAMES = Object.keys(SOCIALS);

// *word* -> gold text, new line -> <br>
const headline = (s) => esc(s).replace(/\*([^*]+)\*/g, '<span>$1</span>').replace(/\n/g, '<br>');
const breaks = (s) => esc(s).replace(/\n/g, '<br>');

// Small Markdown subset for blog posts. Input is escaped first, so raw HTML never passes through.
function inline(text, base) {
  const codes = [];
  return esc(text)
    .replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, u) => `<img src="${asset(u.replace(/&amp;/g, '&'), base)}" alt="${alt}" loading="lazy">`)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => {
      const url = safeUrl(u.replace(/&amp;/g, '&'));
      return url ? `<a href="${esc(url)}"${ext(url)}>${t}</a>` : t;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`);
}
export function markdown(src, base = '') {
  const out = [];
  const parts = String(src ?? '').replace(/\r\n?/g, '\n').split(/^```.*$/m);
  parts.forEach((part, i) => {
    if (i % 2) {
      out.push(`<pre><code>${esc(part.replace(/^\n|\n$/g, ''))}</code></pre>`);
      return;
    }
    for (const block of part.split(/\n{2,}/)) {
      const b = block.trim();
      if (!b) continue;
      const rows = b.split('\n');
      const heading = /^(#{1,3}) (.+)$/.exec(b);
      if (heading) {
        const tag = heading[1].length < 3 ? 'h2' : 'h3';
        out.push(`<${tag}>${inline(heading[2], base)}</${tag}>`);
      } else if (rows.every((r) => /^[-*] /.test(r))) {
        out.push(`<ul>${rows.map((r) => `<li>${inline(r.slice(2), base)}</li>`).join('')}</ul>`);
      } else if (rows.every((r) => /^\d+\. /.test(r))) {
        out.push(`<ol>${rows.map((r) => `<li>${inline(r.replace(/^\d+\. /, ''), base)}</li>`).join('')}</ol>`);
      } else if (rows.every((r) => /^>/.test(r))) {
        out.push(`<blockquote>${rows.map((r) => inline(r.replace(/^> ?/, ''), base)).join('<br>')}</blockquote>`);
      } else {
        out.push(`<p>${rows.map((r) => inline(r, base)).join('<br>')}</p>`);
      }
    }
  });
  return out.join('\n');
}

const minifyCss = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/ ?([{};,>]) ?/g, '$1').replace(/: /g, ':').replace(/;}/g, '}').trim();
const counterUrl = (d) => (/^https:\/\//i.test(d.footer.counterUrl || '') ? d.footer.counterUrl.trim() : '');
const siteUrl = (d) => d.site.url.replace(/\/?$/, '/');
const posts = (d) => d.blog.posts
  .filter((p) => p.published && slugify(p.slug || p.title))
  .map((p) => ({ ...p, slug: slugify(p.slug || p.title) }))
  .sort((a, b) => String(b.date).localeCompare(String(a.date)));
const niceDate = (s) => {
  const dt = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(+dt) ? esc(s) : dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
};

const theme = (d) => (['light', 'auto'].includes(d.site.theme) ? d.site.theme : 'dark');

function page(d, css, { title, description, path, base, image, type = 'website', ld, body, noindex }) {
  const url = siteUrl(d) + path;
  const img = new URL(image || d.site.ogImage, siteUrl(d)).href;
  const csp = "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; object-src 'none'; base-uri 'none'; form-action https://api.whatsapp.com"
    + (counterUrl(d) ? `; connect-src ${new URL(counterUrl(d)).origin}` : '');
  return `<!DOCTYPE html>
<html lang="en" data-theme="${theme(d)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : `<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${esc(url)}">`}
<meta name="author" content="${esc(d.profile.name)}">
<meta name="theme-color" content="${theme(d) === 'light' ? '#f7f6f3' : '#0b0b0d'}">
<meta name="color-scheme" content="dark light">
<script src="${base}assets/js/theme.js"></script>
${d.site.googleVerification ? `<meta name="google-site-verification" content="${esc(d.site.googleVerification)}">\n` : ''}<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${esc(d.profile.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="${base}assets/fonts/plus-jakarta-sans-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="icon" href="${base}assets/icons/icon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="${base}assets/icons/icon-192.png" sizes="192x192" type="image/png">
<link rel="apple-touch-icon" href="${base}assets/icons/apple-touch-icon.png">
<link rel="manifest" href="${base}site.webmanifest">
<style>${minifyCss(css).replaceAll('%BASE%', base)}</style>
<noscript><style>.clamp{display:block!important}.more,.filters,.alt,.theme{display:none!important}</style></noscript>
<script src="${base}assets/js/site.js" type="module"></script>
${ld ? `<script type="application/ld+json">${json(ld)}</script>\n` : ''}</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${body}
</body>
</html>
`;
}

const NAV = [['about', 'About'], ['services', 'Services'], ['resume', 'Resume'], ['portfolio', 'Portfolio'], ['blog', 'Blog'], ['contact', 'Contact']];

const waLink = (d) => `https://api.whatsapp.com/send?phone=${String(d.profile.whatsapp).replace(/\D/g, '')}&text=${encodeURIComponent('Hello, are you available to chat?')}`;

function header(d, home, active) {
  return `<header class="nav"><div class="w">
<a class="logo" href="${home || '#about'}" aria-label="${esc(d.profile.name)} — home"><i aria-hidden="true">${esc(d.profile.initials)}</i><span>${esc(d.profile.name)}</span></a>
<nav class="links" id="menu" aria-label="Main">${NAV.map(([id, label]) => `<a href="${home}#${id}"${id === active ? ' class="on" aria-current="true"' : ''}>${label}</a>`).join('')}</nav>
<div class="acts">
<button class="theme" type="button" aria-label="Switch between light and dark mode"><svg class="moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 019.5 4 8.5 8.5 0 1020 14.5z"/></svg><svg class="sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5 5l1.8 1.8M17.2 17.2L19 19M19 5l-1.8 1.8M6.8 17.2L5 19"/></svg></button>
<a class="hire" href="${esc(waLink(d))}" target="_blank" rel="noopener">Let's talk ${ARROW}</a>
<button class="menu" type="button" aria-label="Menu" aria-expanded="false" aria-controls="menu">${line('<path d="M4 7h16M4 12h16M4 17h16"/>', 20)}</button>
</div></div></header>`;
}

function footer(d, home) {
  const f = d.footer;
  const counter = counterUrl(d);
  const socials = d.profile.socials.filter((s) => safeUrl(s.url) && s.type !== 'whatsapp');
  return `<footer><div class="w"><span>© ${esc(String(d.site.updated).slice(0, 4))} ${esc(d.profile.name)}. ${esc(f.text)}</span>
${counter ? `<span class="cnt" data-counter="${esc(counter)}" hidden>Visitors <b></b></span>\n` : ''}<ul>${socials.map((s) => `<li><a href="${esc(safeUrl(s.url))}" target="_blank" rel="me noopener">${esc((SOCIALS[s.type] || SOCIALS.website)[0])}</a></li>`).join('')}</ul></div></footer>`;
}

const heading = (s, extra = '') => `<div class="hd"><div><p class="k">${esc(s.kicker)}</p><h2>${esc(s.title)}</h2></div>${extra}</div>`;

function projectCard(p, i, base) {
  const url = safeUrl(p.url);
  const gallery = p.gallery?.length > 0;
  const id = `gallery-${i}`;
  const title = gallery
    ? `<button type="button" class="hit" data-gallery="${id}" aria-haspopup="dialog">${esc(p.title)}</button>`
    : url ? `<a class="hit" href="${esc(url)}"${ext(url)}>${esc(p.title)}</a>` : esc(p.title);
  const alt = `${p.title} — ${p.subtitle}`;
  const thumb = p.image
    ? `<img src="${asset(p.image, base)}" alt="${esc(alt)}" width="${p.wide ? 1100 : 640}" height="${p.wide ? 482 : 360}" loading="lazy" decoding="async"${p.fit === 'contain' ? ' class="fit"' : ''}>`
    : `<span class="ph" aria-hidden="true">${esc(p.title.slice(0, 2).toUpperCase())}</span>`;
  const dialog = gallery ? `
<dialog id="${id}" aria-label="${esc(p.title)} screenshots"><div class="gh"><h3>${esc(p.title)}</h3><div><button type="button" data-step="-1" aria-label="Scroll back">←</button><button type="button" data-step="1" aria-label="Scroll forward">→</button><button type="button" data-close aria-label="Close">✕</button></div></div>
<div class="gs" tabindex="0" role="group" aria-label="Screenshots">${p.gallery.map((g) => `<img src="${asset(g.image, base)}" alt="${esc(g.alt)}" width="540" height="960" loading="lazy" decoding="async">`).join('')}</div>${url ? `<a class="back" href="${esc(url)}"${ext(url)}>Visit project ↗</a>` : ''}</dialog>` : '';
  return `<li class="pj${p.wide ? ' wide' : ''}${url || gallery ? ' act' : ''}" data-cat="${esc(p.category)}"><div class="th">${thumb}<span class="t">${esc(p.category)}</span></div><div class="bd"><div><h3>${title}</h3><p>${esc(p.subtitle)}</p></div>${url || gallery ? `<span class="go" aria-hidden="true">${gallery ? '⤢' : '↗'}</span>` : ''}</div>${dialog}</li>`;
}

const timeline = (items) => `<ol class="tl">${items.map((t) => `<li class="ti${t.current ? ' now' : ''}"><span class="y">${esc(t.period)}</span><h4>${esc(t.title)}</h4><p>${esc(t.text)}</p></li>`).join('')}</ol>`;

function personLd(d) {
  const p = d.profile;
  return {
    '@type': 'Person',
    '@id': `${siteUrl(d)}#person`,
    name: p.name,
    alternateName: p.alternateNames,
    url: siteUrl(d),
    image: new URL(d.site.ogImage, siteUrl(d)).href,
    jobTitle: p.jobTitle,
    description: d.hero.text,
    email: `mailto:${p.email}`,
    telephone: p.phone.replace(/[^\d+]/g, ''),
    address: { '@type': 'PostalAddress', addressLocality: p.city, addressCountry: p.country },
    sameAs: p.socials.filter((s) => s.type !== 'whatsapp').map((s) => s.url),
    knowsAbout: d.services.items.map((s) => s.title),
  };
}

function renderIndex(d, css) {
  const base = '';
  const p = d.profile;
  const projects = d.portfolio.projects;
  const list = posts(d);
  const stat = (v) => esc(String(v).replace('auto:projects', projects.length).replace('auto:clients', d.clients.length)).replace(/\+$/, '<em>+</em>');
  const resume = safeUrl(p.resumeUrl);

  const body = `${header(d, '', 'about')}
<main id="main">
<div class="hero" id="about"><div class="w">
<div>
<p class="badge"><b></b>${esc(d.hero.badge)}</p>
<h1>${headline(d.hero.headline)}</h1>
<p>${esc(d.hero.text)}</p>
<div class="ctas"><a class="b1" href="#portfolio">View my work ${ARROW}</a>${resume ? `<a class="b2" href="${esc(resume)}"${isExternal(resume) ? ext(resume) : ' download'}>${line('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>', 16)}Download CV</a>` : ''}</div>
<div class="soc">${p.socials.filter((s) => safeUrl(s.url)).map((s) => { const [label, icon] = SOCIALS[s.type] || SOCIALS.website; return `<a href="${esc(safeUrl(s.url))}" target="_blank" rel="me noopener" aria-label="${label}">${icon}</a>`; }).join('')}</div>
</div>
<div class="pc">
<div class="av">${p.photo ? `<img src="${asset(p.photo, base)}" alt="${esc(p.name)} avatar" width="654" height="530" fetchpriority="high">` : `<b aria-hidden="true">${esc(p.initials)}</b>`}${p.tagline ? `<small>${esc(p.tagline)}</small>` : ''}</div>
<h2>${esc(p.name)}</h2>
<p class="r">${esc(p.role)}</p>
<ul class="ci">
<li><a href="mailto:${esc(p.email)}">${line('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>', 18)}<span><small>EMAIL</small>${esc(p.email)}</span></a></li>
<li><a href="tel:${esc(p.phone.replace(/[^\d+]/g, ''))}">${line('<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>', 18)}<span><small>PHONE</small>${esc(p.phone)}</span></a></li>
<li><div>${line('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>', 18)}<span><small>LOCATION</small>${esc(p.city)}, ${esc(p.country)}</span></div></li>
</ul>
</div>
</div></div>

<div class="w"><dl class="stats">${d.stats.map((s) => `<div><dt>${esc(s.label)}</dt><dd>${stat(s.value)}</dd></div>`).join('')}</dl></div>

<section id="services"><div class="w">
${heading(d.services, `<p>${esc(d.services.intro)}</p>`)}
<div class="sv">${d.services.items.map((s) => {
    const pct = Math.max(0, Math.min(100, Number(s.percent) || 0));
    return `<article class="sc${s.featured ? ' f' : ''}"><div class="ic">${line(SERVICE_ICONS[s.icon] || SERVICE_ICONS.browser)}</div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>${pct ? `<div class="pct"><span>Proficiency</span><span>${pct}%</span></div><div class="bar"><i style="width:${pct}%"></i></div>` : ''}</article>`;
  }).join('')}</div>
</div></section>

<section id="resume"><div class="w">
${heading(d.resume)}
<div class="rs">
<div class="box"><h3><span>${line('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/>', 20)}</span>Experience</h3>${timeline(d.resume.experience)}</div>
<div class="box"><h3><span>${line('<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>', 20)}</span>Education</h3>${timeline(d.resume.education)}${resume ? `<a class="cv" href="${esc(resume)}" target="_blank" rel="noopener"><span>Full résumé (PDF)</span><b>View resume →</b></a>` : ''}</div>
</div>
</div></section>

<section id="portfolio"><div class="w">
${heading(d.portfolio, `<div class="filters" role="group" aria-label="Filter projects"><button type="button" class="on" aria-pressed="true" data-filter="">All</button>${d.portfolio.categories.map((c) => `<button type="button" aria-pressed="false" data-filter="${esc(c)}">${esc(c)}</button>`).join('')}</div>`)}
<ul class="pg">
${projects.map((x, i) => projectCard(x, i, base)).join('\n')}
</ul>
</div></section>

<section id="recommendations"><div class="w">
${heading(d.recommendations)}
<div class="rc">${d.recommendations.items.map((r, i) => {
    const url = safeUrl(r.url);
    const long = r.text.length > 260;
    return `<figure class="rq"><span class="q" aria-hidden="true">”</span><blockquote id="rec-${i}"${long ? ' class="clamp"' : ''}>${esc(r.text)}</blockquote>${long ? `<button type="button" class="more" aria-controls="rec-${i}" aria-expanded="false">Read more</button>` : ''}<figcaption class="who"><span class="ava ${esc(r.color)}" aria-hidden="true">${esc(r.initials)}</span><span><b>${esc(r.name)}</b><small>${esc(r.role)}</small></span>${url ? `<a class="go" href="${esc(url)}"${ext(url)} aria-label="${esc(r.name)} profile">↗</a>` : ''}</figcaption></figure>`;
  }).join('')}</div>
${d.clients.length ? `<ul class="cl" aria-label="Clients">${d.clients.map((c) => {
    const url = safeUrl(c.url);
    const img = c.logo ? `<img src="${asset(c.logo, base)}" alt="${esc(c.name)}" width="172" height="70" loading="lazy" decoding="async">` : esc(c.name);
    return `<li>${url ? `<a href="${esc(url)}"${ext(url)}>${img}</a>` : `<div>${img}</div>`}</li>`;
  }).join('')}</ul>` : ''}
</div></section>

<section id="blog"><div class="w">
${heading(d.blog)}
${list.length ? `<ul class="bl">${list.map((x) => `<li class="pj act">${x.image ? `<div class="th"><img src="${asset(x.image, base)}" alt="" width="640" height="360" loading="lazy" decoding="async"></div>` : ''}<div class="bd"><time datetime="${esc(x.date)}">${niceDate(x.date)}</time><h3><a class="hit" href="blog/${x.slug}/">${esc(x.title)}</a></h3><p>${esc(x.summary)}</p></div></li>`).join('')}</ul>` : `<p class="soon">${esc(d.blog.emptyText)}</p>`}
</div></section>

<div class="w"><div class="ct" id="contact">
<div><p class="k">${esc(d.contact.kicker)}</p><h2>${breaks(d.contact.title)}</h2><p>Reach me at <a class="g" href="mailto:${esc(p.email)}">${esc(p.email)}</a> ${esc(d.contact.text)}</p></div>
<form class="form" action="https://api.whatsapp.com/send" method="get" data-phone="${esc(String(p.whatsapp).replace(/\D/g, ''))}">
<input type="hidden" name="phone" value="${esc(String(p.whatsapp).replace(/\D/g, ''))}">
<label><span class="sr">Your name</span><input name="name" placeholder="Your name" autocomplete="name" required></label>
<label><span class="sr">Email address</span><input name="email" type="email" placeholder="Email address" autocomplete="email"></label>
<label><span class="sr">Message</span><textarea name="text" placeholder="Tell me about your project…" required></textarea></label>
<button class="b1" type="submit">Send message ${ARROW}</button>
<p class="alt">Opens WhatsApp. <button type="button" data-email="${esc(p.email)}">Send by email instead</button></p>
</form>
</div></div>
</main>
${footer(d, '')}`;

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${siteUrl(d)}#website`, url: siteUrl(d), name: p.name, inLanguage: 'en', publisher: { '@id': `${siteUrl(d)}#person` } },
      { '@type': 'ProfilePage', '@id': siteUrl(d), url: siteUrl(d), name: d.site.title, dateModified: d.site.updated, isPartOf: { '@id': `${siteUrl(d)}#website` }, mainEntity: { '@id': `${siteUrl(d)}#person` } },
      personLd(d),
      {
        '@type': 'ItemList',
        name: d.portfolio.title,
        itemListElement: projects.map((x, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'CreativeWork',
            name: x.title,
            description: x.subtitle,
            genre: x.category,
            creator: { '@id': `${siteUrl(d)}#person` },
            ...(safeUrl(x.url) && { url: x.url }),
            ...(x.image && { image: new URL(x.image, siteUrl(d)).href }),
          },
        })),
      },
    ],
  };
  return page(d, css, { title: d.site.title, description: d.site.description, path: '', base, type: 'profile', ld, body });
}

function renderPost(d, css, x) {
  const base = '../../';
  const url = `${siteUrl(d)}blog/${x.slug}/`;
  const body = `${header(d, base, 'blog')}
<main id="main"><article class="w post">
<a class="back" href="${base}#blog">← ${esc(d.blog.title)}</a>
<h1>${esc(x.title)}</h1>
<time datetime="${esc(x.date)}">${niceDate(x.date)}</time>
${x.image ? `<img class="cover" src="${asset(x.image, base)}" alt="" fetchpriority="high">\n` : ''}<div class="prose">
${markdown(x.body, base)}
</div>
</article></main>
${footer(d, base)}`;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: x.title,
    description: x.summary,
    datePublished: x.date,
    mainEntityOfPage: url,
    image: new URL(x.image || d.site.ogImage, siteUrl(d)).href,
    author: { '@type': 'Person', name: d.profile.name, url: siteUrl(d) },
  };
  return page(d, css, { title: `${x.title} — ${d.profile.name}`, description: x.summary || x.title, path: `blog/${x.slug}/`, base, image: x.image, type: 'article', ld, body });
}

function render404(d, css) {
  // Served for any missing address, so every path must be absolute.
  const base = '/';
  const body = `${header(d, base)}
<main id="main"><div class="w post"><p class="k">404</p><h1>This page does not exist.</h1><p class="soon">The link may be old or mistyped.</p><p><a class="back" href="/">← Back to the home page</a></p></div></main>
${footer(d, base)}`;
  return page(d, css, { title: `Page not found — ${d.profile.name}`, description: 'This page does not exist.', path: '404.html', base, body, noindex: true });
}

// Returns every generated file: { "path": "content" }
export function renderSite(d, css) {
  const list = posts(d);
  const files = {
    'index.html': renderIndex(d, css),
    '404.html': render404(d, css),
    'robots.txt': `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl(d)}sitemap.xml\n`,
    'sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${esc(siteUrl(d))}</loc><lastmod>${esc(d.site.updated)}</lastmod></url>
${list.map((x) => `<url><loc>${esc(siteUrl(d))}blog/${x.slug}/</loc><lastmod>${esc(x.date)}</lastmod></url>\n`).join('')}</urlset>
`,
    'site.webmanifest': `${JSON.stringify({
      name: d.profile.name,
      short_name: d.profile.name,
      start_url: './',
      display: 'browser',
      background_color: '#0b0b0d',
      theme_color: '#0b0b0d',
      icons: [192, 512].map((n) => ({ src: `assets/icons/icon-${n}.png`, sizes: `${n}x${n}`, type: 'image/png' })),
    }, null, 2)}\n`,
  };
  for (const x of list) files[`blog/${x.slug}/index.html`] = renderPost(d, css, x);
  return files;
}
