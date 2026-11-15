/* Jokko – générateur de maquettes et labo 3D. Tout est calculé dans le navigateur : aucun fichier n'est envoyé. */
(function () {
  var $ = function (s) { return document.querySelector(s) }, $$ = function (s) { return document.querySelectorAll(s) };
  var cv = $('#cv'), x = cv.getContext('2d'), W = cv.width, H = cv.height, PI = Math.PI;
  var q = new URLSearchParams(location.search);
  var S = {
    p: q.get('p') || 'box', L: +q.get('l') || 120, Wd: +q.get('w') || 60, Hh: +q.get('h') || 160,
    yaw: -0.6, pit: 0.35, col: '#ffffff', bg: '#E8F0F3', bgm: 'deg', size: 100, fit: 'cover',
    light: -0.7, sh: 0.35, zoom: 1, img: null, bgi: null, face: 'front'
  };
  var init = 1;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)) }

  function background() {
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H);
    var m = S.bgm, g;
    if (m == 'none') return;
    x.fillStyle = S.bg; x.fillRect(0, 0, W, H);
    if (m == 'deg') {
      g = x.createRadialGradient(W / 2, H * .45, 0, W / 2, H * .45, W * .7);
      g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
    } else if (m == 'studio') {
      g = x.createLinearGradient(0, H * .66, 0, H);
      g.addColorStop(0, 'rgba(0,0,0,.16)'); g.addColorStop(1, 'rgba(0,0,0,.04)');
      x.fillStyle = g; x.fillRect(0, H * .66, W, H * .34);
      g = x.createLinearGradient(0, 0, 0, H * .66);
      g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, W, H * .66);
    } else if (m == 'img' && S.bgi) {
      var i = S.bgi, r = Math.max(W / i.width, H / i.height);
      x.drawImage(i, (W - i.width * r) / 2, (H - i.height * r) / 2, i.width * r, i.height * r);
    }
  }

  function shadow(cx, cy, rx, ry) {
    if (S.sh <= 0 || (S.bgm == 'none' && !S.shT)) return;
    x.save(); x.translate(cx, cy); x.scale(1, ry / rx);
    var g = x.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, 'rgba(0,0,0,' + S.sh + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, rx, 0, 2 * PI); x.fill(); x.restore();
  }

  // Dessine le visuel dans le rectangle local (0,0,w,h) du repère courant.
  function art(w, h) {
    var i = S.img, k = S.size / 100, bw = w * k, bh = h * k, bx = (w - bw) / 2, by = (h - bh) / 2;
    if (!i) {
      var u = Math.min(bw, bh);
      x.save(); x.strokeStyle = 'rgba(9,50,68,.45)'; x.lineWidth = u / 60; x.setLineDash([u / 14, u / 20]);
      x.strokeRect(bx + u * .06, by + u * .06, bw - u * .12, bh - u * .12);
      x.fillStyle = 'rgba(9,50,68,.6)'; x.font = '600 ' + u / 9 + 'px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText('Votre visuel', w / 2, h / 2); x.restore(); return;
    }
    var r = S.fit == 'cover' ? Math.max(bw / i.width, bh / i.height) : Math.min(bw / i.width, bh / i.height),
      dw = i.width * r, dh = i.height * r;
    x.save(); x.beginPath(); x.rect(bx, by, bw, bh); x.clip();
    x.drawImage(i, bx + (bw - dw) / 2, by + (bh - dh) / 2, dw, dh); x.restore();
  }

  function box() {
    var L = S.L, D = S.Wd, Hh = S.Hh, s = Math.min(W, H) * .7 / Math.hypot(L, D, Hh) * S.zoom,
      cy = Math.cos(S.yaw), sy = Math.sin(S.yaw), cp = Math.cos(S.pit), sp = Math.sin(S.pit), cx = W / 2, cz = H / 2;
    function R(v) { var X = v[0] * cy + v[2] * sy, z = -v[0] * sy + v[2] * cy; return [X, v[1] * cp - z * sp, v[1] * sp + z * cp] }
    var a = L / 2, b = Hh / 2, c = D / 2, la = S.light, lv = [Math.sin(la) * .8, .45, Math.cos(la) * .8], ln = Math.hypot(lv[0], lv[1], lv[2]);
    var F = [ // origine, U (droite), V (bas), normale, largeur, hauteur, porte le visuel
      [[-a, b, c], [L, 0, 0], [0, -Hh, 0], [0, 0, 1], L, Hh, 1],
      [[a, b, -c], [-L, 0, 0], [0, -Hh, 0], [0, 0, -1], L, Hh, 0],
      [[a, b, c], [0, 0, -D], [0, -Hh, 0], [1, 0, 0], D, Hh, 0],
      [[-a, b, -c], [0, 0, D], [0, -Hh, 0], [-1, 0, 0], D, Hh, 0],
      [[-a, b, -c], [L, 0, 0], [0, 0, D], [0, 1, 0], L, D, 0],
      [[-a, -b, c], [L, 0, 0], [0, 0, -D], [0, -1, 0], L, D, 0]
    ];
    var g = R([0, -b, 0]);
    shadow(cx, cz - s * g[1] + 6, s * Math.hypot(L, D) * .62, Math.max(10, s * Math.hypot(L, D) * .62 * Math.abs(sp) * .9 + 8));
    F.forEach(function (f) {
      var n = R(f[3]); if (n[2] <= .001) return;
      var O = R(f[0]), U = R(f[1]), V = R(f[2]), w = f[4], h = f[5];
      x.setTransform(s * U[0] / w, -s * U[1] / w, s * V[0] / h, -s * V[1] / h, cx + s * O[0], cz - s * O[1]);
      x.fillStyle = S.col; x.fillRect(0, 0, w, h);
      if (F.indexOf(f) == (S.face == 'top' ? 4 : 0)) art(w, h);
      var lit = Math.max(0, (f[3][0] * lv[0] + f[3][1] * lv[1] + f[3][2] * lv[2]) / ln);
      x.fillStyle = 'rgba(0,0,0,' + ((1 - lit) * .42).toFixed(3) + ')'; x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = 1 / s; x.strokeRect(0, 0, w, h);
    });
    x.setTransform(1, 0, 0, 1, 0, 0);
  }

  // Habillage cylindrique, colonne par colonne. top(am) donne le haut de la colonne à l'angle am.
  function wrap(cx, Rp, top, hh, base) {
    var i = S.img, m = (1 - S.size / 100) / 2, X, am, yt, x1 = Math.floor(cx + Rp);
    for (X = Math.ceil(cx - Rp); X < x1; X++) {
      am = Math.asin(clamp((X + .5 - cx) / Rp, -1, 1)); yt = top(am);
      x.fillStyle = base; x.fillRect(X, yt, 1, hh);
      if (i) {
        var u = (((am + S.yaw) / (2 * PI)) % 1 + 1) % 1, sw = Math.max(1, i.width / (2 * PI * Rp)), sx = Math.min(i.width - sw, u * i.width);
        x.drawImage(i, sx, 0, sw, i.height, X, yt + hh * m, 1, hh * (1 - 2 * m));
      }
      var lit = Math.max(0, Math.cos(am - S.light * .9));
      x.fillStyle = 'rgba(0,0,0,' + ((1 - lit) * .5 - (Math.abs(am - S.light * .9) < .12 ? .08 : 0)).toFixed(3) + ')'; x.fillRect(X, yt, 1, hh);
    }
  }

  function cyl(Rr, Hh, mug) {
    var pit = clamp(S.pit, 0, 1.1), s = Math.min(W, H) * (mug ? .5 : .68) / Hh * S.zoom,
      cp = Math.cos(pit), sp = Math.sin(pit), cx = W / 2, cz = H / 2, hh = s * Hh * cp;
    shadow(cx, cz + s * Hh / 2 * cp + 4, s * Rr * 1.5, Math.max(10, s * Rr * 1.5 * sp + 8));
    if (mug) { // anse, dessinée avant le corps
      x.beginPath(); x.ellipse(cx + s * Rr * .98, cz + s * Rr * sp * .4, s * Rr * .52, hh * .3, 0, 0, 2 * PI);
      x.lineWidth = s * 11; x.strokeStyle = S.col; x.stroke(); x.strokeStyle = 'rgba(0,0,0,.3)'; x.stroke();
    }
    wrap(cx, s * Rr, function (am) { return cz - s * (Hh / 2 * cp - Rr * Math.cos(am) * sp) }, hh, S.col);
    if (sp > .01) {
      var ty = cz - s * Hh / 2 * cp;
      x.fillStyle = mug ? S.col : '#C3CCD1'; x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 1.5;
      x.beginPath(); x.ellipse(cx, ty, s * Rr, s * Rr * sp, 0, 0, 2 * PI); x.fill(); x.stroke();
      x.fillStyle = mug ? 'rgba(0,0,0,.38)' : '#AEB8BE'; x.beginPath(); x.ellipse(cx, ty, s * Rr * (mug ? .9 : .86), s * Rr * sp * (mug ? .9 : .86), 0, 0, 2 * PI); x.fill();
    }
  }
  function can() { cyl(33, 122) }
  function mug() { cyl(41, 96, 1) }

  function flat(fn) {
    var k = Math.min(W, H) * .86 / 400 * S.zoom;
    shadow(W / 2, H / 2 + 190 * k, 170 * k, 22 * k);
    x.setTransform(k, 0, 0, k, W / 2 - 200 * k, H / 2 - 200 * k); fn(k, W / 2 - 200 * k, H / 2 - 200 * k); x.setTransform(1, 0, 0, 1, 0, 0);
  }
  function tee() {
    flat(function () {
      var P = new Path2D('M132 40L52 78L18 160L82 186L102 150V372H298V150L318 186L382 160L348 78L268 40Q200 96 132 40Z');
      x.fillStyle = S.col; x.fill(P);
      x.save(); x.clip(P);
      var g = x.createLinearGradient(0, 0, 400, 0);
      g.addColorStop(0, 'rgba(0,0,0,.16)'); g.addColorStop(.3, 'rgba(0,0,0,0)'); g.addColorStop(.7, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.16)');
      x.fillStyle = g; x.fillRect(0, 0, 400, 400);
      x.translate(130, 112); art(140, 190); x.restore();
      x.strokeStyle = 'rgba(0,0,0,.28)'; x.lineWidth = 2; x.lineJoin = 'round'; x.stroke(P);
    });
  }
  function bag() {
    flat(function () {
      x.strokeStyle = 'rgba(9,50,68,.8)'; x.lineWidth = 5; x.lineCap = 'round';
      x.beginPath(); x.moveTo(150, 112); x.bezierCurveTo(150, 20, 250, 20, 250, 112); x.stroke();
      x.fillStyle = S.col; x.fillRect(70, 110, 260, 270);
      x.save(); x.translate(110, 160); art(180, 190); x.restore();
      var g = x.createLinearGradient(70, 0, 330, 0);
      g.addColorStop(0, 'rgba(0,0,0,.14)'); g.addColorStop(.12, 'rgba(0,0,0,0)'); g.addColorStop(.88, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.18)');
      x.fillStyle = g; x.fillRect(70, 110, 260, 270);
      x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 2; x.strokeRect(70, 110, 260, 270);
      x.lineWidth = 1; x.beginPath(); x.moveTo(70, 136); x.lineTo(330, 136); x.stroke();
    });
  }

  function sides(P, a) { // ombrage latéral dans la silhouette P
    x.save(); x.clip(P);
    var g = x.createLinearGradient(P.x0, 0, P.x1, 0);
    g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(.3, 'rgba(255,255,255,.12)'); g.addColorStop(.55, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,' + (a + .1) + ')');
    x.fillStyle = g; x.fillRect(0, 0, 400, 400); x.restore();
  }
  // Flacons : silhouette + bouchon + étiquette cylindrique. d = [chemin, x0, x1, bouchon [x,y,w,h], couleur bouchon, rayon, haut, hauteur, étiquette blanche ?]
  var FL = {
    bottle: ['M186 48V92C186 122 140 124 140 160V358Q140 372 154 372H246Q260 372 260 358V160C260 124 214 122 214 92V48Z', 140, 260, [181, 18, 38, 32], '#1D2B33', 60, 196, 140, 1],
    gourde: ['M176 62V84C176 100 152 104 152 130V356Q152 372 168 372H232Q248 372 248 356V130C248 104 224 100 224 84V62Z', 152, 248, [170, 24, 60, 40], '#1D2B33', 48, 160, 170, 0],
    pill: ['M150 98Q150 82 166 82H234Q250 82 250 98V356Q250 372 234 372H166Q150 372 150 356Z', 150, 250, [156, 36, 88, 48], '#E3E8EA', 50, 140, 180, 0],
    jar: ['M132 122Q132 106 148 106H252Q268 106 268 122V352Q268 372 248 372H152Q132 372 132 352Z', 132, 268, [128, 64, 144, 44], '#1D2B33', 68, 176, 130, 1]
  };
  function flacon() {
    var d = FL[S.p];
    flat(function (k, ox, oy) {
      var P = new Path2D(d[0]), c = d[3]; P.x0 = d[1]; P.x1 = d[2];
      x.fillStyle = S.col; x.fill(P); sides(P, d[8] ? .4 : .28);
      x.strokeStyle = 'rgba(0,0,0,.3)'; x.lineWidth = 1.5; x.stroke(P);
      x.fillStyle = d[4]; x.beginPath(); x.rect(c[0], c[1], c[2], c[3]); x.fill(); x.strokeStyle = 'rgba(0,0,0,.25)'; x.stroke();
      x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(c[0] + c[2] * .2, c[1], c[2] * .14, c[3]);
      x.setTransform(1, 0, 0, 1, 0, 0);
      var t = oy + d[6] * k; wrap(ox + 200 * k, d[5] * k, function () { return t }, d[7] * k, d[8] ? '#FFFFFF' : S.col);
      if (!S.img) { x.fillStyle = 'rgba(9,50,68,.6)'; x.font = '600 ' + 13 * k + 'px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('Votre visuel', ox + 200 * k, t + d[7] * k / 2) }
    });
  }
  function cup() {
    flat(function () {
      var P = new Path2D('M118 100H282L262 372H138Z'); P.x0 = 118; P.x1 = 282;
      x.fillStyle = S.col; x.fill(P);
      x.save(); x.clip(P); x.translate(140, 150); art(120, 170); x.restore();
      sides(P, .22);
      x.strokeStyle = 'rgba(0,0,0,.28)'; x.lineWidth = 1.5; x.lineJoin = 'round'; x.stroke(P);
      x.fillStyle = '#F4F6F7'; x.beginPath(); x.rect(108, 76, 184, 26); x.rect(128, 60, 144, 16); x.fill(); x.stroke();
    });
  }
  function hoodie() {
    flat(function () {
      var P = new Path2D('M150 54L62 96L22 252L78 270L104 172V372H296V172L322 270L378 252L338 96L250 54Q200 104 150 54Z'), Hd = new Path2D('M150 54Q200 -14 250 54Q200 104 150 54Z');
      P.x0 = 22; P.x1 = 378;
      x.fillStyle = S.col; x.fill(Hd); x.fillStyle = 'rgba(0,0,0,.22)'; x.fill(Hd);
      x.fillStyle = S.col; x.fill(P);
      x.save(); x.clip(P); x.translate(140, 150); art(120, 120); x.restore();
      sides(P, .14);
      x.strokeStyle = 'rgba(0,0,0,.28)'; x.lineWidth = 2; x.lineJoin = 'round'; x.stroke(P); x.stroke(Hd);
      x.lineWidth = 1.5; x.beginPath(); x.moveTo(140, 372); x.lineTo(152, 296); x.lineTo(248, 296); x.lineTo(260, 372);
      x.moveTo(186, 84); x.lineTo(184, 140); x.moveTo(214, 84); x.lineTo(216, 140); x.stroke();
    });
  }
  function tube() {
    flat(function () {
      var P = new Path2D('M152 330L136 44H264L248 330Q248 338 240 338H160Q152 338 152 330Z'), y; P.x0 = 136; P.x1 = 264;
      x.fillStyle = '#1D2B33'; x.beginPath(); x.rect(170, 334, 60, 40); x.fill();
      x.fillStyle = 'rgba(255,255,255,.16)'; x.fillRect(180, 334, 8, 40);
      x.fillStyle = S.col; x.fill(P);
      x.save(); x.clip(P); x.translate(150, 84); art(100, 220); x.restore();
      sides(P, .22);
      x.strokeStyle = 'rgba(0,0,0,.28)'; x.lineWidth = 1.5; x.lineJoin = 'round'; x.stroke(P);
      x.lineWidth = 1; x.strokeStyle = 'rgba(0,0,0,.22)'; x.beginPath();
      for (y = 48; y < 64; y += 4) { x.moveTo(137, y); x.lineTo(263, y) } x.stroke();
    });
  }
  function pouch() {
    flat(function () {
      var P = new Path2D('M96 40H304L312 70C300 150 300 250 322 352Q324 372 304 372H96Q76 372 78 352C100 250 100 150 88 70Z'); P.x0 = 78; P.x1 = 322;
      x.fillStyle = S.col; x.fill(P);
      x.save(); x.clip(P); x.translate(112, 96); art(176, 214); x.restore();
      sides(P, .16);
      x.strokeStyle = 'rgba(0,0,0,.28)'; x.lineWidth = 1.5; x.lineJoin = 'round'; x.stroke(P);
      x.lineWidth = 1; x.strokeStyle = 'rgba(0,0,0,.2)'; x.beginPath();
      x.moveTo(89, 70); x.lineTo(311, 70); x.moveTo(84, 338); x.quadraticCurveTo(200, 306, 316, 338); x.stroke();
    });
  }

  // Modèles dérivés de la boîte : dimensions, face imprimée, couleur, inclinaison.
  var PR = {
    box: { L: 120, Wd: 60, Hh: 160 }, book: { L: 130, Wd: 22, Hh: 190 }, magazine: { L: 210, Wd: 5, Hh: 280 }, phone: { L: 75, Wd: 9, Hh: 155, col: '#16222A' },
    pizza: { L: 300, Wd: 300, Hh: 40, face: 'top', pit: .75 }, mailer: { L: 250, Wd: 180, Hh: 90, face: 'top', col: '#C19A6B', pit: .6 }
  };
  var DR = { can: can, tee: tee, bag: bag, bottle: flacon, gourde: flacon, pill: flacon, jar: flacon, tube: tube, mug: mug, pouch: pouch, cup: cup, hoodie: hoodie };
  var COL = { bottle: '#5B3A1E', jar: '#DCE6EA' }, WRAP = /^(box|book|magazine|phone|pizza|mailer|can|mug|bottle|gourde|pill|jar)$/;
  if (!PR[S.p] && !DR[S.p]) S.p = 'box';
  var queued = 0;
  function draw() {
    if (queued) return; queued = 1;
    requestAnimationFrame(function () { queued = 0; background(); (DR[S.p] || box)() });
  }

  function sync() {
    $$('[data-k]').forEach(function (e) { if (S[e.dataset.k] != null) e.value = S[e.dataset.k] });
    $$('[data-p]').forEach(function (b) { var on = b.dataset.p == S.p; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on) });
    var d = $('#dims'); if (d) d.hidden = !PR[S.p];
    var c = $('#bgc'); if (c) c.hidden = S.bgm == 'none' || S.bgm == 'img';
    var f = $('#bgf'); if (f) f.closest('div').hidden = S.bgm != 'img';
    cv.classList.toggle('tr', S.bgm == 'none');
  }

  $$('[data-k]').forEach(function (e) {
    e.addEventListener('input', function () {
      var v = e.value; if (e.type == 'range' || e.type == 'number') { v = +v; if (!(v > 0) && e.type == 'number') return }
      S[e.dataset.k] = v; sync(); draw();
    });
  });
  $$('[data-p]').forEach(function (b) {
    b.addEventListener('click', function () { S.p = b.dataset.p; preset(); sync(); draw() });
  });
  function load(input, key) {
    if (!input) return;
    input.addEventListener('change', function () {
      var f = input.files[0]; if (!f) return;
      var i = new Image(); i.onload = function () { S[key] = i; if (key == 'bgi') S.bgm = 'img'; sync(); draw() };
      i.onerror = function () { alert('Ce fichier image ne peut pas être lu.') };
      i.src = URL.createObjectURL(f);
    });
  }
  load($('#art'), 'img'); load($('#bgf'), 'bgi');

  var drag = null;
  cv.addEventListener('pointerdown', function (e) { drag = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId) });
  cv.addEventListener('pointermove', function (e) {
    if (!drag) return;
    S.yaw = ((S.yaw + (e.clientX - drag[0]) * .01 + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI;
    S.pit = clamp(S.pit + (e.clientY - drag[1]) * .01, -.2, 1.2);
    drag = [e.clientX, e.clientY]; sync(); draw();
  });
  cv.addEventListener('pointerup', function () { drag = null }); cv.addEventListener('pointercancel', function () { drag = null });

  if ($('#dl')) $('#dl').addEventListener('click', function () {
    cv.toBlob(function (b) { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'jokko-maquette.png'; a.click() });
  });

  function preset() {
    var w = WRAP.test(S.p), b = PR[S.p], k; S.fit = w ? 'cover' : 'contain'; S.size = w ? 100 : 80; S.col = COL[S.p] || '#ffffff'; S.face = 'front';
    if (b) { if (!(init && S.p == 'box')) for (k in b) S[k] = b[k]; if (!b.pit) S.pit = .35 }
    init = 0;
  }
  window.JK = { S: S, draw: draw, preset: preset };
  preset(); sync(); draw();
})();
