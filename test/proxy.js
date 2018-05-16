const assert = require('assert');
const rowcol = require('../src/rowcol');

const colData = {
  id: [1, 2, 3],
  name: ['A', 'B', 'C'],
  approved: [true, true, false],
};
const colDataWithUndefined = {
  id: [1, 2, 3],
  name: ['A', undefined, 'C'],
  approved: [true, true, false],
};

describe('rowcol', () => {
  describe('#proxy', () => {
    /* Proxy Test */
    let prox = rowcol.proxy(colData, 1);

    it('should not commit when the value is set', () => {
      prox.approved = false;
      assert.equal(colData.approved[1], true, 'proxy: commit prior value');
    });

    it('should update the value when commit is called', () => {
      prox.commit();
      assert.equal(colData.approved[1], false, 'proxy: commit value mismatch');
    });

    it('should not commit when the value is set', () => {
      prox.name = 'D';
      assert.equal(colData.name[1], 'B', 'proxy: finalize prior value');
    });

    it('should update the value when finalize is called', () => {
      prox.finalize();
      assert.equal(colData.name[1], 'D', 'proxy: finalize value mismatch');
    });

    it('should not permit changes after finalize', () => {
      assert.throws(() => {
        prox.commit();
      }, ReferenceError);
    });

    it('should support clearUndef', () => {
      prox = rowcol.proxy(colDataWithUndefined, 1, true);

      assert.equal('name' in prox, false);

      // Add the name to the proxy
      prox.name = 'B';
      prox.commit();

      assert.equal(colDataWithUndefined.name[1], 'B');

      // clearUndef will not move undefineds back into the object
      prox.name = undefined;
      prox.finalize();

      assert.equal(colDataWithUndefined.name[1], 'B');
    });
  });
});
