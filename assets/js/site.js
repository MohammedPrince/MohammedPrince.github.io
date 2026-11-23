// Small enhancements only: the page is complete HTML without this file.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// Light / dark mode. The saved choice is applied in the page head, before painting.
const themeBtn = $('.theme');
if (themeBtn) {
  const root = document.documentElement;
  const system = matchMedia('(prefers-color-scheme: light)');
  const isLight = () => root.dataset.theme === 'light' || (root.dataset.theme === 'auto' && system.matches);
  const sync = () => {
    themeBtn.setAttribute('aria-label', isLight() ? 'Switch to dark mode' : 'Switch to light mode');
    $('meta[name="theme-color"]').content = getComputedStyle(root).getPropertyValue('--bg').trim();
  };
  themeBtn.addEventListener('click', () => {
    const next = isLight() ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch { /* storage blocked: lasts for this page only */ }
    sync();
  });
  system.addEventListener('change', sync);
  sync();
}

// Mobile menu
const menu = $('.menu');
const links = $('.links');
if (menu) {
  const toggle = (open) => {
    links.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', open);
  };
  menu.addEventListener('click', () => toggle(!links.classList.contains('open')));
  links.addEventListener('click', () => toggle(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && links.classList.contains('open')) {
      toggle(false);
      menu.focus();
    }
  });
}

// Highlight the section being read
const spy = new Map();
for (const a of $$('.links a[href^="#"]')) {
  const target = document.getElementById(a.hash.slice(1));
  if (target) spy.set(target, a);
}
if (spy.size) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      for (const a of spy.values()) {
        a.classList.remove('on');
        a.removeAttribute('aria-current');
      }
      const active = spy.get(e.target);
      active.classList.add('on');
      active.setAttribute('aria-current', 'true');
    }
  }, { rootMargin: '-40% 0px -55% 0px' });
  for (const el of spy.keys()) io.observe(el);
}

// Share: the phone's own share sheet (WhatsApp, Telegram, Instagram…) when available, else a panel of links
const sharePanel = $('#share');
for (const btn of $$('[data-share]')) {
  if (!navigator.share && !sharePanel) continue;
  btn.hidden = false;
  btn.addEventListener('click', async () => {
    const url = sharePanel?.querySelector('[data-copy]')?.dataset.copy || location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url });
        return;
      } catch (e) {
        if (e.name === 'AbortError' || !sharePanel) return;
      }
    }
    sharePanel.showModal();
  });
}
if (sharePanel) {
  sharePanel.addEventListener('click', async (e) => {
    if (e.target === sharePanel || e.target.closest('[data-close]')) return sharePanel.close();
    const copy = e.target.closest('[data-copy]');
    if (!copy) return;
    try {
      await navigator.clipboard.writeText(copy.dataset.copy);
      copy.textContent = 'Link copied ✓';
    } catch {
      copy.textContent = copy.dataset.copy;
    }
    setTimeout(() => { copy.textContent = 'Copy link'; }, 2500);
  });
}

// Portfolio filter
const filters = $$('.filters button');
for (const btn of filters) {
  btn.addEventListener('click', () => {
    for (const b of filters) {
      b.classList.toggle('on', b === btn);
      b.setAttribute('aria-pressed', b === btn);
    }
    const cat = btn.dataset.filter;
    for (const card of $$('.pg [data-cat]')) card.hidden = !!cat && !card.dataset.cat.split('|').includes(cat);
  });
}

// Screenshot galleries
for (const btn of $$('[data-gallery]')) {
  const dialog = document.getElementById(btn.dataset.gallery);
  const strip = $('.gs', dialog);
  btn.addEventListener('click', () => dialog.showModal());
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.closest('[data-close]')) dialog.close();
    const step = e.target.closest('[data-step]');
    if (step) strip.scrollBy({ left: step.dataset.step * strip.clientWidth * 0.8, behavior: 'smooth' });
  });
}

// Long recommendations
for (const btn of $$('.more')) {
  const quote = document.getElementById(btn.getAttribute('aria-controls'));
  btn.addEventListener('click', () => {
    const open = !quote.classList.toggle('clamp');
    btn.setAttribute('aria-expanded', open);
    btn.textContent = open ? 'Show less' : 'Read more';
  });
}

// Contact form: opens WhatsApp or the email app with the message filled in
const form = $('.form');
if (form) {
  const compose = () => {
    const f = new FormData(form);
    const name = f.get('name').trim();
    return { name, body: `${f.get('text').trim()}\n\n${name}\n${f.get('email').trim()}`.trim() };
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    window.open(`https://api.whatsapp.com/send?phone=${form.dataset.phone}&text=${encodeURIComponent(compose().body)}`, '_blank', 'noopener');
  });
  $('[data-email]', form).addEventListener('click', (e) => {
    if (!form.reportValidity()) return;
    const { name, body } = compose();
    location.href = `mailto:${e.currentTarget.dataset.email}?subject=${encodeURIComponent(`Website message from ${name}`)}&body=${encodeURIComponent(body)}`;
  });
}

// Visitor counter: one visit per browser session, number kept in counter.txt on the counter's server
const counter = $('[data-counter]');
if (counter) {
  const count = async () => {
    let seen = true;
    try {
      seen = sessionStorage.getItem('visit') === '1';
      sessionStorage.setItem('visit', '1');
    } catch { /* storage blocked: only read the number */ }
    try {
      const res = await fetch(counter.dataset.counter, { method: seen ? 'GET' : 'POST', credentials: 'omit' });
      const { count: total } = await res.json();
      if (!Number.isInteger(total)) return;
      $('b', counter).textContent = total.toLocaleString('en');
      counter.hidden = false;
    } catch { /* counter offline: stay hidden */ }
  };
  if (document.readyState === 'complete') count();
  else addEventListener('load', count);
}
