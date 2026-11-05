/* Page wiring: type table, question rendering, working-out toggle, URL hash, init. */
(function () {
    'use strict';
    var Hex = globalThis.Hex = globalThis.Hex || {};
    if (typeof require === 'function') { require('./types.js'); require('./dom.js'); require('./stepper.js'); require('./workers-fp.js'); require('./workers-binary.js'); }
    var el = Hex.el, esc = Hex.esc, mk = Hex.mk, ri = Hex.ri, stepper = Hex.stepper, generateSet = Hex.generateSet, TYPES = Hex.TYPES;
    var WORKERS = Hex.WORKERS = Hex.WORKERS || {};
    if (typeof document === 'undefined') return;

    function buildTable() {
        var body = el('typeRows');
        TYPES.forEach(function (t) {
            var tr = document.createElement('tr');
            tr.innerHTML = '<td class="name"><label for="t_' + t.id + '">' + esc(t.name) + '</label></td>' +
                '<td class="c"><input type="checkbox" id="t_' + t.id + '"></td>' +
                ['GCSE', 'H446', 'AS', 'A2'].map(function (l) { return '<td class="c star">' + (t.lv.indexOf(l) >= 0 ? '*' : '') + '</td>'; }).join('');
            body.appendChild(tr);
        });
        Array.prototype.forEach.call(document.querySelectorAll('[data-level]'), function (btn) {
            btn.addEventListener('click', function () {
                var lv = btn.getAttribute('data-level');
                TYPES.forEach(function (t) { el('t_' + t.id).checked = lv !== 'none' && t.lv.indexOf(lv) >= 0; });
            });
        });
    }

    function selectedIds() { return TYPES.filter(function (t) { return el('t_' + t.id).checked; }).map(function (t) { return t.id; }); }
    function showMsg(text) { var m = el('msg'); m.textContent = text || ''; m.style.display = text ? 'block' : 'none'; }

    function render(qs, code) {
        var box = el('questions');
        box.innerHTML = '';
        box.className = (el('written').checked ? 'written ' : '') + (el('answers').checked ? 'showans' : '');
        el('printInfo').textContent = 'Binary & Hexadecimal Questions \u2013 question code ' + code + ' (' + qs.length + ' questions)';
        qs.forEach(function (q, i) {
            var hasWork = !!(q.meta && WORKERS[q.meta.kind]);
            var d = document.createElement('div');
            d.className = 'q' + (hasWork ? ' haswork' : '');
            d.innerHTML = '<div class="num"' + (hasWork ? ' role="button" tabindex="0" aria-expanded="false" title="Open step-by-step working"' : '') + '>' + (i + 1) + '</div>' +
                '<div class="text">' + q.html + (hasWork ? '<div class="hint">Click the number for step-by-step working</div>' : '') + '</div>' +
                '<div class="ans">' + (q.prefix ? '<span class="pre">' + q.prefix + '</span>' : '') +
                '<input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Answer to question ' + (i + 1) + '">' +
                '<button type="button">Check</button><span class="mark" aria-live="polite"></span></div>' +
                '<div class="solution">Answer: ' + q.prefix + q.answer + '</div>' +
                (hasWork ? '<div class="work"></div>' : '');
            var input = d.querySelector('input'), btn = d.querySelector('button'), mark = d.querySelector('.mark');
            var reset = function () { input.classList.remove('ok', 'bad'); mark.textContent = ''; };
            btn.addEventListener('click', function () {
                if (!input.value.trim()) return;
                var ok = q.check(input.value);
                input.classList.toggle('ok', ok);
                input.classList.toggle('bad', !ok);
                mark.textContent = ok ? '\u2713 Correct' : '\u2717 Try again';
            });
            input.addEventListener('input', reset);
            input.addEventListener('keydown', function (e) { if (e.key === 'Enter') btn.click(); });
            wireWork(d, q);
            box.appendChild(d);
        });
    }

    function buildWork(q, root, d) {
        root.innerHTML = '';
        var head = mk('div', 'whead', '<b>Working out</b><span><button type="button" class="lnk again">Start again</button>' +
            '<button type="button" class="lnk hide">Hide</button></span>');
        var steps = mk('div', 'steps');
        root.appendChild(head); root.appendChild(steps);
        WORKERS[q.meta.kind](q, stepper(steps));
        head.querySelector('.again').addEventListener('click', function () { buildWork(q, root, d); });
        head.querySelector('.hide').addEventListener('click', function () {
            d.classList.remove('open');
            d.querySelector('.num').setAttribute('aria-expanded', 'false');
        });
    }

    /* Only clicking the question number opens the working-out form, so students can type in the answer box without it popping up. */
    function wireWork(d, q) {
        if (!(q.meta && WORKERS[q.meta.kind])) return;
        var area = el('questions'), numEl = d.querySelector('.num'), root = d.querySelector('.work'), built = false;
        var setOpen = function (open) {
            if (open && area.classList.contains('written')) return;
            d.classList.toggle('open', open);
            numEl.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (open && !built) { built = true; buildWork(q, root, d); }
            if (open) { var f0 = root.querySelector('.step:not(.done) [data-first]'); if (f0) f0.focus({ preventScroll: true }); }   /* e.g. start an addition at its least significant bit */
        };
        var toggle = function () { setOpen(!d.classList.contains('open')); };
        numEl.addEventListener('click', toggle);
        numEl.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    }

    function writeHash(code, n, ids, written) {
        try {
            var p = 'c=' + encodeURIComponent(code) + '&n=' + n + '&t=' + ids.join(',') + (written ? '&w=1' : '');
            history.replaceState(null, '', '#' + p);
        } catch (e) { /* ignore: not essential */ }
    }

    function refresh() {
        var ids = selectedIds();
        if (!ids.length) { showMsg('Tick at least one question type (or press GCSE, AS, A2 or H446) and then press Refresh.'); el('questions').innerHTML = ''; return; }
        showMsg('');
        var code = el('code').value.trim();
        if (!code) { code = String(ri(Math.random, 100000, 999999)); el('code').value = code; }
        var n = Math.max(1, Math.min(50, parseInt(el('count').value, 10) || 10));
        el('count').value = n;
        render(generateSet(code, n, ids), code);
        writeHash(code, n, ids, el('written').checked);
    }

    function loadFromHash() {
        var h = (location.hash || '').replace(/^#/, '');
        if (!h) return false;
        var p;
        try { p = new URLSearchParams(h); } catch (e) { return false; }
        var t = (p.get('t') || '').split(',');
        TYPES.forEach(function (ty) { el('t_' + ty.id).checked = t.indexOf(ty.id) >= 0; });
        if (p.get('c')) el('code').value = p.get('c');
        if (p.get('n')) el('count').value = p.get('n');
        el('written').checked = p.get('w') === '1';
        return t.some(function (x) { return x; });
    }

    function init() {
        buildTable();
        el('refresh').addEventListener('click', refresh);
        el('rand').addEventListener('click', function () { el('code').value = String(ri(Math.random, 100000, 999999)); });
        ['code', 'count'].forEach(function (id) { el(id).addEventListener('keydown', function (e) { if (e.key === 'Enter') refresh(); }); });
        el('written').addEventListener('change', function () { el('questions').classList.toggle('written', el('written').checked); });
        el('answers').addEventListener('change', function () { el('questions').classList.toggle('showans', el('answers').checked); });
        if (loadFromHash()) refresh();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
