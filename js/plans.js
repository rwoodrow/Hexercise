/* Working-out plans (pure maths, no DOM). */
(function () {
    'use strict';
    var Hex = globalThis.Hex = globalThis.Hex || {};
    if (typeof require === 'function') { require('./numbers.js'); }
    var P = Hex.P, tcStr = Hex.tcStr, tcVal = Hex.tcVal;

    /* Column addition of two equal-length bit strings. carries[j] is the carry INTO column j (0 = left-most). */
    function addCols(x, y) {
        var c = 0, carries = [], sum = [];
        for (var j = x.length - 1; j >= 0; j--) {
            carries[j] = c;
            var t = +x.charAt(j) + +y.charAt(j) + c;
            sum[j] = t & 1; c = t >> 1;
        }
        return { carries: carries.join(''), sum: sum.join(''), carryOut: c };
    }

    /* Floating point add/subtract. A and B are mantissa/exponent bit strings; nm/ne are the normalised answer. */
    function fpAddPlan(meta, answer) {
        var M = meta.M, E = meta.E, eA = tcVal(meta.A[1]), eB = tcVal(meta.B[1]);
        return {
            M: M, E: E, sub: meta.op === '-',
            mA: tcVal(meta.A[0]), eA: eA, mB: tcVal(meta.B[0]), eB: eB, d: Math.abs(eA - eB),
            bPad: meta.B[0].charAt(0) + meta.B[0],   /* B with its sign bit written twice: 2 bits before the point */
            nm: answer.slice(0, M), ne: answer.slice(M)
        };
    }

    /* Marks each part of a "make the exponents the same" answer. Three valid ways:
         'A' or 'B'  one point moves. The number with the SMALLER exponent moves its point LEFT (its exponent rises to the
                     larger one), or the number with the LARGER exponent moves its point RIGHT (its exponent falls to the
                     smaller one). Needs the exponents to differ.
         'both'      both points move until both exponents are 0 (fixed point binary). A uses dir/places, B uses dirB/placesB.
         'none'      the exponents are already equal; places and exponent may be left blank.
       places / newExp / placesB are numbers, null for an empty box, NaN for rubbish. Returns one flag per box plus Ec, the
       common exponent (only meaningful when every flag is true). */
    function fpMove(pl, who, dir, places, newExp, dirB, placesB) {
        var ok = { who: false, dir: false, places: false, dirB: true, placesB: true, exp: false, Ec: null };
        var eA = pl.eA, eB = pl.eB, mx = Math.max(eA, eB), mn = Math.min(eA, eB);
        var blank = function (x) { return x === null; };
        var dirTo = function (shift) { return shift > 0 ? 'left' : shift < 0 ? 'right' : ''; };   /* shift = change to the exponent */
        var placesOk = function (e, n) { return e === 0 ? (blank(n) || n === 0) : n === Math.abs(e); };
        if (who === 'none') {
            if (pl.d !== 0) return ok;
            ok.who = true; ok.dir = true;
            ok.places = blank(places) || places === 0;
            ok.exp = blank(newExp) || newExp === eA;
            ok.Ec = eA;
            return ok;
        }
        if (who === 'both') {
            ok.who = true;
            ok.dir = dir === dirTo(-eA); ok.places = placesOk(eA, places);
            ok.dirB = dirB === dirTo(-eB); ok.placesB = placesOk(eB, placesB);
            ok.exp = newExp === 0;
            ok.Ec = 0;
            return ok;
        }
        if ((who !== 'A' && who !== 'B') || pl.d === 0) return ok;
        var mine = who === 'A' ? eA : eB, other = who === 'A' ? eB : eA, smaller = mine < other, c = smaller ? mx : mn;
        ok.who = true;
        ok.dir = dir === (smaller ? 'left' : 'right');
        ok.places = places === pl.d;
        ok.exp = newExp === c;
        ok.Ec = c;
        return ok;
    }

    /* Fixed-point frame both numbers are written in once both exponents equal Ec.
       I = bits before the point (enough that the sum can never overflow, at least 2: sign + one spare),
       F = bits after the point (enough to keep every bit of both numbers),
       L / R = boxes offered either side of the point: at least M-1 each (a 6 bit mantissa gets 5 and 5),
       more if the frame needs them. va / vo / vs are the values of A, the second operand (-B when subtracting) and the sum. */
    function fpFrame(pl, Ec) {
        var M = pl.M, lo = Math.min(pl.eA, pl.eB);
        var F = Math.max(0, (M - 1) - (lo - Ec));
        var I = Math.max(2, 1 + Math.ceil(Math.log2(P(pl.eA - Ec) + P(pl.eB - Ec))));
        var W = I + F, at = function (m, e) { return m * P(F - (M - 1) + (e - Ec)); };
        var sa = at(pl.mA, pl.eA), sb = at(pl.mB, pl.eB), s2 = pl.sub ? -sb : sb;
        return {
            I: I, F: F, W: W, Ec: Ec, L: Math.max(M - 1, I), R: Math.max(M - 1, F),
            a: tcStr(sa, W), b: tcStr(sb, W), op2: tcStr(s2, W), sum: tcStr(sa + s2, W),
            va: sa / P(F), vb: sb / P(F), vo: s2 / P(F), vs: (sa + s2) / P(F)
        };
    }

    /* Reads a row of boxes either side of a point. cells = array of '', '0' or '1', the first L boxes are left of the point.
       Rules: the used integer boxes must touch the point with no gaps, and the left-most one used is the sign bit
       (two's complement of however many bits were used); the used fraction boxes must start at the point with no gaps.
       So 0.101 and 00.1010 are the same number and the student need not pad. */
    function readFixed(cells, L) {
        var left = cells.slice(0, L), right = cells.slice(L), i, first = -1, last = -1;
        if (cells.some(function (c) { return c !== '' && c !== '0' && c !== '1'; })) return { ok: false };
        for (i = 0; i < left.length; i++) if (left[i] !== '') { first = i; break; }
        if (first < 0) return { ok: false };
        for (i = first; i < left.length; i++) if (left[i] === '') return { ok: false };
        for (i = 0; i < right.length; i++) if (right[i] !== '') last = i;
        for (i = 0; i <= last; i++) if (right[i] === '') return { ok: false };
        var v = tcVal(left.slice(first).join(''));
        for (i = 0; i <= last; i++) v += (+right[i]) / P(i + 1);
        return { ok: true, value: v, nInt: left.length - first, nFrac: last + 1 };
    }

    /* Marks a whole row against the value it should hold. One entry per box: true/false for boxes the student filled,
       null for boxes left empty. A row with nothing typed flags the box beside the point so the step cannot pass. */
    function judgeFixedRow(cells, L, expected) {
        var r = readFixed(cells, L), good = r.ok && r.value === expected, typed = 0;
        var out = cells.map(function (c) { if (c === '') return null; typed++; return good; });
        if (!good && typed === 0) out[L - 1] = false;
        return out;
    }

    /* Marks a carry row. expected = '0'/'1' per box. A typed carry must match. An empty box means 0, so it is only
       wrong where a carry of 1 is needed inside the columns the student used for their sum (sumCells). */
    function judgeCarryRow(cells, expected, sumCells) {
        var lo = -1, hi = -1;
        sumCells.forEach(function (c, i) { if (c !== '') { if (lo < 0) lo = i; hi = i; } });
        return cells.map(function (c, i) {
            var e = expected.charAt(i) || '0';
            if (c === '') return (e === '1' && lo >= 0 && i >= lo && i <= hi) ? false : null;
            return c === e;
        });
    }

    Hex.addCols = addCols;
    Hex.fpAddPlan = fpAddPlan;
    Hex.fpMove = fpMove;
    Hex.fpFrame = fpFrame;
    Hex.readFixed = readFixed;
    Hex.judgeFixedRow = judgeFixedRow;
    Hex.judgeCarryRow = judgeCarryRow;
})();
