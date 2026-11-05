/* Working-out form for floating point addition/subtraction. */
(function () {
    'use strict';
    var Hex = globalThis.Hex = globalThis.Hex || {};
    if (typeof require === 'function') { require('./numbers.js'); require('./plans.js'); require('./dom.js'); }
    var tcStr = Hex.tcStr, tcVal = Hex.tcVal, inv = Hex.inv, addCols = Hex.addCols, fpAddPlan = Hex.fpAddPlan, fpMove = Hex.fpMove, fpFrame = Hex.fpFrame, judgeFixedRow = Hex.judgeFixedRow, judgeCarryRow = Hex.judgeCarryRow, mk = Hex.mk, normInt = Hex.normInt, textBox = Hex.textBox, numRow = Hex.numRow, txtRow = Hex.txtRow, bitRow = Hex.bitRow, fixedRow = Hex.fixedRow, mkSel = Hex.mkSel;
    var WORKERS = Hex.WORKERS = Hex.WORKERS || {};
    var zeros = function (n) { return new Array(n + 1).join('0'); };

    WORKERS.fpadd = function (q, add) {
        var pl = fpAddPlan(q.meta, q.answer), M = pl.M, E = pl.E, fr;
        var num = function (s) { return s === '' ? null : normInt(s); };   /* empty box -> null, rubbish -> NaN */
        /* step 2 boxes, in order: who, dir (A), places (A), dirB, placesB, exp */
        var move = function (v) { return fpMove(pl, v[0], v[1], num(v[2]), num(v[5]), v[3], num(v[4])); };

        add({
            title: 'Exponents',
            help: 'Write the exponent of each number in denary. They are stored as ' + E + '-bit two’s complement numbers.',
            build: function (b) {
                var f = [];
                b.appendChild(numRow('Exponent of A', pl.eA, f));
                b.appendChild(numRow('Exponent of B', pl.eB, f));
                return f;
            },
            after: step2
        });

        function step2() {
            add({
                title: 'Make the exponents the same',
                help: 'Moving a point <b>left</b> by 1 place adds 1 to that number’s exponent; moving it <b>right</b> by 1 place takes 1 away. ' +
                    'There are three ways to make the exponents the same: move the point of the number with the <b>smaller</b> exponent left; ' +
                    'move the point of the number with the <b>larger</b> exponent right; or move <b>both</b> points until both exponents are 0 ' +
                    '(this writes both numbers as fixed point binary). If the exponents are already equal choose ‘neither’ – the other boxes can be left blank.',
                build: function (b) {
                    var f = [], row = mk('div', 'row wrap mv');
                    var who = mkSel('Which point moves', [['', '–'], ['A', 'A'], ['B', 'B'], ['both', 'both'], ['none', 'neither']]);
                    var dirOpts = [['', '–'], ['left', 'left'], ['right', 'right']];
                    var dir = mkSel('Direction', dirOpts), dirB = mkSel('Direction for B', dirOpts);
                    var places = textBox('nfield'), placesB = textBox('nfield'), ex = textBox('nfield');
                    places.setAttribute('aria-label', 'Places'); placesB.setAttribute('aria-label', 'Places for B'); ex.setAttribute('aria-label', 'New exponent');
                    [places, placesB, ex].forEach(function (x) { x.setAttribute('inputmode', 'numeric'); });
                    var tagA = mk('b', null, 'A:'), tagB = mk('b', null, 'B:'), grpA = mk('span', 'grp'), grpB = mk('span', 'grp');
                    [tagA, dir, mk('span', null, 'by'), places, mk('span', null, 'place(s)')].forEach(function (n) { grpA.appendChild(n); });
                    [tagB, dirB, mk('span', null, 'by'), placesB, mk('span', null, 'place(s)')].forEach(function (n) { grpB.appendChild(n); });
                    row.appendChild(mk('span', null, 'Move the point of number'));
                    row.appendChild(who); row.appendChild(grpA); row.appendChild(grpB);
                    row.appendChild(mk('span', null, ', so both exponents are')); row.appendChild(ex);
                    b.appendChild(row);
                    /* show only the boxes that belong to the chosen method */
                    var update = function () {
                        var w = who.value;
                        tagA.style.display = tagB.style.display = w === 'both' ? '' : 'none';
                        dir.style.display = w === 'none' ? 'none' : '';
                        grpB.style.display = w === 'both' ? '' : 'none';
                    };
                    who.addEventListener('change', function () {
                        update();
                        if (who.value === 'none') {   /* 'neither' means a shift of 0 and the exponent stays as it is */
                            if (!places.value.trim()) places.value = '0';
                            if (!ex.value.trim()) ex.value = String(pl.eA);
                        }
                    });
                    update();
                    f.push({ el: who, ans: pl.d === 0 ? 'none' : (pl.eA < pl.eB ? 'A' : 'B') },
                        { el: dir, ans: pl.d === 0 ? '' : 'left' },
                        { el: places, ans: pl.d === 0 ? '0' : String(pl.d) },
                        { el: dirB, ans: '' },
                        { el: placesB, ans: '' },
                        { el: ex, ans: String(Math.max(pl.eA, pl.eB)) });
                    return f;
                },
                judge: function (v) { var r = move(v); return [r.who, r.dir, r.places, r.dirB, r.placesB, r.exp]; },
                after: function (v) { fr = fpFrame(pl, move(v).Ec); step3(); }
            });
        }

        /* The fewest integer bits (sign included) and fraction bits that hold a value exactly. */
        function minInt(v) { var k = 1; while (!(v >= -Math.pow(2, k - 1) && v < Math.pow(2, k - 1))) k++; return k; }
        function minFrac(v) { var f = 0; while ((v * Math.pow(2, f)) % 1 !== 0) f++; return f; }
        var scaled = function (v, f) { return Math.round(v * Math.pow(2, f)); };

        /* carries of a row addition, laid out on the n-box grid of the fixed-point rows */
        function gridCarries(carries, I, W) {
            var n = fr.L + fr.R, off = fr.L - I, cg = '', k;
            for (k = 0; k < n; k++) cg += (k - off >= 0 && k - off < W) ? carries.charAt(k - off) : '0';
            return cg;
        }

        /* Write the numbers with the common exponent. For a subtraction B is entered here (not −B); −B comes next. */
        function step3() {
            var n = fr.L + fr.R;
            add({
                title: 'Align the points',
                help: 'Move the points so both exponents are <b>' + fr.Ec + '</b> and write A and B as fixed point binary with the point in the same place. ' +
                    'There are <b>' + fr.L + '</b> boxes before the point and <b>' + fr.R + '</b> after it. You don’t need to fill them all, but keep each number’s bits together ' +
                    'with no gaps, starting at the point. The left-most box you use is the sign bit, so a negative number is padded with 1s on the left.',
                build: function (b) {
                    var f = [];
                    b.appendChild(fixedRow('A', fr, fr.a, f, { focusCol: fr.L - fr.I }));
                    b.appendChild(fixedRow('B', fr, fr.b, f));
                    return f;
                },
                judge: function (v) { return judgeFixedRow(v.slice(0, n), fr.L, fr.va).concat(judgeFixedRow(v.slice(n), fr.L, fr.vb)); },
                after: pl.sub ? step4 : step5
            });
        }

        function step4() {
            /* Show B with no more integer bits than it needs (one extra if -B needs it), as the student wrote it in step 3. */
            var n = fr.L + fr.R, fit = function (v, k) { return v >= -Math.pow(2, k - 1) && v < Math.pow(2, k - 1); }, k = 1;
            while (k < fr.I && !(fit(fr.vb, k) && fit(-fr.vb, k))) k++;
            var fb = minFrac(fr.vb), g = { L: fr.L, R: fr.R, I: k, F: fb }, w = k + fb, sb = scaled(fr.vb, fb);
            var bm = tcStr(sb, w), flipped = inv(bm), one = zeros(w - 1) + '1', r = addCols(flipped, one), cg = gridCarries(r.carries, k, w);
            var vflip = tcVal(flipped) / Math.pow(2, fb), neg = tcStr(-sb, w);
            add({
                title: 'Two’s complement of B',
                help: 'To subtract B we add its two’s complement. Flip every bit of B, then add 1 to the last bit: start at the right and write any carries above the next column. ' +
                    'As before you don’t need to fill every box, but the left-most box you use is the sign bit. The ↑ and ↓ keys move between the carry row and the answer row.',
                build: function (b) {
                    var f = [];
                    b.appendChild(fixedRow('B', g, bm));
                    b.appendChild(fixedRow('Flip the bits', g, flipped, f, { focusCol: fr.L - k }));
                    b.appendChild(fixedRow('Carries', g, r.carries.replace(/0/g, ' '), f, { opt: true, rtl: true, cy: true }));
                    b.appendChild(fixedRow('+ 1', g, zeros(w - 1).replace(/0/g, ' ') + '1'));
                    b.appendChild(fixedRow('−B', g, neg, f, { line: true, rtl: true, focusCol: fr.L + fb - 1 }));
                    return f;
                },
                judge: function (v) {
                    var res = v.slice(2 * n);
                    return judgeFixedRow(v.slice(0, n), fr.L, vflip).concat(judgeCarryRow(v.slice(n, 2 * n), cg, res), judgeFixedRow(res, fr.L, fr.vo));
                },
                after: step5
            });
        }

        function step5() {
            /* Only the bits that are needed: the operands' common integer and fraction bits, plus one extra integer bit for the sum. */
            var n = fr.L + fr.R, ko = Math.max(minInt(fr.va), minInt(fr.vo)), ks = ko + 1, fa = Math.max(minFrac(fr.va), minFrac(fr.vo)), w = ks + fa;
            var g = { L: fr.L, R: fr.R, I: ks, F: fa }, sa = scaled(fr.va, fa), so = scaled(fr.vo, fa);
            var r = addCols(tcStr(sa, w), tcStr(so, w)), cg = gridCarries(r.carries, ks, w);
            add({
                title: 'Add',
                help: 'Start at the right (the least significant bit). Type each sum bit, then write any carry above the next column to the left; ' +
                    'leave a carry blank if there is none. The ↑ and ↓ keys jump between the carry row and the sum row. ' +
                    'The sum needs one more bit on the left than the numbers being added, so a positive answer can’t look negative. You don’t need to fill every box.',
                build: function (b) {
                    var f = [];
                    b.appendChild(fixedRow('Carries', g, r.carries.replace(/0/g, ' '), f, { opt: true, rtl: true, cy: true }));
                    b.appendChild(fixedRow('A', g, ' ' + tcStr(sa, ko + fa)));
                    b.appendChild(fixedRow(pl.sub ? '+ (−B)' : '+ B', g, ' ' + tcStr(so, ko + fa)));
                    b.appendChild(fixedRow('Sum', g, tcStr(sa + so, w), f, { line: true, rtl: true, focusCol: fr.L + fa - 1 }));
                    return f;
                },
                judge: function (v) { var sum = v.slice(n); return judgeCarryRow(v.slice(0, n), cg, sum).concat(judgeFixedRow(sum, fr.L, fr.vs)); },
                after: step6
            });
        }

        function step6() {
            var ki = minInt(fr.vs), kf = minFrac(fr.vs), g = { L: fr.L, R: fr.R, I: ki, F: kf };
            add({
                title: 'Normalise',
                help: 'Move the point so the mantissa starts <b>01</b> (positive) or <b>10</b> (negative), keeping exactly ' + M + ' bits. ' +
                    'Each place the point moves <b>left</b> adds 1 to the exponent; each place it moves <b>right</b> takes 1 away. ' +
                    'The exponent so far is <b>' + fr.Ec + '</b>.',
                build: function (b) {
                    var f = [];
                    b.appendChild(fixedRow('Sum', g, tcStr(scaled(fr.vs, kf), ki + kf)));
                    b.appendChild(bitRow('Normalised', pl.nm, 1, f));
                    b.appendChild(numRow('New exponent', tcVal(pl.ne), f, '(denary)'));
                    return f;
                },
                after: step7
            });
        }

        function step7() {
            add({
                title: 'Final mantissa and exponent',
                help: 'Write the mantissa as ' + M + ' bits with no point, and the exponent as a ' + E + '-bit two’s complement number.',
                build: function (b) {
                    var f = [];
                    b.appendChild(txtRow('Mantissa (' + M + ' bits)', pl.nm, f));
                    b.appendChild(txtRow('Exponent (' + E + ' bits)', pl.ne, f));
                    return f;
                },
                finish: 'now type the ' + (M + E) + ' digits (mantissa, then exponent) into the answer box above.'
            });
        }
    };
})();
