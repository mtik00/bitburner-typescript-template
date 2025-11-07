// @ts-nocheck
import { NS } from "@ns";

export async function main(ns: NS) {
    solveContract(ns, ns.args[0], ns.args[1], 1);
}

export function solveContract(ns, host, filename, logLevel = 0) {
    var type = ns.codingcontract.getContractType(filename, host);
    var desc = ns.codingcontract.getDescription(filename, host);
    var data = ns.codingcontract.getData(filename, host);
    ns.tprint(host + " " + filename);
    ns.tprint(type);
    if (logLevel >= 1) {
        ns.tprint(desc);
        ns.tprint(data);
    }
    var answer;
    switch (type) {
        case "Algorithmic Stock Trader I":
            answer = algorithmicStockTrader1(ns, data);
            break;
        case "Algorithmic Stock Trader II":
            answer = algorithmicStockTrader2(ns, data);
            break;
        case "Algorithmic Stock Trader III":
            answer = algorithmicStockTrader3(ns, data);
            break;
        case "Algorithmic Stock Trader IV":
            answer = algorithmicStockTrader4(ns, data);
            break;
        case "Array Jumping Game":
            answer = arrayJumpingGame(ns, data);
            break;
        case "Array Jumping Game II":
            answer = ArrayJumpingGameII(ns, data);
            break;
        case "Compression I: RLE Compression":
            answer = CompressionIRLECompression(ns, data);
            break;
        case "Compression II: LZ Decompression":
            answer = comprLZDecode(ns, data);
            break;
        case "Compression III: LZ Compression":
            answer = comprLZEncode(ns, data)
            break;
        case "Encryption I: Caesar Cipher":
            answer = solveCaesarCipher(ns, data)
            break
        case "Encryption II: Vigenère Cipher":
            answer = solveVigenereCipher(ns, data)
            break
        case "Find All Valid Math Expressions":
            answer = findAllValidMathExpr(ns, data);
            break;
        case "Find Largest Prime Factor":
            answer = largestPrimeFactor(ns, data);
            break;
        case "Generate IP Addresses":
            answer = generateIpAddresses(ns, data);
            break;
        case "HammingCodes: Encoded Binary to Integer":
            answer = HammingDecode(ns, data)
            break
        case "HammingCodes: Integer to Encoded Binary":
            answer = HammingEncode(ns, data)
            break
        case "Merge Overlapping Intervals":
            answer = mergeOverlappingIntervals(ns, data);
            break;
        case "Minimum Path Sum in a Triangle":
            answer = solveMinimumPathSumInTriangle(ns, data)
            break
        case "Proper 2-Coloring of a Graph":
            answer = Proper2ColoringOfAGraph(ns, data)
            break;
        case "Sanitize Parentheses in Expression":
            answer = sanitizeParentheses(ns, data);
            break;
        case "Shortest Path in a Grid":
            answer = solveShortestPathInGrid(ns, data)
            break
        case "Spiralize Matrix":
            answer = spiralizeMatrix(ns, data);
            break;
        case "Square Root":
            answer = solveSquareRoot(ns, data)
            break;
        case "Subarray with Maximum Sum":
            answer = subarrayWithMaxSum(ns, data);
            break;
        case "Total Number of Primes":
            answer = solveTotalPrimesInRange(ns, data)
            break
        case "Total Ways to Sum":
            answer = totalWayToSum(ns, data);
            break;
        case "Total Ways to Sum II":
            answer = totalWayToSumII(ns, data);
            break;
        case "Unique Paths in a Grid I":
            answer = uniquePathInGrid1(ns, data);
            break;
        case "Unique Paths in a Grid II":
            answer = uniquePathInGrid2(ns, data);
            break;
        default:
            ns.tprint("unknown type: " + type);
            return;
    }
    if (answer && !(answer instanceof String) && Object.keys(answer).length > 20) {
        ns.tprint("answer size too large to print: " + Object.keys(answer).length);
    } else {
        ns.tprint(answer);
    }
    var opts = {};
    opts.returnReward = true;
    var reward = ns.codingcontract.attempt(answer, filename, host, opts);
    if (reward) {
        ns.tprint(reward);
    } else {
        ns.tprint("failed!");
    }
}

