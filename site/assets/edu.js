/* SSB AI.EDU hub: library, filters, learner profile, referrals.
   Vanilla JavaScript, no libraries. The profile lives in this browser only (localStorage),
   and every storage access is wrapped in try/catch. If storage is unavailable the page still
   works and the profile lasts until the page is closed. */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var KEY = 'ssbedu.profile.v1';
  var TYPES = ['Article', 'News', 'Developing Story', 'State of AI', 'Course', 'Research Stamp'];

  /* Only real items. Add entries here as they are published; the filters adapt to new authors. */
  var ITEMS = [
    { title: 'Governance frameworks for AI-assisted work', type: 'Article', author: 'Joseph Perez CPA', date: 'Wave 1, date to be announced',
      summary: 'Named roles, written rules, and evidence standards for what an agent claims.', status: 'In preparation',
      detail: 'Not yet published. When released it will be tagged, dated, and carry its own license designation.' },
    { title: 'Validation and promotion pipelines', type: 'Article', author: 'Joseph Perez CPA', date: 'Wave 1, date to be announced',
      summary: 'How a tool is proven before it is trusted with real work.', status: 'In preparation',
      detail: 'Not yet published. When released it will be tagged, dated, and carry its own license designation.' },
    { title: 'Change control for live artifacts', type: 'Article', author: 'Joseph Perez CPA', date: 'Wave 1, date to be announced',
      summary: 'How a document or system in use is changed without losing its history.', status: 'In preparation',
      detail: 'Not yet published. When released it will be tagged, dated, and carry its own license designation.' },
    { title: 'Evidence standards for AI claims', type: 'Article', author: 'Joseph Perez CPA', date: 'Wave 1, date to be announced',
      summary: 'What counts as proof when an AI system reports a result, and how to trace it back to a source.', status: 'In preparation',
      detail: 'Not yet published. When released it will be tagged, dated, and carry its own license designation.' },
    { title: 'Internal controls for AI-assisted work', type: 'Article', author: 'Joseph Perez CPA', date: 'Wave 1, date to be announced',
      summary: 'A position paper on applying familiar internal control thinking to agent-driven workflows.', status: 'In preparation',
      detail: 'Not yet published. When released it will be tagged, dated, and carry its own license designation.' },
    { title: 'How an agent operating model runs', type: 'Article', author: 'Joseph Perez CPA', date: 'Wave 1, date to be announced',
      summary: 'Named agents, their homes, boards, and run logs, and why each one exists.', status: 'In preparation',
      detail: 'Not yet published. When released it will be tagged, dated, and carry its own license designation.' },
    { title: 'SSB AI.EDU, Track 6', type: 'Course', author: 'Joseph Perez CPA', date: 'Development since March 2026',
      summary: 'Training for accounting and financial-services professionals on catching flawed AI work before it reaches clients, members, regulators, or management.',
      status: 'In development since March 2026',
      detail: 'Release timing will be dated and tagged like every other wave. Nothing is enrollable yet.' },
    { title: 'The State of AI', type: 'State of AI', author: 'Joseph Perez CPA', date: 'First edition to be dated',
      summary: 'A dated read on where AI tools help professional work and where they still fall short.', status: 'First edition arriving',
      detail: 'The first edition has not been published. It will carry its own date and sources.' }
  ];

  var state = { type: 'All', author: 'All' };
  var memProfile = null;
  var storageOK = true;

  function $(id) { return document.getElementById(id); }

  /* ---- storage (always guarded) ---- */
  function loadProfile() {
    try {
      var raw = window.localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      storageOK = false;
      return memProfile;
    }
  }
  function saveProfile(p) {
    memProfile = p;
    try {
      if (p) { window.localStorage.setItem(KEY, JSON.stringify(p)); }
      else { window.localStorage.removeItem(KEY); }
    } catch (e) {
      storageOK = false;
    }
  }
  var profile = loadProfile();

  /* ---- referral code: SSB-XXXX-9999 ---- */
  function randInt(n) {
    try {
      var a = new Uint32Array(1);
      window.crypto.getRandomValues(a);
      return a[0] % n;
    } catch (e) {
      return Math.floor(Math.random() * n);
    }
  }
  function makeCode() {
    var letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    var s = '';
    for (var i = 0; i < 4; i++) { s += letters.charAt(randInt(letters.length)); }
    var d = String(randInt(10000));
    while (d.length < 4) { d = '0' + d; }
    return 'SSB-' + s + '-' + d;
  }

  /* ---- engagement ---- */
  function addScore(n) {
    if (!profile) { return; }
    profile.score = (profile.score || 0) + n;
    saveProfile(profile);
    renderProfile();
  }

  /* ---- tabs ---- */
  var ROUTES = ['library', 'profile', 'referrals'];
  function showRoute(route) {
    if (ROUTES.indexOf(route) < 0) { route = 'library'; }
    var pages = document.querySelectorAll('.tab-page');
    for (var i = 0; i < pages.length; i++) {
      pages[i].classList.toggle('active', pages[i].getAttribute('data-page') === route);
    }
    var links = document.querySelectorAll('.tabs a');
    for (var j = 0; j < links.length; j++) {
      var on = links[j].getAttribute('data-route') === route;
      links[j].classList.toggle('active', on);
      if (on) { links[j].setAttribute('aria-current', 'true'); } else { links[j].removeAttribute('aria-current'); }
    }
  }
  function bindTabs() {
    var links = document.querySelectorAll('[data-route]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function (ev) {
        ev.preventDefault();
        var route = this.getAttribute('data-route');
        showRoute(route);
        try { window.history.replaceState(null, '', '#' + route); } catch (e) { /* ignore */ }
      });
    }
    window.addEventListener('hashchange', function () {
      showRoute((window.location.hash || '').replace('#', ''));
    });
    showRoute((window.location.hash || '').replace('#', ''));
  }

  /* ---- library + filters ---- */
  function uniqueAuthors() {
    var out = [];
    for (var i = 0; i < ITEMS.length; i++) {
      if (out.indexOf(ITEMS[i].author) < 0) { out.push(ITEMS[i].author); }
    }
    return out;
  }
  function makeChip(label, group) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.setAttribute('data-group', group);
    b.setAttribute('data-value', label);
    b.setAttribute('aria-pressed', state[group] === label ? 'true' : 'false');
    b.textContent = label;
    b.addEventListener('click', function () {
      state[group] = label;
      addScore(1);
      syncChips();
      renderLibrary();
    });
    return b;
  }
  function syncChips() {
    var chips = document.querySelectorAll('.chip[data-group]');
    for (var i = 0; i < chips.length; i++) {
      var g = chips[i].getAttribute('data-group');
      chips[i].setAttribute('aria-pressed', state[g] === chips[i].getAttribute('data-value') ? 'true' : 'false');
    }
  }
  function buildFilters() {
    var t = $('typeFilters');
    var a = $('authorFilters');
    if (!t || !a) { return; }
    t.appendChild(makeChip('All', 'type'));
    for (var i = 0; i < TYPES.length; i++) { t.appendChild(makeChip(TYPES[i], 'type')); }
    a.appendChild(makeChip('All', 'author'));
    var authors = uniqueAuthors();
    for (var j = 0; j < authors.length; j++) { a.appendChild(makeChip(authors[j], 'author')); }
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text !== undefined) { n.textContent = text; }
    return n;
  }
  function renderLibrary() {
    var grid = $('libGrid');
    if (!grid) { return; }
    grid.textContent = '';
    var shown = 0;
    ITEMS.forEach(function (item) {
      if (state.type !== 'All' && item.type !== state.type) { return; }
      if (state.author !== 'All' && item.author !== state.author) { return; }
      shown++;
      var card = el('button', 'lib-card');
      card.type = 'button';
      card.setAttribute('aria-expanded', 'false');
      var meta = el('div', 'meta');
      meta.appendChild(el('span', 'type-tag', item.type));
      meta.appendChild(el('span', 'status-tag', item.status));
      card.appendChild(meta);
      card.appendChild(el('h3', null, item.title));
      card.appendChild(el('p', 'by', item.author + ' · ' + item.date));
      card.appendChild(el('p', null, item.summary));
      card.appendChild(el('p', 'detail', item.detail));
      card.addEventListener('click', function () {
        var open = card.getAttribute('aria-expanded') === 'true';
        card.setAttribute('aria-expanded', open ? 'false' : 'true');
        if (!open) { addScore(5); }
      });
      grid.appendChild(card);
    });
    var empty = $('libEmpty');
    if (empty) { empty.style.display = shown === 0 ? 'block' : 'none'; }
    var count = $('libCount');
    if (count) { count.textContent = shown + (shown === 1 ? ' item' : ' items'); }
  }

  /* ---- profile + referrals ---- */
  function initial(name) { return (name || '?').trim().charAt(0).toUpperCase(); }
  function show(id, on) { var n = $(id); if (n) { n.style.display = on ? '' : 'none'; } }
  function setText(id, t) { var n = $(id); if (n) { n.textContent = t; } }

  function renderProfile() {
    var chip = $('profileChip');
    if (chip) { chip.classList.toggle('on', !!profile); }
    show('signupView', !profile);
    show('profileView', !!profile);
    show('refNeedProfile', !profile);
    show('refView', !!profile);
    show('storageNote', !storageOK);
    if (profile) {
      setText('chipAvatar', initial(profile.name));
      setText('chipName', profile.name);
      setText('chipScore', 'Engagement ' + (profile.score || 0));
      setText('pvName', profile.name);
      setText('pvEmail', profile.email ? profile.email : 'No email given');
      setText('pvScore', String(profile.score || 0));
      setText('refCode', profile.code);
      setText('refCopies', String(profile.copies || 0));
    }
  }

  function createProfile(ev) {
    ev.preventDefault();
    var name = ($('pfName').value || '').trim();
    var email = ($('pfEmail').value || '').trim();
    var err = $('pfError');
    err.textContent = '';
    if (!name) { err.textContent = 'Please enter a display name.'; return; }
    if (name.length > 40) { err.textContent = 'Display name can be up to 40 characters.'; return; }
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.textContent = 'That email does not look right. You can leave it blank.'; return; }
    profile = { name: name, email: email, score: 0, code: makeCode(), copies: 0, created: new Date().toISOString().slice(0, 10) };
    saveProfile(profile);
    renderProfile();
  }

  function removeProfile() {
    profile = null;
    saveProfile(null);
    renderProfile();
  }

  function fallbackCopy(text, done) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      done(ok);
    } catch (e) {
      done(false);
    }
  }
  function copyCode() {
    if (!profile) { return; }
    var text = profile.code;
    function done(ok) {
      if (ok) {
        profile.copies = (profile.copies || 0) + 1;
        saveProfile(profile);
        renderProfile();
        setText('copyStatus', 'Copied.');
      } else {
        setText('copyStatus', 'Copy was blocked here. Select the code and copy it by hand.');
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { fallbackCopy(text, done); });
    } else {
      fallbackCopy(text, done);
    }
  }
  function regenCode() {
    if (!profile) { return; }
    profile.code = makeCode();
    profile.copies = 0;
    saveProfile(profile);
    renderProfile();
    setText('copyStatus', 'New code generated.');
  }

  function init() {
    bindTabs();
    buildFilters();
    renderLibrary();
    var form = $('profileForm');
    if (form) { form.addEventListener('submit', createProfile); }
    var rm = $('removeProfile');
    if (rm) { rm.addEventListener('click', removeProfile); }
    var cp = $('copyCode');
    if (cp) { cp.addEventListener('click', copyCode); }
    var rg = $('regenCode');
    if (rg) { rg.addEventListener('click', regenCode); }
    renderProfile();
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();
