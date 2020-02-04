var Engine = {
  RuntimeEnvironment: function(Module, exposedLibs) {
    // The above is concatenated with generated code, and acts as the start of
    // a wrapper for said code. See engine.js for the other part of the
    // wrapper.

    var Module = typeof Module !== "undefined" ? Module : {};
    var IDHandler = function() {
      var ids = {};
      var size = 0;
      this.has = function(id) {
        return ids.hasOwnProperty(id);
      };
      this.add = function(obj) {
        size += 1;
        var id = crypto.getRandomValues(new Int32Array(32))[0];
        ids[id] = obj;
        return id;
      };
      this.get = function(id) {
        return ids[id];
      };
      this.remove = function(id) {
        size -= 1;
        delete ids[id];
      };
      this.size = function() {
        return size;
      };
      this.ids = ids;
    };
    Module.IDHandler = new IDHandler();
    var moduleOverrides = {};
    var key;
    for (key in Module) {
      if (Module.hasOwnProperty(key)) {
        moduleOverrides[key] = Module[key];
      }
    }
    var arguments_ = [];
    var thisProgram = "./this.program";
    var quit_ = function(status, toThrow) {
      throw toThrow;
    };
    var ENVIRONMENT_IS_WEB = false;
    var ENVIRONMENT_IS_WORKER = false;
    var ENVIRONMENT_IS_NODE = false;
    var ENVIRONMENT_HAS_NODE = false;
    var ENVIRONMENT_IS_SHELL = false;
    ENVIRONMENT_IS_WEB = typeof window === "object";
    ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
    ENVIRONMENT_HAS_NODE =
      typeof process === "object" &&
      typeof process.versions === "object" &&
      typeof process.versions.node === "string";
    ENVIRONMENT_IS_NODE =
      ENVIRONMENT_HAS_NODE && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
    ENVIRONMENT_IS_SHELL =
      !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
    var scriptDirectory = "";
    function locateFile(path) {
      if (Module["locateFile"]) {
        return Module["locateFile"](path, scriptDirectory);
      }
      return scriptDirectory + path;
    }
    var read_, readAsync, readBinary, setWindowTitle;
    if (ENVIRONMENT_IS_NODE) {
      scriptDirectory = __dirname + "/";
      var nodeFS;
      var nodePath;
      read_ = function shell_read(filename, binary) {
        var ret;
        if (!nodeFS) nodeFS = require("fs");
        if (!nodePath) nodePath = require("path");
        filename = nodePath["normalize"](filename);
        ret = nodeFS["readFileSync"](filename);
        return binary ? ret : ret.toString();
      };
      readBinary = function readBinary(filename) {
        var ret = read_(filename, true);
        if (!ret.buffer) {
          ret = new Uint8Array(ret);
        }
        assert(ret.buffer);
        return ret;
      };
      if (process["argv"].length > 1) {
        thisProgram = process["argv"][1].replace(/\\/g, "/");
      }
      arguments_ = process["argv"].slice(2);
      if (typeof module !== "undefined") {
        module["exports"] = Module;
      }
      process["on"]("uncaughtException", function(ex) {
        if (!(ex instanceof ExitStatus)) {
          throw ex;
        }
      });
      process["on"]("unhandledRejection", abort);
      quit_ = function(status) {
        process["exit"](status);
      };
      Module["inspect"] = function() {
        return "[Emscripten Module object]";
      };
    } else if (ENVIRONMENT_IS_SHELL) {
      if (typeof read != "undefined") {
        read_ = function shell_read(f) {
          return read(f);
        };
      }
      readBinary = function readBinary(f) {
        var data;
        if (typeof readbuffer === "function") {
          return new Uint8Array(readbuffer(f));
        }
        data = read(f, "binary");
        assert(typeof data === "object");
        return data;
      };
      if (typeof scriptArgs != "undefined") {
        arguments_ = scriptArgs;
      } else if (typeof arguments != "undefined") {
        arguments_ = arguments;
      }
      if (typeof quit === "function") {
        quit_ = function(status) {
          quit(status);
        };
      }
      if (typeof print !== "undefined") {
        if (typeof console === "undefined") console = {};
        console.log = print;
        console.warn = console.error =
          typeof printErr !== "undefined" ? printErr : print;
      }
    } else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
      if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = self.location.href;
      } else if (document.currentScript) {
        scriptDirectory = document.currentScript.src;
      }
      if (scriptDirectory.indexOf("blob:") !== 0) {
        scriptDirectory = scriptDirectory.substr(
          0,
          scriptDirectory.lastIndexOf("/") + 1
        );
      } else {
        scriptDirectory = "";
      }
      read_ = function shell_read(url) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.send(null);
        return xhr.responseText;
      };
      if (ENVIRONMENT_IS_WORKER) {
        readBinary = function readBinary(url) {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", url, false);
          xhr.responseType = "arraybuffer";
          xhr.send(null);
          return new Uint8Array(xhr.response);
        };
      }
      readAsync = function readAsync(url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
            onload(xhr.response);
            return;
          }
          onerror();
        };
        xhr.onerror = onerror;
        xhr.send(null);
      };
      setWindowTitle = function(title) {
        document.title = title;
      };
    } else {
    }
    var out = Module["print"] || console.log.bind(console);
    var err = Module["printErr"] || console.warn.bind(console);
    for (key in moduleOverrides) {
      if (moduleOverrides.hasOwnProperty(key)) {
        Module[key] = moduleOverrides[key];
      }
    }
    moduleOverrides = null;
    if (Module["arguments"]) arguments_ = Module["arguments"];
    if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
    if (Module["quit"]) quit_ = Module["quit"];
    function dynamicAlloc(size) {
      var ret = HEAP32[DYNAMICTOP_PTR >> 2];
      var end = (ret + size + 15) & -16;
      if (end > _emscripten_get_heap_size()) {
        abort();
      }
      HEAP32[DYNAMICTOP_PTR >> 2] = end;
      return ret;
    }
    function getNativeTypeSize(type) {
      switch (type) {
        case "i1":
        case "i8":
          return 1;
        case "i16":
          return 2;
        case "i32":
          return 4;
        case "i64":
          return 8;
        case "float":
          return 4;
        case "double":
          return 8;
        default: {
          if (type[type.length - 1] === "*") {
            return 4;
          } else if (type[0] === "i") {
            var bits = parseInt(type.substr(1));
            assert(
              bits % 8 === 0,
              "getNativeTypeSize invalid bits " + bits + ", type " + type
            );
            return bits / 8;
          } else {
            return 0;
          }
        }
      }
    }
    function warnOnce(text) {
      if (!warnOnce.shown) warnOnce.shown = {};
      if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        err(text);
      }
    }
    function makeBigInt(low, high, unsigned) {
      return unsigned
        ? +(low >>> 0) + +(high >>> 0) * 4294967296
        : +(low >>> 0) + +(high | 0) * 4294967296;
    }
    var tempRet0 = 0;
    var setTempRet0 = function(value) {
      tempRet0 = value;
    };
    var getTempRet0 = function() {
      return tempRet0;
    };
    var wasmBinary;
    if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
    var noExitRuntime;
    if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];
    if (typeof WebAssembly !== "object") {
      err("no native wasm support detected");
    }
    function setValue(ptr, value, type, noSafe) {
      type = type || "i8";
      if (type.charAt(type.length - 1) === "*") type = "i32";
      switch (type) {
        case "i1":
          HEAP8[ptr >> 0] = value;
          break;
        case "i8":
          HEAP8[ptr >> 0] = value;
          break;
        case "i16":
          HEAP16[ptr >> 1] = value;
          break;
        case "i32":
          HEAP32[ptr >> 2] = value;
          break;
        case "i64":
          (tempI64 = [
            value >>> 0,
            ((tempDouble = value),
            +Math_abs(tempDouble) >= 1
              ? tempDouble > 0
                ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) |
                    0) >>>
                  0
                : ~~+Math_ceil(
                    (tempDouble - +(~~tempDouble >>> 0)) / 4294967296
                  ) >>> 0
              : 0)
          ]),
            (HEAP32[ptr >> 2] = tempI64[0]),
            (HEAP32[(ptr + 4) >> 2] = tempI64[1]);
          break;
        case "float":
          HEAPF32[ptr >> 2] = value;
          break;
        case "double":
          HEAPF64[ptr >> 3] = value;
          break;
        default:
          abort("invalid type for setValue: " + type);
      }
    }
    function getValue(ptr, type, noSafe) {
      type = type || "i8";
      if (type.charAt(type.length - 1) === "*") type = "i32";
      switch (type) {
        case "i1":
          return HEAP8[ptr >> 0];
        case "i8":
          return HEAP8[ptr >> 0];
        case "i16":
          return HEAP16[ptr >> 1];
        case "i32":
          return HEAP32[ptr >> 2];
        case "i64":
          return HEAP32[ptr >> 2];
        case "float":
          return HEAPF32[ptr >> 2];
        case "double":
          return HEAPF64[ptr >> 3];
        default:
          abort("invalid type for getValue: " + type);
      }
      return null;
    }
    var wasmMemory;
    var wasmTable = new WebAssembly.Table({
      initial: 38900,
      maximum: 38900 + 0,
      element: "anyfunc"
    });
    var ABORT = false;
    var EXITSTATUS = 0;
    function assert(condition, text) {
      if (!condition) {
        abort("Assertion failed: " + text);
      }
    }
    function getCFunc(ident) {
      var func = Module["_" + ident];
      assert(
        func,
        "Cannot call unknown function " + ident + ", make sure it is exported"
      );
      return func;
    }
    function ccall(ident, returnType, argTypes, args, opts) {
      var toC = {
        string: function(str) {
          var ret = 0;
          if (str !== null && str !== undefined && str !== 0) {
            var len = (str.length << 2) + 1;
            ret = stackAlloc(len);
            stringToUTF8(str, ret, len);
          }
          return ret;
        },
        array: function(arr) {
          var ret = stackAlloc(arr.length);
          writeArrayToMemory(arr, ret);
          return ret;
        }
      };
      function convertReturnValue(ret) {
        if (returnType === "string") return UTF8ToString(ret);
        if (returnType === "boolean") return Boolean(ret);
        return ret;
      }
      var func = getCFunc(ident);
      var cArgs = [];
      var stack = 0;
      if (args) {
        for (var i = 0; i < args.length; i++) {
          var converter = toC[argTypes[i]];
          if (converter) {
            if (stack === 0) stack = stackSave();
            cArgs[i] = converter(args[i]);
          } else {
            cArgs[i] = args[i];
          }
        }
      }
      var ret = func.apply(null, cArgs);
      ret = convertReturnValue(ret);
      if (stack !== 0) stackRestore(stack);
      return ret;
    }
    function cwrap(ident, returnType, argTypes, opts) {
      argTypes = argTypes || [];
      var numericArgs = argTypes.every(function(type) {
        return type === "number";
      });
      var numericRet = returnType !== "string";
      if (numericRet && numericArgs && !opts) {
        return getCFunc(ident);
      }
      return function() {
        return ccall(ident, returnType, argTypes, arguments, opts);
      };
    }
    var ALLOC_NORMAL = 0;
    var ALLOC_NONE = 3;
    function allocate(slab, types, allocator, ptr) {
      var zeroinit, size;
      if (typeof slab === "number") {
        zeroinit = true;
        size = slab;
      } else {
        zeroinit = false;
        size = slab.length;
      }
      var singleType = typeof types === "string" ? types : null;
      var ret;
      if (allocator == ALLOC_NONE) {
        ret = ptr;
      } else {
        ret = [_malloc, stackAlloc, dynamicAlloc][allocator](
          Math.max(size, singleType ? 1 : types.length)
        );
      }
      if (zeroinit) {
        var stop;
        ptr = ret;
        assert((ret & 3) == 0);
        stop = ret + (size & ~3);
        for (; ptr < stop; ptr += 4) {
          HEAP32[ptr >> 2] = 0;
        }
        stop = ret + size;
        while (ptr < stop) {
          HEAP8[ptr++ >> 0] = 0;
        }
        return ret;
      }
      if (singleType === "i8") {
        if (slab.subarray || slab.slice) {
          HEAPU8.set(slab, ret);
        } else {
          HEAPU8.set(new Uint8Array(slab), ret);
        }
        return ret;
      }
      var i = 0,
        type,
        typeSize,
        previousType;
      while (i < size) {
        var curr = slab[i];
        type = singleType || types[i];
        if (type === 0) {
          i++;
          continue;
        }
        if (type == "i64") type = "i32";
        setValue(ret + i, curr, type);
        if (previousType !== type) {
          typeSize = getNativeTypeSize(type);
          previousType = type;
        }
        i += typeSize;
      }
      return ret;
    }
    function AsciiToString(ptr) {
      var str = "";
      while (1) {
        var ch = HEAPU8[ptr++ >> 0];
        if (!ch) return str;
        str += String.fromCharCode(ch);
      }
    }
    var UTF8Decoder =
      typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;
    function UTF8ArrayToString(u8Array, idx, maxBytesToRead) {
      var endIdx = idx + maxBytesToRead;
      var endPtr = idx;
      while (u8Array[endPtr] && !(endPtr >= endIdx)) ++endPtr;
      if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
        return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
      } else {
        var str = "";
        while (idx < endPtr) {
          var u0 = u8Array[idx++];
          if (!(u0 & 128)) {
            str += String.fromCharCode(u0);
            continue;
          }
          var u1 = u8Array[idx++] & 63;
          if ((u0 & 224) == 192) {
            str += String.fromCharCode(((u0 & 31) << 6) | u1);
            continue;
          }
          var u2 = u8Array[idx++] & 63;
          if ((u0 & 240) == 224) {
            u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
          } else {
            u0 =
              ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (u8Array[idx++] & 63);
          }
          if (u0 < 65536) {
            str += String.fromCharCode(u0);
          } else {
            var ch = u0 - 65536;
            str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
          }
        }
      }
      return str;
    }
    function UTF8ToString(ptr, maxBytesToRead) {
      return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
    }
    function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
      if (!(maxBytesToWrite > 0)) return 0;
      var startIdx = outIdx;
      var endIdx = outIdx + maxBytesToWrite - 1;
      for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) {
          var u1 = str.charCodeAt(++i);
          u = (65536 + ((u & 1023) << 10)) | (u1 & 1023);
        }
        if (u <= 127) {
          if (outIdx >= endIdx) break;
          outU8Array[outIdx++] = u;
        } else if (u <= 2047) {
          if (outIdx + 1 >= endIdx) break;
          outU8Array[outIdx++] = 192 | (u >> 6);
          outU8Array[outIdx++] = 128 | (u & 63);
        } else if (u <= 65535) {
          if (outIdx + 2 >= endIdx) break;
          outU8Array[outIdx++] = 224 | (u >> 12);
          outU8Array[outIdx++] = 128 | ((u >> 6) & 63);
          outU8Array[outIdx++] = 128 | (u & 63);
        } else {
          if (outIdx + 3 >= endIdx) break;
          outU8Array[outIdx++] = 240 | (u >> 18);
          outU8Array[outIdx++] = 128 | ((u >> 12) & 63);
          outU8Array[outIdx++] = 128 | ((u >> 6) & 63);
          outU8Array[outIdx++] = 128 | (u & 63);
        }
      }
      outU8Array[outIdx] = 0;
      return outIdx - startIdx;
    }
    function stringToUTF8(str, outPtr, maxBytesToWrite) {
      return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
    }
    function lengthBytesUTF8(str) {
      var len = 0;
      for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343)
          u = (65536 + ((u & 1023) << 10)) | (str.charCodeAt(++i) & 1023);
        if (u <= 127) ++len;
        else if (u <= 2047) len += 2;
        else if (u <= 65535) len += 3;
        else len += 4;
      }
      return len;
    }
    var UTF16Decoder =
      typeof TextDecoder !== "undefined"
        ? new TextDecoder("utf-16le")
        : undefined;
    function allocateUTF8OnStack(str) {
      var size = lengthBytesUTF8(str) + 1;
      var ret = stackAlloc(size);
      stringToUTF8Array(str, HEAP8, ret, size);
      return ret;
    }
    function writeArrayToMemory(array, buffer) {
      HEAP8.set(array, buffer);
    }
    function writeAsciiToMemory(str, buffer, dontAddNull) {
      for (var i = 0; i < str.length; ++i) {
        HEAP8[buffer++ >> 0] = str.charCodeAt(i);
      }
      if (!dontAddNull) HEAP8[buffer >> 0] = 0;
    }
    var PAGE_SIZE = 16384;
    var WASM_PAGE_SIZE = 65536;
    function alignUp(x, multiple) {
      if (x % multiple > 0) {
        x += multiple - (x % multiple);
      }
      return x;
    }
    var buffer,
      HEAP8,
      HEAPU8,
      HEAP16,
      HEAPU16,
      HEAP32,
      HEAPU32,
      HEAPF32,
      HEAPF64;
    function updateGlobalBufferAndViews(buf) {
      buffer = buf;
      Module["HEAP8"] = HEAP8 = new Int8Array(buf);
      Module["HEAP16"] = HEAP16 = new Int16Array(buf);
      Module["HEAP32"] = HEAP32 = new Int32Array(buf);
      Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
      Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
      Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
      Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
      Module["HEAPF64"] = HEAPF64 = new Float64Array(buf);
    }
    var DYNAMIC_BASE = 7358928,
      DYNAMICTOP_PTR = 2115856;
    var INITIAL_TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 16777216;
    if (Module["wasmMemory"]) {
      wasmMemory = Module["wasmMemory"];
    } else {
      wasmMemory = new WebAssembly.Memory({
        initial: INITIAL_TOTAL_MEMORY / WASM_PAGE_SIZE
      });
    }
    if (wasmMemory) {
      buffer = wasmMemory.buffer;
    }
    INITIAL_TOTAL_MEMORY = buffer.byteLength;
    updateGlobalBufferAndViews(buffer);
    HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;
    function callRuntimeCallbacks(callbacks) {
      while (callbacks.length > 0) {
        var callback = callbacks.shift();
        if (typeof callback == "function") {
          callback();
          continue;
        }
        var func = callback.func;
        if (typeof func === "number") {
          if (callback.arg === undefined) {
            Module["dynCall_v"](func);
          } else {
            Module["dynCall_vi"](func, callback.arg);
          }
        } else {
          func(callback.arg === undefined ? null : callback.arg);
        }
      }
    }
    var __ATPRERUN__ = [];
    var __ATINIT__ = [];
    var __ATMAIN__ = [];
    var __ATEXIT__ = [];
    var __ATPOSTRUN__ = [];
    var runtimeInitialized = false;
    var runtimeExited = false;
    function preRun() {
      if (Module["preRun"]) {
        if (typeof Module["preRun"] == "function")
          Module["preRun"] = [Module["preRun"]];
        while (Module["preRun"].length) {
          addOnPreRun(Module["preRun"].shift());
        }
      }
      callRuntimeCallbacks(__ATPRERUN__);
    }
    function initRuntime() {
      runtimeInitialized = true;
      if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
      TTY.init();
      SOCKFS.root = FS.mount(SOCKFS, {}, null);
      callRuntimeCallbacks(__ATINIT__);
    }
    function preMain() {
      FS.ignorePermissions = false;
      callRuntimeCallbacks(__ATMAIN__);
    }
    function exitRuntime() {
      runtimeExited = true;
    }
    function postRun() {
      if (Module["postRun"]) {
        if (typeof Module["postRun"] == "function")
          Module["postRun"] = [Module["postRun"]];
        while (Module["postRun"].length) {
          addOnPostRun(Module["postRun"].shift());
        }
      }
      callRuntimeCallbacks(__ATPOSTRUN__);
    }
    function addOnPreRun(cb) {
      __ATPRERUN__.unshift(cb);
    }
    function addOnPostRun(cb) {
      __ATPOSTRUN__.unshift(cb);
    }
    var Math_abs = Math.abs;
    var Math_ceil = Math.ceil;
    var Math_floor = Math.floor;
    var Math_min = Math.min;
    var runDependencies = 0;
    var runDependencyWatcher = null;
    var dependenciesFulfilled = null;
    function getUniqueRunDependency(id) {
      return id;
    }
    function addRunDependency(id) {
      runDependencies++;
      if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies);
      }
    }
    function removeRunDependency(id) {
      runDependencies--;
      if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies);
      }
      if (runDependencies == 0) {
        if (runDependencyWatcher !== null) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
        }
        if (dependenciesFulfilled) {
          var callback = dependenciesFulfilled;
          dependenciesFulfilled = null;
          callback();
        }
      }
    }
    Module["preloadedImages"] = {};
    Module["preloadedAudios"] = {};
    function abort(what) {
      if (Module["onAbort"]) {
        Module["onAbort"](what);
      }
      what += "";
      out(what);
      err(what);
      ABORT = true;
      EXITSTATUS = 1;
      throw "abort(" + what + "). Build with -s ASSERTIONS=1 for more info.";
    }
    var dataURIPrefix = "data:application/octet-stream;base64,";
    function isDataURI(filename) {
      return String.prototype.startsWith
        ? filename.startsWith(dataURIPrefix)
        : filename.indexOf(dataURIPrefix) === 0;
    }
    var wasmBinaryFile = "godot.javascript.opt.debug.wasm";
    if (!isDataURI(wasmBinaryFile)) {
      wasmBinaryFile = locateFile(wasmBinaryFile);
    }
    function getBinary() {
      try {
        if (wasmBinary) {
          return new Uint8Array(wasmBinary);
        }
        if (readBinary) {
          return readBinary(wasmBinaryFile);
        } else {
          throw "both async and sync fetching of the wasm failed";
        }
      } catch (err) {
        abort(err);
      }
    }
    function getBinaryPromise() {
      if (
        !wasmBinary &&
        (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) &&
        typeof fetch === "function"
      ) {
        return fetch(wasmBinaryFile, { credentials: "same-origin" })
          .then(function(response) {
            if (!response["ok"]) {
              throw "failed to load wasm binary file at '" +
                wasmBinaryFile +
                "'";
            }
            return response["arrayBuffer"]();
          })
          .catch(function() {
            return getBinary();
          });
      }
      return new Promise(function(resolve, reject) {
        resolve(getBinary());
      });
    }
    function createWasm() {
      var info = { env: asmLibraryArg, wasi_unstable: asmLibraryArg };
      function receiveInstance(instance, module) {
        var exports = instance.exports;
        Module["asm"] = exports;
        removeRunDependency("wasm-instantiate");
      }
      addRunDependency("wasm-instantiate");
      function receiveInstantiatedSource(output) {
        receiveInstance(output["instance"]);
      }
      function instantiateArrayBuffer(receiver) {
        return getBinaryPromise()
          .then(function(binary) {
            return WebAssembly.instantiate(binary, info);
          })
          .then(receiver, function(reason) {
            err("failed to asynchronously prepare wasm: " + reason);
            abort(reason);
          });
      }
      function instantiateAsync() {
        if (
          !wasmBinary &&
          typeof WebAssembly.instantiateStreaming === "function" &&
          !isDataURI(wasmBinaryFile) &&
          typeof fetch === "function"
        ) {
          fetch(wasmBinaryFile, { credentials: "same-origin" }).then(function(
            response
          ) {
            var result = WebAssembly.instantiateStreaming(response, info);
            return result.then(receiveInstantiatedSource, function(reason) {
              err("wasm streaming compile failed: " + reason);
              err("falling back to ArrayBuffer instantiation");
              instantiateArrayBuffer(receiveInstantiatedSource);
            });
          });
        } else {
          return instantiateArrayBuffer(receiveInstantiatedSource);
        }
      }
      if (Module["instantiateWasm"]) {
        try {
          var exports = Module["instantiateWasm"](info, receiveInstance);
          return exports;
        } catch (e) {
          err("Module.instantiateWasm callback failed with error: " + e);
          return false;
        }
      }
      instantiateAsync();
      return {};
    }
    var tempDouble;
    var tempI64;
    var ASM_CONSTS = [
      function() {
        _audioDriver_audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        _audioDriver_audioInput = null;
        _audioDriver_inputStream = null;
        _audioDriver_scriptNode = null;
      },
      function($0) {
        var channelCount = _audioDriver_audioContext.destination.channelCount;
        try {
          _audioDriver_scriptNode = _audioDriver_audioContext.createScriptProcessor(
            0,
            2,
            channelCount
          );
        } catch (e) {
          _audioDriver_scriptNode = _audioDriver_audioContext.createScriptProcessor(
            4096,
            2,
            channelCount
          );
        }
        _audioDriver_scriptNode.connect(_audioDriver_audioContext.destination);
        return _audioDriver_scriptNode.bufferSize;
      },
      function($0) {
        var INTERNAL_BUFFER_PTR = $0;
        var audioDriverMixFunction = cwrap("audio_driver_js_mix");
        var audioDriverProcessCapture = cwrap(
          "audio_driver_process_capture",
          null,
          ["number"]
        );
        _audioDriver_scriptNode.onaudioprocess = function(
          audioProcessingEvent
        ) {
          audioDriverMixFunction();
          var input = audioProcessingEvent.inputBuffer;
          var output = audioProcessingEvent.outputBuffer;
          var internalBuffer = HEAPF32.subarray(
            INTERNAL_BUFFER_PTR / HEAPF32.BYTES_PER_ELEMENT,
            INTERNAL_BUFFER_PTR / HEAPF32.BYTES_PER_ELEMENT +
              output.length * output.numberOfChannels
          );
          for (var channel = 0; channel < output.numberOfChannels; channel++) {
            var outputData = output.getChannelData(channel);
            for (var sample = 0; sample < outputData.length; sample++) {
              outputData[sample] =
                internalBuffer[sample * output.numberOfChannels + channel];
            }
          }
          if (_audioDriver_audioInput) {
            var inputDataL = input.getChannelData(0);
            var inputDataR = input.getChannelData(1);
            for (var i = 0; i < inputDataL.length; i++) {
              audioDriverProcessCapture(inputDataL[i]);
              audioDriverProcessCapture(inputDataR[i]);
            }
          }
        };
      },
      function() {
        if (_audioDriver_audioContext.resume)
          _audioDriver_audioContext.resume();
      },
      function() {
        return _audioDriver_audioContext.sampleRate;
      },
      function() {
        return _audioDriver_audioContext.destination.channelCount;
      },
      function() {
        _audioDriver_audioContext = null;
        _audioDriver_audioInput = null;
        _audioDriver_scriptNode = null;
      },
      function() {
        function gotMediaInput(stream) {
          _audioDriver_inputStream = stream;
          _audioDriver_audioInput = _audioDriver_audioContext.createMediaStreamSource(
            stream
          );
          _audioDriver_audioInput.connect(_audioDriver_scriptNode);
        }
        function gotMediaInputError(e) {
          out(e);
        }
        if (navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then(gotMediaInput, gotMediaInputError);
        } else {
          if (!navigator.getUserMedia)
            navigator.getUserMedia =
              navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
          navigator.getUserMedia(
            { audio: true },
            gotMediaInput,
            gotMediaInputError
          );
        }
      },
      function() {
        if (_audioDriver_inputStream) {
          const tracks = _audioDriver_inputStream.getTracks();
          for (var i = 0; i < tracks.length; i++) {
            tracks[i].stop();
          }
          _audioDriver_inputStream = null;
        }
        if (_audioDriver_audioInput) {
          _audioDriver_audioInput.disconnect();
          _audioDriver_audioInput = null;
        }
      },
      function($0, $1, $2, $3, $4) {
        const CODE = $0;
        const USE_GLOBAL_EXEC_CONTEXT = $1;
        const PTR = $2;
        const BYTEARRAY_PTR = $3;
        const BYTEARRAY_WRITE_PTR = $4;
        var eval_ret;
        try {
          if (USE_GLOBAL_EXEC_CONTEXT) {
            var global_eval = eval;
            eval_ret = global_eval(UTF8ToString(CODE));
          } else {
            eval_ret = eval(UTF8ToString(CODE));
          }
        } catch (e) {
          err(e);
          eval_ret = null;
        }
        switch (typeof eval_ret) {
          case "boolean":
            setValue(PTR, eval_ret, "i32");
            return 1;
          case "number":
            setValue(PTR, eval_ret, "double");
            return 3;
          case "string":
            var array_len = lengthBytesUTF8(eval_ret) + 1;
            var array_ptr = _malloc(array_len);
            try {
              if (array_ptr === 0) {
                throw new Error(
                  "String allocation failed (probably out of memory)"
                );
              }
              setValue(PTR, array_ptr, "*");
              stringToUTF8(eval_ret, array_ptr, array_len);
              return 4;
            } catch (e) {
              if (array_ptr !== 0) {
                _free(array_ptr);
              }
              err(e);
            }
            break;
          case "object":
            if (eval_ret === null) {
              break;
            }
            if (
              ArrayBuffer.isView(eval_ret) &&
              !(eval_ret instanceof Uint8Array)
            ) {
              eval_ret = new Uint8Array(eval_ret.buffer);
            } else if (eval_ret instanceof ArrayBuffer) {
              eval_ret = new Uint8Array(eval_ret);
            }
            if (eval_ret instanceof Uint8Array) {
              var bytes_ptr = ccall(
                "resize_poolbytearray_and_open_write",
                "number",
                ["number", "number", "number"],
                [BYTEARRAY_PTR, BYTEARRAY_WRITE_PTR, eval_ret.length]
              );
              HEAPU8.set(eval_ret, bytes_ptr);
              return 20;
            }
            break;
        }
        return 0;
      },
      function($0) {
        _free($0);
      },
      function() {
        FS.mkdir("/userfs");
        FS.mount(IDBFS, {}, "/userfs");
        FS.syncfs(true, function(err) {
          ccall(
            "main_after_fs_sync",
            null,
            ["string"],
            [err ? err.message : ""]
          );
        });
      },
      function() {
        return document.getElementById("canvas").getBoundingClientRect().x;
      },
      function() {
        return document.getElementById("canvas").getBoundingClientRect().y;
      },
      function() {
        Module.canvas.focus();
      },
      function($0) {
        Module.canvas.style.cursor = UTF8ToString($0);
      },
      function($0, $1, $2) {
        var PNG_PTR = $0;
        var PNG_LEN = $1;
        var PTR = $2;
        var png = new Blob([HEAPU8.slice(PNG_PTR, PNG_PTR + PNG_LEN)], {
          type: "image/png"
        });
        var url = URL.createObjectURL(png);
        var length_bytes = lengthBytesUTF8(url) + 1;
        var string_on_wasm_heap = _malloc(length_bytes);
        setValue(PTR, string_on_wasm_heap, "*");
        stringToUTF8(url, string_on_wasm_heap, length_bytes);
      },
      function($0) {
        URL.revokeObjectURL(UTF8ToString($0).split("?")[0]);
      },
      function() {
        return Module.canvas.style.cursor === "none";
      },
      function() {
        return document.activeElement == Module.canvas;
      },
      function() {
        return "ontouchstart" in window;
      },
      function($0) {
        var text = UTF8ToString($0);
        if (!navigator.clipboard || !navigator.clipboard.writeText) return 1;
        navigator.clipboard.writeText(text).catch(function(e) {
          console.error(
            "Setting OS clipboard is only possible from an input callback for the HTML5 plafrom. Exception:",
            e
          );
        });
        return 0;
      },
      function() {
        try {
          navigator.clipboard
            .readText()
            .then(function(result) {
              ccall("update_clipboard", "void", ["string"], [result]);
            })
            .catch(function(e) {});
        } catch (e) {}
      },
      function() {
        (
          canvas.requestFullscreen ||
          canvas.msRequestFullscreen ||
          canvas.mozRequestFullScreen ||
          canvas.mozRequestFullscreen ||
          canvas.webkitRequestFullscreen
        ).call(canvas);
      },
      function() {
        return Module.resizeCanvasOnStart;
      },
      function($0) {
        stringToUTF8(Module.locale, $0, 16);
      },
      function() {
        const send_notification = cwrap("send_notification", null, ["number"]);
        const notifications = arguments;
        ["mouseover", "mouseleave", "focus", "blur"].forEach(function(
          event,
          index
        ) {
          Module.canvas.addEventListener(
            event,
            send_notification.bind(null, notifications[index])
          );
        });
        const update_clipboard = cwrap("update_clipboard", null, ["string"]);
        window.addEventListener(
          "paste",
          function(evt) {
            update_clipboard(evt.clipboardData.getData("text"));
          },
          true
        );
      },
      function() {
        FS.syncfs(function(error) {
          if (error) {
            err("Failed to save IDB file system: " + error.message);
          }
        });
      },
      function($0) {
        window.alert(UTF8ToString($0));
      },
      function($0) {
        document.title = UTF8ToString($0);
      },
      function($0, $1) {
        var PNG_PTR = $0;
        var PNG_LEN = $1;
        var png = new Blob([HEAPU8.slice(PNG_PTR, PNG_PTR + PNG_LEN)], {
          type: "image/png"
        });
        var url = URL.createObjectURL(png);
        var link = document.getElementById("-gd-engine-icon");
        if (link === null) {
          link = document.createElement("link");
          link.rel = "icon";
          link.id = "-gd-engine-icon";
          document.head.appendChild(link);
        }
        link.href = url;
      },
      function($0) {
        window.open(UTF8ToString($0), "_blank");
      },
      function($0) {
        var dict = Module.IDHandler.get($0);
        if (!dict) return;
        var channel = dict["channel"];
        channel.onopen = null;
        channel.onclose = null;
        channel.onerror = null;
        channel.onmessage = null;
        channel.close();
      },
      function($0) {
        var dict = Module.IDHandler.get($0);
        if (!dict) return 3;
        var channel = dict["channel"];
        switch (channel.readyState) {
          case "connecting":
            return 0;
          case "open":
            return 1;
          case "closing":
            return 2;
          case "closed":
            return 3;
        }
        return 3;
      },
      function($0, $1, $2, $3) {
        var dict = Module.IDHandler.get($0);
        var channel = dict["channel"];
        var bytes_array = new Uint8Array($2);
        var i = 0;
        for (i = 0; i < $2; i++) {
          bytes_array[i] = getValue($1 + i, "i8");
        }
        if ($3) {
          channel.send(bytes_array.buffer);
        } else {
          var string = new TextDecoder("utf-8").decode(bytes_array);
          channel.send(string);
        }
      },
      function($0) {
        var dict = Module.IDHandler.get($0);
        if (!dict || !dict["channel"]) {
          return true;
        }
        var out = dict["channel"].ordered;
        return out === null ? true : out;
      },
      function($0) {
        var dict = Module.IDHandler.get($0);
        if (!dict || !dict["channel"]) {
          return 65535;
        }
        var out = dict["channel"].id;
        return out === null ? 65535 : out;
      },
      function($0) {
        var dict = Module.IDHandler.get($0);
        if (!dict || !dict["channel"]) {
          return 65535;
        }
        if (dict["channel"].maxRetransmitTime !== undefined) {
          return dict["channel"].maxRetransmitTime;
        }
        var out = dict["channel"].maxPacketLifeTime;
        return out === null ? 65535 : out;
      },
      function($0) {
        var dict = Module.IDHandler.get($0);
        if (!dict || !dict["channel"]) {
          return 65535;
        }
        var out = dict["channel"].maxRetransmits;
        return out === null ? 65535 : out;
      },
      function($0) {
        var dict = Module.IDHandler.get($0);
        if (!dict || !dict["channel"]) {
          return false;
        }
        var out = dict["channel"].negotiated;
        return out === null ? false : out;
      },
      function($0, $1) {
        var c_ptr = $0;
        var dict = Module.IDHandler.get($1);
        if (!dict) return;
        var channel = dict["channel"];
        dict["ptr"] = c_ptr;
        channel.binaryType = "arraybuffer";
        channel.onopen = function(evt) {
          ccall("_emrtc_on_ch_open", "void", ["number"], [c_ptr]);
        };
        channel.onclose = function(evt) {
          ccall("_emrtc_on_ch_close", "void", ["number"], [c_ptr]);
        };
        channel.onerror = function(evt) {
          ccall("_emrtc_on_ch_error", "void", ["number"], [c_ptr]);
        };
        channel.onmessage = function(event) {
          var buffer;
          var is_string = 0;
          if (event.data instanceof ArrayBuffer) {
            buffer = new Uint8Array(event.data);
          } else if (event.data instanceof Blob) {
            console.error("Blob type not supported");
            return;
          } else if (typeof event.data === "string") {
            is_string = 1;
            var enc = new TextEncoder("utf-8");
            buffer = new Uint8Array(enc.encode(event.data));
          } else {
            console.error("Unknown message type");
            return;
          }
          var len = buffer.length * buffer.BYTES_PER_ELEMENT;
          var out = Module._malloc(len);
          Module.HEAPU8.set(buffer, out);
          ccall(
            "_emrtc_on_ch_message",
            "void",
            ["number", "number", "number", "number"],
            [c_ptr, out, len, is_string]
          );
          Module._free(out);
        };
      },
      function($0) {
        var dict = Module.IDHandler.get($0);
        if (!dict || !dict["channel"]) return 0;
        var str = dict["channel"].label;
        var len = lengthBytesUTF8(str) + 1;
        var ptr = _malloc(str);
        stringToUTF8(str, ptr, len + 1);
        return ptr;
      },
      function($0) {
        _free($0);
      },
      function($0) {
        var dict = Module.IDHandler.get($0);
        if (!dict || !dict["channel"]) return 0;
        var str = dict["channel"].protocol;
        var len = lengthBytesUTF8(str) + 1;
        var ptr = _malloc(str);
        stringToUTF8(str, ptr, len + 1);
        return ptr;
      },
      function($0) {
        Module.IDHandler.remove($0);
      },
      function($0) {
        var dict = Module.IDHandler.get($0);
        if (!dict) return 5;
        var conn = dict["conn"];
        switch (conn.iceConnectionState) {
          case "new":
            return 0;
          case "checking":
            return 1;
          case "connected":
          case "completed":
            return 2;
          case "disconnected":
            return 3;
          case "failed":
            return 4;
          case "closed":
            return 5;
        }
        return 5;
      },
      function($0, $1) {
        var dict = Module.IDHandler.get($0);
        var c_ptr = dict["ptr"];
        var config = JSON.parse(UTF8ToString($1));
        var conn = null;
        try {
          conn = new RTCPeerConnection(config);
        } catch (e) {
          console.log(e);
          return;
        }
        conn.oniceconnectionstatechange = function(event) {
          if (!Module.IDHandler.get($0)) return;
          ccall(
            "_emrtc_on_connection_state_changed",
            "void",
            ["number"],
            [c_ptr]
          );
        };
        conn.onicecandidate = function(event) {
          if (!Module.IDHandler.get($0)) return;
          if (!event.candidate) return;
          var c = event.candidate;
          ccall(
            "_emrtc_on_ice_candidate",
            "void",
            ["number", "string", "number", "string"],
            [c_ptr, c.sdpMid, c.sdpMLineIndex, c.candidate]
          );
        };
        conn.ondatachannel = function(evt) {
          var dict = Module.IDHandler.get($0);
          if (!dict) {
            return;
          }
          var id = Module.IDHandler.add({ channel: evt.channel, ptr: null });
          ccall(
            "_emrtc_emit_channel",
            "void",
            ["number", "number"],
            [c_ptr, id]
          );
        };
        dict["conn"] = conn;
      },
      function($0) {
        var dict = Module.IDHandler.get($0);
        if (!dict) return;
        if (dict["conn"]) {
          dict["conn"].close();
        }
      },
      function($0) {
        var dict = Module.IDHandler.get($0);
        var conn = dict["conn"];
        var c_ptr = dict["ptr"];
        var onError = function(error) {
          console.error(error);
          ccall("_emrtc_on_error", "void", [], []);
        };
        var onCreated = function(offer) {
          ccall(
            "_emrtc_session_description_created",
            "void",
            ["number", "string", "string"],
            [c_ptr, offer.type, offer.sdp]
          );
        };
        conn
          .createOffer()
          .then(onCreated)
          .catch(onError);
      },
      function($0, $1, $2) {
        var dict = Module.IDHandler.get($0);
        var conn = dict["conn"];
        var c_ptr = dict["ptr"];
        var type = UTF8ToString($1);
        var sdp = UTF8ToString($2);
        var onError = function(error) {
          console.error(error);
          ccall("_emrtc_on_error", "void", [], []);
        };
        conn.setLocalDescription({ sdp: sdp, type: type }).catch(onError);
      },
      function($0, $1, $2) {
        var dict = Module.IDHandler.get($0);
        var conn = dict["conn"];
        var c_ptr = dict["ptr"];
        var type = UTF8ToString($1);
        var sdp = UTF8ToString($2);
        var onError = function(error) {
          console.error(error);
          ccall("_emrtc_on_error", "void", [], []);
        };
        var onCreated = function(offer) {
          ccall(
            "_emrtc_session_description_created",
            "void",
            ["number", "string", "string"],
            [c_ptr, offer.type, offer.sdp]
          );
        };
        var onSet = function() {
          if (type != "offer") {
            return;
          }
          conn.createAnswer().then(onCreated);
        };
        conn
          .setRemoteDescription({ sdp: sdp, type: type })
          .then(onSet)
          .catch(onError);
      },
      function($0, $1, $2, $3) {
        var dict = Module.IDHandler.get($0);
        var conn = dict["conn"];
        var c_ptr = dict["ptr"];
        var sdpMidName = UTF8ToString($1);
        var sdpMlineIndexName = UTF8ToString($2);
        var sdpName = UTF8ToString($3);
        conn.addIceCandidate(
          new RTCIceCandidate({
            candidate: sdpName,
            sdpMid: sdpMidName,
            sdpMlineIndex: sdpMlineIndexName
          })
        );
      },
      function($0, $1, $2) {
        try {
          var dict = Module.IDHandler.get($0);
          if (!dict) return 0;
          var label = UTF8ToString($1);
          var config = JSON.parse(UTF8ToString($2));
          var conn = dict["conn"];
          return Module.IDHandler.add({
            channel: conn.createDataChannel(label, config),
            ptr: null
          });
        } catch (e) {
          return 0;
        }
      },
      function($0) {
        return Module.IDHandler.add({ conn: null, ptr: $0 });
      },
      function($0, $1, $2, $3) {
        var sock = Module.IDHandler.get($0);
        var bytes_array = new Uint8Array($2);
        var i = 0;
        for (i = 0; i < $2; i++) {
          bytes_array[i] = getValue($1 + i, "i8");
        }
        if ($3) {
          sock.send(bytes_array.buffer);
        } else {
          var string = new TextDecoder("utf-8").decode(bytes_array);
          sock.send(string);
        }
      },
      function($0, $1, $2) {
        var sock = Module.IDHandler.get($0);
        var code = $1;
        var reason = UTF8ToString($2);
        sock.close(code, reason);
        Module.IDHandler.remove($0);
      },
      function($0, $1, $2) {
        var proto_str = UTF8ToString($2);
        var socket = null;
        if (proto_str) {
          socket = new WebSocket(UTF8ToString($1), proto_str.split(","));
        } else {
          socket = new WebSocket(UTF8ToString($1));
        }
        var c_ptr = Module.IDHandler.get($0);
        socket.binaryType = "arraybuffer";
        socket.addEventListener("open", function(event) {
          if (!Module.IDHandler.has($0)) return;
          ccall(
            "_esws_on_connect",
            "void",
            ["number", "string"],
            [c_ptr, socket.protocol]
          );
        });
        socket.addEventListener("message", function(event) {
          if (!Module.IDHandler.has($0)) return;
          var buffer;
          var is_string = 0;
          if (event.data instanceof ArrayBuffer) {
            buffer = new Uint8Array(event.data);
          } else if (event.data instanceof Blob) {
            alert("Blob type not supported");
            return;
          } else if (typeof event.data === "string") {
            is_string = 1;
            var enc = new TextEncoder("utf-8");
            buffer = new Uint8Array(enc.encode(event.data));
          } else {
            alert("Unknown message type");
            return;
          }
          var len = buffer.length * buffer.BYTES_PER_ELEMENT;
          var out = Module._malloc(len);
          Module.HEAPU8.set(buffer, out);
          ccall(
            "_esws_on_message",
            "void",
            ["number", "number", "number", "number"],
            [c_ptr, out, len, is_string]
          );
          Module._free(out);
        });
        socket.addEventListener("error", function(event) {
          if (!Module.IDHandler.has($0)) return;
          ccall("_esws_on_error", "void", ["number"], [c_ptr]);
        });
        socket.addEventListener("close", function(event) {
          if (!Module.IDHandler.has($0)) return;
          var was_clean = 0;
          if (event.wasClean) was_clean = 1;
          ccall(
            "_esws_on_close",
            "void",
            ["number", "number", "string", "number"],
            [c_ptr, event.code, event.reason, was_clean]
          );
        });
        return Module.IDHandler.add(socket);
      },
      function($0) {
        return Module.IDHandler.add($0);
      },
      function($0, $1, $2, $3) {
        GLctx.getBufferSubData($0, $1, HEAPU8, $2, $3);
      }
    ];
    function _emscripten_asm_const_iii(code, sig_ptr, argbuf) {
      var sig = AsciiToString(sig_ptr);
      var args = [];
      var align_to = function(ptr, align) {
        return (ptr + align - 1) & ~(align - 1);
      };
      var buf = argbuf;
      for (var i = 0; i < sig.length; i++) {
        var c = sig[i];
        if (c == "d" || c == "f") {
          buf = align_to(buf, 8);
          args.push(HEAPF64[buf >> 3]);
          buf += 8;
        } else if (c == "i") {
          buf = align_to(buf, 4);
          args.push(HEAP32[buf >> 2]);
          buf += 4;
        }
      }
      return ASM_CONSTS[code].apply(null, args);
    }
    __ATINIT__.push({
      func: function() {
        ___wasm_call_ctors();
      }
    });
    function demangle(func) {
      return func;
    }
    function demangleAll(text) {
      var regex = /\b_Z[\w\d_]+/g;
      return text.replace(regex, function(x) {
        var y = demangle(x);
        return x === y ? x : y + " [" + x + "]";
      });
    }
    function jsStackTrace() {
      var err = new Error();
      if (!err.stack) {
        try {
          throw new Error(0);
        } catch (e) {
          err = e;
        }
        if (!err.stack) {
          return "(no stack trace available)";
        }
      }
      return err.stack.toString();
    }
    function stackTrace() {
      var js = jsStackTrace();
      if (Module["extraStackTrace"]) js += "\n" + Module["extraStackTrace"]();
      return demangleAll(js);
    }
    function ___assert_fail(condition, filename, line, func) {
      abort(
        "Assertion failed: " +
          UTF8ToString(condition) +
          ", at: " +
          [
            filename ? UTF8ToString(filename) : "unknown filename",
            line,
            func ? UTF8ToString(func) : "unknown function"
          ]
      );
    }
    function ___lock() {}
    function ___setErrNo(value) {
      if (Module["___errno_location"])
        HEAP32[Module["___errno_location"]() >> 2] = value;
      return value;
    }
    function ___map_file(pathname, size) {
      ___setErrNo(63);
      return -1;
    }
    var PATH = {
      splitPath: function(filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },
      normalizeArray: function(parts, allowAboveRoot) {
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === ".") {
            parts.splice(i, 1);
          } else if (last === "..") {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        if (allowAboveRoot) {
          for (; up; up--) {
            parts.unshift("..");
          }
        }
        return parts;
      },
      normalize: function(path) {
        var isAbsolute = path.charAt(0) === "/",
          trailingSlash = path.substr(-1) === "/";
        path = PATH.normalizeArray(
          path.split("/").filter(function(p) {
            return !!p;
          }),
          !isAbsolute
        ).join("/");
        if (!path && !isAbsolute) {
          path = ".";
        }
        if (path && trailingSlash) {
          path += "/";
        }
        return (isAbsolute ? "/" : "") + path;
      },
      dirname: function(path) {
        var result = PATH.splitPath(path),
          root = result[0],
          dir = result[1];
        if (!root && !dir) {
          return ".";
        }
        if (dir) {
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },
      basename: function(path) {
        if (path === "/") return "/";
        var lastSlash = path.lastIndexOf("/");
        if (lastSlash === -1) return path;
        return path.substr(lastSlash + 1);
      },
      extname: function(path) {
        return PATH.splitPath(path)[3];
      },
      join: function() {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join("/"));
      },
      join2: function(l, r) {
        return PATH.normalize(l + "/" + r);
      }
    };
    var PATH_FS = {
      resolve: function() {
        var resolvedPath = "",
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = i >= 0 ? arguments[i] : FS.cwd();
          if (typeof path !== "string") {
            throw new TypeError("Arguments to path.resolve must be strings");
          } else if (!path) {
            return "";
          }
          resolvedPath = path + "/" + resolvedPath;
          resolvedAbsolute = path.charAt(0) === "/";
        }
        resolvedPath = PATH.normalizeArray(
          resolvedPath.split("/").filter(function(p) {
            return !!p;
          }),
          !resolvedAbsolute
        ).join("/");
        return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
      },
      relative: function(from, to) {
        from = PATH_FS.resolve(from).substr(1);
        to = PATH_FS.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== "") break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== "") break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split("/"));
        var toParts = trim(to.split("/"));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push("..");
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join("/");
      }
    };
    var TTY = {
      ttys: [],
      init: function() {},
      shutdown: function() {},
      register: function(dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },
      stream_ops: {
        open: function(stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(43);
          }
          stream.tty = tty;
          stream.seekable = false;
        },
        close: function(stream) {
          stream.tty.ops.flush(stream.tty);
        },
        flush: function(stream) {
          stream.tty.ops.flush(stream.tty);
        },
        read: function(stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(60);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(29);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(6);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset + i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },
        write: function(stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(60);
          }
          try {
            for (var i = 0; i < length; i++) {
              stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
            }
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }
      },
      default_tty_ops: {
        get_char: function(tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              var BUFSIZE = 256;
              var buf = Buffer.alloc
                ? Buffer.alloc(BUFSIZE)
                : new Buffer(BUFSIZE);
              var bytesRead = 0;
              try {
                bytesRead = fs.readSync(
                  process.stdin.fd,
                  buf,
                  0,
                  BUFSIZE,
                  null
                );
              } catch (e) {
                if (e.toString().indexOf("EOF") != -1) bytesRead = 0;
                else throw e;
              }
              if (bytesRead > 0) {
                result = buf.slice(0, bytesRead).toString("utf-8");
              } else {
                result = null;
              }
            } else if (
              typeof window != "undefined" &&
              typeof window.prompt == "function"
            ) {
              result = window.prompt("Input: ");
              if (result !== null) {
                result += "\n";
              }
            } else if (typeof readline == "function") {
              result = readline();
              if (result !== null) {
                result += "\n";
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },
        put_char: function(tty, val) {
          if (val === null || val === 10) {
            out(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        },
        flush: function(tty) {
          if (tty.output && tty.output.length > 0) {
            out(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }
      },
      default_tty1_ops: {
        put_char: function(tty, val) {
          if (val === null || val === 10) {
            err(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        },
        flush: function(tty) {
          if (tty.output && tty.output.length > 0) {
            err(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }
      }
    };
    var MEMFS = {
      ops_table: null,
      mount: function(mount) {
        return MEMFS.createNode(null, "/", 16384 | 511, 0);
      },
      createNode: function(parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          throw new FS.ErrnoError(63);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: { llseek: MEMFS.stream_ops.llseek }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap,
                msync: MEMFS.stream_ops.msync
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            }
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.usedBytes = 0;
          node.contents = null;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },
      getFileDataAsRegularArray: function(node) {
        if (node.contents && node.contents.subarray) {
          var arr = [];
          for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
          return arr;
        }
        return node.contents;
      },
      getFileDataAsTypedArray: function(node) {
        if (!node.contents) return new Uint8Array();
        if (node.contents.subarray)
          return node.contents.subarray(0, node.usedBytes);
        return new Uint8Array(node.contents);
      },
      expandFileStorage: function(node, newCapacity) {
        var prevCapacity = node.contents ? node.contents.length : 0;
        if (prevCapacity >= newCapacity) return;
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(
          newCapacity,
          (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125)) |
            0
        );
        if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
        var oldContents = node.contents;
        node.contents = new Uint8Array(newCapacity);
        if (node.usedBytes > 0)
          node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
        return;
      },
      resizeFileStorage: function(node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
          node.contents = null;
          node.usedBytes = 0;
          return;
        }
        if (!node.contents || node.contents.subarray) {
          var oldContents = node.contents;
          node.contents = new Uint8Array(new ArrayBuffer(newSize));
          if (oldContents) {
            node.contents.set(
              oldContents.subarray(0, Math.min(newSize, node.usedBytes))
            );
          }
          node.usedBytes = newSize;
          return;
        }
        if (!node.contents) node.contents = [];
        if (node.contents.length > newSize) node.contents.length = newSize;
        else while (node.contents.length < newSize) node.contents.push(0);
        node.usedBytes = newSize;
      },
      node_ops: {
        getattr: function(node) {
          var attr = {};
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.usedBytes;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },
        setattr: function(node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.resizeFileStorage(node, attr.size);
          }
        },
        lookup: function(parent, name) {
          throw FS.genericErrors[44];
        },
        mknod: function(parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },
        rename: function(old_node, new_dir, new_name) {
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {}
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(55);
              }
            }
          }
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },
        unlink: function(parent, name) {
          delete parent.contents[name];
        },
        rmdir: function(parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(55);
          }
          delete parent.contents[name];
        },
        readdir: function(node) {
          var entries = [".", ".."];
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },
        symlink: function(parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
          node.link = oldpath;
          return node;
        },
        readlink: function(node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(28);
          }
          return node.link;
        }
      },
      stream_ops: {
        read: function(stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= stream.node.usedBytes) return 0;
          var size = Math.min(stream.node.usedBytes - position, length);
          if (size > 8 && contents.subarray) {
            buffer.set(contents.subarray(position, position + size), offset);
          } else {
            for (var i = 0; i < size; i++)
              buffer[offset + i] = contents[position + i];
          }
          return size;
        },
        write: function(stream, buffer, offset, length, position, canOwn) {
          canOwn = false;
          if (!length) return 0;
          var node = stream.node;
          node.timestamp = Date.now();
          if (buffer.subarray && (!node.contents || node.contents.subarray)) {
            if (canOwn) {
              node.contents = buffer.subarray(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (node.usedBytes === 0 && position === 0) {
              node.contents = new Uint8Array(
                buffer.subarray(offset, offset + length)
              );
              node.usedBytes = length;
              return length;
            } else if (position + length <= node.usedBytes) {
              node.contents.set(
                buffer.subarray(offset, offset + length),
                position
              );
              return length;
            }
          }
          MEMFS.expandFileStorage(node, position + length);
          if (node.contents.subarray && buffer.subarray)
            node.contents.set(
              buffer.subarray(offset, offset + length),
              position
            );
          else {
            for (var i = 0; i < length; i++) {
              node.contents[position + i] = buffer[offset + i];
            }
          }
          node.usedBytes = Math.max(node.usedBytes, position + length);
          return length;
        },
        llseek: function(stream, offset, whence) {
          var position = offset;
          if (whence === 1) {
            position += stream.position;
          } else if (whence === 2) {
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(28);
          }
          return position;
        },
        allocate: function(stream, offset, length) {
          MEMFS.expandFileStorage(stream.node, offset + length);
          stream.node.usedBytes = Math.max(
            stream.node.usedBytes,
            offset + length
          );
        },
        mmap: function(stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          if (
            !(flags & 2) &&
            (contents.buffer === buffer || contents.buffer === buffer.buffer)
          ) {
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            if (position > 0 || position + length < stream.node.usedBytes) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(
                  contents,
                  position,
                  position + length
                );
              }
            }
            allocated = true;
            var fromHeap = buffer.buffer == HEAP8.buffer;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(48);
            }
            (fromHeap ? HEAP8 : buffer).set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        },
        msync: function(stream, buffer, offset, length, mmapFlags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
          }
          if (mmapFlags & 2) {
            return 0;
          }
          var bytesWritten = MEMFS.stream_ops.write(
            stream,
            buffer,
            0,
            length,
            offset,
            false
          );
          return 0;
        }
      }
    };
    var IDBFS = {
      dbs: {},
      indexedDB: function() {
        if (typeof indexedDB !== "undefined") return indexedDB;
        var ret = null;
        if (typeof window === "object")
          ret =
            window.indexedDB ||
            window.mozIndexedDB ||
            window.webkitIndexedDB ||
            window.msIndexedDB;
        assert(ret, "IDBFS used, but indexedDB not supported");
        return ret;
      },
      DB_VERSION: 21,
      DB_STORE_NAME: "FILE_DATA",
      mount: function(mount) {
        return MEMFS.mount.apply(null, arguments);
      },
      syncfs: function(mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },
      getDB: function(name, callback) {
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return callback(e);
        }
        if (!req) {
          return callback("Unable to connect to IndexedDB");
        }
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          var transaction = e.target.transaction;
          var fileStore;
          if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
          } else {
            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
          }
          if (!fileStore.indexNames.contains("timestamp")) {
            fileStore.createIndex("timestamp", "timestamp", { unique: false });
          }
        };
        req.onsuccess = function() {
          db = req.result;
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },
      getLocalSet: function(mount, callback) {
        var entries = {};
        function isRealDir(p) {
          return p !== "." && p !== "..";
        }
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          };
        }
        var check = FS.readdir(mount.mountpoint)
          .filter(isRealDir)
          .map(toAbsolute(mount.mountpoint));
        while (check.length) {
          var path = check.pop();
          var stat;
          try {
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
          if (FS.isDir(stat.mode)) {
            check.push.apply(
              check,
              FS.readdir(path)
                .filter(isRealDir)
                .map(toAbsolute(path))
            );
          }
          entries[path] = { timestamp: stat.mtime };
        }
        return callback(null, { type: "local", entries: entries });
      },
      getRemoteSet: function(mount, callback) {
        var entries = {};
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
          try {
            var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readonly");
            transaction.onerror = function(e) {
              callback(this.error);
              e.preventDefault();
            };
            var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
            var index = store.index("timestamp");
            index.openKeyCursor().onsuccess = function(event) {
              var cursor = event.target.result;
              if (!cursor) {
                return callback(null, {
                  type: "remote",
                  db: db,
                  entries: entries
                });
              }
              entries[cursor.primaryKey] = { timestamp: cursor.key };
              cursor.continue();
            };
          } catch (e) {
            return callback(e);
          }
        });
      },
      loadLocalEntry: function(path, callback) {
        var stat, node;
        try {
          var lookup = FS.lookupPath(path);
          node = lookup.node;
          stat = FS.stat(path);
        } catch (e) {
          return callback(e);
        }
        if (FS.isDir(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode });
        } else if (FS.isFile(stat.mode)) {
          node.contents = MEMFS.getFileDataAsTypedArray(node);
          return callback(null, {
            timestamp: stat.mtime,
            mode: stat.mode,
            contents: node.contents
          });
        } else {
          return callback(new Error("node type not supported"));
        }
      },
      storeLocalEntry: function(path, entry, callback) {
        try {
          if (FS.isDir(entry.mode)) {
            FS.mkdir(path, entry.mode);
          } else if (FS.isFile(entry.mode)) {
            FS.writeFile(path, entry.contents, { canOwn: true });
          } else {
            return callback(new Error("node type not supported"));
          }
          FS.chmod(path, entry.mode);
          FS.utime(path, entry.timestamp, entry.timestamp);
        } catch (e) {
          return callback(e);
        }
        callback(null);
      },
      removeLocalEntry: function(path, callback) {
        try {
          var lookup = FS.lookupPath(path);
          var stat = FS.stat(path);
          if (FS.isDir(stat.mode)) {
            FS.rmdir(path);
          } else if (FS.isFile(stat.mode)) {
            FS.unlink(path);
          }
        } catch (e) {
          return callback(e);
        }
        callback(null);
      },
      loadRemoteEntry: function(store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) {
          callback(null, event.target.result);
        };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },
      storeRemoteEntry: function(store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() {
          callback(null);
        };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },
      removeRemoteEntry: function(store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() {
          callback(null);
        };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },
      reconcile: function(src, dst, callback) {
        var total = 0;
        var create = [];
        Object.keys(src.entries).forEach(function(key) {
          var e = src.entries[key];
          var e2 = dst.entries[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create.push(key);
            total++;
          }
        });
        var remove = [];
        Object.keys(dst.entries).forEach(function(key) {
          var e = dst.entries[key];
          var e2 = src.entries[key];
          if (!e2) {
            remove.push(key);
            total++;
          }
        });
        if (!total) {
          return callback(null);
        }
        var errored = false;
        var db = src.type === "remote" ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readwrite");
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
        function done(err) {
          if (err && !errored) {
            errored = true;
            return callback(err);
          }
        }
        transaction.onerror = function(e) {
          done(this.error);
          e.preventDefault();
        };
        transaction.oncomplete = function(e) {
          if (!errored) {
            callback(null);
          }
        };
        create.sort().forEach(function(path) {
          if (dst.type === "local") {
            IDBFS.loadRemoteEntry(store, path, function(err, entry) {
              if (err) return done(err);
              IDBFS.storeLocalEntry(path, entry, done);
            });
          } else {
            IDBFS.loadLocalEntry(path, function(err, entry) {
              if (err) return done(err);
              IDBFS.storeRemoteEntry(store, path, entry, done);
            });
          }
        });
        remove
          .sort()
          .reverse()
          .forEach(function(path) {
            if (dst.type === "local") {
              IDBFS.removeLocalEntry(path, done);
            } else {
              IDBFS.removeRemoteEntry(store, path, done);
            }
          });
      }
    };
    var ERRNO_CODES = {
      EPERM: 63,
      ENOENT: 44,
      ESRCH: 71,
      EINTR: 27,
      EIO: 29,
      ENXIO: 60,
      E2BIG: 1,
      ENOEXEC: 45,
      EBADF: 8,
      ECHILD: 12,
      EAGAIN: 6,
      EWOULDBLOCK: 6,
      ENOMEM: 48,
      EACCES: 2,
      EFAULT: 21,
      ENOTBLK: 105,
      EBUSY: 10,
      EEXIST: 20,
      EXDEV: 75,
      ENODEV: 43,
      ENOTDIR: 54,
      EISDIR: 31,
      EINVAL: 28,
      ENFILE: 41,
      EMFILE: 33,
      ENOTTY: 59,
      ETXTBSY: 74,
      EFBIG: 22,
      ENOSPC: 51,
      ESPIPE: 70,
      EROFS: 69,
      EMLINK: 34,
      EPIPE: 64,
      EDOM: 18,
      ERANGE: 68,
      ENOMSG: 49,
      EIDRM: 24,
      ECHRNG: 106,
      EL2NSYNC: 156,
      EL3HLT: 107,
      EL3RST: 108,
      ELNRNG: 109,
      EUNATCH: 110,
      ENOCSI: 111,
      EL2HLT: 112,
      EDEADLK: 16,
      ENOLCK: 46,
      EBADE: 113,
      EBADR: 114,
      EXFULL: 115,
      ENOANO: 104,
      EBADRQC: 103,
      EBADSLT: 102,
      EDEADLOCK: 16,
      EBFONT: 101,
      ENOSTR: 100,
      ENODATA: 116,
      ETIME: 117,
      ENOSR: 118,
      ENONET: 119,
      ENOPKG: 120,
      EREMOTE: 121,
      ENOLINK: 47,
      EADV: 122,
      ESRMNT: 123,
      ECOMM: 124,
      EPROTO: 65,
      EMULTIHOP: 36,
      EDOTDOT: 125,
      EBADMSG: 9,
      ENOTUNIQ: 126,
      EBADFD: 127,
      EREMCHG: 128,
      ELIBACC: 129,
      ELIBBAD: 130,
      ELIBSCN: 131,
      ELIBMAX: 132,
      ELIBEXEC: 133,
      ENOSYS: 52,
      ENOTEMPTY: 55,
      ENAMETOOLONG: 37,
      ELOOP: 32,
      EOPNOTSUPP: 138,
      EPFNOSUPPORT: 139,
      ECONNRESET: 15,
      ENOBUFS: 42,
      EAFNOSUPPORT: 5,
      EPROTOTYPE: 67,
      ENOTSOCK: 57,
      ENOPROTOOPT: 50,
      ESHUTDOWN: 140,
      ECONNREFUSED: 14,
      EADDRINUSE: 3,
      ECONNABORTED: 13,
      ENETUNREACH: 40,
      ENETDOWN: 38,
      ETIMEDOUT: 73,
      EHOSTDOWN: 142,
      EHOSTUNREACH: 23,
      EINPROGRESS: 26,
      EALREADY: 7,
      EDESTADDRREQ: 17,
      EMSGSIZE: 35,
      EPROTONOSUPPORT: 66,
      ESOCKTNOSUPPORT: 137,
      EADDRNOTAVAIL: 4,
      ENETRESET: 39,
      EISCONN: 30,
      ENOTCONN: 53,
      ETOOMANYREFS: 141,
      EUSERS: 136,
      EDQUOT: 19,
      ESTALE: 72,
      ENOTSUP: 138,
      ENOMEDIUM: 148,
      EILSEQ: 25,
      EOVERFLOW: 61,
      ECANCELED: 11,
      ENOTRECOVERABLE: 56,
      EOWNERDEAD: 62,
      ESTRPIPE: 135
    };
    var NODEFS = {
      isWindows: false,
      staticInit: function() {
        NODEFS.isWindows = !!process.platform.match(/^win/);
        var flags = process["binding"]("constants");
        if (flags["fs"]) {
          flags = flags["fs"];
        }
        NODEFS.flagsForNodeMap = {
          1024: flags["O_APPEND"],
          64: flags["O_CREAT"],
          128: flags["O_EXCL"],
          0: flags["O_RDONLY"],
          2: flags["O_RDWR"],
          4096: flags["O_SYNC"],
          512: flags["O_TRUNC"],
          1: flags["O_WRONLY"]
        };
      },
      bufferFrom: function(arrayBuffer) {
        return Buffer["alloc"]
          ? Buffer.from(arrayBuffer)
          : new Buffer(arrayBuffer);
      },
      convertNodeCode: function(e) {
        var code = e.code;
        assert(code in ERRNO_CODES);
        return ERRNO_CODES[code];
      },
      mount: function(mount) {
        assert(ENVIRONMENT_HAS_NODE);
        return NODEFS.createNode(null, "/", NODEFS.getMode(mount.opts.root), 0);
      },
      createNode: function(parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(28);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },
      getMode: function(path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            stat.mode = stat.mode | ((stat.mode & 292) >> 2);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
        }
        return stat.mode;
      },
      realPath: function(node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },
      flagsForNode: function(flags) {
        flags &= ~2097152;
        flags &= ~2048;
        flags &= ~32768;
        flags &= ~524288;
        var newFlags = 0;
        for (var k in NODEFS.flagsForNodeMap) {
          if (flags & k) {
            newFlags |= NODEFS.flagsForNodeMap[k];
            flags ^= k;
          }
        }
        if (!flags) {
          return newFlags;
        } else {
          throw new FS.ErrnoError(28);
        }
      },
      node_ops: {
        getattr: function(node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
          }
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = ((stat.size + stat.blksize - 1) / stat.blksize) | 0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },
        setattr: function(node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
          }
        },
        lookup: function(parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },
        mknod: function(parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, "", { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
          }
          return node;
        },
        rename: function(oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
          }
        },
        unlink: function(parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
          }
        },
        rmdir: function(parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
          }
        },
        readdir: function(node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
          }
        },
        symlink: function(parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
          }
        },
        readlink: function(node) {
          var path = NODEFS.realPath(node);
          try {
            path = fs.readlinkSync(path);
            path = NODEJS_PATH.relative(
              NODEJS_PATH.resolve(node.mount.opts.root),
              path
            );
            return path;
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
          }
        }
      },
      stream_ops: {
        open: function(stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsForNode(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
          }
        },
        close: function(stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
          }
        },
        read: function(stream, buffer, offset, length, position) {
          if (length === 0) return 0;
          try {
            return fs.readSync(
              stream.nfd,
              NODEFS.bufferFrom(buffer.buffer),
              offset,
              length,
              position
            );
          } catch (e) {
            throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
          }
        },
        write: function(stream, buffer, offset, length, position) {
          try {
            return fs.writeSync(
              stream.nfd,
              NODEFS.bufferFrom(buffer.buffer),
              offset,
              length,
              position
            );
          } catch (e) {
            throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
          }
        },
        llseek: function(stream, offset, whence) {
          var position = offset;
          if (whence === 1) {
            position += stream.position;
          } else if (whence === 2) {
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(NODEFS.convertNodeCode(e));
              }
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(28);
          }
          return position;
        }
      }
    };
    var WORKERFS = {
      DIR_MODE: 16895,
      FILE_MODE: 33279,
      reader: null,
      mount: function(mount) {
        assert(ENVIRONMENT_IS_WORKER);
        if (!WORKERFS.reader) WORKERFS.reader = new FileReaderSync();
        var root = WORKERFS.createNode(null, "/", WORKERFS.DIR_MODE, 0);
        var createdParents = {};
        function ensureParent(path) {
          var parts = path.split("/");
          var parent = root;
          for (var i = 0; i < parts.length - 1; i++) {
            var curr = parts.slice(0, i + 1).join("/");
            if (!createdParents[curr]) {
              createdParents[curr] = WORKERFS.createNode(
                parent,
                parts[i],
                WORKERFS.DIR_MODE,
                0
              );
            }
            parent = createdParents[curr];
          }
          return parent;
        }
        function base(path) {
          var parts = path.split("/");
          return parts[parts.length - 1];
        }
        Array.prototype.forEach.call(mount.opts["files"] || [], function(file) {
          WORKERFS.createNode(
            ensureParent(file.name),
            base(file.name),
            WORKERFS.FILE_MODE,
            0,
            file,
            file.lastModifiedDate
          );
        });
        (mount.opts["blobs"] || []).forEach(function(obj) {
          WORKERFS.createNode(
            ensureParent(obj["name"]),
            base(obj["name"]),
            WORKERFS.FILE_MODE,
            0,
            obj["data"]
          );
        });
        (mount.opts["packages"] || []).forEach(function(pack) {
          pack["metadata"].files.forEach(function(file) {
            var name = file.filename.substr(1);
            WORKERFS.createNode(
              ensureParent(name),
              base(name),
              WORKERFS.FILE_MODE,
              0,
              pack["blob"].slice(file.start, file.end)
            );
          });
        });
        return root;
      },
      createNode: function(parent, name, mode, dev, contents, mtime) {
        var node = FS.createNode(parent, name, mode);
        node.mode = mode;
        node.node_ops = WORKERFS.node_ops;
        node.stream_ops = WORKERFS.stream_ops;
        node.timestamp = (mtime || new Date()).getTime();
        assert(WORKERFS.FILE_MODE !== WORKERFS.DIR_MODE);
        if (mode === WORKERFS.FILE_MODE) {
          node.size = contents.size;
          node.contents = contents;
        } else {
          node.size = 4096;
          node.contents = {};
        }
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },
      node_ops: {
        getattr: function(node) {
          return {
            dev: 1,
            ino: undefined,
            mode: node.mode,
            nlink: 1,
            uid: 0,
            gid: 0,
            rdev: undefined,
            size: node.size,
            atime: new Date(node.timestamp),
            mtime: new Date(node.timestamp),
            ctime: new Date(node.timestamp),
            blksize: 4096,
            blocks: Math.ceil(node.size / 4096)
          };
        },
        setattr: function(node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
        },
        lookup: function(parent, name) {
          throw new FS.ErrnoError(44);
        },
        mknod: function(parent, name, mode, dev) {
          throw new FS.ErrnoError(63);
        },
        rename: function(oldNode, newDir, newName) {
          throw new FS.ErrnoError(63);
        },
        unlink: function(parent, name) {
          throw new FS.ErrnoError(63);
        },
        rmdir: function(parent, name) {
          throw new FS.ErrnoError(63);
        },
        readdir: function(node) {
          var entries = [".", ".."];
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },
        symlink: function(parent, newName, oldPath) {
          throw new FS.ErrnoError(63);
        },
        readlink: function(node) {
          throw new FS.ErrnoError(63);
        }
      },
      stream_ops: {
        read: function(stream, buffer, offset, length, position) {
          if (position >= stream.node.size) return 0;
          var chunk = stream.node.contents.slice(position, position + length);
          var ab = WORKERFS.reader.readAsArrayBuffer(chunk);
          buffer.set(new Uint8Array(ab), offset);
          return chunk.size;
        },
        write: function(stream, buffer, offset, length, position) {
          throw new FS.ErrnoError(29);
        },
        llseek: function(stream, offset, whence) {
          var position = offset;
          if (whence === 1) {
            position += stream.position;
          } else if (whence === 2) {
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.size;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(28);
          }
          return position;
        }
      }
    };
    var FS = {
      root: null,
      mounts: [],
      devices: {},
      streams: [],
      nextInode: 1,
      nameTable: null,
      currentPath: "/",
      initialized: false,
      ignorePermissions: true,
      trackingDelegate: {},
      tracking: { openFlags: { READ: 1, WRITE: 2 } },
      ErrnoError: null,
      genericErrors: {},
      filesystems: null,
      syncFSRequests: 0,
      handleFSError: function(e) {
        if (!(e instanceof FS.ErrnoError)) throw e + " : " + stackTrace();
        return ___setErrNo(e.errno);
      },
      lookupPath: function(path, opts) {
        path = PATH_FS.resolve(FS.cwd(), path);
        opts = opts || {};
        if (!path) return { path: "", node: null };
        var defaults = { follow_mount: true, recurse_count: 0 };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }
        if (opts.recurse_count > 8) {
          throw new FS.ErrnoError(32);
        }
        var parts = PATH.normalizeArray(
          path.split("/").filter(function(p) {
            return !!p;
          }),
          false
        );
        var current = FS.root;
        var current_path = "/";
        for (var i = 0; i < parts.length; i++) {
          var islast = i === parts.length - 1;
          if (islast && opts.parent) {
            break;
          }
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
              var lookup = FS.lookupPath(current_path, {
                recurse_count: opts.recurse_count
              });
              current = lookup.node;
              if (count++ > 40) {
                throw new FS.ErrnoError(32);
              }
            }
          }
        }
        return { path: current_path, node: current };
      },
      getPath: function(node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length - 1] !== "/"
              ? mount + "/" + path
              : mount + path;
          }
          path = path ? node.name + "/" + path : node.name;
          node = node.parent;
        }
      },
      hashName: function(parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },
      hashAddNode: function(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },
      hashRemoveNode: function(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },
      lookupNode: function(parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err, parent);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        return FS.lookup(parent, name);
      },
      createNode: function(parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            if (!parent) {
              parent = this;
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
          };
          FS.FSNode.prototype = {};
          var readMode = 292 | 73;
          var writeMode = 146;
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() {
                return (this.mode & readMode) === readMode;
              },
              set: function(val) {
                val ? (this.mode |= readMode) : (this.mode &= ~readMode);
              }
            },
            write: {
              get: function() {
                return (this.mode & writeMode) === writeMode;
              },
              set: function(val) {
                val ? (this.mode |= writeMode) : (this.mode &= ~writeMode);
              }
            },
            isFolder: {
              get: function() {
                return FS.isDir(this.mode);
              }
            },
            isDevice: {
              get: function() {
                return FS.isChrdev(this.mode);
              }
            }
          });
        }
        var node = new FS.FSNode(parent, name, mode, rdev);
        FS.hashAddNode(node);
        return node;
      },
      destroyNode: function(node) {
        FS.hashRemoveNode(node);
      },
      isRoot: function(node) {
        return node === node.parent;
      },
      isMountpoint: function(node) {
        return !!node.mounted;
      },
      isFile: function(mode) {
        return (mode & 61440) === 32768;
      },
      isDir: function(mode) {
        return (mode & 61440) === 16384;
      },
      isLink: function(mode) {
        return (mode & 61440) === 40960;
      },
      isChrdev: function(mode) {
        return (mode & 61440) === 8192;
      },
      isBlkdev: function(mode) {
        return (mode & 61440) === 24576;
      },
      isFIFO: function(mode) {
        return (mode & 61440) === 4096;
      },
      isSocket: function(mode) {
        return (mode & 49152) === 49152;
      },
      flagModes: {
        r: 0,
        rs: 1052672,
        "r+": 2,
        w: 577,
        wx: 705,
        xw: 705,
        "w+": 578,
        "wx+": 706,
        "xw+": 706,
        a: 1089,
        ax: 1217,
        xa: 1217,
        "a+": 1090,
        "ax+": 1218,
        "xa+": 1218
      },
      modeStringToFlags: function(str) {
        var flags = FS.flagModes[str];
        if (typeof flags === "undefined") {
          throw new Error("Unknown file open mode: " + str);
        }
        return flags;
      },
      flagsToPermissionString: function(flag) {
        var perms = ["r", "w", "rw"][flag & 3];
        if (flag & 512) {
          perms += "w";
        }
        return perms;
      },
      nodePermissions: function(node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        if (perms.indexOf("r") !== -1 && !(node.mode & 292)) {
          return 2;
        } else if (perms.indexOf("w") !== -1 && !(node.mode & 146)) {
          return 2;
        } else if (perms.indexOf("x") !== -1 && !(node.mode & 73)) {
          return 2;
        }
        return 0;
      },
      mayLookup: function(dir) {
        var err = FS.nodePermissions(dir, "x");
        if (err) return err;
        if (!dir.node_ops.lookup) return 2;
        return 0;
      },
      mayCreate: function(dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return 20;
        } catch (e) {}
        return FS.nodePermissions(dir, "wx");
      },
      mayDelete: function(dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, "wx");
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return 54;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return 10;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return 31;
          }
        }
        return 0;
      },
      mayOpen: function(node, flags) {
        if (!node) {
          return 44;
        }
        if (FS.isLink(node.mode)) {
          return 32;
        } else if (FS.isDir(node.mode)) {
          if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
            return 31;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },
      MAX_OPEN_FDS: 4096,
      nextfd: function(fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(33);
      },
      getStream: function(fd) {
        return FS.streams[fd];
      },
      createStream: function(stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function() {};
          FS.FSStream.prototype = {};
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() {
                return this.node;
              },
              set: function(val) {
                this.node = val;
              }
            },
            isRead: {
              get: function() {
                return (this.flags & 2097155) !== 1;
              }
            },
            isWrite: {
              get: function() {
                return (this.flags & 2097155) !== 0;
              }
            },
            isAppend: {
              get: function() {
                return this.flags & 1024;
              }
            }
          });
        }
        var newStream = new FS.FSStream();
        for (var p in stream) {
          newStream[p] = stream[p];
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },
      closeStream: function(fd) {
        FS.streams[fd] = null;
      },
      chrdev_stream_ops: {
        open: function(stream) {
          var device = FS.getDevice(stream.node.rdev);
          stream.stream_ops = device.stream_ops;
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },
        llseek: function() {
          throw new FS.ErrnoError(70);
        }
      },
      major: function(dev) {
        return dev >> 8;
      },
      minor: function(dev) {
        return dev & 255;
      },
      makedev: function(ma, mi) {
        return (ma << 8) | mi;
      },
      registerDevice: function(dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },
      getDevice: function(dev) {
        return FS.devices[dev];
      },
      getMounts: function(mount) {
        var mounts = [];
        var check = [mount];
        while (check.length) {
          var m = check.pop();
          mounts.push(m);
          check.push.apply(check, m.mounts);
        }
        return mounts;
      },
      syncfs: function(populate, callback) {
        if (typeof populate === "function") {
          callback = populate;
          populate = false;
        }
        FS.syncFSRequests++;
        if (FS.syncFSRequests > 1) {
          console.log(
            "warning: " +
              FS.syncFSRequests +
              " FS.syncfs operations in flight at once, probably just doing extra work"
          );
        }
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
        function doCallback(err) {
          FS.syncFSRequests--;
          return callback(err);
        }
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return doCallback(err);
            }
            return;
          }
          if (++completed >= mounts.length) {
            doCallback(null);
          }
        }
        mounts.forEach(function(mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },
      mount: function(type, opts, mountpoint) {
        var root = mountpoint === "/";
        var pseudo = !mountpoint;
        var node;
        if (root && FS.root) {
          throw new FS.ErrnoError(10);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
          mountpoint = lookup.path;
          node = lookup.node;
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
          }
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54);
          }
        }
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          node.mounted = mount;
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
        return mountRoot;
      },
      unmount: function(mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(28);
        }
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
        Object.keys(FS.nameTable).forEach(function(hash) {
          var current = FS.nameTable[hash];
          while (current) {
            var next = current.name_next;
            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }
            current = next;
          }
        });
        node.mounted = null;
        var idx = node.mount.mounts.indexOf(mount);
        node.mount.mounts.splice(idx, 1);
      },
      lookup: function(parent, name) {
        return parent.node_ops.lookup(parent, name);
      },
      mknod: function(path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === "." || name === "..") {
          throw new FS.ErrnoError(28);
        }
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },
      create: function(path, mode) {
        mode = mode !== undefined ? mode : 438;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },
      mkdir: function(path, mode) {
        mode = mode !== undefined ? mode : 511;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },
      mkdirTree: function(path, mode) {
        var dirs = path.split("/");
        var d = "";
        for (var i = 0; i < dirs.length; ++i) {
          if (!dirs[i]) continue;
          d += "/" + dirs[i];
          try {
            FS.mkdir(d, mode);
          } catch (e) {
            if (e.errno != 20) throw e;
          }
        }
      },
      mkdev: function(path, mode, dev) {
        if (typeof dev === "undefined") {
          dev = mode;
          mode = 438;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },
      symlink: function(oldpath, newpath) {
        if (!PATH_FS.resolve(oldpath)) {
          throw new FS.ErrnoError(44);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },
      rename: function(old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(10);
        }
        if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(75);
        }
        var old_node = FS.lookupNode(old_dir, old_name);
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== ".") {
          throw new FS.ErrnoError(28);
        }
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== ".") {
          throw new FS.ErrnoError(55);
        }
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {}
        if (old_node === new_node) {
          return;
        }
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        err = new_node
          ? FS.mayDelete(new_dir, new_name, isdir)
          : FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(63);
        }
        if (
          FS.isMountpoint(old_node) ||
          (new_node && FS.isMountpoint(new_node))
        ) {
          throw new FS.ErrnoError(10);
        }
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, "w");
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        try {
          if (FS.trackingDelegate["willMovePath"]) {
            FS.trackingDelegate["willMovePath"](old_path, new_path);
          }
        } catch (e) {
          console.log(
            "FS.trackingDelegate['willMovePath']('" +
              old_path +
              "', '" +
              new_path +
              "') threw an exception: " +
              e.message
          );
        }
        FS.hashRemoveNode(old_node);
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          FS.hashAddNode(old_node);
        }
        try {
          if (FS.trackingDelegate["onMovePath"])
            FS.trackingDelegate["onMovePath"](old_path, new_path);
        } catch (e) {
          console.log(
            "FS.trackingDelegate['onMovePath']('" +
              old_path +
              "', '" +
              new_path +
              "') threw an exception: " +
              e.message
          );
        }
      },
      rmdir: function(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        try {
          if (FS.trackingDelegate["willDeletePath"]) {
            FS.trackingDelegate["willDeletePath"](path);
          }
        } catch (e) {
          console.log(
            "FS.trackingDelegate['willDeletePath']('" +
              path +
              "') threw an exception: " +
              e.message
          );
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate["onDeletePath"])
            FS.trackingDelegate["onDeletePath"](path);
        } catch (e) {
          console.log(
            "FS.trackingDelegate['onDeletePath']('" +
              path +
              "') threw an exception: " +
              e.message
          );
        }
      },
      readdir: function(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(54);
        }
        return node.node_ops.readdir(node);
      },
      unlink: function(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        try {
          if (FS.trackingDelegate["willDeletePath"]) {
            FS.trackingDelegate["willDeletePath"](path);
          }
        } catch (e) {
          console.log(
            "FS.trackingDelegate['willDeletePath']('" +
              path +
              "') threw an exception: " +
              e.message
          );
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate["onDeletePath"])
            FS.trackingDelegate["onDeletePath"](path);
        } catch (e) {
          console.log(
            "FS.trackingDelegate['onDeletePath']('" +
              path +
              "') threw an exception: " +
              e.message
          );
        }
      },
      readlink: function(path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
          throw new FS.ErrnoError(44);
        }
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(28);
        }
        return PATH_FS.resolve(
          FS.getPath(link.parent),
          link.node_ops.readlink(link)
        );
      },
      stat: function(path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node) {
          throw new FS.ErrnoError(44);
        }
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(63);
        }
        return node.node_ops.getattr(node);
      },
      lstat: function(path) {
        return FS.stat(path, true);
      },
      chmod: function(path, mode, dontFollow) {
        var node;
        if (typeof path === "string") {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },
      lchmod: function(path, mode) {
        FS.chmod(path, mode, true);
      },
      fchmod: function(fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        FS.chmod(stream.node, mode);
      },
      chown: function(path, uid, gid, dontFollow) {
        var node;
        if (typeof path === "string") {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        node.node_ops.setattr(node, { timestamp: Date.now() });
      },
      lchown: function(path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },
      fchown: function(fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        FS.chown(stream.node, uid, gid);
      },
      truncate: function(path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(28);
        }
        var node;
        if (typeof path === "string") {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(28);
        }
        var err = FS.nodePermissions(node, "w");
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, { size: len, timestamp: Date.now() });
      },
      ftruncate: function(fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(28);
        }
        FS.truncate(stream.node, len);
      },
      utime: function(path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, { timestamp: Math.max(atime, mtime) });
      },
      open: function(path, flags, mode, fd_start, fd_end) {
        if (path === "") {
          throw new FS.ErrnoError(44);
        }
        flags = typeof flags === "string" ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === "undefined" ? 438 : mode;
        if (flags & 64) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === "object") {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, { follow: !(flags & 131072) });
            node = lookup.node;
          } catch (e) {}
        }
        var created = false;
        if (flags & 64) {
          if (node) {
            if (flags & 128) {
              throw new FS.ErrnoError(20);
            }
          } else {
            node = FS.mknod(path, mode, 0);
            created = true;
          }
        }
        if (!node) {
          throw new FS.ErrnoError(44);
        }
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        if (flags & 65536 && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(54);
        }
        if (!created) {
          var err = FS.mayOpen(node, flags);
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        if (flags & 512) {
          FS.truncate(node, 0);
        }
        flags &= ~(128 | 512);
        var stream = FS.createStream(
          {
            node: node,
            path: FS.getPath(node),
            flags: flags,
            seekable: true,
            position: 0,
            stream_ops: node.stream_ops,
            ungotten: [],
            error: false
          },
          fd_start,
          fd_end
        );
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module["logReadFiles"] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            console.log("FS.trackingDelegate error on read file: " + path);
          }
        }
        try {
          if (FS.trackingDelegate["onOpenFile"]) {
            var trackingFlags = 0;
            if ((flags & 2097155) !== 1) {
              trackingFlags |= FS.tracking.openFlags.READ;
            }
            if ((flags & 2097155) !== 0) {
              trackingFlags |= FS.tracking.openFlags.WRITE;
            }
            FS.trackingDelegate["onOpenFile"](path, trackingFlags);
          }
        } catch (e) {
          console.log(
            "FS.trackingDelegate['onOpenFile']('" +
              path +
              "', flags) threw an exception: " +
              e.message
          );
        }
        return stream;
      },
      close: function(stream) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (stream.getdents) stream.getdents = null;
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
        stream.fd = null;
      },
      isClosed: function(stream) {
        return stream.fd === null;
      },
      llseek: function(stream, offset, whence) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(70);
        }
        if (whence != 0 && whence != 1 && whence != 2) {
          throw new FS.ErrnoError(28);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
      },
      read: function(stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(28);
        }
        var seeking = typeof position !== "undefined";
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesRead = stream.stream_ops.read(
          stream,
          buffer,
          offset,
          length,
          position
        );
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },
      write: function(stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(28);
        }
        if (stream.flags & 1024) {
          FS.llseek(stream, 0, 2);
        }
        var seeking = typeof position !== "undefined";
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesWritten = stream.stream_ops.write(
          stream,
          buffer,
          offset,
          length,
          position,
          canOwn
        );
        if (!seeking) stream.position += bytesWritten;
        try {
          if (stream.path && FS.trackingDelegate["onWriteToFile"])
            FS.trackingDelegate["onWriteToFile"](stream.path);
        } catch (e) {
          console.log(
            "FS.trackingDelegate['onWriteToFile']('" +
              stream.path +
              "') threw an exception: " +
              e.message
          );
        }
        return bytesWritten;
      },
      allocate: function(stream, offset, length) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(28);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(43);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(138);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },
      mmap: function(stream, buffer, offset, length, position, prot, flags) {
        if (
          (prot & 2) !== 0 &&
          (flags & 2) === 0 &&
          (stream.flags & 2097155) !== 2
        ) {
          throw new FS.ErrnoError(2);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(2);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(43);
        }
        return stream.stream_ops.mmap(
          stream,
          buffer,
          offset,
          length,
          position,
          prot,
          flags
        );
      },
      msync: function(stream, buffer, offset, length, mmapFlags) {
        if (!stream || !stream.stream_ops.msync) {
          return 0;
        }
        return stream.stream_ops.msync(
          stream,
          buffer,
          offset,
          length,
          mmapFlags
        );
      },
      munmap: function(stream) {
        return 0;
      },
      ioctl: function(stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(59);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },
      readFile: function(path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || "r";
        opts.encoding = opts.encoding || "binary";
        if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === "utf8") {
          ret = UTF8ArrayToString(buf, 0);
        } else if (opts.encoding === "binary") {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },
      writeFile: function(path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || "w";
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data === "string") {
          var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
          var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
          FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
        } else if (ArrayBuffer.isView(data)) {
          FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
        } else {
          throw new Error("Unsupported data type");
        }
        FS.close(stream);
      },
      cwd: function() {
        return FS.currentPath;
      },
      chdir: function(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (lookup.node === null) {
          throw new FS.ErrnoError(44);
        }
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(54);
        }
        var err = FS.nodePermissions(lookup.node, "x");
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },
      createDefaultDirectories: function() {
        FS.mkdir("/tmp");
        FS.mkdir("/home");
        FS.mkdir("/home/web_user");
      },
      createDefaultDevices: function() {
        FS.mkdir("/dev");
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() {
            return 0;
          },
          write: function(stream, buffer, offset, length, pos) {
            return length;
          }
        });
        FS.mkdev("/dev/null", FS.makedev(1, 3));
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev("/dev/tty", FS.makedev(5, 0));
        FS.mkdev("/dev/tty1", FS.makedev(6, 0));
        var random_device;
        if (
          typeof crypto === "object" &&
          typeof crypto["getRandomValues"] === "function"
        ) {
          var randomBuffer = new Uint8Array(1);
          random_device = function() {
            crypto.getRandomValues(randomBuffer);
            return randomBuffer[0];
          };
        } else if (ENVIRONMENT_IS_NODE) {
          try {
            var crypto_module = require("crypto");
            random_device = function() {
              return crypto_module["randomBytes"](1)[0];
            };
          } catch (e) {}
        } else {
        }
        if (!random_device) {
          random_device = function() {
            abort("random_device");
          };
        }
        FS.createDevice("/dev", "random", random_device);
        FS.createDevice("/dev", "urandom", random_device);
        FS.mkdir("/dev/shm");
        FS.mkdir("/dev/shm/tmp");
      },
      createSpecialDirectories: function() {
        FS.mkdir("/proc");
        FS.mkdir("/proc/self");
        FS.mkdir("/proc/self/fd");
        FS.mount(
          {
            mount: function() {
              var node = FS.createNode("/proc/self", "fd", 16384 | 511, 73);
              node.node_ops = {
                lookup: function(parent, name) {
                  var fd = +name;
                  var stream = FS.getStream(fd);
                  if (!stream) throw new FS.ErrnoError(8);
                  var ret = {
                    parent: null,
                    mount: { mountpoint: "fake" },
                    node_ops: {
                      readlink: function() {
                        return stream.path;
                      }
                    }
                  };
                  ret.parent = ret;
                  return ret;
                }
              };
              return node;
            }
          },
          {},
          "/proc/self/fd"
        );
      },
      createStandardStreams: function() {
        if (Module["stdin"]) {
          FS.createDevice("/dev", "stdin", Module["stdin"]);
        } else {
          FS.symlink("/dev/tty", "/dev/stdin");
        }
        if (Module["stdout"]) {
          FS.createDevice("/dev", "stdout", null, Module["stdout"]);
        } else {
          FS.symlink("/dev/tty", "/dev/stdout");
        }
        if (Module["stderr"]) {
          FS.createDevice("/dev", "stderr", null, Module["stderr"]);
        } else {
          FS.symlink("/dev/tty1", "/dev/stderr");
        }
        var stdin = FS.open("/dev/stdin", "r");
        var stdout = FS.open("/dev/stdout", "w");
        var stderr = FS.open("/dev/stderr", "w");
      },
      ensureErrnoError: function() {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno, node) {
          this.node = node;
          this.setErrno = function(errno) {
            this.errno = errno;
          };
          this.setErrno(errno);
          this.message = "FS error";
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        [44].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = "<generic error, no stack>";
        });
      },
      staticInit: function() {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.mount(MEMFS, {}, "/");
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
        FS.filesystems = {
          MEMFS: MEMFS,
          IDBFS: IDBFS,
          NODEFS: NODEFS,
          WORKERFS: WORKERFS
        };
      },
      init: function(input, output, error) {
        FS.init.initialized = true;
        FS.ensureErrnoError();
        Module["stdin"] = input || Module["stdin"];
        Module["stdout"] = output || Module["stdout"];
        Module["stderr"] = error || Module["stderr"];
        FS.createStandardStreams();
      },
      quit: function() {
        FS.init.initialized = false;
        var fflush = Module["_fflush"];
        if (fflush) fflush(0);
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },
      getMode: function(canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },
      joinPath: function(parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == "/") path = path.substr(1);
        return path;
      },
      absolutePath: function(relative, base) {
        return PATH_FS.resolve(base, relative);
      },
      standardizePath: function(path) {
        return PATH.normalize(path);
      },
      findObject: function(path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },
      analyzePath: function(path, dontResolveLastLink) {
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {}
        var ret = {
          isRoot: false,
          exists: false,
          error: 0,
          name: null,
          path: null,
          object: null,
          parentExists: false,
          parentPath: null,
          parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === "/";
        } catch (e) {
          ret.error = e.errno;
        }
        return ret;
      },
      createFolder: function(parent, name, canRead, canWrite) {
        var path = PATH.join2(
          typeof parent === "string" ? parent : FS.getPath(parent),
          name
        );
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },
      createPath: function(parent, path, canRead, canWrite) {
        parent = typeof parent === "string" ? parent : FS.getPath(parent);
        var parts = path.split("/").reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {}
          parent = current;
        }
        return current;
      },
      createFile: function(parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(
          typeof parent === "string" ? parent : FS.getPath(parent),
          name
        );
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },
      createDataFile: function(parent, name, data, canRead, canWrite, canOwn) {
        var path = name
          ? PATH.join2(
              typeof parent === "string" ? parent : FS.getPath(parent),
              name
            )
          : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === "string") {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i)
              arr[i] = data.charCodeAt(i);
            data = arr;
          }
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, "w");
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },
      createDevice: function(parent, name, input, output) {
        var path = PATH.join2(
          typeof parent === "string" ? parent : FS.getPath(parent),
          name
        );
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(6);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset + i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset + i]);
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },
      createLink: function(parent, name, target, canRead, canWrite) {
        var path = PATH.join2(
          typeof parent === "string" ? parent : FS.getPath(parent),
          name
        );
        return FS.symlink(target, path);
      },
      forceLoadFile: function(obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents)
          return true;
        var success = true;
        if (typeof XMLHttpRequest !== "undefined") {
          throw new Error(
            "Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread."
          );
        } else if (read_) {
          try {
            obj.contents = intArrayFromString(read_(obj.url), true);
            obj.usedBytes = obj.contents.length;
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error("Cannot load without read() or XMLHttpRequest.");
        }
        if (!success) ___setErrNo(29);
        return success;
      },
      createLazyFile: function(parent, name, url, canRead, canWrite) {
        function LazyUint8Array() {
          this.lengthKnown = false;
          this.chunks = [];
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
          if (idx > this.length - 1 || idx < 0) {
            return undefined;
          }
          var chunkOffset = idx % this.chunkSize;
          var chunkNum = (idx / this.chunkSize) | 0;
          return this.getter(chunkNum)[chunkOffset];
        };
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(
          getter
        ) {
          this.getter = getter;
        };
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
          var xhr = new XMLHttpRequest();
          xhr.open("HEAD", url, false);
          xhr.send(null);
          if (!((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304))
            throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Content-length"));
          var header;
          var hasByteServing =
            (header = xhr.getResponseHeader("Accept-Ranges")) &&
            header === "bytes";
          var usesGzip =
            (header = xhr.getResponseHeader("Content-Encoding")) &&
            header === "gzip";
          var chunkSize = 1024 * 1024;
          if (!hasByteServing) chunkSize = datalength;
          var doXHR = function(from, to) {
            if (from > to)
              throw new Error(
                "invalid range (" +
                  from +
                  ", " +
                  to +
                  ") or no bytes requested!"
              );
            if (to > datalength - 1)
              throw new Error(
                "only " + datalength + " bytes available! programmer error!"
              );
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, false);
            if (datalength !== chunkSize)
              xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
            if (typeof Uint8Array != "undefined")
              xhr.responseType = "arraybuffer";
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType("text/plain; charset=x-user-defined");
            }
            xhr.send(null);
            if (
              !((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304)
            )
              throw new Error(
                "Couldn't load " + url + ". Status: " + xhr.status
              );
            if (xhr.response !== undefined) {
              return new Uint8Array(xhr.response || []);
            } else {
              return intArrayFromString(xhr.responseText || "", true);
            }
          };
          var lazyArray = this;
          lazyArray.setDataGetter(function(chunkNum) {
            var start = chunkNum * chunkSize;
            var end = (chunkNum + 1) * chunkSize - 1;
            end = Math.min(end, datalength - 1);
            if (typeof lazyArray.chunks[chunkNum] === "undefined") {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof lazyArray.chunks[chunkNum] === "undefined")
              throw new Error("doXHR failed!");
            return lazyArray.chunks[chunkNum];
          });
          if (usesGzip || !datalength) {
            chunkSize = datalength = 1;
            datalength = this.getter(0).length;
            chunkSize = datalength;
            console.log(
              "LazyFiles on gzip forces download of the whole file when length is accessed"
            );
          }
          this._length = datalength;
          this._chunkSize = chunkSize;
          this.lengthKnown = true;
        };
        if (typeof XMLHttpRequest !== "undefined") {
          if (!ENVIRONMENT_IS_WORKER)
            throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
          var lazyArray = new LazyUint8Array();
          Object.defineProperties(lazyArray, {
            length: {
              get: function() {
                if (!this.lengthKnown) {
                  this.cacheLength();
                }
                return this._length;
              }
            },
            chunkSize: {
              get: function() {
                if (!this.lengthKnown) {
                  this.cacheLength();
                }
                return this._chunkSize;
              }
            }
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        Object.defineProperties(node, {
          usedBytes: {
            get: function() {
              return this.contents.length;
            }
          }
        });
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(29);
            }
            return fn.apply(null, arguments);
          };
        });
        stream_ops.read = function stream_ops_read(
          stream,
          buffer,
          offset,
          length,
          position
        ) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(29);
          }
          var contents = stream.node.contents;
          if (position >= contents.length) return 0;
          var size = Math.min(contents.length - position, length);
          if (contents.slice) {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },
      createPreloadedFile: function(
        parent,
        name,
        url,
        canRead,
        canWrite,
        onload,
        onerror,
        dontCreateFile,
        canOwn,
        preFinish
      ) {
        Browser.init();
        var fullname = name
          ? PATH_FS.resolve(PATH.join2(parent, name))
          : parent;
        var dep = getUniqueRunDependency("cp " + fullname);
        function processData(byteArray) {
          function finish(byteArray) {
            if (preFinish) preFinish();
            if (!dontCreateFile) {
              FS.createDataFile(
                parent,
                name,
                byteArray,
                canRead,
                canWrite,
                canOwn
              );
            }
            if (onload) onload();
            removeRunDependency(dep);
          }
          var handled = false;
          Module["preloadPlugins"].forEach(function(plugin) {
            if (handled) return;
            if (plugin["canHandle"](fullname)) {
              plugin["handle"](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency(dep);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency(dep);
        if (typeof url == "string") {
          Browser.asyncLoad(
            url,
            function(byteArray) {
              processData(byteArray);
            },
            onerror
          );
        } else {
          processData(url);
        }
      },
      indexedDB: function() {
        return (
          window.indexedDB ||
          window.mozIndexedDB ||
          window.webkitIndexedDB ||
          window.msIndexedDB
        );
      },
      DB_NAME: function() {
        return "EM_FS_" + window.location.pathname;
      },
      DB_VERSION: 20,
      DB_STORE_NAME: "FILE_DATA",
      saveFilesToDB: function(paths, onload, onerror) {
        onload = onload || function() {};
        onerror = onerror || function() {};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log("creating db");
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], "readwrite");
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0,
            fail = 0,
            total = paths.length;
          function finish() {
            if (fail == 0) onload();
            else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(
              FS.analyzePath(path).object.contents,
              path
            );
            putRequest.onsuccess = function putRequest_onsuccess() {
              ok++;
              if (ok + fail == total) finish();
            };
            putRequest.onerror = function putRequest_onerror() {
              fail++;
              if (ok + fail == total) finish();
            };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },
      loadFilesFromDB: function(paths, onload, onerror) {
        onload = onload || function() {};
        onerror = onerror || function() {};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror;
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], "readonly");
          } catch (e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0,
            fail = 0,
            total = paths.length;
          function finish() {
            if (fail == 0) onload();
            else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(
                PATH.dirname(path),
                PATH.basename(path),
                getRequest.result,
                true,
                true,
                true
              );
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() {
              fail++;
              if (ok + fail == total) finish();
            };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }
    };
    var SYSCALLS = {
      DEFAULT_POLLMASK: 5,
      mappings: {},
      umask: 511,
      calculateAt: function(dirfd, path) {
        if (path[0] !== "/") {
          var dir;
          if (dirfd === -100) {
            dir = FS.cwd();
          } else {
            var dirstream = FS.getStream(dirfd);
            if (!dirstream) throw new FS.ErrnoError(8);
            dir = dirstream.path;
          }
          path = PATH.join2(dir, path);
        }
        return path;
      },
      doStat: function(func, path, buf) {
        try {
          var stat = func(path);
        } catch (e) {
          if (
            e &&
            e.node &&
            PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))
          ) {
            return -54;
          }
          throw e;
        }
        HEAP32[buf >> 2] = stat.dev;
        HEAP32[(buf + 4) >> 2] = 0;
        HEAP32[(buf + 8) >> 2] = stat.ino;
        HEAP32[(buf + 12) >> 2] = stat.mode;
        HEAP32[(buf + 16) >> 2] = stat.nlink;
        HEAP32[(buf + 20) >> 2] = stat.uid;
        HEAP32[(buf + 24) >> 2] = stat.gid;
        HEAP32[(buf + 28) >> 2] = stat.rdev;
        HEAP32[(buf + 32) >> 2] = 0;
        (tempI64 = [
          stat.size >>> 0,
          ((tempDouble = stat.size),
          +Math_abs(tempDouble) >= 1
            ? tempDouble > 0
              ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) |
                  0) >>>
                0
              : ~~+Math_ceil(
                  (tempDouble - +(~~tempDouble >>> 0)) / 4294967296
                ) >>> 0
            : 0)
        ]),
          (HEAP32[(buf + 40) >> 2] = tempI64[0]),
          (HEAP32[(buf + 44) >> 2] = tempI64[1]);
        HEAP32[(buf + 48) >> 2] = 4096;
        HEAP32[(buf + 52) >> 2] = stat.blocks;
        HEAP32[(buf + 56) >> 2] = (stat.atime.getTime() / 1e3) | 0;
        HEAP32[(buf + 60) >> 2] = 0;
        HEAP32[(buf + 64) >> 2] = (stat.mtime.getTime() / 1e3) | 0;
        HEAP32[(buf + 68) >> 2] = 0;
        HEAP32[(buf + 72) >> 2] = (stat.ctime.getTime() / 1e3) | 0;
        HEAP32[(buf + 76) >> 2] = 0;
        (tempI64 = [
          stat.ino >>> 0,
          ((tempDouble = stat.ino),
          +Math_abs(tempDouble) >= 1
            ? tempDouble > 0
              ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) |
                  0) >>>
                0
              : ~~+Math_ceil(
                  (tempDouble - +(~~tempDouble >>> 0)) / 4294967296
                ) >>> 0
            : 0)
        ]),
          (HEAP32[(buf + 80) >> 2] = tempI64[0]),
          (HEAP32[(buf + 84) >> 2] = tempI64[1]);
        return 0;
      },
      doMsync: function(addr, stream, len, flags) {
        var buffer = new Uint8Array(HEAPU8.subarray(addr, addr + len));
        FS.msync(stream, buffer, 0, len, flags);
      },
      doMkdir: function(path, mode) {
        path = PATH.normalize(path);
        if (path[path.length - 1] === "/")
          path = path.substr(0, path.length - 1);
        FS.mkdir(path, mode, 0);
        return 0;
      },
      doMknod: function(path, mode, dev) {
        switch (mode & 61440) {
          case 32768:
          case 8192:
          case 24576:
          case 4096:
          case 49152:
            break;
          default:
            return -28;
        }
        FS.mknod(path, mode, dev);
        return 0;
      },
      doReadlink: function(path, buf, bufsize) {
        if (bufsize <= 0) return -28;
        var ret = FS.readlink(path);
        var len = Math.min(bufsize, lengthBytesUTF8(ret));
        var endChar = HEAP8[buf + len];
        stringToUTF8(ret, buf, bufsize + 1);
        HEAP8[buf + len] = endChar;
        return len;
      },
      doAccess: function(path, amode) {
        if (amode & ~7) {
          return -28;
        }
        var node;
        var lookup = FS.lookupPath(path, { follow: true });
        node = lookup.node;
        if (!node) {
          return -44;
        }
        var perms = "";
        if (amode & 4) perms += "r";
        if (amode & 2) perms += "w";
        if (amode & 1) perms += "x";
        if (perms && FS.nodePermissions(node, perms)) {
          return -2;
        }
        return 0;
      },
      doDup: function(path, flags, suggestFD) {
        var suggest = FS.getStream(suggestFD);
        if (suggest) FS.close(suggest);
        return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
      },
      doReadv: function(stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
          var ptr = HEAP32[(iov + i * 8) >> 2];
          var len = HEAP32[(iov + (i * 8 + 4)) >> 2];
          var curr = FS.read(stream, HEAP8, ptr, len, offset);
          if (curr < 0) return -1;
          ret += curr;
          if (curr < len) break;
        }
        return ret;
      },
      doWritev: function(stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
          var ptr = HEAP32[(iov + i * 8) >> 2];
          var len = HEAP32[(iov + (i * 8 + 4)) >> 2];
          var curr = FS.write(stream, HEAP8, ptr, len, offset);
          if (curr < 0) return -1;
          ret += curr;
        }
        return ret;
      },
      varargs: 0,
      get: function(varargs) {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[(SYSCALLS.varargs - 4) >> 2];
        return ret;
      },
      getStr: function() {
        var ret = UTF8ToString(SYSCALLS.get());
        return ret;
      },
      getStreamFromFD: function(fd) {
        if (!fd) fd = SYSCALLS.get();
        var stream = FS.getStream(fd);
        if (!stream) throw new FS.ErrnoError(8);
        return stream;
      },
      get64: function() {
        var low = SYSCALLS.get(),
          high = SYSCALLS.get();
        return low;
      },
      getZero: function() {
        SYSCALLS.get();
      }
    };
    function ___syscall10(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        var path = SYSCALLS.getStr();
        FS.unlink(path);
        return 0;
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          abort(e);
        return -e.errno;
      }
    }
    var SOCKFS = {
      mount: function(mount) {
        Module["websocket"] =
          Module["websocket"] && "object" === typeof Module["websocket"]
            ? Module["websocket"]
            : {};
        Module["websocket"]._callbacks = {};
        Module["websocket"]["on"] = function(event, callback) {
          if ("function" === typeof callback) {
            this._callbacks[event] = callback;
          }
          return this;
        };
        Module["websocket"].emit = function(event, param) {
          if ("function" === typeof this._callbacks[event]) {
            this._callbacks[event].call(this, param);
          }
        };
        return FS.createNode(null, "/", 16384 | 511, 0);
      },
      createSocket: function(family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6));
        }
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          error: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags("r+"),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
        sock.stream = stream;
        return sock;
      },
      getSocket: function(fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },
      stream_ops: {
        poll: function(stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },
        ioctl: function(stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },
        read: function(stream, buffer, offset, length, position) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },
        write: function(stream, buffer, offset, length, position) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },
        close: function(stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }
      },
      nextname: function() {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return "socket[" + SOCKFS.nextname.current++ + "]";
      },
      websocket_sock_ops: {
        createPeer: function(sock, addr, port) {
          var ws;
          if (typeof addr === "object") {
            ws = addr;
            addr = null;
            port = null;
          }
          if (ws) {
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            } else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error(
                  "WebSocket URL must be in the format ws(s)://address:port"
                );
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            try {
              var runtimeConfig =
                Module["websocket"] && "object" === typeof Module["websocket"];
              var url = "ws:#".replace("#", "//");
              if (runtimeConfig) {
                if ("string" === typeof Module["websocket"]["url"]) {
                  url = Module["websocket"]["url"];
                }
              }
              if (url === "ws://" || url === "wss://") {
                var parts = addr.split("/");
                url =
                  url + parts[0] + ":" + port + "/" + parts.slice(1).join("/");
              }
              var subProtocols = "binary";
              if (runtimeConfig) {
                if ("string" === typeof Module["websocket"]["subprotocol"]) {
                  subProtocols = Module["websocket"]["subprotocol"];
                }
              }
              var opts = undefined;
              if (subProtocols !== "null") {
                subProtocols = subProtocols
                  .replace(/^ +| +$/g, "")
                  .split(/ *, */);
                opts = ENVIRONMENT_IS_NODE
                  ? { protocol: subProtocols.toString() }
                  : subProtocols;
              }
              if (
                runtimeConfig &&
                null === Module["websocket"]["subprotocol"]
              ) {
                subProtocols = "null";
                opts = undefined;
              }
              var WebSocketConstructor;
              if (ENVIRONMENT_IS_NODE) {
                WebSocketConstructor = require("ws");
              } else if (ENVIRONMENT_IS_WEB) {
                WebSocketConstructor = window["WebSocket"];
              } else {
                WebSocketConstructor = WebSocket;
              }
              ws = new WebSocketConstructor(url, opts);
              ws.binaryType = "arraybuffer";
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
          if (sock.type === 2 && typeof sock.sport !== "undefined") {
            peer.dgram_send_queue.push(
              new Uint8Array([
                255,
                255,
                255,
                255,
                "p".charCodeAt(0),
                "o".charCodeAt(0),
                "r".charCodeAt(0),
                "t".charCodeAt(0),
                (sock.sport & 65280) >> 8,
                sock.sport & 255
              ])
            );
          }
          return peer;
        },
        getPeer: function(sock, addr, port) {
          return sock.peers[addr + ":" + port];
        },
        addPeer: function(sock, peer) {
          sock.peers[peer.addr + ":" + peer.port] = peer;
        },
        removePeer: function(sock, peer) {
          delete sock.peers[peer.addr + ":" + peer.port];
        },
        handlePeerEvents: function(sock, peer) {
          var first = true;
          var handleOpen = function() {
            Module["websocket"].emit("open", sock.stream.fd);
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              peer.socket.close();
            }
          };
          function handleMessage(data) {
            if (typeof data === "string") {
              var encoder = new TextEncoder();
              data = encoder.encode(data);
            } else {
              assert(data.byteLength !== undefined);
              if (data.byteLength == 0) {
                return;
              } else {
                data = new Uint8Array(data);
              }
            }
            var wasfirst = first;
            first = false;
            if (
              wasfirst &&
              data.length === 10 &&
              data[0] === 255 &&
              data[1] === 255 &&
              data[2] === 255 &&
              data[3] === 255 &&
              data[4] === "p".charCodeAt(0) &&
              data[5] === "o".charCodeAt(0) &&
              data[6] === "r".charCodeAt(0) &&
              data[7] === "t".charCodeAt(0)
            ) {
              var newport = (data[8] << 8) | data[9];
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
            sock.recv_queue.push({
              addr: peer.addr,
              port: peer.port,
              data: data
            });
            Module["websocket"].emit("message", sock.stream.fd);
          }
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on("open", handleOpen);
            peer.socket.on("message", function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage(new Uint8Array(data).buffer);
            });
            peer.socket.on("close", function() {
              Module["websocket"].emit("close", sock.stream.fd);
            });
            peer.socket.on("error", function(error) {
              sock.error = ERRNO_CODES.ECONNREFUSED;
              Module["websocket"].emit("error", [
                sock.stream.fd,
                sock.error,
                "ECONNREFUSED: Connection refused"
              ]);
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onclose = function() {
              Module["websocket"].emit("close", sock.stream.fd);
            };
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
            peer.socket.onerror = function(error) {
              sock.error = ERRNO_CODES.ECONNREFUSED;
              Module["websocket"].emit("error", [
                sock.stream.fd,
                sock.error,
                "ECONNREFUSED: Connection refused"
              ]);
            };
          }
        },
        poll: function(sock) {
          if (sock.type === 1 && sock.server) {
            return sock.pending.length ? 64 | 1 : 0;
          }
          var mask = 0;
          var dest =
            sock.type === 1
              ? SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport)
              : null;
          if (
            sock.recv_queue.length ||
            !dest ||
            (dest && dest.socket.readyState === dest.socket.CLOSING) ||
            (dest && dest.socket.readyState === dest.socket.CLOSED)
          ) {
            mask |= 64 | 1;
          }
          if (!dest || (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
          if (
            (dest && dest.socket.readyState === dest.socket.CLOSING) ||
            (dest && dest.socket.readyState === dest.socket.CLOSED)
          ) {
            mask |= 16;
          }
          return mask;
        },
        ioctl: function(sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[arg >> 2] = bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },
        close: function(sock) {
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {}
            sock.server = null;
          }
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {}
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },
        bind: function(sock, addr, port) {
          if (
            typeof sock.saddr !== "undefined" ||
            typeof sock.sport !== "undefined"
          ) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          sock.saddr = addr;
          sock.sport = port;
          if (sock.type === 2) {
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },
        connect: function(sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (
            typeof sock.daddr !== "undefined" &&
            typeof sock.dport !== "undefined"
          ) {
            var dest = SOCKFS.websocket_sock_ops.getPeer(
              sock,
              sock.daddr,
              sock.dport
            );
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },
        listen: function(sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var WebSocketServer = require("ws").Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({ host: host, port: sock.sport });
          Module["websocket"].emit("listen", sock.stream.fd);
          sock.server.on("connection", function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(
                sock.family,
                sock.type,
                sock.protocol
              );
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
              sock.pending.push(newsock);
              Module["websocket"].emit("connection", newsock.stream.fd);
            } else {
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
              Module["websocket"].emit("connection", sock.stream.fd);
            }
          });
          sock.server.on("closed", function() {
            Module["websocket"].emit("close", sock.stream.fd);
            sock.server = null;
          });
          sock.server.on("error", function(error) {
            sock.error = ERRNO_CODES.EHOSTUNREACH;
            Module["websocket"].emit("error", [
              sock.stream.fd,
              sock.error,
              "EHOSTUNREACH: Host is unreachable"
            ]);
          });
        },
        accept: function(listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },
        getname: function(sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },
        sendmsg: function(sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            addr = sock.daddr;
            port = sock.dport;
          }
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
          if (sock.type === 1) {
            if (
              !dest ||
              dest.socket.readyState === dest.socket.CLOSING ||
              dest.socket.readyState === dest.socket.CLOSED
            ) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          if (ArrayBuffer.isView(buffer)) {
            offset += buffer.byteOffset;
            buffer = buffer.buffer;
          }
          var data;
          data = buffer.slice(offset, offset + length);
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              if (
                !dest ||
                dest.socket.readyState === dest.socket.CLOSING ||
                dest.socket.readyState === dest.socket.CLOSED
              ) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
          try {
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },
        recvmsg: function(sock, length) {
          if (sock.type === 1 && sock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(
                sock,
                sock.daddr,
                sock.dport
              );
              if (!dest) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              } else if (
                dest.socket.readyState === dest.socket.CLOSING ||
                dest.socket.readyState === dest.socket.CLOSED
              ) {
                return null;
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(
              queuedBuffer,
              queuedOffset + bytesRead,
              bytesRemaining
            );
            sock.recv_queue.unshift(queued);
          }
          return res;
        }
      }
    };
    function __inet_pton4_raw(str) {
      var b = str.split(".");
      for (var i = 0; i < 4; i++) {
        var tmp = Number(b[i]);
        if (isNaN(tmp)) return null;
        b[i] = tmp;
      }
      return (b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >>> 0;
    }
    function __inet_pton6_raw(str) {
      var words;
      var w, offset, z;
      var valid6regx = /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i;
      var parts = [];
      if (!valid6regx.test(str)) {
        return null;
      }
      if (str === "::") {
        return [0, 0, 0, 0, 0, 0, 0, 0];
      }
      if (str.indexOf("::") === 0) {
        str = str.replace("::", "Z:");
      } else {
        str = str.replace("::", ":Z:");
      }
      if (str.indexOf(".") > 0) {
        str = str.replace(new RegExp("[.]", "g"), ":");
        words = str.split(":");
        words[words.length - 4] =
          parseInt(words[words.length - 4]) +
          parseInt(words[words.length - 3]) * 256;
        words[words.length - 3] =
          parseInt(words[words.length - 2]) +
          parseInt(words[words.length - 1]) * 256;
        words = words.slice(0, words.length - 2);
      } else {
        words = str.split(":");
      }
      offset = 0;
      z = 0;
      for (w = 0; w < words.length; w++) {
        if (typeof words[w] === "string") {
          if (words[w] === "Z") {
            for (z = 0; z < 8 - words.length + 1; z++) {
              parts[w + z] = 0;
            }
            offset = z - 1;
          } else {
            parts[w + offset] = _htons(parseInt(words[w], 16));
          }
        } else {
          parts[w + offset] = words[w];
        }
      }
      return [
        (parts[1] << 16) | parts[0],
        (parts[3] << 16) | parts[2],
        (parts[5] << 16) | parts[4],
        (parts[7] << 16) | parts[6]
      ];
    }
    var DNS = {
      address_map: { id: 1, addrs: {}, names: {} },
      lookup_name: function(name) {
        var res = __inet_pton4_raw(name);
        if (res !== null) {
          return name;
        }
        res = __inet_pton6_raw(name);
        if (res !== null) {
          return name;
        }
        var addr;
        if (DNS.address_map.addrs[name]) {
          addr = DNS.address_map.addrs[name];
        } else {
          var id = DNS.address_map.id++;
          assert(id < 65535, "exceeded max address mappings of 65535");
          addr = "172.29." + (id & 255) + "." + (id & 65280);
          DNS.address_map.names[addr] = name;
          DNS.address_map.addrs[name] = addr;
        }
        return addr;
      },
      lookup_addr: function(addr) {
        if (DNS.address_map.names[addr]) {
          return DNS.address_map.names[addr];
        }
        return null;
      }
    };
    function __inet_ntop4_raw(addr) {
      return (
        (addr & 255) +
        "." +
        ((addr >> 8) & 255) +
        "." +
        ((addr >> 16) & 255) +
        "." +
        ((addr >> 24) & 255)
      );
    }
    function __inet_ntop6_raw(ints) {
      var str = "";
      var word = 0;
      var longest = 0;
      var lastzero = 0;
      var zstart = 0;
      var len = 0;
      var i = 0;
      var parts = [
        ints[0] & 65535,
        ints[0] >> 16,
        ints[1] & 65535,
        ints[1] >> 16,
        ints[2] & 65535,
        ints[2] >> 16,
        ints[3] & 65535,
        ints[3] >> 16
      ];
      var hasipv4 = true;
      var v4part = "";
      for (i = 0; i < 5; i++) {
        if (parts[i] !== 0) {
          hasipv4 = false;
          break;
        }
      }
      if (hasipv4) {
        v4part = __inet_ntop4_raw(parts[6] | (parts[7] << 16));
        if (parts[5] === -1) {
          str = "::ffff:";
          str += v4part;
          return str;
        }
        if (parts[5] === 0) {
          str = "::";
          if (v4part === "0.0.0.0") v4part = "";
          if (v4part === "0.0.0.1") v4part = "1";
          str += v4part;
          return str;
        }
      }
      for (word = 0; word < 8; word++) {
        if (parts[word] === 0) {
          if (word - lastzero > 1) {
            len = 0;
          }
          lastzero = word;
          len++;
        }
        if (len > longest) {
          longest = len;
          zstart = word - longest + 1;
        }
      }
      for (word = 0; word < 8; word++) {
        if (longest > 1) {
          if (parts[word] === 0 && word >= zstart && word < zstart + longest) {
            if (word === zstart) {
              str += ":";
              if (zstart === 0) str += ":";
            }
            continue;
          }
        }
        str += Number(_ntohs(parts[word] & 65535)).toString(16);
        str += word < 7 ? ":" : "";
      }
      return str;
    }
    function __read_sockaddr(sa, salen) {
      var family = HEAP16[sa >> 1];
      var port = _ntohs(HEAPU16[(sa + 2) >> 1]);
      var addr;
      switch (family) {
        case 2:
          if (salen !== 16) {
            return { errno: 28 };
          }
          addr = HEAP32[(sa + 4) >> 2];
          addr = __inet_ntop4_raw(addr);
          break;
        case 10:
          if (salen !== 28) {
            return { errno: 28 };
          }
          addr = [
            HEAP32[(sa + 8) >> 2],
            HEAP32[(sa + 12) >> 2],
            HEAP32[(sa + 16) >> 2],
            HEAP32[(sa + 20) >> 2]
          ];
          addr = __inet_ntop6_raw(addr);
          break;
        default:
          return { errno: 5 };
      }
      return { family: family, addr: addr, port: port };
    }
    function __write_sockaddr(sa, family, addr, port) {
      switch (family) {
        case 2:
          addr = __inet_pton4_raw(addr);
          HEAP16[sa >> 1] = family;
          HEAP32[(sa + 4) >> 2] = addr;
          HEAP16[(sa + 2) >> 1] = _htons(port);
          break;
        case 10:
          addr = __inet_pton6_raw(addr);
          HEAP32[sa >> 2] = family;
          HEAP32[(sa + 8) >> 2] = addr[0];
          HEAP32[(sa + 12) >> 2] = addr[1];
          HEAP32[(sa + 16) >> 2] = addr[2];
          HEAP32[(sa + 20) >> 2] = addr[3];
          HEAP16[(sa + 2) >> 1] = _htons(port);
          HEAP32[(sa + 4) >> 2] = 0;
          HEAP32[(sa + 24) >> 2] = 0;
          break;
        default:
          return { errno: 5 };
      }
      return {};
    }
    function ___syscall102(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        var call = SYSCALLS.get(),
          socketvararg = SYSCALLS.get();
        SYSCALLS.varargs = socketvararg;
        var getSocketFromFD = function() {
          var socket = SOCKFS.getSocket(SYSCALLS.get());
          if (!socket) throw new FS.ErrnoError(8);
          return socket;
        };
        var getSocketAddress = function(allowNull) {
          var addrp = SYSCALLS.get(),
            addrlen = SYSCALLS.get();
          if (allowNull && addrp === 0) return null;
          var info = __read_sockaddr(addrp, addrlen);
          if (info.errno) throw new FS.ErrnoError(info.errno);
          info.addr = DNS.lookup_addr(info.addr) || info.addr;
          return info;
        };
        switch (call) {
          case 1: {
            var domain = SYSCALLS.get(),
              type = SYSCALLS.get(),
              protocol = SYSCALLS.get();
            var sock = SOCKFS.createSocket(domain, type, protocol);
            return sock.stream.fd;
          }
          case 2: {
            var sock = getSocketFromFD(),
              info = getSocketAddress();
            sock.sock_ops.bind(sock, info.addr, info.port);
            return 0;
          }
          case 3: {
            var sock = getSocketFromFD(),
              info = getSocketAddress();
            sock.sock_ops.connect(sock, info.addr, info.port);
            return 0;
          }
          case 4: {
            var sock = getSocketFromFD(),
              backlog = SYSCALLS.get();
            sock.sock_ops.listen(sock, backlog);
            return 0;
          }
          case 5: {
            var sock = getSocketFromFD(),
              addr = SYSCALLS.get(),
              addrlen = SYSCALLS.get();
            var newsock = sock.sock_ops.accept(sock);
            if (addr) {
              var res = __write_sockaddr(
                addr,
                newsock.family,
                DNS.lookup_name(newsock.daddr),
                newsock.dport
              );
            }
            return newsock.stream.fd;
          }
          case 6: {
            var sock = getSocketFromFD(),
              addr = SYSCALLS.get(),
              addrlen = SYSCALLS.get();
            var res = __write_sockaddr(
              addr,
              sock.family,
              DNS.lookup_name(sock.saddr || "0.0.0.0"),
              sock.sport
            );
            return 0;
          }
          case 7: {
            var sock = getSocketFromFD(),
              addr = SYSCALLS.get(),
              addrlen = SYSCALLS.get();
            if (!sock.daddr) {
              return -53;
            }
            var res = __write_sockaddr(
              addr,
              sock.family,
              DNS.lookup_name(sock.daddr),
              sock.dport
            );
            return 0;
          }
          case 11: {
            var sock = getSocketFromFD(),
              message = SYSCALLS.get(),
              length = SYSCALLS.get(),
              flags = SYSCALLS.get(),
              dest = getSocketAddress(true);
            if (!dest) {
              return FS.write(sock.stream, HEAP8, message, length);
            } else {
              return sock.sock_ops.sendmsg(
                sock,
                HEAP8,
                message,
                length,
                dest.addr,
                dest.port
              );
            }
          }
          case 12: {
            var sock = getSocketFromFD(),
              buf = SYSCALLS.get(),
              len = SYSCALLS.get(),
              flags = SYSCALLS.get(),
              addr = SYSCALLS.get(),
              addrlen = SYSCALLS.get();
            var msg = sock.sock_ops.recvmsg(sock, len);
            if (!msg) return 0;
            if (addr) {
              var res = __write_sockaddr(
                addr,
                sock.family,
                DNS.lookup_name(msg.addr),
                msg.port
              );
            }
            HEAPU8.set(msg.buffer, buf);
            return msg.buffer.byteLength;
          }
          case 14: {
            return -50;
          }
          case 15: {
            var sock = getSocketFromFD(),
              level = SYSCALLS.get(),
              optname = SYSCALLS.get(),
              optval = SYSCALLS.get(),
              optlen = SYSCALLS.get();
            if (level === 1) {
              if (optname === 4) {
                HEAP32[optval >> 2] = sock.error;
                HEAP32[optlen >> 2] = 4;
                sock.error = null;
                return 0;
              }
            }
            return -50;
          }
          case 16: {
            var sock = getSocketFromFD(),
              message = SYSCALLS.get(),
              flags = SYSCALLS.get();
            var iov = HEAP32[(message + 8) >> 2];
            var num = HEAP32[(message + 12) >> 2];
            var addr, port;
            var name = HEAP32[message >> 2];
            var namelen = HEAP32[(message + 4) >> 2];
            if (name) {
              var info = __read_sockaddr(name, namelen);
              if (info.errno) return -info.errno;
              port = info.port;
              addr = DNS.lookup_addr(info.addr) || info.addr;
            }
            var total = 0;
            for (var i = 0; i < num; i++) {
              total += HEAP32[(iov + (8 * i + 4)) >> 2];
            }
            var view = new Uint8Array(total);
            var offset = 0;
            for (var i = 0; i < num; i++) {
              var iovbase = HEAP32[(iov + (8 * i + 0)) >> 2];
              var iovlen = HEAP32[(iov + (8 * i + 4)) >> 2];
              for (var j = 0; j < iovlen; j++) {
                view[offset++] = HEAP8[(iovbase + j) >> 0];
              }
            }
            return sock.sock_ops.sendmsg(sock, view, 0, total, addr, port);
          }
          case 17: {
            var sock = getSocketFromFD(),
              message = SYSCALLS.get(),
              flags = SYSCALLS.get();
            var iov = HEAP32[(message + 8) >> 2];
            var num = HEAP32[(message + 12) >> 2];
            var total = 0;
            for (var i = 0; i < num; i++) {
              total += HEAP32[(iov + (8 * i + 4)) >> 2];
            }
            var msg = sock.sock_ops.recvmsg(sock, total);
            if (!msg) return 0;
            var name = HEAP32[message >> 2];
            if (name) {
              var res = __write_sockaddr(
                name,
                sock.family,
                DNS.lookup_name(msg.addr),
                msg.port
              );
            }
            var bytesRead = 0;
            var bytesRemaining = msg.buffer.byteLength;
            for (var i = 0; bytesRemaining > 0 && i < num; i++) {
              var iovbase = HEAP32[(iov + (8 * i + 0)) >> 2];
              var iovlen = HEAP32[(iov + (8 * i + 4)) >> 2];
              if (!iovlen) {
                continue;
              }
              var length = Math.min(iovlen, bytesRemaining);
              var buf = msg.buffer.subarray(bytesRead, bytesRead + length);
              HEAPU8.set(buf, iovbase + bytesRead);
              bytesRead += length;
              bytesRemaining -= length;
            }
            return bytesRead;
          }
          default:
            abort("unsupported socketcall syscall " + call);
        }
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          abort(e);
        return -e.errno;
      }
    }
    function ___syscall12(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        var path = SYSCALLS.getStr();
        FS.chdir(path);
        return 0;
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          abort(e);
        return -e.errno;
      }
    }
    function ___syscall140(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        var stream = SYSCALLS.getStreamFromFD(),
          offset_high = SYSCALLS.get(),
          offset_low = SYSCALLS.get(),
          result = SYSCALLS.get(),
          whence = SYSCALLS.get();
        var HIGH_OFFSET = 4294967296;
        var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0);
        var DOUBLE_LIMIT = 9007199254740992;
        if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
          return -61;
        }
        FS.llseek(stream, offset, whence);
        (tempI64 = [
          stream.position >>> 0,
          ((tempDouble = stream.position),
          +Math_abs(tempDouble) >= 1
            ? tempDouble > 0
              ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) |
                  0) >>>
                0
              : ~~+Math_ceil(
                  (tempDouble - +(~~tempDouble >>> 0)) / 4294967296
                ) >>> 0
            : 0)
        ]),
          (HEAP32[result >> 2] = tempI64[0]),
          (HEAP32[(result + 4) >> 2] = tempI64[1]);
        if (stream.getdents && offset === 0 && whence === 0)
          stream.getdents = null;
        return 0;
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          abort(e);
        return -e.errno;
      }
    }
    function ___syscall142(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        var nfds = SYSCALLS.get(),
          readfds = SYSCALLS.get(),
          writefds = SYSCALLS.get(),
          exceptfds = SYSCALLS.get(),
          timeout = SYSCALLS.get();
        var total = 0;
        var srcReadLow = readfds ? HEAP32[readfds >> 2] : 0,
          srcReadHigh = readfds ? HEAP32[(readfds + 4) >> 2] : 0;
        var srcWriteLow = writefds ? HEAP32[writefds >> 2] : 0,
          srcWriteHigh = writefds ? HEAP32[(writefds + 4) >> 2] : 0;
        var srcExceptLow = exceptfds ? HEAP32[exceptfds >> 2] : 0,
          srcExceptHigh = exceptfds ? HEAP32[(exceptfds + 4) >> 2] : 0;
        var dstReadLow = 0,
          dstReadHigh = 0;
        var dstWriteLow = 0,
          dstWriteHigh = 0;
        var dstExceptLow = 0,
          dstExceptHigh = 0;
        var allLow =
          (readfds ? HEAP32[readfds >> 2] : 0) |
          (writefds ? HEAP32[writefds >> 2] : 0) |
          (exceptfds ? HEAP32[exceptfds >> 2] : 0);
        var allHigh =
          (readfds ? HEAP32[(readfds + 4) >> 2] : 0) |
          (writefds ? HEAP32[(writefds + 4) >> 2] : 0) |
          (exceptfds ? HEAP32[(exceptfds + 4) >> 2] : 0);
        var check = function(fd, low, high, val) {
          return fd < 32 ? low & val : high & val;
        };
        for (var fd = 0; fd < nfds; fd++) {
          var mask = 1 << fd % 32;
          if (!check(fd, allLow, allHigh, mask)) {
            continue;
          }
          var stream = FS.getStream(fd);
          if (!stream) throw new FS.ErrnoError(8);
          var flags = SYSCALLS.DEFAULT_POLLMASK;
          if (stream.stream_ops.poll) {
            flags = stream.stream_ops.poll(stream);
          }
          if (flags & 1 && check(fd, srcReadLow, srcReadHigh, mask)) {
            fd < 32
              ? (dstReadLow = dstReadLow | mask)
              : (dstReadHigh = dstReadHigh | mask);
            total++;
          }
          if (flags & 4 && check(fd, srcWriteLow, srcWriteHigh, mask)) {
            fd < 32
              ? (dstWriteLow = dstWriteLow | mask)
              : (dstWriteHigh = dstWriteHigh | mask);
            total++;
          }
          if (flags & 2 && check(fd, srcExceptLow, srcExceptHigh, mask)) {
            fd < 32
              ? (dstExceptLow = dstExceptLow | mask)
              : (dstExceptHigh = dstExceptHigh | mask);
            total++;
          }
        }
        if (readfds) {
          HEAP32[readfds >> 2] = dstReadLow;
          HEAP32[(readfds + 4) >> 2] = dstReadHigh;
        }
        if (writefds) {
          HEAP32[writefds >> 2] = dstWriteLow;
          HEAP32[(writefds + 4) >> 2] = dstWriteHigh;
        }
        if (exceptfds) {
          HEAP32[exceptfds >> 2] = dstExceptLow;
          HEAP32[(exceptfds + 4) >> 2] = dstExceptHigh;
        }
        return total;
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          abort(e);
        return -e.errno;
      }
    }
    function ___syscall145(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        var stream = SYSCALLS.getStreamFromFD(),
          iov = SYSCALLS.get(),
          iovcnt = SYSCALLS.get();
        return SYSCALLS.doReadv(stream, iov, iovcnt);
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          abort(e);
        return -e.errno;
      }
    }
    function ___syscall15(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        var path = SYSCALLS.getStr(),
          mode = SYSCALLS.get();
        FS.chmod(path, mode);
        return 0;
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          abort(e);
        return -e.errno;
      }
    }
    function ___syscall168(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        var fds = SYSCALLS.get(),
          nfds = SYSCALLS.get(),
          timeout = SYSCALLS.get();
        var nonzero = 0;
        for (var i = 0; i < nfds; i++) {
          var pollfd = fds + 8 * i;
          var fd = HEAP32[pollfd >> 2];
          var events = HEAP16[(pollfd + 4) >> 1];
          var mask = 32;
          var stream = FS.getStream(fd);
          if (stream) {
            mask = SYSCALLS.DEFAULT_POLLMASK;
            if (stream.stream_ops.poll) {
              mask = stream.stream_ops.poll(stream);
            }
          }
          mask &= events | 8 | 16;
          if (mask) nonzero++;
          HEAP16[(pollfd + 6) >> 1] = mask;
        }
        return nonzero;
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          abort(e);
        return -e.errno;
      }
    }
    function ___syscall183(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        var buf = SYSCALLS.get(),
          size = SYSCALLS.get();
        if (size === 0) return -28;
        var cwd = FS.cwd();
        var cwdLengthInBytes = lengthBytesUTF8(cwd);
        if (size < cwdLengthInBytes + 1) return -68;
        stringToUTF8(cwd, buf, size);
        return buf;
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          abort(e);
        return -e.errno;
      }
    }
    function ___syscall195(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        var path = SYSCALLS.getStr(),
          buf = SYSCALLS.get();
        return SYSCALLS.doStat(FS.stat, path, buf);
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          abort(e);
        return -e.errno;
      }
    }
    var PROCINFO = { ppid: 1, pid: 42, sid: 42, pgid: 42 };
    function ___syscall20(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        return PROCINFO.pid;
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          abort(e);
        return -e.errno;
      }
    }
    function ___syscall220(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        var stream = SYSCALLS.getStreamFromFD(),
          dirp = SYSCALLS.get(),
          count = SYSCALLS.get();
        if (!stream.getdents) {
          stream.getdents = FS.readdir(stream.path);
        }
        var struct_size = 280;
        var pos = 0;
        var off = FS.llseek(stream, 0, 1);
        var idx = Math.floor(off / struct_size);
        while (idx < stream.getdents.length && pos + struct_size <= count) {
          var id;
          var type;
          var name = stream.getdents[idx];
          if (name[0] === ".") {
            id = 1;
            type = 4;
          } else {
            var child = FS.lookupNode(stream.node, name);
            id = child.id;
            type = FS.isChrdev(child.mode)
              ? 2
              : FS.isDir(child.mode)
              ? 4
              : FS.isLink(child.mode)
              ? 10
              : 8;
          }
          (tempI64 = [
            id >>> 0,
            ((tempDouble = id),
            +Math_abs(tempDouble) >= 1
              ? tempDouble > 0
                ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) |
                    0) >>>
                  0
                : ~~+Math_ceil(
                    (tempDouble - +(~~tempDouble >>> 0)) / 4294967296
                  ) >>> 0
              : 0)
          ]),
            (HEAP32[(dirp + pos) >> 2] = tempI64[0]),
            (HEAP32[(dirp + pos + 4) >> 2] = tempI64[1]);
          (tempI64 = [
            ((idx + 1) * struct_size) >>> 0,
            ((tempDouble = (idx + 1) * struct_size),
            +Math_abs(tempDouble) >= 1
              ? tempDouble > 0
                ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) |
                    0) >>>
                  0
                : ~~+Math_ceil(
                    (tempDouble - +(~~tempDouble >>> 0)) / 4294967296
                  ) >>> 0
              : 0)
          ]),
            (HEAP32[(dirp + pos + 8) >> 2] = tempI64[0]),
            (HEAP32[(dirp + pos + 12) >> 2] = tempI64[1]);
          HEAP16[(dirp + pos + 16) >> 1] = 280;
          HEAP8[(dirp + pos + 18) >> 0] = type;
          stringToUTF8(name, dirp + pos + 19, 256);
          pos += struct_size;
          idx += 1;
        }
        FS.llseek(stream, idx * struct_size, 0);
        return pos;
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          abort(e);
        return -e.errno;
      }
    }
    function ___syscall221(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        var stream = SYSCALLS.getStreamFromFD(),
          cmd = SYSCALLS.get();
        switch (cmd) {
          case 0: {
            var arg = SYSCALLS.get();
            if (arg < 0) {
              return -28;
            }
            var newStream;
            newStream = FS.open(stream.path, stream.flags, 0, arg);
            return newStream.fd;
          }
          case 1:
          case 2:
            return 0;
          case 3:
            return stream.flags;
          case 4: {
            var arg = SYSCALLS.get();
            stream.flags |= arg;
            return 0;
          }
          case 12: {
            var arg = SYSCALLS.get();
            var offset = 0;
            HEAP16[(arg + offset) >> 1] = 2;
            return 0;
          }
          case 13:
          case 14:
            return 0;
          case 16:
          case 8:
            return -28;
          case 9:
            ___setErrNo(28);
            return -1;
          default: {
            return -28;
          }
        }
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          abort(e);
        return -e.errno;
      }
    }
    function ___syscall268(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        var path = SYSCALLS.getStr(),
          size = SYSCALLS.get(),
          buf = SYSCALLS.get();
        HEAP32[(buf + 4) >> 2] = 4096;
        HEAP32[(buf + 40) >> 2] = 4096;
        HEAP32[(buf + 8) >> 2] = 1e6;
        HEAP32[(buf + 12) >> 2] = 5e5;
        HEAP32[(buf + 16) >> 2] = 5e5;
        HEAP32[(buf + 20) >> 2] = FS.nextInode;
        HEAP32[(buf + 24) >> 2] = 1e6;
        HEAP32[(buf + 28) >> 2] = 42;
        HEAP32[(buf + 44) >> 2] = 2;
        HEAP32[(buf + 36) >> 2] = 255;
        return 0;
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          abort(e);
        return -e.errno;
      }
    }
    function ___syscall3(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        var stream = SYSCALLS.getStreamFromFD(),
          buf = SYSCALLS.get(),
          count = SYSCALLS.get();
        return FS.read(stream, HEAP8, buf, count);
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          abort(e);
        return -e.errno;
      }
    }
    function ___syscall33(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        var path = SYSCALLS.getStr(),
          amode = SYSCALLS.get();
        return SYSCALLS.doAccess(path, amode);
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          abort(e);
        return -e.errno;
      }
    }
    function ___syscall38(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        var old_path = SYSCALLS.getStr(),
          new_path = SYSCALLS.getStr();
        FS.rename(old_path, new_path);
        return 0;
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          abort(e);
        return -e.errno;
      }
    }
    function ___syscall39(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        var path = SYSCALLS.getStr(),
          mode = SYSCALLS.get();
        return SYSCALLS.doMkdir(path, mode);
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          abort(e);
        return -e.errno;
      }
    }
    function ___syscall4(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        var stream = SYSCALLS.getStreamFromFD(),
          buf = SYSCALLS.get(),
          count = SYSCALLS.get();
        return FS.write(stream, HEAP8, buf, count);
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          abort(e);
        return -e.errno;
      }
    }
    function ___syscall40(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        var path = SYSCALLS.getStr();
        FS.rmdir(path);
        return 0;
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          abort(e);
        return -e.errno;
      }
    }
    function ___syscall5(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        var pathname = SYSCALLS.getStr(),
          flags = SYSCALLS.get(),
          mode = SYSCALLS.get();
        var stream = FS.open(pathname, flags, mode);
        return stream.fd;
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          abort(e);
        return -e.errno;
      }
    }
    function ___syscall54(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        var stream = SYSCALLS.getStreamFromFD(),
          op = SYSCALLS.get();
        switch (op) {
          case 21509:
          case 21505: {
            if (!stream.tty) return -59;
            return 0;
          }
          case 21510:
          case 21511:
          case 21512:
          case 21506:
          case 21507:
          case 21508: {
            if (!stream.tty) return -59;
            return 0;
          }
          case 21519: {
            if (!stream.tty) return -59;
            var argp = SYSCALLS.get();
            HEAP32[argp >> 2] = 0;
            return 0;
          }
          case 21520: {
            if (!stream.tty) return -59;
            return -28;
          }
          case 21531: {
            var argp = SYSCALLS.get();
            return FS.ioctl(stream, op, argp);
          }
          case 21523: {
            if (!stream.tty) return -59;
            return 0;
          }
          case 21524: {
            if (!stream.tty) return -59;
            return 0;
          }
          default:
            abort("bad ioctl syscall " + op);
        }
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          abort(e);
        return -e.errno;
      }
    }
    function __emscripten_syscall_munmap(addr, len) {
      if (addr === -1 || len === 0) {
        return -28;
      }
      var info = SYSCALLS.mappings[addr];
      if (!info) return 0;
      if (len === info.len) {
        var stream = FS.getStream(info.fd);
        SYSCALLS.doMsync(addr, stream, len, info.flags);
        FS.munmap(stream);
        SYSCALLS.mappings[addr] = null;
        if (info.allocated) {
          _free(info.malloc);
        }
      }
      return 0;
    }
    function ___syscall91(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        var addr = SYSCALLS.get(),
          len = SYSCALLS.get();
        return __emscripten_syscall_munmap(addr, len);
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          abort(e);
        return -e.errno;
      }
    }
    function ___unlock() {}
    function _abort() {
      abort();
    }
    function _emscripten_get_now() {
      abort();
    }
    function _emscripten_get_now_is_monotonic() {
      return (
        0 ||
        ENVIRONMENT_IS_NODE ||
        typeof dateNow !== "undefined" ||
        (typeof performance === "object" &&
          performance &&
          typeof performance["now"] === "function")
      );
    }
    function _clock_gettime(clk_id, tp) {
      var now;
      if (clk_id === 0) {
        now = Date.now();
      } else if (clk_id === 1 && _emscripten_get_now_is_monotonic()) {
        now = _emscripten_get_now();
      } else {
        ___setErrNo(28);
        return -1;
      }
      HEAP32[tp >> 2] = (now / 1e3) | 0;
      HEAP32[(tp + 4) >> 2] = ((now % 1e3) * 1e3 * 1e3) | 0;
      return 0;
    }
    function _dlopen() {
      abort(
        "To use dlopen, you need to use Emscripten's linking support, see https://github.com/emscripten-core/emscripten/wiki/Linking"
      );
    }
    function _dlclose() {
      return _dlopen.apply(null, arguments);
    }
    function _dlerror() {
      return _dlopen.apply(null, arguments);
    }
    function _dlsym() {
      return _dlopen.apply(null, arguments);
    }
    function _emscripten_set_main_loop_timing(mode, value) {
      Browser.mainLoop.timingMode = mode;
      Browser.mainLoop.timingValue = value;
      if (!Browser.mainLoop.func) {
        return 1;
      }
      if (mode == 0) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
          var timeUntilNextTick =
            Math.max(
              0,
              Browser.mainLoop.tickStartTime + value - _emscripten_get_now()
            ) | 0;
          setTimeout(Browser.mainLoop.runner, timeUntilNextTick);
        };
        Browser.mainLoop.method = "timeout";
      } else if (mode == 1) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
          Browser.requestAnimationFrame(Browser.mainLoop.runner);
        };
        Browser.mainLoop.method = "rAF";
      } else if (mode == 2) {
        if (typeof setImmediate === "undefined") {
          var setImmediates = [];
          var emscriptenMainLoopMessageId = "setimmediate";
          var Browser_setImmediate_messageHandler = function(event) {
            if (
              event.data === emscriptenMainLoopMessageId ||
              event.data.target === emscriptenMainLoopMessageId
            ) {
              event.stopPropagation();
              setImmediates.shift()();
            }
          };
          addEventListener(
            "message",
            Browser_setImmediate_messageHandler,
            true
          );
          setImmediate = function Browser_emulated_setImmediate(func) {
            setImmediates.push(func);
            if (ENVIRONMENT_IS_WORKER) {
              if (Module["setImmediates"] === undefined)
                Module["setImmediates"] = [];
              Module["setImmediates"].push(func);
              postMessage({ target: emscriptenMainLoopMessageId });
            } else postMessage(emscriptenMainLoopMessageId, "*");
          };
        }
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
          setImmediate(Browser.mainLoop.runner);
        };
        Browser.mainLoop.method = "immediate";
      }
      return 0;
    }
    function _emscripten_set_main_loop(
      func,
      fps,
      simulateInfiniteLoop,
      arg,
      noSetTiming
    ) {
      noExitRuntime = true;
      assert(
        !Browser.mainLoop.func,
        "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters."
      );
      Browser.mainLoop.func = func;
      Browser.mainLoop.arg = arg;
      var browserIterationFunc;
      if (typeof arg !== "undefined") {
        browserIterationFunc = function() {
          Module["dynCall_vi"](func, arg);
        };
      } else {
        browserIterationFunc = function() {
          Module["dynCall_v"](func);
        };
      }
      var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
      Browser.mainLoop.runner = function Browser_mainLoop_runner() {
        if (ABORT) return;
        if (Browser.mainLoop.queue.length > 0) {
          var start = Date.now();
          var blocker = Browser.mainLoop.queue.shift();
          blocker.func(blocker.arg);
          if (Browser.mainLoop.remainingBlockers) {
            var remaining = Browser.mainLoop.remainingBlockers;
            var next =
              remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
            if (blocker.counted) {
              Browser.mainLoop.remainingBlockers = next;
            } else {
              next = next + 0.5;
              Browser.mainLoop.remainingBlockers = (8 * remaining + next) / 9;
            }
          }
          console.log(
            'main loop blocker "' +
              blocker.name +
              '" took ' +
              (Date.now() - start) +
              " ms"
          );
          Browser.mainLoop.updateStatus();
          if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop)
            return;
          setTimeout(Browser.mainLoop.runner, 0);
          return;
        }
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
        Browser.mainLoop.currentFrameNumber =
          (Browser.mainLoop.currentFrameNumber + 1) | 0;
        if (
          Browser.mainLoop.timingMode == 1 &&
          Browser.mainLoop.timingValue > 1 &&
          Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue !=
            0
        ) {
          Browser.mainLoop.scheduler();
          return;
        } else if (Browser.mainLoop.timingMode == 0) {
          Browser.mainLoop.tickStartTime = _emscripten_get_now();
        }
        if (Browser.mainLoop.method === "timeout" && Module.ctx) {
          err(
            "Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!"
          );
          Browser.mainLoop.method = "";
        }
        Browser.mainLoop.runIter(browserIterationFunc);
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
        if (typeof SDL === "object" && SDL.audio && SDL.audio.queueNewAudioData)
          SDL.audio.queueNewAudioData();
        Browser.mainLoop.scheduler();
      };
      if (!noSetTiming) {
        if (fps && fps > 0) _emscripten_set_main_loop_timing(0, 1e3 / fps);
        else _emscripten_set_main_loop_timing(1, 1);
        Browser.mainLoop.scheduler();
      }
      if (simulateInfiniteLoop) {
        throw "SimulateInfiniteLoop";
      }
    }
    var Browser = {
      mainLoop: {
        scheduler: null,
        method: "",
        currentlyRunningMainloop: 0,
        func: null,
        arg: 0,
        timingMode: 0,
        timingValue: 0,
        currentFrameNumber: 0,
        queue: [],
        pause: function() {
          Browser.mainLoop.scheduler = null;
          Browser.mainLoop.currentlyRunningMainloop++;
        },
        resume: function() {
          Browser.mainLoop.currentlyRunningMainloop++;
          var timingMode = Browser.mainLoop.timingMode;
          var timingValue = Browser.mainLoop.timingValue;
          var func = Browser.mainLoop.func;
          Browser.mainLoop.func = null;
          _emscripten_set_main_loop(func, 0, false, Browser.mainLoop.arg, true);
          _emscripten_set_main_loop_timing(timingMode, timingValue);
          Browser.mainLoop.scheduler();
        },
        updateStatus: function() {
          if (Module["setStatus"]) {
            var message = Module["statusMessage"] || "Please wait...";
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module["setStatus"](
                  message + " (" + (expected - remaining) + "/" + expected + ")"
                );
              } else {
                Module["setStatus"](message);
              }
            } else {
              Module["setStatus"]("");
            }
          }
        },
        runIter: function(func) {
          if (ABORT) return;
          if (Module["preMainLoop"]) {
            var preRet = Module["preMainLoop"]();
            if (preRet === false) {
              return;
            }
          }
          try {
            func();
          } catch (e) {
            if (e instanceof ExitStatus) {
              return;
            } else {
              if (e && typeof e === "object" && e.stack)
                err("exception thrown: " + [e, e.stack]);
              throw e;
            }
          }
          if (Module["postMainLoop"]) Module["postMainLoop"]();
        }
      },
      isFullscreen: false,
      pointerLock: false,
      moduleContextCreatedCallbacks: [],
      workers: [],
      init: function() {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = [];
        if (Browser.initted) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch (e) {
          Browser.hasBlobConstructor = false;
          console.log(
            "warning: no blob constructor, cannot create blobs with mimetypes"
          );
        }
        Browser.BlobBuilder =
          typeof MozBlobBuilder != "undefined"
            ? MozBlobBuilder
            : typeof WebKitBlobBuilder != "undefined"
            ? WebKitBlobBuilder
            : !Browser.hasBlobConstructor
            ? console.log("warning: no BlobBuilder")
            : null;
        Browser.URLObject =
          typeof window != "undefined"
            ? window.URL
              ? window.URL
              : window.webkitURL
            : undefined;
        if (
          !Module.noImageDecoding &&
          typeof Browser.URLObject === "undefined"
        ) {
          console.log(
            "warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available."
          );
          Module.noImageDecoding = true;
        }
        var imagePlugin = {};
        imagePlugin["canHandle"] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin["handle"] = function imagePlugin_handle(
          byteArray,
          name,
          onload,
          onerror
        ) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) {
                b = new Blob([new Uint8Array(byteArray).buffer], {
                  type: Browser.getMimetype(name)
                });
              }
            } catch (e) {
              warnOnce(
                "Blob constructor present but fails: " +
                  e +
                  "; falling back to blob builder"
              );
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append(new Uint8Array(byteArray).buffer);
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, "Image " + name + " could not be decoded");
            var canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log("Image " + url + " could not be decoded");
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module["preloadPlugins"].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin["canHandle"] = function audioPlugin_canHandle(name) {
          return (
            !Module.noAudioDecoding &&
            name.substr(-4) in { ".ogg": 1, ".wav": 1, ".mp3": 1 }
          );
        };
        audioPlugin["handle"] = function audioPlugin_handle(
          byteArray,
          name,
          onload,
          onerror
        ) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio();
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], {
                type: Browser.getMimetype(name)
              });
            } catch (e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b);
            var audio = new Audio();
            audio.addEventListener(
              "canplaythrough",
              function() {
                finish(audio);
              },
              false
            );
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log(
                "warning: browser could not fully decode audio " +
                  name +
                  ", trying slower base64 approach"
              );
              function encode64(data) {
                var BASE =
                  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
                var PAD = "=";
                var ret = "";
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits - 6)) & 63;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar & 3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar & 15) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src =
                "data:audio/x-" +
                name.substr(-3) +
                ";base64," +
                encode64(byteArray);
              finish(audio);
            };
            audio.src = url;
            Browser.safeSetTimeout(function() {
              finish(audio);
            }, 1e4);
          } else {
            return fail();
          }
        };
        Module["preloadPlugins"].push(audioPlugin);
        function pointerLockChange() {
          Browser.pointerLock =
            document["pointerLockElement"] === Module["canvas"] ||
            document["mozPointerLockElement"] === Module["canvas"] ||
            document["webkitPointerLockElement"] === Module["canvas"] ||
            document["msPointerLockElement"] === Module["canvas"];
        }
        var canvas = Module["canvas"];
        if (canvas) {
          canvas.requestPointerLock =
            canvas["requestPointerLock"] ||
            canvas["mozRequestPointerLock"] ||
            canvas["webkitRequestPointerLock"] ||
            canvas["msRequestPointerLock"] ||
            function() {};
          canvas.exitPointerLock =
            document["exitPointerLock"] ||
            document["mozExitPointerLock"] ||
            document["webkitExitPointerLock"] ||
            document["msExitPointerLock"] ||
            function() {};
          canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
          document.addEventListener(
            "pointerlockchange",
            pointerLockChange,
            false
          );
          document.addEventListener(
            "mozpointerlockchange",
            pointerLockChange,
            false
          );
          document.addEventListener(
            "webkitpointerlockchange",
            pointerLockChange,
            false
          );
          document.addEventListener(
            "mspointerlockchange",
            pointerLockChange,
            false
          );
          if (Module["elementPointerLock"]) {
            canvas.addEventListener(
              "click",
              function(ev) {
                if (
                  !Browser.pointerLock &&
                  Module["canvas"].requestPointerLock
                ) {
                  Module["canvas"].requestPointerLock();
                  ev.preventDefault();
                }
              },
              false
            );
          }
        }
      },
      createContext: function(
        canvas,
        useWebGL,
        setInModule,
        webGLContextAttributes
      ) {
        if (useWebGL && Module.ctx && canvas == Module.canvas)
          return Module.ctx;
        var ctx;
        var contextHandle;
        if (useWebGL) {
          var contextAttributes = {
            antialias: false,
            alpha: false,
            majorVersion: typeof WebGL2RenderingContext !== "undefined" ? 2 : 1
          };
          if (webGLContextAttributes) {
            for (var attribute in webGLContextAttributes) {
              contextAttributes[attribute] = webGLContextAttributes[attribute];
            }
          }
          if (typeof GL !== "undefined") {
            contextHandle = GL.createContext(canvas, contextAttributes);
            if (contextHandle) {
              ctx = GL.getContext(contextHandle).GLctx;
            }
          }
        } else {
          ctx = canvas.getContext("2d");
        }
        if (!ctx) return null;
        if (setInModule) {
          if (!useWebGL)
            assert(
              typeof GLctx === "undefined",
              "cannot set in module if GLctx is used, but we are a non-GL context that would replace it"
            );
          Module.ctx = ctx;
          if (useWebGL) GL.makeContextCurrent(contextHandle);
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) {
            callback();
          });
          Browser.init();
        }
        return ctx;
      },
      destroyContext: function(canvas, useWebGL, setInModule) {},
      fullscreenHandlersInstalled: false,
      lockPointer: undefined,
      resizeCanvas: undefined,
      requestFullscreen: function(lockPointer, resizeCanvas, vrDevice) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        Browser.vrDevice = vrDevice;
        if (typeof Browser.lockPointer === "undefined")
          Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === "undefined")
          Browser.resizeCanvas = false;
        if (typeof Browser.vrDevice === "undefined") Browser.vrDevice = null;
        var canvas = Module["canvas"];
        function fullscreenChange() {
          Browser.isFullscreen = false;
          var canvasContainer = canvas.parentNode;
          if (
            (document["fullscreenElement"] ||
              document["mozFullScreenElement"] ||
              document["msFullscreenElement"] ||
              document["webkitFullscreenElement"] ||
              document["webkitCurrentFullScreenElement"]) === canvasContainer
          ) {
            canvas.exitFullscreen = Browser.exitFullscreen;
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullscreen = true;
            if (Browser.resizeCanvas) {
              Browser.setFullscreenCanvasSize();
            } else {
              Browser.updateCanvasDimensions(canvas);
            }
          } else {
            canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
            canvasContainer.parentNode.removeChild(canvasContainer);
            if (Browser.resizeCanvas) {
              Browser.setWindowedCanvasSize();
            } else {
              Browser.updateCanvasDimensions(canvas);
            }
          }
          if (Module["onFullScreen"])
            Module["onFullScreen"](Browser.isFullscreen);
          if (Module["onFullscreen"])
            Module["onFullscreen"](Browser.isFullscreen);
        }
        if (!Browser.fullscreenHandlersInstalled) {
          Browser.fullscreenHandlersInstalled = true;
          document.addEventListener(
            "fullscreenchange",
            fullscreenChange,
            false
          );
          document.addEventListener(
            "mozfullscreenchange",
            fullscreenChange,
            false
          );
          document.addEventListener(
            "webkitfullscreenchange",
            fullscreenChange,
            false
          );
          document.addEventListener(
            "MSFullscreenChange",
            fullscreenChange,
            false
          );
        }
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
        canvasContainer.requestFullscreen =
          canvasContainer["requestFullscreen"] ||
          canvasContainer["mozRequestFullScreen"] ||
          canvasContainer["msRequestFullscreen"] ||
          (canvasContainer["webkitRequestFullscreen"]
            ? function() {
                canvasContainer["webkitRequestFullscreen"](
                  Element["ALLOW_KEYBOARD_INPUT"]
                );
              }
            : null) ||
          (canvasContainer["webkitRequestFullScreen"]
            ? function() {
                canvasContainer["webkitRequestFullScreen"](
                  Element["ALLOW_KEYBOARD_INPUT"]
                );
              }
            : null);
        if (vrDevice) {
          canvasContainer.requestFullscreen({ vrDisplay: vrDevice });
        } else {
          canvasContainer.requestFullscreen();
        }
      },
      requestFullScreen: function(lockPointer, resizeCanvas, vrDevice) {
        err(
          "Browser.requestFullScreen() is deprecated. Please call Browser.requestFullscreen instead."
        );
        Browser.requestFullScreen = function(
          lockPointer,
          resizeCanvas,
          vrDevice
        ) {
          return Browser.requestFullscreen(lockPointer, resizeCanvas, vrDevice);
        };
        return Browser.requestFullscreen(lockPointer, resizeCanvas, vrDevice);
      },
      exitFullscreen: function() {
        if (!Browser.isFullscreen) {
          return false;
        }
        var CFS =
          document["exitFullscreen"] ||
          document["cancelFullScreen"] ||
          document["mozCancelFullScreen"] ||
          document["msExitFullscreen"] ||
          document["webkitCancelFullScreen"] ||
          function() {};
        CFS.apply(document, []);
        return true;
      },
      nextRAF: 0,
      fakeRequestAnimationFrame: function(func) {
        var now = Date.now();
        if (Browser.nextRAF === 0) {
          Browser.nextRAF = now + 1e3 / 60;
        } else {
          while (now + 2 >= Browser.nextRAF) {
            Browser.nextRAF += 1e3 / 60;
          }
        }
        var delay = Math.max(Browser.nextRAF - now, 0);
        setTimeout(func, delay);
      },
      requestAnimationFrame: function(func) {
        if (typeof requestAnimationFrame === "function") {
          requestAnimationFrame(func);
          return;
        }
        var RAF = Browser.fakeRequestAnimationFrame;
        RAF(func);
      },
      safeCallback: function(func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },
      allowAsyncCallbacks: true,
      queuedAsyncCallbacks: [],
      pauseAsyncCallbacks: function() {
        Browser.allowAsyncCallbacks = false;
      },
      resumeAsyncCallbacks: function() {
        Browser.allowAsyncCallbacks = true;
        if (Browser.queuedAsyncCallbacks.length > 0) {
          var callbacks = Browser.queuedAsyncCallbacks;
          Browser.queuedAsyncCallbacks = [];
          callbacks.forEach(function(func) {
            func();
          });
        }
      },
      safeRequestAnimationFrame: function(func) {
        return Browser.requestAnimationFrame(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } else {
            Browser.queuedAsyncCallbacks.push(func);
          }
        });
      },
      safeSetTimeout: function(func, timeout) {
        noExitRuntime = true;
        return setTimeout(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } else {
            Browser.queuedAsyncCallbacks.push(func);
          }
        }, timeout);
      },
      safeSetInterval: function(func, timeout) {
        noExitRuntime = true;
        return setInterval(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          }
        }, timeout);
      },
      getMimetype: function(name) {
        return {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          bmp: "image/bmp",
          ogg: "audio/ogg",
          wav: "audio/wav",
          mp3: "audio/mpeg"
        }[name.substr(name.lastIndexOf(".") + 1)];
      },
      getUserMedia: function(func) {
        if (!window.getUserMedia) {
          window.getUserMedia =
            navigator["getUserMedia"] || navigator["mozGetUserMedia"];
        }
        window.getUserMedia(func);
      },
      getMovementX: function(event) {
        return (
          event["movementX"] ||
          event["mozMovementX"] ||
          event["webkitMovementX"] ||
          0
        );
      },
      getMovementY: function(event) {
        return (
          event["movementY"] ||
          event["mozMovementY"] ||
          event["webkitMovementY"] ||
          0
        );
      },
      getMouseWheelDelta: function(event) {
        var delta = 0;
        switch (event.type) {
          case "DOMMouseScroll":
            delta = event.detail / 3;
            break;
          case "mousewheel":
            delta = event.wheelDelta / 120;
            break;
          case "wheel":
            delta = event.deltaY;
            switch (event.deltaMode) {
              case 0:
                delta /= 100;
                break;
              case 1:
                delta /= 3;
                break;
              case 2:
                delta *= 80;
                break;
              default:
                throw "unrecognized mouse wheel delta mode: " + event.deltaMode;
            }
            break;
          default:
            throw "unrecognized mouse wheel event: " + event.type;
        }
        return delta;
      },
      mouseX: 0,
      mouseY: 0,
      mouseMovementX: 0,
      mouseMovementY: 0,
      touches: {},
      lastTouches: {},
      calculateMouseEvent: function(event) {
        if (Browser.pointerLock) {
          if (event.type != "mousemove" && "mozMovementX" in event) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          if (typeof SDL != "undefined") {
            Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
            Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
            Browser.mouseX += Browser.mouseMovementX;
            Browser.mouseY += Browser.mouseMovementY;
          }
        } else {
          var rect = Module["canvas"].getBoundingClientRect();
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          var scrollX =
            typeof window.scrollX !== "undefined"
              ? window.scrollX
              : window.pageXOffset;
          var scrollY =
            typeof window.scrollY !== "undefined"
              ? window.scrollY
              : window.pageYOffset;
          if (
            event.type === "touchstart" ||
            event.type === "touchend" ||
            event.type === "touchmove"
          ) {
            var touch = event.touch;
            if (touch === undefined) {
              return;
            }
            var adjustedX = touch.pageX - (scrollX + rect.left);
            var adjustedY = touch.pageY - (scrollY + rect.top);
            adjustedX = adjustedX * (cw / rect.width);
            adjustedY = adjustedY * (ch / rect.height);
            var coords = { x: adjustedX, y: adjustedY };
            if (event.type === "touchstart") {
              Browser.lastTouches[touch.identifier] = coords;
              Browser.touches[touch.identifier] = coords;
            } else if (
              event.type === "touchend" ||
              event.type === "touchmove"
            ) {
              var last = Browser.touches[touch.identifier];
              if (!last) last = coords;
              Browser.lastTouches[touch.identifier] = last;
              Browser.touches[touch.identifier] = coords;
            }
            return;
          }
          var x = event.pageX - (scrollX + rect.left);
          var y = event.pageY - (scrollY + rect.top);
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },
      asyncLoad: function(url, onload, onerror, noRunDep) {
        var dep = !noRunDep ? getUniqueRunDependency("al " + url) : "";
        readAsync(
          url,
          function(arrayBuffer) {
            assert(
              arrayBuffer,
              'Loading data file "' + url + '" failed (no arrayBuffer).'
            );
            onload(new Uint8Array(arrayBuffer));
            if (dep) removeRunDependency(dep);
          },
          function(event) {
            if (onerror) {
              onerror();
            } else {
              throw 'Loading data file "' + url + '" failed.';
            }
          }
        );
        if (dep) addRunDependency(dep);
      },
      resizeListeners: [],
      updateResizeListeners: function() {
        var canvas = Module["canvas"];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },
      setCanvasSize: function(width, height, noUpdates) {
        var canvas = Module["canvas"];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners();
      },
      windowedWidth: 0,
      windowedHeight: 0,
      setFullscreenCanvasSize: function() {
        if (typeof SDL != "undefined") {
          var flags = HEAPU32[SDL.screen >> 2];
          flags = flags | 8388608;
          HEAP32[SDL.screen >> 2] = flags;
        }
        Browser.updateCanvasDimensions(Module["canvas"]);
        Browser.updateResizeListeners();
      },
      setWindowedCanvasSize: function() {
        if (typeof SDL != "undefined") {
          var flags = HEAPU32[SDL.screen >> 2];
          flags = flags & ~8388608;
          HEAP32[SDL.screen >> 2] = flags;
        }
        Browser.updateCanvasDimensions(Module["canvas"]);
        Browser.updateResizeListeners();
      },
      updateCanvasDimensions: function(canvas, wNative, hNative) {
        if (wNative && hNative) {
          canvas.widthNative = wNative;
          canvas.heightNative = hNative;
        } else {
          wNative = canvas.widthNative;
          hNative = canvas.heightNative;
        }
        var w = wNative;
        var h = hNative;
        if (Module["forcedAspectRatio"] && Module["forcedAspectRatio"] > 0) {
          if (w / h < Module["forcedAspectRatio"]) {
            w = Math.round(h * Module["forcedAspectRatio"]);
          } else {
            h = Math.round(w / Module["forcedAspectRatio"]);
          }
        }
        if (
          (document["fullscreenElement"] ||
            document["mozFullScreenElement"] ||
            document["msFullscreenElement"] ||
            document["webkitFullscreenElement"] ||
            document["webkitCurrentFullScreenElement"]) === canvas.parentNode &&
          typeof screen != "undefined"
        ) {
          var factor = Math.min(screen.width / w, screen.height / h);
          w = Math.round(w * factor);
          h = Math.round(h * factor);
        }
        if (Browser.resizeCanvas) {
          if (canvas.width != w) canvas.width = w;
          if (canvas.height != h) canvas.height = h;
          if (typeof canvas.style != "undefined") {
            canvas.style.removeProperty("width");
            canvas.style.removeProperty("height");
          }
        } else {
          if (canvas.width != wNative) canvas.width = wNative;
          if (canvas.height != hNative) canvas.height = hNative;
          if (typeof canvas.style != "undefined") {
            if (w != wNative || h != hNative) {
              canvas.style.setProperty("width", w + "px", "important");
              canvas.style.setProperty("height", h + "px", "important");
            } else {
              canvas.style.removeProperty("width");
              canvas.style.removeProperty("height");
            }
          }
        }
      },
      wgetRequests: {},
      nextWgetRequestHandle: 0,
      getNextWgetRequestHandle: function() {
        var handle = Browser.nextWgetRequestHandle;
        Browser.nextWgetRequestHandle++;
        return handle;
      }
    };
    var EGL = {
      errorCode: 12288,
      defaultDisplayInitialized: false,
      currentContext: 0,
      currentReadSurface: 0,
      currentDrawSurface: 0,
      contextAttributes: {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: false
      },
      stringCache: {},
      setErrorCode: function(code) {
        EGL.errorCode = code;
      },
      chooseConfig: function(
        display,
        attribList,
        config,
        config_size,
        numConfigs
      ) {
        if (display != 62e3) {
          EGL.setErrorCode(12296);
          return 0;
        }
        if (attribList) {
          for (;;) {
            var param = HEAP32[attribList >> 2];
            if (param == 12321) {
              var alphaSize = HEAP32[(attribList + 4) >> 2];
              EGL.contextAttributes.alpha = alphaSize > 0;
            } else if (param == 12325) {
              var depthSize = HEAP32[(attribList + 4) >> 2];
              EGL.contextAttributes.depth = depthSize > 0;
            } else if (param == 12326) {
              var stencilSize = HEAP32[(attribList + 4) >> 2];
              EGL.contextAttributes.stencil = stencilSize > 0;
            } else if (param == 12337) {
              var samples = HEAP32[(attribList + 4) >> 2];
              EGL.contextAttributes.antialias = samples > 0;
            } else if (param == 12338) {
              var samples = HEAP32[(attribList + 4) >> 2];
              EGL.contextAttributes.antialias = samples == 1;
            } else if (param == 12544) {
              var requestedPriority = HEAP32[(attribList + 4) >> 2];
              EGL.contextAttributes.lowLatency = requestedPriority != 12547;
            } else if (param == 12344) {
              break;
            }
            attribList += 8;
          }
        }
        if ((!config || !config_size) && !numConfigs) {
          EGL.setErrorCode(12300);
          return 0;
        }
        if (numConfigs) {
          HEAP32[numConfigs >> 2] = 1;
        }
        if (config && config_size > 0) {
          HEAP32[config >> 2] = 62002;
        }
        EGL.setErrorCode(12288);
        return 1;
      }
    };
    function _eglGetProcAddress(name_) {
      return _emscripten_GetProcAddress(name_);
    }
    var JSEvents = {
      keyEvent: 0,
      mouseEvent: 0,
      wheelEvent: 0,
      uiEvent: 0,
      focusEvent: 0,
      deviceOrientationEvent: 0,
      deviceMotionEvent: 0,
      fullscreenChangeEvent: 0,
      pointerlockChangeEvent: 0,
      visibilityChangeEvent: 0,
      touchEvent: 0,
      previousFullscreenElement: null,
      previousScreenX: null,
      previousScreenY: null,
      removeEventListenersRegistered: false,
      removeAllEventListeners: function() {
        for (var i = JSEvents.eventHandlers.length - 1; i >= 0; --i) {
          JSEvents._removeHandler(i);
        }
        JSEvents.eventHandlers = [];
        JSEvents.deferredCalls = [];
      },
      registerRemoveEventListeners: function() {
        if (!JSEvents.removeEventListenersRegistered) {
          __ATEXIT__.push(JSEvents.removeAllEventListeners);
          JSEvents.removeEventListenersRegistered = true;
        }
      },
      deferredCalls: [],
      deferCall: function(targetFunction, precedence, argsList) {
        function arraysHaveEqualContent(arrA, arrB) {
          if (arrA.length != arrB.length) return false;
          for (var i in arrA) {
            if (arrA[i] != arrB[i]) return false;
          }
          return true;
        }
        for (var i in JSEvents.deferredCalls) {
          var call = JSEvents.deferredCalls[i];
          if (
            call.targetFunction == targetFunction &&
            arraysHaveEqualContent(call.argsList, argsList)
          ) {
            return;
          }
        }
        JSEvents.deferredCalls.push({
          targetFunction: targetFunction,
          precedence: precedence,
          argsList: argsList
        });
        JSEvents.deferredCalls.sort(function(x, y) {
          return x.precedence < y.precedence;
        });
      },
      removeDeferredCalls: function(targetFunction) {
        for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
          if (JSEvents.deferredCalls[i].targetFunction == targetFunction) {
            JSEvents.deferredCalls.splice(i, 1);
            --i;
          }
        }
      },
      canPerformEventHandlerRequests: function() {
        return (
          JSEvents.inEventHandler &&
          JSEvents.currentEventHandler.allowsDeferredCalls
        );
      },
      runDeferredCalls: function() {
        if (!JSEvents.canPerformEventHandlerRequests()) {
          return;
        }
        for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
          var call = JSEvents.deferredCalls[i];
          JSEvents.deferredCalls.splice(i, 1);
          --i;
          call.targetFunction.apply(this, call.argsList);
        }
      },
      inEventHandler: 0,
      currentEventHandler: null,
      eventHandlers: [],
      isInternetExplorer: function() {
        return (
          navigator.userAgent.indexOf("MSIE") !== -1 ||
          navigator.appVersion.indexOf("Trident/") > 0
        );
      },
      removeAllHandlersOnTarget: function(target, eventTypeString) {
        for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
          if (
            JSEvents.eventHandlers[i].target == target &&
            (!eventTypeString ||
              eventTypeString == JSEvents.eventHandlers[i].eventTypeString)
          ) {
            JSEvents._removeHandler(i--);
          }
        }
      },
      _removeHandler: function(i) {
        var h = JSEvents.eventHandlers[i];
        h.target.removeEventListener(
          h.eventTypeString,
          h.eventListenerFunc,
          h.useCapture
        );
        JSEvents.eventHandlers.splice(i, 1);
      },
      registerOrRemoveHandler: function(eventHandler) {
        var jsEventHandler = function jsEventHandler(event) {
          ++JSEvents.inEventHandler;
          JSEvents.currentEventHandler = eventHandler;
          JSEvents.runDeferredCalls();
          eventHandler.handlerFunc(event);
          JSEvents.runDeferredCalls();
          --JSEvents.inEventHandler;
        };
        if (eventHandler.callbackfunc) {
          eventHandler.eventListenerFunc = jsEventHandler;
          eventHandler.target.addEventListener(
            eventHandler.eventTypeString,
            jsEventHandler,
            eventHandler.useCapture
          );
          JSEvents.eventHandlers.push(eventHandler);
          JSEvents.registerRemoveEventListeners();
        } else {
          for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
            if (
              JSEvents.eventHandlers[i].target == eventHandler.target &&
              JSEvents.eventHandlers[i].eventTypeString ==
                eventHandler.eventTypeString
            ) {
              JSEvents._removeHandler(i--);
            }
          }
        }
      },
      getBoundingClientRectOrZeros: function(target) {
        return target.getBoundingClientRect
          ? target.getBoundingClientRect()
          : { left: 0, top: 0 };
      },
      pageScrollPos: function() {
        if (pageXOffset > 0 || pageYOffset > 0) {
          return [pageXOffset, pageYOffset];
        }
        if (
          typeof document.documentElement.scrollLeft !== "undefined" ||
          typeof document.documentElement.scrollTop !== "undefined"
        ) {
          return [
            document.documentElement.scrollLeft,
            document.documentElement.scrollTop
          ];
        }
        return [document.body.scrollLeft | 0, document.body.scrollTop | 0];
      },
      getNodeNameForTarget: function(target) {
        if (!target) return "";
        if (target == window) return "#window";
        if (target == screen) return "#screen";
        return target && target.nodeName ? target.nodeName : "";
      },
      tick: function() {
        if (window["performance"] && window["performance"]["now"])
          return window["performance"]["now"]();
        else return Date.now();
      },
      fullscreenEnabled: function() {
        return (
          document.fullscreenEnabled ||
          document.mozFullScreenEnabled ||
          document.webkitFullscreenEnabled ||
          document.msFullscreenEnabled
        );
      }
    };
    function __setLetterbox(element, topBottom, leftRight) {
      if (JSEvents.isInternetExplorer()) {
        element.style.marginLeft = element.style.marginRight = leftRight + "px";
        element.style.marginTop = element.style.marginBottom = topBottom + "px";
      } else {
        element.style.paddingLeft = element.style.paddingRight =
          leftRight + "px";
        element.style.paddingTop = element.style.paddingBottom =
          topBottom + "px";
      }
    }
    function __hideEverythingExceptGivenElement(onlyVisibleElement) {
      var child = onlyVisibleElement;
      var parent = child.parentNode;
      var hiddenElements = [];
      while (child != document.body) {
        var children = parent.children;
        for (var i = 0; i < children.length; ++i) {
          if (children[i] != child) {
            hiddenElements.push({
              node: children[i],
              displayState: children[i].style.display
            });
            children[i].style.display = "none";
          }
        }
        child = parent;
        parent = parent.parentNode;
      }
      return hiddenElements;
    }
    var __restoreOldWindowedStyle = null;
    var __specialEventTargets = [
      0,
      typeof document !== "undefined" ? document : 0,
      typeof window !== "undefined" ? window : 0
    ];
    function __findEventTarget(target) {
      try {
        if (!target) return window;
        if (typeof target === "number")
          target = __specialEventTargets[target] || UTF8ToString(target);
        if (target === "#window") return window;
        else if (target === "#document") return document;
        else if (target === "#screen") return screen;
        else if (target === "#canvas") return Module["canvas"];
        return typeof target === "string"
          ? document.getElementById(target)
          : target;
      } catch (e) {
        return null;
      }
    }
    function __findCanvasEventTarget(target) {
      if (typeof target === "number") target = UTF8ToString(target);
      if (!target || target === "#canvas") {
        if (typeof GL !== "undefined" && GL.offscreenCanvases["canvas"])
          return GL.offscreenCanvases["canvas"];
        return Module["canvas"];
      }
      if (typeof GL !== "undefined" && GL.offscreenCanvases[target])
        return GL.offscreenCanvases[target];
      return __findEventTarget(target);
    }
    function _emscripten_get_canvas_element_size(target, width, height) {
      var canvas = __findCanvasEventTarget(target);
      if (!canvas) return -4;
      HEAP32[width >> 2] = canvas.width;
      HEAP32[height >> 2] = canvas.height;
    }
    function __get_canvas_element_size(target) {
      var stackTop = stackSave();
      var w = stackAlloc(8);
      var h = w + 4;
      var targetInt = stackAlloc(target.id.length + 1);
      stringToUTF8(target.id, targetInt, target.id.length + 1);
      var ret = _emscripten_get_canvas_element_size(targetInt, w, h);
      var size = [HEAP32[w >> 2], HEAP32[h >> 2]];
      stackRestore(stackTop);
      return size;
    }
    function _emscripten_set_canvas_element_size(target, width, height) {
      var canvas = __findCanvasEventTarget(target);
      if (!canvas) return -4;
      canvas.width = width;
      canvas.height = height;
      return 0;
    }
    function __set_canvas_element_size(target, width, height) {
      if (!target.controlTransferredOffscreen) {
        target.width = width;
        target.height = height;
      } else {
        var stackTop = stackSave();
        var targetInt = stackAlloc(target.id.length + 1);
        stringToUTF8(target.id, targetInt, target.id.length + 1);
        _emscripten_set_canvas_element_size(targetInt, width, height);
        stackRestore(stackTop);
      }
    }
    function __registerRestoreOldStyle(canvas) {
      var canvasSize = __get_canvas_element_size(canvas);
      var oldWidth = canvasSize[0];
      var oldHeight = canvasSize[1];
      var oldCssWidth = canvas.style.width;
      var oldCssHeight = canvas.style.height;
      var oldBackgroundColor = canvas.style.backgroundColor;
      var oldDocumentBackgroundColor = document.body.style.backgroundColor;
      var oldPaddingLeft = canvas.style.paddingLeft;
      var oldPaddingRight = canvas.style.paddingRight;
      var oldPaddingTop = canvas.style.paddingTop;
      var oldPaddingBottom = canvas.style.paddingBottom;
      var oldMarginLeft = canvas.style.marginLeft;
      var oldMarginRight = canvas.style.marginRight;
      var oldMarginTop = canvas.style.marginTop;
      var oldMarginBottom = canvas.style.marginBottom;
      var oldDocumentBodyMargin = document.body.style.margin;
      var oldDocumentOverflow = document.documentElement.style.overflow;
      var oldDocumentScroll = document.body.scroll;
      var oldImageRendering = canvas.style.imageRendering;
      function restoreOldStyle() {
        var fullscreenElement =
          document.fullscreenElement ||
          document.mozFullScreenElement ||
          document.webkitFullscreenElement ||
          document.msFullscreenElement;
        if (!fullscreenElement) {
          document.removeEventListener("fullscreenchange", restoreOldStyle);
          document.removeEventListener("mozfullscreenchange", restoreOldStyle);
          document.removeEventListener(
            "webkitfullscreenchange",
            restoreOldStyle
          );
          document.removeEventListener("MSFullscreenChange", restoreOldStyle);
          __set_canvas_element_size(canvas, oldWidth, oldHeight);
          canvas.style.width = oldCssWidth;
          canvas.style.height = oldCssHeight;
          canvas.style.backgroundColor = oldBackgroundColor;
          if (!oldDocumentBackgroundColor)
            document.body.style.backgroundColor = "white";
          document.body.style.backgroundColor = oldDocumentBackgroundColor;
          canvas.style.paddingLeft = oldPaddingLeft;
          canvas.style.paddingRight = oldPaddingRight;
          canvas.style.paddingTop = oldPaddingTop;
          canvas.style.paddingBottom = oldPaddingBottom;
          canvas.style.marginLeft = oldMarginLeft;
          canvas.style.marginRight = oldMarginRight;
          canvas.style.marginTop = oldMarginTop;
          canvas.style.marginBottom = oldMarginBottom;
          document.body.style.margin = oldDocumentBodyMargin;
          document.documentElement.style.overflow = oldDocumentOverflow;
          document.body.scroll = oldDocumentScroll;
          canvas.style.imageRendering = oldImageRendering;
          if (canvas.GLctxObject)
            canvas.GLctxObject.GLctx.viewport(0, 0, oldWidth, oldHeight);
          if (__currentFullscreenStrategy.canvasResizedCallback) {
            dynCall_iiii(
              __currentFullscreenStrategy.canvasResizedCallback,
              37,
              0,
              __currentFullscreenStrategy.canvasResizedCallbackUserData
            );
          }
        }
      }
      document.addEventListener("fullscreenchange", restoreOldStyle);
      document.addEventListener("mozfullscreenchange", restoreOldStyle);
      document.addEventListener("webkitfullscreenchange", restoreOldStyle);
      document.addEventListener("MSFullscreenChange", restoreOldStyle);
      return restoreOldStyle;
    }
    function __restoreHiddenElements(hiddenElements) {
      for (var i = 0; i < hiddenElements.length; ++i) {
        hiddenElements[i].node.style.display = hiddenElements[i].displayState;
      }
    }
    var __currentFullscreenStrategy = {};
    function __softFullscreenResizeWebGLRenderTarget() {
      var dpr = devicePixelRatio;
      var inHiDPIFullscreenMode =
        __currentFullscreenStrategy.canvasResolutionScaleMode == 2;
      var inAspectRatioFixedFullscreenMode =
        __currentFullscreenStrategy.scaleMode == 2;
      var inPixelPerfectFullscreenMode =
        __currentFullscreenStrategy.canvasResolutionScaleMode != 0;
      var inCenteredWithoutScalingFullscreenMode =
        __currentFullscreenStrategy.scaleMode == 3;
      var screenWidth = inHiDPIFullscreenMode
        ? Math.round(innerWidth * dpr)
        : innerWidth;
      var screenHeight = inHiDPIFullscreenMode
        ? Math.round(innerHeight * dpr)
        : innerHeight;
      var w = screenWidth;
      var h = screenHeight;
      var canvas = __currentFullscreenStrategy.target;
      var canvasSize = __get_canvas_element_size(canvas);
      var x = canvasSize[0];
      var y = canvasSize[1];
      var topMargin;
      if (inAspectRatioFixedFullscreenMode) {
        if (w * y < x * h) h = ((w * y) / x) | 0;
        else if (w * y > x * h) w = ((h * x) / y) | 0;
        topMargin = ((screenHeight - h) / 2) | 0;
      }
      if (inPixelPerfectFullscreenMode) {
        __set_canvas_element_size(canvas, w, h);
        if (canvas.GLctxObject) canvas.GLctxObject.GLctx.viewport(0, 0, w, h);
      }
      if (inHiDPIFullscreenMode) {
        topMargin /= dpr;
        w /= dpr;
        h /= dpr;
        w = Math.round(w * 1e4) / 1e4;
        h = Math.round(h * 1e4) / 1e4;
        topMargin = Math.round(topMargin * 1e4) / 1e4;
      }
      if (inCenteredWithoutScalingFullscreenMode) {
        var t = (innerHeight - parseInt(canvas.style.height)) / 2;
        var b = (innerWidth - parseInt(canvas.style.width)) / 2;
        __setLetterbox(canvas, t, b);
      } else {
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        var b = (innerWidth - w) / 2;
        __setLetterbox(canvas, topMargin, b);
      }
      if (
        !inCenteredWithoutScalingFullscreenMode &&
        __currentFullscreenStrategy.canvasResizedCallback
      ) {
        dynCall_iiii(
          __currentFullscreenStrategy.canvasResizedCallback,
          37,
          0,
          __currentFullscreenStrategy.canvasResizedCallbackUserData
        );
      }
    }
    function _JSEvents_resizeCanvasForFullscreen(target, strategy) {
      var restoreOldStyle = __registerRestoreOldStyle(target);
      var cssWidth = strategy.softFullscreen ? innerWidth : screen.width;
      var cssHeight = strategy.softFullscreen ? innerHeight : screen.height;
      var rect = target.getBoundingClientRect();
      var windowedCssWidth = rect.right - rect.left;
      var windowedCssHeight = rect.bottom - rect.top;
      var canvasSize = __get_canvas_element_size(target);
      var windowedRttWidth = canvasSize[0];
      var windowedRttHeight = canvasSize[1];
      if (strategy.scaleMode == 3) {
        __setLetterbox(
          target,
          (cssHeight - windowedCssHeight) / 2,
          (cssWidth - windowedCssWidth) / 2
        );
        cssWidth = windowedCssWidth;
        cssHeight = windowedCssHeight;
      } else if (strategy.scaleMode == 2) {
        if (cssWidth * windowedRttHeight < windowedRttWidth * cssHeight) {
          var desiredCssHeight =
            (windowedRttHeight * cssWidth) / windowedRttWidth;
          __setLetterbox(target, (cssHeight - desiredCssHeight) / 2, 0);
          cssHeight = desiredCssHeight;
        } else {
          var desiredCssWidth =
            (windowedRttWidth * cssHeight) / windowedRttHeight;
          __setLetterbox(target, 0, (cssWidth - desiredCssWidth) / 2);
          cssWidth = desiredCssWidth;
        }
      }
      if (!target.style.backgroundColor) target.style.backgroundColor = "black";
      if (!document.body.style.backgroundColor)
        document.body.style.backgroundColor = "black";
      target.style.width = cssWidth + "px";
      target.style.height = cssHeight + "px";
      if (strategy.filteringMode == 1) {
        target.style.imageRendering = "optimizeSpeed";
        target.style.imageRendering = "-moz-crisp-edges";
        target.style.imageRendering = "-o-crisp-edges";
        target.style.imageRendering = "-webkit-optimize-contrast";
        target.style.imageRendering = "optimize-contrast";
        target.style.imageRendering = "crisp-edges";
        target.style.imageRendering = "pixelated";
      }
      var dpiScale =
        strategy.canvasResolutionScaleMode == 2 ? devicePixelRatio : 1;
      if (strategy.canvasResolutionScaleMode != 0) {
        var newWidth = (cssWidth * dpiScale) | 0;
        var newHeight = (cssHeight * dpiScale) | 0;
        __set_canvas_element_size(target, newWidth, newHeight);
        if (target.GLctxObject)
          target.GLctxObject.GLctx.viewport(0, 0, newWidth, newHeight);
      }
      return restoreOldStyle;
    }
    function _emscripten_enter_soft_fullscreen(target, fullscreenStrategy) {
      if (!target) target = "#canvas";
      target = __findEventTarget(target);
      if (!target) return -4;
      var strategy = {};
      strategy.scaleMode = HEAP32[fullscreenStrategy >> 2];
      strategy.canvasResolutionScaleMode =
        HEAP32[(fullscreenStrategy + 4) >> 2];
      strategy.filteringMode = HEAP32[(fullscreenStrategy + 8) >> 2];
      strategy.canvasResizedCallback = HEAP32[(fullscreenStrategy + 12) >> 2];
      strategy.canvasResizedCallbackUserData =
        HEAP32[(fullscreenStrategy + 16) >> 2];
      strategy.target = target;
      strategy.softFullscreen = true;
      var restoreOldStyle = _JSEvents_resizeCanvasForFullscreen(
        target,
        strategy
      );
      document.documentElement.style.overflow = "hidden";
      document.body.scroll = "no";
      document.body.style.margin = "0px";
      var hiddenElements = __hideEverythingExceptGivenElement(target);
      function restoreWindowedState() {
        restoreOldStyle();
        __restoreHiddenElements(hiddenElements);
        removeEventListener("resize", __softFullscreenResizeWebGLRenderTarget);
        if (strategy.canvasResizedCallback) {
          dynCall_iiii(
            strategy.canvasResizedCallback,
            37,
            0,
            strategy.canvasResizedCallbackUserData
          );
        }
        __currentFullscreenStrategy = 0;
      }
      __restoreOldWindowedStyle = restoreWindowedState;
      __currentFullscreenStrategy = strategy;
      addEventListener("resize", __softFullscreenResizeWebGLRenderTarget);
      if (strategy.canvasResizedCallback) {
        dynCall_iiii(
          strategy.canvasResizedCallback,
          37,
          0,
          strategy.canvasResizedCallbackUserData
        );
      }
      return 0;
    }
    function _JSEvents_requestFullscreen(target, strategy) {
      if (strategy.scaleMode != 0 || strategy.canvasResolutionScaleMode != 0) {
        _JSEvents_resizeCanvasForFullscreen(target, strategy);
      }
      if (target.requestFullscreen) {
        target.requestFullscreen();
      } else if (target.msRequestFullscreen) {
        target.msRequestFullscreen();
      } else if (target.mozRequestFullScreen) {
        target.mozRequestFullScreen();
      } else if (target.mozRequestFullscreen) {
        target.mozRequestFullscreen();
      } else if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
      } else {
        return JSEvents.fullscreenEnabled() ? -3 : -1;
      }
      if (strategy.canvasResizedCallback) {
        dynCall_iiii(
          strategy.canvasResizedCallback,
          37,
          0,
          strategy.canvasResizedCallbackUserData
        );
      }
      return 0;
    }
    function _emscripten_exit_fullscreen() {
      if (!JSEvents.fullscreenEnabled()) return -1;
      JSEvents.removeDeferredCalls(_JSEvents_requestFullscreen);
      var d = __specialEventTargets[1];
      if (d.exitFullscreen) {
        d.fullscreenElement && d.exitFullscreen();
      } else if (d.msExitFullscreen) {
        d.msFullscreenElement && d.msExitFullscreen();
      } else if (d.mozCancelFullScreen) {
        d.mozFullScreenElement && d.mozCancelFullScreen();
      } else if (d.webkitExitFullscreen) {
        d.webkitFullscreenElement && d.webkitExitFullscreen();
      } else {
        return -1;
      }
      if (__currentFullscreenStrategy.canvasResizedCallback) {
        dynCall_iiii(
          __currentFullscreenStrategy.canvasResizedCallback,
          37,
          0,
          __currentFullscreenStrategy.canvasResizedCallbackUserData
        );
        __currentFullscreenStrategy = 0;
      }
      return 0;
    }
    function __requestPointerLock(target) {
      if (target.requestPointerLock) {
        target.requestPointerLock();
      } else if (target.mozRequestPointerLock) {
        target.mozRequestPointerLock();
      } else if (target.webkitRequestPointerLock) {
        target.webkitRequestPointerLock();
      } else if (target.msRequestPointerLock) {
        target.msRequestPointerLock();
      } else {
        if (
          document.body.requestPointerLock ||
          document.body.mozRequestPointerLock ||
          document.body.webkitRequestPointerLock ||
          document.body.msRequestPointerLock
        ) {
          return -3;
        } else {
          return -1;
        }
      }
      return 0;
    }
    function _emscripten_exit_pointerlock() {
      JSEvents.removeDeferredCalls(__requestPointerLock);
      if (document.exitPointerLock) {
        document.exitPointerLock();
      } else if (document.msExitPointerLock) {
        document.msExitPointerLock();
      } else if (document.mozExitPointerLock) {
        document.mozExitPointerLock();
      } else if (document.webkitExitPointerLock) {
        document.webkitExitPointerLock();
      } else {
        return -1;
      }
      return 0;
    }
    function _emscripten_exit_soft_fullscreen() {
      if (__restoreOldWindowedStyle) __restoreOldWindowedStyle();
      __restoreOldWindowedStyle = null;
      return 0;
    }
    function _emscripten_get_element_css_size(target, width, height) {
      target = target ? __findEventTarget(target) : Module["canvas"];
      if (!target) return -4;
      if (target.getBoundingClientRect) {
        var rect = target.getBoundingClientRect();
        HEAPF64[width >> 3] = rect.right - rect.left;
        HEAPF64[height >> 3] = rect.bottom - rect.top;
      } else {
        HEAPF64[width >> 3] = target.clientWidth;
        HEAPF64[height >> 3] = target.clientHeight;
      }
      return 0;
    }
    function __fillFullscreenChangeEventData(eventStruct, e) {
      var fullscreenElement =
        document.fullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement;
      var isFullscreen = !!fullscreenElement;
      HEAP32[eventStruct >> 2] = isFullscreen;
      HEAP32[(eventStruct + 4) >> 2] = JSEvents.fullscreenEnabled();
      var reportedElement = isFullscreen
        ? fullscreenElement
        : JSEvents.previousFullscreenElement;
      var nodeName = JSEvents.getNodeNameForTarget(reportedElement);
      var id = reportedElement && reportedElement.id ? reportedElement.id : "";
      stringToUTF8(nodeName, eventStruct + 8, 128);
      stringToUTF8(id, eventStruct + 136, 128);
      HEAP32[(eventStruct + 264) >> 2] = reportedElement
        ? reportedElement.clientWidth
        : 0;
      HEAP32[(eventStruct + 268) >> 2] = reportedElement
        ? reportedElement.clientHeight
        : 0;
      HEAP32[(eventStruct + 272) >> 2] = screen.width;
      HEAP32[(eventStruct + 276) >> 2] = screen.height;
      if (isFullscreen) {
        JSEvents.previousFullscreenElement = fullscreenElement;
      }
    }
    function _emscripten_get_fullscreen_status(fullscreenStatus) {
      if (!JSEvents.fullscreenEnabled()) return -1;
      __fillFullscreenChangeEventData(fullscreenStatus);
      return 0;
    }
    function __fillGamepadEventData(eventStruct, e) {
      HEAPF64[eventStruct >> 3] = e.timestamp;
      for (var i = 0; i < e.axes.length; ++i) {
        HEAPF64[(eventStruct + i * 8 + 16) >> 3] = e.axes[i];
      }
      for (var i = 0; i < e.buttons.length; ++i) {
        if (typeof e.buttons[i] === "object") {
          HEAPF64[(eventStruct + i * 8 + 528) >> 3] = e.buttons[i].value;
        } else {
          HEAPF64[(eventStruct + i * 8 + 528) >> 3] = e.buttons[i];
        }
      }
      for (var i = 0; i < e.buttons.length; ++i) {
        if (typeof e.buttons[i] === "object") {
          HEAP32[(eventStruct + i * 4 + 1040) >> 2] = e.buttons[i].pressed;
        } else {
          HEAP32[(eventStruct + i * 4 + 1040) >> 2] = e.buttons[i] == 1;
        }
      }
      HEAP32[(eventStruct + 1296) >> 2] = e.connected;
      HEAP32[(eventStruct + 1300) >> 2] = e.index;
      HEAP32[(eventStruct + 8) >> 2] = e.axes.length;
      HEAP32[(eventStruct + 12) >> 2] = e.buttons.length;
      stringToUTF8(e.id, eventStruct + 1304, 64);
      stringToUTF8(e.mapping, eventStruct + 1368, 64);
    }
    function _emscripten_get_gamepad_status(index, gamepadState) {
      if (index < 0 || index >= JSEvents.lastGamepadState.length) return -5;
      if (!JSEvents.lastGamepadState[index]) return -7;
      __fillGamepadEventData(gamepadState, JSEvents.lastGamepadState[index]);
      return 0;
    }
    function _emscripten_get_heap_size() {
      return HEAP8.length;
    }
    function _emscripten_get_num_gamepads() {
      return JSEvents.lastGamepadState.length;
    }
    function __fillPointerlockChangeEventData(eventStruct, e) {
      var pointerLockElement =
        document.pointerLockElement ||
        document.mozPointerLockElement ||
        document.webkitPointerLockElement ||
        document.msPointerLockElement;
      var isPointerlocked = !!pointerLockElement;
      HEAP32[eventStruct >> 2] = isPointerlocked;
      var nodeName = JSEvents.getNodeNameForTarget(pointerLockElement);
      var id =
        pointerLockElement && pointerLockElement.id
          ? pointerLockElement.id
          : "";
      stringToUTF8(nodeName, eventStruct + 4, 128);
      stringToUTF8(id, eventStruct + 132, 128);
    }
    function _emscripten_get_pointerlock_status(pointerlockStatus) {
      if (pointerlockStatus)
        __fillPointerlockChangeEventData(pointerlockStatus);
      if (
        !document.body ||
        (!document.body.requestPointerLock &&
          !document.body.mozRequestPointerLock &&
          !document.body.webkitRequestPointerLock &&
          !document.body.msRequestPointerLock)
      ) {
        return -1;
      }
      return 0;
    }
    var GL = {
      counter: 1,
      lastError: 0,
      buffers: [],
      mappedBuffers: {},
      programs: [],
      framebuffers: [],
      renderbuffers: [],
      textures: [],
      uniforms: [],
      shaders: [],
      vaos: [],
      contexts: {},
      currentContext: null,
      offscreenCanvases: {},
      timerQueriesEXT: [],
      queries: [],
      samplers: [],
      transformFeedbacks: [],
      syncs: [],
      programInfos: {},
      stringCache: {},
      stringiCache: {},
      unpackAlignment: 4,
      init: function() {
        GL.miniTempBuffer = new Float32Array(GL.MINI_TEMP_BUFFER_SIZE);
        for (var i = 0; i < GL.MINI_TEMP_BUFFER_SIZE; i++) {
          GL.miniTempBufferViews[i] = GL.miniTempBuffer.subarray(0, i + 1);
        }
      },
      recordError: function recordError(errorCode) {
        if (!GL.lastError) {
          GL.lastError = errorCode;
        }
      },
      getNewId: function(table) {
        var ret = GL.counter++;
        for (var i = table.length; i < ret; i++) {
          table[i] = null;
        }
        return ret;
      },
      MINI_TEMP_BUFFER_SIZE: 256,
      miniTempBuffer: null,
      miniTempBufferViews: [0],
      getSource: function(shader, count, string, length) {
        var source = "";
        for (var i = 0; i < count; ++i) {
          var len = length ? HEAP32[(length + i * 4) >> 2] : -1;
          source += UTF8ToString(
            HEAP32[(string + i * 4) >> 2],
            len < 0 ? undefined : len
          );
        }
        return source;
      },
      createContext: function(canvas, webGLContextAttributes) {
        var ctx =
          webGLContextAttributes.majorVersion > 1
            ? canvas.getContext("webgl2", webGLContextAttributes)
            : canvas.getContext("webgl", webGLContextAttributes) ||
              canvas.getContext("experimental-webgl", webGLContextAttributes);
        if (!ctx) return 0;
        var handle = GL.registerContext(ctx, webGLContextAttributes);
        return handle;
      },
      registerContext: function(ctx, webGLContextAttributes) {
        var handle = _malloc(8);
        var context = {
          handle: handle,
          attributes: webGLContextAttributes,
          version: webGLContextAttributes.majorVersion,
          GLctx: ctx
        };
        function getChromeVersion() {
          var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
          return raw ? parseInt(raw[2], 10) : false;
        }
        context.supportsWebGL2EntryPoints =
          context.version >= 2 &&
          (getChromeVersion() === false || getChromeVersion() >= 58);
        if (ctx.canvas) ctx.canvas.GLctxObject = context;
        GL.contexts[handle] = context;
        if (
          typeof webGLContextAttributes.enableExtensionsByDefault ===
            "undefined" ||
          webGLContextAttributes.enableExtensionsByDefault
        ) {
          GL.initExtensions(context);
        }
        return handle;
      },
      makeContextCurrent: function(contextHandle) {
        GL.currentContext = GL.contexts[contextHandle];
        Module.ctx = GLctx = GL.currentContext && GL.currentContext.GLctx;
        return !(contextHandle && !GLctx);
      },
      getContext: function(contextHandle) {
        return GL.contexts[contextHandle];
      },
      deleteContext: function(contextHandle) {
        if (GL.currentContext === GL.contexts[contextHandle])
          GL.currentContext = null;
        if (typeof JSEvents === "object")
          JSEvents.removeAllHandlersOnTarget(
            GL.contexts[contextHandle].GLctx.canvas
          );
        if (
          GL.contexts[contextHandle] &&
          GL.contexts[contextHandle].GLctx.canvas
        )
          GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined;
        _free(GL.contexts[contextHandle]);
        GL.contexts[contextHandle] = null;
      },
      acquireInstancedArraysExtension: function(ctx) {
        var ext = ctx.getExtension("ANGLE_instanced_arrays");
        if (ext) {
          ctx["vertexAttribDivisor"] = function(index, divisor) {
            ext["vertexAttribDivisorANGLE"](index, divisor);
          };
          ctx["drawArraysInstanced"] = function(mode, first, count, primcount) {
            ext["drawArraysInstancedANGLE"](mode, first, count, primcount);
          };
          ctx["drawElementsInstanced"] = function(
            mode,
            count,
            type,
            indices,
            primcount
          ) {
            ext["drawElementsInstancedANGLE"](
              mode,
              count,
              type,
              indices,
              primcount
            );
          };
        }
      },
      acquireVertexArrayObjectExtension: function(ctx) {
        var ext = ctx.getExtension("OES_vertex_array_object");
        if (ext) {
          ctx["createVertexArray"] = function() {
            return ext["createVertexArrayOES"]();
          };
          ctx["deleteVertexArray"] = function(vao) {
            ext["deleteVertexArrayOES"](vao);
          };
          ctx["bindVertexArray"] = function(vao) {
            ext["bindVertexArrayOES"](vao);
          };
          ctx["isVertexArray"] = function(vao) {
            return ext["isVertexArrayOES"](vao);
          };
        }
      },
      acquireDrawBuffersExtension: function(ctx) {
        var ext = ctx.getExtension("WEBGL_draw_buffers");
        if (ext) {
          ctx["drawBuffers"] = function(n, bufs) {
            ext["drawBuffersWEBGL"](n, bufs);
          };
        }
      },
      initExtensions: function(context) {
        if (!context) context = GL.currentContext;
        if (context.initExtensionsDone) return;
        context.initExtensionsDone = true;
        var GLctx = context.GLctx;
        if (context.version < 2) {
          GL.acquireInstancedArraysExtension(GLctx);
          GL.acquireVertexArrayObjectExtension(GLctx);
          GL.acquireDrawBuffersExtension(GLctx);
        }
        GLctx.disjointTimerQueryExt = GLctx.getExtension(
          "EXT_disjoint_timer_query"
        );
        var automaticallyEnabledExtensions = [
          "OES_texture_float",
          "OES_texture_half_float",
          "OES_standard_derivatives",
          "OES_vertex_array_object",
          "WEBGL_compressed_texture_s3tc",
          "WEBGL_depth_texture",
          "OES_element_index_uint",
          "EXT_texture_filter_anisotropic",
          "EXT_frag_depth",
          "WEBGL_draw_buffers",
          "ANGLE_instanced_arrays",
          "OES_texture_float_linear",
          "OES_texture_half_float_linear",
          "EXT_blend_minmax",
          "EXT_shader_texture_lod",
          "WEBGL_compressed_texture_pvrtc",
          "EXT_color_buffer_half_float",
          "WEBGL_color_buffer_float",
          "EXT_sRGB",
          "WEBGL_compressed_texture_etc1",
          "EXT_disjoint_timer_query",
          "WEBGL_compressed_texture_etc",
          "WEBGL_compressed_texture_astc",
          "EXT_color_buffer_float",
          "WEBGL_compressed_texture_s3tc_srgb",
          "EXT_disjoint_timer_query_webgl2"
        ];
        var exts = GLctx.getSupportedExtensions() || [];
        exts.forEach(function(ext) {
          if (automaticallyEnabledExtensions.indexOf(ext) != -1) {
            GLctx.getExtension(ext);
          }
        });
      },
      populateUniformTable: function(program) {
        var p = GL.programs[program];
        var ptable = (GL.programInfos[program] = {
          uniforms: {},
          maxUniformLength: 0,
          maxAttributeLength: -1,
          maxUniformBlockNameLength: -1
        });
        var utable = ptable.uniforms;
        var numUniforms = GLctx.getProgramParameter(p, 35718);
        for (var i = 0; i < numUniforms; ++i) {
          var u = GLctx.getActiveUniform(p, i);
          var name = u.name;
          ptable.maxUniformLength = Math.max(
            ptable.maxUniformLength,
            name.length + 1
          );
          if (name.slice(-1) == "]") {
            name = name.slice(0, name.lastIndexOf("["));
          }
          var loc = GLctx.getUniformLocation(p, name);
          if (loc) {
            var id = GL.getNewId(GL.uniforms);
            utable[name] = [u.size, id];
            GL.uniforms[id] = loc;
            for (var j = 1; j < u.size; ++j) {
              var n = name + "[" + j + "]";
              loc = GLctx.getUniformLocation(p, n);
              id = GL.getNewId(GL.uniforms);
              GL.uniforms[id] = loc;
            }
          }
        }
      }
    };
    function _emscripten_glActiveTexture(x0) {
      GLctx["activeTexture"](x0);
    }
    function _emscripten_glAttachShader(program, shader) {
      GLctx.attachShader(GL.programs[program], GL.shaders[shader]);
    }
    function _emscripten_glBeginQuery(target, id) {
      GLctx["beginQuery"](target, GL.queries[id]);
    }
    function _emscripten_glBeginQueryEXT(target, id) {
      GLctx.disjointTimerQueryExt["beginQueryEXT"](
        target,
        GL.timerQueriesEXT[id]
      );
    }
    function _emscripten_glBeginTransformFeedback(x0) {
      GLctx["beginTransformFeedback"](x0);
    }
    function _emscripten_glBindAttribLocation(program, index, name) {
      GLctx.bindAttribLocation(GL.programs[program], index, UTF8ToString(name));
    }
    function _emscripten_glBindBuffer(target, buffer) {
      if (target == 35051) {
        GLctx.currentPixelPackBufferBinding = buffer;
      } else if (target == 35052) {
        GLctx.currentPixelUnpackBufferBinding = buffer;
      }
      GLctx.bindBuffer(target, GL.buffers[buffer]);
    }
    function _emscripten_glBindBufferBase(target, index, buffer) {
      GLctx["bindBufferBase"](target, index, GL.buffers[buffer]);
    }
    function _emscripten_glBindBufferRange(
      target,
      index,
      buffer,
      offset,
      ptrsize
    ) {
      GLctx["bindBufferRange"](
        target,
        index,
        GL.buffers[buffer],
        offset,
        ptrsize
      );
    }
    function _emscripten_glBindFramebuffer(target, framebuffer) {
      GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer]);
    }
    function _emscripten_glBindRenderbuffer(target, renderbuffer) {
      GLctx.bindRenderbuffer(target, GL.renderbuffers[renderbuffer]);
    }
    function _emscripten_glBindSampler(unit, sampler) {
      GLctx["bindSampler"](unit, GL.samplers[sampler]);
    }
    function _emscripten_glBindTexture(target, texture) {
      GLctx.bindTexture(target, GL.textures[texture]);
    }
    function _emscripten_glBindTransformFeedback(target, id) {
      GLctx["bindTransformFeedback"](target, GL.transformFeedbacks[id]);
    }
    function _emscripten_glBindVertexArray(vao) {
      GLctx["bindVertexArray"](GL.vaos[vao]);
    }
    function _emscripten_glBindVertexArrayOES(vao) {
      GLctx["bindVertexArray"](GL.vaos[vao]);
    }
    function _emscripten_glBlendColor(x0, x1, x2, x3) {
      GLctx["blendColor"](x0, x1, x2, x3);
    }
    function _emscripten_glBlendEquation(x0) {
      GLctx["blendEquation"](x0);
    }
    function _emscripten_glBlendEquationSeparate(x0, x1) {
      GLctx["blendEquationSeparate"](x0, x1);
    }
    function _emscripten_glBlendFunc(x0, x1) {
      GLctx["blendFunc"](x0, x1);
    }
    function _emscripten_glBlendFuncSeparate(x0, x1, x2, x3) {
      GLctx["blendFuncSeparate"](x0, x1, x2, x3);
    }
    function _emscripten_glBlitFramebuffer(
      x0,
      x1,
      x2,
      x3,
      x4,
      x5,
      x6,
      x7,
      x8,
      x9
    ) {
      GLctx["blitFramebuffer"](x0, x1, x2, x3, x4, x5, x6, x7, x8, x9);
    }
    function _emscripten_glBufferData(target, size, data, usage) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        if (data) {
          GLctx.bufferData(target, HEAPU8, usage, data, size);
        } else {
          GLctx.bufferData(target, size, usage);
        }
      } else {
        GLctx.bufferData(
          target,
          data ? HEAPU8.subarray(data, data + size) : size,
          usage
        );
      }
    }
    function _emscripten_glBufferSubData(target, offset, size, data) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.bufferSubData(target, offset, HEAPU8, data, size);
        return;
      }
      GLctx.bufferSubData(target, offset, HEAPU8.subarray(data, data + size));
    }
    function _emscripten_glCheckFramebufferStatus(x0) {
      return GLctx["checkFramebufferStatus"](x0);
    }
    function _emscripten_glClear(x0) {
      GLctx["clear"](x0);
    }
    function _emscripten_glClearBufferfi(x0, x1, x2, x3) {
      GLctx["clearBufferfi"](x0, x1, x2, x3);
    }
    function _emscripten_glClearBufferfv(buffer, drawbuffer, value) {
      GLctx["clearBufferfv"](buffer, drawbuffer, HEAPF32, value >> 2);
    }
    function _emscripten_glClearBufferiv(buffer, drawbuffer, value) {
      GLctx["clearBufferiv"](buffer, drawbuffer, HEAP32, value >> 2);
    }
    function _emscripten_glClearBufferuiv(buffer, drawbuffer, value) {
      GLctx["clearBufferuiv"](buffer, drawbuffer, HEAPU32, value >> 2);
    }
    function _emscripten_glClearColor(x0, x1, x2, x3) {
      GLctx["clearColor"](x0, x1, x2, x3);
    }
    function _emscripten_glClearDepthf(x0) {
      GLctx["clearDepth"](x0);
    }
    function _emscripten_glClearStencil(x0) {
      GLctx["clearStencil"](x0);
    }
    function _emscripten_glClientWaitSync(sync, flags, timeoutLo, timeoutHi) {
      timeoutLo = timeoutLo >>> 0;
      timeoutHi = timeoutHi >>> 0;
      var timeout =
        timeoutLo == 4294967295 && timeoutHi == 4294967295
          ? -1
          : makeBigInt(timeoutLo, timeoutHi, true);
      return GLctx.clientWaitSync(GL.syncs[sync], flags, timeout);
    }
    function _emscripten_glColorMask(red, green, blue, alpha) {
      GLctx.colorMask(!!red, !!green, !!blue, !!alpha);
    }
    function _emscripten_glCompileShader(shader) {
      GLctx.compileShader(GL.shaders[shader]);
    }
    function _emscripten_glCompressedTexImage2D(
      target,
      level,
      internalFormat,
      width,
      height,
      border,
      imageSize,
      data
    ) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        if (GLctx.currentPixelUnpackBufferBinding) {
          GLctx["compressedTexImage2D"](
            target,
            level,
            internalFormat,
            width,
            height,
            border,
            imageSize,
            data
          );
        } else {
          GLctx["compressedTexImage2D"](
            target,
            level,
            internalFormat,
            width,
            height,
            border,
            HEAPU8,
            data,
            imageSize
          );
        }
        return;
      }
      GLctx["compressedTexImage2D"](
        target,
        level,
        internalFormat,
        width,
        height,
        border,
        data ? HEAPU8.subarray(data, data + imageSize) : null
      );
    }
    function _emscripten_glCompressedTexImage3D(
      target,
      level,
      internalFormat,
      width,
      height,
      depth,
      border,
      imageSize,
      data
    ) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        if (GLctx.currentPixelUnpackBufferBinding) {
          GLctx["compressedTexImage3D"](
            target,
            level,
            internalFormat,
            width,
            height,
            depth,
            border,
            imageSize,
            data
          );
        } else {
          GLctx["compressedTexImage3D"](
            target,
            level,
            internalFormat,
            width,
            height,
            depth,
            border,
            HEAPU8,
            data,
            imageSize
          );
        }
      } else {
        GLctx["compressedTexImage3D"](
          target,
          level,
          internalFormat,
          width,
          height,
          depth,
          border,
          data ? HEAPU8.subarray(data, data + imageSize) : null
        );
      }
    }
    function _emscripten_glCompressedTexSubImage2D(
      target,
      level,
      xoffset,
      yoffset,
      width,
      height,
      format,
      imageSize,
      data
    ) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        if (GLctx.currentPixelUnpackBufferBinding) {
          GLctx["compressedTexSubImage2D"](
            target,
            level,
            xoffset,
            yoffset,
            width,
            height,
            format,
            imageSize,
            data
          );
        } else {
          GLctx["compressedTexSubImage2D"](
            target,
            level,
            xoffset,
            yoffset,
            width,
            height,
            format,
            HEAPU8,
            data,
            imageSize
          );
        }
        return;
      }
      GLctx["compressedTexSubImage2D"](
        target,
        level,
        xoffset,
        yoffset,
        width,
        height,
        format,
        data ? HEAPU8.subarray(data, data + imageSize) : null
      );
    }
    function _emscripten_glCompressedTexSubImage3D(
      target,
      level,
      xoffset,
      yoffset,
      zoffset,
      width,
      height,
      depth,
      format,
      imageSize,
      data
    ) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        if (GLctx.currentPixelUnpackBufferBinding) {
          GLctx["compressedTexSubImage3D"](
            target,
            level,
            xoffset,
            yoffset,
            zoffset,
            width,
            height,
            depth,
            format,
            imageSize,
            data
          );
        } else {
          GLctx["compressedTexSubImage3D"](
            target,
            level,
            xoffset,
            yoffset,
            zoffset,
            width,
            height,
            depth,
            format,
            HEAPU8,
            data,
            imageSize
          );
        }
      } else {
        GLctx["compressedTexSubImage3D"](
          target,
          level,
          xoffset,
          yoffset,
          zoffset,
          width,
          height,
          depth,
          format,
          data ? HEAPU8.subarray(data, data + imageSize) : null
        );
      }
    }
    function _emscripten_glCopyBufferSubData(x0, x1, x2, x3, x4) {
      GLctx["copyBufferSubData"](x0, x1, x2, x3, x4);
    }
    function _emscripten_glCopyTexImage2D(x0, x1, x2, x3, x4, x5, x6, x7) {
      GLctx["copyTexImage2D"](x0, x1, x2, x3, x4, x5, x6, x7);
    }
    function _emscripten_glCopyTexSubImage2D(x0, x1, x2, x3, x4, x5, x6, x7) {
      GLctx["copyTexSubImage2D"](x0, x1, x2, x3, x4, x5, x6, x7);
    }
    function _emscripten_glCopyTexSubImage3D(
      x0,
      x1,
      x2,
      x3,
      x4,
      x5,
      x6,
      x7,
      x8
    ) {
      GLctx["copyTexSubImage3D"](x0, x1, x2, x3, x4, x5, x6, x7, x8);
    }
    function _emscripten_glCreateProgram() {
      var id = GL.getNewId(GL.programs);
      var program = GLctx.createProgram();
      program.name = id;
      GL.programs[id] = program;
      return id;
    }
    function _emscripten_glCreateShader(shaderType) {
      var id = GL.getNewId(GL.shaders);
      GL.shaders[id] = GLctx.createShader(shaderType);
      return id;
    }
    function _emscripten_glCullFace(x0) {
      GLctx["cullFace"](x0);
    }
    function _emscripten_glDeleteBuffers(n, buffers) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(buffers + i * 4) >> 2];
        var buffer = GL.buffers[id];
        if (!buffer) continue;
        GLctx.deleteBuffer(buffer);
        buffer.name = 0;
        GL.buffers[id] = null;
        if (id == GL.currArrayBuffer) GL.currArrayBuffer = 0;
        if (id == GL.currElementArrayBuffer) GL.currElementArrayBuffer = 0;
        if (id == GLctx.currentPixelPackBufferBinding)
          GLctx.currentPixelPackBufferBinding = 0;
        if (id == GLctx.currentPixelUnpackBufferBinding)
          GLctx.currentPixelUnpackBufferBinding = 0;
      }
    }
    function _emscripten_glDeleteFramebuffers(n, framebuffers) {
      for (var i = 0; i < n; ++i) {
        var id = HEAP32[(framebuffers + i * 4) >> 2];
        var framebuffer = GL.framebuffers[id];
        if (!framebuffer) continue;
        GLctx.deleteFramebuffer(framebuffer);
        framebuffer.name = 0;
        GL.framebuffers[id] = null;
      }
    }
    function _emscripten_glDeleteProgram(id) {
      if (!id) return;
      var program = GL.programs[id];
      if (!program) {
        GL.recordError(1281);
        return;
      }
      GLctx.deleteProgram(program);
      program.name = 0;
      GL.programs[id] = null;
      GL.programInfos[id] = null;
    }
    function _emscripten_glDeleteQueries(n, ids) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(ids + i * 4) >> 2];
        var query = GL.queries[id];
        if (!query) continue;
        GLctx["deleteQuery"](query);
        GL.queries[id] = null;
      }
    }
    function _emscripten_glDeleteQueriesEXT(n, ids) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(ids + i * 4) >> 2];
        var query = GL.timerQueriesEXT[id];
        if (!query) continue;
        GLctx.disjointTimerQueryExt["deleteQueryEXT"](query);
        GL.timerQueriesEXT[id] = null;
      }
    }
    function _emscripten_glDeleteRenderbuffers(n, renderbuffers) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(renderbuffers + i * 4) >> 2];
        var renderbuffer = GL.renderbuffers[id];
        if (!renderbuffer) continue;
        GLctx.deleteRenderbuffer(renderbuffer);
        renderbuffer.name = 0;
        GL.renderbuffers[id] = null;
      }
    }
    function _emscripten_glDeleteSamplers(n, samplers) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(samplers + i * 4) >> 2];
        var sampler = GL.samplers[id];
        if (!sampler) continue;
        GLctx["deleteSampler"](sampler);
        sampler.name = 0;
        GL.samplers[id] = null;
      }
    }
    function _emscripten_glDeleteShader(id) {
      if (!id) return;
      var shader = GL.shaders[id];
      if (!shader) {
        GL.recordError(1281);
        return;
      }
      GLctx.deleteShader(shader);
      GL.shaders[id] = null;
    }
    function _emscripten_glDeleteSync(id) {
      if (!id) return;
      var sync = GL.syncs[id];
      if (!sync) {
        GL.recordError(1281);
        return;
      }
      GLctx.deleteSync(sync);
      sync.name = 0;
      GL.syncs[id] = null;
    }
    function _emscripten_glDeleteTextures(n, textures) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(textures + i * 4) >> 2];
        var texture = GL.textures[id];
        if (!texture) continue;
        GLctx.deleteTexture(texture);
        texture.name = 0;
        GL.textures[id] = null;
      }
    }
    function _emscripten_glDeleteTransformFeedbacks(n, ids) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(ids + i * 4) >> 2];
        var transformFeedback = GL.transformFeedbacks[id];
        if (!transformFeedback) continue;
        GLctx["deleteTransformFeedback"](transformFeedback);
        transformFeedback.name = 0;
        GL.transformFeedbacks[id] = null;
      }
    }
    function _emscripten_glDeleteVertexArrays(n, vaos) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(vaos + i * 4) >> 2];
        GLctx["deleteVertexArray"](GL.vaos[id]);
        GL.vaos[id] = null;
      }
    }
    function _emscripten_glDeleteVertexArraysOES(n, vaos) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(vaos + i * 4) >> 2];
        GLctx["deleteVertexArray"](GL.vaos[id]);
        GL.vaos[id] = null;
      }
    }
    function _emscripten_glDepthFunc(x0) {
      GLctx["depthFunc"](x0);
    }
    function _emscripten_glDepthMask(flag) {
      GLctx.depthMask(!!flag);
    }
    function _emscripten_glDepthRangef(x0, x1) {
      GLctx["depthRange"](x0, x1);
    }
    function _emscripten_glDetachShader(program, shader) {
      GLctx.detachShader(GL.programs[program], GL.shaders[shader]);
    }
    function _emscripten_glDisable(x0) {
      GLctx["disable"](x0);
    }
    function _emscripten_glDisableVertexAttribArray(index) {
      GLctx.disableVertexAttribArray(index);
    }
    function _emscripten_glDrawArrays(mode, first, count) {
      GLctx.drawArrays(mode, first, count);
    }
    function _emscripten_glDrawArraysInstanced(mode, first, count, primcount) {
      GLctx["drawArraysInstanced"](mode, first, count, primcount);
    }
    function _emscripten_glDrawArraysInstancedANGLE(
      mode,
      first,
      count,
      primcount
    ) {
      GLctx["drawArraysInstanced"](mode, first, count, primcount);
    }
    function _emscripten_glDrawArraysInstancedARB(
      mode,
      first,
      count,
      primcount
    ) {
      GLctx["drawArraysInstanced"](mode, first, count, primcount);
    }
    function _emscripten_glDrawArraysInstancedEXT(
      mode,
      first,
      count,
      primcount
    ) {
      GLctx["drawArraysInstanced"](mode, first, count, primcount);
    }
    function _emscripten_glDrawArraysInstancedNV(
      mode,
      first,
      count,
      primcount
    ) {
      GLctx["drawArraysInstanced"](mode, first, count, primcount);
    }
    var __tempFixedLengthArray = [];
    function _emscripten_glDrawBuffers(n, bufs) {
      var bufArray = __tempFixedLengthArray[n];
      for (var i = 0; i < n; i++) {
        bufArray[i] = HEAP32[(bufs + i * 4) >> 2];
      }
      GLctx["drawBuffers"](bufArray);
    }
    function _emscripten_glDrawBuffersEXT(n, bufs) {
      var bufArray = __tempFixedLengthArray[n];
      for (var i = 0; i < n; i++) {
        bufArray[i] = HEAP32[(bufs + i * 4) >> 2];
      }
      GLctx["drawBuffers"](bufArray);
    }
    function _emscripten_glDrawBuffersWEBGL(n, bufs) {
      var bufArray = __tempFixedLengthArray[n];
      for (var i = 0; i < n; i++) {
        bufArray[i] = HEAP32[(bufs + i * 4) >> 2];
      }
      GLctx["drawBuffers"](bufArray);
    }
    function _emscripten_glDrawElements(mode, count, type, indices) {
      GLctx.drawElements(mode, count, type, indices);
    }
    function _emscripten_glDrawElementsInstanced(
      mode,
      count,
      type,
      indices,
      primcount
    ) {
      GLctx["drawElementsInstanced"](mode, count, type, indices, primcount);
    }
    function _emscripten_glDrawElementsInstancedANGLE(
      mode,
      count,
      type,
      indices,
      primcount
    ) {
      GLctx["drawElementsInstanced"](mode, count, type, indices, primcount);
    }
    function _emscripten_glDrawElementsInstancedARB(
      mode,
      count,
      type,
      indices,
      primcount
    ) {
      GLctx["drawElementsInstanced"](mode, count, type, indices, primcount);
    }
    function _emscripten_glDrawElementsInstancedEXT(
      mode,
      count,
      type,
      indices,
      primcount
    ) {
      GLctx["drawElementsInstanced"](mode, count, type, indices, primcount);
    }
    function _emscripten_glDrawElementsInstancedNV(
      mode,
      count,
      type,
      indices,
      primcount
    ) {
      GLctx["drawElementsInstanced"](mode, count, type, indices, primcount);
    }
    function _glDrawElements(mode, count, type, indices) {
      GLctx.drawElements(mode, count, type, indices);
    }
    function _emscripten_glDrawRangeElements(
      mode,
      start,
      end,
      count,
      type,
      indices
    ) {
      _glDrawElements(mode, count, type, indices);
    }
    function _emscripten_glEnable(x0) {
      GLctx["enable"](x0);
    }
    function _emscripten_glEnableVertexAttribArray(index) {
      GLctx.enableVertexAttribArray(index);
    }
    function _emscripten_glEndQuery(x0) {
      GLctx["endQuery"](x0);
    }
    function _emscripten_glEndQueryEXT(target) {
      GLctx.disjointTimerQueryExt["endQueryEXT"](target);
    }
    function _emscripten_glEndTransformFeedback() {
      GLctx["endTransformFeedback"]();
    }
    function _emscripten_glFenceSync(condition, flags) {
      var sync = GLctx.fenceSync(condition, flags);
      if (sync) {
        var id = GL.getNewId(GL.syncs);
        sync.name = id;
        GL.syncs[id] = sync;
        return id;
      } else {
        return 0;
      }
    }
    function _emscripten_glFinish() {
      GLctx["finish"]();
    }
    function _emscripten_glFlush() {
      GLctx["flush"]();
    }
    function _emscripten_glFlushMappedBufferRange() {
      err("missing function: emscripten_glFlushMappedBufferRange");
      abort(-1);
    }
    function _emscripten_glFramebufferRenderbuffer(
      target,
      attachment,
      renderbuffertarget,
      renderbuffer
    ) {
      GLctx.framebufferRenderbuffer(
        target,
        attachment,
        renderbuffertarget,
        GL.renderbuffers[renderbuffer]
      );
    }
    function _emscripten_glFramebufferTexture2D(
      target,
      attachment,
      textarget,
      texture,
      level
    ) {
      GLctx.framebufferTexture2D(
        target,
        attachment,
        textarget,
        GL.textures[texture],
        level
      );
    }
    function _emscripten_glFramebufferTextureLayer(
      target,
      attachment,
      texture,
      level,
      layer
    ) {
      GLctx.framebufferTextureLayer(
        target,
        attachment,
        GL.textures[texture],
        level,
        layer
      );
    }
    function _emscripten_glFrontFace(x0) {
      GLctx["frontFace"](x0);
    }
    function __glGenObject(n, buffers, createFunction, objectTable) {
      for (var i = 0; i < n; i++) {
        var buffer = GLctx[createFunction]();
        var id = buffer && GL.getNewId(objectTable);
        if (buffer) {
          buffer.name = id;
          objectTable[id] = buffer;
        } else {
          GL.recordError(1282);
        }
        HEAP32[(buffers + i * 4) >> 2] = id;
      }
    }
    function _emscripten_glGenBuffers(n, buffers) {
      __glGenObject(n, buffers, "createBuffer", GL.buffers);
    }
    function _emscripten_glGenFramebuffers(n, ids) {
      __glGenObject(n, ids, "createFramebuffer", GL.framebuffers);
    }
    function _emscripten_glGenQueries(n, ids) {
      __glGenObject(n, ids, "createQuery", GL.queries);
    }
    function _emscripten_glGenQueriesEXT(n, ids) {
      for (var i = 0; i < n; i++) {
        var query = GLctx.disjointTimerQueryExt["createQueryEXT"]();
        if (!query) {
          GL.recordError(1282);
          while (i < n) HEAP32[(ids + i++ * 4) >> 2] = 0;
          return;
        }
        var id = GL.getNewId(GL.timerQueriesEXT);
        query.name = id;
        GL.timerQueriesEXT[id] = query;
        HEAP32[(ids + i * 4) >> 2] = id;
      }
    }
    function _emscripten_glGenRenderbuffers(n, renderbuffers) {
      __glGenObject(n, renderbuffers, "createRenderbuffer", GL.renderbuffers);
    }
    function _emscripten_glGenSamplers(n, samplers) {
      __glGenObject(n, samplers, "createSampler", GL.samplers);
    }
    function _emscripten_glGenTextures(n, textures) {
      __glGenObject(n, textures, "createTexture", GL.textures);
    }
    function _emscripten_glGenTransformFeedbacks(n, ids) {
      __glGenObject(n, ids, "createTransformFeedback", GL.transformFeedbacks);
    }
    function _emscripten_glGenVertexArrays(n, arrays) {
      __glGenObject(n, arrays, "createVertexArray", GL.vaos);
    }
    function _emscripten_glGenVertexArraysOES(n, arrays) {
      __glGenObject(n, arrays, "createVertexArray", GL.vaos);
    }
    function _emscripten_glGenerateMipmap(x0) {
      GLctx["generateMipmap"](x0);
    }
    function _emscripten_glGetActiveAttrib(
      program,
      index,
      bufSize,
      length,
      size,
      type,
      name
    ) {
      program = GL.programs[program];
      var info = GLctx.getActiveAttrib(program, index);
      if (!info) return;
      var numBytesWrittenExclNull =
        bufSize > 0 && name ? stringToUTF8(info.name, name, bufSize) : 0;
      if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
      if (size) HEAP32[size >> 2] = info.size;
      if (type) HEAP32[type >> 2] = info.type;
    }
    function _emscripten_glGetActiveUniform(
      program,
      index,
      bufSize,
      length,
      size,
      type,
      name
    ) {
      program = GL.programs[program];
      var info = GLctx.getActiveUniform(program, index);
      if (!info) return;
      var numBytesWrittenExclNull =
        bufSize > 0 && name ? stringToUTF8(info.name, name, bufSize) : 0;
      if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
      if (size) HEAP32[size >> 2] = info.size;
      if (type) HEAP32[type >> 2] = info.type;
    }
    function _emscripten_glGetActiveUniformBlockName(
      program,
      uniformBlockIndex,
      bufSize,
      length,
      uniformBlockName
    ) {
      program = GL.programs[program];
      var result = GLctx["getActiveUniformBlockName"](
        program,
        uniformBlockIndex
      );
      if (!result) return;
      if (uniformBlockName && bufSize > 0) {
        var numBytesWrittenExclNull = stringToUTF8(
          result,
          uniformBlockName,
          bufSize
        );
        if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
      } else {
        if (length) HEAP32[length >> 2] = 0;
      }
    }
    function _emscripten_glGetActiveUniformBlockiv(
      program,
      uniformBlockIndex,
      pname,
      params
    ) {
      if (!params) {
        GL.recordError(1281);
        return;
      }
      program = GL.programs[program];
      switch (pname) {
        case 35393:
          var name = GLctx["getActiveUniformBlockName"](
            program,
            uniformBlockIndex
          );
          HEAP32[params >> 2] = name.length + 1;
          return;
        default:
          var result = GLctx["getActiveUniformBlockParameter"](
            program,
            uniformBlockIndex,
            pname
          );
          if (!result) return;
          if (typeof result == "number") {
            HEAP32[params >> 2] = result;
          } else {
            for (var i = 0; i < result.length; i++) {
              HEAP32[(params + i * 4) >> 2] = result[i];
            }
          }
      }
    }
    function _emscripten_glGetActiveUniformsiv(
      program,
      uniformCount,
      uniformIndices,
      pname,
      params
    ) {
      if (!params) {
        GL.recordError(1281);
        return;
      }
      if (uniformCount > 0 && uniformIndices == 0) {
        GL.recordError(1281);
        return;
      }
      program = GL.programs[program];
      var ids = [];
      for (var i = 0; i < uniformCount; i++) {
        ids.push(HEAP32[(uniformIndices + i * 4) >> 2]);
      }
      var result = GLctx["getActiveUniforms"](program, ids, pname);
      if (!result) return;
      var len = result.length;
      for (var i = 0; i < len; i++) {
        HEAP32[(params + i * 4) >> 2] = result[i];
      }
    }
    function _emscripten_glGetAttachedShaders(
      program,
      maxCount,
      count,
      shaders
    ) {
      var result = GLctx.getAttachedShaders(GL.programs[program]);
      var len = result.length;
      if (len > maxCount) {
        len = maxCount;
      }
      HEAP32[count >> 2] = len;
      for (var i = 0; i < len; ++i) {
        var id = GL.shaders.indexOf(result[i]);
        HEAP32[(shaders + i * 4) >> 2] = id;
      }
    }
    function _emscripten_glGetAttribLocation(program, name) {
      return GLctx.getAttribLocation(GL.programs[program], UTF8ToString(name));
    }
    function emscriptenWebGLGet(name_, p, type) {
      if (!p) {
        GL.recordError(1281);
        return;
      }
      var ret = undefined;
      switch (name_) {
        case 36346:
          ret = 1;
          break;
        case 36344:
          if (type != 0 && type != 1) {
            GL.recordError(1280);
          }
          return;
        case 34814:
        case 36345:
          ret = 0;
          break;
        case 34466:
          var formats = GLctx.getParameter(34467);
          ret = formats ? formats.length : 0;
          break;
        case 33309:
          if (GL.currentContext.version < 2) {
            GL.recordError(1282);
            return;
          }
          var exts = GLctx.getSupportedExtensions() || [];
          ret = 2 * exts.length;
          break;
        case 33307:
        case 33308:
          if (GL.currentContext.version < 2) {
            GL.recordError(1280);
            return;
          }
          ret = name_ == 33307 ? 3 : 0;
          break;
      }
      if (ret === undefined) {
        var result = GLctx.getParameter(name_);
        switch (typeof result) {
          case "number":
            ret = result;
            break;
          case "boolean":
            ret = result ? 1 : 0;
            break;
          case "string":
            GL.recordError(1280);
            return;
          case "object":
            if (result === null) {
              switch (name_) {
                case 34964:
                case 35725:
                case 34965:
                case 36006:
                case 36007:
                case 32873:
                case 34229:
                case 35097:
                case 36389:
                case 34068: {
                  ret = 0;
                  break;
                }
                default: {
                  GL.recordError(1280);
                  return;
                }
              }
            } else if (
              result instanceof Float32Array ||
              result instanceof Uint32Array ||
              result instanceof Int32Array ||
              result instanceof Array
            ) {
              for (var i = 0; i < result.length; ++i) {
                switch (type) {
                  case 0:
                    HEAP32[(p + i * 4) >> 2] = result[i];
                    break;
                  case 2:
                    HEAPF32[(p + i * 4) >> 2] = result[i];
                    break;
                  case 4:
                    HEAP8[(p + i) >> 0] = result[i] ? 1 : 0;
                    break;
                }
              }
              return;
            } else {
              try {
                ret = result.name | 0;
              } catch (e) {
                GL.recordError(1280);
                err(
                  "GL_INVALID_ENUM in glGet" +
                    type +
                    "v: Unknown object returned from WebGL getParameter(" +
                    name_ +
                    ")! (error: " +
                    e +
                    ")"
                );
                return;
              }
            }
            break;
          default:
            GL.recordError(1280);
            err(
              "GL_INVALID_ENUM in glGet" +
                type +
                "v: Native code calling glGet" +
                type +
                "v(" +
                name_ +
                ") and it returns " +
                result +
                " of type " +
                typeof result +
                "!"
            );
            return;
        }
      }
      switch (type) {
        case 1:
          (tempI64 = [
            ret >>> 0,
            ((tempDouble = ret),
            +Math_abs(tempDouble) >= 1
              ? tempDouble > 0
                ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) |
                    0) >>>
                  0
                : ~~+Math_ceil(
                    (tempDouble - +(~~tempDouble >>> 0)) / 4294967296
                  ) >>> 0
              : 0)
          ]),
            (HEAP32[p >> 2] = tempI64[0]),
            (HEAP32[(p + 4) >> 2] = tempI64[1]);
          break;
        case 0:
          HEAP32[p >> 2] = ret;
          break;
        case 2:
          HEAPF32[p >> 2] = ret;
          break;
        case 4:
          HEAP8[p >> 0] = ret ? 1 : 0;
          break;
      }
    }
    function _emscripten_glGetBooleanv(name_, p) {
      emscriptenWebGLGet(name_, p, 4);
    }
    function _emscripten_glGetBufferParameteri64v(target, value, data) {
      if (!data) {
        GL.recordError(1281);
        return;
      }
      (tempI64 = [
        GLctx.getBufferParameter(target, value) >>> 0,
        ((tempDouble = GLctx.getBufferParameter(target, value)),
        +Math_abs(tempDouble) >= 1
          ? tempDouble > 0
            ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) |
                0) >>>
              0
            : ~~+Math_ceil(
                (tempDouble - +(~~tempDouble >>> 0)) / 4294967296
              ) >>> 0
          : 0)
      ]),
        (HEAP32[data >> 2] = tempI64[0]),
        (HEAP32[(data + 4) >> 2] = tempI64[1]);
    }
    function _emscripten_glGetBufferParameteriv(target, value, data) {
      if (!data) {
        GL.recordError(1281);
        return;
      }
      HEAP32[data >> 2] = GLctx.getBufferParameter(target, value);
    }
    function _emscripten_glGetBufferPointerv() {
      err("missing function: emscripten_glGetBufferPointerv");
      abort(-1);
    }
    function _emscripten_glGetError() {
      var error = GLctx.getError() || GL.lastError;
      GL.lastError = 0;
      return error;
    }
    function _emscripten_glGetFloatv(name_, p) {
      emscriptenWebGLGet(name_, p, 2);
    }
    function _emscripten_glGetFragDataLocation(program, name) {
      return GLctx["getFragDataLocation"](
        GL.programs[program],
        UTF8ToString(name)
      );
    }
    function _emscripten_glGetFramebufferAttachmentParameteriv(
      target,
      attachment,
      pname,
      params
    ) {
      var result = GLctx.getFramebufferAttachmentParameter(
        target,
        attachment,
        pname
      );
      if (
        result instanceof WebGLRenderbuffer ||
        result instanceof WebGLTexture
      ) {
        result = result.name | 0;
      }
      HEAP32[params >> 2] = result;
    }
    function emscriptenWebGLGetIndexed(target, index, data, type) {
      if (!data) {
        GL.recordError(1281);
        return;
      }
      var result = GLctx["getIndexedParameter"](target, index);
      var ret;
      switch (typeof result) {
        case "boolean":
          ret = result ? 1 : 0;
          break;
        case "number":
          ret = result;
          break;
        case "object":
          if (result === null) {
            switch (target) {
              case 35983:
              case 35368:
                ret = 0;
                break;
              default: {
                GL.recordError(1280);
                return;
              }
            }
          } else if (result instanceof WebGLBuffer) {
            ret = result.name | 0;
          } else {
            GL.recordError(1280);
            return;
          }
          break;
        default:
          GL.recordError(1280);
          return;
      }
      switch (type) {
        case 1:
          (tempI64 = [
            ret >>> 0,
            ((tempDouble = ret),
            +Math_abs(tempDouble) >= 1
              ? tempDouble > 0
                ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) |
                    0) >>>
                  0
                : ~~+Math_ceil(
                    (tempDouble - +(~~tempDouble >>> 0)) / 4294967296
                  ) >>> 0
              : 0)
          ]),
            (HEAP32[data >> 2] = tempI64[0]),
            (HEAP32[(data + 4) >> 2] = tempI64[1]);
          break;
        case 0:
          HEAP32[data >> 2] = ret;
          break;
        case 2:
          HEAPF32[data >> 2] = ret;
          break;
        case 4:
          HEAP8[data >> 0] = ret ? 1 : 0;
          break;
        default:
          throw "internal emscriptenWebGLGetIndexed() error, bad type: " + type;
      }
    }
    function _emscripten_glGetInteger64i_v(target, index, data) {
      emscriptenWebGLGetIndexed(target, index, data, 1);
    }
    function _emscripten_glGetInteger64v(name_, p) {
      emscriptenWebGLGet(name_, p, 1);
    }
    function _emscripten_glGetIntegeri_v(target, index, data) {
      emscriptenWebGLGetIndexed(target, index, data, 0);
    }
    function _emscripten_glGetIntegerv(name_, p) {
      emscriptenWebGLGet(name_, p, 0);
    }
    function _emscripten_glGetInternalformativ(
      target,
      internalformat,
      pname,
      bufSize,
      params
    ) {
      if (bufSize < 0) {
        GL.recordError(1281);
        return;
      }
      if (!params) {
        GL.recordError(1281);
        return;
      }
      var ret = GLctx["getInternalformatParameter"](
        target,
        internalformat,
        pname
      );
      if (ret === null) return;
      for (var i = 0; i < ret.length && i < bufSize; ++i) {
        HEAP32[(params + i) >> 2] = ret[i];
      }
    }
    function _emscripten_glGetProgramBinary(
      program,
      bufSize,
      length,
      binaryFormat,
      binary
    ) {
      GL.recordError(1282);
    }
    function _emscripten_glGetProgramInfoLog(
      program,
      maxLength,
      length,
      infoLog
    ) {
      var log = GLctx.getProgramInfoLog(GL.programs[program]);
      if (log === null) log = "(unknown error)";
      var numBytesWrittenExclNull =
        maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
      if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
    }
    function _emscripten_glGetProgramiv(program, pname, p) {
      if (!p) {
        GL.recordError(1281);
        return;
      }
      if (program >= GL.counter) {
        GL.recordError(1281);
        return;
      }
      var ptable = GL.programInfos[program];
      if (!ptable) {
        GL.recordError(1282);
        return;
      }
      if (pname == 35716) {
        var log = GLctx.getProgramInfoLog(GL.programs[program]);
        if (log === null) log = "(unknown error)";
        HEAP32[p >> 2] = log.length + 1;
      } else if (pname == 35719) {
        HEAP32[p >> 2] = ptable.maxUniformLength;
      } else if (pname == 35722) {
        if (ptable.maxAttributeLength == -1) {
          program = GL.programs[program];
          var numAttribs = GLctx.getProgramParameter(program, 35721);
          ptable.maxAttributeLength = 0;
          for (var i = 0; i < numAttribs; ++i) {
            var activeAttrib = GLctx.getActiveAttrib(program, i);
            ptable.maxAttributeLength = Math.max(
              ptable.maxAttributeLength,
              activeAttrib.name.length + 1
            );
          }
        }
        HEAP32[p >> 2] = ptable.maxAttributeLength;
      } else if (pname == 35381) {
        if (ptable.maxUniformBlockNameLength == -1) {
          program = GL.programs[program];
          var numBlocks = GLctx.getProgramParameter(program, 35382);
          ptable.maxUniformBlockNameLength = 0;
          for (var i = 0; i < numBlocks; ++i) {
            var activeBlockName = GLctx.getActiveUniformBlockName(program, i);
            ptable.maxUniformBlockNameLength = Math.max(
              ptable.maxUniformBlockNameLength,
              activeBlockName.length + 1
            );
          }
        }
        HEAP32[p >> 2] = ptable.maxUniformBlockNameLength;
      } else {
        HEAP32[p >> 2] = GLctx.getProgramParameter(GL.programs[program], pname);
      }
    }
    function _emscripten_glGetQueryObjecti64vEXT(id, pname, params) {
      if (!params) {
        GL.recordError(1281);
        return;
      }
      var query = GL.timerQueriesEXT[id];
      var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](
        query,
        pname
      );
      var ret;
      if (typeof param == "boolean") {
        ret = param ? 1 : 0;
      } else {
        ret = param;
      }
      (tempI64 = [
        ret >>> 0,
        ((tempDouble = ret),
        +Math_abs(tempDouble) >= 1
          ? tempDouble > 0
            ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) |
                0) >>>
              0
            : ~~+Math_ceil(
                (tempDouble - +(~~tempDouble >>> 0)) / 4294967296
              ) >>> 0
          : 0)
      ]),
        (HEAP32[params >> 2] = tempI64[0]),
        (HEAP32[(params + 4) >> 2] = tempI64[1]);
    }
    function _emscripten_glGetQueryObjectivEXT(id, pname, params) {
      if (!params) {
        GL.recordError(1281);
        return;
      }
      var query = GL.timerQueriesEXT[id];
      var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](
        query,
        pname
      );
      var ret;
      if (typeof param == "boolean") {
        ret = param ? 1 : 0;
      } else {
        ret = param;
      }
      HEAP32[params >> 2] = ret;
    }
    function _emscripten_glGetQueryObjectui64vEXT(id, pname, params) {
      if (!params) {
        GL.recordError(1281);
        return;
      }
      var query = GL.timerQueriesEXT[id];
      var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](
        query,
        pname
      );
      var ret;
      if (typeof param == "boolean") {
        ret = param ? 1 : 0;
      } else {
        ret = param;
      }
      (tempI64 = [
        ret >>> 0,
        ((tempDouble = ret),
        +Math_abs(tempDouble) >= 1
          ? tempDouble > 0
            ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) |
                0) >>>
              0
            : ~~+Math_ceil(
                (tempDouble - +(~~tempDouble >>> 0)) / 4294967296
              ) >>> 0
          : 0)
      ]),
        (HEAP32[params >> 2] = tempI64[0]),
        (HEAP32[(params + 4) >> 2] = tempI64[1]);
    }
    function _emscripten_glGetQueryObjectuiv(id, pname, params) {
      if (!params) {
        GL.recordError(1281);
        return;
      }
      var query = GL.queries[id];
      var param = GLctx["getQueryParameter"](query, pname);
      var ret;
      if (typeof param == "boolean") {
        ret = param ? 1 : 0;
      } else {
        ret = param;
      }
      HEAP32[params >> 2] = ret;
    }
    function _emscripten_glGetQueryObjectuivEXT(id, pname, params) {
      if (!params) {
        GL.recordError(1281);
        return;
      }
      var query = GL.timerQueriesEXT[id];
      var param = GLctx.disjointTimerQueryExt["getQueryObjectEXT"](
        query,
        pname
      );
      var ret;
      if (typeof param == "boolean") {
        ret = param ? 1 : 0;
      } else {
        ret = param;
      }
      HEAP32[params >> 2] = ret;
    }
    function _emscripten_glGetQueryiv(target, pname, params) {
      if (!params) {
        GL.recordError(1281);
        return;
      }
      HEAP32[params >> 2] = GLctx["getQuery"](target, pname);
    }
    function _emscripten_glGetQueryivEXT(target, pname, params) {
      if (!params) {
        GL.recordError(1281);
        return;
      }
      HEAP32[params >> 2] = GLctx.disjointTimerQueryExt["getQueryEXT"](
        target,
        pname
      );
    }
    function _emscripten_glGetRenderbufferParameteriv(target, pname, params) {
      if (!params) {
        GL.recordError(1281);
        return;
      }
      HEAP32[params >> 2] = GLctx.getRenderbufferParameter(target, pname);
    }
    function _emscripten_glGetSamplerParameterfv(sampler, pname, params) {
      if (!params) {
        GL.recordError(1281);
        return;
      }
      sampler = GL.samplers[sampler];
      HEAPF32[params >> 2] = GLctx["getSamplerParameter"](sampler, pname);
    }
    function _emscripten_glGetSamplerParameteriv(sampler, pname, params) {
      if (!params) {
        GL.recordError(1281);
        return;
      }
      sampler = GL.samplers[sampler];
      HEAP32[params >> 2] = GLctx["getSamplerParameter"](sampler, pname);
    }
    function _emscripten_glGetShaderInfoLog(
      shader,
      maxLength,
      length,
      infoLog
    ) {
      var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
      if (log === null) log = "(unknown error)";
      var numBytesWrittenExclNull =
        maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
      if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
    }
    function _emscripten_glGetShaderPrecisionFormat(
      shaderType,
      precisionType,
      range,
      precision
    ) {
      var result = GLctx.getShaderPrecisionFormat(shaderType, precisionType);
      HEAP32[range >> 2] = result.rangeMin;
      HEAP32[(range + 4) >> 2] = result.rangeMax;
      HEAP32[precision >> 2] = result.precision;
    }
    function _emscripten_glGetShaderSource(shader, bufSize, length, source) {
      var result = GLctx.getShaderSource(GL.shaders[shader]);
      if (!result) return;
      var numBytesWrittenExclNull =
        bufSize > 0 && source ? stringToUTF8(result, source, bufSize) : 0;
      if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
    }
    function _emscripten_glGetShaderiv(shader, pname, p) {
      if (!p) {
        GL.recordError(1281);
        return;
      }
      if (pname == 35716) {
        var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
        if (log === null) log = "(unknown error)";
        HEAP32[p >> 2] = log.length + 1;
      } else if (pname == 35720) {
        var source = GLctx.getShaderSource(GL.shaders[shader]);
        var sourceLength =
          source === null || source.length == 0 ? 0 : source.length + 1;
        HEAP32[p >> 2] = sourceLength;
      } else {
        HEAP32[p >> 2] = GLctx.getShaderParameter(GL.shaders[shader], pname);
      }
    }
    function stringToNewUTF8(jsString) {
      var length = lengthBytesUTF8(jsString) + 1;
      var cString = _malloc(length);
      stringToUTF8(jsString, cString, length);
      return cString;
    }
    function _emscripten_glGetString(name_) {
      if (GL.stringCache[name_]) return GL.stringCache[name_];
      var ret;
      switch (name_) {
        case 7939:
          var exts = GLctx.getSupportedExtensions() || [];
          exts = exts.concat(
            exts.map(function(e) {
              return "GL_" + e;
            })
          );
          ret = stringToNewUTF8(exts.join(" "));
          break;
        case 7936:
        case 7937:
        case 37445:
        case 37446:
          var s = GLctx.getParameter(name_);
          if (!s) {
            GL.recordError(1280);
          }
          ret = stringToNewUTF8(s);
          break;
        case 7938:
          var glVersion = GLctx.getParameter(GLctx.VERSION);
          if (GL.currentContext.version >= 2)
            glVersion = "OpenGL ES 3.0 (" + glVersion + ")";
          else {
            glVersion = "OpenGL ES 2.0 (" + glVersion + ")";
          }
          ret = stringToNewUTF8(glVersion);
          break;
        case 35724:
          var glslVersion = GLctx.getParameter(GLctx.SHADING_LANGUAGE_VERSION);
          var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
          var ver_num = glslVersion.match(ver_re);
          if (ver_num !== null) {
            if (ver_num[1].length == 3) ver_num[1] = ver_num[1] + "0";
            glslVersion =
              "OpenGL ES GLSL ES " + ver_num[1] + " (" + glslVersion + ")";
          }
          ret = stringToNewUTF8(glslVersion);
          break;
        default:
          GL.recordError(1280);
          return 0;
      }
      GL.stringCache[name_] = ret;
      return ret;
    }
    function _emscripten_glGetStringi(name, index) {
      if (GL.currentContext.version < 2) {
        GL.recordError(1282);
        return 0;
      }
      var stringiCache = GL.stringiCache[name];
      if (stringiCache) {
        if (index < 0 || index >= stringiCache.length) {
          GL.recordError(1281);
          return 0;
        }
        return stringiCache[index];
      }
      switch (name) {
        case 7939:
          var exts = GLctx.getSupportedExtensions() || [];
          exts = exts.concat(
            exts.map(function(e) {
              return "GL_" + e;
            })
          );
          exts = exts.map(function(e) {
            return stringToNewUTF8(e);
          });
          stringiCache = GL.stringiCache[name] = exts;
          if (index < 0 || index >= stringiCache.length) {
            GL.recordError(1281);
            return 0;
          }
          return stringiCache[index];
        default:
          GL.recordError(1280);
          return 0;
      }
    }
    function _emscripten_glGetSynciv(sync, pname, bufSize, length, values) {
      if (bufSize < 0) {
        GL.recordError(1281);
        return;
      }
      if (!values) {
        GL.recordError(1281);
        return;
      }
      var ret = GLctx.getSyncParameter(GL.syncs[sync], pname);
      HEAP32[length >> 2] = ret;
      if (ret !== null && length) HEAP32[length >> 2] = 1;
    }
    function _emscripten_glGetTexParameterfv(target, pname, params) {
      if (!params) {
        GL.recordError(1281);
        return;
      }
      HEAPF32[params >> 2] = GLctx.getTexParameter(target, pname);
    }
    function _emscripten_glGetTexParameteriv(target, pname, params) {
      if (!params) {
        GL.recordError(1281);
        return;
      }
      HEAP32[params >> 2] = GLctx.getTexParameter(target, pname);
    }
    function _emscripten_glGetTransformFeedbackVarying(
      program,
      index,
      bufSize,
      length,
      size,
      type,
      name
    ) {
      program = GL.programs[program];
      var info = GLctx["getTransformFeedbackVarying"](program, index);
      if (!info) return;
      if (name && bufSize > 0) {
        var numBytesWrittenExclNull = stringToUTF8(info.name, name, bufSize);
        if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
      } else {
        if (length) HEAP32[length >> 2] = 0;
      }
      if (size) HEAP32[size >> 2] = info.size;
      if (type) HEAP32[type >> 2] = info.type;
    }
    function _emscripten_glGetUniformBlockIndex(program, uniformBlockName) {
      return GLctx["getUniformBlockIndex"](
        GL.programs[program],
        UTF8ToString(uniformBlockName)
      );
    }
    function _emscripten_glGetUniformIndices(
      program,
      uniformCount,
      uniformNames,
      uniformIndices
    ) {
      if (!uniformIndices) {
        GL.recordError(1281);
        return;
      }
      if (uniformCount > 0 && (uniformNames == 0 || uniformIndices == 0)) {
        GL.recordError(1281);
        return;
      }
      program = GL.programs[program];
      var names = [];
      for (var i = 0; i < uniformCount; i++)
        names.push(UTF8ToString(HEAP32[(uniformNames + i * 4) >> 2]));
      var result = GLctx["getUniformIndices"](program, names);
      if (!result) return;
      var len = result.length;
      for (var i = 0; i < len; i++) {
        HEAP32[(uniformIndices + i * 4) >> 2] = result[i];
      }
    }
    function _emscripten_glGetUniformLocation(program, name) {
      name = UTF8ToString(name);
      var arrayIndex = 0;
      if (name[name.length - 1] == "]") {
        var leftBrace = name.lastIndexOf("[");
        arrayIndex =
          name[leftBrace + 1] != "]" ? parseInt(name.slice(leftBrace + 1)) : 0;
        name = name.slice(0, leftBrace);
      }
      var uniformInfo =
        GL.programInfos[program] && GL.programInfos[program].uniforms[name];
      if (uniformInfo && arrayIndex >= 0 && arrayIndex < uniformInfo[0]) {
        return uniformInfo[1] + arrayIndex;
      } else {
        return -1;
      }
    }
    function emscriptenWebGLGetUniform(program, location, params, type) {
      if (!params) {
        GL.recordError(1281);
        return;
      }
      var data = GLctx.getUniform(GL.programs[program], GL.uniforms[location]);
      if (typeof data == "number" || typeof data == "boolean") {
        switch (type) {
          case 0:
            HEAP32[params >> 2] = data;
            break;
          case 2:
            HEAPF32[params >> 2] = data;
            break;
          default:
            throw "internal emscriptenWebGLGetUniform() error, bad type: " +
              type;
        }
      } else {
        for (var i = 0; i < data.length; i++) {
          switch (type) {
            case 0:
              HEAP32[(params + i * 4) >> 2] = data[i];
              break;
            case 2:
              HEAPF32[(params + i * 4) >> 2] = data[i];
              break;
            default:
              throw "internal emscriptenWebGLGetUniform() error, bad type: " +
                type;
          }
        }
      }
    }
    function _emscripten_glGetUniformfv(program, location, params) {
      emscriptenWebGLGetUniform(program, location, params, 2);
    }
    function _emscripten_glGetUniformiv(program, location, params) {
      emscriptenWebGLGetUniform(program, location, params, 0);
    }
    function _emscripten_glGetUniformuiv(program, location, params) {
      emscriptenWebGLGetUniform(program, location, params, 0);
    }
    function emscriptenWebGLGetVertexAttrib(index, pname, params, type) {
      if (!params) {
        GL.recordError(1281);
        return;
      }
      var data = GLctx.getVertexAttrib(index, pname);
      if (pname == 34975) {
        HEAP32[params >> 2] = data["name"];
      } else if (typeof data == "number" || typeof data == "boolean") {
        switch (type) {
          case 0:
            HEAP32[params >> 2] = data;
            break;
          case 2:
            HEAPF32[params >> 2] = data;
            break;
          case 5:
            HEAP32[params >> 2] = Math.fround(data);
            break;
          default:
            throw "internal emscriptenWebGLGetVertexAttrib() error, bad type: " +
              type;
        }
      } else {
        for (var i = 0; i < data.length; i++) {
          switch (type) {
            case 0:
              HEAP32[(params + i * 4) >> 2] = data[i];
              break;
            case 2:
              HEAPF32[(params + i * 4) >> 2] = data[i];
              break;
            case 5:
              HEAP32[(params + i * 4) >> 2] = Math.fround(data[i]);
              break;
            default:
              throw "internal emscriptenWebGLGetVertexAttrib() error, bad type: " +
                type;
          }
        }
      }
    }
    function _emscripten_glGetVertexAttribIiv(index, pname, params) {
      emscriptenWebGLGetVertexAttrib(index, pname, params, 0);
    }
    function _emscripten_glGetVertexAttribIuiv(index, pname, params) {
      emscriptenWebGLGetVertexAttrib(index, pname, params, 0);
    }
    function _emscripten_glGetVertexAttribPointerv(index, pname, pointer) {
      if (!pointer) {
        GL.recordError(1281);
        return;
      }
      HEAP32[pointer >> 2] = GLctx.getVertexAttribOffset(index, pname);
    }
    function _emscripten_glGetVertexAttribfv(index, pname, params) {
      emscriptenWebGLGetVertexAttrib(index, pname, params, 2);
    }
    function _emscripten_glGetVertexAttribiv(index, pname, params) {
      emscriptenWebGLGetVertexAttrib(index, pname, params, 5);
    }
    function _emscripten_glHint(x0, x1) {
      GLctx["hint"](x0, x1);
    }
    function _emscripten_glInvalidateFramebuffer(
      target,
      numAttachments,
      attachments
    ) {
      var list = __tempFixedLengthArray[numAttachments];
      for (var i = 0; i < numAttachments; i++) {
        list[i] = HEAP32[(attachments + i * 4) >> 2];
      }
      GLctx["invalidateFramebuffer"](target, list);
    }
    function _emscripten_glInvalidateSubFramebuffer(
      target,
      numAttachments,
      attachments,
      x,
      y,
      width,
      height
    ) {
      var list = __tempFixedLengthArray[numAttachments];
      for (var i = 0; i < numAttachments; i++) {
        list[i] = HEAP32[(attachments + i * 4) >> 2];
      }
      GLctx["invalidateSubFramebuffer"](target, list, x, y, width, height);
    }
    function _emscripten_glIsBuffer(buffer) {
      var b = GL.buffers[buffer];
      if (!b) return 0;
      return GLctx.isBuffer(b);
    }
    function _emscripten_glIsEnabled(x0) {
      return GLctx["isEnabled"](x0);
    }
    function _emscripten_glIsFramebuffer(framebuffer) {
      var fb = GL.framebuffers[framebuffer];
      if (!fb) return 0;
      return GLctx.isFramebuffer(fb);
    }
    function _emscripten_glIsProgram(program) {
      program = GL.programs[program];
      if (!program) return 0;
      return GLctx.isProgram(program);
    }
    function _emscripten_glIsQuery(id) {
      var query = GL.queries[id];
      if (!query) return 0;
      return GLctx["isQuery"](query);
    }
    function _emscripten_glIsQueryEXT(id) {
      var query = GL.timerQueriesEXT[id];
      if (!query) return 0;
      return GLctx.disjointTimerQueryExt["isQueryEXT"](query);
    }
    function _emscripten_glIsRenderbuffer(renderbuffer) {
      var rb = GL.renderbuffers[renderbuffer];
      if (!rb) return 0;
      return GLctx.isRenderbuffer(rb);
    }
    function _emscripten_glIsSampler(id) {
      var sampler = GL.samplers[id];
      if (!sampler) return 0;
      return GLctx["isSampler"](sampler);
    }
    function _emscripten_glIsShader(shader) {
      var s = GL.shaders[shader];
      if (!s) return 0;
      return GLctx.isShader(s);
    }
    function _emscripten_glIsSync(sync) {
      var sync = GL.syncs[sync];
      if (!sync) return 0;
      return GLctx.isSync(sync);
    }
    function _emscripten_glIsTexture(id) {
      var texture = GL.textures[id];
      if (!texture) return 0;
      return GLctx.isTexture(texture);
    }
    function _emscripten_glIsTransformFeedback(id) {
      return GLctx["isTransformFeedback"](GL.transformFeedbacks[id]);
    }
    function _emscripten_glIsVertexArray(array) {
      var vao = GL.vaos[array];
      if (!vao) return 0;
      return GLctx["isVertexArray"](vao);
    }
    function _emscripten_glIsVertexArrayOES(array) {
      var vao = GL.vaos[array];
      if (!vao) return 0;
      return GLctx["isVertexArray"](vao);
    }
    function _emscripten_glLineWidth(x0) {
      GLctx["lineWidth"](x0);
    }
    function _emscripten_glLinkProgram(program) {
      GLctx.linkProgram(GL.programs[program]);
      GL.populateUniformTable(program);
    }
    function _emscripten_glMapBufferRange() {
      err("missing function: emscripten_glMapBufferRange");
      abort(-1);
    }
    function _emscripten_glPauseTransformFeedback() {
      GLctx["pauseTransformFeedback"]();
    }
    function _emscripten_glPixelStorei(pname, param) {
      if (pname == 3317) {
        GL.unpackAlignment = param;
      }
      GLctx.pixelStorei(pname, param);
    }
    function _emscripten_glPolygonOffset(x0, x1) {
      GLctx["polygonOffset"](x0, x1);
    }
    function _emscripten_glProgramBinary(
      program,
      binaryFormat,
      binary,
      length
    ) {
      GL.recordError(1280);
    }
    function _emscripten_glProgramParameteri(program, pname, value) {
      GL.recordError(1280);
    }
    function _emscripten_glQueryCounterEXT(id, target) {
      GLctx.disjointTimerQueryExt["queryCounterEXT"](
        GL.timerQueriesEXT[id],
        target
      );
    }
    function _emscripten_glReadBuffer(x0) {
      GLctx["readBuffer"](x0);
    }
    function __computeUnpackAlignedImageSize(
      width,
      height,
      sizePerPixel,
      alignment
    ) {
      function roundedToNextMultipleOf(x, y) {
        return (x + y - 1) & -y;
      }
      var plainRowSize = width * sizePerPixel;
      var alignedRowSize = roundedToNextMultipleOf(plainRowSize, alignment);
      return height * alignedRowSize;
    }
    var __colorChannelsInGlTextureFormat = {
      6402: 1,
      6403: 1,
      6406: 1,
      6407: 3,
      6408: 4,
      6409: 1,
      6410: 2,
      33319: 2,
      33320: 2,
      35904: 3,
      35906: 4,
      36244: 1,
      36248: 3,
      36249: 4
    };
    var __sizeOfGlTextureElementType = {
      5120: 1,
      5121: 1,
      5122: 2,
      5123: 2,
      5124: 4,
      5125: 4,
      5126: 4,
      5131: 2,
      32819: 2,
      32820: 2,
      33635: 2,
      33640: 4,
      34042: 4,
      35899: 4,
      35902: 4,
      36193: 2
    };
    function emscriptenWebGLGetTexPixelData(
      type,
      format,
      width,
      height,
      pixels,
      internalFormat
    ) {
      var sizePerPixel =
        __colorChannelsInGlTextureFormat[format] *
        __sizeOfGlTextureElementType[type];
      if (!sizePerPixel) {
        GL.recordError(1280);
        return;
      }
      var bytes = __computeUnpackAlignedImageSize(
        width,
        height,
        sizePerPixel,
        GL.unpackAlignment
      );
      var end = pixels + bytes;
      switch (type) {
        case 5120:
          return HEAP8.subarray(pixels, end);
        case 5121:
          return HEAPU8.subarray(pixels, end);
        case 5122:
          return HEAP16.subarray(pixels >> 1, end >> 1);
        case 5124:
          return HEAP32.subarray(pixels >> 2, end >> 2);
        case 5126:
          return HEAPF32.subarray(pixels >> 2, end >> 2);
        case 5125:
        case 34042:
        case 35902:
        case 33640:
        case 35899:
          return HEAPU32.subarray(pixels >> 2, end >> 2);
        case 5123:
        case 33635:
        case 32819:
        case 32820:
        case 36193:
        case 5131:
          return HEAPU16.subarray(pixels >> 1, end >> 1);
        default:
          GL.recordError(1280);
      }
    }
    function __heapObjectForWebGLType(type) {
      switch (type) {
        case 5120:
          return HEAP8;
        case 5121:
          return HEAPU8;
        case 5122:
          return HEAP16;
        case 5123:
        case 33635:
        case 32819:
        case 32820:
        case 36193:
        case 5131:
          return HEAPU16;
        case 5124:
          return HEAP32;
        case 5125:
        case 34042:
        case 35902:
        case 33640:
        case 35899:
        case 34042:
          return HEAPU32;
        case 5126:
          return HEAPF32;
      }
    }
    var __heapAccessShiftForWebGLType = {
      5122: 1,
      5123: 1,
      5124: 2,
      5125: 2,
      5126: 2,
      5131: 1,
      32819: 1,
      32820: 1,
      33635: 1,
      33640: 2,
      34042: 2,
      35899: 2,
      35902: 2,
      36193: 1
    };
    function _emscripten_glReadPixels(
      x,
      y,
      width,
      height,
      format,
      type,
      pixels
    ) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        if (GLctx.currentPixelPackBufferBinding) {
          GLctx.readPixels(x, y, width, height, format, type, pixels);
        } else {
          GLctx.readPixels(
            x,
            y,
            width,
            height,
            format,
            type,
            __heapObjectForWebGLType(type),
            pixels >> (__heapAccessShiftForWebGLType[type] | 0)
          );
        }
        return;
      }
      var pixelData = emscriptenWebGLGetTexPixelData(
        type,
        format,
        width,
        height,
        pixels,
        format
      );
      if (!pixelData) {
        GL.recordError(1280);
        return;
      }
      GLctx.readPixels(x, y, width, height, format, type, pixelData);
    }
    function _emscripten_glReleaseShaderCompiler() {}
    function _emscripten_glRenderbufferStorage(x0, x1, x2, x3) {
      GLctx["renderbufferStorage"](x0, x1, x2, x3);
    }
    function _emscripten_glRenderbufferStorageMultisample(x0, x1, x2, x3, x4) {
      GLctx["renderbufferStorageMultisample"](x0, x1, x2, x3, x4);
    }
    function _emscripten_glResumeTransformFeedback() {
      GLctx["resumeTransformFeedback"]();
    }
    function _emscripten_glSampleCoverage(value, invert) {
      GLctx.sampleCoverage(value, !!invert);
    }
    function _emscripten_glSamplerParameterf(sampler, pname, param) {
      GLctx["samplerParameterf"](GL.samplers[sampler], pname, param);
    }
    function _emscripten_glSamplerParameterfv(sampler, pname, params) {
      var param = HEAPF32[params >> 2];
      GLctx["samplerParameterf"](GL.samplers[sampler], pname, param);
    }
    function _emscripten_glSamplerParameteri(sampler, pname, param) {
      GLctx["samplerParameteri"](GL.samplers[sampler], pname, param);
    }
    function _emscripten_glSamplerParameteriv(sampler, pname, params) {
      var param = HEAP32[params >> 2];
      GLctx["samplerParameteri"](GL.samplers[sampler], pname, param);
    }
    function _emscripten_glScissor(x0, x1, x2, x3) {
      GLctx["scissor"](x0, x1, x2, x3);
    }
    function _emscripten_glShaderBinary() {
      GL.recordError(1280);
    }
    function _emscripten_glShaderSource(shader, count, string, length) {
      var source = GL.getSource(shader, count, string, length);
      GLctx.shaderSource(GL.shaders[shader], source);
    }
    function _emscripten_glStencilFunc(x0, x1, x2) {
      GLctx["stencilFunc"](x0, x1, x2);
    }
    function _emscripten_glStencilFuncSeparate(x0, x1, x2, x3) {
      GLctx["stencilFuncSeparate"](x0, x1, x2, x3);
    }
    function _emscripten_glStencilMask(x0) {
      GLctx["stencilMask"](x0);
    }
    function _emscripten_glStencilMaskSeparate(x0, x1) {
      GLctx["stencilMaskSeparate"](x0, x1);
    }
    function _emscripten_glStencilOp(x0, x1, x2) {
      GLctx["stencilOp"](x0, x1, x2);
    }
    function _emscripten_glStencilOpSeparate(x0, x1, x2, x3) {
      GLctx["stencilOpSeparate"](x0, x1, x2, x3);
    }
    function _emscripten_glTexImage2D(
      target,
      level,
      internalFormat,
      width,
      height,
      border,
      format,
      type,
      pixels
    ) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        if (GLctx.currentPixelUnpackBufferBinding) {
          GLctx.texImage2D(
            target,
            level,
            internalFormat,
            width,
            height,
            border,
            format,
            type,
            pixels
          );
        } else if (pixels != 0) {
          GLctx.texImage2D(
            target,
            level,
            internalFormat,
            width,
            height,
            border,
            format,
            type,
            __heapObjectForWebGLType(type),
            pixels >> (__heapAccessShiftForWebGLType[type] | 0)
          );
        } else {
          GLctx.texImage2D(
            target,
            level,
            internalFormat,
            width,
            height,
            border,
            format,
            type,
            null
          );
        }
        return;
      }
      GLctx.texImage2D(
        target,
        level,
        internalFormat,
        width,
        height,
        border,
        format,
        type,
        pixels
          ? emscriptenWebGLGetTexPixelData(
              type,
              format,
              width,
              height,
              pixels,
              internalFormat
            )
          : null
      );
    }
    function _emscripten_glTexImage3D(
      target,
      level,
      internalFormat,
      width,
      height,
      depth,
      border,
      format,
      type,
      pixels
    ) {
      if (GLctx.currentPixelUnpackBufferBinding) {
        GLctx["texImage3D"](
          target,
          level,
          internalFormat,
          width,
          height,
          depth,
          border,
          format,
          type,
          pixels
        );
      } else if (pixels != 0) {
        GLctx["texImage3D"](
          target,
          level,
          internalFormat,
          width,
          height,
          depth,
          border,
          format,
          type,
          __heapObjectForWebGLType(type),
          pixels >> (__heapAccessShiftForWebGLType[type] | 0)
        );
      } else {
        GLctx["texImage3D"](
          target,
          level,
          internalFormat,
          width,
          height,
          depth,
          border,
          format,
          type,
          null
        );
      }
    }
    function _emscripten_glTexParameterf(x0, x1, x2) {
      GLctx["texParameterf"](x0, x1, x2);
    }
    function _emscripten_glTexParameterfv(target, pname, params) {
      var param = HEAPF32[params >> 2];
      GLctx.texParameterf(target, pname, param);
    }
    function _emscripten_glTexParameteri(x0, x1, x2) {
      GLctx["texParameteri"](x0, x1, x2);
    }
    function _emscripten_glTexParameteriv(target, pname, params) {
      var param = HEAP32[params >> 2];
      GLctx.texParameteri(target, pname, param);
    }
    function _emscripten_glTexStorage2D(x0, x1, x2, x3, x4) {
      GLctx["texStorage2D"](x0, x1, x2, x3, x4);
    }
    function _emscripten_glTexStorage3D(x0, x1, x2, x3, x4, x5) {
      GLctx["texStorage3D"](x0, x1, x2, x3, x4, x5);
    }
    function _emscripten_glTexSubImage2D(
      target,
      level,
      xoffset,
      yoffset,
      width,
      height,
      format,
      type,
      pixels
    ) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        if (GLctx.currentPixelUnpackBufferBinding) {
          GLctx.texSubImage2D(
            target,
            level,
            xoffset,
            yoffset,
            width,
            height,
            format,
            type,
            pixels
          );
        } else if (pixels != 0) {
          GLctx.texSubImage2D(
            target,
            level,
            xoffset,
            yoffset,
            width,
            height,
            format,
            type,
            __heapObjectForWebGLType(type),
            pixels >> (__heapAccessShiftForWebGLType[type] | 0)
          );
        } else {
          GLctx.texSubImage2D(
            target,
            level,
            xoffset,
            yoffset,
            width,
            height,
            format,
            type,
            null
          );
        }
        return;
      }
      var pixelData = null;
      if (pixels)
        pixelData = emscriptenWebGLGetTexPixelData(
          type,
          format,
          width,
          height,
          pixels,
          0
        );
      GLctx.texSubImage2D(
        target,
        level,
        xoffset,
        yoffset,
        width,
        height,
        format,
        type,
        pixelData
      );
    }
    function _emscripten_glTexSubImage3D(
      target,
      level,
      xoffset,
      yoffset,
      zoffset,
      width,
      height,
      depth,
      format,
      type,
      pixels
    ) {
      if (GLctx.currentPixelUnpackBufferBinding) {
        GLctx["texSubImage3D"](
          target,
          level,
          xoffset,
          yoffset,
          zoffset,
          width,
          height,
          depth,
          format,
          type,
          pixels
        );
      } else if (pixels != 0) {
        GLctx["texSubImage3D"](
          target,
          level,
          xoffset,
          yoffset,
          zoffset,
          width,
          height,
          depth,
          format,
          type,
          __heapObjectForWebGLType(type),
          pixels >> (__heapAccessShiftForWebGLType[type] | 0)
        );
      } else {
        GLctx["texSubImage3D"](
          target,
          level,
          xoffset,
          yoffset,
          zoffset,
          width,
          height,
          depth,
          format,
          type,
          null
        );
      }
    }
    function _emscripten_glTransformFeedbackVaryings(
      program,
      count,
      varyings,
      bufferMode
    ) {
      program = GL.programs[program];
      var vars = [];
      for (var i = 0; i < count; i++)
        vars.push(UTF8ToString(HEAP32[(varyings + i * 4) >> 2]));
      GLctx["transformFeedbackVaryings"](program, vars, bufferMode);
    }
    function _emscripten_glUniform1f(location, v0) {
      GLctx.uniform1f(GL.uniforms[location], v0);
    }
    function _emscripten_glUniform1fv(location, count, value) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniform1fv(GL.uniforms[location], HEAPF32, value >> 2, count);
        return;
      }
      if (count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferViews[count - 1];
        for (var i = 0; i < count; ++i) {
          view[i] = HEAPF32[(value + 4 * i) >> 2];
        }
      } else {
        var view = HEAPF32.subarray(value >> 2, (value + count * 4) >> 2);
      }
      GLctx.uniform1fv(GL.uniforms[location], view);
    }
    function _emscripten_glUniform1i(location, v0) {
      GLctx.uniform1i(GL.uniforms[location], v0);
    }
    function _emscripten_glUniform1iv(location, count, value) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniform1iv(GL.uniforms[location], HEAP32, value >> 2, count);
        return;
      }
      GLctx.uniform1iv(
        GL.uniforms[location],
        HEAP32.subarray(value >> 2, (value + count * 4) >> 2)
      );
    }
    function _emscripten_glUniform1ui(location, v0) {
      GLctx.uniform1ui(GL.uniforms[location], v0);
    }
    function _emscripten_glUniform1uiv(location, count, value) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniform1uiv(GL.uniforms[location], HEAPU32, value >> 2, count);
      } else {
        GLctx.uniform1uiv(
          GL.uniforms[location],
          HEAPU32.subarray(value >> 2, (value + count * 4) >> 2)
        );
      }
    }
    function _emscripten_glUniform2f(location, v0, v1) {
      GLctx.uniform2f(GL.uniforms[location], v0, v1);
    }
    function _emscripten_glUniform2fv(location, count, value) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniform2fv(GL.uniforms[location], HEAPF32, value >> 2, count * 2);
        return;
      }
      if (2 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferViews[2 * count - 1];
        for (var i = 0; i < 2 * count; i += 2) {
          view[i] = HEAPF32[(value + 4 * i) >> 2];
          view[i + 1] = HEAPF32[(value + (4 * i + 4)) >> 2];
        }
      } else {
        var view = HEAPF32.subarray(value >> 2, (value + count * 8) >> 2);
      }
      GLctx.uniform2fv(GL.uniforms[location], view);
    }
    function _emscripten_glUniform2i(location, v0, v1) {
      GLctx.uniform2i(GL.uniforms[location], v0, v1);
    }
    function _emscripten_glUniform2iv(location, count, value) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniform2iv(GL.uniforms[location], HEAP32, value >> 2, count * 2);
        return;
      }
      GLctx.uniform2iv(
        GL.uniforms[location],
        HEAP32.subarray(value >> 2, (value + count * 8) >> 2)
      );
    }
    function _emscripten_glUniform2ui(location, v0, v1) {
      GLctx.uniform2ui(GL.uniforms[location], v0, v1);
    }
    function _emscripten_glUniform2uiv(location, count, value) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniform2uiv(
          GL.uniforms[location],
          HEAPU32,
          value >> 2,
          count * 2
        );
      } else {
        GLctx.uniform2uiv(
          GL.uniforms[location],
          HEAPU32.subarray(value >> 2, (value + count * 8) >> 2)
        );
      }
    }
    function _emscripten_glUniform3f(location, v0, v1, v2) {
      GLctx.uniform3f(GL.uniforms[location], v0, v1, v2);
    }
    function _emscripten_glUniform3fv(location, count, value) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniform3fv(GL.uniforms[location], HEAPF32, value >> 2, count * 3);
        return;
      }
      if (3 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferViews[3 * count - 1];
        for (var i = 0; i < 3 * count; i += 3) {
          view[i] = HEAPF32[(value + 4 * i) >> 2];
          view[i + 1] = HEAPF32[(value + (4 * i + 4)) >> 2];
          view[i + 2] = HEAPF32[(value + (4 * i + 8)) >> 2];
        }
      } else {
        var view = HEAPF32.subarray(value >> 2, (value + count * 12) >> 2);
      }
      GLctx.uniform3fv(GL.uniforms[location], view);
    }
    function _emscripten_glUniform3i(location, v0, v1, v2) {
      GLctx.uniform3i(GL.uniforms[location], v0, v1, v2);
    }
    function _emscripten_glUniform3iv(location, count, value) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniform3iv(GL.uniforms[location], HEAP32, value >> 2, count * 3);
        return;
      }
      GLctx.uniform3iv(
        GL.uniforms[location],
        HEAP32.subarray(value >> 2, (value + count * 12) >> 2)
      );
    }
    function _emscripten_glUniform3ui(location, v0, v1, v2) {
      GLctx.uniform3ui(GL.uniforms[location], v0, v1, v2);
    }
    function _emscripten_glUniform3uiv(location, count, value) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniform3uiv(
          GL.uniforms[location],
          HEAPU32,
          value >> 2,
          count * 3
        );
      } else {
        GLctx.uniform3uiv(
          GL.uniforms[location],
          HEAPU32.subarray(value >> 2, (value + count * 12) >> 2)
        );
      }
    }
    function _emscripten_glUniform4f(location, v0, v1, v2, v3) {
      GLctx.uniform4f(GL.uniforms[location], v0, v1, v2, v3);
    }
    function _emscripten_glUniform4fv(location, count, value) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniform4fv(GL.uniforms[location], HEAPF32, value >> 2, count * 4);
        return;
      }
      if (4 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferViews[4 * count - 1];
        for (var i = 0; i < 4 * count; i += 4) {
          view[i] = HEAPF32[(value + 4 * i) >> 2];
          view[i + 1] = HEAPF32[(value + (4 * i + 4)) >> 2];
          view[i + 2] = HEAPF32[(value + (4 * i + 8)) >> 2];
          view[i + 3] = HEAPF32[(value + (4 * i + 12)) >> 2];
        }
      } else {
        var view = HEAPF32.subarray(value >> 2, (value + count * 16) >> 2);
      }
      GLctx.uniform4fv(GL.uniforms[location], view);
    }
    function _emscripten_glUniform4i(location, v0, v1, v2, v3) {
      GLctx.uniform4i(GL.uniforms[location], v0, v1, v2, v3);
    }
    function _emscripten_glUniform4iv(location, count, value) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniform4iv(GL.uniforms[location], HEAP32, value >> 2, count * 4);
        return;
      }
      GLctx.uniform4iv(
        GL.uniforms[location],
        HEAP32.subarray(value >> 2, (value + count * 16) >> 2)
      );
    }
    function _emscripten_glUniform4ui(location, v0, v1, v2, v3) {
      GLctx.uniform4ui(GL.uniforms[location], v0, v1, v2, v3);
    }
    function _emscripten_glUniform4uiv(location, count, value) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniform4uiv(
          GL.uniforms[location],
          HEAPU32,
          value >> 2,
          count * 4
        );
      } else {
        GLctx.uniform4uiv(
          GL.uniforms[location],
          HEAPU32.subarray(value >> 2, (value + count * 16) >> 2)
        );
      }
    }
    function _emscripten_glUniformBlockBinding(
      program,
      uniformBlockIndex,
      uniformBlockBinding
    ) {
      program = GL.programs[program];
      GLctx["uniformBlockBinding"](
        program,
        uniformBlockIndex,
        uniformBlockBinding
      );
    }
    function _emscripten_glUniformMatrix2fv(location, count, transpose, value) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniformMatrix2fv(
          GL.uniforms[location],
          !!transpose,
          HEAPF32,
          value >> 2,
          count * 4
        );
        return;
      }
      if (4 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferViews[4 * count - 1];
        for (var i = 0; i < 4 * count; i += 4) {
          view[i] = HEAPF32[(value + 4 * i) >> 2];
          view[i + 1] = HEAPF32[(value + (4 * i + 4)) >> 2];
          view[i + 2] = HEAPF32[(value + (4 * i + 8)) >> 2];
          view[i + 3] = HEAPF32[(value + (4 * i + 12)) >> 2];
        }
      } else {
        var view = HEAPF32.subarray(value >> 2, (value + count * 16) >> 2);
      }
      GLctx.uniformMatrix2fv(GL.uniforms[location], !!transpose, view);
    }
    function _emscripten_glUniformMatrix2x3fv(
      location,
      count,
      transpose,
      value
    ) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniformMatrix2x3fv(
          GL.uniforms[location],
          !!transpose,
          HEAPF32,
          value >> 2,
          count * 6
        );
      } else {
        GLctx.uniformMatrix2x3fv(
          GL.uniforms[location],
          !!transpose,
          HEAPF32.subarray(value >> 2, (value + count * 24) >> 2)
        );
      }
    }
    function _emscripten_glUniformMatrix2x4fv(
      location,
      count,
      transpose,
      value
    ) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniformMatrix2x4fv(
          GL.uniforms[location],
          !!transpose,
          HEAPF32,
          value >> 2,
          count * 8
        );
      } else {
        GLctx.uniformMatrix2x4fv(
          GL.uniforms[location],
          !!transpose,
          HEAPF32.subarray(value >> 2, (value + count * 32) >> 2)
        );
      }
    }
    function _emscripten_glUniformMatrix3fv(location, count, transpose, value) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniformMatrix3fv(
          GL.uniforms[location],
          !!transpose,
          HEAPF32,
          value >> 2,
          count * 9
        );
        return;
      }
      if (9 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferViews[9 * count - 1];
        for (var i = 0; i < 9 * count; i += 9) {
          view[i] = HEAPF32[(value + 4 * i) >> 2];
          view[i + 1] = HEAPF32[(value + (4 * i + 4)) >> 2];
          view[i + 2] = HEAPF32[(value + (4 * i + 8)) >> 2];
          view[i + 3] = HEAPF32[(value + (4 * i + 12)) >> 2];
          view[i + 4] = HEAPF32[(value + (4 * i + 16)) >> 2];
          view[i + 5] = HEAPF32[(value + (4 * i + 20)) >> 2];
          view[i + 6] = HEAPF32[(value + (4 * i + 24)) >> 2];
          view[i + 7] = HEAPF32[(value + (4 * i + 28)) >> 2];
          view[i + 8] = HEAPF32[(value + (4 * i + 32)) >> 2];
        }
      } else {
        var view = HEAPF32.subarray(value >> 2, (value + count * 36) >> 2);
      }
      GLctx.uniformMatrix3fv(GL.uniforms[location], !!transpose, view);
    }
    function _emscripten_glUniformMatrix3x2fv(
      location,
      count,
      transpose,
      value
    ) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniformMatrix3x2fv(
          GL.uniforms[location],
          !!transpose,
          HEAPF32,
          value >> 2,
          count * 6
        );
      } else {
        GLctx.uniformMatrix3x2fv(
          GL.uniforms[location],
          !!transpose,
          HEAPF32.subarray(value >> 2, (value + count * 24) >> 2)
        );
      }
    }
    function _emscripten_glUniformMatrix3x4fv(
      location,
      count,
      transpose,
      value
    ) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniformMatrix3x4fv(
          GL.uniforms[location],
          !!transpose,
          HEAPF32,
          value >> 2,
          count * 12
        );
      } else {
        GLctx.uniformMatrix3x4fv(
          GL.uniforms[location],
          !!transpose,
          HEAPF32.subarray(value >> 2, (value + count * 48) >> 2)
        );
      }
    }
    function _emscripten_glUniformMatrix4fv(location, count, transpose, value) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniformMatrix4fv(
          GL.uniforms[location],
          !!transpose,
          HEAPF32,
          value >> 2,
          count * 16
        );
        return;
      }
      if (16 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferViews[16 * count - 1];
        for (var i = 0; i < 16 * count; i += 16) {
          view[i] = HEAPF32[(value + 4 * i) >> 2];
          view[i + 1] = HEAPF32[(value + (4 * i + 4)) >> 2];
          view[i + 2] = HEAPF32[(value + (4 * i + 8)) >> 2];
          view[i + 3] = HEAPF32[(value + (4 * i + 12)) >> 2];
          view[i + 4] = HEAPF32[(value + (4 * i + 16)) >> 2];
          view[i + 5] = HEAPF32[(value + (4 * i + 20)) >> 2];
          view[i + 6] = HEAPF32[(value + (4 * i + 24)) >> 2];
          view[i + 7] = HEAPF32[(value + (4 * i + 28)) >> 2];
          view[i + 8] = HEAPF32[(value + (4 * i + 32)) >> 2];
          view[i + 9] = HEAPF32[(value + (4 * i + 36)) >> 2];
          view[i + 10] = HEAPF32[(value + (4 * i + 40)) >> 2];
          view[i + 11] = HEAPF32[(value + (4 * i + 44)) >> 2];
          view[i + 12] = HEAPF32[(value + (4 * i + 48)) >> 2];
          view[i + 13] = HEAPF32[(value + (4 * i + 52)) >> 2];
          view[i + 14] = HEAPF32[(value + (4 * i + 56)) >> 2];
          view[i + 15] = HEAPF32[(value + (4 * i + 60)) >> 2];
        }
      } else {
        var view = HEAPF32.subarray(value >> 2, (value + count * 64) >> 2);
      }
      GLctx.uniformMatrix4fv(GL.uniforms[location], !!transpose, view);
    }
    function _emscripten_glUniformMatrix4x2fv(
      location,
      count,
      transpose,
      value
    ) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniformMatrix4x2fv(
          GL.uniforms[location],
          !!transpose,
          HEAPF32,
          value >> 2,
          count * 8
        );
      } else {
        GLctx.uniformMatrix4x2fv(
          GL.uniforms[location],
          !!transpose,
          HEAPF32.subarray(value >> 2, (value + count * 32) >> 2)
        );
      }
    }
    function _emscripten_glUniformMatrix4x3fv(
      location,
      count,
      transpose,
      value
    ) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniformMatrix4x3fv(
          GL.uniforms[location],
          !!transpose,
          HEAPF32,
          value >> 2,
          count * 12
        );
      } else {
        GLctx.uniformMatrix4x3fv(
          GL.uniforms[location],
          !!transpose,
          HEAPF32.subarray(value >> 2, (value + count * 48) >> 2)
        );
      }
    }
    function _emscripten_glUnmapBuffer() {
      err("missing function: emscripten_glUnmapBuffer");
      abort(-1);
    }
    function _emscripten_glUseProgram(program) {
      GLctx.useProgram(GL.programs[program]);
    }
    function _emscripten_glValidateProgram(program) {
      GLctx.validateProgram(GL.programs[program]);
    }
    function _emscripten_glVertexAttrib1f(x0, x1) {
      GLctx["vertexAttrib1f"](x0, x1);
    }
    function _emscripten_glVertexAttrib1fv(index, v) {
      GLctx.vertexAttrib1f(index, HEAPF32[v >> 2]);
    }
    function _emscripten_glVertexAttrib2f(x0, x1, x2) {
      GLctx["vertexAttrib2f"](x0, x1, x2);
    }
    function _emscripten_glVertexAttrib2fv(index, v) {
      GLctx.vertexAttrib2f(index, HEAPF32[v >> 2], HEAPF32[(v + 4) >> 2]);
    }
    function _emscripten_glVertexAttrib3f(x0, x1, x2, x3) {
      GLctx["vertexAttrib3f"](x0, x1, x2, x3);
    }
    function _emscripten_glVertexAttrib3fv(index, v) {
      GLctx.vertexAttrib3f(
        index,
        HEAPF32[v >> 2],
        HEAPF32[(v + 4) >> 2],
        HEAPF32[(v + 8) >> 2]
      );
    }
    function _emscripten_glVertexAttrib4f(x0, x1, x2, x3, x4) {
      GLctx["vertexAttrib4f"](x0, x1, x2, x3, x4);
    }
    function _emscripten_glVertexAttrib4fv(index, v) {
      GLctx.vertexAttrib4f(
        index,
        HEAPF32[v >> 2],
        HEAPF32[(v + 4) >> 2],
        HEAPF32[(v + 8) >> 2],
        HEAPF32[(v + 12) >> 2]
      );
    }
    function _emscripten_glVertexAttribDivisor(index, divisor) {
      GLctx["vertexAttribDivisor"](index, divisor);
    }
    function _emscripten_glVertexAttribDivisorANGLE(index, divisor) {
      GLctx["vertexAttribDivisor"](index, divisor);
    }
    function _emscripten_glVertexAttribDivisorARB(index, divisor) {
      GLctx["vertexAttribDivisor"](index, divisor);
    }
    function _emscripten_glVertexAttribDivisorEXT(index, divisor) {
      GLctx["vertexAttribDivisor"](index, divisor);
    }
    function _emscripten_glVertexAttribDivisorNV(index, divisor) {
      GLctx["vertexAttribDivisor"](index, divisor);
    }
    function _emscripten_glVertexAttribI4i(x0, x1, x2, x3, x4) {
      GLctx["vertexAttribI4i"](x0, x1, x2, x3, x4);
    }
    function _emscripten_glVertexAttribI4iv(index, v) {
      GLctx.vertexAttribI4i(
        index,
        HEAP32[v >> 2],
        HEAP32[(v + 4) >> 2],
        HEAP32[(v + 8) >> 2],
        HEAP32[(v + 12) >> 2]
      );
    }
    function _emscripten_glVertexAttribI4ui(x0, x1, x2, x3, x4) {
      GLctx["vertexAttribI4ui"](x0, x1, x2, x3, x4);
    }
    function _emscripten_glVertexAttribI4uiv(index, v) {
      GLctx.vertexAttribI4ui(
        index,
        HEAPU32[v >> 2],
        HEAPU32[(v + 4) >> 2],
        HEAPU32[(v + 8) >> 2],
        HEAPU32[(v + 12) >> 2]
      );
    }
    function _emscripten_glVertexAttribIPointer(
      index,
      size,
      type,
      stride,
      ptr
    ) {
      GLctx["vertexAttribIPointer"](index, size, type, stride, ptr);
    }
    function _emscripten_glVertexAttribPointer(
      index,
      size,
      type,
      normalized,
      stride,
      ptr
    ) {
      GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr);
    }
    function _emscripten_glViewport(x0, x1, x2, x3) {
      GLctx["viewport"](x0, x1, x2, x3);
    }
    function _emscripten_glWaitSync(sync, flags, timeoutLo, timeoutHi) {
      timeoutLo = timeoutLo >>> 0;
      timeoutHi = timeoutHi >>> 0;
      var timeout =
        timeoutLo == 4294967295 && timeoutHi == 4294967295
          ? -1
          : makeBigInt(timeoutLo, timeoutHi, true);
      GLctx.waitSync(GL.syncs[sync], flags, timeout);
    }
    var setjmpId = 0;
    function _saveSetjmp(env, label, table, size) {
      env = env | 0;
      label = label | 0;
      table = table | 0;
      size = size | 0;
      var i = 0;
      setjmpId = (setjmpId + 1) | 0;
      HEAP32[env >> 2] = setjmpId;
      while ((i | 0) < (size | 0)) {
        if ((HEAP32[(table + (i << 3)) >> 2] | 0) == 0) {
          HEAP32[(table + (i << 3)) >> 2] = setjmpId;
          HEAP32[(table + ((i << 3) + 4)) >> 2] = label;
          HEAP32[(table + ((i << 3) + 8)) >> 2] = 0;
          setTempRet0(size | 0);
          return table | 0;
        }
        i = (i + 1) | 0;
      }
      size = (size * 2) | 0;
      table = _realloc(table | 0, (8 * ((size + 1) | 0)) | 0) | 0;
      table = _saveSetjmp(env | 0, label | 0, table | 0, size | 0) | 0;
      setTempRet0(size | 0);
      return table | 0;
    }
    function _testSetjmp(id, table, size) {
      id = id | 0;
      table = table | 0;
      size = size | 0;
      var i = 0,
        curr = 0;
      while ((i | 0) < (size | 0)) {
        curr = HEAP32[(table + (i << 3)) >> 2] | 0;
        if ((curr | 0) == 0) break;
        if ((curr | 0) == (id | 0)) {
          return HEAP32[(table + ((i << 3) + 4)) >> 2] | 0;
        }
        i = (i + 1) | 0;
      }
      return 0;
    }
    function _longjmp(env, value) {
      _setThrew(env, value || 1);
      throw "longjmp";
    }
    function _emscripten_longjmp(env, value) {
      _longjmp(env, value);
    }
    function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src + num), dest);
    }
    function __emscripten_do_request_fullscreen(target, strategy) {
      if (!JSEvents.fullscreenEnabled()) return -1;
      if (!target) target = "#canvas";
      target = __findEventTarget(target);
      if (!target) return -4;
      if (
        !target.requestFullscreen &&
        !target.msRequestFullscreen &&
        !target.mozRequestFullScreen &&
        !target.mozRequestFullscreen &&
        !target.webkitRequestFullscreen
      ) {
        return -3;
      }
      var canPerformRequests = JSEvents.canPerformEventHandlerRequests();
      if (!canPerformRequests) {
        if (strategy.deferUntilInEventHandler) {
          JSEvents.deferCall(_JSEvents_requestFullscreen, 1, [
            target,
            strategy
          ]);
          return 1;
        } else {
          return -2;
        }
      }
      return _JSEvents_requestFullscreen(target, strategy);
    }
    function _emscripten_request_fullscreen_strategy(
      target,
      deferUntilInEventHandler,
      fullscreenStrategy
    ) {
      var strategy = {};
      strategy.scaleMode = HEAP32[fullscreenStrategy >> 2];
      strategy.canvasResolutionScaleMode =
        HEAP32[(fullscreenStrategy + 4) >> 2];
      strategy.filteringMode = HEAP32[(fullscreenStrategy + 8) >> 2];
      strategy.deferUntilInEventHandler = deferUntilInEventHandler;
      strategy.canvasResizedCallback = HEAP32[(fullscreenStrategy + 12) >> 2];
      strategy.canvasResizedCallbackUserData =
        HEAP32[(fullscreenStrategy + 16) >> 2];
      __currentFullscreenStrategy = strategy;
      return __emscripten_do_request_fullscreen(target, strategy);
    }
    function _emscripten_request_pointerlock(target, deferUntilInEventHandler) {
      if (!target) target = "#canvas";
      target = __findEventTarget(target);
      if (!target) return -4;
      if (
        !target.requestPointerLock &&
        !target.mozRequestPointerLock &&
        !target.webkitRequestPointerLock &&
        !target.msRequestPointerLock
      ) {
        return -1;
      }
      var canPerformRequests = JSEvents.canPerformEventHandlerRequests();
      if (!canPerformRequests) {
        if (deferUntilInEventHandler) {
          JSEvents.deferCall(__requestPointerLock, 2, [target]);
          return 1;
        } else {
          return -2;
        }
      }
      return __requestPointerLock(target);
    }
    function emscripten_realloc_buffer(size) {
      try {
        wasmMemory.grow((size - buffer.byteLength + 65535) >> 16);
        updateGlobalBufferAndViews(wasmMemory.buffer);
        return 1;
      } catch (e) {}
    }
    function _emscripten_resize_heap(requestedSize) {
      var oldSize = _emscripten_get_heap_size();
      var PAGE_MULTIPLE = 65536;
      var LIMIT = 2147483648 - PAGE_MULTIPLE;
      if (requestedSize > LIMIT) {
        return false;
      }
      var MIN_TOTAL_MEMORY = 16777216;
      var newSize = Math.max(oldSize, MIN_TOTAL_MEMORY);
      while (newSize < requestedSize) {
        if (newSize <= 536870912) {
          newSize = alignUp(2 * newSize, PAGE_MULTIPLE);
        } else {
          newSize = Math.min(
            alignUp((3 * newSize + 2147483648) / 4, PAGE_MULTIPLE),
            LIMIT
          );
        }
      }
      var replacement = emscripten_realloc_buffer(newSize);
      if (!replacement) {
        return false;
      }
      return true;
    }
    function _emscripten_sample_gamepad_data() {
      return (JSEvents.lastGamepadState = navigator.getGamepads
        ? navigator.getGamepads()
        : navigator.webkitGetGamepads
        ? navigator.webkitGetGamepads()
        : null)
        ? 0
        : -1;
    }
    function __registerFullscreenChangeEventCallback(
      target,
      userData,
      useCapture,
      callbackfunc,
      eventTypeId,
      eventTypeString,
      targetThread
    ) {
      if (!JSEvents.fullscreenChangeEvent)
        JSEvents.fullscreenChangeEvent = _malloc(280);
      var fullscreenChangeEventhandlerFunc = function(ev) {
        var e = ev || event;
        var fullscreenChangeEvent = JSEvents.fullscreenChangeEvent;
        __fillFullscreenChangeEventData(fullscreenChangeEvent, e);
        if (
          dynCall_iiii(
            callbackfunc,
            eventTypeId,
            fullscreenChangeEvent,
            userData
          )
        )
          e.preventDefault();
      };
      var eventHandler = {
        target: target,
        allowsDeferredCalls: false,
        eventTypeString: eventTypeString,
        callbackfunc: callbackfunc,
        handlerFunc: fullscreenChangeEventhandlerFunc,
        useCapture: useCapture
      };
      JSEvents.registerOrRemoveHandler(eventHandler);
    }
    function _emscripten_set_fullscreenchange_callback_on_thread(
      target,
      userData,
      useCapture,
      callbackfunc,
      targetThread
    ) {
      if (!JSEvents.fullscreenEnabled()) return -1;
      target = target ? __findEventTarget(target) : __specialEventTargets[1];
      if (!target) return -4;
      __registerFullscreenChangeEventCallback(
        target,
        userData,
        useCapture,
        callbackfunc,
        19,
        "fullscreenchange",
        targetThread
      );
      __registerFullscreenChangeEventCallback(
        target,
        userData,
        useCapture,
        callbackfunc,
        19,
        "mozfullscreenchange",
        targetThread
      );
      __registerFullscreenChangeEventCallback(
        target,
        userData,
        useCapture,
        callbackfunc,
        19,
        "webkitfullscreenchange",
        targetThread
      );
      __registerFullscreenChangeEventCallback(
        target,
        userData,
        useCapture,
        callbackfunc,
        19,
        "msfullscreenchange",
        targetThread
      );
      return 0;
    }
    function __registerGamepadEventCallback(
      target,
      userData,
      useCapture,
      callbackfunc,
      eventTypeId,
      eventTypeString,
      targetThread
    ) {
      if (!JSEvents.gamepadEvent) JSEvents.gamepadEvent = _malloc(1432);
      var gamepadEventHandlerFunc = function(ev) {
        var e = ev || event;
        var gamepadEvent = JSEvents.gamepadEvent;
        __fillGamepadEventData(gamepadEvent, e["gamepad"]);
        if (dynCall_iiii(callbackfunc, eventTypeId, gamepadEvent, userData))
          e.preventDefault();
      };
      var eventHandler = {
        target: __findEventTarget(target),
        allowsDeferredCalls: true,
        eventTypeString: eventTypeString,
        callbackfunc: callbackfunc,
        handlerFunc: gamepadEventHandlerFunc,
        useCapture: useCapture
      };
      JSEvents.registerOrRemoveHandler(eventHandler);
    }
    function _emscripten_set_gamepadconnected_callback_on_thread(
      userData,
      useCapture,
      callbackfunc,
      targetThread
    ) {
      if (!navigator.getGamepads && !navigator.webkitGetGamepads) return -1;
      __registerGamepadEventCallback(
        2,
        userData,
        useCapture,
        callbackfunc,
        26,
        "gamepadconnected",
        targetThread
      );
      return 0;
    }
    function _emscripten_set_gamepaddisconnected_callback_on_thread(
      userData,
      useCapture,
      callbackfunc,
      targetThread
    ) {
      if (!navigator.getGamepads && !navigator.webkitGetGamepads) return -1;
      __registerGamepadEventCallback(
        2,
        userData,
        useCapture,
        callbackfunc,
        27,
        "gamepaddisconnected",
        targetThread
      );
      return 0;
    }
    function __registerKeyEventCallback(
      target,
      userData,
      useCapture,
      callbackfunc,
      eventTypeId,
      eventTypeString,
      targetThread
    ) {
      if (!JSEvents.keyEvent) JSEvents.keyEvent = _malloc(164);
      var keyEventHandlerFunc = function(ev) {
        var e = ev || event;
        var keyEventData = JSEvents.keyEvent;
        stringToUTF8(e.key ? e.key : "", keyEventData + 0, 32);
        stringToUTF8(e.code ? e.code : "", keyEventData + 32, 32);
        HEAP32[(keyEventData + 64) >> 2] = e.location;
        HEAP32[(keyEventData + 68) >> 2] = e.ctrlKey;
        HEAP32[(keyEventData + 72) >> 2] = e.shiftKey;
        HEAP32[(keyEventData + 76) >> 2] = e.altKey;
        HEAP32[(keyEventData + 80) >> 2] = e.metaKey;
        HEAP32[(keyEventData + 84) >> 2] = e.repeat;
        stringToUTF8(e.locale ? e.locale : "", keyEventData + 88, 32);
        stringToUTF8(e.char ? e.char : "", keyEventData + 120, 32);
        HEAP32[(keyEventData + 152) >> 2] = e.charCode;
        HEAP32[(keyEventData + 156) >> 2] = e.keyCode;
        HEAP32[(keyEventData + 160) >> 2] = e.which;
        if (dynCall_iiii(callbackfunc, eventTypeId, keyEventData, userData))
          e.preventDefault();
      };
      var eventHandler = {
        target: __findEventTarget(target),
        allowsDeferredCalls: JSEvents.isInternetExplorer() ? false : true,
        eventTypeString: eventTypeString,
        callbackfunc: callbackfunc,
        handlerFunc: keyEventHandlerFunc,
        useCapture: useCapture
      };
      JSEvents.registerOrRemoveHandler(eventHandler);
    }
    function _emscripten_set_keydown_callback_on_thread(
      target,
      userData,
      useCapture,
      callbackfunc,
      targetThread
    ) {
      __registerKeyEventCallback(
        target,
        userData,
        useCapture,
        callbackfunc,
        2,
        "keydown",
        targetThread
      );
      return 0;
    }
    function _emscripten_set_keypress_callback_on_thread(
      target,
      userData,
      useCapture,
      callbackfunc,
      targetThread
    ) {
      __registerKeyEventCallback(
        target,
        userData,
        useCapture,
        callbackfunc,
        1,
        "keypress",
        targetThread
      );
      return 0;
    }
    function _emscripten_set_keyup_callback_on_thread(
      target,
      userData,
      useCapture,
      callbackfunc,
      targetThread
    ) {
      __registerKeyEventCallback(
        target,
        userData,
        useCapture,
        callbackfunc,
        3,
        "keyup",
        targetThread
      );
      return 0;
    }
    function __fillMouseEventData(eventStruct, e, target) {
      HEAPF64[eventStruct >> 3] = JSEvents.tick();
      HEAP32[(eventStruct + 8) >> 2] = e.screenX;
      HEAP32[(eventStruct + 12) >> 2] = e.screenY;
      HEAP32[(eventStruct + 16) >> 2] = e.clientX;
      HEAP32[(eventStruct + 20) >> 2] = e.clientY;
      HEAP32[(eventStruct + 24) >> 2] = e.ctrlKey;
      HEAP32[(eventStruct + 28) >> 2] = e.shiftKey;
      HEAP32[(eventStruct + 32) >> 2] = e.altKey;
      HEAP32[(eventStruct + 36) >> 2] = e.metaKey;
      HEAP16[(eventStruct + 40) >> 1] = e.button;
      HEAP16[(eventStruct + 42) >> 1] = e.buttons;
      HEAP32[(eventStruct + 44) >> 2] =
        e["movementX"] ||
        e["mozMovementX"] ||
        e["webkitMovementX"] ||
        e.screenX - JSEvents.previousScreenX;
      HEAP32[(eventStruct + 48) >> 2] =
        e["movementY"] ||
        e["mozMovementY"] ||
        e["webkitMovementY"] ||
        e.screenY - JSEvents.previousScreenY;
      if (Module["canvas"]) {
        var rect = Module["canvas"].getBoundingClientRect();
        HEAP32[(eventStruct + 60) >> 2] = e.clientX - rect.left;
        HEAP32[(eventStruct + 64) >> 2] = e.clientY - rect.top;
      } else {
        HEAP32[(eventStruct + 60) >> 2] = 0;
        HEAP32[(eventStruct + 64) >> 2] = 0;
      }
      if (target) {
        var rect = JSEvents.getBoundingClientRectOrZeros(target);
        HEAP32[(eventStruct + 52) >> 2] = e.clientX - rect.left;
        HEAP32[(eventStruct + 56) >> 2] = e.clientY - rect.top;
      } else {
        HEAP32[(eventStruct + 52) >> 2] = 0;
        HEAP32[(eventStruct + 56) >> 2] = 0;
      }
      if (e.type !== "wheel" && e.type !== "mousewheel") {
        JSEvents.previousScreenX = e.screenX;
        JSEvents.previousScreenY = e.screenY;
      }
    }
    function __registerMouseEventCallback(
      target,
      userData,
      useCapture,
      callbackfunc,
      eventTypeId,
      eventTypeString,
      targetThread
    ) {
      if (!JSEvents.mouseEvent) JSEvents.mouseEvent = _malloc(72);
      target = __findEventTarget(target);
      var mouseEventHandlerFunc = function(ev) {
        var e = ev || event;
        __fillMouseEventData(JSEvents.mouseEvent, e, target);
        if (
          dynCall_iiii(callbackfunc, eventTypeId, JSEvents.mouseEvent, userData)
        )
          e.preventDefault();
      };
      var eventHandler = {
        target: target,
        allowsDeferredCalls:
          eventTypeString != "mousemove" &&
          eventTypeString != "mouseenter" &&
          eventTypeString != "mouseleave",
        eventTypeString: eventTypeString,
        callbackfunc: callbackfunc,
        handlerFunc: mouseEventHandlerFunc,
        useCapture: useCapture
      };
      if (JSEvents.isInternetExplorer() && eventTypeString == "mousedown")
        eventHandler.allowsDeferredCalls = false;
      JSEvents.registerOrRemoveHandler(eventHandler);
    }
    function _emscripten_set_mousedown_callback_on_thread(
      target,
      userData,
      useCapture,
      callbackfunc,
      targetThread
    ) {
      __registerMouseEventCallback(
        target,
        userData,
        useCapture,
        callbackfunc,
        5,
        "mousedown",
        targetThread
      );
      return 0;
    }
    function _emscripten_set_mousemove_callback_on_thread(
      target,
      userData,
      useCapture,
      callbackfunc,
      targetThread
    ) {
      __registerMouseEventCallback(
        target,
        userData,
        useCapture,
        callbackfunc,
        8,
        "mousemove",
        targetThread
      );
      return 0;
    }
    function _emscripten_set_mouseup_callback_on_thread(
      target,
      userData,
      useCapture,
      callbackfunc,
      targetThread
    ) {
      __registerMouseEventCallback(
        target,
        userData,
        useCapture,
        callbackfunc,
        6,
        "mouseup",
        targetThread
      );
      return 0;
    }
    function __registerTouchEventCallback(
      target,
      userData,
      useCapture,
      callbackfunc,
      eventTypeId,
      eventTypeString,
      targetThread
    ) {
      if (!JSEvents.touchEvent) JSEvents.touchEvent = _malloc(1684);
      target = __findEventTarget(target);
      var touchEventHandlerFunc = function(ev) {
        var e = ev || event;
        var touches = {};
        for (var i = 0; i < e.touches.length; ++i) {
          var touch = e.touches[i];
          touch.changed = false;
          touches[touch.identifier] = touch;
        }
        for (var i = 0; i < e.changedTouches.length; ++i) {
          var touch = e.changedTouches[i];
          touches[touch.identifier] = touch;
          touch.changed = true;
        }
        for (var i = 0; i < e.targetTouches.length; ++i) {
          var touch = e.targetTouches[i];
          touches[touch.identifier].onTarget = true;
        }
        var touchEvent = JSEvents.touchEvent;
        var ptr = touchEvent;
        HEAP32[(ptr + 4) >> 2] = e.ctrlKey;
        HEAP32[(ptr + 8) >> 2] = e.shiftKey;
        HEAP32[(ptr + 12) >> 2] = e.altKey;
        HEAP32[(ptr + 16) >> 2] = e.metaKey;
        ptr += 20;
        var canvasRect = Module["canvas"]
          ? Module["canvas"].getBoundingClientRect()
          : undefined;
        var targetRect = JSEvents.getBoundingClientRectOrZeros(target);
        var numTouches = 0;
        for (var i in touches) {
          var t = touches[i];
          HEAP32[ptr >> 2] = t.identifier;
          HEAP32[(ptr + 4) >> 2] = t.screenX;
          HEAP32[(ptr + 8) >> 2] = t.screenY;
          HEAP32[(ptr + 12) >> 2] = t.clientX;
          HEAP32[(ptr + 16) >> 2] = t.clientY;
          HEAP32[(ptr + 20) >> 2] = t.pageX;
          HEAP32[(ptr + 24) >> 2] = t.pageY;
          HEAP32[(ptr + 28) >> 2] = t.changed;
          HEAP32[(ptr + 32) >> 2] = t.onTarget;
          if (canvasRect) {
            HEAP32[(ptr + 44) >> 2] = t.clientX - canvasRect.left;
            HEAP32[(ptr + 48) >> 2] = t.clientY - canvasRect.top;
          } else {
            HEAP32[(ptr + 44) >> 2] = 0;
            HEAP32[(ptr + 48) >> 2] = 0;
          }
          HEAP32[(ptr + 36) >> 2] = t.clientX - targetRect.left;
          HEAP32[(ptr + 40) >> 2] = t.clientY - targetRect.top;
          ptr += 52;
          if (++numTouches >= 32) {
            break;
          }
        }
        HEAP32[touchEvent >> 2] = numTouches;
        if (dynCall_iiii(callbackfunc, eventTypeId, touchEvent, userData))
          e.preventDefault();
      };
      var eventHandler = {
        target: target,
        allowsDeferredCalls:
          eventTypeString == "touchstart" || eventTypeString == "touchend",
        eventTypeString: eventTypeString,
        callbackfunc: callbackfunc,
        handlerFunc: touchEventHandlerFunc,
        useCapture: useCapture
      };
      JSEvents.registerOrRemoveHandler(eventHandler);
    }
    function _emscripten_set_touchcancel_callback_on_thread(
      target,
      userData,
      useCapture,
      callbackfunc,
      targetThread
    ) {
      __registerTouchEventCallback(
        target,
        userData,
        useCapture,
        callbackfunc,
        25,
        "touchcancel",
        targetThread
      );
      return 0;
    }
    function _emscripten_set_touchend_callback_on_thread(
      target,
      userData,
      useCapture,
      callbackfunc,
      targetThread
    ) {
      __registerTouchEventCallback(
        target,
        userData,
        useCapture,
        callbackfunc,
        23,
        "touchend",
        targetThread
      );
      return 0;
    }
    function _emscripten_set_touchmove_callback_on_thread(
      target,
      userData,
      useCapture,
      callbackfunc,
      targetThread
    ) {
      __registerTouchEventCallback(
        target,
        userData,
        useCapture,
        callbackfunc,
        24,
        "touchmove",
        targetThread
      );
      return 0;
    }
    function _emscripten_set_touchstart_callback_on_thread(
      target,
      userData,
      useCapture,
      callbackfunc,
      targetThread
    ) {
      __registerTouchEventCallback(
        target,
        userData,
        useCapture,
        callbackfunc,
        22,
        "touchstart",
        targetThread
      );
      return 0;
    }
    function __registerWheelEventCallback(
      target,
      userData,
      useCapture,
      callbackfunc,
      eventTypeId,
      eventTypeString,
      targetThread
    ) {
      if (!JSEvents.wheelEvent) JSEvents.wheelEvent = _malloc(104);
      var wheelHandlerFunc = function(ev) {
        var e = ev || event;
        var wheelEvent = JSEvents.wheelEvent;
        __fillMouseEventData(wheelEvent, e, target);
        HEAPF64[(wheelEvent + 72) >> 3] = e["deltaX"];
        HEAPF64[(wheelEvent + 80) >> 3] = e["deltaY"];
        HEAPF64[(wheelEvent + 88) >> 3] = e["deltaZ"];
        HEAP32[(wheelEvent + 96) >> 2] = e["deltaMode"];
        if (dynCall_iiii(callbackfunc, eventTypeId, wheelEvent, userData))
          e.preventDefault();
      };
      var mouseWheelHandlerFunc = function(ev) {
        var e = ev || event;
        __fillMouseEventData(JSEvents.wheelEvent, e, target);
        HEAPF64[(JSEvents.wheelEvent + 72) >> 3] = e["wheelDeltaX"] || 0;
        HEAPF64[(JSEvents.wheelEvent + 80) >> 3] = -(
          e["wheelDeltaY"] || e["wheelDelta"]
        );
        HEAPF64[(JSEvents.wheelEvent + 88) >> 3] = 0;
        HEAP32[(JSEvents.wheelEvent + 96) >> 2] = 0;
        var shouldCancel = dynCall_iiii(
          callbackfunc,
          eventTypeId,
          JSEvents.wheelEvent,
          userData
        );
        if (shouldCancel) {
          e.preventDefault();
        }
      };
      var eventHandler = {
        target: target,
        allowsDeferredCalls: true,
        eventTypeString: eventTypeString,
        callbackfunc: callbackfunc,
        handlerFunc:
          eventTypeString == "wheel" ? wheelHandlerFunc : mouseWheelHandlerFunc,
        useCapture: useCapture
      };
      JSEvents.registerOrRemoveHandler(eventHandler);
    }
    function _emscripten_set_wheel_callback_on_thread(
      target,
      userData,
      useCapture,
      callbackfunc,
      targetThread
    ) {
      target = __findEventTarget(target);
      if (typeof target.onwheel !== "undefined") {
        __registerWheelEventCallback(
          target,
          userData,
          useCapture,
          callbackfunc,
          9,
          "wheel",
          targetThread
        );
        return 0;
      } else if (typeof target.onmousewheel !== "undefined") {
        __registerWheelEventCallback(
          target,
          userData,
          useCapture,
          callbackfunc,
          9,
          "mousewheel",
          targetThread
        );
        return 0;
      } else {
        return -1;
      }
    }
    var __emscripten_webgl_power_preferences = [
      "default",
      "low-power",
      "high-performance"
    ];
    function _emscripten_webgl_do_create_context(target, attributes) {
      var contextAttributes = {};
      var a = attributes >> 2;
      contextAttributes["alpha"] = !!HEAP32[a + (0 >> 2)];
      contextAttributes["depth"] = !!HEAP32[a + (4 >> 2)];
      contextAttributes["stencil"] = !!HEAP32[a + (8 >> 2)];
      contextAttributes["antialias"] = !!HEAP32[a + (12 >> 2)];
      contextAttributes["premultipliedAlpha"] = !!HEAP32[a + (16 >> 2)];
      contextAttributes["preserveDrawingBuffer"] = !!HEAP32[a + (20 >> 2)];
      var powerPreference = HEAP32[a + (24 >> 2)];
      contextAttributes["powerPreference"] =
        __emscripten_webgl_power_preferences[powerPreference];
      contextAttributes["failIfMajorPerformanceCaveat"] = !!HEAP32[
        a + (28 >> 2)
      ];
      contextAttributes.majorVersion = HEAP32[a + (32 >> 2)];
      contextAttributes.minorVersion = HEAP32[a + (36 >> 2)];
      contextAttributes.enableExtensionsByDefault = HEAP32[a + (40 >> 2)];
      contextAttributes.explicitSwapControl = HEAP32[a + (44 >> 2)];
      contextAttributes.proxyContextToMainThread = HEAP32[a + (48 >> 2)];
      contextAttributes.renderViaOffscreenBackBuffer = HEAP32[a + (52 >> 2)];
      var canvas = __findCanvasEventTarget(target);
      if (!canvas) {
        return 0;
      }
      if (contextAttributes.explicitSwapControl) {
        return 0;
      }
      var contextHandle = GL.createContext(canvas, contextAttributes);
      return contextHandle;
    }
    function _emscripten_webgl_create_context(a0, a1) {
      return _emscripten_webgl_do_create_context(a0, a1);
    }
    function _emscripten_webgl_init_context_attributes(attributes) {
      var a = attributes >> 2;
      for (var i = 0; i < 56 >> 2; ++i) {
        HEAP32[a + i] = 0;
      }
      HEAP32[a + (0 >> 2)] = HEAP32[a + (4 >> 2)] = HEAP32[
        a + (12 >> 2)
      ] = HEAP32[a + (16 >> 2)] = HEAP32[a + (32 >> 2)] = HEAP32[
        a + (40 >> 2)
      ] = 1;
    }
    function _emscripten_webgl_make_context_current(contextHandle) {
      var success = GL.makeContextCurrent(contextHandle);
      return success ? 0 : -5;
    }
    function _emscripten_get_environ() {
      if (!_emscripten_get_environ.strings) {
        var ENV = {};
        ENV["USER"] = ENV["LOGNAME"] = "web_user";
        ENV["PATH"] = "/";
        ENV["PWD"] = "/";
        ENV["HOME"] = "/home/web_user";
        ENV["LANG"] =
          (
            (typeof navigator === "object" &&
              navigator.languages &&
              navigator.languages[0]) ||
            "C"
          ).replace("-", "_") + ".UTF-8";
        ENV["_"] = thisProgram;
        var strings = [];
        for (var key in ENV) {
          strings.push(key + "=" + ENV[key]);
        }
        _emscripten_get_environ.strings = strings;
      }
      return _emscripten_get_environ.strings;
    }
    function _environ_get(__environ, environ_buf) {
      var strings = _emscripten_get_environ();
      var bufSize = 0;
      strings.forEach(function(string, i) {
        var ptr = environ_buf + bufSize;
        HEAP32[(__environ + i * 4) >> 2] = ptr;
        writeAsciiToMemory(string, ptr);
        bufSize += string.length + 1;
      });
      return 0;
    }
    function _environ_sizes_get(environ_count, environ_buf_size) {
      var strings = _emscripten_get_environ();
      HEAP32[environ_count >> 2] = strings.length;
      var bufSize = 0;
      strings.forEach(function(string) {
        bufSize += string.length + 1;
      });
      HEAP32[environ_buf_size >> 2] = bufSize;
      return 0;
    }
    function _exit(status) {
      exit(status);
    }
    function _fd_close(fd) {
      try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        FS.close(stream);
        return 0;
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          abort(e);
        return e.errno;
      }
    }
    function _fd_write(fd, iov, iovcnt, pnum) {
      try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = SYSCALLS.doWritev(stream, iov, iovcnt);
        HEAP32[pnum >> 2] = num;
        return 0;
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          abort(e);
        return e.errno;
      }
    }
    var GAI_ERRNO_MESSAGES = {};
    function _gai_strerror(val) {
      var buflen = 256;
      if (!_gai_strerror.buffer) {
        _gai_strerror.buffer = _malloc(buflen);
        GAI_ERRNO_MESSAGES["0"] = "Success";
        GAI_ERRNO_MESSAGES["" + -1] = "Invalid value for 'ai_flags' field";
        GAI_ERRNO_MESSAGES["" + -2] = "NAME or SERVICE is unknown";
        GAI_ERRNO_MESSAGES["" + -3] = "Temporary failure in name resolution";
        GAI_ERRNO_MESSAGES["" + -4] = "Non-recoverable failure in name res";
        GAI_ERRNO_MESSAGES["" + -6] = "'ai_family' not supported";
        GAI_ERRNO_MESSAGES["" + -7] = "'ai_socktype' not supported";
        GAI_ERRNO_MESSAGES["" + -8] = "SERVICE not supported for 'ai_socktype'";
        GAI_ERRNO_MESSAGES["" + -10] = "Memory allocation failure";
        GAI_ERRNO_MESSAGES["" + -11] = "System error returned in 'errno'";
        GAI_ERRNO_MESSAGES["" + -12] = "Argument buffer overflow";
      }
      var msg = "Unknown error";
      if (val in GAI_ERRNO_MESSAGES) {
        if (GAI_ERRNO_MESSAGES[val].length > buflen - 1) {
          msg = "Message too long";
        } else {
          msg = GAI_ERRNO_MESSAGES[val];
        }
      }
      writeAsciiToMemory(msg, _gai_strerror.buffer);
      return _gai_strerror.buffer;
    }
    function _getTempRet0() {
      return getTempRet0() | 0;
    }
    function _getaddrinfo(node, service, hint, out) {
      var addr = 0;
      var port = 0;
      var flags = 0;
      var family = 0;
      var type = 0;
      var proto = 0;
      var ai;
      function allocaddrinfo(family, type, proto, canon, addr, port) {
        var sa, salen, ai;
        var res;
        salen = family === 10 ? 28 : 16;
        addr = family === 10 ? __inet_ntop6_raw(addr) : __inet_ntop4_raw(addr);
        sa = _malloc(salen);
        res = __write_sockaddr(sa, family, addr, port);
        assert(!res.errno);
        ai = _malloc(32);
        HEAP32[(ai + 4) >> 2] = family;
        HEAP32[(ai + 8) >> 2] = type;
        HEAP32[(ai + 12) >> 2] = proto;
        HEAP32[(ai + 24) >> 2] = canon;
        HEAP32[(ai + 20) >> 2] = sa;
        if (family === 10) {
          HEAP32[(ai + 16) >> 2] = 28;
        } else {
          HEAP32[(ai + 16) >> 2] = 16;
        }
        HEAP32[(ai + 28) >> 2] = 0;
        return ai;
      }
      if (hint) {
        flags = HEAP32[hint >> 2];
        family = HEAP32[(hint + 4) >> 2];
        type = HEAP32[(hint + 8) >> 2];
        proto = HEAP32[(hint + 12) >> 2];
      }
      if (type && !proto) {
        proto = type === 2 ? 17 : 6;
      }
      if (!type && proto) {
        type = proto === 17 ? 2 : 1;
      }
      if (proto === 0) {
        proto = 6;
      }
      if (type === 0) {
        type = 1;
      }
      if (!node && !service) {
        return -2;
      }
      if (flags & ~(1 | 2 | 4 | 1024 | 8 | 16 | 32)) {
        return -1;
      }
      if (hint !== 0 && HEAP32[hint >> 2] & 2 && !node) {
        return -1;
      }
      if (flags & 32) {
        return -2;
      }
      if (type !== 0 && type !== 1 && type !== 2) {
        return -7;
      }
      if (family !== 0 && family !== 2 && family !== 10) {
        return -6;
      }
      if (service) {
        service = UTF8ToString(service);
        port = parseInt(service, 10);
        if (isNaN(port)) {
          if (flags & 1024) {
            return -2;
          }
          return -8;
        }
      }
      if (!node) {
        if (family === 0) {
          family = 2;
        }
        if ((flags & 1) === 0) {
          if (family === 2) {
            addr = _htonl(2130706433);
          } else {
            addr = [0, 0, 0, 1];
          }
        }
        ai = allocaddrinfo(family, type, proto, null, addr, port);
        HEAP32[out >> 2] = ai;
        return 0;
      }
      node = UTF8ToString(node);
      addr = __inet_pton4_raw(node);
      if (addr !== null) {
        if (family === 0 || family === 2) {
          family = 2;
        } else if (family === 10 && flags & 8) {
          addr = [0, 0, _htonl(65535), addr];
          family = 10;
        } else {
          return -2;
        }
      } else {
        addr = __inet_pton6_raw(node);
        if (addr !== null) {
          if (family === 0 || family === 10) {
            family = 10;
          } else {
            return -2;
          }
        }
      }
      if (addr != null) {
        ai = allocaddrinfo(family, type, proto, node, addr, port);
        HEAP32[out >> 2] = ai;
        return 0;
      }
      if (flags & 4) {
        return -2;
      }
      node = DNS.lookup_name(node);
      addr = __inet_pton4_raw(node);
      if (family === 0) {
        family = 2;
      } else if (family === 10) {
        addr = [0, 0, _htonl(65535), addr];
      }
      ai = allocaddrinfo(family, type, proto, null, addr, port);
      HEAP32[out >> 2] = ai;
      return 0;
    }
    function _getnameinfo(sa, salen, node, nodelen, serv, servlen, flags) {
      var info = __read_sockaddr(sa, salen);
      if (info.errno) {
        return -6;
      }
      var port = info.port;
      var addr = info.addr;
      var overflowed = false;
      if (node && nodelen) {
        var lookup;
        if (flags & 1 || !(lookup = DNS.lookup_addr(addr))) {
          if (flags & 8) {
            return -2;
          }
        } else {
          addr = lookup;
        }
        var numBytesWrittenExclNull = stringToUTF8(addr, node, nodelen);
        if (numBytesWrittenExclNull + 1 >= nodelen) {
          overflowed = true;
        }
      }
      if (serv && servlen) {
        port = "" + port;
        var numBytesWrittenExclNull = stringToUTF8(port, serv, servlen);
        if (numBytesWrittenExclNull + 1 >= servlen) {
          overflowed = true;
        }
      }
      if (overflowed) {
        return -12;
      }
      return 0;
    }
    function _gettimeofday(ptr) {
      var now = Date.now();
      HEAP32[ptr >> 2] = (now / 1e3) | 0;
      HEAP32[(ptr + 4) >> 2] = ((now % 1e3) * 1e3) | 0;
      return 0;
    }
    function _glActiveTexture(x0) {
      GLctx["activeTexture"](x0);
    }
    function _glAttachShader(program, shader) {
      GLctx.attachShader(GL.programs[program], GL.shaders[shader]);
    }
    function _glBeginTransformFeedback(x0) {
      GLctx["beginTransformFeedback"](x0);
    }
    function _glBindAttribLocation(program, index, name) {
      GLctx.bindAttribLocation(GL.programs[program], index, UTF8ToString(name));
    }
    function _glBindBuffer(target, buffer) {
      if (target == 35051) {
        GLctx.currentPixelPackBufferBinding = buffer;
      } else if (target == 35052) {
        GLctx.currentPixelUnpackBufferBinding = buffer;
      }
      GLctx.bindBuffer(target, GL.buffers[buffer]);
    }
    function _glBindBufferBase(target, index, buffer) {
      GLctx["bindBufferBase"](target, index, GL.buffers[buffer]);
    }
    function _glBindFramebuffer(target, framebuffer) {
      GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer]);
    }
    function _glBindRenderbuffer(target, renderbuffer) {
      GLctx.bindRenderbuffer(target, GL.renderbuffers[renderbuffer]);
    }
    function _glBindTexture(target, texture) {
      GLctx.bindTexture(target, GL.textures[texture]);
    }
    function _glBindVertexArray(vao) {
      GLctx["bindVertexArray"](GL.vaos[vao]);
    }
    function _glBlendEquation(x0) {
      GLctx["blendEquation"](x0);
    }
    function _glBlendFunc(x0, x1) {
      GLctx["blendFunc"](x0, x1);
    }
    function _glBlendFuncSeparate(x0, x1, x2, x3) {
      GLctx["blendFuncSeparate"](x0, x1, x2, x3);
    }
    function _glBlitFramebuffer(x0, x1, x2, x3, x4, x5, x6, x7, x8, x9) {
      GLctx["blitFramebuffer"](x0, x1, x2, x3, x4, x5, x6, x7, x8, x9);
    }
    function _glBufferData(target, size, data, usage) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        if (data) {
          GLctx.bufferData(target, HEAPU8, usage, data, size);
        } else {
          GLctx.bufferData(target, size, usage);
        }
      } else {
        GLctx.bufferData(
          target,
          data ? HEAPU8.subarray(data, data + size) : size,
          usage
        );
      }
    }
    function _glBufferSubData(target, offset, size, data) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.bufferSubData(target, offset, HEAPU8, data, size);
        return;
      }
      GLctx.bufferSubData(target, offset, HEAPU8.subarray(data, data + size));
    }
    function _glCheckFramebufferStatus(x0) {
      return GLctx["checkFramebufferStatus"](x0);
    }
    function _glClear(x0) {
      GLctx["clear"](x0);
    }
    function _glClearBufferfv(buffer, drawbuffer, value) {
      GLctx["clearBufferfv"](buffer, drawbuffer, HEAPF32, value >> 2);
    }
    function _glClearColor(x0, x1, x2, x3) {
      GLctx["clearColor"](x0, x1, x2, x3);
    }
    function _glClearDepthf(x0) {
      GLctx["clearDepth"](x0);
    }
    function _glColorMask(red, green, blue, alpha) {
      GLctx.colorMask(!!red, !!green, !!blue, !!alpha);
    }
    function _glCompileShader(shader) {
      GLctx.compileShader(GL.shaders[shader]);
    }
    function _glCompressedTexImage2D(
      target,
      level,
      internalFormat,
      width,
      height,
      border,
      imageSize,
      data
    ) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        if (GLctx.currentPixelUnpackBufferBinding) {
          GLctx["compressedTexImage2D"](
            target,
            level,
            internalFormat,
            width,
            height,
            border,
            imageSize,
            data
          );
        } else {
          GLctx["compressedTexImage2D"](
            target,
            level,
            internalFormat,
            width,
            height,
            border,
            HEAPU8,
            data,
            imageSize
          );
        }
        return;
      }
      GLctx["compressedTexImage2D"](
        target,
        level,
        internalFormat,
        width,
        height,
        border,
        data ? HEAPU8.subarray(data, data + imageSize) : null
      );
    }
    function _glCompressedTexImage3D(
      target,
      level,
      internalFormat,
      width,
      height,
      depth,
      border,
      imageSize,
      data
    ) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        if (GLctx.currentPixelUnpackBufferBinding) {
          GLctx["compressedTexImage3D"](
            target,
            level,
            internalFormat,
            width,
            height,
            depth,
            border,
            imageSize,
            data
          );
        } else {
          GLctx["compressedTexImage3D"](
            target,
            level,
            internalFormat,
            width,
            height,
            depth,
            border,
            HEAPU8,
            data,
            imageSize
          );
        }
      } else {
        GLctx["compressedTexImage3D"](
          target,
          level,
          internalFormat,
          width,
          height,
          depth,
          border,
          data ? HEAPU8.subarray(data, data + imageSize) : null
        );
      }
    }
    function _glCompressedTexSubImage2D(
      target,
      level,
      xoffset,
      yoffset,
      width,
      height,
      format,
      imageSize,
      data
    ) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        if (GLctx.currentPixelUnpackBufferBinding) {
          GLctx["compressedTexSubImage2D"](
            target,
            level,
            xoffset,
            yoffset,
            width,
            height,
            format,
            imageSize,
            data
          );
        } else {
          GLctx["compressedTexSubImage2D"](
            target,
            level,
            xoffset,
            yoffset,
            width,
            height,
            format,
            HEAPU8,
            data,
            imageSize
          );
        }
        return;
      }
      GLctx["compressedTexSubImage2D"](
        target,
        level,
        xoffset,
        yoffset,
        width,
        height,
        format,
        data ? HEAPU8.subarray(data, data + imageSize) : null
      );
    }
    function _glCompressedTexSubImage3D(
      target,
      level,
      xoffset,
      yoffset,
      zoffset,
      width,
      height,
      depth,
      format,
      imageSize,
      data
    ) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        if (GLctx.currentPixelUnpackBufferBinding) {
          GLctx["compressedTexSubImage3D"](
            target,
            level,
            xoffset,
            yoffset,
            zoffset,
            width,
            height,
            depth,
            format,
            imageSize,
            data
          );
        } else {
          GLctx["compressedTexSubImage3D"](
            target,
            level,
            xoffset,
            yoffset,
            zoffset,
            width,
            height,
            depth,
            format,
            HEAPU8,
            data,
            imageSize
          );
        }
      } else {
        GLctx["compressedTexSubImage3D"](
          target,
          level,
          xoffset,
          yoffset,
          zoffset,
          width,
          height,
          depth,
          format,
          data ? HEAPU8.subarray(data, data + imageSize) : null
        );
      }
    }
    function _glCopyBufferSubData(x0, x1, x2, x3, x4) {
      GLctx["copyBufferSubData"](x0, x1, x2, x3, x4);
    }
    function _glCopyTexSubImage2D(x0, x1, x2, x3, x4, x5, x6, x7) {
      GLctx["copyTexSubImage2D"](x0, x1, x2, x3, x4, x5, x6, x7);
    }
    function _glCreateProgram() {
      var id = GL.getNewId(GL.programs);
      var program = GLctx.createProgram();
      program.name = id;
      GL.programs[id] = program;
      return id;
    }
    function _glCreateShader(shaderType) {
      var id = GL.getNewId(GL.shaders);
      GL.shaders[id] = GLctx.createShader(shaderType);
      return id;
    }
    function _glCullFace(x0) {
      GLctx["cullFace"](x0);
    }
    function _glDeleteBuffers(n, buffers) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(buffers + i * 4) >> 2];
        var buffer = GL.buffers[id];
        if (!buffer) continue;
        GLctx.deleteBuffer(buffer);
        buffer.name = 0;
        GL.buffers[id] = null;
        if (id == GL.currArrayBuffer) GL.currArrayBuffer = 0;
        if (id == GL.currElementArrayBuffer) GL.currElementArrayBuffer = 0;
        if (id == GLctx.currentPixelPackBufferBinding)
          GLctx.currentPixelPackBufferBinding = 0;
        if (id == GLctx.currentPixelUnpackBufferBinding)
          GLctx.currentPixelUnpackBufferBinding = 0;
      }
    }
    function _glDeleteFramebuffers(n, framebuffers) {
      for (var i = 0; i < n; ++i) {
        var id = HEAP32[(framebuffers + i * 4) >> 2];
        var framebuffer = GL.framebuffers[id];
        if (!framebuffer) continue;
        GLctx.deleteFramebuffer(framebuffer);
        framebuffer.name = 0;
        GL.framebuffers[id] = null;
      }
    }
    function _glDeleteProgram(id) {
      if (!id) return;
      var program = GL.programs[id];
      if (!program) {
        GL.recordError(1281);
        return;
      }
      GLctx.deleteProgram(program);
      program.name = 0;
      GL.programs[id] = null;
      GL.programInfos[id] = null;
    }
    function _glDeleteRenderbuffers(n, renderbuffers) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(renderbuffers + i * 4) >> 2];
        var renderbuffer = GL.renderbuffers[id];
        if (!renderbuffer) continue;
        GLctx.deleteRenderbuffer(renderbuffer);
        renderbuffer.name = 0;
        GL.renderbuffers[id] = null;
      }
    }
    function _glDeleteShader(id) {
      if (!id) return;
      var shader = GL.shaders[id];
      if (!shader) {
        GL.recordError(1281);
        return;
      }
      GLctx.deleteShader(shader);
      GL.shaders[id] = null;
    }
    function _glDeleteTextures(n, textures) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(textures + i * 4) >> 2];
        var texture = GL.textures[id];
        if (!texture) continue;
        GLctx.deleteTexture(texture);
        texture.name = 0;
        GL.textures[id] = null;
      }
    }
    function _glDeleteVertexArrays(n, vaos) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(vaos + i * 4) >> 2];
        GLctx["deleteVertexArray"](GL.vaos[id]);
        GL.vaos[id] = null;
      }
    }
    function _glDepthFunc(x0) {
      GLctx["depthFunc"](x0);
    }
    function _glDepthMask(flag) {
      GLctx.depthMask(!!flag);
    }
    function _glDisable(x0) {
      GLctx["disable"](x0);
    }
    function _glDisableVertexAttribArray(index) {
      GLctx.disableVertexAttribArray(index);
    }
    function _glDrawArrays(mode, first, count) {
      GLctx.drawArrays(mode, first, count);
    }
    function _glDrawArraysInstanced(mode, first, count, primcount) {
      GLctx["drawArraysInstanced"](mode, first, count, primcount);
    }
    function _glDrawBuffers(n, bufs) {
      var bufArray = __tempFixedLengthArray[n];
      for (var i = 0; i < n; i++) {
        bufArray[i] = HEAP32[(bufs + i * 4) >> 2];
      }
      GLctx["drawBuffers"](bufArray);
    }
    function _glDrawElementsInstanced(mode, count, type, indices, primcount) {
      GLctx["drawElementsInstanced"](mode, count, type, indices, primcount);
    }
    function _glEnable(x0) {
      GLctx["enable"](x0);
    }
    function _glEnableVertexAttribArray(index) {
      GLctx.enableVertexAttribArray(index);
    }
    function _glEndTransformFeedback() {
      GLctx["endTransformFeedback"]();
    }
    function _glFinish() {
      GLctx["finish"]();
    }
    function _glFramebufferRenderbuffer(
      target,
      attachment,
      renderbuffertarget,
      renderbuffer
    ) {
      GLctx.framebufferRenderbuffer(
        target,
        attachment,
        renderbuffertarget,
        GL.renderbuffers[renderbuffer]
      );
    }
    function _glFramebufferTexture2D(
      target,
      attachment,
      textarget,
      texture,
      level
    ) {
      GLctx.framebufferTexture2D(
        target,
        attachment,
        textarget,
        GL.textures[texture],
        level
      );
    }
    function _glFramebufferTextureLayer(
      target,
      attachment,
      texture,
      level,
      layer
    ) {
      GLctx.framebufferTextureLayer(
        target,
        attachment,
        GL.textures[texture],
        level,
        layer
      );
    }
    function _glFrontFace(x0) {
      GLctx["frontFace"](x0);
    }
    function _glGenBuffers(n, buffers) {
      __glGenObject(n, buffers, "createBuffer", GL.buffers);
    }
    function _glGenFramebuffers(n, ids) {
      __glGenObject(n, ids, "createFramebuffer", GL.framebuffers);
    }
    function _glGenRenderbuffers(n, renderbuffers) {
      __glGenObject(n, renderbuffers, "createRenderbuffer", GL.renderbuffers);
    }
    function _glGenTextures(n, textures) {
      __glGenObject(n, textures, "createTexture", GL.textures);
    }
    function _glGenVertexArrays(n, arrays) {
      __glGenObject(n, arrays, "createVertexArray", GL.vaos);
    }
    function _glGenerateMipmap(x0) {
      GLctx["generateMipmap"](x0);
    }
    function _glGetFloatv(name_, p) {
      emscriptenWebGLGet(name_, p, 2);
    }
    function _glGetIntegerv(name_, p) {
      emscriptenWebGLGet(name_, p, 0);
    }
    function _glGetProgramInfoLog(program, maxLength, length, infoLog) {
      var log = GLctx.getProgramInfoLog(GL.programs[program]);
      if (log === null) log = "(unknown error)";
      var numBytesWrittenExclNull =
        maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
      if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
    }
    function _glGetProgramiv(program, pname, p) {
      if (!p) {
        GL.recordError(1281);
        return;
      }
      if (program >= GL.counter) {
        GL.recordError(1281);
        return;
      }
      var ptable = GL.programInfos[program];
      if (!ptable) {
        GL.recordError(1282);
        return;
      }
      if (pname == 35716) {
        var log = GLctx.getProgramInfoLog(GL.programs[program]);
        if (log === null) log = "(unknown error)";
        HEAP32[p >> 2] = log.length + 1;
      } else if (pname == 35719) {
        HEAP32[p >> 2] = ptable.maxUniformLength;
      } else if (pname == 35722) {
        if (ptable.maxAttributeLength == -1) {
          program = GL.programs[program];
          var numAttribs = GLctx.getProgramParameter(program, 35721);
          ptable.maxAttributeLength = 0;
          for (var i = 0; i < numAttribs; ++i) {
            var activeAttrib = GLctx.getActiveAttrib(program, i);
            ptable.maxAttributeLength = Math.max(
              ptable.maxAttributeLength,
              activeAttrib.name.length + 1
            );
          }
        }
        HEAP32[p >> 2] = ptable.maxAttributeLength;
      } else if (pname == 35381) {
        if (ptable.maxUniformBlockNameLength == -1) {
          program = GL.programs[program];
          var numBlocks = GLctx.getProgramParameter(program, 35382);
          ptable.maxUniformBlockNameLength = 0;
          for (var i = 0; i < numBlocks; ++i) {
            var activeBlockName = GLctx.getActiveUniformBlockName(program, i);
            ptable.maxUniformBlockNameLength = Math.max(
              ptable.maxUniformBlockNameLength,
              activeBlockName.length + 1
            );
          }
        }
        HEAP32[p >> 2] = ptable.maxUniformBlockNameLength;
      } else {
        HEAP32[p >> 2] = GLctx.getProgramParameter(GL.programs[program], pname);
      }
    }
    function _glGetShaderInfoLog(shader, maxLength, length, infoLog) {
      var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
      if (log === null) log = "(unknown error)";
      var numBytesWrittenExclNull =
        maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
      if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
    }
    function _glGetShaderiv(shader, pname, p) {
      if (!p) {
        GL.recordError(1281);
        return;
      }
      if (pname == 35716) {
        var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
        if (log === null) log = "(unknown error)";
        HEAP32[p >> 2] = log.length + 1;
      } else if (pname == 35720) {
        var source = GLctx.getShaderSource(GL.shaders[shader]);
        var sourceLength =
          source === null || source.length == 0 ? 0 : source.length + 1;
        HEAP32[p >> 2] = sourceLength;
      } else {
        HEAP32[p >> 2] = GLctx.getShaderParameter(GL.shaders[shader], pname);
      }
    }
    function _glGetString(name_) {
      if (GL.stringCache[name_]) return GL.stringCache[name_];
      var ret;
      switch (name_) {
        case 7939:
          var exts = GLctx.getSupportedExtensions() || [];
          exts = exts.concat(
            exts.map(function(e) {
              return "GL_" + e;
            })
          );
          ret = stringToNewUTF8(exts.join(" "));
          break;
        case 7936:
        case 7937:
        case 37445:
        case 37446:
          var s = GLctx.getParameter(name_);
          if (!s) {
            GL.recordError(1280);
          }
          ret = stringToNewUTF8(s);
          break;
        case 7938:
          var glVersion = GLctx.getParameter(GLctx.VERSION);
          if (GL.currentContext.version >= 2)
            glVersion = "OpenGL ES 3.0 (" + glVersion + ")";
          else {
            glVersion = "OpenGL ES 2.0 (" + glVersion + ")";
          }
          ret = stringToNewUTF8(glVersion);
          break;
        case 35724:
          var glslVersion = GLctx.getParameter(GLctx.SHADING_LANGUAGE_VERSION);
          var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
          var ver_num = glslVersion.match(ver_re);
          if (ver_num !== null) {
            if (ver_num[1].length == 3) ver_num[1] = ver_num[1] + "0";
            glslVersion =
              "OpenGL ES GLSL ES " + ver_num[1] + " (" + glslVersion + ")";
          }
          ret = stringToNewUTF8(glslVersion);
          break;
        default:
          GL.recordError(1280);
          return 0;
      }
      GL.stringCache[name_] = ret;
      return ret;
    }
    function _glGetStringi(name, index) {
      if (GL.currentContext.version < 2) {
        GL.recordError(1282);
        return 0;
      }
      var stringiCache = GL.stringiCache[name];
      if (stringiCache) {
        if (index < 0 || index >= stringiCache.length) {
          GL.recordError(1281);
          return 0;
        }
        return stringiCache[index];
      }
      switch (name) {
        case 7939:
          var exts = GLctx.getSupportedExtensions() || [];
          exts = exts.concat(
            exts.map(function(e) {
              return "GL_" + e;
            })
          );
          exts = exts.map(function(e) {
            return stringToNewUTF8(e);
          });
          stringiCache = GL.stringiCache[name] = exts;
          if (index < 0 || index >= stringiCache.length) {
            GL.recordError(1281);
            return 0;
          }
          return stringiCache[index];
        default:
          GL.recordError(1280);
          return 0;
      }
    }
    function _glGetUniformBlockIndex(program, uniformBlockName) {
      return GLctx["getUniformBlockIndex"](
        GL.programs[program],
        UTF8ToString(uniformBlockName)
      );
    }
    function _glGetUniformLocation(program, name) {
      name = UTF8ToString(name);
      var arrayIndex = 0;
      if (name[name.length - 1] == "]") {
        var leftBrace = name.lastIndexOf("[");
        arrayIndex =
          name[leftBrace + 1] != "]" ? parseInt(name.slice(leftBrace + 1)) : 0;
        name = name.slice(0, leftBrace);
      }
      var uniformInfo =
        GL.programInfos[program] && GL.programInfos[program].uniforms[name];
      if (uniformInfo && arrayIndex >= 0 && arrayIndex < uniformInfo[0]) {
        return uniformInfo[1] + arrayIndex;
      } else {
        return -1;
      }
    }
    function _glInvalidateFramebuffer(target, numAttachments, attachments) {
      var list = __tempFixedLengthArray[numAttachments];
      for (var i = 0; i < numAttachments; i++) {
        list[i] = HEAP32[(attachments + i * 4) >> 2];
      }
      GLctx["invalidateFramebuffer"](target, list);
    }
    function _glLinkProgram(program) {
      GLctx.linkProgram(GL.programs[program]);
      GL.populateUniformTable(program);
    }
    function _glPixelStorei(pname, param) {
      if (pname == 3317) {
        GL.unpackAlignment = param;
      }
      GLctx.pixelStorei(pname, param);
    }
    function _glReadBuffer(x0) {
      GLctx["readBuffer"](x0);
    }
    function _glReadPixels(x, y, width, height, format, type, pixels) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        if (GLctx.currentPixelPackBufferBinding) {
          GLctx.readPixels(x, y, width, height, format, type, pixels);
        } else {
          GLctx.readPixels(
            x,
            y,
            width,
            height,
            format,
            type,
            __heapObjectForWebGLType(type),
            pixels >> (__heapAccessShiftForWebGLType[type] | 0)
          );
        }
        return;
      }
      var pixelData = emscriptenWebGLGetTexPixelData(
        type,
        format,
        width,
        height,
        pixels,
        format
      );
      if (!pixelData) {
        GL.recordError(1280);
        return;
      }
      GLctx.readPixels(x, y, width, height, format, type, pixelData);
    }
    function _glRenderbufferStorage(x0, x1, x2, x3) {
      GLctx["renderbufferStorage"](x0, x1, x2, x3);
    }
    function _glRenderbufferStorageMultisample(x0, x1, x2, x3, x4) {
      GLctx["renderbufferStorageMultisample"](x0, x1, x2, x3, x4);
    }
    function _glScissor(x0, x1, x2, x3) {
      GLctx["scissor"](x0, x1, x2, x3);
    }
    function _glShaderSource(shader, count, string, length) {
      var source = GL.getSource(shader, count, string, length);
      GLctx.shaderSource(GL.shaders[shader], source);
    }
    function _glTexImage2D(
      target,
      level,
      internalFormat,
      width,
      height,
      border,
      format,
      type,
      pixels
    ) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        if (GLctx.currentPixelUnpackBufferBinding) {
          GLctx.texImage2D(
            target,
            level,
            internalFormat,
            width,
            height,
            border,
            format,
            type,
            pixels
          );
        } else if (pixels != 0) {
          GLctx.texImage2D(
            target,
            level,
            internalFormat,
            width,
            height,
            border,
            format,
            type,
            __heapObjectForWebGLType(type),
            pixels >> (__heapAccessShiftForWebGLType[type] | 0)
          );
        } else {
          GLctx.texImage2D(
            target,
            level,
            internalFormat,
            width,
            height,
            border,
            format,
            type,
            null
          );
        }
        return;
      }
      GLctx.texImage2D(
        target,
        level,
        internalFormat,
        width,
        height,
        border,
        format,
        type,
        pixels
          ? emscriptenWebGLGetTexPixelData(
              type,
              format,
              width,
              height,
              pixels,
              internalFormat
            )
          : null
      );
    }
    function _glTexImage3D(
      target,
      level,
      internalFormat,
      width,
      height,
      depth,
      border,
      format,
      type,
      pixels
    ) {
      if (GLctx.currentPixelUnpackBufferBinding) {
        GLctx["texImage3D"](
          target,
          level,
          internalFormat,
          width,
          height,
          depth,
          border,
          format,
          type,
          pixels
        );
      } else if (pixels != 0) {
        GLctx["texImage3D"](
          target,
          level,
          internalFormat,
          width,
          height,
          depth,
          border,
          format,
          type,
          __heapObjectForWebGLType(type),
          pixels >> (__heapAccessShiftForWebGLType[type] | 0)
        );
      } else {
        GLctx["texImage3D"](
          target,
          level,
          internalFormat,
          width,
          height,
          depth,
          border,
          format,
          type,
          null
        );
      }
    }
    function _glTexParameterf(x0, x1, x2) {
      GLctx["texParameterf"](x0, x1, x2);
    }
    function _glTexParameteri(x0, x1, x2) {
      GLctx["texParameteri"](x0, x1, x2);
    }
    function _glTexStorage2D(x0, x1, x2, x3, x4) {
      GLctx["texStorage2D"](x0, x1, x2, x3, x4);
    }
    function _glTexSubImage2D(
      target,
      level,
      xoffset,
      yoffset,
      width,
      height,
      format,
      type,
      pixels
    ) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        if (GLctx.currentPixelUnpackBufferBinding) {
          GLctx.texSubImage2D(
            target,
            level,
            xoffset,
            yoffset,
            width,
            height,
            format,
            type,
            pixels
          );
        } else if (pixels != 0) {
          GLctx.texSubImage2D(
            target,
            level,
            xoffset,
            yoffset,
            width,
            height,
            format,
            type,
            __heapObjectForWebGLType(type),
            pixels >> (__heapAccessShiftForWebGLType[type] | 0)
          );
        } else {
          GLctx.texSubImage2D(
            target,
            level,
            xoffset,
            yoffset,
            width,
            height,
            format,
            type,
            null
          );
        }
        return;
      }
      var pixelData = null;
      if (pixels)
        pixelData = emscriptenWebGLGetTexPixelData(
          type,
          format,
          width,
          height,
          pixels,
          0
        );
      GLctx.texSubImage2D(
        target,
        level,
        xoffset,
        yoffset,
        width,
        height,
        format,
        type,
        pixelData
      );
    }
    function _glTexSubImage3D(
      target,
      level,
      xoffset,
      yoffset,
      zoffset,
      width,
      height,
      depth,
      format,
      type,
      pixels
    ) {
      if (GLctx.currentPixelUnpackBufferBinding) {
        GLctx["texSubImage3D"](
          target,
          level,
          xoffset,
          yoffset,
          zoffset,
          width,
          height,
          depth,
          format,
          type,
          pixels
        );
      } else if (pixels != 0) {
        GLctx["texSubImage3D"](
          target,
          level,
          xoffset,
          yoffset,
          zoffset,
          width,
          height,
          depth,
          format,
          type,
          __heapObjectForWebGLType(type),
          pixels >> (__heapAccessShiftForWebGLType[type] | 0)
        );
      } else {
        GLctx["texSubImage3D"](
          target,
          level,
          xoffset,
          yoffset,
          zoffset,
          width,
          height,
          depth,
          format,
          type,
          null
        );
      }
    }
    function _glTransformFeedbackVaryings(
      program,
      count,
      varyings,
      bufferMode
    ) {
      program = GL.programs[program];
      var vars = [];
      for (var i = 0; i < count; i++)
        vars.push(UTF8ToString(HEAP32[(varyings + i * 4) >> 2]));
      GLctx["transformFeedbackVaryings"](program, vars, bufferMode);
    }
    function _glUniform1f(location, v0) {
      GLctx.uniform1f(GL.uniforms[location], v0);
    }
    function _glUniform1i(location, v0) {
      GLctx.uniform1i(GL.uniforms[location], v0);
    }
    function _glUniform1iv(location, count, value) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniform1iv(GL.uniforms[location], HEAP32, value >> 2, count);
        return;
      }
      GLctx.uniform1iv(
        GL.uniforms[location],
        HEAP32.subarray(value >> 2, (value + count * 4) >> 2)
      );
    }
    function _glUniform1ui(location, v0) {
      GLctx.uniform1ui(GL.uniforms[location], v0);
    }
    function _glUniform2f(location, v0, v1) {
      GLctx.uniform2f(GL.uniforms[location], v0, v1);
    }
    function _glUniform2fv(location, count, value) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniform2fv(GL.uniforms[location], HEAPF32, value >> 2, count * 2);
        return;
      }
      if (2 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferViews[2 * count - 1];
        for (var i = 0; i < 2 * count; i += 2) {
          view[i] = HEAPF32[(value + 4 * i) >> 2];
          view[i + 1] = HEAPF32[(value + (4 * i + 4)) >> 2];
        }
      } else {
        var view = HEAPF32.subarray(value >> 2, (value + count * 8) >> 2);
      }
      GLctx.uniform2fv(GL.uniforms[location], view);
    }
    function _glUniform2i(location, v0, v1) {
      GLctx.uniform2i(GL.uniforms[location], v0, v1);
    }
    function _glUniform2iv(location, count, value) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniform2iv(GL.uniforms[location], HEAP32, value >> 2, count * 2);
        return;
      }
      GLctx.uniform2iv(
        GL.uniforms[location],
        HEAP32.subarray(value >> 2, (value + count * 8) >> 2)
      );
    }
    function _glUniform3f(location, v0, v1, v2) {
      GLctx.uniform3f(GL.uniforms[location], v0, v1, v2);
    }
    function _glUniform3fv(location, count, value) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniform3fv(GL.uniforms[location], HEAPF32, value >> 2, count * 3);
        return;
      }
      if (3 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferViews[3 * count - 1];
        for (var i = 0; i < 3 * count; i += 3) {
          view[i] = HEAPF32[(value + 4 * i) >> 2];
          view[i + 1] = HEAPF32[(value + (4 * i + 4)) >> 2];
          view[i + 2] = HEAPF32[(value + (4 * i + 8)) >> 2];
        }
      } else {
        var view = HEAPF32.subarray(value >> 2, (value + count * 12) >> 2);
      }
      GLctx.uniform3fv(GL.uniforms[location], view);
    }
    function _glUniform3i(location, v0, v1, v2) {
      GLctx.uniform3i(GL.uniforms[location], v0, v1, v2);
    }
    function _glUniform4f(location, v0, v1, v2, v3) {
      GLctx.uniform4f(GL.uniforms[location], v0, v1, v2, v3);
    }
    function _glUniform4fv(location, count, value) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniform4fv(GL.uniforms[location], HEAPF32, value >> 2, count * 4);
        return;
      }
      if (4 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferViews[4 * count - 1];
        for (var i = 0; i < 4 * count; i += 4) {
          view[i] = HEAPF32[(value + 4 * i) >> 2];
          view[i + 1] = HEAPF32[(value + (4 * i + 4)) >> 2];
          view[i + 2] = HEAPF32[(value + (4 * i + 8)) >> 2];
          view[i + 3] = HEAPF32[(value + (4 * i + 12)) >> 2];
        }
      } else {
        var view = HEAPF32.subarray(value >> 2, (value + count * 16) >> 2);
      }
      GLctx.uniform4fv(GL.uniforms[location], view);
    }
    function _glUniform4i(location, v0, v1, v2, v3) {
      GLctx.uniform4i(GL.uniforms[location], v0, v1, v2, v3);
    }
    function _glUniformBlockBinding(
      program,
      uniformBlockIndex,
      uniformBlockBinding
    ) {
      program = GL.programs[program];
      GLctx["uniformBlockBinding"](
        program,
        uniformBlockIndex,
        uniformBlockBinding
      );
    }
    function _glUniformMatrix2fv(location, count, transpose, value) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniformMatrix2fv(
          GL.uniforms[location],
          !!transpose,
          HEAPF32,
          value >> 2,
          count * 4
        );
        return;
      }
      if (4 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferViews[4 * count - 1];
        for (var i = 0; i < 4 * count; i += 4) {
          view[i] = HEAPF32[(value + 4 * i) >> 2];
          view[i + 1] = HEAPF32[(value + (4 * i + 4)) >> 2];
          view[i + 2] = HEAPF32[(value + (4 * i + 8)) >> 2];
          view[i + 3] = HEAPF32[(value + (4 * i + 12)) >> 2];
        }
      } else {
        var view = HEAPF32.subarray(value >> 2, (value + count * 16) >> 2);
      }
      GLctx.uniformMatrix2fv(GL.uniforms[location], !!transpose, view);
    }
    function _glUniformMatrix3fv(location, count, transpose, value) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniformMatrix3fv(
          GL.uniforms[location],
          !!transpose,
          HEAPF32,
          value >> 2,
          count * 9
        );
        return;
      }
      if (9 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferViews[9 * count - 1];
        for (var i = 0; i < 9 * count; i += 9) {
          view[i] = HEAPF32[(value + 4 * i) >> 2];
          view[i + 1] = HEAPF32[(value + (4 * i + 4)) >> 2];
          view[i + 2] = HEAPF32[(value + (4 * i + 8)) >> 2];
          view[i + 3] = HEAPF32[(value + (4 * i + 12)) >> 2];
          view[i + 4] = HEAPF32[(value + (4 * i + 16)) >> 2];
          view[i + 5] = HEAPF32[(value + (4 * i + 20)) >> 2];
          view[i + 6] = HEAPF32[(value + (4 * i + 24)) >> 2];
          view[i + 7] = HEAPF32[(value + (4 * i + 28)) >> 2];
          view[i + 8] = HEAPF32[(value + (4 * i + 32)) >> 2];
        }
      } else {
        var view = HEAPF32.subarray(value >> 2, (value + count * 36) >> 2);
      }
      GLctx.uniformMatrix3fv(GL.uniforms[location], !!transpose, view);
    }
    function _glUniformMatrix4fv(location, count, transpose, value) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        GLctx.uniformMatrix4fv(
          GL.uniforms[location],
          !!transpose,
          HEAPF32,
          value >> 2,
          count * 16
        );
        return;
      }
      if (16 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferViews[16 * count - 1];
        for (var i = 0; i < 16 * count; i += 16) {
          view[i] = HEAPF32[(value + 4 * i) >> 2];
          view[i + 1] = HEAPF32[(value + (4 * i + 4)) >> 2];
          view[i + 2] = HEAPF32[(value + (4 * i + 8)) >> 2];
          view[i + 3] = HEAPF32[(value + (4 * i + 12)) >> 2];
          view[i + 4] = HEAPF32[(value + (4 * i + 16)) >> 2];
          view[i + 5] = HEAPF32[(value + (4 * i + 20)) >> 2];
          view[i + 6] = HEAPF32[(value + (4 * i + 24)) >> 2];
          view[i + 7] = HEAPF32[(value + (4 * i + 28)) >> 2];
          view[i + 8] = HEAPF32[(value + (4 * i + 32)) >> 2];
          view[i + 9] = HEAPF32[(value + (4 * i + 36)) >> 2];
          view[i + 10] = HEAPF32[(value + (4 * i + 40)) >> 2];
          view[i + 11] = HEAPF32[(value + (4 * i + 44)) >> 2];
          view[i + 12] = HEAPF32[(value + (4 * i + 48)) >> 2];
          view[i + 13] = HEAPF32[(value + (4 * i + 52)) >> 2];
          view[i + 14] = HEAPF32[(value + (4 * i + 56)) >> 2];
          view[i + 15] = HEAPF32[(value + (4 * i + 60)) >> 2];
        }
      } else {
        var view = HEAPF32.subarray(value >> 2, (value + count * 64) >> 2);
      }
      GLctx.uniformMatrix4fv(GL.uniforms[location], !!transpose, view);
    }
    function _glUseProgram(program) {
      GLctx.useProgram(GL.programs[program]);
    }
    function _glVertexAttrib4f(x0, x1, x2, x3, x4) {
      GLctx["vertexAttrib4f"](x0, x1, x2, x3, x4);
    }
    function _glVertexAttrib4fv(index, v) {
      GLctx.vertexAttrib4f(
        index,
        HEAPF32[v >> 2],
        HEAPF32[(v + 4) >> 2],
        HEAPF32[(v + 8) >> 2],
        HEAPF32[(v + 12) >> 2]
      );
    }
    function _glVertexAttribDivisor(index, divisor) {
      GLctx["vertexAttribDivisor"](index, divisor);
    }
    function _glVertexAttribI4ui(x0, x1, x2, x3, x4) {
      GLctx["vertexAttribI4ui"](x0, x1, x2, x3, x4);
    }
    function _glVertexAttribIPointer(index, size, type, stride, ptr) {
      GLctx["vertexAttribIPointer"](index, size, type, stride, ptr);
    }
    function _glVertexAttribPointer(
      index,
      size,
      type,
      normalized,
      stride,
      ptr
    ) {
      GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr);
    }
    function _glViewport(x0, x1, x2, x3) {
      GLctx["viewport"](x0, x1, x2, x3);
    }
    var ___tm_current = 2115904;
    var ___tm_timezone = (stringToUTF8("GMT", 2115952, 4), 2115952);
    function _gmtime_r(time, tmPtr) {
      var date = new Date(HEAP32[time >> 2] * 1e3);
      HEAP32[tmPtr >> 2] = date.getUTCSeconds();
      HEAP32[(tmPtr + 4) >> 2] = date.getUTCMinutes();
      HEAP32[(tmPtr + 8) >> 2] = date.getUTCHours();
      HEAP32[(tmPtr + 12) >> 2] = date.getUTCDate();
      HEAP32[(tmPtr + 16) >> 2] = date.getUTCMonth();
      HEAP32[(tmPtr + 20) >> 2] = date.getUTCFullYear() - 1900;
      HEAP32[(tmPtr + 24) >> 2] = date.getUTCDay();
      HEAP32[(tmPtr + 36) >> 2] = 0;
      HEAP32[(tmPtr + 32) >> 2] = 0;
      var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
      var yday = ((date.getTime() - start) / (1e3 * 60 * 60 * 24)) | 0;
      HEAP32[(tmPtr + 28) >> 2] = yday;
      HEAP32[(tmPtr + 40) >> 2] = ___tm_timezone;
      return tmPtr;
    }
    function _gmtime(time) {
      return _gmtime_r(time, ___tm_current);
    }
    var GodotHTTPRequest = {
      requests: [],
      getUnusedRequestId: function() {
        var idMax = GodotHTTPRequest.requests.length;
        for (var potentialId = 0; potentialId < idMax; ++potentialId) {
          if (
            GodotHTTPRequest.requests[potentialId] instanceof XMLHttpRequest
          ) {
            continue;
          }
          return potentialId;
        }
        GodotHTTPRequest.requests.push(null);
        return idMax;
      },
      setupRequest: function(xhr) {
        xhr.responseType = "arraybuffer";
      }
    };
    function _godot_xhr_free(xhrId) {
      GodotHTTPRequest.requests[xhrId].abort();
      GodotHTTPRequest.requests[xhrId] = null;
    }
    function _godot_xhr_get_ready_state(xhrId) {
      return GodotHTTPRequest.requests[xhrId].readyState;
    }
    function _godot_xhr_get_response(xhrId, dst, len) {
      var buf = GodotHTTPRequest.requests[xhrId].response;
      if (buf === null) return;
      buf = new Uint8Array(buf).subarray(0, len);
      HEAPU8.set(buf, dst);
    }
    function _godot_xhr_get_response_headers(xhrId, dst, len) {
      var str = GodotHTTPRequest.requests[xhrId].getAllResponseHeaders();
      if (str === null) return;
      var buf = new Uint8Array(len + 1);
      stringToUTF8Array(str, buf, 0, buf.length);
      buf = buf.subarray(0, -1);
      HEAPU8.set(buf, dst);
    }
    function _godot_xhr_get_response_headers_length(xhrId) {
      var headers = GodotHTTPRequest.requests[xhrId].getAllResponseHeaders();
      return headers === null ? 0 : lengthBytesUTF8(headers);
    }
    function _godot_xhr_get_response_length(xhrId) {
      var body = GodotHTTPRequest.requests[xhrId].response;
      return body === null ? 0 : body.byteLength;
    }
    function _godot_xhr_get_status(xhrId) {
      return GodotHTTPRequest.requests[xhrId].status;
    }
    function _godot_xhr_new() {
      var newId = GodotHTTPRequest.getUnusedRequestId();
      GodotHTTPRequest.requests[newId] = new XMLHttpRequest();
      GodotHTTPRequest.setupRequest(GodotHTTPRequest.requests[newId]);
      return newId;
    }
    function _godot_xhr_open(xhrId, method, url, user, password) {
      user = user > 0 ? UTF8ToString(user) : null;
      password = password > 0 ? UTF8ToString(password) : null;
      GodotHTTPRequest.requests[xhrId].open(
        UTF8ToString(method),
        UTF8ToString(url),
        true,
        user,
        password
      );
    }
    function _godot_xhr_reset(xhrId) {
      GodotHTTPRequest.requests[xhrId] = new XMLHttpRequest();
      GodotHTTPRequest.setupRequest(GodotHTTPRequest.requests[xhrId]);
    }
    function _godot_xhr_send_data(xhrId, ptr, len) {
      if (!ptr) {
        err("Failed to send data per XHR: null pointer");
        return;
      }
      if (len < 0) {
        err("Failed to send data per XHR: buffer length less than 0");
        return;
      }
      GodotHTTPRequest.requests[xhrId].send(HEAPU8.subarray(ptr, ptr + len));
    }
    function _godot_xhr_send_string(xhrId, strPtr) {
      if (!strPtr) {
        err("Failed to send string per XHR: null pointer");
        return;
      }
      GodotHTTPRequest.requests[xhrId].send(UTF8ToString(strPtr));
    }
    function _godot_xhr_set_request_header(xhrId, header, value) {
      GodotHTTPRequest.requests[xhrId].setRequestHeader(
        UTF8ToString(header),
        UTF8ToString(value)
      );
    }
    function _inet_addr(ptr) {
      var addr = __inet_pton4_raw(UTF8ToString(ptr));
      if (addr === null) {
        return -1;
      }
      return addr;
    }
    function _kill(pid, sig) {
      ___setErrNo(ERRNO_CODES.EPERM);
      return -1;
    }
    function _tzset() {
      if (_tzset.called) return;
      _tzset.called = true;
      HEAP32[__get_timezone() >> 2] = new Date().getTimezoneOffset() * 60;
      var currentYear = new Date().getFullYear();
      var winter = new Date(currentYear, 0, 1);
      var summer = new Date(currentYear, 6, 1);
      HEAP32[__get_daylight() >> 2] = Number(
        winter.getTimezoneOffset() != summer.getTimezoneOffset()
      );
      function extractZone(date) {
        var match = date.toTimeString().match(/\(([A-Za-z ]+)\)$/);
        return match ? match[1] : "GMT";
      }
      var winterName = extractZone(winter);
      var summerName = extractZone(summer);
      var winterNamePtr = allocate(
        intArrayFromString(winterName),
        "i8",
        ALLOC_NORMAL
      );
      var summerNamePtr = allocate(
        intArrayFromString(summerName),
        "i8",
        ALLOC_NORMAL
      );
      if (summer.getTimezoneOffset() < winter.getTimezoneOffset()) {
        HEAP32[__get_tzname() >> 2] = winterNamePtr;
        HEAP32[(__get_tzname() + 4) >> 2] = summerNamePtr;
      } else {
        HEAP32[__get_tzname() >> 2] = summerNamePtr;
        HEAP32[(__get_tzname() + 4) >> 2] = winterNamePtr;
      }
    }
    function _localtime_r(time, tmPtr) {
      _tzset();
      var date = new Date(HEAP32[time >> 2] * 1e3);
      HEAP32[tmPtr >> 2] = date.getSeconds();
      HEAP32[(tmPtr + 4) >> 2] = date.getMinutes();
      HEAP32[(tmPtr + 8) >> 2] = date.getHours();
      HEAP32[(tmPtr + 12) >> 2] = date.getDate();
      HEAP32[(tmPtr + 16) >> 2] = date.getMonth();
      HEAP32[(tmPtr + 20) >> 2] = date.getFullYear() - 1900;
      HEAP32[(tmPtr + 24) >> 2] = date.getDay();
      var start = new Date(date.getFullYear(), 0, 1);
      var yday =
        ((date.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24)) | 0;
      HEAP32[(tmPtr + 28) >> 2] = yday;
      HEAP32[(tmPtr + 36) >> 2] = -(date.getTimezoneOffset() * 60);
      var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
      var winterOffset = start.getTimezoneOffset();
      var dst =
        (summerOffset != winterOffset &&
          date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
      HEAP32[(tmPtr + 32) >> 2] = dst;
      var zonePtr = HEAP32[(__get_tzname() + (dst ? 4 : 0)) >> 2];
      HEAP32[(tmPtr + 40) >> 2] = zonePtr;
      return tmPtr;
    }
    function _localtime(time) {
      return _localtime_r(time, ___tm_current);
    }
    function _usleep(useconds) {
      var msec = useconds / 1e3;
      if (
        (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) &&
        self["performance"] &&
        self["performance"]["now"]
      ) {
        var start = self["performance"]["now"]();
        while (self["performance"]["now"]() - start < msec) {}
      } else {
        var start = Date.now();
        while (Date.now() - start < msec) {}
      }
      return 0;
    }
    function _nanosleep(rqtp, rmtp) {
      if (rqtp === 0) {
        ___setErrNo(28);
        return -1;
      }
      var seconds = HEAP32[rqtp >> 2];
      var nanoseconds = HEAP32[(rqtp + 4) >> 2];
      if (nanoseconds < 0 || nanoseconds > 999999999 || seconds < 0) {
        ___setErrNo(28);
        return -1;
      }
      if (rmtp !== 0) {
        HEAP32[rmtp >> 2] = 0;
        HEAP32[(rmtp + 4) >> 2] = 0;
      }
      return _usleep(seconds * 1e6 + nanoseconds / 1e3);
    }
    function _round(d) {
      d = +d;
      return d >= +0 ? +Math_floor(d + +0.5) : +Math_ceil(d - +0.5);
    }
    function _setTempRet0($i) {
      setTempRet0($i | 0);
    }
    function _sigaction(signum, act, oldact) {
      return 0;
    }
    function __isLeapYear(year) {
      return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    }
    function __arraySum(array, index) {
      var sum = 0;
      for (var i = 0; i <= index; sum += array[i++]);
      return sum;
    }
    var __MONTH_DAYS_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var __MONTH_DAYS_REGULAR = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    function __addDays(date, days) {
      var newDate = new Date(date.getTime());
      while (days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap
          ? __MONTH_DAYS_LEAP
          : __MONTH_DAYS_REGULAR)[currentMonth];
        if (days > daysInCurrentMonth - newDate.getDate()) {
          days -= daysInCurrentMonth - newDate.getDate() + 1;
          newDate.setDate(1);
          if (currentMonth < 11) {
            newDate.setMonth(currentMonth + 1);
          } else {
            newDate.setMonth(0);
            newDate.setFullYear(newDate.getFullYear() + 1);
          }
        } else {
          newDate.setDate(newDate.getDate() + days);
          return newDate;
        }
      }
      return newDate;
    }
    function _strftime(s, maxsize, format, tm) {
      var tm_zone = HEAP32[(tm + 40) >> 2];
      var date = {
        tm_sec: HEAP32[tm >> 2],
        tm_min: HEAP32[(tm + 4) >> 2],
        tm_hour: HEAP32[(tm + 8) >> 2],
        tm_mday: HEAP32[(tm + 12) >> 2],
        tm_mon: HEAP32[(tm + 16) >> 2],
        tm_year: HEAP32[(tm + 20) >> 2],
        tm_wday: HEAP32[(tm + 24) >> 2],
        tm_yday: HEAP32[(tm + 28) >> 2],
        tm_isdst: HEAP32[(tm + 32) >> 2],
        tm_gmtoff: HEAP32[(tm + 36) >> 2],
        tm_zone: tm_zone ? UTF8ToString(tm_zone) : ""
      };
      var pattern = UTF8ToString(format);
      var EXPANSION_RULES_1 = {
        "%c": "%a %b %d %H:%M:%S %Y",
        "%D": "%m/%d/%y",
        "%F": "%Y-%m-%d",
        "%h": "%b",
        "%r": "%I:%M:%S %p",
        "%R": "%H:%M",
        "%T": "%H:%M:%S",
        "%x": "%m/%d/%y",
        "%X": "%H:%M:%S",
        "%Ec": "%c",
        "%EC": "%C",
        "%Ex": "%m/%d/%y",
        "%EX": "%H:%M:%S",
        "%Ey": "%y",
        "%EY": "%Y",
        "%Od": "%d",
        "%Oe": "%e",
        "%OH": "%H",
        "%OI": "%I",
        "%Om": "%m",
        "%OM": "%M",
        "%OS": "%S",
        "%Ou": "%u",
        "%OU": "%U",
        "%OV": "%V",
        "%Ow": "%w",
        "%OW": "%W",
        "%Oy": "%y"
      };
      for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(
          new RegExp(rule, "g"),
          EXPANSION_RULES_1[rule]
        );
      }
      var WEEKDAYS = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ];
      var MONTHS = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
      ];
      function leadingSomething(value, digits, character) {
        var str = typeof value === "number" ? value.toString() : value || "";
        while (str.length < digits) {
          str = character[0] + str;
        }
        return str;
      }
      function leadingNulls(value, digits) {
        return leadingSomething(value, digits, "0");
      }
      function compareByDay(date1, date2) {
        function sgn(value) {
          return value < 0 ? -1 : value > 0 ? 1 : 0;
        }
        var compare;
        if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
          if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
            compare = sgn(date1.getDate() - date2.getDate());
          }
        }
        return compare;
      }
      function getFirstWeekStartDate(janFourth) {
        switch (janFourth.getDay()) {
          case 0:
            return new Date(janFourth.getFullYear() - 1, 11, 29);
          case 1:
            return janFourth;
          case 2:
            return new Date(janFourth.getFullYear(), 0, 3);
          case 3:
            return new Date(janFourth.getFullYear(), 0, 2);
          case 4:
            return new Date(janFourth.getFullYear(), 0, 1);
          case 5:
            return new Date(janFourth.getFullYear() - 1, 11, 31);
          case 6:
            return new Date(janFourth.getFullYear() - 1, 11, 30);
        }
      }
      function getWeekBasedYear(date) {
        var thisDate = __addDays(
          new Date(date.tm_year + 1900, 0, 1),
          date.tm_yday
        );
        var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
        var janFourthNextYear = new Date(thisDate.getFullYear() + 1, 0, 4);
        var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
        var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
        if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
          if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
            return thisDate.getFullYear() + 1;
          } else {
            return thisDate.getFullYear();
          }
        } else {
          return thisDate.getFullYear() - 1;
        }
      }
      var EXPANSION_RULES_2 = {
        "%a": function(date) {
          return WEEKDAYS[date.tm_wday].substring(0, 3);
        },
        "%A": function(date) {
          return WEEKDAYS[date.tm_wday];
        },
        "%b": function(date) {
          return MONTHS[date.tm_mon].substring(0, 3);
        },
        "%B": function(date) {
          return MONTHS[date.tm_mon];
        },
        "%C": function(date) {
          var year = date.tm_year + 1900;
          return leadingNulls((year / 100) | 0, 2);
        },
        "%d": function(date) {
          return leadingNulls(date.tm_mday, 2);
        },
        "%e": function(date) {
          return leadingSomething(date.tm_mday, 2, " ");
        },
        "%g": function(date) {
          return getWeekBasedYear(date)
            .toString()
            .substring(2);
        },
        "%G": function(date) {
          return getWeekBasedYear(date);
        },
        "%H": function(date) {
          return leadingNulls(date.tm_hour, 2);
        },
        "%I": function(date) {
          var twelveHour = date.tm_hour;
          if (twelveHour == 0) twelveHour = 12;
          else if (twelveHour > 12) twelveHour -= 12;
          return leadingNulls(twelveHour, 2);
        },
        "%j": function(date) {
          return leadingNulls(
            date.tm_mday +
              __arraySum(
                __isLeapYear(date.tm_year + 1900)
                  ? __MONTH_DAYS_LEAP
                  : __MONTH_DAYS_REGULAR,
                date.tm_mon - 1
              ),
            3
          );
        },
        "%m": function(date) {
          return leadingNulls(date.tm_mon + 1, 2);
        },
        "%M": function(date) {
          return leadingNulls(date.tm_min, 2);
        },
        "%n": function() {
          return "\n";
        },
        "%p": function(date) {
          if (date.tm_hour >= 0 && date.tm_hour < 12) {
            return "AM";
          } else {
            return "PM";
          }
        },
        "%S": function(date) {
          return leadingNulls(date.tm_sec, 2);
        },
        "%t": function() {
          return "\t";
        },
        "%u": function(date) {
          return date.tm_wday || 7;
        },
        "%U": function(date) {
          var janFirst = new Date(date.tm_year + 1900, 0, 1);
          var firstSunday =
            janFirst.getDay() === 0
              ? janFirst
              : __addDays(janFirst, 7 - janFirst.getDay());
          var endDate = new Date(
            date.tm_year + 1900,
            date.tm_mon,
            date.tm_mday
          );
          if (compareByDay(firstSunday, endDate) < 0) {
            var februaryFirstUntilEndMonth =
              __arraySum(
                __isLeapYear(endDate.getFullYear())
                  ? __MONTH_DAYS_LEAP
                  : __MONTH_DAYS_REGULAR,
                endDate.getMonth() - 1
              ) - 31;
            var firstSundayUntilEndJanuary = 31 - firstSunday.getDate();
            var days =
              firstSundayUntilEndJanuary +
              februaryFirstUntilEndMonth +
              endDate.getDate();
            return leadingNulls(Math.ceil(days / 7), 2);
          }
          return compareByDay(firstSunday, janFirst) === 0 ? "01" : "00";
        },
        "%V": function(date) {
          var janFourthThisYear = new Date(date.tm_year + 1900, 0, 4);
          var janFourthNextYear = new Date(date.tm_year + 1901, 0, 4);
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
          var endDate = __addDays(
            new Date(date.tm_year + 1900, 0, 1),
            date.tm_yday
          );
          if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
            return "53";
          }
          if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
            return "01";
          }
          var daysDifference;
          if (firstWeekStartThisYear.getFullYear() < date.tm_year + 1900) {
            daysDifference =
              date.tm_yday + 32 - firstWeekStartThisYear.getDate();
          } else {
            daysDifference =
              date.tm_yday + 1 - firstWeekStartThisYear.getDate();
          }
          return leadingNulls(Math.ceil(daysDifference / 7), 2);
        },
        "%w": function(date) {
          return date.tm_wday;
        },
        "%W": function(date) {
          var janFirst = new Date(date.tm_year, 0, 1);
          var firstMonday =
            janFirst.getDay() === 1
              ? janFirst
              : __addDays(
                  janFirst,
                  janFirst.getDay() === 0 ? 1 : 7 - janFirst.getDay() + 1
                );
          var endDate = new Date(
            date.tm_year + 1900,
            date.tm_mon,
            date.tm_mday
          );
          if (compareByDay(firstMonday, endDate) < 0) {
            var februaryFirstUntilEndMonth =
              __arraySum(
                __isLeapYear(endDate.getFullYear())
                  ? __MONTH_DAYS_LEAP
                  : __MONTH_DAYS_REGULAR,
                endDate.getMonth() - 1
              ) - 31;
            var firstMondayUntilEndJanuary = 31 - firstMonday.getDate();
            var days =
              firstMondayUntilEndJanuary +
              februaryFirstUntilEndMonth +
              endDate.getDate();
            return leadingNulls(Math.ceil(days / 7), 2);
          }
          return compareByDay(firstMonday, janFirst) === 0 ? "01" : "00";
        },
        "%y": function(date) {
          return (date.tm_year + 1900).toString().substring(2);
        },
        "%Y": function(date) {
          return date.tm_year + 1900;
        },
        "%z": function(date) {
          var off = date.tm_gmtoff;
          var ahead = off >= 0;
          off = Math.abs(off) / 60;
          off = (off / 60) * 100 + (off % 60);
          return (ahead ? "+" : "-") + String("0000" + off).slice(-4);
        },
        "%Z": function(date) {
          return date.tm_zone;
        },
        "%%": function() {
          return "%";
        }
      };
      for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
          pattern = pattern.replace(
            new RegExp(rule, "g"),
            EXPANSION_RULES_2[rule](date)
          );
        }
      }
      var bytes = intArrayFromString(pattern, false);
      if (bytes.length > maxsize) {
        return 0;
      }
      writeArrayToMemory(bytes, s);
      return bytes.length - 1;
    }
    function _strftime_l(s, maxsize, format, tm) {
      return _strftime(s, maxsize, format, tm);
    }
    function _sysconf(name) {
      switch (name) {
        case 30:
          return PAGE_SIZE;
        case 85:
          var maxHeapSize = 2 * 1024 * 1024 * 1024 - 65536;
          return maxHeapSize / PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 79:
          return 0;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0:
          return 2097152;
        case 3:
          return 65536;
        case 28:
          return 32768;
        case 44:
          return 32767;
        case 75:
          return 16384;
        case 39:
          return 1e3;
        case 89:
          return 700;
        case 71:
          return 256;
        case 40:
          return 255;
        case 2:
          return 100;
        case 180:
          return 64;
        case 25:
          return 20;
        case 5:
          return 16;
        case 6:
          return 6;
        case 73:
          return 4;
        case 84: {
          if (typeof navigator === "object")
            return navigator["hardwareConcurrency"] || 1;
          return 1;
        }
      }
      ___setErrNo(28);
      return -1;
    }
    function _time(ptr) {
      var ret = (Date.now() / 1e3) | 0;
      if (ptr) {
        HEAP32[ptr >> 2] = ret;
      }
      return ret;
    }
    function _wait(stat_loc) {
      ___setErrNo(12);
      return -1;
    }
    function _waitpid() {
      return _wait.apply(null, arguments);
    }
    FS.staticInit();
    if (ENVIRONMENT_HAS_NODE) {
      var fs = require("fs");
      var NODEJS_PATH = require("path");
      NODEFS.staticInit();
    }
    if (ENVIRONMENT_IS_NODE) {
      _emscripten_get_now = function _emscripten_get_now_actual() {
        var t = process["hrtime"]();
        return t[0] * 1e3 + t[1] / 1e6;
      };
    } else if (typeof dateNow !== "undefined") {
      _emscripten_get_now = dateNow;
    } else if (
      typeof performance === "object" &&
      performance &&
      typeof performance["now"] === "function"
    ) {
      _emscripten_get_now = function() {
        return performance["now"]();
      };
    } else {
      _emscripten_get_now = Date.now;
    }
    Module["requestFullScreen"] = function Module_requestFullScreen(
      lockPointer,
      resizeCanvas,
      vrDevice
    ) {
      err(
        "Module.requestFullScreen is deprecated. Please call Module.requestFullscreen instead."
      );
      Module["requestFullScreen"] = Module["requestFullscreen"];
      Browser.requestFullScreen(lockPointer, resizeCanvas, vrDevice);
    };
    Module["requestFullscreen"] = function Module_requestFullscreen(
      lockPointer,
      resizeCanvas,
      vrDevice
    ) {
      Browser.requestFullscreen(lockPointer, resizeCanvas, vrDevice);
    };
    Module["requestAnimationFrame"] = function Module_requestAnimationFrame(
      func
    ) {
      Browser.requestAnimationFrame(func);
    };
    Module["setCanvasSize"] = function Module_setCanvasSize(
      width,
      height,
      noUpdates
    ) {
      Browser.setCanvasSize(width, height, noUpdates);
    };
    Module["pauseMainLoop"] = function Module_pauseMainLoop() {
      Browser.mainLoop.pause();
    };
    Module["resumeMainLoop"] = function Module_resumeMainLoop() {
      Browser.mainLoop.resume();
    };
    Module["getUserMedia"] = function Module_getUserMedia() {
      Browser.getUserMedia();
    };
    Module["createContext"] = function Module_createContext(
      canvas,
      useWebGL,
      setInModule,
      webGLContextAttributes
    ) {
      return Browser.createContext(
        canvas,
        useWebGL,
        setInModule,
        webGLContextAttributes
      );
    };
    var GLctx;
    GL.init();
    for (var i = 0; i < 32; i++) __tempFixedLengthArray.push(new Array(i));
    function intArrayFromString(stringy, dontAddNull, length) {
      var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
      var u8array = new Array(len);
      var numBytesWritten = stringToUTF8Array(
        stringy,
        u8array,
        0,
        u8array.length
      );
      if (dontAddNull) u8array.length = numBytesWritten;
      return u8array;
    }
    var asmLibraryArg = {
      a: ___assert_fail,
      Ob: ___lock,
      Ci: ___map_file,
      Bi: ___syscall10,
      ra: ___syscall102,
      Ai: ___syscall12,
      zi: ___syscall140,
      yi: ___syscall142,
      xi: ___syscall145,
      wi: ___syscall15,
      vi: ___syscall168,
      ui: ___syscall183,
      ti: ___syscall195,
      si: ___syscall20,
      ri: ___syscall220,
      Z: ___syscall221,
      qi: ___syscall268,
      pi: ___syscall3,
      oi: ___syscall33,
      ni: ___syscall38,
      mi: ___syscall39,
      li: ___syscall4,
      ki: ___syscall40,
      Nb: ___syscall5,
      rb: ___syscall54,
      ji: ___syscall91,
      Ra: ___unlock,
      qa: _abort,
      ab: _clock_gettime,
      fi: _dlclose,
      qb: _dlerror,
      ei: _dlopen,
      di: _dlsym,
      Mb: _eglGetProcAddress,
      z: _emscripten_asm_const_iii,
      Lb: _emscripten_enter_soft_fullscreen,
      ci: _emscripten_exit_fullscreen,
      Kb: _emscripten_exit_pointerlock,
      pb: _emscripten_exit_soft_fullscreen,
      ob: _emscripten_get_canvas_element_size,
      bi: _emscripten_get_element_css_size,
      ai: _emscripten_get_fullscreen_status,
      $h: _emscripten_get_gamepad_status,
      _h: _emscripten_get_now,
      Zh: _emscripten_get_num_gamepads,
      Yh: _emscripten_get_pointerlock_status,
      Xh: _emscripten_glActiveTexture,
      Wh: _emscripten_glAttachShader,
      Vh: _emscripten_glBeginQuery,
      Uh: _emscripten_glBeginQueryEXT,
      Th: _emscripten_glBeginTransformFeedback,
      Sh: _emscripten_glBindAttribLocation,
      Rh: _emscripten_glBindBuffer,
      Qh: _emscripten_glBindBufferBase,
      Ph: _emscripten_glBindBufferRange,
      Oh: _emscripten_glBindFramebuffer,
      Nh: _emscripten_glBindRenderbuffer,
      Mh: _emscripten_glBindSampler,
      Lh: _emscripten_glBindTexture,
      Kh: _emscripten_glBindTransformFeedback,
      Jh: _emscripten_glBindVertexArray,
      Ih: _emscripten_glBindVertexArrayOES,
      Hh: _emscripten_glBlendColor,
      Gh: _emscripten_glBlendEquation,
      Fh: _emscripten_glBlendEquationSeparate,
      Eh: _emscripten_glBlendFunc,
      Dh: _emscripten_glBlendFuncSeparate,
      Ch: _emscripten_glBlitFramebuffer,
      Bh: _emscripten_glBufferData,
      Ah: _emscripten_glBufferSubData,
      zh: _emscripten_glCheckFramebufferStatus,
      yh: _emscripten_glClear,
      xh: _emscripten_glClearBufferfi,
      wh: _emscripten_glClearBufferfv,
      vh: _emscripten_glClearBufferiv,
      uh: _emscripten_glClearBufferuiv,
      th: _emscripten_glClearColor,
      sh: _emscripten_glClearDepthf,
      rh: _emscripten_glClearStencil,
      qh: _emscripten_glClientWaitSync,
      ph: _emscripten_glColorMask,
      oh: _emscripten_glCompileShader,
      nh: _emscripten_glCompressedTexImage2D,
      mh: _emscripten_glCompressedTexImage3D,
      lh: _emscripten_glCompressedTexSubImage2D,
      kh: _emscripten_glCompressedTexSubImage3D,
      jh: _emscripten_glCopyBufferSubData,
      ih: _emscripten_glCopyTexImage2D,
      hh: _emscripten_glCopyTexSubImage2D,
      gh: _emscripten_glCopyTexSubImage3D,
      fh: _emscripten_glCreateProgram,
      eh: _emscripten_glCreateShader,
      dh: _emscripten_glCullFace,
      ch: _emscripten_glDeleteBuffers,
      bh: _emscripten_glDeleteFramebuffers,
      ah: _emscripten_glDeleteProgram,
      $g: _emscripten_glDeleteQueries,
      _g: _emscripten_glDeleteQueriesEXT,
      Zg: _emscripten_glDeleteRenderbuffers,
      Yg: _emscripten_glDeleteSamplers,
      Xg: _emscripten_glDeleteShader,
      Wg: _emscripten_glDeleteSync,
      Vg: _emscripten_glDeleteTextures,
      Ug: _emscripten_glDeleteTransformFeedbacks,
      Tg: _emscripten_glDeleteVertexArrays,
      Sg: _emscripten_glDeleteVertexArraysOES,
      Rg: _emscripten_glDepthFunc,
      Qg: _emscripten_glDepthMask,
      Pg: _emscripten_glDepthRangef,
      Og: _emscripten_glDetachShader,
      Ng: _emscripten_glDisable,
      Mg: _emscripten_glDisableVertexAttribArray,
      Lg: _emscripten_glDrawArrays,
      Kg: _emscripten_glDrawArraysInstanced,
      Jg: _emscripten_glDrawArraysInstancedANGLE,
      Ig: _emscripten_glDrawArraysInstancedARB,
      Hg: _emscripten_glDrawArraysInstancedEXT,
      Gg: _emscripten_glDrawArraysInstancedNV,
      Fg: _emscripten_glDrawBuffers,
      Eg: _emscripten_glDrawBuffersEXT,
      Dg: _emscripten_glDrawBuffersWEBGL,
      Cg: _emscripten_glDrawElements,
      Bg: _emscripten_glDrawElementsInstanced,
      Ag: _emscripten_glDrawElementsInstancedANGLE,
      zg: _emscripten_glDrawElementsInstancedARB,
      yg: _emscripten_glDrawElementsInstancedEXT,
      xg: _emscripten_glDrawElementsInstancedNV,
      wg: _emscripten_glDrawRangeElements,
      vg: _emscripten_glEnable,
      ug: _emscripten_glEnableVertexAttribArray,
      tg: _emscripten_glEndQuery,
      sg: _emscripten_glEndQueryEXT,
      rg: _emscripten_glEndTransformFeedback,
      qg: _emscripten_glFenceSync,
      pg: _emscripten_glFinish,
      og: _emscripten_glFlush,
      ng: _emscripten_glFlushMappedBufferRange,
      mg: _emscripten_glFramebufferRenderbuffer,
      lg: _emscripten_glFramebufferTexture2D,
      kg: _emscripten_glFramebufferTextureLayer,
      jg: _emscripten_glFrontFace,
      ig: _emscripten_glGenBuffers,
      hg: _emscripten_glGenFramebuffers,
      gg: _emscripten_glGenQueries,
      fg: _emscripten_glGenQueriesEXT,
      eg: _emscripten_glGenRenderbuffers,
      dg: _emscripten_glGenSamplers,
      cg: _emscripten_glGenTextures,
      bg: _emscripten_glGenTransformFeedbacks,
      ag: _emscripten_glGenVertexArrays,
      $f: _emscripten_glGenVertexArraysOES,
      _f: _emscripten_glGenerateMipmap,
      Zf: _emscripten_glGetActiveAttrib,
      Yf: _emscripten_glGetActiveUniform,
      Xf: _emscripten_glGetActiveUniformBlockName,
      Wf: _emscripten_glGetActiveUniformBlockiv,
      Vf: _emscripten_glGetActiveUniformsiv,
      Uf: _emscripten_glGetAttachedShaders,
      Tf: _emscripten_glGetAttribLocation,
      Sf: _emscripten_glGetBooleanv,
      Rf: _emscripten_glGetBufferParameteri64v,
      Qf: _emscripten_glGetBufferParameteriv,
      Pf: _emscripten_glGetBufferPointerv,
      Of: _emscripten_glGetError,
      Nf: _emscripten_glGetFloatv,
      Mf: _emscripten_glGetFragDataLocation,
      Lf: _emscripten_glGetFramebufferAttachmentParameteriv,
      Kf: _emscripten_glGetInteger64i_v,
      Jf: _emscripten_glGetInteger64v,
      If: _emscripten_glGetIntegeri_v,
      Hf: _emscripten_glGetIntegerv,
      Gf: _emscripten_glGetInternalformativ,
      Ff: _emscripten_glGetProgramBinary,
      Ef: _emscripten_glGetProgramInfoLog,
      Df: _emscripten_glGetProgramiv,
      Cf: _emscripten_glGetQueryObjecti64vEXT,
      Bf: _emscripten_glGetQueryObjectivEXT,
      Af: _emscripten_glGetQueryObjectui64vEXT,
      zf: _emscripten_glGetQueryObjectuiv,
      yf: _emscripten_glGetQueryObjectuivEXT,
      xf: _emscripten_glGetQueryiv,
      wf: _emscripten_glGetQueryivEXT,
      vf: _emscripten_glGetRenderbufferParameteriv,
      uf: _emscripten_glGetSamplerParameterfv,
      tf: _emscripten_glGetSamplerParameteriv,
      sf: _emscripten_glGetShaderInfoLog,
      rf: _emscripten_glGetShaderPrecisionFormat,
      qf: _emscripten_glGetShaderSource,
      pf: _emscripten_glGetShaderiv,
      of: _emscripten_glGetString,
      nf: _emscripten_glGetStringi,
      mf: _emscripten_glGetSynciv,
      lf: _emscripten_glGetTexParameterfv,
      kf: _emscripten_glGetTexParameteriv,
      jf: _emscripten_glGetTransformFeedbackVarying,
      hf: _emscripten_glGetUniformBlockIndex,
      gf: _emscripten_glGetUniformIndices,
      ff: _emscripten_glGetUniformLocation,
      ef: _emscripten_glGetUniformfv,
      df: _emscripten_glGetUniformiv,
      cf: _emscripten_glGetUniformuiv,
      bf: _emscripten_glGetVertexAttribIiv,
      af: _emscripten_glGetVertexAttribIuiv,
      $e: _emscripten_glGetVertexAttribPointerv,
      _e: _emscripten_glGetVertexAttribfv,
      Ze: _emscripten_glGetVertexAttribiv,
      Ye: _emscripten_glHint,
      Xe: _emscripten_glInvalidateFramebuffer,
      We: _emscripten_glInvalidateSubFramebuffer,
      Ve: _emscripten_glIsBuffer,
      Ue: _emscripten_glIsEnabled,
      Te: _emscripten_glIsFramebuffer,
      Se: _emscripten_glIsProgram,
      Re: _emscripten_glIsQuery,
      Qe: _emscripten_glIsQueryEXT,
      Pe: _emscripten_glIsRenderbuffer,
      Oe: _emscripten_glIsSampler,
      Ne: _emscripten_glIsShader,
      Me: _emscripten_glIsSync,
      Le: _emscripten_glIsTexture,
      Ke: _emscripten_glIsTransformFeedback,
      Je: _emscripten_glIsVertexArray,
      Ie: _emscripten_glIsVertexArrayOES,
      He: _emscripten_glLineWidth,
      Ge: _emscripten_glLinkProgram,
      Fe: _emscripten_glMapBufferRange,
      Ee: _emscripten_glPauseTransformFeedback,
      De: _emscripten_glPixelStorei,
      Ce: _emscripten_glPolygonOffset,
      Be: _emscripten_glProgramBinary,
      Ae: _emscripten_glProgramParameteri,
      ze: _emscripten_glQueryCounterEXT,
      ye: _emscripten_glReadBuffer,
      xe: _emscripten_glReadPixels,
      we: _emscripten_glReleaseShaderCompiler,
      ve: _emscripten_glRenderbufferStorage,
      ue: _emscripten_glRenderbufferStorageMultisample,
      te: _emscripten_glResumeTransformFeedback,
      se: _emscripten_glSampleCoverage,
      re: _emscripten_glSamplerParameterf,
      qe: _emscripten_glSamplerParameterfv,
      pe: _emscripten_glSamplerParameteri,
      oe: _emscripten_glSamplerParameteriv,
      ne: _emscripten_glScissor,
      me: _emscripten_glShaderBinary,
      le: _emscripten_glShaderSource,
      ke: _emscripten_glStencilFunc,
      je: _emscripten_glStencilFuncSeparate,
      ie: _emscripten_glStencilMask,
      he: _emscripten_glStencilMaskSeparate,
      ge: _emscripten_glStencilOp,
      fe: _emscripten_glStencilOpSeparate,
      ee: _emscripten_glTexImage2D,
      de: _emscripten_glTexImage3D,
      ce: _emscripten_glTexParameterf,
      be: _emscripten_glTexParameterfv,
      ae: _emscripten_glTexParameteri,
      $d: _emscripten_glTexParameteriv,
      _d: _emscripten_glTexStorage2D,
      Zd: _emscripten_glTexStorage3D,
      Yd: _emscripten_glTexSubImage2D,
      Xd: _emscripten_glTexSubImage3D,
      Wd: _emscripten_glTransformFeedbackVaryings,
      Vd: _emscripten_glUniform1f,
      Ud: _emscripten_glUniform1fv,
      Td: _emscripten_glUniform1i,
      Sd: _emscripten_glUniform1iv,
      Rd: _emscripten_glUniform1ui,
      Qd: _emscripten_glUniform1uiv,
      Pd: _emscripten_glUniform2f,
      Od: _emscripten_glUniform2fv,
      Nd: _emscripten_glUniform2i,
      Md: _emscripten_glUniform2iv,
      Ld: _emscripten_glUniform2ui,
      Kd: _emscripten_glUniform2uiv,
      Jd: _emscripten_glUniform3f,
      Id: _emscripten_glUniform3fv,
      Hd: _emscripten_glUniform3i,
      Gd: _emscripten_glUniform3iv,
      Fd: _emscripten_glUniform3ui,
      Ed: _emscripten_glUniform3uiv,
      Dd: _emscripten_glUniform4f,
      Cd: _emscripten_glUniform4fv,
      Bd: _emscripten_glUniform4i,
      Ad: _emscripten_glUniform4iv,
      zd: _emscripten_glUniform4ui,
      yd: _emscripten_glUniform4uiv,
      xd: _emscripten_glUniformBlockBinding,
      wd: _emscripten_glUniformMatrix2fv,
      vd: _emscripten_glUniformMatrix2x3fv,
      ud: _emscripten_glUniformMatrix2x4fv,
      td: _emscripten_glUniformMatrix3fv,
      sd: _emscripten_glUniformMatrix3x2fv,
      rd: _emscripten_glUniformMatrix3x4fv,
      qd: _emscripten_glUniformMatrix4fv,
      pd: _emscripten_glUniformMatrix4x2fv,
      od: _emscripten_glUniformMatrix4x3fv,
      nd: _emscripten_glUnmapBuffer,
      md: _emscripten_glUseProgram,
      ld: _emscripten_glValidateProgram,
      kd: _emscripten_glVertexAttrib1f,
      jd: _emscripten_glVertexAttrib1fv,
      id: _emscripten_glVertexAttrib2f,
      hd: _emscripten_glVertexAttrib2fv,
      gd: _emscripten_glVertexAttrib3f,
      fd: _emscripten_glVertexAttrib3fv,
      ed: _emscripten_glVertexAttrib4f,
      dd: _emscripten_glVertexAttrib4fv,
      cd: _emscripten_glVertexAttribDivisor,
      bd: _emscripten_glVertexAttribDivisorANGLE,
      ad: _emscripten_glVertexAttribDivisorARB,
      $c: _emscripten_glVertexAttribDivisorEXT,
      _c: _emscripten_glVertexAttribDivisorNV,
      Zc: _emscripten_glVertexAttribI4i,
      Yc: _emscripten_glVertexAttribI4iv,
      Xc: _emscripten_glVertexAttribI4ui,
      Wc: _emscripten_glVertexAttribI4uiv,
      Vc: _emscripten_glVertexAttribIPointer,
      Uc: _emscripten_glVertexAttribPointer,
      Tc: _emscripten_glViewport,
      Sc: _emscripten_glWaitSync,
      J: _emscripten_longjmp,
      Rc: _emscripten_memcpy_big,
      Qc: _emscripten_request_fullscreen_strategy,
      Pc: _emscripten_request_pointerlock,
      Oc: _emscripten_resize_heap,
      Nc: _emscripten_sample_gamepad_data,
      Jb: _emscripten_set_canvas_element_size,
      Mc: _emscripten_set_fullscreenchange_callback_on_thread,
      Lc: _emscripten_set_gamepadconnected_callback_on_thread,
      Kc: _emscripten_set_gamepaddisconnected_callback_on_thread,
      Jc: _emscripten_set_keydown_callback_on_thread,
      Ic: _emscripten_set_keypress_callback_on_thread,
      Hc: _emscripten_set_keyup_callback_on_thread,
      Gc: _emscripten_set_main_loop,
      Fc: _emscripten_set_mousedown_callback_on_thread,
      Ec: _emscripten_set_mousemove_callback_on_thread,
      Dc: _emscripten_set_mouseup_callback_on_thread,
      Cc: _emscripten_set_touchcancel_callback_on_thread,
      Bc: _emscripten_set_touchend_callback_on_thread,
      Ac: _emscripten_set_touchmove_callback_on_thread,
      zc: _emscripten_set_touchstart_callback_on_thread,
      yc: _emscripten_set_wheel_callback_on_thread,
      xc: _emscripten_webgl_create_context,
      wc: _emscripten_webgl_init_context_attributes,
      vc: _emscripten_webgl_make_context_current,
      ii: _environ_get,
      hi: _environ_sizes_get,
      uc: _exit,
      Da: _fd_close,
      gi: _fd_write,
      nb: _gai_strerror,
      n: _getTempRet0,
      mb: _getaddrinfo,
      tc: _getnameinfo,
      Ib: _gettimeofday,
      c: _glActiveTexture,
      $a: _glAttachShader,
      lb: _glBeginTransformFeedback,
      Hb: _glBindAttribLocation,
      d: _glBindBuffer,
      W: _glBindBufferBase,
      f: _glBindFramebuffer,
      ha: _glBindRenderbuffer,
      b: _glBindTexture,
      o: _glBindVertexArray,
      Q: _glBlendEquation,
      $: _glBlendFunc,
      P: _glBlendFuncSeparate,
      pa: _glBlitFramebuffer,
      u: _glBufferData,
      t: _glBufferSubData,
      O: _glCheckFramebufferStatus,
      N: _glClear,
      Ca: _glClearBufferfv,
      V: _glClearColor,
      ga: _glClearDepthf,
      U: _glColorMask,
      _a: _glCompileShader,
      Gb: _glCompressedTexImage2D,
      sc: _glCompressedTexImage3D,
      rc: _glCompressedTexSubImage2D,
      kb: _glCompressedTexSubImage3D,
      qc: _glCopyBufferSubData,
      jb: _glCopyTexSubImage2D,
      Fb: _glCreateProgram,
      Za: _glCreateShader,
      Ba: _glCullFace,
      R: _glDeleteBuffers,
      K: _glDeleteFramebuffers,
      X: _glDeleteProgram,
      ea: _glDeleteRenderbuffers,
      M: _glDeleteShader,
      F: _glDeleteTextures,
      ka: _glDeleteVertexArrays,
      da: _glDepthFunc,
      L: _glDepthMask,
      q: _glDisable,
      p: _glDisableVertexAttribArray,
      x: _glDrawArrays,
      ya: _glDrawArraysInstanced,
      Qa: _glDrawBuffers,
      S: _glDrawElements,
      xa: _glDrawElementsInstanced,
      B: _glEnable,
      j: _glEnableVertexAttribArray,
      ib: _glEndTransformFeedback,
      pc: _glFinish,
      fa: _glFramebufferRenderbuffer,
      E: _glFramebufferTexture2D,
      Eb: _glFramebufferTextureLayer,
      Db: _glFrontFace,
      G: _glGenBuffers,
      I: _glGenFramebuffers,
      oa: _glGenRenderbuffers,
      C: _glGenTextures,
      _: _glGenVertexArrays,
      Y: _glGenerateMipmap,
      oc: _glGetFloatv,
      wa: _glGetIntegerv,
      Cb: _glGetProgramInfoLog,
      Ya: _glGetProgramiv,
      Xa: _glGetShaderInfoLog,
      Aa: _glGetShaderiv,
      Wa: _glGetString,
      nc: _glGetStringi,
      mc: _glGetUniformBlockIndex,
      Ha: _glGetUniformLocation,
      lc: _glInvalidateFramebuffer,
      Bb: _glLinkProgram,
      va: _glPixelStorei,
      ua: _glReadBuffer,
      hb: _glReadPixels,
      na: _glRenderbufferStorage,
      Pa: _glRenderbufferStorageMultisample,
      ca: _glScissor,
      Va: _glShaderSource,
      A: _glTexImage2D,
      Oa: _glTexImage3D,
      k: _glTexParameterf,
      g: _glTexParameteri,
      kc: _glTexStorage2D,
      Na: _glTexSubImage2D,
      Ua: _glTexSubImage3D,
      jc: _glTransformFeedbackVaryings,
      i: _glUniform1f,
      l: _glUniform1i,
      gb: _glUniform1iv,
      Ab: _glUniform1ui,
      fb: _glUniform2f,
      m: _glUniform2fv,
      Ka: _glUniform2i,
      ta: _glUniform2iv,
      eb: _glUniform3f,
      ba: _glUniform3fv,
      Ja: _glUniform3i,
      Ga: _glUniform4f,
      w: _glUniform4fv,
      Ia: _glUniform4i,
      ic: _glUniformBlockBinding,
      zb: _glUniformMatrix2fv,
      yb: _glUniformMatrix3fv,
      h: _glUniformMatrix4fv,
      ja: _glUseProgram,
      v: _glVertexAttrib4f,
      T: _glVertexAttrib4fv,
      D: _glVertexAttribDivisor,
      Ta: _glVertexAttribI4ui,
      Fa: _glVertexAttribIPointer,
      e: _glVertexAttribPointer,
      y: _glViewport,
      xb: _gmtime,
      hc: _godot_xhr_free,
      gc: _godot_xhr_get_ready_state,
      fc: _godot_xhr_get_response,
      ec: _godot_xhr_get_response_headers,
      dc: _godot_xhr_get_response_headers_length,
      cc: _godot_xhr_get_response_length,
      bc: _godot_xhr_get_status,
      ac: _godot_xhr_new,
      wb: _godot_xhr_open,
      db: _godot_xhr_reset,
      $b: _godot_xhr_send_data,
      _b: _godot_xhr_send_string,
      Zb: _godot_xhr_set_request_header,
      Yb: _inet_addr,
      vb: invoke_i,
      ma: invoke_ii,
      la: invoke_iii,
      Ma: invoke_iiii,
      cb: invoke_iiiii,
      Xb: invoke_iiiiii,
      Wb: invoke_iiiiiii,
      ub: invoke_iiiiiiiiii,
      Ub: invoke_iiiij,
      Ea: invoke_v,
      H: invoke_vi,
      za: invoke_vii,
      sa: invoke_viii,
      ia: invoke_viiii,
      tb: invoke_viiiiiii,
      Vb: _kill,
      bb: _localtime,
      memory: wasmMemory,
      Tb: _nanosleep,
      La: _round,
      aa: _saveSetjmp,
      s: _setTempRet0,
      Sb: _sigaction,
      sb: _strftime,
      Rb: _strftime_l,
      Qb: _sysconf,
      table: wasmTable,
      r: _testSetjmp,
      Sa: _time,
      Pb: _waitpid
    };
    var asm = createWasm();
    Module["asm"] = asm;
    var ___wasm_call_ctors = (Module["___wasm_call_ctors"] = function() {
      return Module["asm"]["Di"].apply(null, arguments);
    });
    var _audio_driver_js_mix = (Module["_audio_driver_js_mix"] = function() {
      return Module["asm"]["Ei"].apply(null, arguments);
    });
    var _audio_driver_process_capture = (Module[
      "_audio_driver_process_capture"
    ] = function() {
      return Module["asm"]["Fi"].apply(null, arguments);
    });
    var _resize_poolbytearray_and_open_write = (Module[
      "_resize_poolbytearray_and_open_write"
    ] = function() {
      return Module["asm"]["Gi"].apply(null, arguments);
    });
    var _main_after_fs_sync = (Module["_main_after_fs_sync"] = function() {
      return Module["asm"]["Hi"].apply(null, arguments);
    });
    var _main = (Module["_main"] = function() {
      return Module["asm"]["Ii"].apply(null, arguments);
    });
    var _update_clipboard = (Module["_update_clipboard"] = function() {
      return Module["asm"]["Ji"].apply(null, arguments);
    });
    var _send_notification = (Module["_send_notification"] = function() {
      return Module["asm"]["Ki"].apply(null, arguments);
    });
    var _malloc = (Module["_malloc"] = function() {
      return Module["asm"]["Li"].apply(null, arguments);
    });
    var _free = (Module["_free"] = function() {
      return Module["asm"]["Mi"].apply(null, arguments);
    });
    var _htonl = (Module["_htonl"] = function() {
      return Module["asm"]["Ni"].apply(null, arguments);
    });
    var _htons = (Module["_htons"] = function() {
      return Module["asm"]["Oi"].apply(null, arguments);
    });
    var _ntohs = (Module["_ntohs"] = function() {
      return Module["asm"]["Pi"].apply(null, arguments);
    });
    var _realloc = (Module["_realloc"] = function() {
      return Module["asm"]["Qi"].apply(null, arguments);
    });
    var ___errno_location = (Module["___errno_location"] = function() {
      return Module["asm"]["Ri"].apply(null, arguments);
    });
    var __emrtc_on_ch_error = (Module["__emrtc_on_ch_error"] = function() {
      return Module["asm"]["Si"].apply(null, arguments);
    });
    var __emrtc_on_ch_open = (Module["__emrtc_on_ch_open"] = function() {
      return Module["asm"]["Ti"].apply(null, arguments);
    });
    var __emrtc_on_ch_close = (Module["__emrtc_on_ch_close"] = function() {
      return Module["asm"]["Ui"].apply(null, arguments);
    });
    var __emrtc_on_ch_message = (Module["__emrtc_on_ch_message"] = function() {
      return Module["asm"]["Vi"].apply(null, arguments);
    });
    var __emrtc_on_ice_candidate = (Module[
      "__emrtc_on_ice_candidate"
    ] = function() {
      return Module["asm"]["Wi"].apply(null, arguments);
    });
    var __emrtc_session_description_created = (Module[
      "__emrtc_session_description_created"
    ] = function() {
      return Module["asm"]["Xi"].apply(null, arguments);
    });
    var __emrtc_on_connection_state_changed = (Module[
      "__emrtc_on_connection_state_changed"
    ] = function() {
      return Module["asm"]["Yi"].apply(null, arguments);
    });
    var __emrtc_on_error = (Module["__emrtc_on_error"] = function() {
      return Module["asm"]["Zi"].apply(null, arguments);
    });
    var __emrtc_emit_channel = (Module["__emrtc_emit_channel"] = function() {
      return Module["asm"]["_i"].apply(null, arguments);
    });
    var __esws_on_connect = (Module["__esws_on_connect"] = function() {
      return Module["asm"]["$i"].apply(null, arguments);
    });
    var __esws_on_message = (Module["__esws_on_message"] = function() {
      return Module["asm"]["aj"].apply(null, arguments);
    });
    var __esws_on_error = (Module["__esws_on_error"] = function() {
      return Module["asm"]["bj"].apply(null, arguments);
    });
    var __esws_on_close = (Module["__esws_on_close"] = function() {
      return Module["asm"]["cj"].apply(null, arguments);
    });
    var __get_tzname = (Module["__get_tzname"] = function() {
      return Module["asm"]["dj"].apply(null, arguments);
    });
    var __get_daylight = (Module["__get_daylight"] = function() {
      return Module["asm"]["ej"].apply(null, arguments);
    });
    var __get_timezone = (Module["__get_timezone"] = function() {
      return Module["asm"]["fj"].apply(null, arguments);
    });
    var _setThrew = (Module["_setThrew"] = function() {
      return Module["asm"]["gj"].apply(null, arguments);
    });
    var _emscripten_GetProcAddress = (Module[
      "_emscripten_GetProcAddress"
    ] = function() {
      return Module["asm"]["hj"].apply(null, arguments);
    });
    var dynCall_i = (Module["dynCall_i"] = function() {
      return Module["asm"]["ij"].apply(null, arguments);
    });
    var dynCall_ii = (Module["dynCall_ii"] = function() {
      return Module["asm"]["jj"].apply(null, arguments);
    });
    var dynCall_iii = (Module["dynCall_iii"] = function() {
      return Module["asm"]["kj"].apply(null, arguments);
    });
    var dynCall_iiii = (Module["dynCall_iiii"] = function() {
      return Module["asm"]["lj"].apply(null, arguments);
    });
    var dynCall_iiiii = (Module["dynCall_iiiii"] = function() {
      return Module["asm"]["mj"].apply(null, arguments);
    });
    var dynCall_iiiiii = (Module["dynCall_iiiiii"] = function() {
      return Module["asm"]["nj"].apply(null, arguments);
    });
    var dynCall_iiiiiii = (Module["dynCall_iiiiiii"] = function() {
      return Module["asm"]["oj"].apply(null, arguments);
    });
    var dynCall_iiiiiiiiii = (Module["dynCall_iiiiiiiiii"] = function() {
      return Module["asm"]["pj"].apply(null, arguments);
    });
    var dynCall_iiiij = (Module["dynCall_iiiij"] = function() {
      return Module["asm"]["qj"].apply(null, arguments);
    });
    var dynCall_v = (Module["dynCall_v"] = function() {
      return Module["asm"]["rj"].apply(null, arguments);
    });
    var dynCall_vi = (Module["dynCall_vi"] = function() {
      return Module["asm"]["sj"].apply(null, arguments);
    });
    var dynCall_vii = (Module["dynCall_vii"] = function() {
      return Module["asm"]["tj"].apply(null, arguments);
    });
    var dynCall_viii = (Module["dynCall_viii"] = function() {
      return Module["asm"]["uj"].apply(null, arguments);
    });
    var dynCall_viiii = (Module["dynCall_viiii"] = function() {
      return Module["asm"]["vj"].apply(null, arguments);
    });
    var dynCall_viiiiiii = (Module["dynCall_viiiiiii"] = function() {
      return Module["asm"]["wj"].apply(null, arguments);
    });
    var stackSave = (Module["stackSave"] = function() {
      return Module["asm"]["xj"].apply(null, arguments);
    });
    var stackAlloc = (Module["stackAlloc"] = function() {
      return Module["asm"]["yj"].apply(null, arguments);
    });
    var stackRestore = (Module["stackRestore"] = function() {
      return Module["asm"]["zj"].apply(null, arguments);
    });
    function invoke_vi(index, a1) {
      var sp = stackSave();
      try {
        dynCall_vi(index, a1);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_vii(index, a1, a2) {
      var sp = stackSave();
      try {
        dynCall_vii(index, a1, a2);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_ii(index, a1) {
      var sp = stackSave();
      try {
        return dynCall_ii(index, a1);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_v(index) {
      var sp = stackSave();
      try {
        dynCall_v(index);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_iii(index, a1, a2) {
      var sp = stackSave();
      try {
        return dynCall_iii(index, a1, a2);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiii(index, a1, a2, a3, a4) {
      var sp = stackSave();
      try {
        return dynCall_iiiii(index, a1, a2, a3, a4);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiiii(index, a1, a2, a3, a4, a5) {
      var sp = stackSave();
      try {
        return dynCall_iiiiii(index, a1, a2, a3, a4, a5);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_viiii(index, a1, a2, a3, a4) {
      var sp = stackSave();
      try {
        dynCall_viiii(index, a1, a2, a3, a4);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_iiii(index, a1, a2, a3) {
      var sp = stackSave();
      try {
        return dynCall_iiii(index, a1, a2, a3);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_i(index) {
      var sp = stackSave();
      try {
        return dynCall_i(index);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_viiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
      var sp = stackSave();
      try {
        dynCall_viiiiiii(index, a1, a2, a3, a4, a5, a6, a7);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_viii(index, a1, a2, a3) {
      var sp = stackSave();
      try {
        dynCall_viii(index, a1, a2, a3);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
      var sp = stackSave();
      try {
        return dynCall_iiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiiiii(index, a1, a2, a3, a4, a5, a6) {
      var sp = stackSave();
      try {
        return dynCall_iiiiiii(index, a1, a2, a3, a4, a5, a6);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
      }
    }
    function invoke_iiiij(index, a1, a2, a3, a4, a5) {
      var sp = stackSave();
      try {
        return dynCall_iiiij(index, a1, a2, a3, a4, a5);
      } catch (e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0);
      }
    }
    Module["asm"] = asm;
    Module["callMain"] = callMain;
    var calledRun;
    function ExitStatus(status) {
      this.name = "ExitStatus";
      this.message = "Program terminated with exit(" + status + ")";
      this.status = status;
    }
    var calledMain = false;
    dependenciesFulfilled = function runCaller() {
      if (!calledRun) run();
      if (!calledRun) dependenciesFulfilled = runCaller;
    };
    function callMain(args) {
      args = args || [];
      var argc = args.length + 1;
      var argv = stackAlloc((argc + 1) * 4);
      HEAP32[argv >> 2] = allocateUTF8OnStack(thisProgram);
      for (var i = 1; i < argc; i++) {
        HEAP32[(argv >> 2) + i] = allocateUTF8OnStack(args[i - 1]);
      }
      HEAP32[(argv >> 2) + argc] = 0;
      try {
        var ret = Module["_main"](argc, argv);
        exit(ret, true);
      } catch (e) {
        if (e instanceof ExitStatus) {
          return;
        } else if (e == "SimulateInfiniteLoop") {
          noExitRuntime = true;
          return;
        } else {
          var toLog = e;
          if (e && typeof e === "object" && e.stack) {
            toLog = [e, e.stack];
          }
          err("exception thrown: " + toLog);
          quit_(1, e);
        }
      } finally {
        calledMain = true;
      }
    }
    function run(args) {
      args = args || arguments_;
      if (runDependencies > 0) {
        return;
      }
      preRun();
      if (runDependencies > 0) return;
      function doRun() {
        if (calledRun) return;
        calledRun = true;
        if (ABORT) return;
        initRuntime();
        preMain();
        if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
        if (shouldRunNow) callMain(args);
        postRun();
      }
      if (Module["setStatus"]) {
        Module["setStatus"]("Running...");
        setTimeout(function() {
          setTimeout(function() {
            Module["setStatus"]("");
          }, 1);
          doRun();
        }, 1);
      } else {
        doRun();
      }
    }
    Module["run"] = run;
    function exit(status, implicit) {
      if (implicit && noExitRuntime && status === 0) {
        return;
      }
      if (noExitRuntime) {
      } else {
        ABORT = true;
        EXITSTATUS = status;
        exitRuntime();
        if (Module["onExit"]) Module["onExit"](status);
      }
      quit_(status, new ExitStatus(status));
    }
    if (Module["preInit"]) {
      if (typeof Module["preInit"] == "function")
        Module["preInit"] = [Module["preInit"]];
      while (Module["preInit"].length > 0) {
        Module["preInit"].pop()();
      }
    }
    var shouldRunNow = false;
    if (Module["noInitialRun"]) shouldRunNow = false;
    noExitRuntime = true;
    run();

    // The following is concatenated with generated code, and acts as the end
    // of a wrapper for said code. See pre.js for the other part of the
    // wrapper.
    exposedLibs["PATH"] = PATH;
    exposedLibs["FS"] = FS;
    return Module;
  }
};

(function() {
  var engine = Engine;

  var DOWNLOAD_ATTEMPTS_MAX = 4;

  var basePath = null;
  var wasmFilenameExtensionOverride = null;
  var engineLoadPromise = null;

  var loadingFiles = {};

  function getPathLeaf(path) {
    while (path.endsWith("/")) path = path.slice(0, -1);
    return path.slice(path.lastIndexOf("/") + 1);
  }

  function getBasePath(path) {
    if (path.endsWith("/")) path = path.slice(0, -1);
    if (path.lastIndexOf(".") > path.lastIndexOf("/"))
      path = path.slice(0, path.lastIndexOf("."));
    return path;
  }

  function getBaseName(path) {
    return getPathLeaf(getBasePath(path));
  }

  Engine = function Engine() {
    this.rtenv = null;

    var LIBS = {};

    var initPromise = null;
    var unloadAfterInit = true;

    var preloadedFiles = [];

    var resizeCanvasOnStart = true;
    var progressFunc = null;
    var preloadProgressTracker = {};
    var lastProgress = { loaded: 0, total: 0 };

    var canvas = null;
    var executableName = null;
    var locale = null;
    var stdout = null;
    var stderr = null;

    this.init = function(newBasePath) {
      if (!initPromise) {
        initPromise = Engine.load(newBasePath).then(instantiate.bind(this));
        requestAnimationFrame(animateProgress);
        if (unloadAfterInit) initPromise.then(Engine.unloadEngine);
      }
      return initPromise;
    };

    function instantiate(wasmBuf) {
      var rtenvProps = {
        engine: this,
        ENV: {}
      };
      if (typeof stdout === "function") rtenvProps.print = stdout;
      if (typeof stderr === "function") rtenvProps.printErr = stderr;
      rtenvProps.instantiateWasm = function(imports, onSuccess) {
        WebAssembly.instantiate(wasmBuf, imports).then(function(result) {
          onSuccess(result.instance);
        });
        return {};
      };

      return new Promise(function(resolve, reject) {
        rtenvProps.onRuntimeInitialized = resolve;
        rtenvProps.onAbort = reject;
        rtenvProps.thisProgram = executableName;
        rtenvProps.engine.rtenv = Engine.RuntimeEnvironment(rtenvProps, LIBS);
      });
    }

    this.preloadFile = function(pathOrBuffer, destPath) {
      if (pathOrBuffer instanceof ArrayBuffer) {
        pathOrBuffer = new Uint8Array(pathOrBuffer);
      } else if (ArrayBuffer.isView(pathOrBuffer)) {
        pathOrBuffer = new Uint8Array(pathOrBuffer.buffer);
      }
      if (pathOrBuffer instanceof Uint8Array) {
        preloadedFiles.push({
          path: destPath,
          buffer: pathOrBuffer
        });
        return Promise.resolve();
      } else if (typeof pathOrBuffer === "string") {
        return loadPromise(pathOrBuffer, preloadProgressTracker).then(function(
          xhr
        ) {
          preloadedFiles.push({
            path: destPath || pathOrBuffer,
            buffer: xhr.response
          });
        });
      } else {
        throw Promise.reject("Invalid object for preloading");
      }
    };

    this.start = function() {
      return this.init().then(
        Function.prototype.apply.bind(synchronousStart, this, arguments)
      );
    };

    this.startGame = function(execName, mainPack) {
      executableName = execName;
      var mainArgs = ["--main-pack", mainPack];

      return Promise.all([
        // Load from directory,
        this.init(getBasePath(mainPack)),
        // ...but write to root where the engine expects it.
        this.preloadFile(mainPack, getPathLeaf(mainPack))
      ]).then(Function.prototype.apply.bind(synchronousStart, this, mainArgs));
    };

    function synchronousStart() {
      if (canvas instanceof HTMLCanvasElement) {
        this.rtenv.canvas = canvas;
      } else {
        var firstCanvas = document.getElementsByTagName("canvas")[0];
        if (firstCanvas instanceof HTMLCanvasElement) {
          this.rtenv.canvas = firstCanvas;
        } else {
          throw new Error("No canvas found");
        }
      }

      var actualCanvas = this.rtenv.canvas;
      // canvas can grab focus on click
      if (actualCanvas.tabIndex < 0) {
        actualCanvas.tabIndex = 0;
      }
      // necessary to calculate cursor coordinates correctly
      actualCanvas.style.padding = 0;
      actualCanvas.style.borderWidth = 0;
      actualCanvas.style.borderStyle = "none";
      // disable right-click context menu
      actualCanvas.addEventListener(
        "contextmenu",
        function(ev) {
          ev.preventDefault();
        },
        false
      );
      // until context restoration is implemented
      actualCanvas.addEventListener(
        "webglcontextlost",
        function(ev) {
          alert("WebGL context lost, please reload the page");
          ev.preventDefault();
        },
        false
      );

      if (locale) {
        this.rtenv.locale = locale;
      } else {
        this.rtenv.locale = navigator.languages
          ? navigator.languages[0]
          : navigator.language;
      }
      this.rtenv.locale = this.rtenv.locale.split(".")[0];
      this.rtenv.resizeCanvasOnStart = resizeCanvasOnStart;

      preloadedFiles.forEach(function(file) {
        var dir = LIBS.PATH.dirname(file.path);
        try {
          LIBS.FS.stat(dir);
        } catch (e) {
          if (e.code !== "ENOENT") {
            throw e;
          }
          LIBS.FS.mkdirTree(dir);
        }
        // With memory growth, canOwn should be false.
        LIBS.FS.createDataFile(
          file.path,
          null,
          new Uint8Array(file.buffer),
          true,
          true,
          false
        );
      }, this);

      preloadedFiles = null;
      initPromise = null;
      this.rtenv.callMain(arguments);
    }

    this.setProgressFunc = function(func) {
      progressFunc = func;
    };

    this.setResizeCanvasOnStart = function(enabled) {
      resizeCanvasOnStart = enabled;
    };

    function animateProgress() {
      var loaded = 0;
      var total = 0;
      var totalIsValid = true;
      var progressIsFinal = true;

      [loadingFiles, preloadProgressTracker].forEach(function(tracker) {
        Object.keys(tracker).forEach(function(file) {
          if (!tracker[file].final) progressIsFinal = false;
          if (!totalIsValid || tracker[file].total === 0) {
            totalIsValid = false;
            total = 0;
          } else {
            total += tracker[file].total;
          }
          loaded += tracker[file].loaded;
        });
      });
      if (loaded !== lastProgress.loaded || total !== lastProgress.total) {
        lastProgress.loaded = loaded;
        lastProgress.total = total;
        if (typeof progressFunc === "function") progressFunc(loaded, total);
      }
      if (!progressIsFinal) requestAnimationFrame(animateProgress);
    }

    this.setCanvas = function(elem) {
      canvas = elem;
    };

    this.setExecutableName = function(newName) {
      executableName = newName;
    };

    this.setLocale = function(newLocale) {
      locale = newLocale;
    };

    this.setUnloadAfterInit = function(enabled) {
      if (enabled && !unloadAfterInit && initPromise) {
        initPromise.then(Engine.unloadEngine);
      }
      unloadAfterInit = enabled;
    };

    this.setStdoutFunc = function(func) {
      var print = function(text) {
        if (arguments.length > 1) {
          text = Array.prototype.slice.call(arguments).join(" ");
        }
        func(text);
      };
      if (this.rtenv) this.rtenv.print = print;
      stdout = print;
    };

    this.setStderrFunc = function(func) {
      var printErr = function(text) {
        if (arguments.length > 1)
          text = Array.prototype.slice.call(arguments).join(" ");
        func(text);
      };
      if (this.rtenv) this.rtenv.printErr = printErr;
      stderr = printErr;
    };
  }; // Engine()

  Engine.RuntimeEnvironment = engine.RuntimeEnvironment;

  Engine.isWebGLAvailable = function(majorVersion = 1) {
    var testContext = false;
    try {
      var testCanvas = document.createElement("canvas");
      if (majorVersion === 1) {
        testContext =
          testCanvas.getContext("webgl") ||
          testCanvas.getContext("experimental-webgl");
      } else if (majorVersion === 2) {
        testContext =
          testCanvas.getContext("webgl2") ||
          testCanvas.getContext("experimental-webgl2");
      }
    } catch (e) {}
    return !!testContext;
  };

  Engine.setWebAssemblyFilenameExtension = function(override) {
    if (String(override).length === 0) {
      throw new Error("Invalid WebAssembly filename extension override");
    }
    wasmFilenameExtensionOverride = String(override);
  };

  Engine.load = function(newBasePath) {
    if (newBasePath !== undefined) basePath = getBasePath(newBasePath);
    if (engineLoadPromise === null) {
      if (typeof WebAssembly !== "object")
        return Promise.reject(new Error("Browser doesn't support WebAssembly"));
      // TODO cache/retrieve module to/from idb
      engineLoadPromise = loadPromise(
        basePath + "." + (wasmFilenameExtensionOverride || "wasm")
      ).then(function(xhr) {
        return xhr.response;
      });
      engineLoadPromise = engineLoadPromise.catch(function(err) {
        engineLoadPromise = null;
        throw err;
      });
    }
    return engineLoadPromise;
  };

  Engine.unload = function() {
    engineLoadPromise = null;
  };

  function loadPromise(file, tracker) {
    if (tracker === undefined) tracker = loadingFiles;
    return new Promise(function(resolve, reject) {
      loadXHR(resolve, reject, file, tracker);
    });
  }

  function loadXHR(resolve, reject, file, tracker) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", file);
    if (!file.endsWith(".js")) {
      xhr.responseType = "arraybuffer";
    }
    ["loadstart", "progress", "load", "error", "abort"].forEach(function(ev) {
      xhr.addEventListener(
        ev,
        onXHREvent.bind(xhr, resolve, reject, file, tracker)
      );
    });
    xhr.send();
  }

  function onXHREvent(resolve, reject, file, tracker, ev) {
    if (this.status >= 400) {
      if (
        this.status < 500 ||
        ++tracker[file].attempts >= DOWNLOAD_ATTEMPTS_MAX
      ) {
        reject(
          new Error("Failed loading file '" + file + "': " + this.statusText)
        );
        this.abort();
        return;
      } else {
        setTimeout(loadXHR.bind(null, resolve, reject, file, tracker), 1000);
      }
    }

    switch (ev.type) {
      case "loadstart":
        if (tracker[file] === undefined) {
          tracker[file] = {
            total: ev.total,
            loaded: ev.loaded,
            attempts: 0,
            final: false
          };
        }
        break;

      case "progress":
        tracker[file].loaded = ev.loaded;
        tracker[file].total = ev.total;
        break;

      case "load":
        tracker[file].final = true;
        resolve(this);
        break;

      case "error":
        if (++tracker[file].attempts >= DOWNLOAD_ATTEMPTS_MAX) {
          tracker[file].final = true;
          reject(new Error("Failed loading file '" + file + "'"));
        } else {
          setTimeout(loadXHR.bind(null, resolve, reject, file, tracker), 1000);
        }
        break;

      case "abort":
        tracker[file].final = true;
        reject(new Error("Loading file '" + file + "' was aborted."));
        break;
    }
  }
})();
