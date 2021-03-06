'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var IOBuffer = _interopDefault(require('iobuffer'));

const tagsById = {
    // Baseline tags
    0x00FE: 'NewSubfileType',
    0x00FF: 'SubfileType',
    0x0100: 'ImageWidth',
    0x0101: 'ImageLength',
    0x0102: 'BitsPerSample',
    0x0103: 'Compression',
    0x0106: 'PhotometricInterpretation',
    0x0107: 'Threshholding',
    0x0108: 'CellWidth',
    0x0109: 'CellLength',
    0x010A: 'FillOrder',
    0x010E: 'ImageDescription',
    0x010F: 'Make',
    0x0110: 'Model',
    0x0111: 'StripOffsets',
    0x0112: 'Orientation',
    0x0115: 'SamplesPerPixel',
    0x0116: 'RowsPerStrip',
    0x0117: 'StripByteCounts',
    0x0118: 'MinSampleValue',
    0x0119: 'MaxSampleValue',
    0x011A: 'XResolution',
    0x011B: 'YResolution',
    0x011C: 'PlanarConfiguration',
    0x0120: 'FreeOffsets',
    0x0121: 'FreeByteCounts',
    0x0122: 'GrayResponseUnit',
    0x0123: 'GrayResponseCurve',
    0x0128: 'ResolutionUnit',
    0x0131: 'Software',
    0x0132: 'DateTime',
    0x013B: 'Artist',
    0x013C: 'HostComputer',
    0x0140: 'ColorMap',
    0x0152: 'ExtraSamples',
    0x8298: 'Copyright',

    // Extension tags
    0x010D: 'DocumentName',
    0x011D: 'PageName',
    0x011E: 'XPosition',
    0x011F: 'YPosition',
    0x0124: 'T4Options',
    0x0125: 'T6Options',
    0x0129: 'PageNumber',
    0x012D: 'TransferFunction',
    0x013D: 'Predictor',
    0x013E: 'WhitePoint',
    0x013F: 'PrimaryChromaticities',
    0x0141: 'HalftoneHints',
    0x0142: 'TileWidth',
    0x0143: 'TileLength',
    0x0144: 'TileOffsets',
    0x0145: 'TileByteCounts',
    0x0146: 'BadFaxLines',
    0x0147: 'CleanFaxData',
    0x0148: 'ConsecutiveBadFaxLines',
    0x014A: 'SubIFDs',
    0x014C: 'InkSet',
    0x014D: 'InkNames',
    0x014E: 'NumberOfInks',
    0x0150: 'DotRange',
    0x0151: 'TargetPrinter',
    0x0153: 'SampleFormat',
    0x0154: 'SMinSampleValue',
    0x0155: 'SMaxSampleValue',
    0x0156: 'TransferRange',
    0x0157: 'ClipPath',
    0x0158: 'XClipPathUnits',
    0x0159: 'YClipPathUnits',
    0x015A: 'Indexed',
    0x015B: 'JPEGTables',
    0x015F: 'OPIProxy',
    0x0190: 'GlobalParametersIFD',
    0x0191: 'ProfileType',
    0x0192: 'FaxProfile',
    0x0193: 'CodingMethods',
    0x0194: 'VersionYear',
    0x0195: 'ModeNumber',
    0x01B1: 'Decode',
    0x01B2: 'DefaultImageColor',
    0x0200: 'JPEGProc',
    0x0201: 'JPEGInterchangeFormat',
    0x0202: 'JPEGInterchangeFormatLength',
    0x0203: 'JPEGRestartInterval',
    0x0205: 'JPEGLosslessPredictors',
    0x0206: 'JPEGPointTransforms',
    0x0207: 'JPEGQTables',
    0x0208: 'JPEGDCTables',
    0x0209: 'JPEGACTables',
    0x0211: 'YCbCrCoefficients',
    0x0212: 'YCbCrSubSampling',
    0x0213: 'YCbCrPositioning',
    0x0214: 'ReferenceBlackWhite',
    0x022F: 'StripRowCounts',
    0x02BC: 'XMP',
    0x800D: 'ImageID',
    0x87AC: 'ImageLayer',

    // Private tags
    0x80A4: 'WangAnnotatio',
    0x82A5: 'MDFileTag',
    0x82A6: 'MDScalePixel',
    0x82A7: 'MDColorTable',
    0x82A8: 'MDLabName',
    0x82A9: 'MDSampleInfo',
    0x82AA: 'MDPrepDate',
    0x82AB: 'MDPrepTime',
    0x82AC: 'MDFileUnits',
    0x830E: 'ModelPixelScaleTag',
    0x83BB: 'IPTC',
    0x847E: 'INGRPacketDataTag',
    0x847F: 'INGRFlagRegisters',
    0x8480: 'IrasBTransformationMatrix',
    0x8482: 'ModelTiepointTag',
    0x85D8: 'ModelTransformationTag',
    0x8649: 'Photoshop',
    0x8769: 'ExifIFD',
    0x8773: 'ICCProfile',
    0x87AF: 'GeoKeyDirectoryTag',
    0x87B0: 'GeoDoubleParamsTag',
    0x87B1: 'GeoAsciiParamsTag',
    0x8825: 'GPSIFD',
    0x885C: 'HylaFAXFaxRecvParams',
    0x885D: 'HylaFAXFaxSubAddress',
    0x885E: 'HylaFAXFaxRecvTime',
    0x935C: 'ImageSourceData',
    0xA005: 'InteroperabilityIFD',
    0xA480: 'GDAL_METADATA',
    0xA481: 'GDAL_NODATA',
    0xC427: 'OceScanjobDescription',
    0xC428: 'OceApplicationSelector',
    0xC429: 'OceIdentificationNumber',
    0xC42A: 'OceImageLogicCharacteristics',
    0xC612: 'DNGVersion',
    0xC613: 'DNGBackwardVersion',
    0xC614: 'UniqueCameraModel',
    0xC615: 'LocalizedCameraModel',
    0xC616: 'CFAPlaneColor',
    0xC617: 'CFALayout',
    0xC618: 'LinearizationTable',
    0xC619: 'BlackLevelRepeatDim',
    0xC61A: 'BlackLevel',
    0xC61B: 'BlackLevelDeltaH',
    0xC61C: 'BlackLevelDeltaV',
    0xC61D: 'WhiteLevel',
    0xC61E: 'DefaultScale',
    0xC61F: 'DefaultCropOrigin',
    0xC620: 'DefaultCropSize',
    0xC621: 'ColorMatrix1',
    0xC622: 'ColorMatrix2',
    0xC623: 'CameraCalibration1',
    0xC624: 'CameraCalibration2',
    0xC625: 'ReductionMatrix1',
    0xC626: 'ReductionMatrix2',
    0xC627: 'AnalogBalance',
    0xC628: 'AsShotNeutral',
    0xC629: 'AsShotWhiteXY',
    0xC62A: 'BaselineExposure',
    0xC62B: 'BaselineNoise',
    0xC62C: 'BaselineSharpness',
    0xC62D: 'BayerGreenSplit',
    0xC62E: 'LinearResponseLimit',
    0xC62F: 'CameraSerialNumber',
    0xC630: 'LensInfo',
    0xC631: 'ChromaBlurRadius',
    0xC632: 'AntiAliasStrength',
    0xC634: 'DNGPrivateData',
    0xC635: 'MakerNoteSafety',
    0xC65A: 'CalibrationIlluminant1',
    0xC65B: 'CalibrationIlluminant2',
    0xC65C: 'BestQualityScale',
    0xC660: 'AliasLayerMetadata'
};

