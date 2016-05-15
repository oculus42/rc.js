/**
 * rowcol - a library for row-column data manipulation
 * @module rowcol
 * @author Samuel Rouse <samuel.rouse@gmail.com>
 * @license MIT http://opensource.org/licenses/MIT
 */


(function(definition) {
    "use strict";

    /* eslint-disable */
    // This file will function properly as a <script> tag, or a module
    // using CommonJS and NodeJS or RequireJS module formats.  In
    // Common/Node/RequireJS, the module exports rowcol and when
    // executed as a simple <script>, it creates a rowcol global instead.

    /* istanbul ignore next */
    // CommonJS
    if (typeof exports === "object" && typeof module === "object") {
        module.exports = definition();

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
        define(definition);

    // <script>
    } else if (typeof window !== "undefined" || typeof self !== "undefined") {
        // Prefer window over self for add-on scripts. Use self for
        // non-windowed contexts.
        var global = typeof window !== "undefined" ? window : self;

        // Get the `window` object and initialize rowcol as a global.
        global.rowcol = definition();

    } else {
        throw new Error("This environment was not anticipated by Q. Please file a bug.");
    }
    /* eslint-enable */

}(function(){
    "use strict";

    /*--------------------------------------------------------------------------*/

    var version = "1.0.1";

    /* Functions */

    /**
     * Indicates if the passed object is an array
     * @param {*} obj
     * @returns {boolean}
     */
    function isArray(obj){
        return Object.prototype.toString.call(obj) === '[object Array]';
    }

    /**
     * Returns an array of indexes that match a filter string or function.
     * @param {Array} array Array of values to match
     * @param {Function|String} filter Function or String to match array values.
     * @returns {Array} Array of indexes that match the filter.
     */
    function getIndexes (array, filter) {
        var indexes = [],
            len = array.length,
            i;

        if (typeof filter === 'function') {
            for (i = 0; i < len; i++) {
                if ( filter(i, array[i]) ) {
                    indexes.push(i);
                }
            }
        } else {
            for (i = 0; i < len; i++) {
                if ( array[i] === filter ) {
                    indexes.push(i);
                }
            }
        }
        return indexes;
    }

    /**
     * Returns the elements of an array using a list of selected indexes.
     * @param {Array} array
     * @param {Array} indexes
     * @returns {Array}
     */
    function getByIndexes (array, indexes) {
        var i,
            len = indexes.length,
            data = [];

        for (i = 0; i < len; i++) {
            data.push(array[indexes[i]]);
        }
        return data;
    }

    /**
     * Performs the rotation for an unlimited (regular) rotation
     * @param {Array} arr
     * @param {Object} result
     * @returns {Object}
     */
    function arrayRotateUnlimited (arr, result) {
        var obj, att, i = arr.length;

        for (;i;) {
            obj = arr[--i];

            // All variables submit to for-in loops
            for (att in obj) {
                if ( obj.hasOwnProperty(att) ) {
                    if ( result[att] === undefined ) {
                        result[att] = [];
                    }
                    result[att][i] = obj[att];
                }
            }
        }

        return result;
    }

    /**
     * Performs the rotation for a limited (partial) rotation
     * @param {Array} arr
     * @param {Object} result
     * @param {Array|boolean} limited
     * @returns {Object}
     */
    function arrayRotateLimited (arr, result, limited) {
        var objKeys, keyLen, obj, att, i, j;

        // Is limited the list of keys?
        if (isArray(limited)) {
            objKeys = limited;
        } else {
            // Get the keys for limited rotate
            objKeys = Object.keys(result);
        }

        keyLen = objKeys.length;

        // One pass to create any missing arrays
        for (i = 0; i < keyLen; i++) {
            att = objKeys[i];
            if (!result[att]) {
                result[att] = [];
            }
        }

        i = arr.length;

        for (;i;) {
            obj = arr[--i];

            // All variables submit to for-in loops
            // JSHint hates it, but Object.keys
            for (j = 0; j < keyLen; j++) {

                att = objKeys[j];
                result[att][i] = obj[att];
            }

        }

        return result;
    }

    /**
     * Rotate an array of row-data into a column-data object
     * @param {Array} arr
     * @param {Object} [result] Result object to use
     * @param {boolean} [limited] Only update keys passed on the result object, allowing a limited rotation
     * @returns {Object}
     */
    function arrayRotate (arr, result, limited) {

        // Not an array? Send it back.
        if ( !isArray(arr) ) {
            throw new TypeError("RC: Argument is not an array");
        }

        if ( !result || typeof result !== 'object' ) {
            if ( limited ) {
                throw new TypeError("RC: Must pass a result object when 'limited' is true");
            } else {
                result = {};
            }
        }

        // Explicit check: you could pass [0], limited could be falsy.
        if (limited !== undefined && limited !== false) {
            return arrayRotateLimited(arr, result, limited);

        }

        return arrayRotateUnlimited(arr, result);
    }

    /**
     * Performs a filter on a field and returns an array of matching indexes.
     * @param obj
     * @param field
     * @param filter
     * @returns {Array}
     */
    function filterIndexes (obj, field, filter) {
        var indexes = [];

        if ( obj.hasOwnProperty(field) ) {
            indexes = getIndexes(obj[field], filter);
        }
        return indexes;
    }

    /**
     * Filters all properties in a column-data object using an array of indexes.
     * @param {Object} obj
     * @param {Array} indexes
     * @returns {Object}
     */
    function filterMerge(obj, indexes) {
        var result = {},
            att;

        // Don't waste time if tehre are no indexes to merge.
        if (indexes === undefined || !indexes.length) {
            return result;
        }

        for (att in obj) {
            if ( obj.hasOwnProperty(att) ) {
                result[att] = getByIndexes(obj[att], indexes);
            }
        }
        return result;
    }

    /**
     * Filter a column-data object for a particular field.
     * @param {Object} obj
     * @param {String} field
     * @param {Function|String} filter
     * @returns {*}
     */
    function objectFilter (obj, field, filter) {
        return filterMerge(obj, filterIndexes(obj, field, filter));
    }

    /**
     * Finds the longest length of any property in a column-data object.
     * @param {Object} obj
     * @returns {number}
     */
    function objectLength (obj) {
        var att, len = 0;

        // Get the longest length of all properties
        for (att in obj) {
            if ( obj.hasOwnProperty(att) ) {
                len = Math.max(len, obj[att].length);
            }
        }

        return len;
    }

    /**
     * Rotates column-data to row-data and optionally adds it to an existing array.
     * @param {Object} obj
     * @param {Array} [result] Optional array init which we should place rotated data.
     * @param {Boolean} [clearUndef]
     * @returns {Array}
     */
    function objectRotate (obj, result, clearUndef) {
        var att, i, resultIndex, len, resultOffset, output;

        // Don't replace parameters to avoid optimization issues.
        output = result || [];

        // Not an array? Send it back.
        if ( typeof obj !== 'object' ) {
            throw new TypeError("RC: Argument is not an object");
        } else if ( !isArray(output) ) {
            throw new TypeError("RC: Result argument is not an array");
        }

        // Get the existing result array length
        resultOffset = output.length;
        len = objectLength(obj);

        for (i = 0; i < len; i++) {
            resultIndex = i + resultOffset;
            output[resultIndex] = {};

            for (att in obj) {
                if ( obj.hasOwnProperty(att) && ( !clearUndef || obj[att][i] !== undefined ) ) {
                    output[resultIndex][att] = obj[att][i];
                }
            }
        }

        return output;
    }

    /**
     * Create a
     * @param {Object} obj
     * @param {number} index
     * @param {Boolean} [clearUndef]
     * @param {Object} [result]
     * @returns {*}
     */
    function objFromIndex (obj, index, clearUndef, result) {
        var att;

        // Check for a passed result object, used by Proxy/objFromIndex
        if ( result === undefined ) {
            result = {};
        }

        for ( att in obj ) {
            if ( obj.hasOwnProperty(att) && ( !clearUndef || obj[att][index] !== undefined ) ) {
                result[att] = obj[att][index];
            }
        }

        return result;
    }

    /**
     * A generic rotate function that accepts row or column data to rotate.
     * @param {Object|Array} obj
     * @returns {Array|Object}
     */
    function rotate(obj) {
        // Generic, which directs to the appropriate array/object rotate
        if (typeof obj !== 'object') {
            throw new TypeError("RC: rotate requires an object or an array");
        }

        if ( isArray(obj) ) {
            return arrayRotate.apply(null, arguments);
        } else {
            return objectRotate.apply(null, arguments);
        }
    }

    /**
     * Increment over column-data like it was array data, making a "read-only" object for each index.
     * Does not prevent modification of values with complex data types (objects, arrays).
     * @param {Object} obj
     * @param {Function} fn
     */
    function readEach(obj, fn) {
        var len = objectLength(obj),
            i = 0;

        for (; i < len; i++) {
            fn(objFromIndex(obj, i));
        }
    }


    /**
     * Create an object and add a .commit() prototype to place the values back into the original.
     * Useful for moving simple data types around. Objects and arrays will be automatically referenced.
     * @constructor
     * @param {Object} obj - A columnar object
     * @param {number} index - The index to convert into a row-based object
     * @param {Boolean} [clearUndef] - Clear undefined attributes when copying the object.
     * @example
     * var proxyRow = new RCProxy(colData, index);
     */
    var RCProxy = (function() {
        var __obj = [],
            __idx = [],
            __clr = [],
            __this = [],
            guid = 0;

        /**
         * Uses a private array to locate the same object, so the proxy doesn't expose itself to modification.
         * We compare the passed object against an array of existing RCProxy objects; basically pointer comparison.
         * @param {RCProxy} proxy
         * @returns {number} The proxy ID to allow commit and destroy to locate the correct element
         * @private
         */
        function __getId(proxy) {
            var i = __this.length, pid;

            // Most likely to be at the end, so start there
            for (;i;) {
                i--;
                if (__this[i] === proxy) {
                    pid = i;
                    break;
                }
            }

            if (pid === undefined) {
                throw new ReferenceError("Proxy is finalized and cannot be used again.");
            }
            return pid;
        }

        /**
         * The actual RCProxy constructor.
         * @param {Object} obj
         * @param {number} index
         * @param {Boolean} [clearUndef]
         * @constructor
         */
        function RCProxy (obj, index, clearUndef) {

            // Increment the guid
            ++guid;

            // Set the private data.
            __obj[guid] = obj;
            __idx[guid] = index;
            __clr[guid] = clearUndef;
            __this[guid] = this;

            // Call reusable code for objFromIndex
            objFromIndex(obj, index, clearUndef, this);
        }

        // Defined inside the constructor to give it access to the originating object and parameters

        /**
         * Commits the changes from the proxy to the original.
         */
        RCProxy.prototype.commit = function(){
            var pid = __getId(this),
                obj = __obj[pid],
                index = __idx[pid],
                clearUndef = __clr[pid],
                att;

            for ( att in this ) {
                if ( att !== '__rcProxyId' && this.hasOwnProperty(att) && ( !clearUndef || this[att] !== undefined ) ) {
                    obj[att][index] = this[att];
                }
            }
        };

        /**
         * Removes the proxy to prevent memory leaks
         */
        RCProxy.prototype.destroy = function() {
            var pid = __getId(this);
            delete __this[pid];
            delete __obj[pid];
            delete __idx[pid];
            delete __clr[pid];
        };

        /**
         * Commit and destroy the proxy, as a single step
         */
        RCProxy.prototype.finalize = function() {
            this.commit();
            this.destroy();
        };

        return RCProxy;
    }());

    /**
     * Create a proxy
     * @param obj
     * @param index
     * @param clearUndef
     */
    function proxyFromIndex (obj, index, clearUndef) {
        return new RCProxy(obj, index, clearUndef);
    }

    /**
     * Increment over column-data like it was array data, making a proxy object for each index.
     * @param {Object} obj
     * @param {Function} fn
     */
    function objEach(obj, fn) {
        var len = objectLength(obj),
            i = 0,
            prox;

        for ( ; i < len; i++) {
            prox = new RCProxy(obj, i);

            fn(prox, i);

            prox.finalize();
        }
    }

    /*--------------------------------------------------------------------------*/

    return {
        rotate: rotate,
        proxy: proxyFromIndex,
        array: {
            getIndexes: getIndexes,
            getByIndexes: getByIndexes,
            rotate: arrayRotate
        },
        object: {
            filter: objectFilter,
            filterIndexes: filterIndexes,
            filterMerge: filterMerge,
            rotate: objectRotate,
            objFromIndex: objFromIndex,
            proxy: proxyFromIndex,
            readEach: readEach,
            each: objEach,
            objLength: objectLength
        },
        VERSION: version,
        test: {
            isArray: isArray
        }
    };
}));

