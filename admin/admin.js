// Site editor. No server and no database: it edits content/site.json, rebuilds the
// pages with the same renderer as build.mjs, and commits everything to GitHub at once.
import { renderSite, slugify, SERVICE_ICON_NAMES, SOCIAL_NAMES } from '../src/render.js';
import { hasVault, seal, unseal, forget } from './vault.js';

const REPO = 'MohammedPrince/MohammedPrince.github.io';
const BRANCH = 'main';
const CONTENT = 'content/site.json';
const CSS = 'src/style.css';
const USERNAME = 'maverick';
const MIN_PASSWORD = 10;
const ROOT = new URL('../', location.href);

/* ---------- form definition ---------- */

const t = (key, label, o = {}) => ({ type: 'text', key, label, ...o });
const area = (key, label, o = {}) => ({ type: 'area', key, label, ...o });
const img = (key, label, o = {}) => ({ type: 'image', key, label, max: 800, ...o });
const check = (key, label) => ({ type: 'check', key, label });
const select = (key, label, options) => ({ type: 'select', key, label, options });
const list = (key, label, fields, title, o = {}) => ({ type: 'list', key, label, fields, title, ...o });
const strings = (key, label, o = {}) => ({ type: 'strings', key, label, ...o });

const head = (p) => [t(`${p}.kicker`, 'Small label'), t(`${p}.title`, 'Title')];
const period = [t('period', 'Period', { required: true }), t('title', 'Title', { required: true }), area('text', 'Details'), check('current', 'Current')];

