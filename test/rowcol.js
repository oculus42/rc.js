var assert = require("assert");
var rowcol = require("../rowcol");

var rowData = [
	{ id: 1, name: "A", approved: true},
	{ id: 2, name: "B", approved: true},
	{ id: 3, name: "C", approved: false}
],
	colData = {
		id: [1,2,3],
		name: ["A","B","C"],
		approved: [true,true,false]
    },
    colString = JSON.stringify(colData),
    rowString = JSON.stringify(rowData);

describe('rowcol', function(){
    describe('object', function(){

        /* Simple Length Test */
        describe('#objLength', function(){
            it('should return the number of array entries of the first key', function(){
                assert.equal(rowcol.object.objLength(colData), 3);
            });
        });

        /* Explicit Object Rotates */
        describe('#rotate', function(){
            it('should return an array of objects', function(){
                assert.equal(JSON.stringify(rowcol.object.rotate(colData)), rowString, "col->row rotation - explicit");
            });

            /* Rotate into Tests */
            var baseResult = [{
                    id: 5,
                    name: 'E',
                    approved: false
                }],
                final = rowcol.object.rotate(colData, baseResult);

            it('should modify the passed result', function(){
                assert.equal(baseResult, final);
            });

            it('should not overwrite existing results', function(){
                assert.equal(final.length, 4);
                assert.equal(final[0].name, "E");
                assert.equal(final[3].name, "C");
            });


            it('should not care about existing result types', function(){

                assert.doesNotThrow(function() {
                    final = rowcol.object.rotate(colData, [1,2,3]);
                });

                assert.equal(final.length, 6);
            });
        });

        /* Filters */
        describe('#filterIndexes', function(){

            it('should filter Boolean values', function(){
                var filtTest = rowcol.object.filterIndexes(colData, "approved", true);
                assert(filtTest.length === 2 && filtTest[0] === 0 && filtTest[1] === 1);
            });

            it('should filter string values', function(){
                var filtTest = rowcol.object.filterIndexes(colData, "name", "B");
                assert(filtTest.length === 1 && filtTest[0] === 1);
            });

            it('should filter using a function', function(){
                var filtTest = rowcol.object.filterIndexes(colData, "id", function(idx, val){ return val > 1; });
                assert(filtTest.length === 2 && filtTest[0] === 1 && filtTest[1] === 2);
            });

            it('should return an empty array for no matches', function(){
                var filtTest = rowcol.object.filterIndexes(colData, "name", "Q");
                assert.equal(filtTest.length, 0);
            })

        });

        describe('#filterMerge', function(){
            it('should return an empty object when passed no indexes', function(){
                var mergeResult = rowcol.object.filterMerge(colData);
                assert.equal(Object.keys(mergeResult).length, 0);
            });

            it('should return an empty object when passed empty indexes', function(){
                var mergeResult = rowcol.object.filterMerge(colData, []);
                assert.equal(Object.keys(mergeResult).length, 0);
            });

            it('should return an object when passed an index of [0]', function(){
                var mergeResult = rowcol.object.filterMerge(colData, [0]);
                assert.equal(Object.keys(mergeResult).length, 3);
            });

        });

        /* ObjFromIndex */
        describe('#objFromIndex', function(){
            var idxTest = rowcol.object.objFromIndex(colData, 1);

            it('should extract the values for the appropriate index', function(){
                assert.equal(idxTest.name,colData.name[1]);
            });

            it('should not modify the original (arrays/object values excepted)', function(){
                idxTest.name = "M";
                assert.equal(colData.name[1], "B", "objFromIndex: value linked to original");
            });

            it('should not be a Proxy', function(){
                assert(idxTest.hasOwnProperty("commit") === false, "objFromIndex: provides proxy interface");
            });

            /* Object merge tests */
            var mergeObj = { test: true},
                resultObj;
            it('should accept an existing object', function(){
                assert.doesNotThrow(function(){
                    resultObj = rowcol.object.objFromIndex(colData,1, undefined, mergeObj);
                });
            });

            resultObj = rowcol.object.objFromIndex(colData,1, undefined, mergeObj);
            it('should modify the passed result object', function(){
                assert.equal(mergeObj, resultObj);
                assert.equal(resultObj.name, 'B');
            });

        });

        /* readEach Tests */
        describe('#readEach', function() {

            var eachLen = 0;

            rowcol.object.readEach(colData, function (obj, idx) {
                eachLen++;
                obj.id = 4;
            });

            assert(eachLen === 3, "readEach: not looping through entire object");

            assert(colData.id[0] === 1, "readEach: able to edit original");
        });

        /* Each Tests */
        describe('#each', function(){
            var colData = colData = {
                    id: [1,2,3],
                    name: ["A","B","C"],
                    approved: [true,true,false]
                },
                eachLen = 0;

            rowcol.object.each(colData, function(obj, idx){
                eachLen++;
                obj.id = 4;
            });

            assert(colData.id.toString() === '4,4,4', "each: changes were not permanent");
        });

    });

    describe('array', function(){
        /* Explicit Rotates */
        describe('#rotate', function(){
            it('should return an object of arrays', function(){
                assert.equal(JSON.stringify(rowcol.array.rotate(rowData)), colString, "row->col rotation - explicit");
            });
        });
    });

    /* Generic rotates (should work as above) */
    describe('#rotate', function(){
        it('should rotate like the explicit object.rotate and array.rotate', function(){
            assert.equal(JSON.stringify(rowcol.rotate(rowData)), colString, "row->col rotation - generic");
            assert.equal(JSON.stringify(rowcol.rotate(colData)), rowString, "col->row rotation - generic");
        });
    });

    describe('#proxy',function(){
        /* Proxy Test */
        var prox = rowcol.proxy(colData, 1);

        it('should not commit when the value is set',function(){
            prox.approved = false;
            assert.equal(colData.approved[1], true, "proxy: commit prior value");
        });

        it('should update the value when commit is called',function(){
            prox.commit();
            assert.equal(colData.approved[1], false, "proxy: commit value mismatch");
        });

        it('should not commit when the value is set',function(){
            prox.name = "D";
            assert.equal(colData.name[1], "B", "proxy: finalize prior value");
        });

        it('should update the value when finalize is called',function(){
            prox.finalize();
            assert.equal(colData.name[1], "D", "proxy: finalize value mismatch");
        });

        it('should not permit changes after finalize',function(){
            assert.throws(function(){ prox.commit(); }, ReferenceError);
        });

    });
});