/** @param {NS} ns **/
function sanitizeParentheses(ns, data) {
    var context = { "maxLeftLength": 0 }
    var exprs = findSanitized(ns, data, 0, context);
    exprs = exprs.filter(e => e.length >= context["maxLeftLength"]).sort();
    for (var i = 0; i < exprs.length - 1; i++) {
        while (exprs[i] == exprs[i + 1]) {
            exprs.splice(i + 1, 1);
        }
    }
    return exprs;
}

function findSanitized(ns, s, pos, context) {
    // ns.tprint(s, " ", pos, " ", context["maxLeftLength"], " ", validateParentheses(s));
    if (s.length < context["maxLeftLength"]) {
        return [];
    }

    if (pos == s.length) {
        if (validateParentheses(s)) {
            if (s.length > context["maxLeftLength"]) {
                context["maxLeftLength"] = s.length;
            }
            return [s];
        } else {
            return [];
        }
    }

    var results = [];
    var c = s[pos];
    if (c == "(" || c == ")") {
        results = results.concat(
            findSanitized(ns, s, pos + 1, context),
            findSanitized(ns, s.slice(0, pos) + s.slice(pos + 1), pos, context)
        );
    } else {
        results = results.concat(
            findSanitized(ns, s, pos + 1, context)
        );
    }
    return results;
}

function validateParentheses(s) {
    var n = 0;
    for (var i = 0; i < s.length; i++) {
        if (s[i] == "(") {
            n++;
        }
        if (s[i] == ")") {
            n--;
        }
        if (n < 0) {
            return false;
        }
    }
    return n == 0;
}

/** @param {NS} ns **/
function findAllValidMathExpr(ns, data) {
    const [num, target] = data;

    function helper(res, path, num, target, pos, evaluated, multed) {
        if (pos === num.length) {
            if (target === evaluated) {
                res.push(path);
            }
            return;
        }

        for (let i = pos; i < num.length; ++i) {
            // Skip numbers with leading zeros (except "0" itself)
            if (i !== pos && num[pos] === "0") {
                break;
            }
            const cur = parseInt(num.substring(pos, i + 1));

            if (pos === 0) {
                // First number, no operator needed
                helper(res, path + cur, num, target, i + 1, cur, cur);
            } else {
                // Try addition
                helper(res, path + "+" + cur, num, target, i + 1, evaluated + cur, cur);
                // Try subtraction
                helper(res, path + "-" + cur, num, target, i + 1, evaluated - cur, -cur);
                // Try multiplication (need to undo the last operation and apply multiplication)
                helper(res, path + "*" + cur, num, target, i + 1, evaluated - multed + multed * cur, multed * cur);
            }
        }
    }

    const result = [];
    helper(result, "", num, target, 0, 0, 0);

    return result;
}


/** @param {NS} ns **/
function mergeOverlappingIntervals(ns, data) {
    var intervals = data.slice();
    for (var i = 0; i < intervals.length; i++) {
        for (var j = i + 1; j < intervals.length;) {
            var merged = mergeInterval(intervals[i], intervals[j]);
            if (merged !== null) {
                intervals[i] = merged;
                intervals.splice(j, 1);
                j = i + 1;
            } else {
                j++
            }
        }
    }
    intervals.sort((a, b) => a[0] - b[0]);
    return intervals;
}

function mergeInterval(a, b) {
    if (a[1] < b[0] || a[0] > b[1]) {
        return null;
    }
    return [Math.min(a[0], b[0]), Math.max(a[1], b[1])];
}

/** @param {NS} ns **/
function generateIpAddresses(ns, data) {
    return parseIpNum(ns, data, []);
}

/** @param {String} s
 * @Param {Array} parts**/
