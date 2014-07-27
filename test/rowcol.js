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
	};

/* Simple Length Test */
assert.equal(rowcol.object.objLength(colData), 3, "objLength")

/* Explicit Rotates */
assert.equal(JSON.stringify(rowcol.array.rotate(rowData)), JSON.stringify(colData), "row->col rotation - explicit");
assert.equal(JSON.stringify(rowcol.object.rotate(colData)), JSON.stringify(rowData), "col->row rotation - explicit");

/* Generic rotates (should work as above) */
assert.equal(JSON.stringify(rowcol.rotate(rowData)), JSON.stringify(colData), "row->col rotation - generic");
assert.equal(JSON.stringify(rowcol.rotate(colData)), JSON.stringify(rowData), "col->row rotation - generic");

/* Filters */
var filtTest = rowcol.object.filterIndexes(colData, "approved", true)
assert(filtTest.length === 2 && filtTest[0] === 0 && filtTest[1] === 1, "filterIndexes: basic match");

filtTest = rowcol.object.filterIndexes(colData, "approved", false)
assert(filtTest.length === 1 && filtTest[0] === 2, "filterIndexes: basic match part 2");

/* ObjFromIndex */
var idxTest = rowcol.object.objFromIndex(colData, 1);
assert.equal(idxTest.name,colData.name[1],"objFromIndex");

idxTest.name = "M";
assert.equal(colData.name[1], "B", "objFromIndex: value linked to original");

assert(idxTest.hasOwnProperty("commit") === false, "objFromIndex: provides proxy interface");

/* Proxy Test */
var prox = rowcol.proxy(colData, 1);

prox.approved = false;
assert.equal(colData.approved[1], true, "proxy: commit prior value");

prox.commit();
assert.equal(colData.approved[1], false, "proxy: commit value mismatch");

prox.name = "D";
assert.equal(colData.name[1], "B", "proxy: finalize prior value");

prox.finalize();
assert.equal(colData.name[1], "D", "proxy: finalize value mismatch");


/* Each Tests */
var eachLen = 0;
rowcol.object.readEach(colData, function(obj, idx){
	eachLen++;
	obj.id = 4;
});

assert(eachLen === 3,"readEach: not looping through entire object");

assert(colData.id[0] === 1, "readEach: able to edit original");

eachLen = 0;
rowcol.object.each(colData, function(obj, idx){
	eachLen++;
	obj.id = 4;
});

assert(colData.id.toString() === '4,4,4', "each: changes were not permanent");