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

        /* Explicit Objecy Rotates */
        describe('#rotate', function(){
           it('should return an array of objects', function(){
               assert.equal(JSON.stringify(rowcol.object.rotate(colData)), rowString, "col->row rotation - explicit");
           });
        });

        /* Filters */
        describe('#filterIndexes', function(){

            it('should filter to two indexes: 0 & 1', function(){
                var filtTest = rowcol.object.filterIndexes(colData, "approved", true);
                assert(filtTest.length === 2 && filtTest[0] === 0 && filtTest[1] === 1);
            });

            it('should filter to one result for index 2', function(){
                var filtTest = rowcol.object.filterIndexes(colData, "approved", false)
                assert(filtTest.length === 1 && filtTest[0] === 2);
            });

        });

        /* ObjFromIndex */
        describe('#objFromIndex', function(){
            var idxTest = rowcol.object.objFromIndex(colData, 1);
            assert.equal(idxTest.name,colData.name[1]);

            idxTest.name = "M";
            assert.equal(colData.name[1], "B", "objFromIndex: value linked to original");

            assert(idxTest.hasOwnProperty("commit") === false, "objFromIndex: provides proxy interface");
        });

        /* Each Tests */
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