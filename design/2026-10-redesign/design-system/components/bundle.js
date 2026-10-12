/* HikingBuddy design system helpers: window.HB. Plain script, no framework.
   HB.icons      custom hiker icons: boot (Worn), carabiner, hiker, mark (SVG strings, Lucide-style 24px grid, stroke = currentColor)
   HB.mountIcons(root)   replaces <i data-hb-icon="boot"> with the SVG and runs Lucide for <i data-lucide="...">
   HB.backpack(el, data) renders the backpack weight chart + legend (reference implementation for the app) */
(function () {
  var A = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="hb-ico" aria-hidden="true"';
  var icons = {
    boot: '<svg ' + A + '><path d="M6.5 3h5.5v7l4.6 1.6A4.6 4.6 0 0 1 20 16v1H5.5L6.5 3z"/><path d="M4.5 17H20v2a1.5 1.5 0 0 1-1.5 1.5h-12.5A1.5 1.5 0 0 1 4.5 19z"/><path d="M12 6H9.5"/><path d="M12 8.8H9.5"/></svg>',
    carabiner: '<svg ' + A + '><g transform="rotate(40 12 12)"><path d="M12 2.5a4.5 4.5 0 0 1 4.5 4.5v6.2"/><path d="M16.5 16.6V17a4.5 4.5 0 0 1-9 0V7A4.5 4.5 0 0 1 12 2.5"/><path d="M14 7.5l2.5 9.5"/></g></svg>',
    hiker: '<svg ' + A + '><circle cx="12" cy="4" r="1.8"/><path d="M11 7.5l-1.5 6 2.5 2.5V21"/><path d="M9.5 13.5L8 21"/><path d="M11 7.5l3 2.5 2.5.5"/><path d="M11 7.5L8.5 7a2 2 0 0 0-2 1.6L6 12l3 .8"/><path d="M17.5 8.5L19 21"/></svg>',
    mark: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true"><path d="M12 7.5V6a4 4 0 0 1 8 0v1.5" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round"/><rect x="6" y="7" width="20" height="23" rx="7" fill="var(--accent)"/><path d="M6 14c3 1.6 6.5 2.3 10 2.3s7-.7 10-2.3" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round" opacity=".55"/><path d="M9.5 26.5l4.2-5.6 2.3 2.7 2.3-3.4 4.2 6.3z" fill="var(--surface)"/><circle cx="20.5" cy="19.8" r="1.3" fill="var(--sun)"/></svg>'
  };

  function mountIcons(root) {
    root = root || document;
    var list = root.querySelectorAll('[data-hb-icon]');
    for (var i = 0; i < list.length; i++) {
      var name = list[i].getAttribute('data-hb-icon');
      if (icons[name]) list[i].outerHTML = icons[name];
    }
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons({ attrs: { 'stroke-width': 1.75 } });
  }

  // Category icon: a Lucide name, or 'hb:<name>' for a custom HikingBuddy icon (e.g. 'hb:boot').
  function iconHtml(name) {
    if (String(name).indexOf('hb:') === 0) return icons[name.slice(3)] || '';
    return '<i data-lucide="' + name + '"></i>';
  }

  function fmt(g, unit) {
    if (unit === 'imperial') { var oz = g / 28.3495; return oz >= 16 ? (oz / 16).toFixed(2) + ' lb' : oz.toFixed(1) + ' oz'; }
    return g >= 1000 ? (g / 1000).toFixed(2) + ' kg' : Math.round(g) + ' g';
  }

  function luminance(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
    if (!m) return 0.5;
    var n = parseInt(m[1], 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) {
      v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }

  // Backpack geometry, viewBox 0 0 220 280. The body path is also the clip for the layers.
  // Backpack shapes, all on viewBox 0 0 220 280. `body` is the outline AND the clip for the colour layers;
  // `behind` is drawn under the body (handle, side pockets, lid), `front` over the layers (seams, pockets).
  var D = 'class="hb-pack-detail"', DS = 'class="hb-pack-detail" stroke-opacity=".55"', E = 'class="hb-pack-empty"';
  var SHAPES = {
    rounded: { // A: rounded top, side pockets (v1)
      body: 'M44 94A58 58 0 0 1 102 36H118A58 58 0 0 1 176 94V242A26 26 0 0 1 150 268H70A26 26 0 0 1 44 242Z', top: 36, bottom: 268,
      behind: '<path d="M94 38V26a16 16 0 0 1 32 0v12" ' + D + '/><rect x="27" y="150" width="21" height="92" rx="9" ' + E + '/><rect x="27" y="150" width="21" height="92" rx="9" ' + D + '/><rect x="172" y="150" width="21" height="92" rx="9" ' + E + '/><rect x="172" y="150" width="21" height="92" rx="9" ' + D + '/>',
      front: '<path d="M45 104C78 122 142 122 175 104" ' + DS + '/><rect x="72" y="182" width="76" height="66" rx="16" ' + DS + '/>'
    },
    dome: { // B: daypack with a full dome and a zip following it
      body: 'M40 120A70 70 0 0 1 180 120V244A24 24 0 0 1 156 268H64A24 24 0 0 1 40 244Z', top: 50, bottom: 268,
      behind: '<path d="M97 52V42a13 13 0 0 1 26 0v10" ' + D + '/>',
      front: '<path d="M56 132A54 54 0 0 1 164 132" ' + DS + '/><path d="M64 190H156V236A16 16 0 0 1 140 252H80A16 16 0 0 1 64 236Z" ' + DS + '/>'
    },
    rolltop: { // C: ultralight roll-top with side clips and a front mesh pocket
      body: 'M46 80H174V246A22 22 0 0 1 152 268H68A22 22 0 0 1 46 246Z', top: 80, bottom: 268,
      behind: '<rect x="40" y="46" width="140" height="30" rx="15" ' + E + '/><rect x="40" y="46" width="140" height="30" rx="15" ' + D + '/><path d="M58 61H162" ' + DS + '/>',
      front: '<path d="M50 76V100M170 76V100" ' + D + '/><rect x="44" y="98" width="12" height="10" rx="2" class="hb-pack-buckle"/><rect x="164" y="98" width="12" height="10" rx="2" class="hb-pack-buckle"/><path d="M64 168H156V238A12 12 0 0 1 144 250H76A12 12 0 0 1 64 238Z" ' + DS + '/><path d="M64 176H156" ' + DS + '/>'
    },
    trekking: { // D: tall trekking pack with a separate lid and compression straps
      body: 'M58 72Q58 60 70 60H150Q162 60 162 72L170 250Q171 268 153 268H67Q49 268 50 250Z', top: 60, bottom: 268,
      behind: '<path d="M52 44Q52 28 70 26H150Q168 28 168 44V60Q110 72 52 60Z" ' + E + '/><path d="M52 44Q52 28 70 26H150Q168 28 168 44V60Q110 72 52 60Z" ' + D + '/>',
      front: '<path d="M54 130H70M52 190H70M166 130H150M168 190H150" ' + D + '/><rect x="80" y="178" width="60" height="66" rx="12" ' + DS + '/>'
    },
    capsule: { // E: pure capsule, the most minimal
      body: 'M50 100A60 60 0 0 1 170 100V208A60 60 0 0 1 50 208Z', top: 40, bottom: 268,
      behind: '<path d="M98 42V32a12 12 0 0 1 24 0v10" ' + D + '/>',
      front: '<path d="M60 150Q110 168 160 150" ' + DS + '/>'
    }
  };
  var MIN_H = 3;

  /* data = { unit: 'metric'|'imperial', shape: 'rounded'|'dome'|'rolltop'|'trekking'|'capsule',
              base, consumable, worn (grams), categories: [{ id, name, icon, color (token name), grams }] }
     The pack holds Base + Consumables (categories' grams); Worn is listed under it, outside the pack.
     Layers: heaviest at the bottom. Each layer's height = its share of the pack weight. */
  function backpack(el, data) {
    var S = SHAPES[data.shape] || SHAPES.rounded /* A, chosen 2026-10-12 */, TOP = S.top, BOTTOM = S.bottom;
    var css = getComputedStyle(document.documentElement);
    var cats = data.categories.filter(function (c) { return c.grams > 0; }).slice().sort(function (a, b) { return b.grams - a.grams; });
    var total = cats.reduce(function (s, c) { return s + c.grams; }, 0);
    var uid = 'hbp' + Math.random().toString(36).slice(2, 7);
    var y = BOTTOM, layers = '', gaps = '', labels = '';
    cats.forEach(function (c, i) {
      var h = total ? (c.grams / total) * (BOTTOM - TOP) : 0;
      if (h > 0 && h < MIN_H) h = MIN_H; // keep tiny categories visible
      y -= h;
      var hex = css.getPropertyValue('--' + c.color).trim();
      var pct = total ? Math.round((c.grams / total) * 100) : 0;
      layers += '<rect class="hb-pack-layer" data-i="' + i + '" x="20" y="' + y.toFixed(2) + '" width="180" height="' + (h + 0.5).toFixed(2) + '" fill="var(--' + c.color + ')"><title>' + c.name + ': ' + fmt(c.grams, data.unit) + ' (' + pct + ' %)</title></rect>';
      if (i < cats.length - 1) gaps += '<line class="hb-pack-gap" x1="20" x2="200" y1="' + y.toFixed(2) + '" y2="' + y.toFixed(2) + '"/>';
      if (h >= 20) labels += '<text x="110" y="' + (y + h / 2 + 5).toFixed(2) + '" text-anchor="middle" font-family="var(--font-sans)" font-size="13" font-weight="600" fill="' + (luminance(hex) > 0.3 ? 'var(--ink)' : 'var(--surface)') + '" pointer-events="none">' + pct + ' %</text>';
    });
    var svg =
      '<svg class="hb-pack-svg" viewBox="0 0 220 280" role="img" aria-label="Pack weight by category">' +
      '<defs><clipPath id="' + uid + '"><path d="' + S.body + '"/></clipPath></defs>' +
      S.behind +
      '<path d="' + S.body + '" ' + E + '/>' +
      '<g clip-path="url(#' + uid + ')">' + layers + gaps + labels + '</g>' +
      S.front +
      '<path d="' + S.body + '" class="hb-pack-outline"/>' +
      '</svg>';
    var rows = cats.map(function (c, i) {
      return '<li class="hb-legend-row" data-i="' + i + '" tabindex="0"><span class="hb-swatch" style="background:var(--' + c.color + ')"></span>' +
        iconHtml(c.icon) + '<span>' + c.name + '</span>' +
        '<span class="hb-legend-w">' + fmt(c.grams, data.unit) + '</span><span class="hb-legend-p">' + (total ? Math.round(c.grams / total * 100) : 0) + ' %</span></li>';
    }).join('');
    var base = data.base != null ? data.base : total - (data.consumable || 0);
    el.classList.add('hb-pack');
    el.innerHTML =
      '<div class="hb-pack-figure">' + svg +
      '<div class="hb-pack-total"><div class="hb-label">In the pack</div><div class="hb-pack-kg">' + fmt(total, data.unit) + '</div></div>' +
      '<dl class="hb-pack-split">' +
      '<div data-tip="Base weight: everything in the pack except consumables"><dt><i data-lucide="backpack"></i>Base</dt><dd>' + fmt(base, data.unit) + '</dd></div>' +
      '<div data-tip="Consumables: food, fuel, water. In the pack, gets lighter every day"><dt>' + '<i data-lucide="utensils"></i>Consumables</dt><dd>' + fmt(data.consumable || 0, data.unit) + '</dd></div>' +
      '<div class="hb-pack-split-worn" data-tip="Worn: carried on your body, not in the pack"><dt>' + icons.hiker + 'Worn</dt><dd>+ ' + fmt(data.worn || 0, data.unit) + '</dd></div>' +
      '</dl></div>' +
      '<ul class="hb-legend"><li class="hb-legend-head hb-label"><span></span><span></span><span>Category</span><span>Weight</span><span>Share</span></li>' + rows + '</ul>';
    function focus(i) {
      el.classList.toggle('is-focus', i !== null);
      el.querySelectorAll('[data-i]').forEach(function (n) { n.classList.toggle('is-active', n.getAttribute('data-i') === String(i)); });
    }
    el.querySelectorAll('[data-i]').forEach(function (n) {
      n.addEventListener('mouseenter', function () { focus(n.getAttribute('data-i')); });
      n.addEventListener('mouseleave', function () { focus(null); });
      n.addEventListener('focus', function () { focus(n.getAttribute('data-i')); });
      n.addEventListener('blur', function () { focus(null); });
    });
    mountIcons(el);
  }

  window.HB = { icons: icons, iconHtml: iconHtml, mountIcons: mountIcons, backpack: backpack, formatWeight: fmt };
})();