function parseIpNum(ns, s, parts) {
    if (parts.length == 4) {
        if (s.length == 0) {
            return [parts[0] + "." + parts[1] + "." + parts[2] + "." + parts[3]];
        } else {
            return [];
        }
    }
    if (s.length == 0) {
        return [];
    }
    var results = [];
    if (s.startsWith("0")) {
        parts.push(0);
        results = parseIpNum(ns, s.slice(1), parts);
        parts.pop();
        return results;
    }
    for (var i = 1; i <= 3 && i <= s.length; i++) {
        var n = parseInt(s.slice(0, i));
        if (n > 255) {
            break;
        }
        parts.push(n);
        results = results.concat(parseIpNum(ns, s.slice(i), parts));
        parts.pop();
    }
    return results;
}

/** @param {NS} ns **/
function uniquePathInGrid2(ns, data) {
    var maxY = data.length;
    var maxX = data[0].length;
    var c = Array(maxY);
    for (var y = 0; y < maxY; y++) {
        var row = data[y];
        c[y] = Array(maxX);
        for (var x = 0; x < row.length; x++) {
            var s = 0;
            if (row[x] == 0) {
                if (x == 0 && y == 0) {
                    s = 1;
                }
                if (y > 0) {
                    s += c[y - 1][x];
                }
                if (x > 0) {
                    s += c[y][x - 1];
                }
            }
            c[y][x] = s;
        }
    }
    return c[maxY - 1][maxX - 1];
}

function countPathInGrid(data, x, y) {
    var obstacle = data[y][x];
    if (obstacle == 1) {
        return 0;
    }
    if (x == data[y].length - 1 && y == data.length) {
        return 1;
    }
    var count = 0;
    if (x < data[y].length - 1) {
        count += countPathInGrid(data, x + 1, y);
    }
    if (y < data.length - 1) {
        count += countPathInGrid(data, x, y + 1);
    }
}

/** @param {NS} ns **/
function subarrayWithMaxSum(ns, data) {
    return findMaxSubArraySum(data);
}

function findMaxSubArraySum(arr) {
    if (arr.length == 0) {
        return 0;
    }
    if (arr.length == 1) {
        return arr[0];
    }
    var sum = findMaxSubArraySum(arr.slice(1));
    var s = 0;
    for (var i = 0; i < arr.length; i++) {
        s += arr[i];
        if (s > sum) {
            sum = s;
        }
    }
    return sum;
}

/** @param {NS} ns **/
function arrayJumpingGame(ns, data) {
    return findJump(data, 0);
}

function findJump(data, pos) {
    var maxJump = data[pos];
    if (pos + maxJump >= data.length - 1) {
        return 1;
    }
    for (var i = 1; i <= maxJump; i++) {
        if (findJump(data, pos + i) == 1) {
            return 1;
        }
    }
    return 0;
}

/** @param {NS} ns **/
function algorithmicStockTrader1(ns, data) {
    if (data.length == 0) {
        return 0;
    }
    var chances = findProfitChances(data);
    var mergedChances = mergeChances(chances);
    var profit = Math.max(...(mergedChances.map(cs => Math.max(...(cs.map(c => c[1] - c[0]))))));
    return profit;
}

/** @param {NS} ns **/
function algorithmicStockTrader2(ns, data) {
    if (data.length == 0) {
        return 0;
    }
    var chances = findProfitChances(data);
    var profit = chances.map(c => c[1] - c[0]).reduce((a, b) => a + b, 0);
    return profit;
}

/** @param {NS} ns **/
function algorithmicStockTrader3(ns, data) {
    if (data.length == 0) {
        return 0;
    }
    var chances = findProfitChances(data);
    // var mergedChances = mergeChances(chances);
    // var mp = mergedChances.map(cs=>cs.map(c=>c[1]-c[0]));
    return maxProfit(chances, 2);
}

/** @param {NS} ns **/
function algorithmicStockTrader4(ns, data) {
    if (data[1].length == 0) {
        return 0;
    }
    var chances = findProfitChances(data[1]);
    // var mergedChances = mergeChances(chances);
    // var mp = mergedChances.map(cs=>cs.map(c=>c[1]-c[0]));
    return maxProfit(chances, data[0]);
}

