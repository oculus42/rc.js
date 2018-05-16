/**
 * rowcol - a library for row-column data manipulation
 * @module rowcol
 * @author Samuel Rouse <samuel.rouse@gmail.com>
 * @license MIT http://opensource.org/licenses/MIT
 */


/*--------------------------------------------------------------------------*/
/*
 * Constants and basic settings
 * Structure and code from Lo-Dash 2.4.1 <http://lodash.com/>
 */

const version = '3.0.0';

/*--------------------------------------------------------------------------*/

/* Functions */
const { has } = require('./util');


/**
 * Indicates if the passed object is an array
 * @param {*} obj
 * @returns {boolean}
 */
function isArray(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]';
}

function getIndexesWithFunction(array, filter) {
  const indexes = [];
  const len = array.length;
  let i;

  for (i = 0; i < len; i += 1) {
    if (filter(array[i], i)) {
      indexes.push(i);
    }
  }

  return indexes;
}

function getIndexesWithValue(array, filter) {
  const indexes = [];
  const len = array.length;
  let i;

  for (i = 0; i < len; i += 1) {
    if (array[i] === filter) {
      indexes.push(i);
    }
  }

  return indexes;
}

/**
 * Returns an array of indexes that match a filter string or function.
 * @param {Array} array Array of values to match
 * @param {Function|String} filter Function or String to match array values.
 * @returns {Array} Array of indexes that match the filter.
 */
function getIndexes(array, filter) {
  if (typeof filter === 'function') {
    return getIndexesWithFunction(array, filter);
  }
  return getIndexesWithValue(array, filter);
}

/**
 * Returns the elements of an array using a list of selected indexes.
 * @param {Array} array
 * @param {Array} indexes
 * @returns {Array}
 */
