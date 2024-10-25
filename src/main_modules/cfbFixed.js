/*
 * Modified version of the package
 * 'cfb' (https://www.npmjs.com/package/cfb)
 * by MomoCow (http://momocow.me)
 * by xiyuesaves (https://www.github.com/xiyuesaves)
 */

/**************************************************************************************************************/

/* cfb.js (C) 2013-present SheetJS -- http://sheetjs.com */
/* vim: set ts=2: */
/* jshint eqnull:true */
/* eslint-disable no-control-regex */

/* only for Node.js */

import fs from "fs";


var chr0 = /\u0000/g;
var chr1 = /[\u0001-\u0006]/;

var s2a = function _s2a(s) {
  return Buffer.from(s, "binary");
};

var __toBuffer = function (bufs) {
  bufs[0] = bufs[0].filter((e) => Boolean(e));
  return bufs[0].length > 0 && Buffer.isBuffer(bufs[0][0]) ? Buffer.concat(bufs[0]) : __toBuffer(bufs);
};

var __utf16le = function (b, s, e) {
  return b.toString("utf16le", s, e).replace(chr0, "").replace(chr1, "!");
};

var __hexlify = function (b, s, l) {
  return b.toString("hex", s, s + l);
};

var __bconcat = function (bufs) {
  var maxlen = 0,
    i = 0;
  for (i = 0; i < bufs.length; ++i) maxlen += bufs[i].length;
  var o = Buffer.alloc(maxlen);
  for (i = 0, maxlen = 0; i < bufs.length; maxlen += bufs[i].length, ++i) bufs[i].copy(o, maxlen);
  return o;
};

var bconcat = __bconcat;

var __readUInt8 = function (b, idx) {
  return b[idx];
};
var __readUInt16LE = function (b, idx) {
  return b[idx + 1] * (1 << 8) + b[idx];
};
var __readInt16LE = function (b, idx) {
  var u = b[idx + 1] * (1 << 8) + b[idx];
  return u < 0x8000 ? u : (0xffff - u + 1) * -1;
};
var __readUInt32LE = function (b, idx) {
  return b[idx + 3] * (1 << 24) + (b[idx + 2] << 16) + (b[idx + 1] << 8) + b[idx];
};
var __readInt32LE = function (b, idx) {
  return (b[idx + 3] << 24) + (b[idx + 2] << 16) + (b[idx + 1] << 8) + b[idx];
};

function ReadShift(size, t) {
  var oI,
    oS,
    type = 0;
  switch (size) {
    case 1:
      oI = __readUInt8(this, this.l);
      break;
    case 2:
      oI = (t !== "i" ? __readUInt16LE : __readInt16LE)(this, this.l);
      break;
    case 4:
      oI = __readInt32LE(this, this.l);
      break;
    case 16:
      type = 2;
      oS = __hexlify(this, this.l, size);
  }
  this.l += size;
  if (type === 0) return oI;
  return oS;
}

function CheckField(hexstr, fld) {
  var m = __hexlify(this, this.l, hexstr.length >> 1);
  if (m !== hexstr) throw new Error(fld + "Expected " + hexstr + " saw " + m);
  this.l += hexstr.length >> 1;
}

function prep_blob(blob, pos) {
  blob.l = pos;
  blob.read_shift = ReadShift;
  blob.chk = CheckField;
}