function maxProfit(chances, k) {
    if (k == 0 || chances.length == 0) {
        return 0;
    }
    var c0 = chances[0];
    if (chances.length == 1) {
        return c0[1] - c0[0];
    }
    var profit = maxProfit(chances.slice(1), k);
    for (var i = 0; i < chances.length; i++) {
        var p = chances[i][1] - chances[0][0] + maxProfit(chances.slice(i + 1), k - 1);
        if (p > profit) {
            profit = p;
        }
    }
    return profit;
}

function findProfitChances(data) {
    var start = data[0];
    var end = start;
    var chances = [];
    for (var i = 1; i < data.length; i++) {
        var now = data[i];
        if (end < now) {
            end = now;
        }
        if (end > now) {
            if (end > start) {
                chances.push([start, end]);
            }
            start = now;
            end = start;
        }
    }
    if (end > start) {
        chances.push([start, end]);
    }
    return chances;
}

function mergeChances(chances) {
    var n = chances.length;
    var mc = [];
    var cs = chances.slice();
    mc.push(cs);
    while (cs.length > 1) {
        var ncs = [];
        for (var i = 0; i < cs.length - 1; i++) {
            ncs.push([cs[i][0], cs[i + 1][1]]);
        }
        mc.push(ncs);
        cs = ncs;
    }
    mc.reverse();
    return mc;
}

/** @param {NS} ns **/
function minPathSumInTriangle(ns, data) {
    var length = data.length;
    if (length == 1) {
        return data[0][0];
    }
    var r = data[length - 1].slice();
    for (var i = length - 2; i >= 0; i--) {
        var row = data[i];
        var nr = [];
        for (var j = 0; j < i + 1; j++) {
            nr.push(Math.min(r[j] + row[j], r[j + 1] + row[j]));
        }
        r = nr;
    }
    return r[0];
}

/** @param {NS} ns **/
function largestPrimeFactor(ns, data) {
    var factor = 0;
    var k = data;
    var rk = Math.sqrt(k);
    for (var i = 2; i < rk;) {
        if (k % i == 0) {
            factor = i;
            k /= i;
            rk = Math.sqrt(k);
        } else {
            i++;
        }
    }
    if (k > factor) {
        factor = k;
    }
    return factor;
}

function uniquePathInGrid1(ns, data) {
    var a = data[0];
    var b = data[1];
    if (a > b) {
        a = data[1];
        b = data[0];
    }
    a = a - 1;
    b = b - 1;
    var n = a + b;

    var c = 1;
    for (var i = 1; i <= a; i++) {
        c = c * n / i;
        n--;
    }
    return c;
}

function spiralizeMatrix(ns, data) {
    var s = 0;
    var m = [];
    for (var i = 0; i < data.length; i++) {
        m.push(data[i].slice());
    }
    var a = [];
    while (m.length > 0 && m[0].length > 0) {
        switch (s) {
            case 0:
                a = a.concat(m[0]);
                m = m.slice(1);
                s = 1;
                break;
            case 1:
                for (var i = 0; i < m.length; i++) {
                    a.push(m[i].pop());
                }
                s = 2;
                break;
            case 2:
                a = a.concat(m.pop().reverse());
                s = 3;
                break;
            case 3:
                for (var i = m.length - 1; i >= 0; i--) {
                    a.push(m[i][0]);
                    m[i] = m[i].slice(1);
                }
                s = 0;
                break;
        }
    }
    return a;
}

function totalWayToSum(ns, data) {
    var cache = {};
    var n = data;
    return twts(n, n, cache) - 1;
}

function totalWayToSumII(ns, data) {
    const n = data[0];
    const s = data[1];
    const ways: number[] = [1];
    ways.length = n + 1;
    ways.fill(0, 1);
    for (let i = 0; i < s.length; i++) {
        for (let j = s[i]; j <= n; j++) {
            ways[j] += ways[j - s[i]];
        }
    }
    return ways[n]
}