const tagsByName = {};
for (var i in tagsById) {
    tagsByName[tagsById[i]] = i;
}




var standard = Object.freeze({
	tagsById: tagsById,
	tagsByName: tagsByName
});

const tagsById$1 = {
    0x829A: 'ExposureTime',
    0x829D: 'FNumber',
    0x8822: 'ExposureProgram',
    0x8824: 'SpectralSensitivity',
    0x8827: 'ISOSpeedRatings',
    0x8828: 'OECF',
    0x8830: 'SensitivityType',
    0x8831: 'StandardOutputSensitivity',
    0x8832: 'RecommendedExposureIndex',
    0x8833: 'ISOSpeed',
    0x8834: 'ISOSpeedLatitudeyyy',
    0x8835: 'ISOSpeedLatitudezzz',
    0x9000: 'ExifVersion',
    0x9003: 'DateTimeOriginal',
    0x9004: 'DateTimeDigitized',
    0x9101: 'ComponentsConfiguration',
    0x9102: 'CompressedBitsPerPixel',
    0x9201: 'ShutterSpeedValue',
    0x9202: 'ApertureValue',
    0x9203: 'BrightnessValue',
    0x9204: 'ExposureBiasValue',
    0x9205: 'MaxApertureValue',
    0x9206: 'SubjectDistance',
    0x9207: 'MeteringMode',
    0x9208: 'LightSource',
    0x9209: 'Flash',
    0x920A: 'FocalLength',
    0x9214: 'SubjectArea',
    0x927C: 'MakerNote',
    0x9286: 'UserComment',
    0x9290: 'SubsecTime',
    0x9291: 'SubsecTimeOriginal',
    0x9292: 'SubsecTimeDigitized',
    0xA000: 'FlashpixVersion',
    0xA001: 'ColorSpace',
    0xA002: 'PixelXDimension',
    0xA003: 'PixelYDimension',
    0xA004: 'RelatedSoundFile',
    0xA20B: 'FlashEnergy',
    0xA20C: 'SpatialFrequencyResponse',
    0xA20E: 'FocalPlaneXResolution',
    0xA20F: 'FocalPlaneYResolution',
    0xA210: 'FocalPlaneResolutionUnit',
    0xA214: 'SubjectLocation',
    0xA215: 'ExposureIndex',
    0xA217: 'SensingMethod',
    0xA300: 'FileSource',
    0xA301: 'SceneType',
    0xA302: 'CFAPattern',
    0xA401: 'CustomRendered',
    0xA402: 'ExposureMode',
    0xA403:	'WhiteBalance',
    0xA404:	'DigitalZoomRatio',
    0xA405:	'FocalLengthIn35mmFilm',
    0xA406:	'SceneCaptureType',
    0xA407:	'GainControl',
    0xA408:	'Contrast',
    0xA409:	'Saturation',
    0xA40A:	'Sharpness',
    0xA40B:	'DeviceSettingDescription',
    0xA40C:	'SubjectDistanceRange',
    0xA420:	'ImageUniqueID',
    0xA430: 'CameraOwnerName',
    0xA431: 'BodySerialNumber',
    0xA432: 'LensSpecification',
    0xA433: 'LensMake',
    0xA434: 'LensModel',
    0xA435: 'LensSerialNumber',
    0xA500: 'Gamma'
};

