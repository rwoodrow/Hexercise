/* Working-out forms for binary addition, subtraction and two's complement. */
(function () {
    'use strict';
    var Hex = globalThis.Hex = globalThis.Hex || {};
    if (typeof require === 'function') { require('./numbers.js'); require('./plans.js'); require('./dom.js'); }
    var P = Hex.P, toBin = Hex.toBin, tcStr = Hex.tcStr, inv = Hex.inv, addCols = Hex.addCols, bitRow = Hex.bitRow, addBlock = Hex.addBlock, numRow = Hex.numRow, valRow = Hex.valRow;
    var WORKERS = Hex.WORKERS = Hex.WORKERS || {};
    var zeros = function (n) { return new Array(n + 1).join('0'); };

    /* The "add 1" part of a two's complement: carries, the flipped bits, + 1, and the answer, all entered right to left. */
    var addOne = function (body, fields, flipped, answer) {
        var one = zeros(flipped.length - 1) + '1';
        addBlock(body, fields, { x: flipped, y: one, carries: addCols(flipped, one).carries, sum: answer, xl: 'Flipped', yl: '+ 1', sl: 'Result' });
    };

    WORKERS.binadd = function (q, add) {
        var m = q.meta, A = toBin(m.a, m.bits), B = toBin(m.b, m.bits), r = addCols(A, B);
        add({
            title: 'Add column by column',
            help: 'Start at the right. Type each sum bit, then write any carry above the next column to the left (leave it blank if there is none). ' +
                'The ↑ and ↓ keys move between the carry row and the sum row.',
            build: function (b) {
                var f = [];
                addBlock(b, f, { x: A, y: B, carries: r.carries, sum: r.sum, xl: '', yl: '+', sl: 'Sum' });
                return f;
            },
            finish: 'now type the sum into the answer box above.'
        });
    };

    WORKERS.binsub = function (q, add) {
        var m = q.meta, A = toBin(m.a, m.bits), B = toBin(m.b, m.bits), flipped = inv(B), nb = toBin(P(m.bits) - m.b, m.bits), r = addCols(A, nb);
        add({
            title: 'Flip the bits of B',
            help: 'To subtract B we add its two’s complement. First flip every bit of B (the number being taken away).',
            build: function (b) {
                var f = [];
                b.appendChild(bitRow('A', A, null));
                b.appendChild(bitRow('B', B, null));
                b.appendChild(bitRow('Flipped', flipped, null, f));
                return f;
            },
            after: function () {
                add({
                    title: 'Add 1',
                    help: 'Now add 1 to the flipped bits, starting at the right and writing any carries above the next column. This gives −B in two’s complement.',
                    build: function (b) { var f = []; addOne(b, f, flipped, nb); return f; },
                    after: function () {
                        add({
                            title: 'Add A and −B',
                            help: 'Add column by column from the right, writing carries above the next column to the left. A carry out of the left-most column is thrown away.',
                            build: function (b) {
                                var f = [];
                                addBlock(b, f, { x: A, y: nb, carries: r.carries, sum: r.sum, xl: 'A', yl: '+ (−B)', sl: 'Result' });
                                return f;
                            },
                            finish: 'now type the result into the answer box above.'
                        });
                    }
                });
            }
        });
    };

    WORKERS.twos = function (q, add) {
        var m = q.meta, bits = m.bits;
        var flipAdd = function (start, last) {      /* adds "flip the bits" then "add 1" steps for the bit string `start` */
            add({
                title: 'Flip the bits',
                help: 'Change every 0 to a 1 and every 1 to a 0.',
                build: function (b) {
                    var f = [];
                    b.appendChild(bitRow('Start', start, null));
                    b.appendChild(bitRow('Flipped', inv(start), null, f));
                    return f;
                },
                after: function () {
                    add({
                        title: 'Add 1',
                        help: 'Add 1 to the flipped bits, starting at the right and writing any carries above the next column.',
                        build: function (b) { var f = []; addOne(b, f, inv(start), last); return f; },
                        finish: 'now type the answer into the answer box above.'
                    });
                }
            });
        };
        if (m.k === 0) {
            add({
                title: 'Write the positive number in binary',
                help: 'Ignore the minus sign for now and write ' + (-m.n) + ' as a ' + bits + '-bit binary number.',
                build: function (b) { var f = []; b.appendChild(bitRow('Binary', toBin(-m.n, bits), null, f)); return f; },
                after: function () { flipAdd(toBin(-m.n, bits), tcStr(m.n, bits)); }
            });
        } else if (m.k === 2) {
            flipAdd(toBin(m.a, bits), tcStr(-m.a, bits));
        } else {
            var s = tcStr(m.m, bits), vals = [];
            for (var i = 0; i < bits; i++) vals.push(i === 0 ? -P(bits - 1) : P(bits - 1 - i));
            add({
                title: 'Place values',
                help: 'In two’s complement the left-most bit is worth <b>−' + P(bits - 1) + '</b>. Write the value of each column.',
                build: function (b) {
                    var f = [];
                    b.appendChild(bitRow('Bits', s, null, null, { wide: true }));
                    b.appendChild(valRow('Place values', vals, f));
                    return f;
                },
                after: function () {
                    add({
                        title: 'Add up',
                        help: 'Add the place values of the columns that contain a 1.',
                        build: function (b) { var f = []; b.appendChild(numRow('Total', m.m, f)); return f; },
                        finish: 'now type the answer into the answer box above.'
                    });
                }
            });
        }
    };
})();
