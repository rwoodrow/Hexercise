/* Question generators, one per question type. */
(function () {
    'use strict';
    var Hex = globalThis.Hex = globalThis.Hex || {};
    if (typeof require === 'function') { require('./numbers.js'); require('./random.js'); require('./checkers.js'); }
    var P = Hex.P, ri = Hex.ri, pick = Hex.pick, toBin = Hex.toBin, toHex = Hex.toHex, tcStr = Hex.tcStr, fpVal = Hex.fpVal, bold = Hex.bold, chk = Hex.chk, Q = Hex.Q;

    function gBinWhole(r) {
        if (r() < 0.5) {
            var bits = pick(r, [4, 5, 6, 7, 8]), n = ri(r, P(bits - 1), P(bits) - 1);
            return Q('Convert ' + bold(n) + ' to ' + bold(bits) + ' bit binary:', toBin(n, bits), chk.str(toBin(n, bits)));
        }
        var b2 = pick(r, [4, 6, 8]), m = ri(r, 1, P(b2) - 1);
        return Q('Convert ' + bold(toBin(m, b2)) + ' from binary to denary', m, chk.dec(m));
    }
    function gBinAdd(r) {
        var bits = pick(r, [6, 7, 8]);
        var a = ri(r, P(bits - 3), P(bits - 1) - 1), b = ri(r, P(bits - 3), P(bits - 1) - 1);
        return Q('Add ' + bold(toBin(a, bits)) + ' and ' + bold(toBin(b, bits)) + ' in binary:', toBin(a + b, bits), chk.binVal(a + b),
            { meta: { kind: 'binadd', a: a, b: b, bits: bits } });
    }
    function gBinSub(r) {
        var bits = pick(r, [6, 7, 8]);
        var a = ri(r, P(bits - 2), P(bits) - 1), b = ri(r, 1, a - 1);
        return Q('Subtract ' + bold(toBin(b, bits)) + ' from ' + bold(toBin(a, bits)) + ' in binary:', toBin(a - b, bits), chk.binVal(a - b),
            { meta: { kind: 'binsub', a: a, b: b, bits: bits } });
    }
    function gBinMul(r) {
        var wa = ri(r, 4, 5), wb = ri(r, 3, 4);
        var a = ri(r, P(wa - 1), P(wa) - 1), b = ri(r, P(wb - 1), P(wb) - 1);
        return Q('Multiply ' + bold(toBin(a, wa)) + ' by ' + bold(toBin(b, wb)) + ' in binary:', toBin(a * b), chk.binVal(a * b));
    }
    function hexDen(r, lo, hi) {
        var n = ri(r, lo, hi);
        if (r() < 0.5) return Q('Convert 0x' + bold(toHex(n)) + ' from hexadecimal to denary', n, chk.dec(n));
        return Q('Convert ' + bold(n) + ' from denary to hexadecimal', toHex(n), chk.hex(n), { prefix: '0x' });
    }
    function gHexDen(r) { return hexDen(r, 16, 255); }
    function gHexDenAdv(r) { return hexDen(r, 256, 65535); }
    function gHexBin(r) {
        var d = pick(r, [2, 3]);
        if (r() < 0.5) {
            var n = ri(r, 1, Math.pow(16, d) - 1), h = toHex(n);
            while (h.length < d) h = '0' + h;
            return Q('Convert ' + bold(toBin(n, 4 * d)) + ' from binary to hexadecimal', h, chk.hex(n), { prefix: '0x' });
        }
        var m = ri(r, Math.pow(16, d - 1), Math.pow(16, d) - 1);
        return Q('Convert 0x' + bold(toHex(m)) + ' from hexadecimal to ' + bold(4 * d) + ' bit binary', toBin(m, 4 * d), chk.str(toBin(m, 4 * d)));
    }
    function gHexBinAdv(r) {
        var L = pick(r, [6, 7, 9, 10, 11, 13, 14, 16, 18, 20]), n = ri(r, P(L - 1), P(L) - 1);
        if (r() < 0.5) return Q('Convert ' + bold(toBin(n, L)) + ' from binary to hexadecimal', toHex(n), chk.hex(n), { prefix: '0x' });
        return Q('Convert 0x' + bold(toHex(n)) + ' from hexadecimal to ' + bold(L) + ' bit binary', toBin(n, L), chk.str(toBin(n, L)));
    }
    function gTwos(r) {
        var bits = pick(r, [4, 6, 8]), lo = -P(bits - 1), hi = P(bits - 1) - 1, k = ri(r, 0, 2);
        if (k === 0) {
            var n = ri(r, lo, -1);
            return Q('Convert ' + bold(n) + ' to ' + bold(bits) + ' bit two\'s complement binary:', tcStr(n, bits), chk.str(tcStr(n, bits)),
                { meta: { kind: 'twos', k: 0, n: n, bits: bits } });
        }
        if (k === 1) {
            var m = ri(r, lo, hi);
            return Q('Convert ' + bold(tcStr(m, bits)) + ' from ' + bold(bits) + ' bit two\'s complement binary to denary:', m, chk.dec(m),
                { meta: { kind: 'twos', k: 1, m: m, bits: bits } });
        }
        var a = ri(r, 1, hi);
        return Q(bold(toBin(a, bits)) + ' is a positive ' + bold(bits) + ' bit binary number. Write its negative in ' + bold(bits) + ' bit two\'s complement binary:', tcStr(-a, bits), chk.str(tcStr(-a, bits)),
            { meta: { kind: 'twos', k: 2, a: a, bits: bits } });
    }
    function gBinFrac(r) {
        var ip = ri(r, 1, 31), fb = ri(r, 1, 4), f = ri(r, 0, P(fb - 1) - 1) * 2 + 1;
        var value = ip + f / P(fb), str = ip.toString(2) + '.' + toBin(f, fb);
        if (r() < 0.5) return Q('Convert ' + bold(str) + ' from binary to denary:', value, chk.real(value));
        return Q('Convert ' + bold(value) + ' from denary to binary:', str, chk.binFrac(value));
    }

    /* floating point: M bit mantissa (point after first bit), E bit exponent, both two's complement */
    var FP = [[4, 4], [8, 4], [10, 4], [12, 4], [6, 6]];
    function normMant(r, M) { return r() < 0.5 ? ri(r, P(M - 2), P(M - 1) - 1) : -ri(r, P(M - 2) + 1, P(M - 1)); }
    function fpIntro(M, E) { return bold(M) + ' bit mantissa and a ' + bold(E) + ' bit exponent, both in two\'s complement'; }
    function gReal(r) {
        var pr = pick(r, FP), M = pr[0], E = pr[1], k = ri(r, 0, 2), m, e, v;
        if (k === 0) {
            m = normMant(r, M); e = ri(r, -3, 6); v = fpVal(m, e, M);
            return Q('A floating point number is stored with an ' + fpIntro(M, E) + '.<br>Mantissa: ' + bold(tcStr(m, M)) +
                ' &nbsp; Exponent: ' + bold(tcStr(e, E)) + '<br>Convert it to denary:', v, chk.real(v),
                { meta: { kind: 'fpval', M: M, E: E, mant: tcStr(m, M), exp: tcStr(e, E), value: v } });
        }
        if (k === 1) {
            m = normMant(r, M); e = ri(r, -1, 6); v = fpVal(m, e, M);
            var ans = tcStr(m, M) + tcStr(e, E);
            return Q('Represent ' + bold(v) + ' as a normalised floating point number using an ' + fpIntro(M, E) +
                '.<br>Enter the mantissa followed by the exponent (' + bold(M + E) + ' digits, no spaces):', ans, chk.str(ans),
                { meta: { kind: 'fprep', M: M, E: E, value: v } });
        }
        var kk = ri(r, 1, 2), mm;
        if (r() < 0.5) mm = ri(r, P(M - 2 - kk), P(M - 1 - kk) - 1);
        else mm = -ri(r, P(M - 2 - kk) + 1, P(M - 1 - kk));
        e = ri(r, -3, 5);
        var res = tcStr(mm * P(kk), M) + tcStr(e, E);
        return Q('This floating point number (' + fpIntro(M, E) + ') is not normalised.<br>Mantissa: ' + bold(tcStr(mm, M)) +
            ' &nbsp; Exponent: ' + bold(tcStr(e + kk, E)) + '<br>Normalise it. Enter the mantissa followed by the exponent (' +
            bold(M + E) + ' digits, no spaces):', res, chk.str(res),
            { meta: { kind: 'fpnorm', M: M, E: E, mant: tcStr(mm, M), exp: tcStr(e + kk, E) } });
    }
    function fpNormalise(m, e, M, E) {
        if (m === 0) return null;
        var lo = -P(M - 1), hi = P(M - 1) - 1;
        var isNorm = function (x) { return (x >= P(M - 2) && x <= hi) || (x <= -P(M - 2) - 1 && x >= lo); };
        var guard = 0;
        while (!isNorm(m) && guard++ < 64) {
            if (m > hi || m < lo) { if (m % 2 !== 0) return null; m /= 2; e++; }
            else { m *= 2; e--; }
        }
        if (!isNorm(m)) return null;
        if (e < -P(E - 1) || e > P(E - 1) - 1) return null;
        return { m: m, e: e };
    }
    function gFpAdd(r) {
        for (var tries = 0; tries < 2000; tries++) {
            var pr = pick(r, FP), M = pr[0], E = pr[1], sub = r() < 0.5;
            var ea = ri(r, -2, 4), eb = Math.max(-P(E - 1), Math.min(P(E - 1) - 1, ea + ri(r, -3, 3)));
            var ma = normMant(r, M), mb = normMant(r, M), emin = Math.min(ea, eb);
            var T = ma * P(ea - emin) + (sub ? -1 : 1) * mb * P(eb - emin);
            var res = fpNormalise(T, emin, M, E);
            if (!res) continue;
            var ans = tcStr(res.m, M) + tcStr(res.e, E);
            return Q('Calculate A ' + (sub ? '&minus;' : '+') + ' B for these floating point numbers (' + fpIntro(M, E) + ').<br>' +
                'A &nbsp; Mantissa: ' + bold(tcStr(ma, M)) + ' &nbsp; Exponent: ' + bold(tcStr(ea, E)) + '<br>' +
                'B &nbsp; Mantissa: ' + bold(tcStr(mb, M)) + ' &nbsp; Exponent: ' + bold(tcStr(eb, E)) + '<br>' +
                'Give the normalised result: mantissa followed by exponent (' + bold(M + E) + ' digits, no spaces):', ans, chk.str(ans),
                { meta: { kind: 'fpadd', M: M, E: E, op: sub ? '-' : '+', A: [tcStr(ma, M), tcStr(ea, E)], B: [tcStr(mb, M), tcStr(eb, E)] } });
        }
        return gReal(r); /* practically unreachable fallback */
    }

    Hex.gBinWhole = gBinWhole;
    Hex.gBinAdd = gBinAdd;
    Hex.gBinSub = gBinSub;
    Hex.gBinMul = gBinMul;
    Hex.gHexDen = gHexDen;
    Hex.gHexDenAdv = gHexDenAdv;
    Hex.gHexBin = gHexBin;
    Hex.gHexBinAdv = gHexBinAdv;
    Hex.gTwos = gTwos;
    Hex.gBinFrac = gBinFrac;
    Hex.gReal = gReal;
    Hex.gFpAdd = gFpAdd;
})();