const tagsByName$1 = {};
for (var i$1 in tagsById$1) {
    tagsByName$1[tagsById$1[i$1]] = i$1;
}




var exif = Object.freeze({
	tagsById: tagsById$1,
	tagsByName: tagsByName$1
});

const tagsById$2 = {
    0x0000: 'GPSVersionID',
    0x0001: 'GPSLatitudeRef',
    0x0002: 'GPSLatitude',
    0x0003: 'GPSLongitudeRef',
    0x0004: 'GPSLongitude',
    0x0005: 'GPSAltitudeRef',
    0x0006: 'GPSAltitude',
    0x0007: 'GPSTimeStamp',
    0x0008: 'GPSSatellites',
    0x0009: 'GPSStatus',
    0x000A: 'GPSMeasureMode',
    0x000B: 'GPSDOP',
    0x000C: 'GPSSpeedRef',
    0x000D: 'GPSSpeed',
    0x000E: 'GPSTrackRef',
    0x000F: 'GPSTrack',
    0x0010: 'GPSImgDirectionRef',
    0x0011: 'GPSImgDirection',
    0x0012: 'GPSMapDatum',
    0x0013: 'GPSDestLatitudeRef',
    0x0014: 'GPSDestLatitude',
    0x0015: 'GPSDestLongitudeRef',
    0x0016: 'GPSDestLongitude',
    0x0017: 'GPSDestBearingRef',
    0x0018: 'GPSDestBearing',
    0x0019: 'GPSDestDistanceRef',
    0x001A: 'GPSDestDistance',
    0x001B: 'GPSProcessingMethod',
    0x001C: 'GPSAreaInformation',
    0x001D: 'GPSDateStamp',
    0x001E: 'GPSDifferential',
    0x001F: 'GPSHPositioningError'
};

