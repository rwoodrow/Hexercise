/* DOM helpers and form-field builders for the working-out forms. */
(function () {
    'use strict';
    var Hex = globalThis.Hex = globalThis.Hex || {};

    var el = function (id) { return document.getElementById(id); };
    var esc = function (s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); };

    var mk = function (tag, cls, html) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (html !== undefined) n.innerHTML = html;
        return n;
    };
    var normInt = function (s) { s = String(s).replace(/−/g, '-').trim(); return /^[+-]?\d+$/.test(s) ? Number(s) : NaN; };
    var textBox = function (cls) {
        var c = mk('input', cls);
        c.type = 'text'; c.autocomplete = 'off'; c.spellcheck = false; c.setAttribute('autocapitalize', 'off');
        return c;
    };
    var bitField = function (elm, ans, opt) {
        return { el: elm, ans: ans, opt: !!opt, ok: function (v) { return v === ans || (!!opt && v === '' && ans === '0'); } };
    };
    var numField = function (elm, ans) {
        return { el: elm, ans: String(ans), ok: function (v) { return normInt(v) === Number(ans); } };
    };

    /* A row of single-bit boxes (inputs when `fields` is given, fixed grey bits otherwise), with the point after I boxes.
       o: line (rule above), nopt (blank spacer instead of the point), wide, skipLast (no input in the last box), cy (carry style),
          opt (a blank box counts as 0),
          rtl (the student fills this row right to left: typing moves focus left),
          first (give the first box in entry order the initial focus).
       Every input box carries data-col (its position in the row) so the up/down arrows can find the box above or below. */
    function bitRow(label, bits, I, fields, o) {
        o = o || {};
        var row = mk('div', 'row' + (o.line ? ' line' : '')), i, c;
        if (o.rtl) row.setAttribute('data-rtl', '1');
        row.appendChild(mk('span', 'lbl', label));
        for (i = 0; i < bits.length; i++) {
            if (typeof I === 'number' && i === I) row.appendChild(mk('span', 'pt', o.nopt ? '' : '.'));
            if (!fields || (o.skipLast && i === bits.length - 1)) {
                c = mk('span', 'bit st' + (o.wide ? ' wide' : ''), fields ? '' : bits.charAt(i));
            } else {
                c = textBox('bit' + (o.cy ? ' cy' : '') + (o.wide ? ' wide' : ''));
                c.maxLength = 1;
                c.setAttribute('inputmode', 'numeric');
                c.setAttribute('aria-label', (label || 'Row') + ', box ' + (i + 1));
                c.setAttribute('data-col', i);
                fields.push(bitField(c, bits.charAt(i), o.opt));
            }
            row.appendChild(c);
        }
        if (o.first) {
            var ins = row.querySelectorAll('input.bit');
            if (ins.length) ins[o.rtl ? ins.length - 1 : 0].setAttribute('data-first', '1');
        }
        return row;
    }

    /* A row of boxes either side of a point, as many as the geometry g allows: { L boxes left, R boxes right, I, F = the
       bits of the answer frame }. `bits` is the frame's I+F bit string, placed so its point lines up with the point of
       the row; a space in `bits` means "leave this box empty" (used by carry rows). Boxes outside the frame are empty.
       Without `fields` the row is static (grey). With `fields` every box is an input and the step's judge() marks the row
       as a whole (see plans.js judgeFixedRow / judgeCarryRow), so the student need not fill every box.
       o: line, rtl, cy, opt, focusCol (grid column of the box that gets the initial focus). */
    function fixedRow(label, g, bits, fields, o) {
        o = o || {};
        var n = g.L + g.R, off = g.L - g.I, row = mk('div', 'row fixed' + (n > 18 ? ' tight' : '') + (o.line ? ' line' : '')), i, c, ch;
        if (o.rtl) row.setAttribute('data-rtl', '1');
        row.appendChild(mk('span', 'lbl', label));
        for (i = 0; i < n; i++) {
            if (i === g.L) row.appendChild(mk('span', 'pt', '.'));
            ch = (bits && i - off >= 0 && i - off < bits.length) ? bits.charAt(i - off) : '';
            if (ch === ' ') ch = '';
            if (!fields) {
                c = mk('span', 'bit st', ch);
            } else {
                c = textBox('bit' + (o.cy ? ' cy' : ''));
                c.maxLength = 1;
                c.setAttribute('inputmode', 'numeric');
                c.setAttribute('aria-label', (label || 'Row') + ', box ' + (i + 1));
                c.setAttribute('data-col', i);
                if (o.focusCol === i) c.setAttribute('data-first', '1');
                fields.push({ el: c, ans: ch, opt: !!o.opt, ok: (function (a) { return function (v) { return v === a; }; })(ch) });
            }
            row.appendChild(c);
        }
        return row;
    }

    /* The usual column-addition layout: carries above, the two numbers, a rule, then the answer. Carries and answer are
       entered right to left and the answer row gets the initial focus.
       o: x, y (bit strings added), carries, sum (expected), I (point position or omit), xl / yl / sl (labels). */
    function addBlock(body, fields, o) {
        var I = typeof o.I === 'number' ? o.I : null;
        body.appendChild(bitRow('Carries', o.carries, I, fields, { opt: true, skipLast: true, nopt: true, cy: true, rtl: true }));
        body.appendChild(bitRow(o.xl, o.x, I));
        body.appendChild(bitRow(o.yl, o.y, I));
        body.appendChild(bitRow(o.sl, o.sum, I, fields, { line: true, rtl: true, first: true }));
    }

    function numRow(label, ans, fields, unit) {
        var row = mk('div', 'row'), c = textBox('nfield');
        c.setAttribute('inputmode', 'numeric'); c.setAttribute('aria-label', label);
        row.appendChild(mk('span', 'lbl', label)); row.appendChild(c);
        if (unit) row.appendChild(mk('span', 'unit', unit));
        fields.push(numField(c, ans));
        return row;
    }
    function txtRow(label, ans, fields) {
        var row = mk('div', 'row'), c = textBox('txt');
        c.setAttribute('inputmode', 'numeric'); c.setAttribute('aria-label', label);
        row.appendChild(mk('span', 'lbl', label)); row.appendChild(c);
        fields.push({ el: c, ans: ans, ok: function (v) { return v.replace(/[\s_]/g, '') === ans; } });
        return row;
    }
    function valRow(label, arr, fields) {
        var row = mk('div', 'row');
        row.appendChild(mk('span', 'lbl', label));
        arr.forEach(function (n, i) {
            var c = textBox('bit wide');
            c.setAttribute('inputmode', 'numeric'); c.setAttribute('aria-label', label + ', box ' + (i + 1));
            fields.push(numField(c, n)); row.appendChild(c);
        });
        return row;
    }
    function mkSel(label, opts) {
        var s = mk('select');
        s.setAttribute('aria-label', label);
        opts.forEach(function (o) { var op = mk('option'); op.value = o[0]; op.textContent = o[1]; s.appendChild(op); });
        return s;
    }

    Hex.el = el;
    Hex.esc = esc;
    Hex.mk = mk;
    Hex.normInt = normInt;
    Hex.textBox = textBox;
    Hex.bitField = bitField;
    Hex.numField = numField;
    Hex.bitRow = bitRow;
    Hex.fixedRow = fixedRow;
    Hex.addBlock = addBlock;
    Hex.numRow = numRow;
    Hex.txtRow = txtRow;
    Hex.valRow = valRow;
    Hex.mkSel = mkSel;
})();
