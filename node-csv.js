/*jslint nomen: true */
/*global Buffer, console, require */

var fs = require('fs'),
	_ = require('underscore');

function CSVFile(options) {
	'use strict';

	/**
	 * File to read...
	 */
	var file = options.file,
		/**
		 * The amount of the file to read each time
		 */
		bufferSize = options.bufferSize || 1024,

		/**
		 * What mode are we opening this file, 666
		 * should be fine most of the time
		 */
		mode = options.mode || '0666',

		/**
		 * Encoding, node is standard on utf8 but never know
		 */
		encoding = options.encoding || 'utf8',

		/**
		 * Flag, for whatever reason this is nice to have as an option
		 */
		flag = options.flag || 'r',

		/**
		 * Unix, windows etc
		 */
		endOfLine = options.endOfLine || '\r\n';

	return {

		parse: function (cb, finishedCb) {
			var callback = cb,
				/**
				 * Optional, might want to clean
				 * the file or something after
				 */
				finishedCallback = finishedCb || function () { };

			fs.open(file, flag, mode, function (err, fd) {
				var blankBuffer = new Buffer(bufferSize, encoding),
					bufferOffset = 0,
					fileOffset = 0,
					grabBuffer = null,
					handleBuffer = null;

				grabBuffer = function () {
					fs.read(fd, blankBuffer, bufferOffset, blankBuffer.length, fileOffset, handleBuffer);
				};

				/**
				 * @todo , need to handle if a file ends during
				 * the buffer limit, by using bufferOffset and
				 * setting the blank buffer... need to think about it
				 */

				handleBuffer = function (err, bytesRead, buffer) {
					callback(buffer.toString().split(endOfLine));
					fileOffset += bytesRead;

					if ((bytesRead <= 0) || (bytesRead < bufferSize)) {
						// finished reading the file, pass the amount of bytes we have read to the cb
						return finishedCallback(fileOffset);
					}

					// lets keep going
					grabBuffer();
				};

				grabBuffer();
			});
		}
	};
}

var p = new CSVFile({
	file: '/Users/gav/test.csv',
	bufferSize: 16 * 1024
});

p.parse(function (lines) {
	'use strict';

	_.each(lines, function (line) {
		console.log('Line: ' + line);
	});
});