const TABS = {
  'Profile': [
    t('profile.name', 'Name', { required: true }), t('profile.initials', 'Initials'), t('profile.role', 'Role shown on the card'),
    t('profile.tagline', 'Tagline'), img('profile.photo', 'Photo', { help: 'Leave empty to show your initials.' }),
    t('profile.email', 'Email', { required: true }), t('profile.phone', 'Phone'), t('profile.whatsapp', 'WhatsApp number (digits only)', { required: true }),
    t('profile.city', 'City'), t('profile.country', 'Country'), { type: 'pdf', key: 'profile.resumeUrl', label: 'CV (PDF file or https:// link)' },
    { type: 'select', key: 'site.theme', label: 'Default theme', options: ['dark', 'light', 'auto'], help: 'What new visitors see. auto = follows their device. Visitors can switch with the button in the header.' },
    list('profile.socials', 'Social links', [select('type', 'Network', SOCIAL_NAMES), t('url', 'Link', { url: true, required: true })], 'type'),
  ],
  'Hero & stats': [
    t('hero.badge', 'Badge'), area('hero.headline', 'Headline', { help: 'Put *stars* around words to make them gold. New line = line break.', required: true }), area('hero.text', 'Intro text'),
    list('stats', 'Stats', [t('value', 'Value', { help: 'auto:projects and auto:clients count for you.' }), t('label', 'Label')], 'label'),
  ],
  'Services': [
    ...head('services'), area('services.intro', 'Intro'),
    list('services.items', 'Services', [t('title', 'Title', { required: true }), area('text', 'Text'), select('icon', 'Icon', SERVICE_ICON_NAMES), { type: 'number', key: 'percent', label: 'Proficiency % (0 hides it)' }, check('featured', 'Gold background')], 'title'),
  ],
  'Resume': [...head('resume'), list('resume.experience', 'Experience', period, 'title'), list('resume.education', 'Education', period, 'title')],
  'Projects': [
    ...head('portfolio'), strings('portfolio.categories', 'Categories (one per line)'),
    list('portfolio.projects', 'Projects', [
      t('title', 'Title', { required: true }), t('subtitle', 'Short description'),
      { type: 'select', key: 'category', label: 'Category', options: () => data.portfolio.categories },
      strings('alsoIn', 'Also show under these categories (one per line)'),
      t('visibility', 'Visibility', { help: 'e.g. public or internal. Shown next to the category.' }),
      t('url', 'Link', { url: true, help: 'Leave empty if there is no public link.' }), img('image', 'Logo'),
      { type: 'color', key: 'color', label: 'Brand colour' },
      strings('tech', 'Tech (one per line)', { help: 'The first one gets a coloured dot.' }),
      check('featured', 'Featured (big card at the top)'),
      strings('status', 'Status labels, featured only (one per line)', { help: 'e.g. web: live. "live" turns green; "development" or "beta" turns amber.' }),
      strings('highlights', 'Highlights, featured only (one per line)'),
      img('preview', 'Phone screenshot, featured only', { help: 'Leave empty to use the first gallery screenshot.' }),
      list('gallery', 'Screenshots (opens a gallery)', [img('image', 'Screenshot', { max: 1200 }), t('alt', 'Describe the screenshot')], 'alt', { uploadMany: true }),
    ], 'title', { top: true }),
  ],
  'Recommendations': [
    ...head('recommendations'),
    list('recommendations.items', 'Recommendations', [t('name', 'Name', { required: true }), t('role', 'Role'), t('initials', 'Initials'), select('color', 'Colour', ['gold', 'blue', 'green', 'pink']), t('url', 'Profile link', { url: true }), area('text', 'Text', { required: true })], 'name'),
  ],
  'Clients': [list('clients', 'Clients', [t('name', 'Name', { required: true }), img('logo', 'Logo', { max: 420 }), t('url', 'Link', { url: true })], 'name')],
  'Blog': [
    ...head('blog'), t('blog.emptyText', 'Text shown when there are no posts'),
    list('blog.posts', 'Posts', [
      t('title', 'Title', { required: true }), t('slug', 'Address', { help: 'Leave empty to use the title. English letters, numbers and dashes.' }),
      { type: 'date', key: 'date', label: 'Date' }, area('summary', 'Summary (shown on Google and the card)'), img('image', 'Cover image', { max: 1200 }),
      area('body', 'Text', { big: true, help: 'Markdown: ## heading, **bold**, *italic*, [text](link), - list, > quote, ``` code.' }), check('published', 'Published'),
    ], 'title', { top: true }),
  ],
  'Contact & footer': [...head('contact').slice(0, 1), area('contact.title', 'Title'), area('contact.text', 'Text after your email address'), t('footer.text', 'Footer text'), t('footer.counterUrl', 'Visitor counter address (empty hides it)', { url: true, help: 'The full https:// address of counter.php on your hosting. See visitor-counter/README.md.' })],
  'SEO': [
    t('site.title', 'Page title for Google', { count: 65, required: true }), area('site.description', 'Description for Google', { count: 160, required: true }), img('site.ogImage', 'Sharing image (1200 × 630)', { max: 1200, jpeg: true }),
    t('site.url', 'Site address', { url: true, required: true }), t('profile.jobTitle', 'Job title for Google'), strings('profile.alternateNames', 'Other names people search for (one per line)'),
    t('site.googleVerification', 'Google Search Console code', { help: 'Only the content="…" value of the meta tag.' }),
  ],
};

/* ---------- state ---------- */

let data;
let token = null; // in memory only: reloading the page signs out
let loadedSha = null; // version of site.json this session started from
let dirty = false;
let publishing = false;
const uploads = new Map(); // repo path -> { base64, url }
let tab = Object.keys(TABS)[0];

const $ = (s) => document.querySelector(s);
const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};
const get = (o, path) => path.split('.').reduce((x, k) => x?.[k], o);
const set = (o, path, value) => {
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((x, k) => (x[k] ??= {}), o)[last] = value;
};

function status(text, kind = '') {
  $('#status').textContent = text;
  $('#status').className = kind;
}
function touch() {
  dirty = true;
  status('Unsaved changes');
  updateButtons();
}
function updateButtons() {
  $('#publish-btn').disabled = !token || !dirty || publishing;
  $('#preview-btn').disabled = !data;
}
addEventListener('beforeunload', (e) => { if (dirty) e.preventDefault(); });