const tagsByName$2 = {};
for (var i$2 in tagsById$2) {
    tagsByName$2[tagsById$2[i$2]] = i$2;
}




var gps = Object.freeze({
	tagsById: tagsById$2,
	tagsByName: tagsByName$2
});

const tags = {
    standard,
    exif,
    gps
};

class IFD {
    constructor(kind) {
        if (!kind) {
            throw new Error('missing kind');
        }
        this.data = null;
        this.fields = new Map();
        this.kind = kind;
        this._map = null;
    }

    get(tag) {
        if (typeof tag === 'number') {
            return this.fields.get(tag);
        } else if (typeof tag === 'string') {
            return this.fields.get(tags[this.kind].tagsByName[tag]);
        } else {
            throw new Error('expected a number or string');
        }
    }

    get map() {
        if (!this._map) {
            this._map = {};
            const taglist = tags[this.kind].tagsById;
            for (var key of this.fields.keys()) {
                if (taglist[key]) {
                    this._map[taglist[key]] = this.fields.get(key);
                }
            }
        }
        return this._map;
    }
}

const dateTimeRegex = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;

class TiffIfd extends IFD {
    constructor() {
        super('standard');
    }

    // Custom fields
    get size() {
        return this.width * this.height;
    }
    get width() {
        return this.imageWidth;
    }
    get height() {
        return this.imageLength;
    }
    get components() {
        return this.samplesPerPixel;
    }
    get date() {
        var date = new Date();
        var result = dateTimeRegex.exec(this.dateTime);
        date.setFullYear(result[1], result[2] - 1, result[3]);
        date.setHours(result[4], result[5], result[6]);
        return date;
    }

    // IFD fields
    get newSubfileType() {
        return this.get(254);
    }
    get imageWidth() {
        return this.get(256);
    }
    get imageLength() {
        return this.get(257);
    }
    get bitsPerSample() {
        return this.get(258);
    }
    get compression() {
        return this.get(259) || 1;
    }
    get type() {
        return this.get(262);
    }
    get fillOrder() {
        return this.get(266) || 1;
    }
    get documentName() {
        return this.get(269);
    }
    get imageDescription() {
        return this.get(270);
    }
    get stripOffsets() {
        return alwaysArray(this.get(273));
    }
    get orientation() {
        return this.get(274);
    }
    get samplesPerPixel() {
        return this.get(277);
    }
    get rowsPerStrip() {
        return this.get(278);
    }
    get stripByteCounts() {
        return alwaysArray(this.get(279));
    }
    get minSampleValue() {
        return this.get(280) || 0;
    }
    get maxSampleValue() {
        return this.get(281) || Math.pow(2, this.bitsPerSample) - 1;
    }
    get xResolution() {
        return this.get(282);
    }
    get yResolution() {
        return this.get(283);
    }
    get planarConfiguration() {
        return this.get(284) || 1;
    }
    get resolutionUnit() {
        return this.get(296) || 2;
    }
    get dateTime() {
        return this.get(306);
    }
    get predictor() {
        return this.get(317) || 1;
    }
    get sampleFormat() {
        return this.get(339) || 1;
    }
    get sMinSampleValue() {
        return this.get(340) || this.minSampleValue;
    }
    get sMaxSampleValue() {
        return this.get(341) || this.maxSampleValue;
    }
}

