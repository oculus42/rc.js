const { objFromIndex } = require('./util');

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

const proxyObj = [];
const proxyIdx = [];
const proxyClearFlag = [];
const proxyThis = [];
let guid = 0;

/**
 * Uses a private array to locate the same object,
 * so the proxy doesn't expose itself to modification.
 * We compare the passed object against an array of existing RCProxy objects;
 * basically pointer comparison.
 * @param {RCProxy} proxy
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
 * The actual RCProxy constructor.
 * @param {Object} obj
 * @param {number} index
 * @param {Boolean} [clearUndef]
 * @constructor
 */
function RCProxy(obj, index, clearUndef) {
  // Set the private data.
  proxyObj[guid] = obj;
  proxyIdx[guid] = index;
  proxyClearFlag[guid] = clearUndef;
  proxyThis[guid] = this;

  // Call reusable code for objFromIndex
  objFromIndex(obj, index, clearUndef, this);

  // Increment the guid
  guid += 1;
}

// Defined inside the constructor to give it access to the originating object and parameters

/**
 * Commits the changes from the proxy to the original.
 */
RCProxy.prototype.commit = function commit() {
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
RCProxy.prototype.destroy = function destroy() {
  const pid = proxyGetId(this);
  delete proxyThis[pid];
  delete proxyObj[pid];
  delete proxyIdx[pid];
  delete proxyClearFlag[pid];
};

/**
 * Commit and destroy the proxy, as a single step
 */
RCProxy.prototype.finalize = function finalize() {
  this.commit();
  this.destroy();
};

module.exports = RCProxy;
