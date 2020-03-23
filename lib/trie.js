const assert = require('assert').strict;

var Trie = function(words, prefixDepth, children) {
    this.prefixDepth = prefixDepth || 0; // depth this node is at
    this.words = words; // words stored at this node.
    this.children = children || null;
};

Trie.prototype.toJSON = function() {
    var childrenJSON = {};
    for (var k in this.children) {
        childrenJSON[k] = this.children[k].toJSON();
    }
    return {
        words: this.words,
        children: childrenJSON
    };
};

Trie.prototype.resolve = function() {
    assert(this.words.length);
    this.children = Object.create(null);
    // identify shared prefixes in our wordlist
    var prefix = this.words[0];
    var self = this;
    var sliceStart = 0;
    function flush(sliceEnd) {
        var prefixWords = self.words.slice(sliceStart, sliceEnd);
        /*console.log("resolve: at depth " + self.prefixDepth + ", found new prefix '" + prefix + "' with " + prefixWords.length
            + ": " + sliceStart + " .. " + sliceEnd
        );*/
        sliceStart = sliceEnd;
        var remainder = prefix.slice(self.prefixDepth);
        self.children[remainder] = new Trie(prefixWords, self.prefixDepth + remainder.length);
    }
    for (var i = 1; i < this.words.length; i++) {
        var word = this.words[i];
        var newPrefix = commonPrefix(prefix, word);
        if (newPrefix.length == this.prefixDepth) { // ["ab", "c"]: flush "ab", start over with "c" prefix
            flush(i);
            prefix = word;
        } else {
            prefix = newPrefix;
        }
    }
    flush(this.words.length);
    this.words = null;
};

/**
 * flop, foo, foobar, fweeh, fwerp
 * -> [flop, foo, foobar, fweeh, fwerp]
 * -> {"f": [flop, foo, foobar, fweeh, fwerp]}
 * -> {"f": [{"l": [flop]}, {"oo": [foo, foobar]}], "we": [fweeh, fwerp]}
 * -> {"f": {"l": {"op": [flop]}, {"oo": {"": [foo], "bar": [foobar] } }, "we": [fweeh, fwerp]}}
 */

function commonPrefix(left, right) {
    var min_len = Math.min(left.length, right.length);
    for (var i = 0; i < min_len; i++) {
        if (left[i] != right[i]) {
            return left.slice(0, i);
        }
    }
    return left.slice(0, min_len);
};

Trie.prototype.isWord = function() {
    if (this.children === null) this.resolve();

    return "" in this.children;
}

Trie.prototype.findPrefix = function (prefix) {
    if (this.children === null) this.resolve();
    // console.log("findPrefix(" + prefix + ")");
    if (prefix in this.children) {
        // console.log("direct match.");
        return this.children[prefix];
    }
    for (k in this.children) {
        if (!k.length) { // handled by prefix being "" and matching with 'in' above
            continue;
        }
        if (k.startsWith(prefix)) {
            // console.log("partial short match.");
            var newChildren = Object.create(null);
            newChildren[k.slice(prefix.length)] = this.children[k];
            return new Trie(null, this.prefixDepth + prefix.length, newChildren);
        }
        if (prefix.startsWith(k)) {
            // console.log("partial long match at '" + k + "'");
            return this.children[k].findPrefix(prefix.slice(k.length));
        }
    }

    return new Trie(null, 0, Object.create(null));
};

module.exports = Trie;
