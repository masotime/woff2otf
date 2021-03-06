'use strict';

var b = require('bufferpack'),
	fs = require('fs');

function largestBinaryLessThan(x) {
	var power = 0;
	while (Math.pow(2,power) < x) {
		power+=1;
	}

	return [power-1, Math.pow(2,power-1)];
}

function writeTracker(outstream) {
	return (function() {
		var pointer = 0;

		return {
			'write': function(stuff) {
				pointer+=stuff.length;
				outstream.write(stuff);
			},
			'tell': function() {
				return pointer;
			},
			'end': function(data) {
				outstream.end(data);
			}
		};
	}());
}

function readBytes(fd, position, length) {
	var buffer = new Buffer(length);
	fs.readSync(fd, buffer, 0, length, position);
	return buffer;
}

var infile = 'freight-sans-pro-300-normal.woff';
var outfile = 'freight-sans-pro-300-normal.otf';
//var fd = fs.openSync(infile, 'r');
var readStream = fs.createReadStream(infile);
var writeStream = writeTracker(fs.createWriteStream(outfile));
var WOFFHeader = {};
// var writeEnded = false;

readStream.on('readable', function() {
	WOFFHeader.signature = b.unpack('>I', readStream.read(4))[0];
	WOFFHeader.flavor = b.unpack('>I', readStream.read(4))[0];
	WOFFHeader.length = b.unpack('>I', readStream.read(4))[0];
	WOFFHeader.numTables = b.unpack('>H', readStream.read(2))[0];
	WOFFHeader.reserved = b.unpack('>H', readStream.read(2))[0];
	WOFFHeader.totalSfntSize = b.unpack('>I', readStream.read(4))[0];
	WOFFHeader.majorVersion = b.unpack('>H', readStream.read(2))[0];
	WOFFHeader.minorVersion = b.unpack('>H', readStream.read(2))[0];
	WOFFHeader.metaOffset = b.unpack('>I', readStream.read(4))[0];
	WOFFHeader.metaLength = b.unpack('>I', readStream.read(4))[0];
	WOFFHeader.metaOrigLength = b.unpack('>I', readStream.read(4))[0];
	WOFFHeader.privOffset = b.unpack('>I', readStream.read(4))[0];
	WOFFHeader.privLength = b.unpack('>I', readStream.read(4))[0];


	writeStream.write(b.pack('>I', WOFFHeader.flavor));
	writeStream.write(b.pack('>H', WOFFHeader.numTables));
	var maximum = largestBinaryLessThan(WOFFHeader.numTables);
	var searchRange = maximum[1] * 16;
	writeStream.write(b.pack('>H', searchRange));
	var entrySelector = maximum[0];
	writeStream.write(b.pack('>H', entrySelector));
	var rangeShift = WOFFHeader.numTables * 16 - searchRange;
	writeStream.write(b.pack('>H', rangeShift));

	var offset = writeStream.tell();

	var TableDirectoryEntries = [], i;
	for (i=0; i<WOFFHeader.numTables;i+=1) {
		var entry = {};
		entry.tag = b.unpack('>I', readStream.read(4))[0];
		entry.offset = b.unpack('>I', readStream.read(4))[0];
		entry.compLength = b.unpack('>I', readStream.read(4))[0];
		entry.origLength = b.unpack('>I', readStream.read(4))[0];
		entry.origChecksum = b.unpack('>I', readStream.read(4))[0];

		TableDirectoryEntries.push(entry);
		offset += 4*4;
	}

	TableDirectoryEntries.forEach(function(TableDirectoryEntry) {
		writeStream.write(b.pack('>I', TableDirectoryEntry.tag));
		writeStream.write(b.pack('>I', TableDirectoryEntry.origChecksum));
		writeStream.write(b.pack('>I', offset));
		writeStream.write(b.pack('>I', TableDirectoryEntry.origLength));
		TableDirectoryEntry.outOffset = offset;
		offset += TableDirectoryEntry.origLength;
		if (offset % 4 !== 0) {
			offset += 4 - (offset % 4);
		}
	});

	// in this nasty part, I have to "seek" by re-opening the file


	readStream.resume();
	writeStream.end();



});

