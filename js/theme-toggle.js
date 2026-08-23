(function() {
  var html = document.documentElement;
  var themeChip = document.getElementById('theme-chip');
  var pagecolorChip = document.getElementById('pagecolor-chip');

  function getTheme() {
    var p = new URLSearchParams(window.location.search).get('theme');
    if (p === 'latex' || p === 'sketch') return p;
    try {
      var s = localStorage.getItem('theme');
      if (s === 'latex' || s === 'sketch') return s;
    } catch(e) {}
    return 'latex';
  }
  function getMode() {
    var p = new URLSearchParams(window.location.search).get('mode');
    if (p === 'dark' || p === 'light') return p;
    try {
      var s = localStorage.getItem('mode');
      if (s === 'dark' || s === 'light') return s;
    } catch(e) {}
    return 'light';
  }

  function chipText(theme) {
    return theme === 'sketch' ? '\\documentclass{article}' : '\\end{document}';
  }

  function propagatePairs(theme) {
    var pairs = document.querySelectorAll('[data-pair]');
    for (var i = 0; i < pairs.length; i++) {
      var latexEl = pairs[i].querySelector('.latex-card');
      var sketchEl = pairs[i].querySelector('.sketch-card');
      if (!latexEl || !sketchEl) continue;
      if (theme === 'latex') {
        sketchEl.setAttribute('inert', '');
        sketchEl.setAttribute('aria-hidden', 'true');
        latexEl.removeAttribute('inert');
        latexEl.removeAttribute('aria-hidden');
      } else {
        latexEl.setAttribute('inert', '');
        latexEl.setAttribute('aria-hidden', 'true');
        sketchEl.removeAttribute('inert');
        sketchEl.removeAttribute('aria-hidden');
      }
    }
  }

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch(e) {}
    if (themeChip) themeChip.textContent = chipText(theme);
    propagatePairs(theme);
  }
  function applyMode(mode) {
    html.setAttribute('data-mode', mode);
    try { localStorage.setItem('mode', mode); } catch(e) {}
    if (pagecolorChip) {
      pagecolorChip.textContent = mode === 'dark' ? '\\pagecolor{light}' : '\\pagecolor{dark}';
    }
  }

  applyTheme(getTheme());
  applyMode(getMode());

  if (themeChip) {
    themeChip.onclick = function() {
      var next = html.getAttribute('data-theme') === 'latex' ? 'sketch' : 'latex';
      applyTheme(next);
      return false;
    };
  }
  if (pagecolorChip) {
    pagecolorChip.onclick = function() {
      var next = html.getAttribute('data-mode') === 'dark' ? 'light' : 'dark';
      applyMode(next);
      return false;
    };
  }

  var topChip = document.getElementById('top-chip');
  if (topChip) {
    topChip.onclick = function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    };
    function checkScroll() {
      if (window.scrollY > 300) topChip.classList.add('visible');
      else topChip.classList.remove('visible');
    }
    checkScroll();
    window.addEventListener('scroll', checkScroll, { passive: true });
  }

  var navChip = document.getElementById('nav-chip');
  var navPopup = document.getElementById('latex-nav-popup');
  if (navChip && navPopup) {
    navChip.onclick = function(e) {
      e.preventDefault();
      navPopup.classList.toggle('show');
      return false;
    };
    document.addEventListener('click', function(e) {
      if (!navPopup.contains(e.target) && e.target !== navChip) {
        navPopup.classList.remove('show');
      }
    });
  }

  var tocChip = document.getElementById('toc-chip');
  var tocBox = document.getElementById('latex-toc');
  if (tocChip && tocBox) {
    if (!tocBox.getAttribute('data-built')) {
      var sections = document.querySelectorAll('section[id]');
      var items = [];
      for (var i = 0; i < sections.length; i++) {
        var s = sections[i];
        var h = s.querySelector('h2');
        if (!h) continue;
        var text = h.textContent.trim();
        if (!text || text.length > 60) continue;
        items.push({ id: s.id, text: text });
      }
      if (items.length > 0) {
        var html_ = '<div class="toc-title">Catalogue of Sections</div>';
        for (var j = 0; j < items.length; j++) {
          html_ += '<a href="#' + items[j].id + '" data-target="' + items[j].id + '">\\ref{' + items[j].text + '}</a>';
        }
        tocBox.innerHTML = html_;
        tocBox.setAttribute('data-built', '1');
      } else {
        tocChip.style.display = 'none';
        tocBox.style.display = 'none';
      }
    }
    tocChip.onclick = function(e) {
      e.preventDefault();
      tocBox.classList.toggle('show');
      return false;
    };
    var tocLinks = tocBox.querySelectorAll('a[data-target]');
    for (var k = 0; k < tocLinks.length; k++) {
      (function(link) {
        link.onclick = function(e) {
          e.preventDefault();
          var target = document.getElementById(link.getAttribute('data-target'));
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          tocBox.classList.remove('show');
          return false;
        };
      })(tocLinks[k]);
    }
    document.addEventListener('click', function(e) {
      if (!tocBox.contains(e.target) && e.target !== tocChip) {
        tocBox.classList.remove('show');
      }
    });
  }

  var clock = document.getElementById('latex-clock');
  if (clock) {
    function updateClock() {
      var now = new Date();
      var h = now.getHours();
      var m = now.getMinutes().toString().padStart(2, '0');
      var ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      h = h ? h : 12;
      clock.textContent = h + ':' + m + ' ' + ampm;
    }
    updateClock();
    setInterval(updateClock, 1000);
  }
})();