function alwaysArray(value) {
    if (typeof value === 'number') return [value];
    return value;
}

var types = new Map([
    [1, [1, readByte]], // BYTE
    [2, [1, readASCII]], // ASCII
    [3, [2, readShort]], // SHORT
    [4, [4, readLong]], // LONG
    [5, [8, readRational]], // RATIONAL
    [6, [1, readSByte]], // SBYTE
    [7, [1, readByte]], // UNDEFINED
    [8, [2, readSShort]], // SSHORT
    [9, [4, readSLong]], // SLONG
    [10, [8, readSRational]], // SRATIONAL
    [11, [4, readFloat]], // FLOAT
    [12, [8, readDouble]] // DOUBLE
]);

function getByteLength(type, count) {
    return types.get(type)[0] * count;
}

function readData(decoder, type, count) {
    return types.get(type)[1](decoder, count);
}

function readByte(decoder, count) {
    if (count === 1) return decoder.readUint8();
    var array = new Uint8Array(count);
    for (var i = 0; i < count; i++) {
        array[i] = decoder.readUint8();
    }
    return array;
}

function readASCII(decoder, count) {
    var strings = [];
    var currentString = '';
    for (var i = 0; i < count; i++) {
        var char = String.fromCharCode(decoder.readUint8());
        if (char === '\0') {
            strings.push(currentString);
            currentString = '';
        } else {
            currentString += char;
        }
    }
    if (strings.length === 1) {
        return strings[0];
    } else {
        return strings;
    }
}

function readShort(decoder, count) {
    if (count === 1) return decoder.readUint16();
    var array = new Uint16Array(count);
    for (var i = 0; i < count; i++) {
        array[i] = decoder.readUint16();
    }
    return array;
}

function readLong(decoder, count) {
    if (count === 1) return decoder.readUint32();
    var array = new Uint32Array(count);
    for (var i = 0; i < count; i++) {
        array[i] = decoder.readUint32();
    }
    return array;
}

function readRational(decoder, count) {
    if (count === 1) {
        return decoder.readUint32() / decoder.readUint32();
    }
    var rationals = new Array(count);
    for (var i = 0; i < count; i++) {
        rationals[i] = decoder.readUint32() / decoder.readUint32();
    }
    return rationals;
}

function readSByte(decoder, count) {
    if (count === 1) return decoder.readInt8();
    var array = new Int8Array(count);
    for (var i = 0; i < count; i++) {
        array[i] = decoder.readInt8();
    }
    return array;
}

function readSShort(decoder, count) {
    if (count === 1) return decoder.readInt16();
    var array = new Int16Array(count);
    for (var i = 0; i < count; i++) {
        array[i] = decoder.readInt16();
    }
    return array;
}

function readSLong(decoder, count) {
    if (count === 1) return decoder.readInt32();
    var array = new Int32Array(count);
    for (var i = 0; i < count; i++) {
        array[i] = decoder.readInt32();
    }
    return array;
}

function readSRational(decoder, count) {
    if (count === 1) {
        return decoder.readInt32() / decoder.readInt32();
    }
    var rationals = new Array(count);
    for (var i = 0; i < count; i++) {
        rationals[i] = decoder.readInt32() / decoder.readInt32();
    }
    return rationals;
}

function readFloat(decoder, count) {
    if (count === 1) return decoder.readFloat32();
    var array = new Float32Array(count);
    for (var i = 0; i < count; i++) {
        array[i] = decoder.readFloat32();
    }
    return array;
}

function readDouble(decoder, count) {
    if (count === 1) return decoder.readFloat64();
    var array = new Float64Array(count);
    for (var i = 0; i < count; i++) {
        array[i] = decoder.readFloat64();
    }
    return array;
}