function getByIndexes(array, indexes) {
  let i;
  const len = indexes.length;
  const data = [];

  for (i = 0; i < len; i += 1) {
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
function arrayRotateUnlimited(arr, result) {
  return arr.reduce((res, obj, i) => Object.entries(obj).reduce((acc, [key, val]) => {
    if (acc[key] === undefined) {
      acc[key] = [];
    }
    acc[key][i] = val;
    return acc;
  }, res), result);
}

/**
 * Performs the rotation for a limited (partial) rotation
 * @param {Array} arr
 * @param {Object} result
 * @param {Array|boolean} limited
 * @returns {Object}
 */
function arrayRotateLimited(arr, result, limited) {
  let obj;
  let att;

  // If this is limited to the list of keys, get the keys for limited rotate
  // One pass to eliminate any unusable keys and create missing arrays
  const objKeys = (isArray(limited) ? limited : Object.keys(result)).filter((key) => {
    // Create arrays for missing keys
    if (undefined === result[key]) {
      result[key] = [];
      return true;
    }

    // Check if existing keys are arrays
    return isArray(result[key]);
  });

  const keyLen = objKeys.length;

  for (let i = arr.length; i;) {
    i -= 1;
    obj = arr[i];

    // All variables submit to for-in loops
    // JSHint hates it, but Object.keys
    for (let j = 0; j < keyLen; j += 1) {
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
 * @param {boolean} [limited] Only update keys on the result object; a limited rotation
 * @returns {Object}
 */
function arrayRotate(arr, result, limited = false) {
  const data = result || {};

  // Not an array? Send it back.
  if (!isArray(arr)) {
    throw new TypeError('RC: Argument is not an array');
  }

  if (limited && (typeof result !== 'object' || result === undefined)) {
    throw new TypeError("RC: Must pass a result object when 'limited' is true");
  }

  // Explicit check: you could pass [0], limited could be falsy.
  if (limited !== undefined && limited !== false) {
    return arrayRotateLimited(arr, data, limited);
  }

  return arrayRotateUnlimited(arr, data);
}

/**
 *
 * @param obj
 * @param field
 * @param filter
 * @returns {Array}
 */
function filterIndexes(obj, field, filter) {
  let indexes = [];

  if (has(obj, field)) {
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
  // Don't waste time if there are no indexes to merge.
  if (indexes === undefined || !indexes.length) {
    return {};
  }

  return Object.entries(obj).reduce((acc, [key, val]) => {
    acc[key] = getByIndexes(val, indexes);
    return acc;
  }, {});
}

/**
 * Filter a column-data object for a particular field.
 * @param {Object} obj
 * @param {String} field
 * @param {Function|String} filter
 * @returns {*}
 */
function objectFilter(obj, field, filter) {
  return filterMerge(obj, filterIndexes(obj, field, filter));
}

/**
 * Finds the longest length of any property in a column-data object.
 * @param {Object} obj
 * @returns {number}
 */
function objectLength(obj) {
  return Math.max(0, ...Object.values(obj).map(arr => arr.length));
}

/**
 * Error throwing for object rotate
 * @param {Object} obj
 * @param result
 */
function objectRotateErrors(obj, result) {
  // Not an array? Send it back.
  if (typeof obj !== 'object') {
    throw new TypeError('RC: Argument is not an object');
  }

  // If a result is passed and isn't an array, send it back.
  if (undefined !== result && !isArray(result)) {
    throw new TypeError('RC: Result argument is not an array');
  }
}

/**
 * Rotates column-data to row-data and optionally adds it to an existing array.
 * @param {Object} obj
 * @param {Array} [result] Optional array init which we should place rotated data.
 * @param {Boolean} [clearUndef]
 * @returns {Array}
 */
function objectRotate(obj, result, clearUndef) {
  // Call out for errors
  objectRotateErrors(obj, result);

  // Don't replace parameters to avoid optimization issues.
  const output = result || [];

  // Get the existing result array length
  const resultOffset = output.length;

  const len = objectLength(obj);

  for (let i = 0; i < len; i += 1) {
    output[i + resultOffset] = Object.entries(obj).reduce((acc, [key, val]) => {
      if (!clearUndef || val[i] !== undefined) {
        acc[key] = val[i];
      }
      return acc;
    }, {});
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
function objFromIndex(obj, index, clearUndef, result = {}) {
  return Object.entries(obj).reduce((acc, [key, val]) => {
    if (!clearUndef || val[index] !== undefined) {
      acc[key] = val[index];
    }
    return acc;
  }, result);
}

/**
 * A generic rotate function that accepts row or column data to rotate.
 * @param {Object|Array} obj
 * @param {...*} [args]
 * @returns {Array|Object}
 */
function rotate(obj, ...args) {
  // Generic, which directs to the appropriate array/object rotate
  if (typeof obj !== 'object') throw new TypeError('RC: rotate requires an object or an array');

  if (isArray(obj)) {
    return arrayRotate(obj, ...args);
  }
  return objectRotate(obj, ...args);
}

/**
 * Increment over column-data like it was array data, making a "read-only" object for each index.
 * Does not prevent modification of values with complex data types (objects, arrays).
 * @param {Object} obj
 * @param {Function} fn
 */
function readEach(obj, fn) {
  const len = objectLength(obj);

  for (let i = 0; i < len; i += 1) {
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
 * var proxyRow = new RowcolProxy(colData, index);
 */
const RCProxy = (function () {
  // TODO - swap out for ES6 proxy object
  const proxyObj = [];
  const proxyIdx = [];
  const proxyClearFlag = [];
  const proxyThis = [];
  let guid = 0;

  /**
   * Uses a private array to locate the same object,
   * so the proxy doesn't expose itself to modification.
   * We compare the passed object against an array of existing RowcolProxy objects;
   * basically pointer comparison.
   * @param {RowcolProxy} proxy
   * @returns {number} The proxy ID to allow commit and destroy to locate the correct element
   * @private
   */
  function proxyGetId(proxy) {
    let pid;

    // Most likely to be at the end, so start there
    for (let i = proxyThis.length; i;) {
      i -= 1;
      if (proxyThis[i] === proxy) {
        pid = i;
        break;
      }
    }

    if (pid === undefined) {
      throw new ReferenceError('Proxy is finalized and cannot be used again.');
    }
    return pid;
  }

  /**
   * The actual RowcolProxy constructor.
   * @param {Object} obj
   * @param {number} index
   * @param {Boolean} [clearUndef]
   * @constructor
   */
  function RowcolProxy(obj, index, clearUndef) {
    // Increment the guid
    guid += 1;

    // Set the private data.
    proxyObj[guid] = obj;
    proxyIdx[guid] = index;
    proxyClearFlag[guid] = clearUndef;
    proxyThis[guid] = this;

    // Call reusable code for objFromIndex
    objFromIndex(obj, index, clearUndef, this);
  }

  // Defined inside the constructor to give it access to the originating object and parameters

  /**
   * Commits the changes from the proxy to the original.
   */
  RowcolProxy.prototype.commit = function () {
    const pid = proxyGetId(this);
    const obj = proxyObj[pid];
    const index = proxyIdx[pid];
    const clearUndef = proxyClearFlag[pid];

    Object.entries(this).reduce((acc, [key, val]) => {
      if (key === '__rcProxyId') {
        return acc;
      }
      if (!clearUndef || val !== undefined) {
        acc[key][index] = val;
      }
      return acc;
    }, obj);
  };

  /**
   * Removes the proxy to prevent memory leaks
   */
  RowcolProxy.prototype.destroy = function () {
    const pid = proxyGetId(this);
    delete proxyThis[pid];
    delete proxyObj[pid];
    delete proxyIdx[pid];
    delete proxyClearFlag[pid];
  };

  /**
   * Commit and destroy the proxy, as a single step
   */
  RowcolProxy.prototype.finalize = function () {
    this.commit();
    this.destroy();
  };

  return RowcolProxy;
}());

/**
 * Create a proxy
 * @param obj
 * @param index
 * @param clearUndef
 */
function proxyFromIndex(obj, index, clearUndef) {
  return new RCProxy(obj, index, clearUndef);
}

/**
 * Increment over column-data like it was array data, making a proxy object for each index.
 * @param {Object} obj
 * @param {Function} fn
 */
function objEach(obj, fn) {
  const len = objectLength(obj);
  let i = 0;
  let prox;

  for (; i < len; i += 1) {
    prox = new RCProxy(obj, i);

    fn(prox, i);

    prox.finalize();
  }
}

/*--------------------------------------------------------------------------*/

const rowcol = {
  rotate,
  proxy: proxyFromIndex,
  array: {
    getIndexes,
    getByIndexes,
    rotate: arrayRotate,
  },
  object: {
    filter: objectFilter,
    filterIndexes,
    filterMerge,
    rotate: objectRotate,
    objFromIndex,
    proxy: proxyFromIndex,
    readEach,
    each: objEach,
    objLength: objectLength,
  },
  VERSION: version,
  test: {
    isArray,
  },
};

/*--------------------------------------------------------------------------*/

module.exports = rowcol;
