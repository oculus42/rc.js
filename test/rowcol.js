var assert = require("assert");
var rowcol = require("rowcol");

var rowData = [
	{ id: 1, name: "A", approved: true},
	{ id: 2, name: "B", approved: true},
	{ id: 3, name: "C", approved: false},
],
	colData = {
		id: [1,2,3],
		name: ["A","B","C"],
		approved: [true,true,false]
	};

/* Explicit Rotates */
assert.equal(JSON.stringify(rowcol.array.rotate(rowData)), JSON.stringify(colData), "row->col rotation - explicit");
assert.equal(JSON.stringify(rowcol.object.rotate(colData)), JSON.stringify(rowData), "col->row rotation - explicit");
/* Generic rotates (should work as above) */
assert.equal(JSON.stringify(rowcol.rotate(rowData)), JSON.stringify(colData), "row->col rotation - generic");
assert.equal(JSON.stringify(rowcol.rotate(colData)), JSON.stringify(rowData), "col->row rotation - generic");

