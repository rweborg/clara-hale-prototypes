/* Style-guide interactions. Mirrors the locked player behavior.
   Does not read or write the game save (jp-save-v2) or the game volume (jp-vol). */

(function () {
  const toastEl = document.querySelector('#toast');
  let toastTimer = 0;
  function toast(text) {
    if (!toastEl) return;
    toastEl.hidden = false;
    toastEl.textContent = text;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2400);
  }

  /* Click-outside dismiss. The press has to start and end on the scrim,
     so a drag that begins on the folder does not close it. Escape closes too.
     Live: ov() in journey/index.html. */
  const scrim = document.querySelector('#scrim');
  const openers = document.querySelectorAll('[data-open-folder]');
  let arm = false;
  function outside(e) {
    if (!scrim || scrim.hidden) return false;
    const t = e.target;
    if (!t || !t.closest) return false;
    if (t.closest('.back') || t.closest('.sheet')) return false;
    return true;
  }
  function openFolder() {
    if (!scrim) return;
    scrim.hidden = false;
    const back = scrim.querySelector('.ds-back');
    if (back) back.focus();
  }
  function closeFolder() {
    if (!scrim || scrim.hidden) return;
    scrim.hidden = true;
    arm = false;
    toast('Put back on the desk.');
  }
  openers.forEach(el => el.addEventListener('click', openFolder));
  if (scrim) {
    scrim.addEventListener('pointerdown', e => { arm = outside(e); });
    scrim.addEventListener('click', e => {
      const go = arm && outside(e);
      arm = false;
      if (go) closeFolder();
    });
    const back = scrim.querySelector('.ds-back');
    if (back) back.addEventListener('click', closeFolder);
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeFolder();
  });

  /* Board thread: click to select, click again or click the cork to cancel,
     Remove thread to cut it. Live: pickThread / cutThread. */
  const yarn = document.querySelector('#yarn');
  const hit = document.querySelector('#yarnhit');
  const cut = document.querySelector('#cut-thread');
  const retie = document.querySelector('#retie');
  const tip = document.querySelector('#board-tip');
  let selected = false;
  let removed = false;
  function paintThread() {
    if (!yarn || !hit) return;
    yarn.classList.toggle('is-sel', selected && !removed);
    yarn.style.display = removed ? 'none' : '';
    hit.style.display = removed ? 'none' : '';
    if (cut) cut.hidden = !(selected && !removed);
    if (retie) retie.hidden = !removed;
    if (tip) {
      tip.textContent = removed
        ? 'Thread removed.'
        : selected
          ? 'Click Remove thread, or click the thread again to cancel.'
          : 'Click a red thread to remove it.';
    }
  }
  function pickThread() {
    if (removed) return;
    selected = !selected;
    paintThread();
  }
  if (hit) {
    hit.addEventListener('click', e => { e.stopPropagation(); pickThread(); });
    hit.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickThread(); }
    });
  }
  const board = document.querySelector('#board-specimen');
  if (board) {
    board.addEventListener('click', e => {
      if (e.target.closest && (e.target.closest('.ds-pin') || e.target.closest('#yarnhit'))) return;
      if (!selected) return;
      selected = false;
      paintThread();
    });
  }
  if (cut) cut.addEventListener('click', () => {
    if (!selected || removed) return;
    removed = true;
    selected = false;
    paintThread();
    toast('Thread removed.');
  });
  if (retie) retie.addEventListener('click', () => {
    removed = false;
    selected = false;
    paintThread();
    toast('String tied. Click that red thread to remove it.');
  });
  paintThread();

  /* One volume for the top bar and the tape row. Not persisted. */
  const sliders = [...document.querySelectorAll('[data-guide-vol]')];
  const mutes = [...document.querySelectorAll('[data-guide-mute]')];
  const readouts = [...document.querySelectorAll('[data-vol-readout]')];
  let vol = 1;
  let muted = false;
  function icon() {
    if (muted || vol <= 0) return '🔇';
    if (vol < 0.4) return '🔈';
    if (vol < 0.75) return '🔉';
    return '🔊';
  }
  function paintVol() {
    const shown = muted ? 0 : Math.round(vol * 100);
    sliders.forEach(el => { el.value = String(Math.round(vol * 100)); });
    mutes.forEach(el => { el.textContent = icon(); el.setAttribute('aria-pressed', muted ? 'true' : 'false'); });
    readouts.forEach(el => { el.textContent = muted ? 'Muted' : shown + '%'; });
  }
  sliders.forEach(el => el.addEventListener('input', () => {
    vol = Math.max(0, Math.min(1, Number(el.value) / 100));
    muted = vol === 0;
    paintVol();
  }));
  mutes.forEach(el => el.addEventListener('click', () => {
    muted = !muted;
    if (!muted && vol === 0) vol = 1;
    paintVol();
  }));
  paintVol();

  const begin = document.querySelector('#album-begin');
  if (begin) begin.addEventListener('click', () => toast('In the game, Begin plays the cold open.'));
})();