/* ---------- GitHub ---------- */

async function gh(path, { method = 'GET', body, raw } = {}) {
  const res = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    method,
    cache: 'no-store',
    headers: { Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' },
    body: body && JSON.stringify(body),
  });
  if (!res.ok) {
    const info = await res.json().catch(() => ({}));
    const hint = { 401: 'The token is wrong or expired.', 403: 'The token needs "Contents: Read and write" for this repository.', 404: 'The token cannot see this repository.', 422: 'The repository changed at the same moment. Try again.' }[res.status];
    throw Object.assign(new Error(hint || info.message || `GitHub error ${res.status}`), { status: res.status });
  }
  return raw ? res.text() : res.json();
}

async function headState() {
  const ref = await gh(`/git/ref/heads/${BRANCH}`);
  const commit = await gh(`/git/commits/${ref.object.sha}`);
  const tree = await gh(`/git/trees/${commit.tree.sha}?recursive=1`);
  const sha = (p) => tree.tree.find((f) => f.path === p)?.sha;
  return { commit: ref.object.sha, tree: commit.tree.sha, files: tree.tree.filter((f) => f.type === 'blob').map((f) => f.path), sha };
}
const blobText = (sha) => gh(`/git/blobs/${sha}`, { raw: true });

async function loadFromGitHub() {
  const head = await headState();
  const sha = head.sha(CONTENT);
  if (!sha) throw new Error(`${CONTENT} is not on GitHub yet. Push the new site first.`);
  data = JSON.parse(await blobText(sha));
  loadedSha = sha;
}

async function publish() {
  const problems = validate();
  if (problems.length) {
    status(problems[0], 'bad');
    return;
  }
  publishing = true;
  dirty = false; // anything edited from here on belongs to the next publish
  updateButtons();
  status('Publishing…');
  try {
    const head = await headState();
    if (head.sha(CONTENT) !== loadedSha) {
      throw new Error('The site was changed somewhere else since you opened it. Export your JSON (Backup tab), reload, then import it.');
    }
    const next = structuredClone(data);
    next.site.updated = new Date().toISOString().slice(0, 10);
    const jsonText = `${JSON.stringify(next, null, 2)}\n`;
    const files = { [CONTENT]: jsonText, ...renderSite(next, await blobText(head.sha(CSS))) };

    const tree = Object.entries(files).map(([path, content]) => ({ path, mode: '100644', type: 'blob', content }));
    for (const [path, up] of uploads) {
      if (!jsonText.includes(path)) continue; // uploaded, then removed again
      status(`Uploading ${path.split('/').pop()}…`);
      const blob = await gh('/git/blobs', { method: 'POST', body: { content: up.base64, encoding: 'base64' } });
      tree.push({ path, mode: '100644', type: 'blob', sha: blob.sha });
    }
    // Remove pages of posts that were deleted, renamed or unpublished
    for (const path of head.files) {
      if (/^blog\/[^/]+\/index\.html$/.test(path) && !files[path]) tree.push({ path, mode: '100644', type: 'blob', sha: null });
    }
    const newTree = await gh('/git/trees', { method: 'POST', body: { base_tree: head.tree, tree } });
    const commit = await gh('/git/commits', { method: 'POST', body: { message: 'Update site content', tree: newTree.sha, parents: [head.commit] } });
    await gh(`/git/refs/heads/${BRANCH}`, { method: 'PATCH', body: { sha: commit.sha, force: false } });

    const saved = await gh(`/git/trees/${newTree.sha}?recursive=1`);
    loadedSha = saved.tree.find((f) => f.path === CONTENT).sha;
    data.site.updated = next.site.updated;
    status('Published. The live site updates in about a minute.', 'ok');
  } catch (e) {
    dirty = true;
    status(`Not published: ${e.message}`, 'bad');
  }
  publishing = false;
  updateButtons();
}

/* ---------- validation ---------- */

