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

  // Backpack chart v2 (2026-10-13). Shape A only. viewBox 0 0 340 280: the pack sits at x 26-194,
  // the strip x 200-340 holds outside labels for layers too thin to carry their own percentage.
  var D = 'class="hb-pack-detail"', DS = 'class="hb-pack-detail" stroke-opacity=".55"', E = 'class="hb-pack-empty"';
  var PACK = {
    body: 'M44 94A58 58 0 0 1 102 36H118A58 58 0 0 1 176 94V242A26 26 0 0 1 150 268H70A26 26 0 0 1 44 242Z', top: 36, bottom: 268,
    behind: '<path d="M94 38V26a16 16 0 0 1 32 0v12" ' + D + '/><rect x="27" y="150" width="21" height="92" rx="9" ' + E + '/><rect x="27" y="150" width="21" height="92" rx="9" ' + D + '/><rect x="172" y="150" width="21" height="92" rx="9" ' + E + '/><rect x="172" y="150" width="21" height="92" rx="9" ' + D + '/>',
    // front pocket only; the lid seam was removed (it crossed the percentages)
    front: '<rect x="72" y="182" width="76" height="66" rx="16" ' + DS + '/>'
  };

  /* Pack tiers by BASE weight (Martin, 2026-10-13; common backpacking breakpoints, 10 lb and 15 lb):
     ultralight < 4.5 kg, lightweight 4.5-6.8 kg, traditional > 6.8 kg.
     The pack outline never changes; each heavier tier straps more gear onto the outside of the pack. */
  var TIERS = [
    { id: 'ultralight', name: 'Ultralight', icon: 'feather', max: 4536 },
    { id: 'lightweight', name: 'Lightweight', icon: 'footprints', max: 6804 },
    { id: 'traditional', name: 'Traditional', icon: 'mountain', max: Infinity }
  ];
  function tierOf(baseGrams) { for (var i = 0; i < TIERS.length; i++) if (baseGrams < TIERS[i].max) return i; return TIERS.length - 1; }
  var G = 'class="hb-pack-gear-part"';
  var GEAR = { // ultralight: the bare pack, nothing strapped on
    // lightweight: a folded foam sleeping pad strapped under the pack
    pad: '<g class="hb-pack-gear" data-gear="pad"><rect x="34" y="258" width="152" height="34" rx="12" ' + G + ' style="fill:var(--ridge-2)"/>' +
      '<path d="M50 262v26M66 262v26M82 262v26M98 262v26M122 262v26M138 262v26M154 262v26M170 262v26" class="hb-pack-detail" stroke-opacity=".35" stroke-width="1.5"/>' +
      '<rect x="64" y="252" width="10" height="46" rx="2" ' + G + '/><rect x="146" y="252" width="10" height="46" rx="2" ' + G + '/>' +
      '<rect x="62" y="276" width="14" height="8" rx="2" class="hb-pack-buckle"/><rect x="144" y="276" width="14" height="8" rx="2" class="hb-pack-buckle"/></g>',
    // traditional: + ice axe lashed on the left, two more side pockets, trekking poles on the right, hiking boots at the bottom right
    axe: '<g class="hb-pack-gear" data-gear="axe"><rect x="12" y="108" width="7" height="166" rx="3" ' + G + '/>' +
      '<path d="M-22 120Q-6 103 16 102H32Q41 102 43 108L39 111Q34 108 24 109H18Q-2 110 -22 120Z" ' + G + '/><path d="M12 274l3.5 14 3.5-14" ' + G + '/>' +
      '<path d="M19 200q14 6 8 22" class="hb-pack-detail" stroke-width="1.5"/></g>',
    pockets: '<g class="hb-pack-gear" data-gear="pockets"><rect x="29" y="92" width="19" height="48" rx="7" ' + G + '/><rect x="172" y="92" width="19" height="48" rx="7" ' + G + '/></g>',
    // trekking poles strapped upright on the right side: the counterweight to the ice axe on the left
    poles: '<g class="hb-pack-gear" data-gear="poles"><g transform="translate(197 128)"><rect x="-3" y="16" width="6" height="144" rx="3" ' + G + ' style="fill:var(--sun)"/><rect x="-5" y="0" width="10" height="24" rx="4" ' + G + ' style="fill:var(--ridge-5)"/><path d="M4 3c10 2 12 14 2 16" class="hb-pack-detail" stroke-width="1.75"/><path d="M-2 160L0 170L2 160" ' + G + '/></g><g transform="translate(207 122)"><rect x="-3" y="16" width="6" height="148" rx="3" ' + G + ' style="fill:var(--sun)"/><rect x="-5" y="0" width="10" height="24" rx="4" ' + G + ' style="fill:var(--ridge-5)"/><path d="M4 3c10 2 12 14 2 16" class="hb-pack-detail" stroke-width="1.75"/><path d="M-2 164L0 174L2 164" ' + G + '/></g></g>',
    // a pair of hiking boots in profile, standing at the bottom right, tied to the poles by a lace
    boots: '<g class="hb-pack-gear" data-gear="boots"><path d="M205 214Q214 236 214 250" class="hb-pack-detail" stroke-width="1.5"/><g transform="translate(176 297) scale(1.15)"><path d="M4-2V-31Q4-37 10-37H22Q27-37 27-32V-22L38-16Q47-12 47-6V-2Z" ' + G + ' style="fill:var(--ridge-2)"/><path d="M4-31H27" class="hb-pack-detail" stroke-width="1.75"/><path d="M22-28l6 2M23-23l6 2M25-18l6 2" class="hb-pack-detail" stroke-width="1.75"/><path d="M2-3H47Q50-3 50 1V2Q50 5 47 5H5Q2 5 2 2Z" fill="var(--ink)"/></g><g transform="translate(192 301) scale(1.15)"><path d="M4-2V-31Q4-37 10-37H22Q27-37 27-32V-22L38-16Q47-12 47-6V-2Z" ' + G + ' style="fill:var(--ridge-3)"/><path d="M4-31H27" class="hb-pack-detail" stroke-width="1.75"/><path d="M22-28l6 2M23-23l6 2M25-18l6 2" class="hb-pack-detail" stroke-width="1.75"/><path d="M2-3H47Q50-3 50 1V2Q50 5 47 5H5Q2 5 2 2Z" fill="var(--ink)"/></g></g>'
  };
  var MIN_H = 7;      // thinnest layer, in viewBox units (~9px on screen), so every category stays visible and hoverable
  var INSIDE_H = 18;  // a layer at least this tall carries its percentage inside; thinner ones get an outside label
  var LABEL_GAP = 13; // minimum vertical distance between outside labels

  // Heights proportional to weight, but never below MIN_H; the rest is scaled so the stack still fills the pack exactly.
  function layerHeights(grams, space) {
    var total = grams.reduce(function (s, g) { return s + g; }, 0);
    if (!total) return grams.map(function () { return 0; });
    var h = grams.map(function (g) { return g / total * space; });
    for (var k = 0; k < 5; k++) {
      var small = h.map(function (v) { return v < MIN_H; });
      var fixed = small.filter(Boolean).length * MIN_H;
      var restGrams = grams.reduce(function (s, g, i) { return small[i] ? s : s + g; }, 0);
      h = grams.map(function (g, i) { return small[i] ? MIN_H : g / restGrams * (space - fixed); });
    }
    return h;
  }

  /* data = { unit: 'metric'|'imperial', base, consumable, worn (grams),
              categories: [{ id, name, icon, color (token name), grams }] }
     The pack holds Base + Consumables (the categories' grams); Worn is listed under it, outside the pack.
     Layers: heaviest at the bottom. */
  function backpack(el, data) {
    var S = PACK, TOP = S.top, BOTTOM = S.bottom;
    var css = getComputedStyle(document.documentElement);
    var cats = data.categories.filter(function (c) { return c.grams > 0; }).slice().sort(function (a, b) { return b.grams - a.grams; });
    var total = cats.reduce(function (s, c) { return s + c.grams; }, 0);
    var consumableG = data.consumable || 0;
    var baseG = data.base != null ? data.base : total - consumableG;
    var tier = tierOf(baseG), prevTier = el.hbTier;
    el.hbTier = tier;
    var hs = layerHeights(cats.map(function (c) { return c.grams; }), BOTTOM - TOP);
    var uid = 'hbp' + Math.random().toString(36).slice(2, 7);
    var y = BOTTOM, layers = '', gaps = '', inside = '', outside = [];
    cats.forEach(function (c, i) {
      var h = hs[i];
      y -= h;
      var hex = css.getPropertyValue('--' + c.color).trim();
      var pct = total ? Math.round((c.grams / total) * 100) : 0;
      var pctTxt = (pct < 1 ? '<1' : pct) + ' %';
      layers += '<rect class="hb-pack-layer" data-i="' + i + '" x="20" y="' + y.toFixed(2) + '" width="180" height="' + (h + 0.5).toFixed(2) + '" fill="var(--' + c.color + ')"><title>' + c.name + ': ' + fmt(c.grams, data.unit) + ' (' + pctTxt + ')</title></rect>';
      if (i < cats.length - 1) gaps += '<line class="hb-pack-gap" x1="20" x2="200" y1="' + y.toFixed(2) + '" y2="' + y.toFixed(2) + '"/>';
      if (h >= INSIDE_H) inside += '<text class="hb-pack-pct" data-i="' + i + '" x="110" y="' + (y + h / 2 + 5).toFixed(2) + '" text-anchor="middle" fill="' + (luminance(hex) > 0.3 ? 'var(--ink)' : 'var(--surface)') + '">' + pctTxt + '</text>';
      else outside.push({ i: i, mid: y + h / 2, name: c.name, pct: pctTxt });
    });
    // Outside labels: top to bottom, pushed apart so they never overlap, kept inside the pack's height.
    outside.sort(function (a, b) { return a.mid - b.mid; });
    var ly = TOP;
    outside.forEach(function (o) { o.ly = Math.max(o.mid, ly); ly = o.ly + LABEL_GAP; });
    var labelBottom = tier >= 2 ? 112 : BOTTOM; // Traditional: keep outside labels above the poles on the right
    var over = outside.length ? outside[outside.length - 1].ly - labelBottom : 0;
    if (over > 0) outside.forEach(function (o) { o.ly -= over; });
    var callouts = outside.map(function (o) {
      return '<g class="hb-pack-callout" data-i="' + o.i + '"><path d="M150 ' + o.mid.toFixed(2) + 'H196L206 ' + o.ly.toFixed(2) + 'H212" class="hb-pack-leader"/>' +
        '<text x="216" y="' + (o.ly + 4).toFixed(2) + '"><tspan class="hb-pack-pct-out">' + o.pct + '</tspan> ' + o.name + '</text></g>';
    }).join('');
    // Gear appears in layers: axe and poles behind the side pockets, extra pockets with them, pad and boots in front.
    // Only gear that is NEW since the last render animates in (class is-new), so normal edits stay calm.
    function gearPart(name) { return GEAR[name] || ''; }
    var shown = { pad: tier >= 1, axe: tier >= 2, pockets: tier >= 2, poles: tier >= 2, boots: tier >= 2 };
    var wasShown = prevTier == null ? shown : { pad: prevTier >= 1, axe: prevTier >= 2, pockets: prevTier >= 2, poles: prevTier >= 2, boots: prevTier >= 2 };
    function g(name) {
      if (!shown[name]) return '';
      var html = gearPart(name);
      return wasShown[name] ? html : html.replace('class="hb-pack-gear"', 'class="hb-pack-gear is-new"');
    }
    var gearBehind = g('axe') + g('poles'), gearMid = g('pockets'), gearFront = g('pad') + g('boots');
    var svg =
      '<svg class="hb-pack-svg" viewBox="-30 0 370 306" role="img" aria-label="Pack weight by category, ' + TIERS[tier].name + ' pack">' +
      '<defs><clipPath id="' + uid + '"><path d="' + S.body + '"/></clipPath></defs>' +
      gearBehind +
      S.behind +
      gearMid +
      '<path d="' + S.body + '" ' + E + '/>' +
      '<g clip-path="url(#' + uid + ')">' + layers + gaps + '</g>' +
      S.front +
      '<path d="' + S.body + '" class="hb-pack-outline"/>' +
      '<g clip-path="url(#' + uid + ')">' + inside + '</g>' +
      gearFront +
      callouts +
      '</svg>';
    var rows = cats.map(function (c, i) {
      return '<li class="hb-legend-row" data-i="' + i + '" tabindex="0"><span class="hb-swatch" style="background:var(--' + c.color + ')"></span>' +
        iconHtml(c.icon) + '<span>' + c.name + '</span>' +
        '<span class="hb-legend-w">' + fmt(c.grams, data.unit) + '</span><span class="hb-legend-p">' + (total ? Math.round(c.grams / total * 100) : 0) + ' %</span></li>';
    }).join('');
    var T = TIERS[tier], LIMIT = data.unit === 'imperial' ? ['10 lb', '15 lb'] : ['4.5 kg', '6.8 kg'];
    var hint = tier === 0 ? 'Base weight under ' + LIMIT[0]
      : fmt(baseG - TIERS[tier - 1].max + 1, data.unit) + ' to ' + TIERS[tier - 1].name;
    var tierTip = tier === 0 ? 'Ultralight: base weight under ' + LIMIT[0]
      : tier === 1 ? 'Lightweight: base weight ' + LIMIT[0] + ' to ' + LIMIT[1] : 'Traditional: base weight over ' + LIMIT[1];
    var tierHtml = '<div class="hb-pack-tier-wrap"><span class="hb-pack-tier hb-pack-tier--' + T.id + (prevTier != null && prevTier !== tier ? ' is-new' : '') + '" data-tip="' + tierTip + '">' +
      '<i data-lucide="' + T.icon + '"></i>' + T.name + '</span><span class="hb-pack-tier-hint">' + hint + '</span></div>';
    var consumable = data.consumable || 0, worn = data.worn || 0;
    var base = data.base != null ? data.base : total - consumable;
    el.classList.add('hb-pack');
    el.innerHTML =
      '<div class="hb-pack-figure">' + svg +
      tierHtml +
      '<div class="hb-pack-total"><div class="hb-label">In the pack</div><div class="hb-pack-kg">' + fmt(total, data.unit) + '</div></div>' +
      '<dl class="hb-pack-split">' +
      '<div data-tip="Everything in the pack except consumables"><dt><i data-lucide="backpack"></i>Base weight</dt><dd>' + fmt(base, data.unit) + '</dd></div>' +
      '<div data-tip="Food, fuel and water: in the pack, lighter every day"><dt><i data-lucide="utensils"></i>Consumables</dt><dd>' + fmt(consumable, data.unit) + '</dd></div>' +
      '<div class="hb-pack-split-worn" data-tip="Carried on your body, not in the pack"><dt>' + icons.hiker + 'Worn</dt><dd>+ ' + fmt(worn, data.unit) + '</dd></div>' +
      '<div class="hb-pack-split-total"><dt><i data-lucide="mountain"></i>Total</dt><dd>' + fmt(total + worn, data.unit) + '</dd></div>' +
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