function twts(limit, n, cache) {
    if (n < 1) {
        return 1;
    }
    if (limit == 1) {
        return 1;
    }
    if (n < limit) {
        return twts(n, n, cache);
    }
    if (n in cache) {
        var c = cache[n];
        if (limit in c) {
            return c[limit];
        }
    }
    var s = 0;
    for (var i = 1; i <= limit; i++) {
        s += twts(i, n - i, cache);
    }
    if (!(n in cache)) {
        cache[n] = {};
    }
    cache[n][limit] = s;
    return s;
}

function ArrayJumpingGameII(ns, data) {
    const n = data.length;
    let reach = 0;
    let jumps = 0;
    let lastJump = -1;
    while (reach < n - 1) {
        let jumpedFrom = -1;
        for (let i = reach; i > lastJump; i--) {
            if (i + data[i] > reach) {
                reach = i + data[i];
                jumpedFrom = i;
            }
        }
        if (jumpedFrom === -1) {
            jumps = 0;
            break;
        }
        lastJump = jumpedFrom;
        jumps++;
    }
    return jumps;
}

function CompressionIRLECompression(ns, plain) {
    if (plain.length === 0) return answer === "";

    let out = "";
    let count = 1;
    for (let i = 1; i < plain.length; i++) {
        if (count < 9 && plain[i] === plain[i - 1]) {
            count++;
            continue;
        }
        out += count + plain[i - 1];
        count = 1;
    }
    out += count + plain[plain.length - 1];
    return out;
}

function comprLZDecode(ns, compr) {
    let plain = "";

    for (let i = 0; i < compr.length;) {
        const literal_length = compr.charCodeAt(i) - 0x30;

        if (literal_length < 0 || literal_length > 9 || i + 1 + literal_length > compr.length) {
            return null;
        }

        plain += compr.substring(i + 1, i + 1 + literal_length);
        i += 1 + literal_length;

        if (i >= compr.length) {
            break;
        }
        const backref_length = compr.charCodeAt(i) - 0x30;

        if (backref_length < 0 || backref_length > 9) {
            return null;
        } else if (backref_length === 0) {
            ++i;
        } else {
            if (i + 1 >= compr.length) {
                return null;
            }

            const backref_offset = compr.charCodeAt(i + 1) - 0x30;
            if ((backref_length > 0 && (backref_offset < 1 || backref_offset > 9)) || backref_offset > plain.length) {
                return null;
            }

            for (let j = 0; j < backref_length; ++j) {
                plain += plain[plain.length - backref_offset];
            }

            i += 2;
        }
    }

    return plain;
}