/* [MS-CFB] v20130118 */
var CFB = (function _CFB() {
  var exports = {};
  exports.version = "0.12.1";
  function parse(file) {
    var mver = 3; // major version
    var ssz = 512; // sector size
    var nmfs = 0; // number of mini FAT sectors
    var ndfs = 0; // number of DIFAT sectors
    var dir_start = 0; // first directory sector location
    var minifat_start = 0; // first mini FAT sector location
    var difat_start = 0; // first mini FAT sector location

    var fat_addrs = []; // locations of FAT sectors

    /* [MS-CFB] 2.2 Compound File Header */
    var blob = file.slice(0, 512);
    prep_blob(blob, 0);

    /* major version */
    var mv = check_get_mver(blob);
    mver = mv[0];
    switch (mver) {
      case 3:
        ssz = 512;
        break;
      case 4:
        ssz = 4096;
        break;
      default:
        throw new Error("Major Version: Expected 3 or 4 saw " + mver);
    }

    /* reprocess header */
    if (ssz !== 512) {
      blob = file.slice(0, ssz);
      prep_blob(blob, 28 /* blob.l */);
    }
    /* Save header for final object */
    var header = file.slice(0, ssz);

    check_shifts(blob, mver);

    // Number of Directory Sectors
    var nds = blob.read_shift(4, "i");
    if (mver === 3 && nds !== 0) throw new Error("# Directory Sectors: Expected 0 saw " + nds);

    // Number of FAT Sectors
    //var nfs = blob.read_shift(4, 'i');
    blob.l += 4;

    // First Directory Sector Location
    dir_start = blob.read_shift(4, "i");

    // Transaction Signature
    blob.l += 4;

    // Mini Stream Cutoff Size
    blob.chk("00100000", "Mini Stream Cutoff Size: ");

    // First Mini FAT Sector Location
    minifat_start = blob.read_shift(4, "i");

    // Number of Mini FAT Sectors
    nmfs = blob.read_shift(4, "i");

    // First DIFAT sector location
    difat_start = blob.read_shift(4, "i");

    // Number of DIFAT Sectors
    ndfs = blob.read_shift(4, "i");

    // Grab FAT Sector Locations
    for (var q = -1, j = 0; j < 109; ++j) {
      /* 109 = (512 - blob.l)>>>2; */
      q = blob.read_shift(4, "i");
      if (q < 0) break;
      fat_addrs[j] = q;
    }

    /** Break the file up into sectors */
    var sectors = sectorify(file, ssz);

    sleuth_fat(difat_start, ndfs, sectors, ssz, fat_addrs);

    /** Chains */
    var sector_list = make_sector_list(sectors, dir_start, fat_addrs, ssz);

    sector_list[dir_start].name = "!Directory";
    if (nmfs > 0 && minifat_start !== ENDOFCHAIN) sector_list[minifat_start].name = "!MiniFAT";
    sector_list[fat_addrs[0]].name = "!FAT";
    sector_list.fat_addrs = fat_addrs;
    sector_list.ssz = ssz;

    /* [MS-CFB] 2.6.1 Compound File Directory Entry */
    var files = {},
      Paths = [],
      FileIndex = [],
      FullPaths = [],
      FullPathDir = {};
    read_directory(dir_start, sector_list, sectors, Paths, nmfs, files, FileIndex);

    build_full_paths(FileIndex, FullPathDir, FullPaths, Paths);

    var root_name = Paths.shift();

    /* [MS-CFB] 2.6.4 (Unicode 3.0.1 case conversion) */
    var find_path = make_find_path(FullPaths, Paths, FileIndex, files, root_name);

    return {
      raw: { header: header, sectors: sectors },
      FileIndex: FileIndex,
      FullPaths: FullPaths,
      FullPathDir: FullPathDir,
      find: find_path,
    };
  } // parse

  /* [MS-CFB] 2.2 Compound File Header -- read up to major version */
  function check_get_mver(blob) {
    // header signature 8
    blob.chk(HEADER_SIGNATURE, "Header Signature: ");

    // clsid 16
    blob.chk(HEADER_CLSID, "CLSID: ");

    // minor version 2
    var mver = blob.read_shift(2, "u");

    return [blob.read_shift(2, "u"), mver];
  }
  function check_shifts(blob, mver) {
    var shift = 0x09;

    // Byte Order
    //blob.chk('feff', 'Byte Order: '); // note: some writers put 0xffff
    blob.l += 2;

    // Sector Shift
    switch ((shift = blob.read_shift(2))) {
      case 0x09:
        if (mver != 3) throw new Error("Sector Shift: Expected 9 saw " + shift);
        break;
      case 0x0c:
        if (mver != 4) throw new Error("Sector Shift: Expected 12 saw " + shift);
        break;
      default:
        throw new Error("Sector Shift: Expected 9 or 12 saw " + shift);
    }

    // Mini Sector Shift
    blob.chk("0600", "Mini Sector Shift: ");

    // Reserved
    blob.chk("000000000000", "Reserved: ");
  }

  /** Break the file up into sectors */
  function sectorify(file, ssz) {
    var nsectors = Math.ceil(file.length / ssz) - 1;
    var sectors = [];
    for (var i = 1; i < nsectors; ++i) sectors[i - 1] = file.slice(i * ssz, (i + 1) * ssz);
    sectors[nsectors - 1] = file.slice(nsectors * ssz);
    return sectors;
  }

  /* [MS-CFB] 2.6.4 Red-Black Tree */
  function build_full_paths(FI, FPD, FP, Paths) {
    var i = 0,
      L = 0,
      R = 0,
      C = 0,
      j = 0,
      pl = Paths.length;
    var dad = [],
      q = [];

    for (; i < pl; ++i) {
      dad[i] = q[i] = i;
      FP[i] = Paths[i];
    }

    for (; j < q.length; ++j) {
      i = q[j];
      L = FI[i].L;
      R = FI[i].R;
      C = FI[i].C;
      if (dad[i] === i) {
        if (L !== -1 /*NOSTREAM*/ && dad[L] !== L) dad[i] = dad[L];
        if (R !== -1 && dad[R] !== R) dad[i] = dad[R];
      }
      if (C !== -1 /*NOSTREAM*/) dad[C] = i;
      if (L !== -1) {
        dad[L] = dad[i];
        q.push(L);
      }
      if (R !== -1) {
        dad[R] = dad[i];
        q.push(R);
      }
    }
    for (i = 1; i !== pl; ++i)
      if (dad[i] === i) {
        if (R !== -1 /*NOSTREAM*/ && dad[R] !== R) dad[i] = dad[R];
        else if (L !== -1 && dad[L] !== L) dad[i] = dad[L];
      }

    for (i = 1; i < pl; ++i) {
      if (FI[i].type === 0 /* unknown */) continue;
      j = dad[i];
      if (j === 0) FP[i] = FP[0] + "/" + FP[i];
      else
        while (j !== 0 && j !== dad[j]) {
          FP[i] = FP[j] + "/" + FP[i];
          j = dad[j];
        }
      dad[i] = 0;
    }

    FP[0] += "/";
    for (i = 1; i < pl; ++i) {
      if (FI[i].type !== 2 /* stream */) FP[i] += "/";
      FPD[FP[i]] = FI[i];
    }
  }

  /* [MS-CFB] 2.6.4 */
  function make_find_path(FullPaths, Paths, FileIndex, files, root_name) {
    var UCFullPaths = [];
    var UCPaths = [],
      i = 0;
    for (i = 0; i < FullPaths.length; ++i) UCFullPaths[i] = FullPaths[i].toUpperCase().replace(chr0, "").replace(chr1, "!");
    for (i = 0; i < Paths.length; ++i) UCPaths[i] = Paths[i].toUpperCase().replace(chr0, "").replace(chr1, "!");
    return function find_path(path) {
      var k = false;
      if (path.charCodeAt(0) === 47 /* "/" */) {
        k = true;
        path = root_name + path;
      } else k = path.indexOf("/") !== -1;
      var UCPath = path.toUpperCase().replace(chr0, "").replace(chr1, "!");
      var w = k === true ? UCFullPaths.indexOf(UCPath) : UCPaths.indexOf(UCPath);
      if (w === -1) return null;
      return k === true ? FileIndex[w] : files[Paths[w]];
    };
  }

  /** Chase down the rest of the DIFAT chain to build a comprehensive list
    DIFAT chains by storing the next sector number as the last 32 bytes */
  function sleuth_fat(idx, cnt, sectors, ssz, fat_addrs) {
    var q = ENDOFCHAIN;
    if (idx === ENDOFCHAIN) {
      if (cnt !== 0) throw new Error("DIFAT chain shorter than expected");
    } else if (idx !== -1 /*FREESECT*/) {
      var sector = sectors[idx],
        m = (ssz >>> 2) - 1;
      if (!sector) return;
      for (var i = 0; i < m; ++i) {
        if ((q = __readInt32LE(sector, i * 4)) === ENDOFCHAIN) break;
        fat_addrs.push(q);
      }
      sleuth_fat(__readInt32LE(sector, ssz - 4), cnt - 1, sectors, ssz, fat_addrs);
    }
  }

  /** Follow the linked list of sectors for a given starting point */
  function get_sector_list(sectors, start, fat_addrs, ssz, chkd) {
    var buf = [],
      buf_chain = [];
    if (!chkd) chkd = [];
    var modulus = ssz - 1,
      j = 0,
      jj = 0;
    for (j = start; j >= 0; ) {
      chkd[j] = true;
      buf[buf.length] = j;
      buf_chain.push(sectors[j]);
      var addr = fat_addrs[Math.floor((j * 4) / ssz)];
      jj = (j * 4) & modulus;
      if (ssz < 4 + jj) throw new Error("FAT boundary crossed: " + j + " 4 " + ssz);
      if (!sectors[addr]) break;
      j = __readInt32LE(sectors[addr], jj);
    }
    return { nodes: buf, data: __toBuffer([buf_chain]) };
  }

  /** Chase down the sector linked lists */
  function make_sector_list(sectors, dir_start, fat_addrs, ssz) {
    var sl = sectors.length,
      sector_list = [];
    var chkd = [],
      buf = [],
      buf_chain = [];
    var modulus = ssz - 1,
      i = 0,
      j = 0,
      k = 0,
      jj = 0;
    for (i = 0; i < sl; ++i) {
      buf = [];
      k = i + dir_start;
      if (k >= sl) k -= sl;
      if (chkd[k]) continue;
      buf_chain = [];
      for (j = k; j >= 0; ) {
        chkd[j] = true;
        buf[buf.length] = j;
        buf_chain.push(sectors[j]);
        var addr = fat_addrs[Math.floor((j * 4) / ssz)];
        jj = (j * 4) & modulus;
        if (ssz < 4 + jj) throw new Error("FAT boundary crossed: " + j + " 4 " + ssz);
        if (!sectors[addr]) break;
        j = __readInt32LE(sectors[addr], jj);
      }
      sector_list[k] = { nodes: buf, data: __toBuffer([buf_chain]) };
    }
    return sector_list;
  }

  /* [MS-CFB] 2.6.1 Compound File Directory Entry */
  function read_directory(dir_start, sector_list, sectors, Paths, nmfs, files, FileIndex) {
    var minifat_store = 0,
      pl = Paths.length ? 2 : 0;
    var sector = sector_list[dir_start].data;
    var i = 0,
      namelen = 0,
      name;
    for (; i < sector.length; i += 128) {
      var blob = sector.slice(i, i + 128);
      prep_blob(blob, 64);
      namelen = blob.read_shift(2);
      name = __utf16le(blob, 0, namelen - pl);
      Paths.push(name);
      var o = {
        name: name,
        type: blob.read_shift(1),
        color: blob.read_shift(1),
        L: blob.read_shift(4, "i"),
        R: blob.read_shift(4, "i"),
        C: blob.read_shift(4, "i"),
        clsid: blob.read_shift(16),
        state: blob.read_shift(4, "i"),
        start: 0,
        size: 0,
      };
      var ctime = blob.read_shift(2) + blob.read_shift(2) + blob.read_shift(2) + blob.read_shift(2);
      if (ctime !== 0) o.ct = read_date(blob, blob.l - 8);
      var mtime = blob.read_shift(2) + blob.read_shift(2) + blob.read_shift(2) + blob.read_shift(2);
      if (mtime !== 0) o.mt = read_date(blob, blob.l - 8);
      o.start = blob.read_shift(4, "i");
      o.size = blob.read_shift(4, "i");
      if (o.size < 0 && o.start < 0) {
        o.size = o.type = 0;
        o.start = ENDOFCHAIN;
        o.name = "";
      }
      if (o.type === 5) {
        /* root */
        minifat_store = o.start;
        if (nmfs > 0 && minifat_store !== ENDOFCHAIN) sector_list[minifat_store].name = "!StreamData";
        /*minifat_size = o.size;*/
      } else if (o.size >= 4096 /* MSCSZ */) {
        o.storage = "fat";
        if (sector_list[o.start] === undefined)
          sector_list[o.start] = get_sector_list(sectors, o.start, sector_list.fat_addrs, sector_list.ssz);
        sector_list[o.start].name = o.name;
        o.content = sector_list[o.start].data.slice(0, o.size);
        prep_blob(o.content, 0);
      } else {
        o.storage = "minifat";
        if (minifat_store !== ENDOFCHAIN && o.start !== ENDOFCHAIN && sector_list[minifat_store]) {
          o.content = sector_list[minifat_store].data.slice(o.start * MSSZ, o.start * MSSZ + o.size);
          prep_blob(o.content, 0);
        }
      }
      files[name] = o;
      FileIndex.push(o);
    }
  }

  function read_date(blob, offset) {
    return new Date(((__readUInt32LE(blob, offset + 4) / 1e7) * Math.pow(2, 32) + __readUInt32LE(blob, offset) / 1e7 - 11644473600) * 1000);
  }

  function readSync(blob, options) {
    switch (options?.type ?? "base64") {
      case "file":
        return parse(fs.readFileSync(blob));
      case "base64":
        return parse(s2a(Buffer.from(blob, "base64").toString("binary")));
      case "binary":
        return parse(s2a(blob));
    }
    return parse(blob);
  }

  function find(cfb, path) {
    return cfb.find(path);
  }
  /** CFB Constants */
  var MSSZ = 64; /* Mini Sector Size = 1<<6 */
  //var MSCSZ = 4096; /* Mini Stream Cutoff Size */
  /* 2.1 Compound File Sector Numbers and Types */
  var ENDOFCHAIN = -2;
  /* 2.2 Compound File Header */
  var HEADER_SIGNATURE = "d0cf11e0a1b11ae1";
  var HEADER_CLSID = "00000000000000000000000000000000";
  var consts = {
    /* 2.1 Compund File Sector Numbers and Types */
    MAXREGSECT: -6,
    DIFSECT: -4,
    FATSECT: -3,
    ENDOFCHAIN: ENDOFCHAIN,
    FREESECT: -1,
    /* 2.2 Compound File Header */
    HEADER_SIGNATURE: HEADER_SIGNATURE,
    HEADER_MINOR_VERSION: "3e00",
    MAXREGSID: -6,
    NOSTREAM: -1,
    HEADER_CLSID: HEADER_CLSID,
    /* 2.6.1 Compound File Directory Entry */
    EntryTypes: ["unknown", "storage", "stream", "lockbytes", "property", "root"],
  };

  exports.find = find;
  exports.read = readSync;
  exports.parse = parse;
  exports.utils = {
    ReadShift,
    CheckField,
    prep_blob,
    bconcat,
    consts,
  };

  return exports;
})();

export default CFB;
