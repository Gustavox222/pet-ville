/* PetVille · interações
   GSAP: entrada do hero (SplitText), bolhas de sabão, biografia que se colore com a rolagem, nota que conta, mural que entra.
   Motion: molas nos botões, botões magnéticos, bolhas que estouram, acordeão com mola, ícones que pulam.
   Sem bibliotecas: menu, vídeo, "aberto agora" no fuso de São Paulo, capítulos do banho, holofote dos cartões. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = doc.classList.contains('reduce');
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var G = window.gsap || null;
  var M = window.Motion || null;
  var spring = function (k, d) { return { type: 'spring', stiffness: k, damping: d }; };
  if (G && window.ScrollTrigger) G.registerPlugin(window.ScrollTrigger);
  if (G && window.SplitText) G.registerPlugin(window.SplitText);

  /* ------------------------------------------------------------ ano */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ------------------------------------------------------------ nav vira faixa opaca ao rolar */
  var nav = $('[data-nav]');
  function onScrollNav() { if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 40); }
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  /* ------------------------------------------------------------ menu do celular */
  var menuBtn = $('[data-menu-btn]');
  var menu = $('[data-menu]');
  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    $('.sr', menuBtn).textContent = open ? 'Fechar menu' : 'Abrir menu';
    if (open) {
      menu.hidden = false;
      document.body.style.overflow = 'hidden';
      if (M && !reduce) M.animate($$('nav a, .btn, .menu__foot', menu), { opacity: [0, 1], y: [18, 0] }, { delay: M.stagger ? M.stagger(0.04) : 0, duration: 0.4 });
      var first = $('a', menu); if (first) first.focus({ preventScroll: true });
    } else {
      menu.hidden = true;
      document.body.style.overflow = '';
    }
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 960 && !menu.hidden) setMenu(false); });
  }

  /* ------------------------------------------------------------ vídeo do hero */
  var video = $('[data-hero-video]');
  var vbtn = $('[data-video-toggle]');
  var userPaused = false;
  var bubblesPaused = false;
  function tryPlay() { if (!video || userPaused) return; var p = video.play(); if (p && p.catch) p.catch(function () {}); }
  function syncBtn() {
    if (!vbtn) return;
    var paused = userPaused;
    vbtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
    vbtn.setAttribute('aria-label', paused ? 'Tocar o vídeo e as bolhas' : 'Pausar o vídeo e as bolhas');
    $('use', vbtn).setAttribute('href', paused ? '#i-play' : '#i-pause');
  }
  if (video) {
    video.muted = true;
    tryPlay();
    video.addEventListener('loadeddata', tryPlay);
    ['touchstart', 'scroll', 'keydown', 'pointerdown'].forEach(function (ev) {
      window.addEventListener(ev, function once() { tryPlay(); window.removeEventListener(ev, once); }, { passive: true });
    });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) tryPlay(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { tryPlay(); bubblesPaused = userPaused; } else { video.pause(); bubblesPaused = true; }
        toggleBubbles();
      }).observe($('.hero'));
    }
  }
  if (vbtn) {
    vbtn.addEventListener('click', function () {
      userPaused = !userPaused;
      if (userPaused) video.pause(); else tryPlay();
      bubblesPaused = userPaused;
      toggleBubbles();
      syncBtn();
    });
    syncBtn();
  }

  /* ------------------------------------------------------------ aberto agora (horário de São Paulo) */
  var HOURS = { 0: null, 1: null, 2: [9, 18], 3: [9, 18], 4: [9, 18], 5: [9, 18], 6: [9, 16] };
  var DAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  function spNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
      var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
      var wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday);
      return { d: wd, h: (parseInt(o.hour, 10) % 24) + parseInt(o.minute, 10) / 60 };
    } catch (e) { var n = new Date(); return { d: n.getDay(), h: n.getHours() + n.getMinutes() / 60 }; }
  }
  function nextOpen(now) {
    for (var i = 0; i < 8; i++) {
      var d = (now.d + i) % 7, h = HOURS[d];
      if (!h) continue;
      if (i === 0 && now.h >= h[0]) continue;
      return (i === 0 ? 'hoje' : i === 1 ? 'amanhã' : DAYS[d]) + ' às ' + h[0] + 'h';
    }
    return '';
  }
  function updateOpen() {
    var now = spNow(), h = HOURS[now.d];
    var open = !!(h && now.h >= h[0] && now.h < h[1]);
    var text = open ? 'Aberto agora · até às ' + h[1] + 'h' : 'Fechado agora · abre ' + nextOpen(now);
    $$('[data-open-status]').forEach(function (el) {
      el.classList.toggle('is-open', open);
      el.classList.toggle('is-closed', !open);
      $('[data-open-text]', el).textContent = text;
    });
    $$('[data-hours] tr').forEach(function (tr) { tr.classList.toggle('is-today', +tr.getAttribute('data-day') === now.d); });
  }
  updateOpen();
  setInterval(updateOpen, 60000);

  /* ------------------------------------------------------------ capítulos do banho */
  var chapters = $$('[data-ch]');
  var stage = $('[data-stage]');
  var dots = $$('.bath__dots li');
  var blueBtn = $('[data-blue-btn]');
  function setChapter(i) {
    chapters.forEach(function (c, k) { c.classList.toggle('is-on', k === i); });
    $$('[data-ch-img]', stage).forEach(function (im) { im.classList.toggle('is-on', +im.getAttribute('data-ch-img') === i); });
    dots.forEach(function (d, k) { d.classList.toggle('is-on', k === i); });
  }
  if (chapters.length && 'IntersectionObserver' in window) {
    var chIO = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) setChapter(+e.target.getAttribute('data-ch')); });
    }, { rootMargin: '-48% 0px -48% 0px' });
    chapters.forEach(function (c) { chIO.observe(c); });
  }
  if (blueBtn && stage) {
    blueBtn.addEventListener('click', function () {
      var on = !stage.classList.contains('is-blue');
      $$('[data-blue-target]').forEach(function (t) { t.classList.toggle('is-blue', on); });
      blueBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      blueBtn.textContent = on ? 'Apagar a luz azul' : 'Acender a luz azul';
    });
  }

  /* ------------------------------------------------------------ holofote nos cartões (estilo 21st.dev) */
  if (fine) {
    $$('[data-spotlight] .card').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ------------------------------------------------------------ barras das avaliações */
  var bars = $('[data-bars]');
  if (bars) {
    if (reduce || !('IntersectionObserver' in window)) bars.classList.add('is-in');
    else {
      var bo = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { bars.classList.add('is-in'); bo.disconnect(); } }, { threshold: 0.4 });
      bo.observe(bars);
    }
  }

  /* ------------------------------------------------------------ acordeão com mola (Motion) */
  $$('[data-faq] details').forEach(function (d) {
    var sum = $('summary', d), body = $('.faq__a', d);
    sum.addEventListener('click', function (e) {
      if (!M || reduce) return;
      e.preventDefault();
      if (d.open) {
        var h = body.offsetHeight;
        M.animate(body, { height: [h + 'px', '0px'], opacity: [1, 0] }, { duration: 0.28 }).finished.then(function () { d.open = false; body.style.height = ''; body.style.opacity = ''; });
      } else {
        d.open = true;
        var full = body.offsetHeight;
        M.animate(body, { height: ['0px', full + 'px'], opacity: [0, 1] }, spring(320, 30)).finished.then(function () { body.style.height = ''; });
      }
    });
  });

  /* ------------------------------------------------------------ Motion: molas, ímã e pulinhos */
  if (M && !reduce) {
    $$('.btn, .social, .actionbar a, .hero__pause, .nav__menu').forEach(function (el) {
      el.addEventListener('pointerdown', function () { M.animate(el, { scale: 0.95 }, spring(600, 30)); });
      var up = function () { M.animate(el, { scale: 1 }, spring(420, 14)); };
      el.addEventListener('pointerup', up);
      el.addEventListener('pointerleave', up);
    });
    if (fine) {
      $$('[data-magnetic]').forEach(function (el) {
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect();
          M.animate(el, { x: (e.clientX - r.left - r.width / 2) * 0.18, y: (e.clientY - r.top - r.height / 2) * 0.28 }, spring(260, 18));
        });
        el.addEventListener('pointerleave', function () { M.animate(el, { x: 0, y: 0 }, spring(260, 14)); });
      });
      $$('.card').forEach(function (c) {
        var ic = $('.card__ic', c);
        if (ic) c.addEventListener('pointerenter', function () { M.animate(ic, { y: [0, -8, 0], scale: [1, 1.1, 1] }, { duration: 0.5 }); });
      });
      $$('[data-pet]').forEach(function (p) {
        var n = $('.pol__name', p);
        if (n) p.addEventListener('pointerenter', function () { M.animate(n, { y: [0, -7, 0], scale: [1, 1.08, 1] }, { duration: 0.42 }); });
      });
    }
    var sticker = $('.sticker');
    if (sticker) sticker.addEventListener('click', function () { M.animate(sticker, { scale: [1, 1.18, 1] }, spring(500, 12)); });
  }

  /* ------------------------------------------------------------ bolhas de sabão (GSAP + Motion) */
  var bubbleBox = $('[data-bubbles]');
  var bubbleTweens = [];
  function toggleBubbles() { bubbleTweens.forEach(function (t) { if (bubblesPaused) t.pause(); else t.resume(); }); }

  if (!G || reduce) { doc.classList.add('ready'); litAll(); return; }

  function makeBubble(first) {
    var b = document.createElement('span');
    b.className = 'bubble';
    var small = window.innerWidth < 760;
    var size = G.utils.random(16, small ? 48 : 78, 1);
    b.style.width = b.style.height = size + 'px';
    b.style.left = G.utils.random(small ? 2 : 30, 96) + '%';
    bubbleBox.appendChild(b);
    var h = bubbleBox.offsetHeight + 160;
    var dur = G.utils.random(9, 16);
    var tw = G.fromTo(b, { y: 0, x: 0, scale: G.utils.random(.7, 1) }, {
      y: -h, x: G.utils.random(-70, 70), scale: G.utils.random(.9, 1.15), duration: dur, ease: 'none',
      delay: first ? G.utils.random(0, 8) : 0,
      onComplete: function () { remove(); }
    });
    if (first) tw.progress(G.utils.random(0, .5));
    var popped = false;
    function remove() { var i = bubbleTweens.indexOf(tw); if (i > -1) bubbleTweens.splice(i, 1); b.remove(); makeBubble(false); }
    function pop() {
      if (popped) return; popped = true; tw.kill();
      if (M) M.animate(b, { scale: [1, 1.5], opacity: [1, 0] }, { duration: 0.25 }).finished.then(remove);
      else remove();
    }
    b.addEventListener('pointerenter', pop);
    b.addEventListener('pointerdown', pop);
    bubbleTweens.push(tw);
    if (bubblesPaused) tw.pause();
  }
  if (bubbleBox) { var nb = window.innerWidth < 760 ? 8 : 14; for (var i = 0; i < nb; i++) makeBubble(true); }

  /* ------------------------------------------------------------ entrada do hero */
  var title = $('[data-hero-title]');
  var split = null;
  try { if (window.SplitText) split = window.SplitText.create(title, { type: 'words,chars', charsClass: 'ch', wordsClass: 'wd' }); } catch (e) { split = null; }
  doc.classList.add('ready');
  var tl = G.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('.nav__in', { y: -30, autoAlpha: 0, duration: 0.7 }, 0)
    .from(video, { scale: 1.12, duration: 2.2, ease: 'power2.out' }, 0)
    .from('[data-hero-item]:first-child', { y: 16, autoAlpha: 0, duration: 0.6 }, 0.15);
  if (split && split.chars) tl.from(split.chars, { yPercent: 90, autoAlpha: 0, scale: 0.6, duration: 0.7, ease: 'back.out(2.2)', stagger: 0.016 }, 0.25);
  else tl.from(title, { y: 30, autoAlpha: 0, duration: 0.8 }, 0.25);
  tl.from('.hero__lead, .hero__actions, .hero__facts', { y: 24, autoAlpha: 0, duration: 0.7, stagger: 0.1 }, 0.75)
    .fromTo('.hero__pause', { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(2)', clearProps: 'transform' }, 1.1)
    .from('.hero .cloud-edge', { yPercent: 100, duration: 0.8 }, 0.4);

  if (!window.ScrollTrigger) { litAll(); return; }
  var ST = window.ScrollTrigger;

  /* ------------------------------------------------------------ biografia que se colore palavra por palavra */
  var bio = $('[data-words]');
  var words = [];
  if (bio) {
    var keys = /^(alta|qualidade|higiene|conforto|bem-estar|amor)/i;
    bio.innerHTML = bio.textContent.trim().split(/\s+/).map(function (w) {
      return '<span class="w' + (keys.test(w) ? ' is-key' : '') + '">' + w + '</span>';
    }).join(' ');
    bio.classList.add('is-split');
    words = $$('.w', bio);
    ST.create({
      trigger: bio, start: 'top 82%', end: 'bottom 45%', scrub: true,
      onUpdate: function (s) {
        var n = Math.round(s.progress * words.length);
        words.forEach(function (w, k) { w.classList.toggle('is-lit', k < n); });
      }
    });
  }
  function litAll() { $$('.about__bio .w').forEach(function (w) { w.classList.add('is-lit'); }); }

  /* ------------------------------------------------------------ nota que conta */
  var score = $('[data-count]');
  if (score) {
    var obj = { v: 0 };
    G.to(obj, {
      v: parseFloat(score.getAttribute('data-count')), duration: 1.6, ease: 'power2.out',
      scrollTrigger: { trigger: score, start: 'top 85%', once: true },
      onUpdate: function () { score.textContent = obj.v.toFixed(1).replace('.', ','); }
    });
  }

  /* ------------------------------------------------------------ mural e bento entram uma vez */
  G.set('.wall .pol, .bento .card', { opacity: 0, y: 40, scale: 0.96 }); // opacity (não visibility): continuam na ordem do Tab
  ST.batch('.wall .pol, .bento .card', {
    start: 'top 92%', once: true,
    onEnter: function (els) {
      els.forEach(function (el) { el.style.transition = 'none'; });
      G.to(els, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'back.out(1.6)', stagger: 0.08, overwrite: true, clearProps: 'transform',
        onComplete: function () { els.forEach(function (el) { el.style.transition = ''; }); } });
    }
  });
  // o teclado nunca cai num cartão ainda escondido
  document.addEventListener('focusin', function (e) {
    if (tl.isActive() && e.target.closest('.hero, .nav')) tl.progress(1);
    var el = e.target.closest && e.target.closest('.pol, .card');
    if (el && parseFloat(getComputedStyle(el).opacity) < 1) { G.killTweensOf(el); G.set(el, { opacity: 1, y: 0, scale: 1, clearProps: 'transform' }); }
  });
  // nada fica escondido se a página abrir já rolada
  window.addEventListener('load', function () { ST.refresh(); });
})();
