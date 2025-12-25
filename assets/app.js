const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

function setActiveNav(){
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  $$('.navlinks a').forEach(a => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if(href === path) a.setAttribute('aria-current','page');
    else a.removeAttribute('aria-current');
  });
}

function initMobileNav(){
  const btn = $('#navbtn');
  const nav = $('#navlinks');
  if(!btn || !nav) return;
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

async function loadJSON(url){
  const res = await fetch(url, {cache: 'no-cache'});
  if(!res.ok) throw new Error('Failed to load: ' + url);
  return await res.json();
}

function fmtDate(iso){
  const d = new Date(iso);
  if(Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  if(m === '01' && day === '01') return String(y);
  return `${y}-${m}-${day}`;
}

function renderTimeline(container, items){
  container.innerHTML = '';
  items.forEach(ev => {
    const el = document.createElement('article');
    el.className = 'event';
    el.innerHTML = `
      <div>
        <div class="date">${fmtDate(ev.date)}</div>
        ${ev.subtitle ? `<div class="small">${escapeHTML(ev.subtitle)}</div>` : ''}
      </div>
      <div>
        <div style="font-weight:800; font-size:1.05rem; margin-bottom:4px;">${escapeHTML(ev.title)}</div>
        <div class="small">${escapeHTML(ev.description)}</div>
        <div class="tags">
          ${(ev.tags||[]).map(t => `<span class="pill">${escapeHTML(t)}</span>`).join('')}
        </div>
        ${ev.sources && ev.sources.length ? `
          <div class="small" style="margin-top:10px;">
            Sources:
            ${ev.sources.map(s => `<a href="${s.url}" target="_blank" rel="noopener">${escapeHTML(s.label)}</a>`).join(' · ')}
          </div>` : ''}
      </div>
    `;
    container.appendChild(el);
  });
}

function escapeHTML(str){
  return (str ?? '').toString()
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}

function uniqueTags(items){
  const set = new Set();
  items.forEach(it => (it.tags||[]).forEach(t => set.add(t)));
  return Array.from(set).sort((a,b)=>a.localeCompare(b));
}

function filterEvents(items, {q, tag}){
  const query = (q||'').trim().toLowerCase();
  return items.filter(ev => {
    const hitQ = !query || [
      ev.title, ev.subtitle, ev.description, (ev.tags||[]).join(' ')
    ].join(' ').toLowerCase().includes(query);
    const hitT = !tag || tag === 'All' || (ev.tags||[]).includes(tag);
    return hitQ && hitT;
  }).sort((a,b)=> new Date(a.date) - new Date(b.date));
}

async function initTimelinePage(){
  const mount = $('#timelineMount');
  if(!mount) return;
  const data = await loadJSON('./data/events.json');
  const qInput = $('#search');
  const tagSel = $('#tag');
  // tag options
  const tags = ['All', ...uniqueTags(data)];
  tagSel.innerHTML = tags.map(t => `<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`).join('');
  const render = () => {
    const filtered = filterEvents(data, {q: qInput.value, tag: tagSel.value});
    $('#count').textContent = filtered.length;
    renderTimeline(mount, filtered);
  };
  qInput.addEventListener('input', render);
  tagSel.addEventListener('change', render);
  render();
}

async function initHomePage(){
  const mount = $('#timelinePreview');
  if(!mount) return;
  const data = await loadJSON('./data/events.json');
  const sorted = data.slice().sort((a,b)=> new Date(a.date) - new Date(b.date));
  const pick = [sorted[0], sorted[1], sorted[2], sorted[sorted.length-2], sorted[sorted.length-1]].filter(Boolean);
  renderTimeline(mount, pick);
  // stats
  const years = sorted.map(e => new Date(e.date).getFullYear()).filter(Boolean);
  const minY = Math.min(...years), maxY = Math.max(...years);
  $('#spanYears').textContent = `${minY}–${maxY}`;
  $('#spanEvents').textContent = `${sorted.length}`;
}

async function initPlacesPage(){
  const mount = $('#placesMount');
  if(!mount) return;
  const data = await loadJSON('./data/places.json');
  mount.innerHTML = '';
  data.forEach(p => {
    const el = document.createElement('article');
    el.className = 'card place';
    el.innerHTML = `
      <div class="cover">
        <img src="./assets/${p.image}" alt="${escapeHTML(p.alt||p.name)}" loading="lazy" decoding="async" data-lightbox>
      </div>
      <div class="body">
        <div class="type">${escapeHTML(p.type||'')}</div>
        <h3>${escapeHTML(p.name)}</h3>
        <p class="small">${escapeHTML(p.summary||'')}</p>
        ${p.notes?.length ? `<div class="small" style="margin-top:10px;">${p.notes.map(n=>`• ${escapeHTML(n)}`).join('<br>')}</div>` : ''}
        ${p.links?.length ? `<div class="links">${p.links.map(l=>`<a href="${l.url}" target="_blank" rel="noopener">${escapeHTML(l.label)}</a>`).join('')}</div>` : ''}
      </div>
    `;
    mount.appendChild(el);
  });
}

async function initArchivePage(){
  const mount = $('#archiveMount');
  if(!mount) return;
  const data = await loadJSON('./data/archive.json');
  mount.innerHTML = '';
  data.forEach(it => {
    const el = document.createElement('article');
    el.className = 'tile';
    el.innerHTML = `
      <div class="badge" style="margin-bottom:10px;"><span class="badge-dot"></span>${escapeHTML(it.status||'')}</div>
      <h3>${escapeHTML(it.title)}</h3>
      <p class="small">${escapeHTML(it.summary||'')}</p>
      <div class="small" style="margin-top:10px; color: rgba(255,255,255,.58)">
        Type: ${escapeHTML(it.type||'')} · Year: ${escapeHTML(it.year||'—')}
      </div>
      ${it.cta ? `<div style="margin-top:12px;"><a class="btn" href="${it.cta.href}">${escapeHTML(it.cta.label)}</a></div>` : ''}
    `;
    mount.appendChild(el);
  });
}

function initLightbox(){
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = `<button class="x" aria-label="Close">Close</button><img alt="">`;
  document.body.appendChild(lb);
  const img = $('img', lb);
  const close = () => lb.classList.remove('open');
  $('.x', lb).addEventListener('click', close);
  lb.addEventListener('click', (e) => { if(e.target === lb) close(); });
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape') close(); });
  document.addEventListener('click', (e) => {
    const t = e.target;
    if(!(t instanceof HTMLElement)) return;
    if(t.matches('[data-lightbox]')){
      img.src = t.getAttribute('src');
      img.alt = t.getAttribute('alt') || '';
      lb.classList.add('open');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  initMobileNav();
  initLightbox();
  initHomePage();
  initTimelinePage();
  initPlacesPage();
  initArchivePage();
});
