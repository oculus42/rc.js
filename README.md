rc.js - Row/Column Data Manipulation
=====

While JSON arrays of objects are very familiar for representing collections of data and map nicely to row-based storage in databases, they are inefficient for transmission, storage, and filtering. "Rows" are good for interacting with a specific record, but not for *finding* that record.

**rc.js** provides tools for converting between rows and columns and interacting with columnar data.

Performance Comparisons
---
*  [Single Column Filter](http://jsperf.com/rc-simple) — For simple single-column comparisons, rc is 40-400% faster.
*  More to come.

Problems with Rows
----
*  Each JSON row includes a header (the key in a key-value pair) for each record. For heterogeneous data, rearranging this into columns removes the weight of the header during transmission. Rows with optional keys add `undefined` values, but may still be smaller depending on column counts and names.
*  Many data filters are applied to columns (`price > 50.00` or `active == true`), requiring incrementing across all objects even though you only want one particular attribute.

Benefits of Columns
----
*  Heterogeneous data is transmitted in a more compact format. Two real-world test objects with complex, multi-level data saw substantial reductions (row/column rotation was performed on multiple levels):
  *  10936 became 7117 characters for a ~35% reduction.
  *  123903 became 90892 characters for a ~27% reduction.
  *  TODO: Synthetic tests and JSPerf examples.
*  Filters return arrays of indexes for easy set manipulation (union, intersection, difference). In fairness you could do this with rows, but it is a requirement of column-oriented filtering
*  Some column filters can be performed with simple comparisons: no filter function overhead.

Problems with Columns
----
*  There is no native column-based filtering.
*  Columns are inconvenient for interacting with a single record (row).
*  Lack of 3rd-party library support for columns.


RC Solutions
----
###Filter
The simple column-based filter supports strict comparison intended for primitive types or a filter function. For all filter actions, the original object is not modified, but complex data types are referenced. Filters are broken into three functions:
*  `rc.object.filter(obj, field, filter)` - Basic filter action returns a result set based on a field name and a filter.
*  `rc.object.filterIndexes(obj, field, filter)` - Takes the same arguments as `rc.object.filter` but returns the indexes of the filter action. This is useful for more complex set manipulation.
*  `rc.object.filterMerge(obj, indexes)` - Allows a filter action with an external source of indexes.

###Proxy
Extracting a row for viewing and interaction is convenient, but changes to primitive types on the "view" object will not be reflected on the original column-based store. **Proxy** objects add `.prototype.commit()` to update the source columns and keep your data consistent.

###Rotate
RC provides `rc.rotate` to convert arrays of objects (rows) and objects of arrays (columns) back and forth. This allows the compact transmission of columns while existing row-based code. Performance testing is recommended if you are rotating large datasets.

###RC Chaining
An object can be made into an `RC` object to support chaining of the following methods:
*  `filter` - Calls `rc.object.filter` and provides the result in an RC object for continued chaining.
*  `proxy` - Calls `rc.object.proxy` and returns a Proxy object. Ends the chain.
*  `rotate` - Call `rc.object.rotate`, converting a column-based object of arrays into a row-based array of objects. Ends the chain.