// compress plaintext string
function comprLZEncode(ns, plain: string): string {
    // for state[i][j]:
    //      if i is 0, we're adding a literal of length j
    //      else, we're adding a backreference of offset i and length j
    let cur_state: (string | null)[][] = Array.from(Array(10), () => Array<string | null>(10).fill(null));
    let new_state: (string | null)[][] = Array.from(Array(10), () => Array<string | null>(10));

    function set(state: (string | null)[][], i: number, j: number, str: string): void {
        const current = state[i][j];
        if (current == null || str.length < current.length) {
            state[i][j] = str;
        } else if (str.length === current.length && Math.random() < 0.5) {
            // if two strings are the same length, pick randomly so that
            // we generate more possible inputs to Compression II
            state[i][j] = str;
        }
    }

    // initial state is a literal of length 1
    cur_state[0][1] = "";

    for (let i = 1; i < plain.length; ++i) {
        for (const row of new_state) {
            row.fill(null);
        }
        const c = plain[i];

        // handle literals
        for (let length = 1; length <= 9; ++length) {
            const string = cur_state[0][length];
            if (string == null) {
                continue;
            }

            if (length < 9) {
                // extend current literal
                set(new_state, 0, length + 1, string);
            } else {
                // start new literal
                set(new_state, 0, 1, string + "9" + plain.substring(i - 9, i) + "0");
            }

            for (let offset = 1; offset <= Math.min(9, i); ++offset) {
                if (plain[i - offset] === c) {
                    // start new backreference
                    set(new_state, offset, 1, string + String(length) + plain.substring(i - length, i));
                }
            }
        }

        // handle backreferences
        for (let offset = 1; offset <= 9; ++offset) {
            for (let length = 1; length <= 9; ++length) {
                const string = cur_state[offset][length];
                if (string == null) {
                    continue;
                }

                if (plain[i - offset] === c) {
                    if (length < 9) {
                        // extend current backreference
                        set(new_state, offset, length + 1, string);
                    } else {
                        // start new backreference
                        set(new_state, offset, 1, string + "9" + String(offset) + "0");
                    }
                }

                // start new literal
                set(new_state, 0, 1, string + String(length) + String(offset));

                // end current backreference and start new backreference
                for (let new_offset = 1; new_offset <= Math.min(9, i); ++new_offset) {
                    if (plain[i - new_offset] === c) {
                        set(new_state, new_offset, 1, string + String(length) + String(offset) + "0");
                    }
                }
            }
        }

        const tmp_state = new_state;
        new_state = cur_state;
        cur_state = tmp_state;
    }

    let result = null;

    for (let len = 1; len <= 9; ++len) {
        let string = cur_state[0][len];
        if (string == null) {
            continue;
        }

        string += String(len) + plain.substring(plain.length - len, plain.length);
        if (result == null || string.length < result.length) {
            result = string;
        } else if (string.length == result.length && Math.random() < 0.5) {
            result = string;
        }
    }

    for (let offset = 1; offset <= 9; ++offset) {
        for (let len = 1; len <= 9; ++len) {
            let string = cur_state[offset][len];
            if (string == null) {
                continue;
            }

            string += String(len) + "" + String(offset);
            if (result == null || string.length < result.length) {
                result = string;
            } else if (string.length == result.length && Math.random() < 0.5) {
                result = string;
            }
        }
    }

    return result ?? "";
}


function Proper2ColoringOfAGraph(ns, data) {
    const [numVertices, edges] = data;

    // Helper function to get neighbourhood of a vertex
    function neighbourhood(vertex) {
        const adjLeft = edges.filter(([a]) => a === vertex).map(([, b]) => b);
        const adjRight = edges.filter(([, b]) => b === vertex).map(([a]) => a);
        return adjLeft.concat(adjRight);
    }

    const coloring = Array(numVertices).fill(undefined);

    while (coloring.some((val) => val === undefined)) {
        // Color a vertex in the graph
        const initialVertex = coloring.findIndex((val) => val === undefined);
        coloring[initialVertex] = 0;
        const frontier = [initialVertex];

        // Propagate the coloring throughout the component containing v greedily
        while (frontier.length > 0) {
            const v = frontier.pop();
            const neighbors = neighbourhood(v);

            // For each vertex u adjacent to v
            for (const u of neighbors) {
                // Set the color of u to the opposite of v's color if it is new,
                // then add u to the frontier to continue the algorithm.
                if (coloring[u] === undefined) {
                    coloring[u] = coloring[v] === 0 ? 1 : 0;
                    frontier.push(u);
                }
                // Assert u,v do not have the same color
                else if (coloring[u] === coloring[v]) {
                    // If u,v do have the same color, no proper 2-coloring exists
                    return [];
                }
            }
        }
    }

    return coloring;
}

function solveSquareRoot(ns, data) {
    // Ensure data is a BigInt
    if (typeof data !== 'bigint') {
        data = BigInt(data);
    }

    // Newton's method (Babylonian method) for finding square root
    // Formula: x_(n+1) = (x_n + S/x_n) / 2
    // where S is the number we want to find the square root of

    if (data === 0n) return "0";
    if (data === 1n) return "1";

    let x = data;
    let x1 = (x + 1n) / 2n; // Initial guess

    // Newton's method iteration - converge to floor(sqrt(data))
    while (x1 < x) {
        x = x1;
        x1 = (x + data / x) / 2n;
    }

    // x is now floor(sqrt(data))
    // We need to round to nearest integer
    // Check if (x+1)² is closer to data than x²
    const lowerDiff = data - x * x;
    const upperDiff = (x + 1n) * (x + 1n) - data;

    if (upperDiff < lowerDiff) {
        return (x + 1n).toString();
    }

    return x.toString();
}


