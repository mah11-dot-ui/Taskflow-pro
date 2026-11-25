const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const today = new Date();
const dateKey = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
const todayKey = dateKey(today);
let tasks = JSON.parse(localStorage.getItem('taskflow_tasks') || 'null') || [
  { id: 1, title: 'Polish personal portfolio', description: 'Review spacing, typography and responsive layout.', date: todayKey, priority: 'high', done: false, created: Date.now() - 5000 },
  { id: 2, title: 'Practice JavaScript fundamentals', description: 'Spend 30 focused minutes on array methods.', date: todayKey, priority: 'medium', done: false, created: Date.now() - 4000 },
  { id: 3, title: 'Collect inspiration for a T-shirt design', description: 'Save a few timeless typography references.', date: '', priority: 'low', done: true, created: Date.now() - 3000 }
];
let currentView = 'all';
let editingId = null;
const save = () => localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
const formatDate = (s) => s ? new Date(`${s}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No due date';
const escapeHTML = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function showToast(message) { const t = $('#toast'); t.textContent = message; t.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => t.classList.remove('show'), 2200) }
function updateStats() {
  const total = tasks.length, done = tasks.filter(t => t.done).length, active = total - done, rate = total ? Math.round(done / total * 100) : 0;
  $('#total-stat').textContent = total; $('#active-stat').textContent = active; $('#done-stat').textContent = done; $('#rate-stat').textContent = rate + '%';
  $('#ring-percent').textContent = rate + '%'; $('#ring-value').style.strokeDashoffset = 364.4 - (364.4 * rate / 100);
  $('#legend-done').textContent = done; $('#legend-left').textContent = active; $('#focus-count').textContent = `${done} task${done === 1 ? '' : 's'} completed`;
  $('.focus-line span').style.width = rate + '%';
}
function visibleTasks() {
  const q = $('#search-input').value.trim().toLowerCase();
  let list = tasks.filter(t => {
    if (currentView === 'today' && (t.date !== todayKey || t.done)) return false;
    if (currentView === 'upcoming' && (!t.date || t.date <= todayKey || t.done)) return false;
    if (currentView === 'completed' && !t.done) return false;
    return !q || `${t.title} ${t.description}`.toLowerCase().includes(q);
  });
  const sort = $('#sort-select').value;
  list.sort((a, b) => sort === 'priority' ? ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]) : sort === 'newest' ? b.created - a.created : ((a.date || '9999').localeCompare(b.date || '9999')));
  return list;
}
function render() {
  updateStats();
  const labels = { all: ['Overview', 'Your tasks', 'Everything you need to move forward.'], today: ['Today', 'Today’s focus', 'Keep your attention on what matters today.'], upcoming: ['Upcoming', 'Coming up', 'A clear view of what’s ahead.'], completed: ['Completed', 'Wins, big and small', 'Look how far you’ve come.'] };
  const [crumb, heading, caption] = labels[currentView]; $('#breadcrumb-title').textContent = crumb; $('#list-heading').textContent = heading; $('#list-caption').textContent = caption;
  $('#page-title').innerHTML = currentView === 'today' ? 'Today is yours<span>.</span>' : currentView === 'upcoming' ? 'Plan ahead<span>.</span>' : currentView === 'completed' ? 'Look at you go<span>.</span>' : 'Good ' + (today.getHours() < 12 ? 'morning' : today.getHours() < 18 ? 'afternoon' : 'evening') + ', John<span>.</span>';
  const list = visibleTasks(); $('#task-list').innerHTML = list.map(t => `
 <article class="task-item ${t.done ? 'is-done' : ''}">
  <input class="task-check" type="checkbox" aria-label="Mark ${escapeHTML(t.title)} complete" data-check="${t.id}" ${t.done ? 'checked' : ''}>
  <div class="task-main"><span class="task-title">${escapeHTML(t.title)}</span>${t.description ? `<p class="task-description">${escapeHTML(t.description)}</p>` : ''}
   <div class="task-meta"><span class="priority ${t.priority}">${t.priority} priority</span><span class="task-date">◷ ${formatDate(t.date)}</span></div>
  </div>
  <div class="task-actions"><button title="Edit task" data-edit="${t.id}">✎</button><button title="Delete task" data-delete="${t.id}">×</button></div>
 </article>`).join('');
  $('#empty-state').hidden = list.length > 0; $('#task-list').hidden = list.length === 0; $('#visible-count').textContent = `${list.length} task${list.length === 1 ? '' : 's'}`;
}
function openModal(task = null) {
  editingId = task ? task.id : null; $('#modal-title').textContent = task ? 'Edit task' : 'Create a task';
  $('#task-title').value = task?.title || ''; $('#task-description').value = task?.description || '';
  $('#task-date').value = task?.date || ''; $('#task-priority').value = task?.priority || 'medium';
  $('#modal-backdrop').classList.add('show'); setTimeout(() => $('#task-title').focus(), 100);
}
function closeModal() { $('#modal-backdrop').classList.remove('show'); $('#task-form').reset(); editingId = null }
$('#task-form').addEventListener('submit', e => {
  e.preventDefault(); const title = $('#task-title').value.trim(); if (!title) return;
  const data = { title, description: $('#task-description').value.trim(), date: $('#task-date').value, priority: $('#task-priority').value };
  if (editingId) { tasks = tasks.map(t => t.id === editingId ? { ...t, ...data } : t); showToast('Task updated successfully'); }
  else { tasks.unshift({ id: Date.now(), ...data, done: false, created: Date.now() }); showToast('A new task is on your list'); }
  save(); closeModal(); render();
});
$('#add-open').onclick = () => openModal(); $('#empty-add').onclick = () => openModal(); $('#modal-close').onclick = closeModal; $('#cancel-task').onclick = closeModal;
$('#modal-backdrop').addEventListener('click', e => { if (e.target.id === 'modal-backdrop') closeModal() });
$('#task-list').addEventListener('click', e => {
  const check = e.target.closest('[data-check]'); if (check) { const id = Number(check.dataset.check); tasks = tasks.map(t => t.id === id ? { ...t, done: check.checked } : t); save(); render(); showToast(check.checked ? 'Nice work — task completed' : 'Task moved back to active'); return }
  const edit = e.target.closest('[data-edit]'); if (edit) { openModal(tasks.find(t => t.id === Number(edit.dataset.edit))); return }
  const del = e.target.closest('[data-delete]'); if (del) { tasks = tasks.filter(t => t.id !== Number(del.dataset.delete)); save(); render(); showToast('Task deleted') }
});
$$('.nav-link').forEach(btn => btn.addEventListener('click', () => { currentView = btn.dataset.view; $$('.nav-link').forEach(b => b.classList.toggle('active', b === btn)); render(); $('#sidebar').classList.remove('open') }));
$('#search-input').addEventListener('input', render); $('#sort-select').addEventListener('change', render);
$('#clear-completed').onclick = () => { const n = tasks.filter(t => t.done).length; if (!n) { showToast('No completed tasks to clear'); return } tasks = tasks.filter(t => !t.done); save(); render(); showToast(`${n} completed task${n === 1 ? '' : 's'} cleared`) };
$('#theme-toggle').onclick = () => { document.body.classList.toggle('dark'); localStorage.setItem('taskflow_dark', document.body.classList.contains('dark')) };
if (localStorage.getItem('taskflow_dark') === 'true') document.body.classList.add('dark');
$('#menu-toggle').onclick = () => $('#sidebar').classList.toggle('open');
$('#date-chip').textContent = today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
render();
