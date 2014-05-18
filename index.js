var bufferpack = require('bufferpack'),
	fs = require('fs'),
	unpack = bufferpack.unpack,
	pack = bufferpack.pack;

function largestBinaryLessThan(x) {
	var power = 0;
	while (Math.pow(2,power) < x) {
		power+=1;
	};

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
		}
	}());
}

var infile = 'freight-sans-pro-300-normal.woff';
var outfile = 'freight-sans-pro-300-normal.otf';
var readStream = fs.createReadStream(infile);
var writeStream = writeTracker(fs.createWriteStream(outfile));
var WOFFHeader = {};
var writeEnded = false;


readStream.on('readable', function() {
	WOFFHeader.signature = unpack('>I', readStream.read(4))[0];
	WOFFHeader.flavor = unpack('>I', readStream.read(4))[0];
	WOFFHeader.length = unpack('>I', readStream.read(4))[0];
	WOFFHeader.numTables = unpack('>H', readStream.read(2))[0];
	WOFFHeader.reserved = unpack('>H', readStream.read(2))[0];
	WOFFHeader.totalSfntSize = unpack('>I', readStream.read(4))[0];
	WOFFHeader.majorVersion = unpack('>H', readStream.read(2))[0];
	WOFFHeader.minorVersion = unpack('>H', readStream.read(2))[0];
	WOFFHeader.metaOffset = unpack('>I', readStream.read(4))[0];
	WOFFHeader.metaLength = unpack('>I', readStream.read(4))[0];
	WOFFHeader.metaOrigLength = unpack('>I', readStream.read(4))[0];
	WOFFHeader.privOffset = unpack('>I', readStream.read(4))[0];
	WOFFHeader.privLength = unpack('>I', readStream.read(4))[0];


	writeStream.write(pack('>I', WOFFHeader.flavor));
	writeStream.write(pack('>H', WOFFHeader.numTables));
	var maximum = largestBinaryLessThan(WOFFHeader.numTables);
	var searchRange = maximum[1] * 16;
	writeStream.write(pack('>H', searchRange));
	var entrySelector = maximum[0];
	writeStream.write(pack('>H', entrySelector));
	var rangeShift = WOFFHeader.numTables * 16 - searchRange;
	writeStream.write(pack('>H', rangeShift));

	var offset = writeStream.tell();

	var TableDirectoryEntries = [], i;
	for (i=0; i<WOFFHeader.numTables;i+=1) {
		var entry = {};
		entry.tag = unpack('>I', readStream.read(4))[0];
		entry.offset = unpack('')
		TableDirectoryEntries.push({
			'tag': struct
		});
	}

	readStream.resume();
	writeStream.end();



});