const URL_OK = /^(https?:\/\/|mailto:|tel:|#)/i;
function validate() {
  const problems = [];
  const walk = (fields, obj, where) => {
    for (const f of fields) {
      const v = get(obj, f.key);
      if (f.required && !String(v ?? '').trim()) problems.push(`${where}: "${f.label}" is empty.`);
      if (f.url && v && !URL_OK.test(v)) problems.push(`${where}: "${f.label}" must start with https://`);
      if (f.type === 'list') (v || []).forEach((item, i) => walk(f.fields, item, `${where} › ${item[f.title] || `${f.label} ${i + 1}`}`));
    }
  };
  for (const [name, fields] of Object.entries(TABS)) walk(fields, data, name);
  try { new URL(data.site.url); } catch { problems.push('SEO: "Site address" is not a valid address.'); }
  const slugs = data.blog.posts.filter((p) => p.published).map((p) => slugify(p.slug || p.title));
  if (slugs.some((s) => !s)) problems.push('Blog: a post needs an address in English letters.');
  if (new Set(slugs).size !== slugs.length) problems.push('Blog: two posts have the same address.');
  return problems;
}

/* ---------- images ---------- */

const toBase64 = (blob) => new Promise((done, fail) => {
  const reader = new FileReader();
  reader.onload = () => done(reader.result.split(',')[1]);
  reader.onerror = () => fail(reader.error);
  reader.readAsDataURL(blob);
});

async function addPdf(file) {
  if (file.type !== 'application/pdf') throw new Error(`${file.name} is not a PDF.`);
  if (file.size > 10e6) throw new Error('The PDF is larger than 10 MB.');
  // A new name on each upload, so visitors never get an old copy from their cache.
  const path = `assets/files/${slugify(file.name.replace(/\.pdf$/i, '')) || 'cv'}-${Date.now().toString(36)}.pdf`;
  uploads.set(path, { base64: await toBase64(file), url: URL.createObjectURL(file) });
  return path;
}

async function addImage(file, field) {
  if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not an image.`);
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, field.max / bitmap.width, (field.max * 2) / bitmap.height);
  const canvas = el('canvas', { width: Math.max(1, Math.round(bitmap.width * scale)), height: Math.max(1, Math.round(bitmap.height * scale)) });
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const type = field.jpeg ? 'image/jpeg' : 'image/webp';
  const blob = await new Promise((done) => canvas.toBlob(done, type, 0.8));
  // Browsers that cannot write WebP fall back to PNG, so name the file by its real type.
  const extension = { 'image/webp': 'webp', 'image/jpeg': 'jpg' }[blob.type] || 'png';
  const path = `assets/images/uploads/${Date.now().toString(36)}-${slugify(file.name.replace(/\.[^.]+$/, '')) || 'image'}.${extension}`;
  const base64 = await toBase64(blob);
  uploads.set(path, { base64, url: URL.createObjectURL(blob) });
  return path;
}
const imageUrl = (path) => uploads.get(path)?.url || (path ? new URL(path, ROOT).href : '');

/* ---------- form rendering ---------- */

let ids = 0;
function control(f, obj, onTitle) {
  const id = `f${ids++}`;
  const value = get(obj, f.key);
  const change = (v) => {
    set(obj, f.key, v);
    touch();
    onTitle?.();
  };
  const wrap = (input, ...more) => {
    input.id = id;
    const box = el('div', { className: 'field' }, el('label', { htmlFor: id, textContent: f.label }), input, ...more);
    if (f.help) box.append(el('p', { className: 'help', textContent: f.help }));
    return box;
  };

  if (f.type === 'list') return listControl(f, obj);
  if (f.type === 'check') {
    const input = el('input', { type: 'checkbox', checked: !!value });
    input.addEventListener('change', () => change(input.checked));
    return el('label', { className: 'check' }, input, f.label);
  }
  if (f.type === 'select') {
    const options = typeof f.options === 'function' ? f.options() : f.options;
    const all = value && !options.includes(value) ? [...options, value] : options;
    const input = el('select', {}, ...all.map((o) => el('option', { value: o, textContent: o, selected: o === value })));
    input.addEventListener('change', () => change(input.value));
    return wrap(input);
  }
  if (f.type === 'strings') {
    const input = el('textarea', { value: (value || []).join('\n') });
    input.addEventListener('input', () => change(input.value.split('\n').map((s) => s.trim()).filter(Boolean)));
    return wrap(input);
  }
  if (f.type === 'pdf') {
    const path = el('input', { value: value || '' });
    const file = el('input', { type: 'file', accept: 'application/pdf', ariaLabel: `Upload: ${f.label}` });
    path.addEventListener('change', () => change(path.value.trim()));
    file.addEventListener('change', async () => {
      if (!file.files[0]) return;
      try {
        path.value = await addPdf(file.files[0]);
        change(path.value);
      } catch (e) { status(e.message || 'This file could not be read.', 'bad'); }
    });
    return wrap(path, file);
  }
  if (f.type === 'image') {
    const pic = el('img', { alt: '', src: imageUrl(value), hidden: !value });
    const path = el('input', { value: value || '', placeholder: 'No image' });
    const file = el('input', { type: 'file', accept: 'image/*', ariaLabel: `Upload: ${f.label}` });
    const show = (v) => {
      pic.hidden = !v;
      pic.src = imageUrl(v);
      change(v);
    };
    path.addEventListener('change', () => show(path.value.trim()));
    file.addEventListener('change', async () => {
      if (!file.files[0]) return;
      try {
        path.value = await addImage(file.files[0], f);
        show(path.value);
      } catch (e) { status(e.message || 'This image could not be read.', 'bad'); }
    });
    path.id = id;
    const box = el('div', { className: 'field' }, el('label', { htmlFor: id, textContent: f.label }), el('div', { className: 'img' }, pic, el('div', {}, file, path)));
    if (f.help) box.append(el('p', { className: 'help', textContent: f.help }));
    return box;
  }
  const input = f.type === 'area'
    ? el('textarea', { value: value ?? '', className: f.big ? 'big' : '' })
    : el('input', { type: { number: 'number', date: 'date', color: 'color' }[f.type] || 'text', value: value || (f.type === 'color' ? '#f6c453' : value ?? '') });
  const counter = f.count ? el('p', { className: 'help' }) : null;
  const count = () => { if (counter) counter.textContent = `${input.value.length} of about ${f.count} characters`; };
  count();
  input.addEventListener('input', () => {
    change(f.type === 'number' ? Number(input.value) : input.value);
    count();
  });
  return wrap(input, ...(counter ? [counter] : []));
}

function blank(f) {
  const item = {};
  for (const x of f.fields) {
    const options = typeof x.options === 'function' ? x.options() : x.options;
    const value = { check: false, list: [], strings: [], number: 0, color: '#f6c453', select: options?.[0] ?? '', date: new Date().toISOString().slice(0, 10) }[x.type] ?? '';
    set(item, x.key, value);
  }
  return item;
}

function listControl(f, obj) {
  if (!get(obj, f.key)) set(obj, f.key, []);
  const items = get(obj, f.key);
  const box = el('div', { className: 'list' });
  const draw = (open = -1) => {
    box.replaceChildren(...items.map((item, i) => {
      const name = el('span', { className: 'name' });
      const title = () => { name.textContent = item[f.title] || `New ${i + 1}`; };
      title();
      const act = (label, text, className, disabled, fn) => {
        const b = el('button', { type: 'button', textContent: text, ariaLabel: `${label}: ${name.textContent}`, className, disabled });
        b.addEventListener('click', (e) => {
          e.preventDefault();
          fn();
        });
        return b;
      };
      const move = (to) => {
        items.splice(to, 0, items.splice(i, 1)[0]);
        touch();
        draw();
      };
      const body = el('div', { className: 'item' });
      const card = el('details', {}, el('summary', {}, name,
        act('Move up', '↑', '', i === 0, () => move(i - 1)),
        act('Move down', '↓', '', i === items.length - 1, () => move(i + 1)),
        act('Delete', 'Delete', 'del', false, () => {
          if (!confirm(`Delete "${name.textContent}"?`)) return;
          items.splice(i, 1);
          touch();
          draw();
        })), body);
      const fill = () => { if (!body.childElementCount) body.append(...f.fields.map((x) => control(x, item, title))); };
      card.addEventListener('toggle', () => { if (card.open) fill(); });
      if (i === open) {
        fill();
        card.open = true;
      }
      return card;
    }));
  };
  draw();
  const add = el('button', { type: 'button', className: 'add', textContent: '+ Add' });
  add.addEventListener('click', () => {
    items[f.top ? 'unshift' : 'push'](blank(f));
    touch();
    draw(f.top ? 0 : items.length - 1);
  });
  const row = el('div', { className: 'row' }, add);
  if (f.uploadMany) {
    const field = f.fields.find((x) => x.type === 'image');
    const many = el('input', { type: 'file', accept: 'image/*', multiple: true, ariaLabel: 'Upload several images' });
    many.addEventListener('change', async () => {
      for (const file of many.files) {
        try {
          const item = blank(f);
          item[field.key] = await addImage(file, field);
          item[f.title] = file.name.replace(/\.[^.]+$/, '');
          items.push(item);
        } catch (e) { status(e.message || 'An image could not be read.', 'bad'); }
      }
      many.value = '';
      touch();
      draw();
    });
    row.append(many);
  }
  return el('div', { className: 'list' }, el('h2', { textContent: f.label }), row, box);
}

/* ---------- special tabs ---------- */

function accountPanel() {
  const field = (id, label, autocomplete) => {
    const input = el('input', { type: 'password', id, autocomplete });
    return [input, el('div', { className: 'field' }, el('label', { htmlFor: id, textContent: label }), input)];
  };
  const [current, currentBox] = field('pw-current', 'Current password', 'current-password');
  const [next, nextBox] = field('pw-new', 'New password', 'new-password');
  const [again, againBox] = field('pw-again', 'New password again', 'new-password');
  const save = el('button', { type: 'button', className: 'primary', textContent: 'Change password' });
  save.addEventListener('click', async () => {
    try {
      const stored = await unseal(USERNAME, current.value);
      checkNewPassword(next.value, again.value);
      await seal(USERNAME, next.value, stored);
      for (const input of [current, next, again]) input.value = '';
      status('Password changed on this browser.', 'ok');
    } catch (e) { status(e.message, 'bad'); }
  });
  const out = el('button', { type: 'button', textContent: 'Sign out' });
  out.addEventListener('click', () => location.reload());
  const remove = el('button', { type: 'button', textContent: 'Remove sign-in from this browser' });
  remove.addEventListener('click', () => {
    if (!confirm('You will need a GitHub token to set this browser up again. Continue?')) return;
    forget();
    location.reload();
  });
  return el('div', { className: 'card' },
    el('p', { textContent: `Signed in as ${USERNAME}. Publishing to ${REPO} (${BRANCH}).` }),
    el('div', { className: 'row' }, out, remove),
    el('h2', { textContent: 'Change password' }), currentBox, nextBox, againBox,
    el('div', { className: 'row' }, save));
}

function backupPanel() {
  const out = el('button', { type: 'button', textContent: 'Export site.json' });
  out.addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: 'application/json' }));
    el('a', { href: url, download: 'site.json' }).click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  });
  const file = el('input', { type: 'file', accept: '.json,application/json', id: 'import' });
  file.addEventListener('change', async () => {
    const previous = data;
    try {
      data = JSON.parse(await file.files[0].text());
      renderSite(data, ''); // refuses a file that cannot produce a site
      touch();
      draw();
      status('Imported. Check the preview, then publish.');
    } catch {
      data = previous;
      status('This file is not a valid site.json.', 'bad');
    }
  });
  return el('div', { className: 'card' },
    el('p', { textContent: 'Export keeps a copy of all text. Newly uploaded images that are not published yet are not included.' }),
    el('div', { className: 'row' }, out),
    el('div', { className: 'field' }, el('label', { htmlFor: 'import', textContent: 'Import site.json' }), file));
}

const EXTRA = { Backup: backupPanel, Account: accountPanel };

function draw() {
  $('#tabs').replaceChildren(...[...Object.keys(TABS), ...Object.keys(EXTRA)].map((name) => {
    const b = el('button', { type: 'button', textContent: name, className: name === tab ? 'on' : '' });
    if (name === tab) b.setAttribute('aria-current', 'page');
    b.addEventListener('click', () => {
      tab = name;
      draw();
      scrollTo(0, 0);
    });
    return b;
  }));
  $('#panel').replaceChildren(el('h1', { textContent: tab }), ...(EXTRA[tab] ? [EXTRA[tab]()] : data ? TABS[tab].map((f) => control(f, data)) : []));
}

/* ---------- preview ---------- */

const dialog = $('#preview');
const frame = $('#preview iframe');
$('#preview-btn').addEventListener('click', async () => {
  try {
    const css = await (await fetch(new URL(CSS, ROOT), { cache: 'no-cache' })).text();
    let html = renderSite(data, css)['index.html'];
    for (const [path, up] of uploads) html = html.replaceAll(`"${path}"`, `"${up.url}"`);
    frame.srcdoc = html
      .replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, '')
      .replace('<head>', `<head><base href="${ROOT.href}">`);
    dialog.showModal();
  } catch (e) { status(`Preview failed: ${e.message}`, 'bad'); }
});
dialog.addEventListener('click', (e) => {
  if (e.target.dataset.width) frame.style.width = e.target.dataset.width;
  if ('close' in e.target.dataset) dialog.close();
});
$('#publish-btn').addEventListener('click', publish);

/* ---------- sign in ---------- */

// login: username + password. setup: first time on this browser. renew: the GitHub token expired.
const form = $('#login');
let mode = hasVault() ? 'login' : 'setup';

function checkNewPassword(a, b) {
  if (a.length < MIN_PASSWORD) throw new Error(`Use at least ${MIN_PASSWORD} characters for the password.`);
  if (a !== b) throw new Error('The two passwords are not the same.');
}

function showMode() {
  $('#login-title').textContent = { login: 'Sign in', setup: 'Set up this browser', renew: 'New GitHub token needed' }[mode];
  for (const box of form.querySelectorAll('[data-mode]')) box.hidden = !box.dataset.mode.split(' ').includes(mode);
  form.elements.password.autocomplete = mode === 'setup' ? 'new-password' : 'current-password';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const { username, password, again, pat, go } = form.elements;
  go.disabled = true;
  status('Signing in…');
  try {
    if (mode === 'setup') {
      if (username.value.trim().toLowerCase() !== USERNAME) throw new Error('Wrong username or password.');
      checkNewPassword(password.value, again.value);
    }
    const stored = mode === 'setup' ? null : await unseal(username.value, password.value);
    token = mode === 'login' ? stored : pat.value.trim();
    if (!token) throw new Error('Paste the GitHub token.');
    await loadFromGitHub();
    if (mode !== 'login') await seal(username.value, password.value, token);
    form.reset();
    document.body.classList.remove('locked');
    status('Signed in', 'ok');
    updateButtons();
    draw();
  } catch (err) {
    token = null;
    data = undefined;
    if (mode === 'login' && err.status === 401) {
      mode = 'renew';
      showMode();
    }
    status(err.message, 'bad');
  }
  go.disabled = false;
});

$('#forgot').addEventListener('click', () => {
  if (!confirm('This removes the saved sign-in from this browser. You will need a GitHub token to set it up again. Continue?')) return;
  forget();
  location.reload();
});

showMode();
updateButtons();
