/*jslint nomen: true */
/*global Buffer, console, require */

var fs = require('fs');

var CsvBufferReader = function (file, options) {
	'use strict';

	/**
	 * File to read...
	 */
	this.file = file;
	/**
	 * The amount of the file to read each time
	 */
	this.bufferSize = options.bufferSize || 1024;

	/**
	 * What mode are we opening this file, 666
	 * should be fine most of the time
	 */
	this.mode = options.mode || '0666';

	/**
	 * Encoding, node is standard on utf8 but never know
	 */
	this.encoding = options.encoding || 'utf8';

	/**
	 * Flag, for whatever reason this is nice to have as an option
	 */
	this.flag = options.flag || 'r';

	/**
	 * Unix, windows etc
	 */
	this.endOfLine = options.endOfLine || '\n';

	this._blankBuffer = null;
	this._bufferOffset = 0;
	this._fileOffset = 0;

	this._callback = null;
	this._finishedCallback = null;
	this._fd = null;
};

CsvBufferReader.prototype.parse = function (callback, finishedCallback) {
	'use strict';

	this._callback = callback || function () { };
	this._finishedCallback = finishedCallback || function () { };

	this._blankBuffer = new Buffer(this.bufferSize, this.encoding);
	this._bufferOffset = 0;
	this._fileOffset = 0;

	fs.open(this.file, this.flag, this.mode, function (err, fd) {
		this._fd = fd;

		this._grabBuffer();
	}.bind(this));
};

CsvBufferReader.prototype._handleBuffer = function (err, bytesRead, buffer) {
	'use strict';

	var lines = buffer.toString(),
		lastLine = lines.lastIndexOf(this.endOfLine),
		lineOffset = 0;

	// Workout where the lastline appeared in the read buffer
	lineOffset = lines.substr(lastLine).length - 1;

	// Strip the string down to the last line
	lines = lines.substr(0, lastLine);

	// Calc the fileoffset based on the last line ending
	this._fileOffset += (bytesRead - lineOffset);

	if ((bytesRead <= 0) || (bytesRead < this.bufferSize)) {
		/**
		 * finished reading the file, pass the amount of bytes we have read to
		 * the callback so its possible to truncate those bytes..
		 *
		 * @todo  think about how this is going to work, need to somehow chop out
		 * the read bytes and leave the bytes we haven't read intact
		 */
		return this._finishedCallback(this._fileOffset);
	}

	// We have our lines lets split & pass on
	this._callback(lines.split(this.endOfLine));

	// lets keep going
	this._grabBuffer();
};

CsvBufferReader.prototype._grabBuffer = function () {
	'use strict';

	fs.read(this._fd, this._blankBuffer, this._bufferOffset, this._blankBuffer.length, this._fileOffset, this._handleBuffer.bind(this));
};

var p = new CsvBufferReader('/Users/gav/test.log', { bufferSize: 512 });

p.parse(function (lines) {
	'use strict';

	console.log('Callback Called:');

	lines.forEach(function (line) {
		console.log('Line: ' + line);
	});
}, function (totalBytes) {
	'use strict';

	console.log('Total Bytes read: ' + totalBytes);
});