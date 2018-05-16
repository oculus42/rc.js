const assert = require('assert');
const rowcol = require('../src/rowcol');
const { has } = require('../src/util');

const rowData = [
  { id: 1, name: 'A', approved: true },
  { id: 2, name: 'B', approved: true },
  { id: 3, name: 'C', approved: false },
];
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
const colString = JSON.stringify(colData);
const rowString = JSON.stringify(rowData);

describe('rowcol', () => {
  describe('object', () => {
    /* Simple Length Test */
    describe('#objLength', () => {
      it('should return the number of array entries of the first key', () => {
        assert.equal(rowcol.object.objLength(colData), 3);
      });

      it('should return zero for an empty object', () => {
        assert.equal(rowcol.object.objLength(Object.create(null)), 0);
      });
    });

    /* Explicit Object Rotates */
    describe('#rotate', () => {
      it('should return an array of objects', () => {
        assert.equal(JSON.stringify(rowcol.object.rotate(colData)), rowString, 'col->row rotation - explicit');
      });

      /* Rotate into Tests */
      const baseResult = [{
        id: 5,
        name: 'E',
        approved: false,
      }];
      let final = rowcol.object.rotate(colData, baseResult);

      it('should modify the passed result', () => {
        assert.equal(baseResult, final);
      });

      it('should not overwrite existing results', () => {
        assert.equal(final.length, 4);
        assert.equal(final[0].name, 'E');
        assert.equal(final[3].name, 'C');
      });


      it('should accept only array and undefined as results', () => {
        assert.doesNotThrow(() => {
          final = rowcol.object.rotate(colData, [1, 2, 3]);
        });

        assert.equal(final.length, 6);

        assert.doesNotThrow(() => {
          final = rowcol.object.rotate(colData, undefined);
        });
      });

      it('should throw if not an object', () => {
        assert.throws(() => {
          rowcol.object.rotate('string');
        });
      });

      it('should throw if not an result is the wrong type', () => {
        assert.throws(() => {
          final = rowcol.object.rotate(colData, 'string');
        });
      });

      it('should ignore undefined values when clearUndef is true', () => {
        final = rowcol.object.rotate(colDataWithUndefined, undefined, true);

        assert.equal('name' in final[1], false);
      });
    });

    /* Filters */
    describe('#filter', () => {
      const aResult = '{"id":[1],"name":["A"],"approved":[true]}';

      it('should accept a string value', () => {
        const filtTest = rowcol.object.filter(colData, 'name', 'A');
        assert.equal(JSON.stringify(filtTest), aResult);
      });

      it('should accept a Boolean value', () => {
        const filtTest = rowcol.object.filter(colData, 'approved', true);
        assert.equal(filtTest.name.length, 2);
      });

      it('should accept a filter function', () => {
        const filtTest = rowcol.object.filter(colData, 'name', val => val === 'A');
        assert.equal(JSON.stringify(filtTest), aResult);
      });

      it('should return an empty object no matches', () => {
        const filtTest = rowcol.object.filter(colData, 'name', 'Q');
        assert.equal(JSON.stringify(filtTest), '{}');
      });
    });

    describe('#filterIndexes', () => {
      it('should filter Boolean values', () => {
        const filtTest = rowcol.object.filterIndexes(colData, 'approved', true);
        assert(filtTest.length === 2 && filtTest[0] === 0 && filtTest[1] === 1);
      });

      it('should filter string values', () => {
        const filtTest = rowcol.object.filterIndexes(colData, 'name', 'B');
        assert(filtTest.length === 1 && filtTest[0] === 1);
      });

      it('should filter using a function', () => {
        const filtTest = rowcol.object.filterIndexes(colData, 'id', val => val > 1);
        assert(filtTest.length === 2 && filtTest[0] === 1 && filtTest[1] === 2);
      });

      it('should return an empty array for no matches', () => {
        const filtTest = rowcol.object.filterIndexes(colData, 'name', 'Q');
        assert.equal(filtTest.length, 0);
      });
    });

    describe('#filterMerge', () => {
      it('should return an empty object when passed no indexes', () => {
        const mergeResult = rowcol.object.filterMerge(colData);
        assert.equal(Object.keys(mergeResult).length, 0);
      });

      it('should return an empty object when passed empty indexes', () => {
        const mergeResult = rowcol.object.filterMerge(colData, []);
        assert.equal(Object.keys(mergeResult).length, 0);
      });

      it('should return an object when passed an index of [0]', () => {
        const mergeResult = rowcol.object.filterMerge(colData, [0]);
        assert.equal(Object.keys(mergeResult).length, 3);
      });
    });

    /* ObjFromIndex */
    describe('#objFromIndex', () => {
      const idxTest = rowcol.object.objFromIndex(colData, 1);

      it('should extract the values for the appropriate index', () => {
        assert.equal(idxTest.name, colData.name[1]);
      });

      it('should not modify the original (arrays/object values excepted)', () => {
        idxTest.name = 'M';
        assert.equal(colData.name[1], 'B', 'objFromIndex: value linked to original');
      });

      it('should not be a Proxy', () => {
        assert(has(idxTest, 'commit') === false, 'objFromIndex: provides proxy interface');
      });

      /* Object merge tests */
      const mergeObj = { test: true };
      let resultObj;

      it('should accept an existing object', () => {
        assert.doesNotThrow(() => {
          resultObj = rowcol.object.objFromIndex(colData, 1, undefined, mergeObj);
        });
      });

      resultObj = rowcol.object.objFromIndex(colData, 1, undefined, mergeObj);
      it('should modify the passed result object', () => {
        assert.equal(mergeObj, resultObj);
        assert.equal(resultObj.name, 'B');
      });

      const undefTest = rowcol.object.objFromIndex(colDataWithUndefined, 1, true);

      it('should ignore undefined values with clearUndef', () => {
        assert.equal('name' in undefTest, false);
      });
    });

    /* readEach Tests */
    describe('#readEach', () => {
      let eachLen = 0;

      rowcol.object.readEach(colData, (obj) => {
        eachLen += 1;
        // eslint-disable-next-line
        obj.id = 4; // Intentional "bad" edit
      });

      it('should loop through each index', () => {
        assert(eachLen === 3, 'readEach: not looping through entire object');
      });

      it('should not allow simple values to be edited', () => {
        assert(colData.id[0] === 1, 'readEach: able to edit original');
      });
    });

    /* Each Tests */
    describe('#each', () => {
      const newData = {
        id: [1, 2, 3],
        name: ['A', 'B', 'C'],
        approved: [true, true, false],
      };
      let eachLen = 0;

      rowcol.object.each(newData, (obj) => {
        eachLen += 1;
        // eslint-disable-next-line
        obj.id = 4; // Intentional "bad" edit
      });

      it('should loop through each index', () => {
        assert(eachLen === 3, 'readEach: not looping through entire object');
      });

      it('should commit changes to the original object', () => {
        assert(newData.id.toString() === '4,4,4', 'each: changes were not permanent');
      });
    });
  });

  describe('array', () => {
    /* Explicit Rotates */
    describe('#rotate', () => {
      it('should return an object of arrays', () => {
        assert.equal(JSON.stringify(rowcol.array.rotate(rowData)), colString, 'row->col rotation - explicit');
      });

      it('should rotate into an existing object', () => {
        const existingObj = { extra: true };
        const resultObj = rowcol.array.rotate(rowData, existingObj);
        assert.equal(resultObj.extra, true);
      });

      it('should perform a limited rotate', () => {
        const limitedObj = rowcol.array.rotate(rowData, { name: [], approved: [] }, true);
        const limitedObj2 = rowcol.array.rotate(rowData, {}, ['name', 'approved']);

        assert.equal(limitedObj.id, undefined);
        assert.equal(limitedObj2.id, undefined);
        assert.equal(limitedObj.toString(), limitedObj2.toString());
      });

      it('should not overwrite existing properties of a passed value', () => {
        // TODO: A passed array will be overwritten. Not sure of the direction to take.
        const resultObject = rowcol.array.rotate(rowData, { name: true, approved: [] }, true);
        assert.equal(resultObject.name, true);
        assert.equal(typeof resultObject.name, 'boolean');
      });

      it('should throw an exception if it does not receive an array', () => {
        assert.throws(() => {
          rowcol.array.rotate(colData, { name: true, approved: [] }, true);
        });
      });

      it('should throw if no result object with limited', () => {
        assert.throws(() => {
          rowcol.array.rotate(rowData, undefined, true);
        });
      });
    });
  });

  /* Generic rotates (should work as above) */
  describe('#rotate', () => {
    it('should rotate like the explicit object.rotate and array.rotate', () => {
      assert.equal(JSON.stringify(rowcol.rotate(rowData)), colString, 'row->col rotation - generic');
      assert.equal(JSON.stringify(rowcol.rotate(colData)), rowString, 'col->row rotation - generic');
    });

    it('should throw with a bad data type', () => {
      assert.throws(() => {
        rowcol.rotate('string');
      });
    });
  });

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

  describe('#rotate', () => {

  });
});