function solveShortestPathInGrid(ns, data) {
    const height = data.length;
    const width = data[0].length;
    const dstY = height - 1;
    const dstX = width - 1;

    // Check if start or end is blocked
    if (data[0][0] === 1 || data[dstY][dstX] === 1) {
        return "";
    }

    const distance = new Array(height);
    const parent = new Array(height);
    const queue = [];

    for (let y = 0; y < height; y++) {
        distance[y] = new Array(width).fill(Infinity);
        parent[y] = new Array(width).fill(null);
    }

    function validPosition(y, x) {
        return y >= 0 && y < height && x >= 0 && x < width && data[y][x] === 0;
    }

    // BFS to find shortest path
    distance[0][0] = 0;
    queue.push([0, 0]);

    while (queue.length > 0) {
        const [y, x] = queue.shift();

        // Check all four directions: Up, Down, Left, Right
        const directions = [
            [-1, 0, 'U'], // Up
            [1, 0, 'D'],  // Down
            [0, -1, 'L'], // Left
            [0, 1, 'R']   // Right
        ];

        for (const [dy, dx, dir] of directions) {
            const newY = y + dy;
            const newX = x + dx;

            if (validPosition(newY, newX) && distance[newY][newX] === Infinity) {
                queue.push([newY, newX]);
                distance[newY][newX] = distance[y][x] + 1;
                parent[newY][newX] = [y, x, dir];
            }
        }
    }

    // If destination is unreachable
    if (!isFinite(distance[dstY][dstX])) {
        return "";
    }

    // Reconstruct path from destination to start
    const path = [];
    let currentY = dstY;
    let currentX = dstX;

    while (parent[currentY][currentX] !== null) {
        const [prevY, prevX, direction] = parent[currentY][currentX];
        path.push(direction);
        currentY = prevY;
        currentX = prevX;
    }

    // Reverse path since we built it backwards
    return path.reverse().join('');
}

function solveCaesarCipher(ns, data) {
    const [plaintext, shift] = data;

    // Build char array, shifting via map and join to final results
    const cipher = [...plaintext]
        .map((a) => (a === " " ? a : String.fromCharCode(((a.charCodeAt(0) - 65 - shift + 26) % 26) + 65)))
        .join("");

    return cipher;
}

function solveVigenereCipher(ns, data) {
    const [plaintext, keyword] = data;

    // Build char array, shifting via map using corresponding keyword letter and join to final results
    const cipher = [...plaintext]
        .map((a, i) => {
            return a === " "
                ? a
                : String.fromCharCode(((a.charCodeAt(0) - 2 * 65 + keyword.charCodeAt(i % keyword.length)) % 26) + 65);
        })
        .join("");

    return cipher;
}

function HammingEncode(ns: NS, data: number): string {
    const enc: number[] = [0];
    const data_bits: number[] = data
        .toString(2)
        .split("")
        .reverse()
        .map((value) => parseInt(value));

    let k = data_bits.length;

    /* NOTE: writing the data like this flips the endianness, this is what the
     * original implementation by Hedrauta did so I'm keeping it like it was. */
    for (let i = 1; k > 0; i++) {
        if ((i & (i - 1)) != 0) {
            enc[i] = data_bits[--k];
        } else {
            enc[i] = 0;
        }
    }

    let parityNumber = 0;

    /* Figure out the subsection parities */
    for (let i = 0; i < enc.length; i++) {
        if (enc[i]) {
            parityNumber ^= i;
        }
    }

    const parityArray = parityNumber
        .toString(2)
        .split("")
        .reverse()
        .map((value) => parseInt(value));

    /* Set the parity bits accordingly */
    for (let i = 0; i < parityArray.length; i++) {
        enc[2 ** i] = parityArray[i] ? 1 : 0;
    }

    parityNumber = 0;
    /* Figure out the overall parity for the entire block */
    for (let i = 0; i < enc.length; i++) {
        if (enc[i]) {
            parityNumber++;
        }
    }

    /* Finally set the overall parity bit */
    enc[0] = parityNumber % 2 == 0 ? 0 : 1;

    return enc.join("");
}

