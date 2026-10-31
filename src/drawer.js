// Phone navigation (0.9.9): a slide-out side drawer instead of the bottom tab bar. Desktop keeps the sidebar.
// Top: search, new Smarty chat, recent chats. Middle: every feature with its icon (from nav.js GROUPS, so nothing is
// left out). Bottom: account and settings. Pure HTML builder + edge-swipe helper, unit-tested.
export function drawerHTML({ groups, convs = [], current = '', account = null, query = '', canDev = false }, { icon, esc }) {
  const q = String(query || '').trim().toLowerCase();
  const match = s => !q || String(s).toLowerCase().includes(q);
  const items = groups.flatMap(g => [{ v: g.tab, label: g.label, icon: g.icon, head: true }, ...(g.links || []).filter(([v]) => v !== g.tab && (v !== 'dev' || canDev)).map(([v, ic, label, sub]) => ({ v, label, icon: ic, sub }))]);
  const seen = new Set();
  const list = items.filter(it => { if (seen.has(it.v)) return false; seen.add(it.v); return match(it.label) || match(it.sub || ''); });
  const chats = convs.filter(c => match(c.title)).slice(0, 5);
  const link = it => { const [view, sec] = it.v.split(':'); const on = current === view && !sec;
    return `<li><button class="dr-link${it.head ? ' is-head' : ''}${on ? ' is-on' : ''}" ${sec ? `data-go="${esc(it.v)}"` : `data-view="${esc(view)}"`}${on ? ' aria-current="page"' : ''}>${icon(it.icon, 20)}<span>${esc(it.label)}</span></button></li>`; };
  return `<div class="drawer-scrim" data-action="drawerClose" aria-hidden="true"></div>
<aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-label="Menu">
<div class="dr-top"><span class="wordmark">Prvlar</span><button class="icon-btn" data-action="drawerClose" aria-label="Close menu">${icon('x', 20)}</button></div>
<label class="dr-search">${icon('search', 18)}<span class="sr-only">Search features and chats</span><input type="search" id="drawerq" placeholder="Search" value="${esc(query)}" autocomplete="off"></label>
<button class="btn primary block dr-new" data-action="drawerNewChat">${icon('plus', 18)}New chat with Smarty</button>
${chats.length ? `<h2 class="dr-h">Recent chats</h2><ul class="dr-chats">${chats.map(c => `<li><button class="dr-chat" data-drconv="${esc(c.id)}">${icon('chat', 17)}<span>${esc(c.title)}</span></button></li>`).join('')}</ul>` : ''}
<h2 class="dr-h">Everything</h2>
<nav aria-label="All features"><ul class="dr-list">${list.map(link).join('') || '<li class="fine dr-empty">Nothing matches.</li>'}</ul></nav>
<div class="dr-bottom">${account ? `<button class="dr-acct" data-go="settings:acct-h">${account.picture ? `<img src="${esc(account.picture)}" alt="" referrerpolicy="no-referrer">` : icon('user', 20)}<span><b>${esc(account.name || 'Signed in')}</b><span class="fine">${esc(account.email || '')}</span></span></button>` : `<button class="dr-acct" data-go="settings:acct-h">${icon('login', 20)}<span><b>Sign in</b><span class="fine">Back up and sync</span></span></button>`}
<button class="dr-link" data-view="settings">${icon('settings', 20)}<span>Settings</span></button></div>
</aside>`;
}
// Edge swipe: a touch that starts within `edge` px of the left side and moves right far enough opens the drawer.
export function edgeSwipe({ startX, startY, x, y, edge = 24, min = 60 }) {
  return startX <= edge && x - startX >= min && Math.abs(y - startY) < (x - startX) * 0.7;
}