const defaultOptions = {
    ignoreImageData: false,
    onlyFirst: false
};

class TIFFDecoder extends IOBuffer {
    constructor(data, options) {
        super(data, options);
        this._nextIFD = 0;
    }

    get isMultiPage() {
        let c = 0;
        this.decodeHeader();
        while (this._nextIFD) {
            c++;
            this.decodeIFD({ignoreImageData: true});
            if (c === 2) {
                return true;
            }
        }
        if (c === 1) {
            return false;
        }
        throw unsupported('ifdCount', c);
    }

    get nextIFD() {
	return this._nextIFD;
    }
    
    get pageCount() {
        let c = 0;
        this.decodeHeader();
        while (this._nextIFD) {
            c++;
            this.decodeIFD({ignoreImageData: true});
        }
        if (c > 0) {
            return c;
        }
        throw unsupported('ifdCount', c);
    }

    decode(options) {
        options = Object.assign({}, defaultOptions, options);
        const result = [];
        this.decodeHeader();
        while (this._nextIFD) {
            result.push(this.decodeIFD(options));
            if (options.onlyFirst) {
                return result[0];
            }
        }
        return result;
    }

    decodeHeader() {
        // Byte offset
        const value = this.readUint16();
        if (value === 0x4949) {
            this.setLittleEndian();
        } else if (value === 0x4D4D) {
            this.setBigEndian();
        } else {
            throw new Error('invalid byte order: 0x' + value.toString(16));
        }

        // Magic number
        if (this.readUint16() !== 42) {
            throw new Error('not a TIFF file');
        }

        // Offset of the first IFD
        this._nextIFD = this.readUint32();
    }

    decodeIFD(options) {
        this.seek(this._nextIFD);

        var ifd;
        if (!options.kind) {
            ifd = new TiffIfd();
        } else {
            ifd = new IFD(options.kind);
        }

        const numEntries = this.readUint16();
        for (var i = 0; i < numEntries; i++) {
            this.decodeIFDEntry(ifd);
        }
        if (!options.ignoreImageData) {
            this.decodeImageData(ifd);
        }
        this._nextIFD = this.readUint32();
        return ifd;
    }

    decodeIFDEntry(ifd) {
        const offset = this.offset;
        const tag = this.readUint16();
        const type = this.readUint16();
        const numValues = this.readUint32();

        if (type < 1 || type > 12) {
            this.skip(4); // unknown type, skip this value
            return;
        }

        const valueByteLength = getByteLength(type, numValues);
        if (valueByteLength > 4) {
            this.seek(this.readUint32());
        }

        const value = readData(this, type, numValues);
        ifd.fields.set(tag, value);

        // Read sub-IFDs
        if (tag === 0x8769 || tag === 0x8825) {
            let currentOffset = this.offset;
            let kind;
            if (tag === 0x8769) {
                kind = 'exif';
            } else if (tag === 0x8825) {
                kind = 'gps';
            }
            this._nextIFD = value;
            ifd[kind] = this.decodeIFD({
                kind,
                ignoreImageData: true
            });
            this.offset = currentOffset;
        }

        // go to the next entry
        this.seek(offset);
        this.skip(12);
    }

    decodeImageData(ifd) {
        const orientation = ifd.orientation;
        if (orientation && orientation !== 1) {
            throw unsupported('orientation', orientation);
        }
        switch (ifd.type) {
            case 1: // BlackIsZero
            case 2: // RGB
                this.readStripData(ifd);
                break;
            default:
                throw unsupported('image type', ifd.type);
        }
    }