function HammingDecode(ns: NS, data: string): number {
    let err = 0;
    const bits: number[] = [];

    /* TODO why not just work with an array of digits from the start? */
    const bitStringArray = data.split("");
    for (let i = 0; i < bitStringArray.length; ++i) {
        const bit = parseInt(bitStringArray[i]);
        bits[i] = bit;

        if (bit) {
            err ^= +i;
        }
    }

    /* If err != 0 then it spells out the index of the bit that was flipped */
    if (err) {
        /* Flip to correct */
        bits[err] = bits[err] ? 0 : 1;
    }

    /* Now we have to read the message, bit 0 is unused (it's the overall parity bit
     * which we don't care about). Each bit at an index that is a power of 2 is
     * a parity bit and not part of the actual message. */

    let ans = "";

    for (let i = 1; i < bits.length; i++) {
        /* i is not a power of two so it's not a parity bit */
        if ((i & (i - 1)) != 0) {
            ans += bits[i];
        }
    }

    /* TODO to avoid ambiguity about endianness why not let the player return the extracted (and corrected)
     * data bits, rather than guessing at how to convert it to a decimal string? */
    return parseInt(ans, 2);
}

function solveMinimumPathSumInTriangle(ns, data) {
    const n = data.length;

    // Start from the bottom row and work our way up
    // dp[j] represents the minimum path sum from position j in current row to bottom
    const dp = data[n - 1].slice();

    // Process each row from second-to-last up to the top
    for (let i = n - 2; i >= 0; i--) {
        for (let j = 0; j < data[i].length; j++) {
            // For each position, choose the minimum of the two adjacent positions below
            dp[j] = Math.min(dp[j], dp[j + 1]) + data[i][j];
        }
    }

    // The answer is at the top of the triangle
    return dp[0];
}

function solveTotalPrimesInRange(ns, data) {
    const [low, high] = data;

    /** Simple implementation of Sieve of Eratosthenes
     * https://en.wikipedia.org/wiki/Sieve_of_Eratosthenes */
    function simpleSieve(max) {
        const primes = [];
        // The array of numbers to check if they're prime is left blank. 
        // Blank and resulting prime values are falsey, non-primes are marked truthy.
        const arr = Array(max);
        // We only need to check factors up to the square root of max
        for (let i = 2; i * i <= max; i++) {
            // and only the prime factors
            if (!arr[i]) {
                // and we can then mark off all subsequent multiples of that prime
                for (let p = i * i; p <= max; p += i) {
                    arr[p] = 1;
                }
            }
        }
        // It should be faster to loop over the array again than to check factors 
        // all the way to max and mark primes at the same time.
        for (let i = 2; i <= max; i++) {
            if (!arr[i]) {
                primes.push(i);
            }
        }
        return primes;
    }

    /** Modified Sieve of Eratosthenes to find primes across a range, 
     * rather than all primes below a value. */
    function primeSieve(low, high) {
        // 0 and 1 are not checked, so are removed here.
        if (low < 2) {
            low = 2;
        }
        let primes = 0;
        // Only store the potential primes in the low to high range instead of 0 to high.
        const arr = Array(high - low + 1);
        // In order to mark off all composite numbers, we need to run up through sqrt(high), 
        // since primes squares are the worst case.
        const checks = simpleSieve(Math.ceil(Math.sqrt(high)));
        for (const i of checks) {
            // Same logic as for the simple sieve to mark off multiples of identified primes, 
            // but we only start checking at the first multiple >= low.
            const lim = Math.max(i, Math.ceil(low / i)) * i;
            for (let j = lim; j <= high; j += i) {
                arr[j - low] = 1;
            }
        }
        for (let a = 0; a <= high - low; a++) {
            if (!arr[a]) {
                // We don't really care what the value of the prime is, just how many we find.
                ++primes;
            }
        }
        return primes;
    }

    return primeSieve(low, high);
}
