/* Jokko – générateur de gabarits de découpe. Calcul local, export SVG / PDF / DXF à l'échelle 1:1 (mm). */
(function () {
  var $ = function (s) { return document.querySelector(s) }, M = 5; // marge en mm

  // Boîte à rabats (fermeture inversée) : patte de collage + 4 panneaux, rabats rentrants haut et bas.
  function tuck(L, W, H, t) {
    var g = Math.min(15, W * .8), A = L + t, B = W + t, tk = Math.min(15, Math.max(8, W * .4)), df = Math.min(B * .75, A / 2),
      d = Math.min(B * .15, 5), c = Math.min(tk * .5, 6), ch = g * .3,
      xB = g + A, xC = xB + B, xD = xC + A, xE = xD + B, y1 = B + tk, y2 = y1 + H;
    return {
      w: xE, h: y2 + B + tk,
      cuts: [[[g, y1], [xB, y1], [xB + d, y1 - df], [xC - d, y1 - df], [xC, y1], [xC, y1 - B], [xC + c, 0], [xD - c, 0], [xD, y1 - B], [xD, y1],
        [xD + d, y1 - df], [xE - d, y1 - df], [xE, y1], [xE, y2], [xE - d, y2 + df], [xD + d, y2 + df], [xD, y2], [xC, y2], [xC - d, y2 + df], [xB + d, y2 + df], [xB, y2],
        [xB, y2 + B], [xB - c, y2 + B + tk], [g + c, y2 + B + tk], [g, y2 + B], [g, y2], [0, y2 - ch], [0, y1 + ch]]],
      folds: [[g, y1, g, y2], [xB, y1, xB, y2], [xC, y1, xC, y2], [xD, y1, xD, y2], [xB, y1, xE, y1], [xC, y1 - B, xD, y1 - B],
        [g, y2, xC, y2], [xD, y2, xE, y2], [g, y2 + B, xB, y2 + B]]
    };
  }
  // Boîte plateau : fond + 4 parois, pattes de collage aux angles.
  function tray(L, W, H, ox) {
    ox = ox || 0; var g = Math.min(15, H * .8), p = Math.min(H * .15, 4), a = H, b = H + L, c = 2 * H + L, e = H + W, f = 2 * H + W;
    var o = {
      w: c, h: f,
      cuts: [[[a, 0], [b, 0], [b + g, p], [b + g, a - p], [b, a], [c, a], [c, e], [b, e], [b + g, e + p], [b + g, f - p], [b, f], [a, f],
        [a - g, f - p], [a - g, e + p], [a, e], [0, e], [0, a], [a, a], [a - g, a - p], [a - g, p]]],
      folds: [[a, a, b, a], [b, a, b, e], [a, e, b, e], [a, a, a, e], [a, 0, a, a], [b, 0, b, a], [a, e, a, f], [b, e, b, f]]
    };
    if (ox) { o.cuts[0].forEach(function (q) { q[0] += ox }); o.folds.forEach(function (q) { q[0] += ox; q[2] += ox }) }
    return o;
  }
  // Boîte avec couvercle : deux plateaux, le couvercle est légèrement plus grand.
  function lid(L, W, H, t) {
    var a = tray(L, W, H), hl = Math.min(H, Math.max(15, H * .4)), b = tray(L + 2 * t + 1, W + 2 * t + 1, hl, a.w + 10);
    return { w: a.w + 10 + b.w, h: Math.max(a.h, b.h), cuts: a.cuts.concat(b.cuts), folds: a.folds.concat(b.folds) };
  }
  // Fourreau : patte de collage + 4 panneaux, ouvert aux deux extrémités.
  function sleeve(L, W, H, t) {
    var g = Math.min(15, H * .8), A = L + t, B = H + t, ch = g * .3, x1 = g + A, x2 = x1 + B, x3 = x2 + A, x4 = x3 + B;
    return { w: x4, h: W, cuts: [[[g, 0], [x4, 0], [x4, W], [g, W], [0, W - ch], [0, ch]]], folds: [[g, 0, g, W], [x1, 0, x1, W], [x2, 0, x2, W], [x3, 0, x3, W]] };
  }
  // Sac en papier à soufflets : patte de collage + face, soufflet, dos, soufflet ; rabat haut et fond replié.
  function bag(L, W, H, t) {
    var g = Math.min(20, W * .8), A = L + t, B = W + t, tf = Math.min(40, Math.max(15, H * .12)), bf = B * .5 + 15, ch = g * .3,
      x1 = g + A, x2 = x1 + B, x3 = x2 + A, x4 = x3 + B, y1 = tf, y2 = tf + H, y3 = y2 + bf, m = B / 2, yg = y2 - m,
      F = [[g, 0, g, y3], [x1, 0, x1, y3], [x2, 0, x2, y3], [x3, 0, x3, y3], [g, y1, x4, y1], [g, y2, x4, y2], [g, yg, x4, yg],
        [x1 + m, 0, x1 + m, yg], [x3 + m, 0, x3 + m, yg]];
    [x1, x3].forEach(function (X) { F.push([X, y2, X + m, yg], [X + B, y2, X + m, yg]) });
    return { w: x4, h: y3, cuts: [[[g, 0], [x4, 0], [x4, y3], [g, y3], [0, y3 - ch], [0, ch]]], folds: F };
  }
  // Enveloppe : face L × W, rabat de fermeture (R), dos rabattu et pattes latérales à coller.
  function env(L, W, R) {
    var s = Math.min(25, L * .15), tf = Math.min(R, W * .6), bh = Math.max(W - 15, W * .7), c = Math.min(tf * .5, 20), p = Math.min(10, W * .1), q = Math.min(8, L * .05),
      a = s, b = s + L, y1 = tf, y2 = tf + W, y3 = y2 + bh;
    return {
      w: b + s, h: y3,
      cuts: [[[a, y1], [a + c, 0], [b - c, 0], [b, y1], [b + s, y1 + p], [b + s, y2 - p], [b, y2], [b - q, y3], [a + q, y3], [a, y2], [0, y2 - p], [0, y1 + p]]],
      folds: [[a, y1, b, y1], [b, y1, b, y2], [a, y2, b, y2], [a, y1, a, y2]]
    };
  }
  // Boîte de présentation : plateau à dos haut, façade basse et côtés en biais, pattes de collage aux angles.
  function display(L, W, H) {
    var hf = Math.max(15, H * .4), g = Math.min(15, hf * .8), p = Math.min(H * .15, 4), p2 = Math.min(hf * .15, 4),
      a = H, b = H + L, c = b + H, e = H + W, f = e + hf;
    return {
      w: c, h: f,
      cuts: [[[a, 0], [b, 0], [b + g, p], [b + g, H - p], [b, H], [c, H], [b + hf, e], [b, e], [b + g, e + p2], [b + g, f - p2], [b, f], [a, f],
        [a - g, f - p2], [a - g, e + p2], [a, e], [a - hf, e], [0, H], [a, H], [a - g, H - p], [a - g, p]]],
      folds: [[a, H, b, H], [b, H, b, e], [a, e, b, e], [a, H, a, e], [a, 0, a, H], [b, 0, b, H], [a, e, a, f], [b, e, b, f]]
    };
  }
  var LB = { bag: ['Face', 'Soufflet', 'Hauteur'], env: ['Longueur', 'Hauteur', 'Rabat'] }, NO3D = { bag: 1, env: 1 };
  var T = { bag: bag, env: env, display: display, tuck: tuck, tray: function (L, W, H) { return tray(L, W, H) }, lid: lid, sleeve: sleeve };

  function n(v) { return (Math.round(v * 100) / 100).toString() }

  function svg(g, preview) {
    var w = g.w + 2 * M, h = g.h + 2 * M, ve = preview ? ' vector-effect="non-scaling-stroke"' : '', sw = preview ? 1.6 : .35,
      s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + [-M, -M, n(w), n(h)].join(' ') + '"' + (preview ? ' role="img" aria-label="Aperçu du gabarit"' : ' width="' + n(w) + 'mm" height="' + n(h) + 'mm"') + '>';
    g.cuts.forEach(function (p) {
      s += '<path id="coupe" fill="' + (preview ? '#fff' : 'none') + '" stroke="' + (preview ? '#111315' : '#000') + '" stroke-width="' + sw + '"' + ve + ' stroke-linejoin="round" d="M' + p.map(function (q) { return n(q[0]) + ' ' + n(q[1]) }).join('L') + 'Z"/>';
    });
    s += '<path id="pli" fill="none" stroke="#E3001B" stroke-width="' + sw + '"' + ve + ' stroke-dasharray="' + (preview ? '6 5' : '3 2') + '" d="' + g.folds.map(function (f) { return 'M' + n(f[0]) + ' ' + n(f[1]) + 'L' + n(f[2]) + ' ' + n(f[3]) }).join('') + '"/>';
    return s + '</svg>';
  }

  function pdf(g) {
    var k = 72 / 25.4, PW = (g.w + 2 * M) * k, PH = (g.h + 2 * M) * k,
      P = function (X, Y) { return ((X + M) * k).toFixed(2) + ' ' + (PH - (Y + M) * k).toFixed(2) }, c = '0.7 w 1 j 0 0 0 RG\n';
    g.cuts.forEach(function (p) { p.forEach(function (q, i) { c += P(q[0], q[1]) + (i ? ' l\n' : ' m\n') }); c += 'h S\n' });
    c += '[6 4] 0 d 0.89 0 0.11 RG\n';
    g.folds.forEach(function (f) { c += P(f[0], f[1]) + ' m ' + P(f[2], f[3]) + ' l S\n' });
    var o = ['<</Type/Catalog/Pages 2 0 R>>', '<</Type/Pages/Kids[3 0 R]/Count 1>>',
      '<</Type/Page/Parent 2 0 R/MediaBox[0 0 ' + PW.toFixed(2) + ' ' + PH.toFixed(2) + ']/Contents 4 0 R>>',
      '<</Length ' + c.length + '>>\nstream\n' + c + 'endstream'], s = '%PDF-1.4\n', off = [];
    o.forEach(function (b, i) { off.push(s.length); s += (i + 1) + ' 0 obj\n' + b + '\nendobj\n' });
    var xr = s.length; s += 'xref\n0 5\n0000000000 65535 f \n';
    off.forEach(function (v) { s += ('0000000000' + v).slice(-10) + ' 00000 n \n' });
    return s + 'trailer\n<</Size 5/Root 1 0 R>>\nstartxref\n' + xr + '\n%%EOF\n';
  }

  function dxf(g) {
    var s = '0\nSECTION\n2\nENTITIES\n',
      ln = function (a, b, c, d, l) { s += '0\nLINE\n8\n' + l + '\n10\n' + n(a) + '\n20\n' + n(g.h - b) + '\n11\n' + n(c) + '\n21\n' + n(g.h - d) + '\n' };
    g.cuts.forEach(function (p) { p.forEach(function (q, i) { var r = p[(i + 1) % p.length]; ln(q[0], q[1], r[0], r[1], 'COUPE') }) });
    g.folds.forEach(function (f) { ln(f[0], f[1], f[2], f[3], 'PLI') });
    return s + '0\nENDSEC\n0\nEOF\n';
  }

  var cur, v;
  function read() {
    var o = { type: $('#ty').value };
    ['L', 'W', 'H', 't'].forEach(function (k) { o[k] = +$('#' + k).value });
    return o;
  }
  function update() {
    v = read(); var er = $('#er');
    (LB[v.type] || ['Longueur', 'Largeur', 'Hauteur']).forEach(function (n, i) { $('label[for=' + 'LWH'[i] + ']').textContent = n });
    $('#v3').hidden = !!NO3D[v.type];
    if (!(v.L >= 10 && v.L <= 1000 && v.W >= 10 && v.W <= 1000 && v.H >= 10 && v.H <= 1000 && v.t >= .2 && v.t <= 10)) {
      er.textContent = 'Dimensions entre 10 et 1000 mm, épaisseur entre 0,2 et 10 mm.'; return;
    }
    er.textContent = '';
    cur = T[v.type](v.L, v.W, v.H, v.t);
    $('#pv').innerHTML = svg(cur, 1);
    $('#sz').textContent = 'Format à plat : ' + Math.ceil(cur.w + 2 * M) + ' × ' + Math.ceil(cur.h + 2 * M) + ' mm (marge de ' + M + ' mm comprise)';
    $('#v3').href = 'maquettes.html?p=box&l=' + v.L + '&w=' + v.W + '&h=' + v.H;
  }
  function save(ext, text, type) {
    if (!cur) return;
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: type }));
    a.download = 'jokko-gabarit-' + v.type + '-' + v.L + 'x' + v.W + 'x' + v.H + '.' + ext; a.click();
  }
  document.querySelectorAll('#ty,#L,#W,#H,#t').forEach(function (e) { e.addEventListener('input', update) });
  $('#dsvg').addEventListener('click', function () { save('svg', svg(cur), 'image/svg+xml') });
  $('#dpdf').addEventListener('click', function () { save('pdf', pdf(cur), 'application/pdf') });
  $('#ddxf').addEventListener('click', function () { save('dxf', dxf(cur), 'application/dxf') });
  var q = new URLSearchParams(location.search); if (T[q.get('type')]) $('#ty').value = q.get('type');
  window.JKD = { T: T, svg: svg, pdf: pdf, dxf: dxf };
  update();
})();