    readStripData(ifd) {
        const width = ifd.width;
        const height = ifd.height;

        const bitDepth = validateBitDepth(ifd.bitsPerSample);
        const sampleFormat = ifd.sampleFormat;
        const size = width * height;
        const data = getDataArray(size, 1, bitDepth, sampleFormat);

        const compression = ifd.compression;
        const rowsPerStrip = ifd.rowsPerStrip;
        const maxPixels = rowsPerStrip * width;
        const stripOffsets = ifd.stripOffsets;
        const stripByteCounts = ifd.stripByteCounts;

        var remainingPixels = size;
        var pixel = 0;
        for (var i = 0; i < stripOffsets.length; i++) {
            var stripData = new DataView(this.buffer, stripOffsets[i], stripByteCounts[i]);

            // Last strip can be smaller
            var length = remainingPixels > maxPixels ? maxPixels : remainingPixels;
            remainingPixels -= length;

            switch (compression) {
                case 1: // No compression
                    pixel = this.fillUncompressed(bitDepth, sampleFormat, data, stripData, pixel, length);
                    break;
                case 5: // LZW
                    throw unsupported('lzw');
                case 2: // CCITT Group 3 1-Dimensional Modified Huffman run length encoding
                case 32773: // PackBits compression
                    throw unsupported('Compression', compression);
                default:
                    throw new Error('invalid compression: ' + compression);
            }
        }

        ifd.data = data;
    }

    fillUncompressed(bitDepth, sampleFormat, data, stripData, pixel, length) {
        if (bitDepth === 8) {
            return fill8bit(data, stripData, pixel, length);
        } else if (bitDepth === 16) {
            return fill16bit(data, stripData, pixel, length, this.isLittleEndian());
        } else if (bitDepth === 32 && sampleFormat === 3) {
            return fillFloat32(data, stripData, pixel, length, this.isLittleEndian());
        } else {
            throw unsupported('bitDepth', bitDepth);
        }
    }
}

function getDataArray(size, channels, bitDepth, sampleFormat) {
    if (bitDepth === 8) {
        return new Uint8Array(size * channels);
    } else if (bitDepth === 16) {
	if (sampleFormat===1)
            return new Uint16Array(size * channels);
	else
	    return new Int16Array(size * channels);
    } else if (bitDepth === 32 && sampleFormat === 3) {
        return new Float32Array(size * channels);
    } else {
        throw unsupported('bit depth / sample format', bitDepth + ' / ' + sampleFormat);
    }
}

function fill8bit(dataTo, dataFrom, index, length) {
    for (var i = 0; i < length; i++) {
        dataTo[index++] = dataFrom.getUint8(i);
    }
    return index;
}

function fill16bit(dataTo, dataFrom, index, length, littleEndian) {
    for (var i = 0; i < length * 2; i += 2) {
        dataTo[index++] = dataFrom.getUint16(i, littleEndian);
    }
    return index;
}

function fillFloat32(dataTo, dataFrom, index, length, littleEndian) {
    for (var i = 0; i < length * 4; i += 4) {
        dataTo[index++] = dataFrom.getFloat32(i, littleEndian);
    }
    return index;
}

function unsupported(type, value) {
    return new Error('Unsupported ' + type + ': ' + value);
}

function validateBitDepth(bitDepth) {
    if (bitDepth.length) {
        const bitDepthArray = bitDepth;
        bitDepth = bitDepthArray[0];
        for (var i = 0; i < bitDepthArray.length; i++) {
            if (bitDepthArray[i] !== bitDepth) {
                throw unsupported('bit depth', bitDepthArray);
            }
        }
    }
    return bitDepth;
}

function decodeTIFF(data, options = {}) {
    const decoder = new TIFFDecoder(data, options);
    return decoder.decode(options);
}

function isMultiPage(data) {
    const decoder = new TIFFDecoder(data);
    return decoder.isMultiPage;
}

function pageCount(data) {
    const decoder = new TIFFDecoder(data);
    return decoder.pageCount;
}

function createDecoder(data, options = {}) {
    return new TIFFDecoder(data, options);
}

exports.decode = decodeTIFF;
exports.isMultiPage = isMultiPage;
exports.pageCount = pageCount;
exports.newobject = createDecoder;

