/* Step-by-step form controller. */
(function () {
    'use strict';
    var Hex = globalThis.Hex = globalThis.Hex || {};
    if (typeof require === 'function') { require('./dom.js'); }
    var mk = Hex.mk;

    function stepper(host) {
        var count = 0;
        var cellsOf = function (t) { return Array.prototype.slice.call(t.parentNode.querySelectorAll('input.bit:not(.wide)')); };
        /* The box after (dir = 1) or before (dir = -1) t in the order the student fills the row in:
           left to right normally, right to left for rows marked data-rtl (additions start at the least significant bit). */
        var entryStep = function (t, dir) {
            var cs = cellsOf(t), k = cs.indexOf(t), rtl = t.parentNode.getAttribute('data-rtl') === '1';
            return cs[k + (rtl ? -dir : dir)];
        };
        host.addEventListener('input', function (e) {
            var t = e.target, s = t.closest('.step');
            t.classList.remove('ok', 'bad');
            if (s) { var m = s.querySelector('.smsg'); m.textContent = ''; m.className = 'smsg'; }
            if (t.classList.contains('bit') && !t.classList.contains('wide')) {
                t.value = t.value.replace(/[^01]/g, '').slice(-1);
                if (t.value) { var nx = entryStep(t, 1); if (nx && !nx.readOnly) nx.focus(); }
            }
        });
        host.addEventListener('keydown', function (e) {
            var t = e.target;
            if (t.tagName !== 'INPUT' && t.tagName !== 'SELECT') return;
            if (e.key === 'Enter') { var b = t.closest('.step').querySelector('.chk'); if (b) b.click(); return; }
            if (t.classList.contains('bit') && !t.classList.contains('wide')) {
                var cs = cellsOf(t), k = cs.indexOf(t);
                if (e.key === 'ArrowRight' && cs[k + 1]) { cs[k + 1].focus(); e.preventDefault(); }
                else if (e.key === 'ArrowLeft' && cs[k - 1]) { cs[k - 1].focus(); e.preventDefault(); }
                else if (e.key === 'Backspace' && !t.value) {
                    var pv = entryStep(t, -1);
                    if (pv && !pv.readOnly) { pv.focus(); e.preventDefault(); }
                } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    /* up/down: same column in the previous/next row of boxes (e.g. carries <-> sum) */
                    var rows = Array.prototype.slice.call(t.closest('.sbody').querySelectorAll('.row')).filter(function (r) { return r.querySelector('input.bit[data-col]'); });
                    var to = rows[rows.indexOf(t.parentNode) + (e.key === 'ArrowUp' ? -1 : 1)];
                    var tg = to && to.querySelector('input.bit[data-col="' + t.getAttribute('data-col') + '"]');
                    if (tg && !tg.readOnly) { tg.focus(); e.preventDefault(); }
                }
            }
        });
        return function add(spec) {
            count++;
            var box = mk('div', 'step');
            box.innerHTML = '<div class="shead"><span class="sn">' + count + '</span><b>' + spec.title + '</b></div>' +
                '<div class="help">' + spec.help + '</div><div class="sbody"></div>' +
                '<div class="sfoot"><button type="button" class="chk">Check</button> <button type="button" class="fill">Fill in</button>' +
                '<span class="smsg" aria-live="polite"></span></div>';
            host.appendChild(box);
            var body = box.querySelector('.sbody'), msg = box.querySelector('.smsg');
            var chk_ = box.querySelector('.chk'), fill = box.querySelector('.fill');
            var fields = spec.build(body), done = false;
            chk_.addEventListener('click', function () {
                if (done) return;
                var v = fields.map(function (f) { return f.el.value.trim(); });
                if (fields.every(function (f, i) { return f.opt || v[i] === ''; })) {
                    msg.textContent = 'Fill in the boxes, then press Check.'; msg.className = 'smsg warn'; return;
                }
                /* judge() gives one entry per box: true = right, false = wrong, null = leave uncoloured (an unused box) */
                var res = spec.judge ? spec.judge(v) : fields.map(function (f, i) { return f.ok(v[i]); });
                var bad = 0;
                fields.forEach(function (f, i) {
                    var r = res[i] === undefined ? false : res[i];
                    f.el.classList.toggle('ok', r === true);
                    f.el.classList.toggle('bad', r === false);
                    if (r === false) bad++;
                });
                if (bad) {
                    msg.textContent = '✗ ' + bad + (bad === 1 ? ' box needs' : ' boxes need') + ' another look';
                    msg.className = 'smsg warn'; return;
                }
                done = true; box.classList.add('done');
                fields.forEach(function (f) { if (f.el.tagName === 'SELECT') f.el.disabled = true; else f.el.readOnly = true; });
                msg.className = 'smsg good';
                msg.textContent = '✓ Correct' + (spec.finish ? ' – ' + spec.finish : '');
                if (spec.after) {
                    spec.after(v);
                    var nxt = box.nextElementSibling;
                    if (nxt) {
                        /* the next step starts with the box marked data-first (e.g. the least significant bit of a sum) */
                        var first = nxt.querySelector('[data-first]') || nxt.querySelector('input, select');
                        if (first) first.focus({ preventScroll: true });
                        try { nxt.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (err) { /* not essential */ }
                    }
                }
            });
            fill.addEventListener('click', function () {
                if (done) return;
                fields.forEach(function (f) {
                    f.el.value = f.ans;
                    if (f.el.tagName === 'SELECT') f.el.dispatchEvent(new Event('change', { bubbles: true }));
                });
                chk_.click();
            });
            return box;
        };
    }

    Hex.stepper = stepper;
})();
