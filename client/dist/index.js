"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/@stdlib/utils-define-property/lib/define_property.js
  var require_define_property = __commonJS({
    "node_modules/@stdlib/utils-define-property/lib/define_property.js"(exports, module2) {
      "use strict";
      var main2 = typeof Object.defineProperty === "function" ? Object.defineProperty : null;
      module2.exports = main2;
    }
  });

  // node_modules/@stdlib/utils-define-property/lib/has_define_property_support.js
  var require_has_define_property_support = __commonJS({
    "node_modules/@stdlib/utils-define-property/lib/has_define_property_support.js"(exports, module2) {
      "use strict";
      var defineProperty = require_define_property();
      function hasDefinePropertySupport() {
        try {
          defineProperty({}, "x", {});
          return true;
        } catch (err) {
          return false;
        }
      }
      module2.exports = hasDefinePropertySupport;
    }
  });

  // node_modules/@stdlib/utils-define-property/lib/builtin.js
  var require_builtin = __commonJS({
    "node_modules/@stdlib/utils-define-property/lib/builtin.js"(exports, module2) {
      "use strict";
      var defineProperty = Object.defineProperty;
      module2.exports = defineProperty;
    }
  });

  // node_modules/@stdlib/string-base-format-interpolate/lib/is_number.js
  var require_is_number = __commonJS({
    "node_modules/@stdlib/string-base-format-interpolate/lib/is_number.js"(exports, module2) {
      "use strict";
      function isNumber(value) {
        return typeof value === "number";
      }
      module2.exports = isNumber;
    }
  });

  // node_modules/@stdlib/string-base-format-interpolate/lib/zero_pad.js
  var require_zero_pad = __commonJS({
    "node_modules/@stdlib/string-base-format-interpolate/lib/zero_pad.js"(exports, module2) {
      "use strict";
      function startsWithMinus(str) {
        return str[0] === "-";
      }
      function zeros(n) {
        var out = "";
        var i;
        for (i = 0; i < n; i++) {
          out += "0";
        }
        return out;
      }
      function zeroPad(str, width, right) {
        var negative = false;
        var pad = width - str.length;
        if (pad < 0) {
          return str;
        }
        if (startsWithMinus(str)) {
          negative = true;
          str = str.substr(1);
        }
        str = right ? str + zeros(pad) : zeros(pad) + str;
        if (negative) {
          str = "-" + str;
        }
        return str;
      }
      module2.exports = zeroPad;
    }
  });

  // node_modules/@stdlib/string-base-format-interpolate/lib/format_integer.js
  var require_format_integer = __commonJS({
    "node_modules/@stdlib/string-base-format-interpolate/lib/format_integer.js"(exports, module2) {
      "use strict";
      var isNumber = require_is_number();
      var zeroPad = require_zero_pad();
      var lowercase = String.prototype.toLowerCase;
      var uppercase = String.prototype.toUpperCase;
      function formatInteger(token) {
        var base;
        var out;
        var i;
        switch (token.specifier) {
          case "b":
            base = 2;
            break;
          case "o":
            base = 8;
            break;
          case "x":
          case "X":
            base = 16;
            break;
          case "d":
          case "i":
          case "u":
          default:
            base = 10;
            break;
        }
        out = token.arg;
        i = parseInt(out, 10);
        if (!isFinite(i)) {
          if (!isNumber(out)) {
            throw new Error("invalid integer. Value: " + out);
          }
          i = 0;
        }
        if (i < 0 && (token.specifier === "u" || base !== 10)) {
          i = 4294967295 + i + 1;
        }
        if (i < 0) {
          out = (-i).toString(base);
          if (token.precision) {
            out = zeroPad(out, token.precision, token.padRight);
          }
          out = "-" + out;
        } else {
          out = i.toString(base);
          if (!i && !token.precision) {
            out = "";
          } else if (token.precision) {
            out = zeroPad(out, token.precision, token.padRight);
          }
          if (token.sign) {
            out = token.sign + out;
          }
        }
        if (base === 16) {
          if (token.alternate) {
            out = "0x" + out;
          }
          out = token.specifier === uppercase.call(token.specifier) ? uppercase.call(out) : lowercase.call(out);
        }
        if (base === 8) {
          if (token.alternate && out.charAt(0) !== "0") {
            out = "0" + out;
          }
        }
        return out;
      }
      module2.exports = formatInteger;
    }
  });

  // node_modules/@stdlib/string-base-format-interpolate/lib/is_string.js
  var require_is_string = __commonJS({
    "node_modules/@stdlib/string-base-format-interpolate/lib/is_string.js"(exports, module2) {
      "use strict";
      function isString(value) {
        return typeof value === "string";
      }
      module2.exports = isString;
    }
  });

  // node_modules/@stdlib/string-base-format-interpolate/lib/format_double.js
  var require_format_double = __commonJS({
    "node_modules/@stdlib/string-base-format-interpolate/lib/format_double.js"(exports, module2) {
      "use strict";
      var isNumber = require_is_number();
      var abs = Math.abs;
      var lowercase = String.prototype.toLowerCase;
      var uppercase = String.prototype.toUpperCase;
      var replace = String.prototype.replace;
      var RE_EXP_POS_DIGITS = /e\+(\d)$/;
      var RE_EXP_NEG_DIGITS = /e-(\d)$/;
      var RE_ONLY_DIGITS = /^(\d+)$/;
      var RE_DIGITS_BEFORE_EXP = /^(\d+)e/;
      var RE_TRAILING_PERIOD_ZERO = /\.0$/;
      var RE_PERIOD_ZERO_EXP = /\.0*e/;
      var RE_ZERO_BEFORE_EXP = /(\..*[^0])0*e/;
      function formatDouble(token) {
        var digits;
        var out;
        var f = parseFloat(token.arg);
        if (!isFinite(f)) {
          if (!isNumber(token.arg)) {
            throw new Error("invalid floating-point number. Value: " + out);
          }
          f = token.arg;
        }
        switch (token.specifier) {
          case "e":
          case "E":
            out = f.toExponential(token.precision);
            break;
          case "f":
          case "F":
            out = f.toFixed(token.precision);
            break;
          case "g":
          case "G":
            if (abs(f) < 1e-4) {
              digits = token.precision;
              if (digits > 0) {
                digits -= 1;
              }
              out = f.toExponential(digits);
            } else {
              out = f.toPrecision(token.precision);
            }
            if (!token.alternate) {
              out = replace.call(out, RE_ZERO_BEFORE_EXP, "$1e");
              out = replace.call(out, RE_PERIOD_ZERO_EXP, "e");
              out = replace.call(out, RE_TRAILING_PERIOD_ZERO, "");
            }
            break;
          default:
            throw new Error("invalid double notation. Value: " + token.specifier);
        }
        out = replace.call(out, RE_EXP_POS_DIGITS, "e+0$1");
        out = replace.call(out, RE_EXP_NEG_DIGITS, "e-0$1");
        if (token.alternate) {
          out = replace.call(out, RE_ONLY_DIGITS, "$1.");
          out = replace.call(out, RE_DIGITS_BEFORE_EXP, "$1.e");
        }
        if (f >= 0 && token.sign) {
          out = token.sign + out;
        }
        out = token.specifier === uppercase.call(token.specifier) ? uppercase.call(out) : lowercase.call(out);
        return out;
      }
      module2.exports = formatDouble;
    }
  });

  // node_modules/@stdlib/string-base-format-interpolate/lib/space_pad.js
  var require_space_pad = __commonJS({
    "node_modules/@stdlib/string-base-format-interpolate/lib/space_pad.js"(exports, module2) {
      "use strict";
      function spaces(n) {
        var out = "";
        var i;
        for (i = 0; i < n; i++) {
          out += " ";
        }
        return out;
      }
      function spacePad(str, width, right) {
        var pad = width - str.length;
        if (pad < 0) {
          return str;
        }
        str = right ? str + spaces(pad) : spaces(pad) + str;
        return str;
      }
      module2.exports = spacePad;
    }
  });

  // node_modules/@stdlib/string-base-format-interpolate/lib/main.js
  var require_main = __commonJS({
    "node_modules/@stdlib/string-base-format-interpolate/lib/main.js"(exports, module2) {
      "use strict";
      var formatInteger = require_format_integer();
      var isString = require_is_string();
      var formatDouble = require_format_double();
      var spacePad = require_space_pad();
      var zeroPad = require_zero_pad();
      var fromCharCode = String.fromCharCode;
      var isArray = Array.isArray;
      function isnan(value) {
        return value !== value;
      }
      function initialize(token) {
        var out = {};
        out.specifier = token.specifier;
        out.precision = token.precision === void 0 ? 1 : token.precision;
        out.width = token.width;
        out.flags = token.flags || "";
        out.mapping = token.mapping;
        return out;
      }
      function formatInterpolate(tokens) {
        var hasPeriod;
        var flags;
        var token;
        var flag;
        var num;
        var out;
        var pos;
        var i;
        var j;
        if (!isArray(tokens)) {
          throw new TypeError("invalid argument. First argument must be an array. Value: `" + tokens + "`.");
        }
        out = "";
        pos = 1;
        for (i = 0; i < tokens.length; i++) {
          token = tokens[i];
          if (isString(token)) {
            out += token;
          } else {
            hasPeriod = token.precision !== void 0;
            token = initialize(token);
            if (!token.specifier) {
              throw new TypeError("invalid argument. Token is missing `specifier` property. Index: `" + i + "`. Value: `" + token + "`.");
            }
            if (token.mapping) {
              pos = token.mapping;
            }
            flags = token.flags;
            for (j = 0; j < flags.length; j++) {
              flag = flags.charAt(j);
              switch (flag) {
                case " ":
                  token.sign = " ";
                  break;
                case "+":
                  token.sign = "+";
                  break;
                case "-":
                  token.padRight = true;
                  token.padZeros = false;
                  break;
                case "0":
                  token.padZeros = flags.indexOf("-") < 0;
                  break;
                case "#":
                  token.alternate = true;
                  break;
                default:
                  throw new Error("invalid flag: " + flag);
              }
            }
            if (token.width === "*") {
              token.width = parseInt(arguments[pos], 10);
              pos += 1;
              if (isnan(token.width)) {
                throw new TypeError("the argument for * width at position " + pos + " is not a number. Value: `" + token.width + "`.");
              }
              if (token.width < 0) {
                token.padRight = true;
                token.width = -token.width;
              }
            }
            if (hasPeriod) {
              if (token.precision === "*") {
                token.precision = parseInt(arguments[pos], 10);
                pos += 1;
                if (isnan(token.precision)) {
                  throw new TypeError("the argument for * precision at position " + pos + " is not a number. Value: `" + token.precision + "`.");
                }
                if (token.precision < 0) {
                  token.precision = 1;
                  hasPeriod = false;
                }
              }
            }
            token.arg = arguments[pos];
            switch (token.specifier) {
              case "b":
              case "o":
              case "x":
              case "X":
              case "d":
              case "i":
              case "u":
                if (hasPeriod) {
                  token.padZeros = false;
                }
                token.arg = formatInteger(token);
                break;
              case "s":
                token.maxWidth = hasPeriod ? token.precision : -1;
                token.arg = String(token.arg);
                break;
              case "c":
                if (!isnan(token.arg)) {
                  num = parseInt(token.arg, 10);
                  if (num < 0 || num > 127) {
                    throw new Error("invalid character code. Value: " + token.arg);
                  }
                  token.arg = isnan(num) ? String(token.arg) : fromCharCode(num);
                }
                break;
              case "e":
              case "E":
              case "f":
              case "F":
              case "g":
              case "G":
                if (!hasPeriod) {
                  token.precision = 6;
                }
                token.arg = formatDouble(token);
                break;
              default:
                throw new Error("invalid specifier: " + token.specifier);
            }
            if (token.maxWidth >= 0 && token.arg.length > token.maxWidth) {
              token.arg = token.arg.substring(0, token.maxWidth);
            }
            if (token.padZeros) {
              token.arg = zeroPad(token.arg, token.width || token.precision, token.padRight);
            } else if (token.width) {
              token.arg = spacePad(token.arg, token.width, token.padRight);
            }
            out += token.arg || "";
            pos += 1;
          }
        }
        return out;
      }
      module2.exports = formatInterpolate;
    }
  });

  // node_modules/@stdlib/string-base-format-interpolate/lib/index.js
  var require_lib = __commonJS({
    "node_modules/@stdlib/string-base-format-interpolate/lib/index.js"(exports, module2) {
      "use strict";
      var main2 = require_main();
      module2.exports = main2;
    }
  });

  // node_modules/@stdlib/string-base-format-tokenize/lib/main.js
  var require_main2 = __commonJS({
    "node_modules/@stdlib/string-base-format-tokenize/lib/main.js"(exports, module2) {
      "use strict";
      var RE = /%(?:([1-9]\d*)\$)?([0 +\-#]*)(\*|\d+)?(?:(\.)(\*|\d+)?)?[hlL]?([%A-Za-z])/g;
      function parse(match) {
        var token = {
          "mapping": match[1] ? parseInt(match[1], 10) : void 0,
          "flags": match[2],
          "width": match[3],
          "precision": match[5],
          "specifier": match[6]
        };
        if (match[4] === "." && match[5] === void 0) {
          token.precision = "1";
        }
        return token;
      }
      function formatTokenize(str) {
        var content;
        var tokens;
        var match;
        var prev;
        tokens = [];
        prev = 0;
        match = RE.exec(str);
        while (match) {
          content = str.slice(prev, RE.lastIndex - match[0].length);
          if (content.length) {
            tokens.push(content);
          }
          tokens.push(parse(match));
          prev = RE.lastIndex;
          match = RE.exec(str);
        }
        content = str.slice(prev);
        if (content.length) {
          tokens.push(content);
        }
        return tokens;
      }
      module2.exports = formatTokenize;
    }
  });

  // node_modules/@stdlib/string-base-format-tokenize/lib/index.js
  var require_lib2 = __commonJS({
    "node_modules/@stdlib/string-base-format-tokenize/lib/index.js"(exports, module2) {
      "use strict";
      var main2 = require_main2();
      module2.exports = main2;
    }
  });

  // node_modules/@stdlib/string-format/lib/is_string.js
  var require_is_string2 = __commonJS({
    "node_modules/@stdlib/string-format/lib/is_string.js"(exports, module2) {
      "use strict";
      function isString(value) {
        return typeof value === "string";
      }
      module2.exports = isString;
    }
  });

  // node_modules/@stdlib/string-format/lib/main.js
  var require_main3 = __commonJS({
    "node_modules/@stdlib/string-format/lib/main.js"(exports, module2) {
      "use strict";
      var interpolate = require_lib();
      var tokenize = require_lib2();
      var isString = require_is_string2();
      function format(str) {
        var args;
        var i;
        if (!isString(str)) {
          throw new TypeError(format("invalid argument. First argument must be a string. Value: `%s`.", str));
        }
        args = [tokenize(str)];
        for (i = 1; i < arguments.length; i++) {
          args.push(arguments[i]);
        }
        return interpolate.apply(null, args);
      }
      module2.exports = format;
    }
  });

  // node_modules/@stdlib/string-format/lib/index.js
  var require_lib3 = __commonJS({
    "node_modules/@stdlib/string-format/lib/index.js"(exports, module2) {
      "use strict";
      var main2 = require_main3();
      module2.exports = main2;
    }
  });

  // node_modules/@stdlib/utils-define-property/lib/polyfill.js
  var require_polyfill = __commonJS({
    "node_modules/@stdlib/utils-define-property/lib/polyfill.js"(exports, module2) {
      "use strict";
      var format = require_lib3();
      var objectProtoype = Object.prototype;
      var toStr = objectProtoype.toString;
      var defineGetter = objectProtoype.__defineGetter__;
      var defineSetter = objectProtoype.__defineSetter__;
      var lookupGetter = objectProtoype.__lookupGetter__;
      var lookupSetter = objectProtoype.__lookupSetter__;
      function defineProperty(obj, prop, descriptor) {
        var prototype;
        var hasValue;
        var hasGet;
        var hasSet;
        if (typeof obj !== "object" || obj === null || toStr.call(obj) === "[object Array]") {
          throw new TypeError(format("invalid argument. First argument must be an object. Value: `%s`.", obj));
        }
        if (typeof descriptor !== "object" || descriptor === null || toStr.call(descriptor) === "[object Array]") {
          throw new TypeError(format("invalid argument. Property descriptor must be an object. Value: `%s`.", descriptor));
        }
        hasValue = "value" in descriptor;
        if (hasValue) {
          if (lookupGetter.call(obj, prop) || lookupSetter.call(obj, prop)) {
            prototype = obj.__proto__;
            obj.__proto__ = objectProtoype;
            delete obj[prop];
            obj[prop] = descriptor.value;
            obj.__proto__ = prototype;
          } else {
            obj[prop] = descriptor.value;
          }
        }
        hasGet = "get" in descriptor;
        hasSet = "set" in descriptor;
        if (hasValue && (hasGet || hasSet)) {
          throw new Error("invalid argument. Cannot specify one or more accessors and a value or writable attribute in the property descriptor.");
        }
        if (hasGet && defineGetter) {
          defineGetter.call(obj, prop, descriptor.get);
        }
        if (hasSet && defineSetter) {
          defineSetter.call(obj, prop, descriptor.set);
        }
        return obj;
      }
      module2.exports = defineProperty;
    }
  });

  // node_modules/@stdlib/utils-define-property/lib/index.js
  var require_lib4 = __commonJS({
    "node_modules/@stdlib/utils-define-property/lib/index.js"(exports, module2) {
      "use strict";
      var hasDefinePropertySupport = require_has_define_property_support();
      var builtin = require_builtin();
      var polyfill = require_polyfill();
      var defineProperty;
      if (hasDefinePropertySupport()) {
        defineProperty = builtin;
      } else {
        defineProperty = polyfill;
      }
      module2.exports = defineProperty;
    }
  });

  // node_modules/@stdlib/utils-define-nonenumerable-read-only-property/lib/main.js
  var require_main4 = __commonJS({
    "node_modules/@stdlib/utils-define-nonenumerable-read-only-property/lib/main.js"(exports, module2) {
      "use strict";
      var defineProperty = require_lib4();
      function setNonEnumerableReadOnly(obj, prop, value) {
        defineProperty(obj, prop, {
          "configurable": false,
          "enumerable": false,
          "writable": false,
          "value": value
        });
      }
      module2.exports = setNonEnumerableReadOnly;
    }
  });

  // node_modules/@stdlib/utils-define-nonenumerable-read-only-property/lib/index.js
  var require_lib5 = __commonJS({
    "node_modules/@stdlib/utils-define-nonenumerable-read-only-property/lib/index.js"(exports, module2) {
      "use strict";
      var main2 = require_main4();
      module2.exports = main2;
    }
  });

  // node_modules/@stdlib/math-base-assert-is-nan/lib/main.js
  var require_main5 = __commonJS({
    "node_modules/@stdlib/math-base-assert-is-nan/lib/main.js"(exports, module2) {
      "use strict";
      function isnan(x) {
        return x !== x;
      }
      module2.exports = isnan;
    }
  });

  // node_modules/@stdlib/math-base-assert-is-nan/lib/index.js
  var require_lib6 = __commonJS({
    "node_modules/@stdlib/math-base-assert-is-nan/lib/index.js"(exports, module2) {
      "use strict";
      var main2 = require_main5();
      module2.exports = main2;
    }
  });

  // node_modules/@stdlib/math-base-special-sqrt/lib/main.js
  var require_main6 = __commonJS({
    "node_modules/@stdlib/math-base-special-sqrt/lib/main.js"(exports, module2) {
      "use strict";
      var sqrt = Math.sqrt;
      module2.exports = sqrt;
    }
  });

  // node_modules/@stdlib/math-base-special-sqrt/lib/index.js
  var require_lib7 = __commonJS({
    "node_modules/@stdlib/math-base-special-sqrt/lib/index.js"(exports, module2) {
      "use strict";
      var main2 = require_main6();
      module2.exports = main2;
    }
  });

  // node_modules/@stdlib/assert-has-symbol-support/lib/main.js
  var require_main7 = __commonJS({
    "node_modules/@stdlib/assert-has-symbol-support/lib/main.js"(exports, module2) {
      "use strict";
      function hasSymbolSupport() {
        return typeof Symbol === "function" && typeof Symbol("foo") === "symbol";
      }
      module2.exports = hasSymbolSupport;
    }
  });

  // node_modules/@stdlib/assert-has-symbol-support/lib/index.js
  var require_lib8 = __commonJS({
    "node_modules/@stdlib/assert-has-symbol-support/lib/index.js"(exports, module2) {
      "use strict";
      var main2 = require_main7();
      module2.exports = main2;
    }
  });

  // node_modules/@stdlib/assert-has-tostringtag-support/lib/main.js
  var require_main8 = __commonJS({
    "node_modules/@stdlib/assert-has-tostringtag-support/lib/main.js"(exports, module2) {
      "use strict";
      var hasSymbols = require_lib8();
      var FLG = hasSymbols();
      function hasToStringTagSupport() {
        return FLG && typeof Symbol.toStringTag === "symbol";
      }
      module2.exports = hasToStringTagSupport;
    }
  });

  // node_modules/@stdlib/assert-has-tostringtag-support/lib/index.js
  var require_lib9 = __commonJS({
    "node_modules/@stdlib/assert-has-tostringtag-support/lib/index.js"(exports, module2) {
      "use strict";
      var main2 = require_main8();
      module2.exports = main2;
    }
  });

  // node_modules/@stdlib/utils-native-class/lib/tostring.js
  var require_tostring = __commonJS({
    "node_modules/@stdlib/utils-native-class/lib/tostring.js"(exports, module2) {
      "use strict";
      var toStr = Object.prototype.toString;
      module2.exports = toStr;
    }
  });

  // node_modules/@stdlib/utils-native-class/lib/main.js
  var require_main9 = __commonJS({
    "node_modules/@stdlib/utils-native-class/lib/main.js"(exports, module2) {
      "use strict";
      var toStr = require_tostring();
      function nativeClass(v) {
        return toStr.call(v);
      }
      module2.exports = nativeClass;
    }
  });

  // node_modules/@stdlib/assert-has-own-property/lib/main.js
  var require_main10 = __commonJS({
    "node_modules/@stdlib/assert-has-own-property/lib/main.js"(exports, module2) {
      "use strict";
      var has = Object.prototype.hasOwnProperty;
      function hasOwnProp(value, property) {
        if (value === void 0 || value === null) {
          return false;
        }
        return has.call(value, property);
      }
      module2.exports = hasOwnProp;
    }
  });

  // node_modules/@stdlib/assert-has-own-property/lib/index.js
  var require_lib10 = __commonJS({
    "node_modules/@stdlib/assert-has-own-property/lib/index.js"(exports, module2) {
      "use strict";
      var main2 = require_main10();
      module2.exports = main2;
    }
  });

  // node_modules/@stdlib/symbol-ctor/lib/main.js
  var require_main11 = __commonJS({
    "node_modules/@stdlib/symbol-ctor/lib/main.js"(exports, module2) {
      "use strict";
      var Sym = typeof Symbol === "function" ? Symbol : void 0;
      module2.exports = Sym;
    }
  });

  // node_modules/@stdlib/symbol-ctor/lib/index.js
  var require_lib11 = __commonJS({
    "node_modules/@stdlib/symbol-ctor/lib/index.js"(exports, module2) {
      "use strict";
      var main2 = require_main11();
      module2.exports = main2;
    }
  });

  // node_modules/@stdlib/utils-native-class/lib/tostringtag.js
  var require_tostringtag = __commonJS({
    "node_modules/@stdlib/utils-native-class/lib/tostringtag.js"(exports, module2) {
      "use strict";
      var Symbol2 = require_lib11();
      var toStrTag = typeof Symbol2 === "function" ? Symbol2.toStringTag : "";
      module2.exports = toStrTag;
    }
  });

  // node_modules/@stdlib/utils-native-class/lib/polyfill.js
  var require_polyfill2 = __commonJS({
    "node_modules/@stdlib/utils-native-class/lib/polyfill.js"(exports, module2) {
      "use strict";
      var hasOwnProp = require_lib10();
      var toStringTag = require_tostringtag();
      var toStr = require_tostring();
      function nativeClass(v) {
        var isOwn;
        var tag;
        var out;
        if (v === null || v === void 0) {
          return toStr.call(v);
        }
        tag = v[toStringTag];
        isOwn = hasOwnProp(v, toStringTag);
        try {
          v[toStringTag] = void 0;
        } catch (err) {
          return toStr.call(v);
        }
        out = toStr.call(v);
        if (isOwn) {
          v[toStringTag] = tag;
        } else {
          delete v[toStringTag];
        }
        return out;
      }
      module2.exports = nativeClass;
    }
  });

  // node_modules/@stdlib/utils-native-class/lib/index.js
  var require_lib12 = __commonJS({
    "node_modules/@stdlib/utils-native-class/lib/index.js"(exports, module2) {
      "use strict";
      var hasToStringTag = require_lib9();
      var builtin = require_main9();
      var polyfill = require_polyfill2();
      var main2;
      if (hasToStringTag()) {
        main2 = polyfill;
      } else {
        main2 = builtin;
      }
      module2.exports = main2;
    }
  });

  // node_modules/@stdlib/assert-is-uint32array/lib/main.js
  var require_main12 = __commonJS({
    "node_modules/@stdlib/assert-is-uint32array/lib/main.js"(exports, module2) {
      "use strict";
      var nativeClass = require_lib12();
      var hasUint32Array = typeof Uint32Array === "function";
      function isUint32Array(value) {
        return hasUint32Array && value instanceof Uint32Array || // eslint-disable-line stdlib/require-globals
        nativeClass(value) === "[object Uint32Array]";
      }
      module2.exports = isUint32Array;
    }
  });

  // node_modules/@stdlib/assert-is-uint32array/lib/index.js
  var require_lib13 = __commonJS({
    "node_modules/@stdlib/assert-is-uint32array/lib/index.js"(exports, module2) {
      "use strict";
      var isUint32Array = require_main12();
      module2.exports = isUint32Array;
    }
  });

  // node_modules/@stdlib/constants-uint32-max/lib/index.js
  var require_lib14 = __commonJS({
    "node_modules/@stdlib/constants-uint32-max/lib/index.js"(exports, module2) {
      "use strict";
      var UINT32_MAX = 4294967295;
      module2.exports = UINT32_MAX;
    }
  });

  // node_modules/@stdlib/assert-has-uint32array-support/lib/uint32array.js
  var require_uint32array = __commonJS({
    "node_modules/@stdlib/assert-has-uint32array-support/lib/uint32array.js"(exports, module2) {
      "use strict";
      var main2 = typeof Uint32Array === "function" ? Uint32Array : null;
      module2.exports = main2;
    }
  });

  // node_modules/@stdlib/assert-has-uint32array-support/lib/main.js
  var require_main13 = __commonJS({
    "node_modules/@stdlib/assert-has-uint32array-support/lib/main.js"(exports, module2) {
      "use strict";
      var isUint32Array = require_lib13();
      var UINT32_MAX = require_lib14();
      var GlobalUint32Array = require_uint32array();
      function hasUint32ArraySupport() {
        var bool;
        var arr;
        if (typeof GlobalUint32Array !== "function") {
          return false;
        }
        try {
          arr = [1, 3.14, -3.14, UINT32_MAX + 1, UINT32_MAX + 2];
          arr = new GlobalUint32Array(arr);
          bool = isUint32Array(arr) && arr[0] === 1 && arr[1] === 3 && // truncation
          arr[2] === UINT32_MAX - 2 && // truncation and wrap around
          arr[3] === 0 && // wrap around
          arr[4] === 1;
        } catch (err) {
          bool = false;
        }
        return bool;
      }
      module2.exports = hasUint32ArraySupport;
    }
  });

  // node_modules/@stdlib/assert-has-uint32array-support/lib/index.js
  var require_lib15 = __commonJS({
    "node_modules/@stdlib/assert-has-uint32array-support/lib/index.js"(exports, module2) {
      "use strict";
      var hasUint32ArraySupport = require_main13();
      module2.exports = hasUint32ArraySupport;
    }
  });

  // node_modules/@stdlib/array-uint32/lib/main.js
  var require_main14 = __commonJS({
    "node_modules/@stdlib/array-uint32/lib/main.js"(exports, module2) {
      "use strict";
      var ctor = typeof Uint32Array === "function" ? Uint32Array : void 0;
      module2.exports = ctor;
    }
  });

  // node_modules/@stdlib/array-uint32/lib/polyfill.js
  var require_polyfill3 = __commonJS({
    "node_modules/@stdlib/array-uint32/lib/polyfill.js"(exports, module2) {
      "use strict";
      function polyfill() {
        throw new Error("not implemented");
      }
      module2.exports = polyfill;
    }
  });

  // node_modules/@stdlib/array-uint32/lib/index.js
  var require_lib16 = __commonJS({
    "node_modules/@stdlib/array-uint32/lib/index.js"(exports, module2) {
      "use strict";
      var hasUint32ArraySupport = require_lib15();
      var builtin = require_main14();
      var polyfill = require_polyfill3();
      var ctor;
      if (hasUint32ArraySupport()) {
        ctor = builtin;
      } else {
        ctor = polyfill;
      }
      module2.exports = ctor;
    }
  });

  // node_modules/@stdlib/assert-is-float64array/lib/main.js
  var require_main15 = __commonJS({
    "node_modules/@stdlib/assert-is-float64array/lib/main.js"(exports, module2) {
      "use strict";
      var nativeClass = require_lib12();
      var hasFloat64Array = typeof Float64Array === "function";
      function isFloat64Array(value) {
        return hasFloat64Array && value instanceof Float64Array || // eslint-disable-line stdlib/require-globals
        nativeClass(value) === "[object Float64Array]";
      }
      module2.exports = isFloat64Array;
    }
  });

  // node_modules/@stdlib/assert-is-float64array/lib/index.js
  var require_lib17 = __commonJS({
    "node_modules/@stdlib/assert-is-float64array/lib/index.js"(exports, module2) {
      "use strict";
      var isFloat64Array = require_main15();
      module2.exports = isFloat64Array;
    }
  });

  // node_modules/@stdlib/assert-has-float64array-support/lib/float64array.js
  var require_float64array = __commonJS({
    "node_modules/@stdlib/assert-has-float64array-support/lib/float64array.js"(exports, module2) {
      "use strict";
      var main2 = typeof Float64Array === "function" ? Float64Array : null;
      module2.exports = main2;
    }
  });

  // node_modules/@stdlib/assert-has-float64array-support/lib/main.js
  var require_main16 = __commonJS({
    "node_modules/@stdlib/assert-has-float64array-support/lib/main.js"(exports, module2) {
      "use strict";
      var isFloat64Array = require_lib17();
      var GlobalFloat64Array = require_float64array();
      function hasFloat64ArraySupport() {
        var bool;
        var arr;
        if (typeof GlobalFloat64Array !== "function") {
          return false;
        }
        try {
          arr = new GlobalFloat64Array([1, 3.14, -3.14, NaN]);
          bool = isFloat64Array(arr) && arr[0] === 1 && arr[1] === 3.14 && arr[2] === -3.14 && arr[3] !== arr[3];
        } catch (err) {
          bool = false;
        }
        return bool;
      }
      module2.exports = hasFloat64ArraySupport;
    }
  });

  // node_modules/@stdlib/assert-has-float64array-support/lib/index.js
  var require_lib18 = __commonJS({
    "node_modules/@stdlib/assert-has-float64array-support/lib/index.js"(exports, module2) {
      "use strict";
      var hasFloat64ArraySupport = require_main16();
      module2.exports = hasFloat64ArraySupport;
    }
  });

  // node_modules/@stdlib/array-float64/lib/main.js
  var require_main17 = __commonJS({
    "node_modules/@stdlib/array-float64/lib/main.js"(exports, module2) {
      "use strict";
      var ctor = typeof Float64Array === "function" ? Float64Array : void 0;
      module2.exports = ctor;
    }
  });

  // node_modules/@stdlib/array-float64/lib/polyfill.js
  var require_polyfill4 = __commonJS({
    "node_modules/@stdlib/array-float64/lib/polyfill.js"(exports, module2) {
      "use strict";
      function polyfill() {
        throw new Error("not implemented");
      }
      module2.exports = polyfill;
    }
  });

  // node_modules/@stdlib/array-float64/lib/index.js
  var require_lib19 = __commonJS({
    "node_modules/@stdlib/array-float64/lib/index.js"(exports, module2) {
      "use strict";
      var hasFloat64ArraySupport = require_lib18();
      var builtin = require_main17();
      var polyfill = require_polyfill4();
      var ctor;
      if (hasFloat64ArraySupport()) {
        ctor = builtin;
      } else {
        ctor = polyfill;
      }
      module2.exports = ctor;
    }
  });

  // node_modules/@stdlib/assert-is-uint8array/lib/main.js
  var require_main18 = __commonJS({
    "node_modules/@stdlib/assert-is-uint8array/lib/main.js"(exports, module2) {
      "use strict";
      var nativeClass = require_lib12();
      var hasUint8Array = typeof Uint8Array === "function";
      function isUint8Array(value) {
        return hasUint8Array && value instanceof Uint8Array || // eslint-disable-line stdlib/require-globals
        nativeClass(value) === "[object Uint8Array]";
      }
      module2.exports = isUint8Array;
    }
  });

  // node_modules/@stdlib/assert-is-uint8array/lib/index.js
  var require_lib20 = __commonJS({
    "node_modules/@stdlib/assert-is-uint8array/lib/index.js"(exports, module2) {
      "use strict";
      var isUint8Array = require_main18();
      module2.exports = isUint8Array;
    }
  });

  // node_modules/@stdlib/constants-uint8-max/lib/index.js
  var require_lib21 = __commonJS({
    "node_modules/@stdlib/constants-uint8-max/lib/index.js"(exports, module2) {
      "use strict";
      var UINT8_MAX = 255 | 0;
      module2.exports = UINT8_MAX;
    }
  });

  // node_modules/@stdlib/assert-has-uint8array-support/lib/uint8array.js
  var require_uint8array = __commonJS({
    "node_modules/@stdlib/assert-has-uint8array-support/lib/uint8array.js"(exports, module2) {
      "use strict";
      var main2 = typeof Uint8Array === "function" ? Uint8Array : null;
      module2.exports = main2;
    }
  });

  // node_modules/@stdlib/assert-has-uint8array-support/lib/main.js
  var require_main19 = __commonJS({
    "node_modules/@stdlib/assert-has-uint8array-support/lib/main.js"(exports, module2) {
      "use strict";
      var isUint8Array = require_lib20();
      var UINT8_MAX = require_lib21();
      var GlobalUint8Array = require_uint8array();
      function hasUint8ArraySupport() {
        var bool;
        var arr;
        if (typeof GlobalUint8Array !== "function") {
          return false;
        }
        try {
          arr = [1, 3.14, -3.14, UINT8_MAX + 1, UINT8_MAX + 2];
          arr = new GlobalUint8Array(arr);
          bool = isUint8Array(arr) && arr[0] === 1 && arr[1] === 3 && // truncation
          arr[2] === UINT8_MAX - 2 && // truncation and wrap around
          arr[3] === 0 && // wrap around
          arr[4] === 1;
        } catch (err) {
          bool = false;
        }
        return bool;
      }
      module2.exports = hasUint8ArraySupport;
    }
  });

  // node_modules/@stdlib/assert-has-uint8array-support/lib/index.js
  var require_lib22 = __commonJS({
    "node_modules/@stdlib/assert-has-uint8array-support/lib/index.js"(exports, module2) {
      "use strict";
      var hasUint8ArraySupport = require_main19();
      module2.exports = hasUint8ArraySupport;
    }
  });

  // node_modules/@stdlib/array-uint8/lib/main.js
  var require_main20 = __commonJS({
    "node_modules/@stdlib/array-uint8/lib/main.js"(exports, module2) {
      "use strict";
      var ctor = typeof Uint8Array === "function" ? Uint8Array : void 0;
      module2.exports = ctor;
    }
  });

  // node_modules/@stdlib/array-uint8/lib/polyfill.js
  var require_polyfill5 = __commonJS({
    "node_modules/@stdlib/array-uint8/lib/polyfill.js"(exports, module2) {
      "use strict";
      function polyfill() {
        throw new Error("not implemented");
      }
      module2.exports = polyfill;
    }
  });

  // node_modules/@stdlib/array-uint8/lib/index.js
  var require_lib23 = __commonJS({
    "node_modules/@stdlib/array-uint8/lib/index.js"(exports, module2) {
      "use strict";
      var hasUint8ArraySupport = require_lib22();
      var builtin = require_main20();
      var polyfill = require_polyfill5();
      var ctor;
      if (hasUint8ArraySupport()) {
        ctor = builtin;
      } else {
        ctor = polyfill;
      }
      module2.exports = ctor;
    }
  });

  // node_modules/@stdlib/assert-is-uint16array/lib/main.js
  var require_main21 = __commonJS({
    "node_modules/@stdlib/assert-is-uint16array/lib/main.js"(exports, module2) {
      "use strict";
      var nativeClass = require_lib12();
      var hasUint16Array = typeof Uint16Array === "function";
      function isUint16Array(value) {
        return hasUint16Array && value instanceof Uint16Array || // eslint-disable-line stdlib/require-globals
        nativeClass(value) === "[object Uint16Array]";
      }
      module2.exports = isUint16Array;
    }
  });

  // node_modules/@stdlib/assert-is-uint16array/lib/index.js
  var require_lib24 = __commonJS({
    "node_modules/@stdlib/assert-is-uint16array/lib/index.js"(exports, module2) {
      "use strict";
      var isUint16Array = require_main21();
      module2.exports = isUint16Array;
    }
  });

  // node_modules/@stdlib/constants-uint16-max/lib/index.js
  var require_lib25 = __commonJS({
    "node_modules/@stdlib/constants-uint16-max/lib/index.js"(exports, module2) {
      "use strict";
      var UINT16_MAX = 65535 | 0;
      module2.exports = UINT16_MAX;
    }
  });

  // node_modules/@stdlib/assert-has-uint16array-support/lib/uint16array.js
  var require_uint16array = __commonJS({
    "node_modules/@stdlib/assert-has-uint16array-support/lib/uint16array.js"(exports, module2) {
      "use strict";
      var main2 = typeof Uint16Array === "function" ? Uint16Array : null;
      module2.exports = main2;
    }
  });

  // node_modules/@stdlib/assert-has-uint16array-support/lib/main.js
  var require_main22 = __commonJS({
    "node_modules/@stdlib/assert-has-uint16array-support/lib/main.js"(exports, module2) {
      "use strict";
      var isUint16Array = require_lib24();
      var UINT16_MAX = require_lib25();
      var GlobalUint16Array = require_uint16array();
      function hasUint16ArraySupport() {
        var bool;
        var arr;
        if (typeof GlobalUint16Array !== "function") {
          return false;
        }
        try {
          arr = [1, 3.14, -3.14, UINT16_MAX + 1, UINT16_MAX + 2];
          arr = new GlobalUint16Array(arr);
          bool = isUint16Array(arr) && arr[0] === 1 && arr[1] === 3 && // truncation
          arr[2] === UINT16_MAX - 2 && // truncation and wrap around
          arr[3] === 0 && // wrap around
          arr[4] === 1;
        } catch (err) {
          bool = false;
        }
        return bool;
      }
      module2.exports = hasUint16ArraySupport;
    }
  });

  // node_modules/@stdlib/assert-has-uint16array-support/lib/index.js
  var require_lib26 = __commonJS({
    "node_modules/@stdlib/assert-has-uint16array-support/lib/index.js"(exports, module2) {
      "use strict";
      var hasUint16ArraySupport = require_main22();
      module2.exports = hasUint16ArraySupport;
    }
  });

  // node_modules/@stdlib/array-uint16/lib/main.js
  var require_main23 = __commonJS({
    "node_modules/@stdlib/array-uint16/lib/main.js"(exports, module2) {
      "use strict";
      var ctor = typeof Uint16Array === "function" ? Uint16Array : void 0;
      module2.exports = ctor;
    }
  });

  // node_modules/@stdlib/array-uint16/lib/polyfill.js
  var require_polyfill6 = __commonJS({
    "node_modules/@stdlib/array-uint16/lib/polyfill.js"(exports, module2) {
      "use strict";
      function polyfill() {
        throw new Error("not implemented");
      }
      module2.exports = polyfill;
    }
  });

  // node_modules/@stdlib/array-uint16/lib/index.js
  var require_lib27 = __commonJS({
    "node_modules/@stdlib/array-uint16/lib/index.js"(exports, module2) {
      "use strict";
      var hasUint16ArraySupport = require_lib26();
      var builtin = require_main23();
      var polyfill = require_polyfill6();
      var ctor;
      if (hasUint16ArraySupport()) {
        ctor = builtin;
      } else {
        ctor = polyfill;
      }
      module2.exports = ctor;
    }
  });

  // node_modules/@stdlib/assert-is-little-endian/lib/ctors.js
  var require_ctors = __commonJS({
    "node_modules/@stdlib/assert-is-little-endian/lib/ctors.js"(exports, module2) {
      "use strict";
      var Uint8Array2 = require_lib23();
      var Uint16Array2 = require_lib27();
      var ctors = {
        "uint16": Uint16Array2,
        "uint8": Uint8Array2
      };
      module2.exports = ctors;
    }
  });

  // node_modules/@stdlib/assert-is-little-endian/lib/main.js
  var require_main24 = __commonJS({
    "node_modules/@stdlib/assert-is-little-endian/lib/main.js"(exports, module2) {
      "use strict";
      var ctors = require_ctors();
      var bool;
      function isLittleEndian() {
        var uint16view;
        var uint8view;
        uint16view = new ctors["uint16"](1);
        uint16view[0] = 4660;
        uint8view = new ctors["uint8"](uint16view.buffer);
        return uint8view[0] === 52;
      }
      bool = isLittleEndian();
      module2.exports = bool;
    }
  });

  // node_modules/@stdlib/assert-is-little-endian/lib/index.js
  var require_lib28 = __commonJS({
    "node_modules/@stdlib/assert-is-little-endian/lib/index.js"(exports, module2) {
      "use strict";
      var IS_LITTLE_ENDIAN = require_main24();
      module2.exports = IS_LITTLE_ENDIAN;
    }
  });

  // node_modules/@stdlib/number-float64-base-get-high-word/lib/high.js
  var require_high = __commonJS({
    "node_modules/@stdlib/number-float64-base-get-high-word/lib/high.js"(exports, module2) {
      "use strict";
      var isLittleEndian = require_lib28();
      var HIGH;
      if (isLittleEndian === true) {
        HIGH = 1;
      } else {
        HIGH = 0;
      }
      module2.exports = HIGH;
    }
  });

  // node_modules/@stdlib/number-float64-base-get-high-word/lib/main.js
  var require_main25 = __commonJS({
    "node_modules/@stdlib/number-float64-base-get-high-word/lib/main.js"(exports, module2) {
      "use strict";
      var Uint32Array2 = require_lib16();
      var Float64Array2 = require_lib19();
      var HIGH = require_high();
      var FLOAT64_VIEW = new Float64Array2(1);
      var UINT32_VIEW = new Uint32Array2(FLOAT64_VIEW.buffer);
      function getHighWord(x) {
        FLOAT64_VIEW[0] = x;
        return UINT32_VIEW[HIGH];
      }
      module2.exports = getHighWord;
    }
  });

  // node_modules/@stdlib/number-float64-base-get-high-word/lib/index.js
  var require_lib29 = __commonJS({
    "node_modules/@stdlib/number-float64-base-get-high-word/lib/index.js"(exports, module2) {
      "use strict";
      var main2 = require_main25();
      module2.exports = main2;
    }
  });

  // node_modules/@stdlib/number-float64-base-set-high-word/lib/high.js
  var require_high2 = __commonJS({
    "node_modules/@stdlib/number-float64-base-set-high-word/lib/high.js"(exports, module2) {
      "use strict";
      var isLittleEndian = require_lib28();
      var HIGH;
      if (isLittleEndian === true) {
        HIGH = 1;
      } else {
        HIGH = 0;
      }
      module2.exports = HIGH;
    }
  });

  // node_modules/@stdlib/number-float64-base-set-high-word/lib/main.js
  var require_main26 = __commonJS({
    "node_modules/@stdlib/number-float64-base-set-high-word/lib/main.js"(exports, module2) {
      "use strict";
      var Uint32Array2 = require_lib16();
      var Float64Array2 = require_lib19();
      var HIGH = require_high2();
      var FLOAT64_VIEW = new Float64Array2(1);
      var UINT32_VIEW = new Uint32Array2(FLOAT64_VIEW.buffer);
      function setHighWord(x, high) {
        FLOAT64_VIEW[0] = x;
        UINT32_VIEW[HIGH] = high >>> 0;
        return FLOAT64_VIEW[0];
      }
      module2.exports = setHighWord;
    }
  });

  // node_modules/@stdlib/number-float64-base-set-high-word/lib/index.js
  var require_lib30 = __commonJS({
    "node_modules/@stdlib/number-float64-base-set-high-word/lib/index.js"(exports, module2) {
      "use strict";
      var main2 = require_main26();
      module2.exports = main2;
    }
  });

  // node_modules/@stdlib/constants-float64-exponent-bias/lib/index.js
  var require_lib31 = __commonJS({
    "node_modules/@stdlib/constants-float64-exponent-bias/lib/index.js"(exports, module2) {
      "use strict";
      var FLOAT64_EXPONENT_BIAS = 1023 | 0;
      module2.exports = FLOAT64_EXPONENT_BIAS;
    }
  });

  // node_modules/@stdlib/number-ctor/lib/main.js
  var require_main27 = __commonJS({
    "node_modules/@stdlib/number-ctor/lib/main.js"(exports, module2) {
      "use strict";
      module2.exports = Number;
    }
  });

  // node_modules/@stdlib/number-ctor/lib/index.js
  var require_lib32 = __commonJS({
    "node_modules/@stdlib/number-ctor/lib/index.js"(exports, module2) {
      "use strict";
      var main2 = require_main27();
      module2.exports = main2;
    }
  });

  // node_modules/@stdlib/constants-float64-ninf/lib/index.js
  var require_lib33 = __commonJS({
    "node_modules/@stdlib/constants-float64-ninf/lib/index.js"(exports, module2) {
      "use strict";
      var Number2 = require_lib32();
      var FLOAT64_NINF = Number2.NEGATIVE_INFINITY;
      module2.exports = FLOAT64_NINF;
    }
  });

  // node_modules/@stdlib/math-base-special-ln/lib/polyval_p.js
  var require_polyval_p = __commonJS({
    "node_modules/@stdlib/math-base-special-ln/lib/polyval_p.js"(exports, module2) {
      "use strict";
      function evalpoly(x) {
        if (x === 0) {
          return 0.3999999999940942;
        }
        return 0.3999999999940942 + x * (0.22222198432149784 + x * 0.15313837699209373);
      }
      module2.exports = evalpoly;
    }
  });

  // node_modules/@stdlib/math-base-special-ln/lib/polyval_q.js
  var require_polyval_q = __commonJS({
    "node_modules/@stdlib/math-base-special-ln/lib/polyval_q.js"(exports, module2) {
      "use strict";
      function evalpoly(x) {
        if (x === 0) {
          return 0.6666666666666735;
        }
        return 0.6666666666666735 + x * (0.2857142874366239 + x * (0.1818357216161805 + x * 0.14798198605116586));
      }
      module2.exports = evalpoly;
    }
  });

  // node_modules/@stdlib/math-base-special-ln/lib/main.js
  var require_main28 = __commonJS({
    "node_modules/@stdlib/math-base-special-ln/lib/main.js"(exports, module2) {
      "use strict";
      var getHighWord = require_lib29();
      var setHighWord = require_lib30();
      var isnan = require_lib6();
      var BIAS = require_lib31();
      var NINF = require_lib33();
      var polyvalP = require_polyval_p();
      var polyvalQ = require_polyval_q();
      var LN2_HI = 0.6931471803691238;
      var LN2_LO = 19082149292705877e-26;
      var TWO54 = 18014398509481984;
      var ONE_THIRD = 0.3333333333333333;
      var HIGH_SIGNIFICAND_MASK = 1048575 | 0;
      var HIGH_MAX_NORMAL_EXP = 2146435072 | 0;
      var HIGH_MIN_NORMAL_EXP = 1048576 | 0;
      var HIGH_BIASED_EXP_0 = 1072693248 | 0;
      function ln(x) {
        var hfsq;
        var hx;
        var t2;
        var t1;
        var k;
        var R;
        var f;
        var i;
        var j;
        var s;
        var w;
        var z;
        if (x === 0) {
          return NINF;
        }
        if (isnan(x) || x < 0) {
          return NaN;
        }
        hx = getHighWord(x);
        k = 0 | 0;
        if (hx < HIGH_MIN_NORMAL_EXP) {
          k -= 54 | 0;
          x *= TWO54;
          hx = getHighWord(x);
        }
        if (hx >= HIGH_MAX_NORMAL_EXP) {
          return x + x;
        }
        k += (hx >> 20) - BIAS | 0;
        hx &= HIGH_SIGNIFICAND_MASK;
        i = hx + 614244 & 1048576 | 0;
        x = setHighWord(x, hx | i ^ HIGH_BIASED_EXP_0);
        k += i >> 20 | 0;
        f = x - 1;
        if ((HIGH_SIGNIFICAND_MASK & 2 + hx) < 3) {
          if (f === 0) {
            if (k === 0) {
              return 0;
            }
            return k * LN2_HI + k * LN2_LO;
          }
          R = f * f * (0.5 - ONE_THIRD * f);
          if (k === 0) {
            return f - R;
          }
          return k * LN2_HI - (R - k * LN2_LO - f);
        }
        s = f / (2 + f);
        z = s * s;
        i = hx - 398458 | 0;
        w = z * z;
        j = 440401 - hx | 0;
        t1 = w * polyvalP(w);
        t2 = z * polyvalQ(w);
        i |= j;
        R = t2 + t1;
        if (i > 0) {
          hfsq = 0.5 * f * f;
          if (k === 0) {
            return f - (hfsq - s * (hfsq + R));
          }
          return k * LN2_HI - (hfsq - (s * (hfsq + R) + k * LN2_LO) - f);
        }
        if (k === 0) {
          return f - s * (f - R);
        }
        return k * LN2_HI - (s * (f - R) - k * LN2_LO - f);
      }
      module2.exports = ln;
    }
  });

  // node_modules/@stdlib/math-base-special-ln/lib/index.js
  var require_lib34 = __commonJS({
    "node_modules/@stdlib/math-base-special-ln/lib/index.js"(exports, module2) {
      "use strict";
      var main2 = require_main28();
      module2.exports = main2;
    }
  });

  // node_modules/@stdlib/constants-float64-pinf/lib/index.js
  var require_lib35 = __commonJS({
    "node_modules/@stdlib/constants-float64-pinf/lib/index.js"(exports, module2) {
      "use strict";
      var FLOAT64_PINF = Number.POSITIVE_INFINITY;
      module2.exports = FLOAT64_PINF;
    }
  });

  // node_modules/@stdlib/math-base-special-erfinv/lib/rational_p1q1.js
  var require_rational_p1q1 = __commonJS({
    "node_modules/@stdlib/math-base-special-erfinv/lib/rational_p1q1.js"(exports, module2) {
      "use strict";
      function evalrational(x) {
        var ax;
        var s1;
        var s2;
        if (x === 0) {
          return -5087819496582806e-19;
        }
        if (x < 0) {
          ax = -x;
        } else {
          ax = x;
        }
        if (ax <= 1) {
          s1 = -5087819496582806e-19 + x * (-0.008368748197417368 + x * (0.03348066254097446 + x * (-0.012692614766297404 + x * (-0.03656379714117627 + x * (0.02198786811111689 + x * (0.008226878746769157 + x * (-0.005387729650712429 + x * (0 + x * 0))))))));
          s2 = 1 + x * (-0.9700050433032906 + x * (-1.5657455823417585 + x * (1.5622155839842302 + x * (0.662328840472003 + x * (-0.7122890234154284 + x * (-0.05273963823400997 + x * (0.07952836873415717 + x * (-0.0023339375937419 + x * 8862163904564247e-19))))))));
        } else {
          x = 1 / x;
          s1 = 0 + x * (0 + x * (-0.005387729650712429 + x * (0.008226878746769157 + x * (0.02198786811111689 + x * (-0.03656379714117627 + x * (-0.012692614766297404 + x * (0.03348066254097446 + x * (-0.008368748197417368 + x * -5087819496582806e-19))))))));
          s2 = 8862163904564247e-19 + x * (-0.0023339375937419 + x * (0.07952836873415717 + x * (-0.05273963823400997 + x * (-0.7122890234154284 + x * (0.662328840472003 + x * (1.5622155839842302 + x * (-1.5657455823417585 + x * (-0.9700050433032906 + x * 1))))))));
        }
        return s1 / s2;
      }
      module2.exports = evalrational;
    }
  });

  // node_modules/@stdlib/math-base-special-erfinv/lib/rational_p2q2.js
  var require_rational_p2q2 = __commonJS({
    "node_modules/@stdlib/math-base-special-erfinv/lib/rational_p2q2.js"(exports, module2) {
      "use strict";
      function evalrational(x) {
        var ax;
        var s1;
        var s2;
        if (x === 0) {
          return -0.20243350835593876;
        }
        if (x < 0) {
          ax = -x;
        } else {
          ax = x;
        }
        if (ax <= 1) {
          s1 = -0.20243350835593876 + x * (0.10526468069939171 + x * (8.3705032834312 + x * (17.644729840837403 + x * (-18.851064805871424 + x * (-44.6382324441787 + x * (17.445385985570866 + x * (21.12946554483405 + x * -3.6719225470772936)))))));
          s2 = 1 + x * (6.242641248542475 + x * (3.971343795334387 + x * (-28.66081804998 + x * (-20.14326346804852 + x * (48.560921310873994 + x * (10.826866735546016 + x * (-22.643693341313973 + x * 1.7211476576120028)))))));
        } else {
          x = 1 / x;
          s1 = -3.6719225470772936 + x * (21.12946554483405 + x * (17.445385985570866 + x * (-44.6382324441787 + x * (-18.851064805871424 + x * (17.644729840837403 + x * (8.3705032834312 + x * (0.10526468069939171 + x * -0.20243350835593876)))))));
          s2 = 1.7211476576120028 + x * (-22.643693341313973 + x * (10.826866735546016 + x * (48.560921310873994 + x * (-20.14326346804852 + x * (-28.66081804998 + x * (3.971343795334387 + x * (6.242641248542475 + x * 1)))))));
        }
        return s1 / s2;
      }
      module2.exports = evalrational;
    }
  });

  // node_modules/@stdlib/math-base-special-erfinv/lib/rational_p3q3.js
  var require_rational_p3q3 = __commonJS({
    "node_modules/@stdlib/math-base-special-erfinv/lib/rational_p3q3.js"(exports, module2) {
      "use strict";
      function evalrational(x) {
        var ax;
        var s1;
        var s2;
        if (x === 0) {
          return -0.1311027816799519;
        }
        if (x < 0) {
          ax = -x;
        } else {
          ax = x;
        }
        if (ax <= 1) {
          s1 = -0.1311027816799519 + x * (-0.16379404719331705 + x * (0.11703015634199525 + x * (0.38707973897260434 + x * (0.3377855389120359 + x * (0.14286953440815717 + x * (0.029015791000532906 + x * (0.0021455899538880526 + x * (-6794655751811263e-22 + x * (28522533178221704e-24 + x * -681149956853777e-24)))))))));
          s2 = 1 + x * (3.4662540724256723 + x * (5.381683457070069 + x * (4.778465929458438 + x * (2.5930192162362027 + x * (0.848854343457902 + x * (0.15226433829533179 + x * (0.011059242293464892 + x * (0 + x * (0 + x * 0)))))))));
        } else {
          x = 1 / x;
          s1 = -681149956853777e-24 + x * (28522533178221704e-24 + x * (-6794655751811263e-22 + x * (0.0021455899538880526 + x * (0.029015791000532906 + x * (0.14286953440815717 + x * (0.3377855389120359 + x * (0.38707973897260434 + x * (0.11703015634199525 + x * (-0.16379404719331705 + x * -0.1311027816799519)))))))));
          s2 = 0 + x * (0 + x * (0 + x * (0.011059242293464892 + x * (0.15226433829533179 + x * (0.848854343457902 + x * (2.5930192162362027 + x * (4.778465929458438 + x * (5.381683457070069 + x * (3.4662540724256723 + x * 1)))))))));
        }
        return s1 / s2;
      }
      module2.exports = evalrational;
    }
  });

  // node_modules/@stdlib/math-base-special-erfinv/lib/rational_p4q4.js
  var require_rational_p4q4 = __commonJS({
    "node_modules/@stdlib/math-base-special-erfinv/lib/rational_p4q4.js"(exports, module2) {
      "use strict";
      function evalrational(x) {
        var ax;
        var s1;
        var s2;
        if (x === 0) {
          return -0.0350353787183178;
        }
        if (x < 0) {
          ax = -x;
        } else {
          ax = x;
        }
        if (ax <= 1) {
          s1 = -0.0350353787183178 + x * (-0.0022242652921344794 + x * (0.018557330651423107 + x * (0.009508047013259196 + x * (0.0018712349281955923 + x * (15754461742496055e-20 + x * (460469890584318e-20 + x * (-2304047769118826e-25 + x * 26633922742578204e-28)))))));
          s2 = 1 + x * (1.3653349817554064 + x * (0.7620591645536234 + x * (0.22009110576413124 + x * (0.03415891436709477 + x * (0.00263861676657016 + x * (7646752923027944e-20 + x * (0 + x * 0)))))));
        } else {
          x = 1 / x;
          s1 = 26633922742578204e-28 + x * (-2304047769118826e-25 + x * (460469890584318e-20 + x * (15754461742496055e-20 + x * (0.0018712349281955923 + x * (0.009508047013259196 + x * (0.018557330651423107 + x * (-0.0022242652921344794 + x * -0.0350353787183178)))))));
          s2 = 0 + x * (0 + x * (7646752923027944e-20 + x * (0.00263861676657016 + x * (0.03415891436709477 + x * (0.22009110576413124 + x * (0.7620591645536234 + x * (1.3653349817554064 + x * 1)))))));
        }
        return s1 / s2;
      }
      module2.exports = evalrational;
    }
  });

  // node_modules/@stdlib/math-base-special-erfinv/lib/rational_p5q5.js
  var require_rational_p5q5 = __commonJS({
    "node_modules/@stdlib/math-base-special-erfinv/lib/rational_p5q5.js"(exports, module2) {
      "use strict";
      function evalrational(x) {
        var ax;
        var s1;
        var s2;
        if (x === 0) {
          return -0.016743100507663373;
        }
        if (x < 0) {
          ax = -x;
        } else {
          ax = x;
        }
        if (ax <= 1) {
          s1 = -0.016743100507663373 + x * (-0.0011295143874558028 + x * (0.001056288621524929 + x * (20938631748758808e-20 + x * (14962478375834237e-21 + x * (44969678992770644e-23 + x * (4625961635228786e-24 + x * (-2811287356288318e-29 + x * 9905570997331033e-32)))))));
          s2 = 1 + x * (0.5914293448864175 + x * (0.1381518657490833 + x * (0.016074608709367652 + x * (9640118070051656e-19 + x * (27533547476472603e-21 + x * (282243172016108e-21 + x * (0 + x * 0)))))));
        } else {
          x = 1 / x;
          s1 = 9905570997331033e-32 + x * (-2811287356288318e-29 + x * (4625961635228786e-24 + x * (44969678992770644e-23 + x * (14962478375834237e-21 + x * (20938631748758808e-20 + x * (0.001056288621524929 + x * (-0.0011295143874558028 + x * -0.016743100507663373)))))));
          s2 = 0 + x * (0 + x * (282243172016108e-21 + x * (27533547476472603e-21 + x * (9640118070051656e-19 + x * (0.016074608709367652 + x * (0.1381518657490833 + x * (0.5914293448864175 + x * 1)))))));
        }
        return s1 / s2;
      }
      module2.exports = evalrational;
    }
  });

  // node_modules/@stdlib/math-base-special-erfinv/lib/main.js
  var require_main29 = __commonJS({
    "node_modules/@stdlib/math-base-special-erfinv/lib/main.js"(exports, module2) {
      "use strict";
      var isnan = require_lib6();
      var sqrt = require_lib7();
      var ln = require_lib34();
      var PINF = require_lib35();
      var NINF = require_lib33();
      var rationalFcnR1 = require_rational_p1q1();
      var rationalFcnR2 = require_rational_p2q2();
      var rationalFcnR3 = require_rational_p3q3();
      var rationalFcnR4 = require_rational_p4q4();
      var rationalFcnR5 = require_rational_p5q5();
      var Y1 = 0.08913147449493408;
      var Y2 = 2.249481201171875;
      var Y3 = 0.807220458984375;
      var Y4 = 0.9399557113647461;
      var Y5 = 0.9836282730102539;
      function erfinv(x) {
        var sign;
        var ax;
        var qs;
        var q;
        var g;
        var r;
        if (isnan(x)) {
          return NaN;
        }
        if (x === 1) {
          return PINF;
        }
        if (x === -1) {
          return NINF;
        }
        if (x === 0) {
          return x;
        }
        if (x > 1 || x < -1) {
          return NaN;
        }
        if (x < 0) {
          sign = -1;
          ax = -x;
        } else {
          sign = 1;
          ax = x;
        }
        q = 1 - ax;
        if (ax <= 0.5) {
          g = ax * (ax + 10);
          r = rationalFcnR1(ax);
          return sign * (g * Y1 + g * r);
        }
        if (q >= 0.25) {
          g = sqrt(-2 * ln(q));
          q -= 0.25;
          r = rationalFcnR2(q);
          return sign * (g / (Y2 + r));
        }
        q = sqrt(-ln(q));
        if (q < 3) {
          qs = q - 1.125;
          r = rationalFcnR3(qs);
          return sign * (Y3 * q + r * q);
        }
        if (q < 6) {
          qs = q - 3;
          r = rationalFcnR4(qs);
          return sign * (Y4 * q + r * q);
        }
        qs = q - 6;
        r = rationalFcnR5(qs);
        return sign * (Y5 * q + r * q);
      }
      module2.exports = erfinv;
    }
  });

  // node_modules/@stdlib/math-base-special-erfinv/lib/index.js
  var require_lib36 = __commonJS({
    "node_modules/@stdlib/math-base-special-erfinv/lib/index.js"(exports, module2) {
      "use strict";
      var main2 = require_main29();
      module2.exports = main2;
    }
  });

  // node_modules/@stdlib/stats-base-dists-normal-quantile/lib/main.js
  var require_main30 = __commonJS({
    "node_modules/@stdlib/stats-base-dists-normal-quantile/lib/main.js"(exports, module2) {
      "use strict";
      var erfinv = require_lib36();
      var isnan = require_lib6();
      var sqrt = require_lib7();
      function quantile2(p, mu, sigma) {
        var A;
        var B;
        if (isnan(mu) || isnan(sigma) || isnan(p) || sigma < 0 || p < 0 || p > 1) {
          return NaN;
        }
        if (sigma === 0) {
          return mu;
        }
        A = mu;
        B = sigma * sqrt(2);
        return A + B * erfinv(2 * p - 1);
      }
      module2.exports = quantile2;
    }
  });

  // node_modules/@stdlib/utils-constant-function/lib/main.js
  var require_main31 = __commonJS({
    "node_modules/@stdlib/utils-constant-function/lib/main.js"(exports, module2) {
      "use strict";
      function wrap(value) {
        return constantFunction;
        function constantFunction() {
          return value;
        }
      }
      module2.exports = wrap;
    }
  });

  // node_modules/@stdlib/utils-constant-function/lib/index.js
  var require_lib37 = __commonJS({
    "node_modules/@stdlib/utils-constant-function/lib/index.js"(exports, module2) {
      "use strict";
      var main2 = require_main31();
      module2.exports = main2;
    }
  });

  // node_modules/@stdlib/stats-base-dists-degenerate-quantile/lib/main.js
  var require_main32 = __commonJS({
    "node_modules/@stdlib/stats-base-dists-degenerate-quantile/lib/main.js"(exports, module2) {
      "use strict";
      var isnan = require_lib6();
      function quantile2(p, mu) {
        if (isnan(p) || p < 0 || p > 1) {
          return NaN;
        }
        return mu;
      }
      module2.exports = quantile2;
    }
  });

  // node_modules/@stdlib/stats-base-dists-degenerate-quantile/lib/factory.js
  var require_factory = __commonJS({
    "node_modules/@stdlib/stats-base-dists-degenerate-quantile/lib/factory.js"(exports, module2) {
      "use strict";
      var constantFunction = require_lib37();
      var isnan = require_lib6();
      function factory(mu) {
        if (isnan(mu)) {
          return constantFunction(NaN);
        }
        return quantile2;
        function quantile2(p) {
          if (isnan(p) || p < 0 || p > 1) {
            return NaN;
          }
          return mu;
        }
      }
      module2.exports = factory;
    }
  });

  // node_modules/@stdlib/stats-base-dists-degenerate-quantile/lib/index.js
  var require_lib38 = __commonJS({
    "node_modules/@stdlib/stats-base-dists-degenerate-quantile/lib/index.js"(exports, module2) {
      "use strict";
      var setReadOnly = require_lib5();
      var main2 = require_main32();
      var factory = require_factory();
      setReadOnly(main2, "factory", factory);
      module2.exports = main2;
    }
  });

  // node_modules/@stdlib/stats-base-dists-normal-quantile/lib/factory.js
  var require_factory2 = __commonJS({
    "node_modules/@stdlib/stats-base-dists-normal-quantile/lib/factory.js"(exports, module2) {
      "use strict";
      var constantFunction = require_lib37();
      var degenerate = require_lib38().factory;
      var erfinv = require_lib36();
      var isnan = require_lib6();
      var sqrt = require_lib7();
      function factory(mu, sigma) {
        var A;
        var B;
        if (isnan(mu) || isnan(sigma) || sigma < 0) {
          return constantFunction(NaN);
        }
        if (sigma === 0) {
          degenerate(mu);
        }
        A = mu;
        B = sigma * sqrt(2);
        return quantile2;
        function quantile2(p) {
          if (isnan(p) || p < 0 || p > 1) {
            return NaN;
          }
          return A + B * erfinv(2 * p - 1);
        }
      }
      module2.exports = factory;
    }
  });

  // node_modules/@stdlib/stats-base-dists-normal-quantile/lib/index.js
  var require_lib39 = __commonJS({
    "node_modules/@stdlib/stats-base-dists-normal-quantile/lib/index.js"(exports, module2) {
      "use strict";
      var setReadOnly = require_lib5();
      var main2 = require_main30();
      var factory = require_factory2();
      setReadOnly(main2, "factory", factory);
      module2.exports = main2;
    }
  });

  // src/pages/qr.ts
  function displayQR(e) {
    e.preventDefault();
    let nameInput = document.getElementById("nameInput");
    window.location.href = "/qr?name=" + encodeURIComponent(nameInput.value);
  }

  // src/components/index.ts
  var Component = class {
    constructor(params) {
      let tag = params.tag;
      this.element = params.element ? params.element : document.createElement(tag);
      this.element._ParentComponent = this;
      let parent = params.parent;
      if (parent) parent.appendChild(this.element);
      let style = params.style || {};
      for (const styleTag in style) {
        let styleItem = style[styleTag];
        if (styleItem == null) {
          continue;
        }
        this.element.style[styleTag] = styleItem;
      }
      if (params.textContent) this.element.textContent = params.textContent;
      if (params.value)
        this.element.value = params.value;
      if (params.id) this.element.id = params.id;
      let classList = params.classList || [];
      for (const c of classList) {
        this.element.classList.add(c);
      }
      for (const i in params.other) {
        this.element[i] = params.other[i];
      }
    }
    clearChildNodes() {
      while (this.element.lastChild !== null) {
        this.element.removeChild(this.element.lastChild);
      }
    }
    appendChildNodes(...children) {
      this.clearChildNodes();
      children.forEach((c) => this.element.appendChild(c));
    }
  };

  // src/errors.ts
  var AppError = class {
    constructor({ summary, debug, error }) {
      // shown to the user
      this.message = "An unknown error occurred.";
      this.summary = summary;
      this.debug = debug || {};
      this.error = error;
    }
    // alerts are handled by RequestIndicator
    report() {
      console.error("Error occurred:", this.debug, this.error);
    }
  };
  var CodeError = class extends AppError {
    constructor() {
      super(...arguments);
      this.message = "A bug in the code caused an error. Refreshing the page should usually fix this.";
    }
    // A bug; an unexpected error due to an unforeseen circumstance
    // not properly handled in the codebase.
    // This is the default error.
    // show developer debug summaryrmation (TODO: disable with production envvar)
    report() {
      console.error("CodeError occurred:", this.debug, this.error);
    }
  };
  var NetworkError = class extends AppError {
  };

  // src/data.ts
  function UsesMember(target) {
    class UsesMember2 extends target {
      get member() {
        let member = window.MJDATA.members.find(
          (member2) => member2.id === this.memberId
        );
        if (!member)
          throw Error(
            `Failure to index member from memberId ${this.memberId}`
          );
        return member;
      }
    }
    return UsesMember2;
  }
  function UsesSeat(target) {
    class UsesSeat2 extends target {
    }
    return UsesSeat2;
  }
  var MahjongUnknownTableError = class extends Error {
    constructor(tableNo) {
      super(`Couldn't find table ${tableNo}`);
      this.name = "MahjongUnknownTableError";
    }
  };
  function getTable(tableNo) {
    let table = window.MJDATA.tables.find((t) => t.table_no === tableNo);
    if (table === void 0) {
      table = JSON.parse(
        window.sessionStorage.getItem("savedTables") || "[]"
      ).find((t) => t.table_no === tableNo);
    }
    if (table === void 0) {
      return new MahjongUnknownTableError(tableNo);
    } else {
      return table;
    }
  }
  var MahjongUnknownMemberError = class extends Error {
    constructor(memberId) {
      let msg = memberId === 0 ? "Attempted to get empty member" : `Couldn't find member ${memberId}`;
      super(msg);
      this.name = "MahjongUnknownMemberError";
    }
  };
  var emptyMember = {
    id: 0,
    name: "EMPTY",
    tournament: {
      total_points: 0,
      session_points: 0,
      registered: false
    }
  };
  var errorMember = (id) => ({
    id,
    name: "ERROR",
    tournament: {
      total_points: 0,
      session_points: 0,
      registered: false
    }
  });
  function isMember(member) {
    return member.id > 0;
  }
  function getMember(memberId) {
    if (memberId === 0) {
      return emptyMember;
    }
    let member = window.MJDATA.members.find((m) => m.id === memberId);
    if (member === void 0) {
      return errorMember(memberId);
    } else {
      return member;
    }
  }
  function getOtherPlayersOnTable(memberId, table) {
    let otherSeats = ["east", "south", "west", "north"].filter(
      (seat) => table[seat] != memberId
    );
    return otherSeats.map((seat) => {
      let mId = table[seat];
      return getMember(mId);
    });
  }
  var POINTS = /* @__PURE__ */ new Map();
  POINTS.set(3, 8);
  POINTS.set(4, 16);
  POINTS.set(5, 24);
  POINTS.set(6, 32);
  POINTS.set(7, 48);
  POINTS.set(8, 64);
  POINTS.set(9, 96);
  POINTS.set(10, 128);
  POINTS.set(11, 192);
  POINTS.set(12, 256);
  POINTS.set(13, 384);
  POINTS.set(-10, -128);
  function isWind(s) {
    if (s && ["east", "south", "west", "north"].includes(s)) {
      return true;
    }
    return false;
  }
  function getSessionWind() {
    let maybeWind = window.sessionStorage.getItem("round");
    if (isWind(maybeWind)) {
      return maybeWind;
    } else {
      return "east";
    }
  }
  function updateMembers(affectedMembers, key = "id") {
    let newMember;
    window.MJDATA.members = window.MJDATA.members.map((oldMember) => {
      newMember = affectedMembers.find((m) => m[key] === oldMember[key]);
      return newMember !== void 0 ? newMember : oldMember;
    });
  }

  // src/request.ts
  var MJ_EVENT_PREFIX = "mj";
  function respSuccessful(r) {
    return r.ok;
  }
  var ErrorPanel = class {
    constructor(err) {
      this.panelContainer = new Component({
        tag: "div",
        classList: ["error-panel"]
      });
      if (err.summary !== void 0) {
        this.panelSummary = new Component({
          tag: "p",
          textContent: err.summary,
          classList: ["summary"],
          parent: this.panelContainer.element
        });
      }
      this.panelMessage = new Component({
        tag: "p",
        textContent: err.message,
        parent: this.panelContainer.element
      });
      this.errorIcon = new Component({
        tag: "span",
        textContent: "\u274C"
      });
    }
    attach(parent) {
      if (parent.children.length > 0) {
        console.warn(
          "ErrorPanel shouldn't be attached to non-empty parent."
        );
      }
      parent.appendChild(this.panelContainer.element);
      parent.appendChild(this.errorIcon.element);
      return this;
    }
    remove() {
      this.errorIcon.element.remove();
      this.panelContainer.element.remove();
      return void 0;
    }
  };
  var RequestIndicator = class extends Component {
    // when sending a request, wait 100ms before showing the loading icon, otherwise jump straight to the result
    constructor() {
      super({
        tag: "div",
        classList: ["request-indicator"],
        parent: document.body
      });
      this.msShowFail = 5e3;
      this.msShowSuccess = 1e3;
      this.minSkipLoadingDelay = 100;
    }
    reset() {
      if (this.errorPanel !== void 0) {
        this.errorPanel = this.errorPanel.remove();
      }
      this.element.textContent = "";
      clearTimeout(this.transitionTimer);
    }
    appear() {
      this.element.style.transition = "none";
      this.element.style.opacity = "1";
      this.element.offsetHeight;
      this.element.style.transition = "";
    }
    load() {
      this.reset();
      this.appear();
      this.transitionTimer = setTimeout(() => {
        this.element.classList = "loading request-indicator";
      }, this.minSkipLoadingDelay);
    }
    fail(err) {
      this.reset();
      this.element.classList = "failure request-indicator";
      this.errorPanel = new ErrorPanel(err).attach(this.element);
      this.transitionTimer = setTimeout(() => {
        this.element.style.opacity = "0";
      }, this.msShowFail);
    }
    success() {
      this.reset();
      this.element.classList = "success request-indicator";
      this.element.textContent = "\u2705";
      this.transitionTimer = setTimeout(() => {
        this.element.style.opacity = "0";
      }, this.msShowSuccess);
    }
  };
  var RequestController = {
    lastRequest: 0,
    minDelay: 200,
    indicator: new RequestIndicator(),
    update() {
      let d = Date.now();
      let valid = d - this.lastRequest < this.minDelay;
      this.lastRequest = d;
      return valid;
    },
    blockRequest() {
      console.warn("Requests sent too fast.");
      return new NetworkError({});
    },
    handleRejection(r) {
      let err = new CodeError({
        summary: "Server communication (fetch) error",
        error: r
      });
      this.indicator.fail(err);
      return err;
    },
    handleBadResponse(r) {
      let err = new CodeError({ summary: "Server response error", debug: r });
      this.indicator.fail(err);
      return err;
    },
    async request(path, payload, method = "POST", rate_exemption = false) {
      if (this.update() && !rate_exemption) {
        return this.blockRequest();
      }
      this.indicator.load();
      let url = `${window.origin}/` + (path[0] != "/" ? path : path.slice(1));
      let promise = fetch(url, {
        method,
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json; charset=UTF-8"
        }
      });
      return promise.then((r) => {
        if (!respSuccessful(r)) return this.handleBadResponse(r);
        this.indicator.success();
        return r;
      }, this.handleRejection);
    }
  };
  async function pointTransfer(payload, target = document) {
    let r = await RequestController.request(
      "/members/transfer",
      payload,
      "POST"
    );
    if (r instanceof AppError) return r;
    window.MJDATA.log.push(payload);
    updateMembers(await r.json());
    let event = new CustomEvent("mjPointTransfer", {
      detail: payload,
      bubbles: true
    });
    target.dispatchEvent(event);
    return r;
  }
  async function manualRegister(payload, leaveTables, target = document) {
    let r = await RequestController.request(
      "/register",
      { member_id: payload.memberId },
      "POST"
    );
    if (r instanceof AppError) return r;
    let present = await r.json();
    window.MJDATA.members = window.MJDATA.members.map((member) => {
      if (member.id === payload.memberId) {
        member.tournament.registered = present;
      }
      return member;
    });
    if (leaveTables && !present) {
      RequestController.lastRequest = 0;
      replaceMemberOnTables(payload.memberId, 0, target);
    }
    let event = new CustomEvent("mjRegister", {
      detail: payload.memberId,
      bubbles: true
    });
    target.dispatchEvent(event);
    return true;
  }
  function replaceMemberOnTable(table, oldId, newId) {
    let success = false;
    if (table.east === oldId) {
      table.east = newId;
      success = true;
    }
    if (table.south === oldId) {
      table.south = newId;
      success = true;
    }
    if (table.west === oldId) {
      table.west = newId;
      success = true;
    }
    if (table.north === oldId) {
      table.north = newId;
      success = true;
    }
    return success;
  }
  async function replaceMemberOnTables(oldId, newId, target = document) {
    let table;
    let edits = [];
    for (table of window.MJDATA.tables) {
      if (replaceMemberOnTable(table, oldId, newId)) {
        edits.push({ tableNo: table.table_no, newTable: table });
      }
    }
    await editTable(edits, target);
  }
  async function editMember(payload, target = document) {
    let mode = payload.newMember === void 0 ? "DELETE" : "PUT";
    let oldMember = getMember(payload.id);
    if (!isMember(oldMember)) {
      let err = new CodeError({
        summary: "Couldn't find the player being modified",
        debug: { payload, target, oldMember }
      });
      RequestController.indicator.fail(err);
      return err;
    }
    let r = await RequestController.request(
      "/members",
      {
        id: payload.id,
        new_member: payload.newMember
      },
      mode
    );
    if (r instanceof AppError) return r;
    let index = window.MJDATA.members.indexOf(oldMember);
    let newId;
    if (payload.newMember === void 0) {
      window.MJDATA.members.splice(index, 1);
      newId = 0;
    } else {
      window.MJDATA.members[index] = payload.newMember;
      newId = payload.newMember.id;
    }
    replaceMemberOnTables(oldMember.id, newId);
    let savedTables = JSON.parse(
      window.sessionStorage.getItem("savedTables") || "[]"
    );
    for (let t of savedTables) {
      replaceMemberOnTable(t, oldMember.id, newId);
    }
    window.sessionStorage.setItem("savedTables", JSON.stringify(savedTables));
    let event = new CustomEvent("mjEditMember", {
      detail: {
        id: oldMember.id,
        new_member: payload.newMember === void 0 ? {} : payload.newMember
      },
      bubbles: true
    });
    target.dispatchEvent(event);
    return r;
  }
  async function addMember(payload, target = document) {
    let r = await RequestController.request("/members", payload);
    if (r instanceof AppError) return r;
    let newMember = await r.json();
    window.MJDATA.members.push(newMember);
    let event = new CustomEvent("mjAddMember", {
      detail: newMember,
      bubbles: true
    });
    target.dispatchEvent(event);
    return r;
  }
  var ResetSessionEvent = new Event(`${MJ_EVENT_PREFIX}ResetSession`);
  async function resetSession() {
    let r = await RequestController.request("/week", null, "DELETE");
    if (r instanceof AppError) return r;
    let m;
    for (m of window.MJDATA.members) {
      m.tournament.registered = false;
      m.tournament.total_points += m.tournament.session_points;
      m.tournament.session_points = 0;
    }
    document.dispatchEvent(ResetSessionEvent);
  }
  async function undoLog(payload, target = document) {
    let log = window.MJDATA.log.find((l) => l.id === payload.id);
    if (log === void 0) {
      let err = new CodeError({
        summary: "Unable to find log",
        debug: { payload, target }
      });
      RequestController.indicator.fail(err);
      return err;
    } else if (log.disabled) {
      let err = new CodeError({
        summary: "Log already disabled",
        debug: { log, payload, target }
      });
      RequestController.indicator.fail(err);
      return err;
    }
    let r = await RequestController.request(
      "/log",
      {
        id: payload.id
      },
      "PUT"
    );
    if (r instanceof AppError) return r;
    log.disabled = true;
    updateMembers(await r.json());
    let event = new CustomEvent("mjUndoLog", {
      detail: payload.id,
      bubbles: true
    });
    target.dispatchEvent(event);
    return r;
  }
  async function addTable(target = document) {
    let r = await RequestController.request("/tables", null, "POST");
    if (r instanceof AppError) return r;
    let newTable = await r.json();
    window.MJDATA.tables.push(newTable);
    let event = new CustomEvent("mjAddTable", {
      detail: newTable,
      bubbles: true
    });
    target.dispatchEvent(event);
    return r;
  }
  async function editTable(payload, target = document) {
    let r = await RequestController.request(
      "/tables",
      payload.map((i) => {
        return {
          table_no: i.tableNo,
          table: i.newTable
        };
      }),
      "PUT"
    );
    if (r instanceof AppError) return r;
    for (let edit of payload) {
      window.MJDATA.tables[window.MJDATA.tables.findIndex((t) => t.table_no == edit.tableNo)] = edit.newTable;
    }
    let event = new CustomEvent("mjEditTable", {
      detail: payload,
      bubbles: true
    });
    target.dispatchEvent(event);
    return r;
  }
  async function deleteTable(payload, target = document) {
    let r = await RequestController.request("/tables", payload, "DELETE", true);
    if (r instanceof AppError) return r;
    if (r.redirected) {
      return r;
    } else
      window.MJDATA.tables = window.MJDATA.tables.filter(
        (v) => v.table_no !== payload.table_no
      );
    window.MJDATA.tables = window.MJDATA.tables.map(
      (i) => i.table_no > payload.table_no ? { ...i, table_no: i.table_no - 1 } : i
    );
    return r;
  }
  async function updateSettings(payload, target = document) {
    let r = await RequestController.request("/settings", payload, "PUT", true);
    if (r instanceof AppError) return r;
    for (let k in payload) {
      if (k === "matchmakingCoefficient") {
        window.MJDATA.settings[k] = payload[k];
      }
    }
    let event = new CustomEvent("settingsUpdate", {});
    target.dispatchEvent(event);
    return r;
  }
  if (window.DEBUG === void 0) window.DEBUG = {};
  window.DEBUG.request = RequestController;

  // src/components/deleteButton.ts
  var DeleteButton = class extends Component {
    constructor(params) {
      let onclick = params.other?.onclick || (async (ev) => {
        if (params.tableNo < 0) {
          window.sessionStorage.setItem(
            "savedTables",
            JSON.stringify(
              JSON.parse(
                window.sessionStorage.getItem("savedTables") || "[]"
              ).filter(
                (v) => v.table_no !== params.tableNo
              )
            )
          );
          if (params.ondelete) {
            params.ondelete();
          }
          return;
        }
        let r = await deleteTable({ table_no: params.tableNo });
        if (r instanceof AppError) return;
        if (params.ondelete !== void 0) {
          params.ondelete();
        }
      });
      let classList = params.classList || ["small-button", "delete-button"];
      let textContent = params.textContent || "X";
      super({
        ...params,
        tag: "button",
        classList,
        textContent,
        other: {
          ...params.other,
          onclick
        }
      });
    }
  };

  // src/components/icons.ts
  var IconButton = class extends Component {
    constructor(params) {
      super({
        tag: "button",
        classList: ["icon-button"],
        ...params
      });
      let icon = params.icon;
      this.svg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      this.path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      this.svg.appendChild(this.path);
      this.element.appendChild(this.svg);
      if (icon == "fill") {
        this.svg.setAttribute("viewBox", "0 0 576 512");
        this.path.setAttribute(
          "d",
          "M41.4 9.4C53.9-3.1 74.1-3.1 86.6 9.4L168 90.7l53.1-53.1c28.1-28.1 73.7-28.1 101.8 0L474.3 189.1c28.1 28.1 28.1 73.7 0 101.8L283.9 481.4c-37.5 37.5-98.3 37.5-135.8 0L30.6 363.9c-37.5-37.5-37.5-98.3 0-135.8L122.7 136 41.4 54.6c-12.5-12.5-12.5-32.8 0-45.3zm176 221.3L168 181.3 75.9 273.4c-4.2 4.2-7 9.3-8.4 14.6l319.2 0 42.3-42.3c3.1-3.1 3.1-8.2 0-11.3L277.7 82.9c-3.1-3.1-8.2-3.1-11.3 0L213.3 136l49.4 49.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0zM512 512c-35.3 0-64-28.7-64-64c0-25.2 32.6-79.6 51.2-108.7c6-9.4 19.5-9.4 25.5 0C543.4 368.4 576 422.8 576 448c0 35.3-28.7 64-64 64z"
        );
      } else if (icon == "shuffle") {
        this.svg.setAttribute("viewBox", "0 0 512 512");
        this.path.setAttribute(
          "d",
          "M403.8 34.4c12-5 25.7-2.2 34.9 6.9l64 64c6 6 9.4 14.1 9.4 22.6s-3.4 16.6-9.4 22.6l-64 64c-9.2 9.2-22.9 11.9-34.9 6.9s-19.8-16.6-19.8-29.6l0-32-32 0c-10.1 0-19.6 4.7-25.6 12.8L284 229.3 244 176l31.2-41.6C293.3 110.2 321.8 96 352 96l32 0 0-32c0-12.9 7.8-24.6 19.8-29.6zM164 282.7L204 336l-31.2 41.6C154.7 401.8 126.2 416 96 416l-64 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l64 0c10.1 0 19.6-4.7 25.6-12.8L164 282.7zm274.6 188c-9.2 9.2-22.9 11.9-34.9 6.9s-19.8-16.6-19.8-29.6l0-32-32 0c-30.2 0-58.7-14.2-76.8-38.4L121.6 172.8c-6-8.1-15.5-12.8-25.6-12.8l-64 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l64 0c30.2 0 58.7 14.2 76.8 38.4L326.4 339.2c6 8.1 15.5 12.8 25.6 12.8l32 0 0-32c0-12.9 7.8-24.6 19.8-29.6s25.7-2.2 34.9 6.9l64 64c6 6 9.4 14.1 9.4 22.6s-3.4 16.6-9.4 22.6l-64 64z"
        );
      } else if (icon == "reset") {
        this.svg.setAttribute("viewBox", "0 0 516 512");
        this.path.setAttribute(
          "d",
          "M105.1 202.6c7.7-21.8 20.2-42.3 37.8-59.8c62.5-62.5 163.8-62.5 226.3 0L386.3 160 352 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l111.5 0c0 0 0 0 0 0l.4 0c17.7 0 32-14.3 32-32l0-112c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 35.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5zM39 289.3c-5 1.5-9.8 4.2-13.7 8.2c-4 4-6.7 8.8-8.1 14c-.3 1.2-.6 2.5-.8 3.8c-.3 1.7-.4 3.4-.4 5.1L16 432c0 17.7 14.3 32 32 32s32-14.3 32-32l0-35.1 17.6 17.5c0 0 0 0 0 0c87.5 87.4 229.3 87.4 316.7 0c24.4-24.4 42.1-53.1 52.9-83.8c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.5 62.5-163.8 62.5-226.3 0l-.1-.1L125.6 352l34.4 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L48.4 288c-1.6 0-3.2 .1-4.8 .3s-3.1 .5-4.6 1z"
        );
      } else if (icon == "trash") {
        this.svg.setAttribute("viewBox", "0 0 448 512");
        this.path.setAttribute(
          "d",
          "M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"
        );
      } else if (icon == "save") {
        this.svg.setAttribute("viewBox", "0 0 448 512");
        this.path.setAttribute(
          "d",
          "M48 96l0 320c0 8.8 7.2 16 16 16l320 0c8.8 0 16-7.2 16-16l0-245.5c0-4.2-1.7-8.3-4.7-11.3l33.9-33.9c12 12 18.7 28.3 18.7 45.3L448 416c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32l245.5 0c17 0 33.3 6.7 45.3 18.7l74.5 74.5-33.9 33.9L320.8 84.7c-.3-.3-.5-.5-.8-.8L320 184c0 13.3-10.7 24-24 24l-192 0c-13.3 0-24-10.7-24-24L80 80 64 80c-8.8 0-16 7.2-16 16zm80-16l0 80 144 0 0-80L128 80zm32 240a64 64 0 1 1 128 0 64 64 0 1 1 -128 0z"
        );
      } else if (icon == "undo") {
        this.svg.setAttribute("viewBox", "0 0 512 512");
        this.path.setAttribute(
          "d",
          "M48.5 224L40 224c-13.3 0-24-10.7-24-24L16 72c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2L98.6 96.6c87.6-86.5 228.7-86.2 315.8 1c87.5 87.5 87.5 229.3 0 316.8s-229.3 87.5-316.8 0c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0c62.5 62.5 163.8 62.5 226.3 0s62.5-163.8 0-226.3c-62.2-62.2-162.7-62.5-225.3-1L185 183c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8L48.5 224z"
        );
      } else if (icon == "settings") {
        this.svg.setAttribute("viewBox", "0 0 512 512");
        this.path.setAttribute(
          "d",
          "M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"
        );
      } else if (icon == "download") {
        this.svg.setAttribute("viewBox", "0 0 512 512");
        this.path.setAttribute(
          "d",
          "M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 242.7-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7 288 32zM64 352c-35.3 0-64 28.7-64 64l0 32c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-32c0-35.3-28.7-64-64-64l-101.5 0-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352 64 352zm368 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z"
        );
      } else {
        let _ = icon;
        throw Error("not a valid icon");
      }
      if (params.disabled) {
        this.svg.style.fill = "grey";
        this.element.style.cursor = "auto";
        return;
      }
      this.element.onclick = (ev) => {
        (params.onclick || (() => {
        }))(ev);
        if (ev.defaultPrevented) return;
        this.svg.style.fill = "green";
        window.setTimeout(() => {
          this.svg.style.transitionDuration = "0.3s";
          this.svg.style.fill = "black";
        });
        window.setTimeout(() => {
          this.svg.style.transitionDuration = "0s";
        }, 300);
      };
    }
  };

  // src/components/input/listener.ts
  var Listener = class extends Component {
    constructor({ initListener = true, ...params }) {
      super(params);
      this.event = params.event;
      if (initListener) {
        this.listener = this.generateListener();
      }
    }
    get listener() {
      return this.lastListener;
    }
    set listener(v) {
      if (this.listener) {
        this.element.removeEventListener(this.event, this.listener);
      }
      if (!v) return;
      this.element.addEventListener(this.event, v);
      this.lastListener = v;
    }
  };
  var ClickListener = class extends Listener {
    constructor(params) {
      super({
        ...params,
        event: "click"
      });
    }
  };
  var InputListener = class extends Listener {
    constructor(params) {
      super({
        ...params,
        event: "input"
      });
    }
  };

  // src/components/input/focus/focusNode.ts
  var FocusNode = class extends ClickListener {
    constructor(params) {
      super({
        ...params,
        // FocusNode listeners require manual activation
        initListener: false
      });
      this.deactivation = "click";
      this.exclude = params.exclude || [];
      this.excludeSelf = params.excludeSelf === void 0 ? true : params.excludeSelf;
      this.excludeChildren = params.excludeChildren === void 0 ? true : params.excludeChildren;
      this.active = false;
      return this;
    }
    generateListener() {
      return (evt) => {
        let target = evt.target;
        if (!(target instanceof HTMLElement || target instanceof SVGElement)) {
          if (target !== null) {
            console.warn("Target was not null but also wasn't a HTMLElement or SVGElement. (see focusNode.ts/FocusNode", target);
          }
          return;
        }
        if (this.excludeSelf && target.isSameNode(this.element)) return;
        let parent = target.parentElement;
        while (this.excludeChildren && parent) {
          if (parent.isSameNode(this.element)) return;
          parent = parent.parentElement;
        }
        if (this.exclude.includes(target)) return;
        this.deactivate();
      };
    }
    // javascript quirks: overriding one property accessor prevents inheritance of both!
    get listener() {
      return super.listener;
    }
    set listener(v) {
      if (this.listener) {
        document.removeEventListener(this.event, this.listener);
      }
      if (!v) return;
      document.addEventListener(this.event, v);
      this.lastListener = v;
    }
    activate() {
      this.listener = this.generateListener();
      this.active = true;
      return this;
    }
    deactivate() {
      this.listener = void 0;
      this.active = false;
      return this;
    }
  };
  var FocusButton = class extends FocusNode {
    constructor(params = {}) {
      super({
        tag: "button",
        ...params
      });
      this.deactivation = "click";
      this.element.onclick = (ev) => {
        if (this.excludeChildren && ev.target != this.element) {
          return;
        }
        if (this.active) {
          this.deactivate();
        } else {
          this.activate();
        }
      };
    }
    temporarilyDisable(message = "Loading...") {
      this.element.disabled = true;
      let oldContent = this.element.textContent;
      this.element.textContent = message;
      return () => {
        this.element.disabled = false;
        this.element.textContent = oldContent;
      };
    }
  };

  // src/components/input/focus/dropdown.ts
  var Dropdown = class {
    constructor({ tag, options = [] }) {
      this.element = new Component({
        tag,
        classList: ["dropdown"]
      }).element;
      this.options = options;
    }
    get options() {
      return Array.from(this.element.children);
    }
    set options(value) {
      this.options.forEach((c) => c.remove());
      value.forEach((v) => this.element.appendChild(v));
    }
  };
  var DropdownButton = class extends FocusButton {
    /**
     *
     * @param {object} params Parameter object:
     * @param {HTMLElement[]} params.options Dropdown children (buttons recommended)
     */
    constructor({ dropdown, ...params }) {
      let classList = params.classList || ["small-button", "dropdown-button"];
      let options = params.options || [];
      super({ ...params, classList });
      this.dropdown = dropdown || new Dropdown({
        tag: params.dropdownTag,
        options
      });
      this.dest = params.dropdownDestination || this.element;
    }
    activate() {
      this.dest.appendChild(this.dropdown.element);
      return super.activate();
    }
    deactivate() {
      if (!this.dest.contains(this.dropdown.element))
        throw new DOMException(
          "DropdownButton attempted deactivation when inactive."
        );
      this.dest.removeChild(this.dropdown.element);
      return super.deactivate();
    }
  };

  // src/components/legendPanel.ts
  var Legend = class extends Component {
    constructor(params) {
      if (params.classList === void 0) params.classList = [];
      params.classList = params.classList.concat(["legend-panel"]);
      super({
        tag: "div",
        ...params
      });
      this.roundWind = new RoundWind({
        wind: getSessionWind(),
        parent: this.element
      });
      this.keyUl = new Component({
        tag: "ul",
        parent: this.element
      });
      this.keyLis = [
        new Component({
          tag: "li",
          parent: this.keyUl.element,
          textContent: "\u98DF: Win"
        }),
        new Component({
          tag: "li",
          parent: this.keyUl.element,
          textContent: "\u81EA\u6478: Self-draw"
        }),
        new Component({
          tag: "li",
          parent: this.keyUl.element,
          textContent: "\u6253\u51FA: Direct hit"
        })
      ];
      makeDraggable(this.element);
    }
  };
  var WindCharacters = /* @__PURE__ */ new Map();
  WindCharacters.set("east", "\u6771");
  WindCharacters.set("south", "\u5357");
  WindCharacters.set("west", "\u897F");
  WindCharacters.set("north", "\u5317");
  var RoundWind = class extends Component {
    constructor({ wind = "east", ...params }) {
      super({
        tag: "p",
        ...params
      });
      this.lock = false;
      this.wind = wind;
      this.ddb = new DropdownButton({
        dropdownTag: "div",
        parent: this.element,
        options: ["east", "south", "west", "north"].map(
          (w) => new Component({
            tag: "button",
            textContent: WindCharacters.get(w) || "ERR",
            other: {
              onclick: (ev) => {
                this.setWind(w);
                this.ddb.deactivate();
              }
            }
          }).element
        )
      });
      this.ddbSpan = new Component({
        tag: "span",
        textContent: WindCharacters.get(wind),
        parent: this.ddb.element,
        classList: ["round-wind-span"],
        other: {
          onclick: (ev) => this.ddb.activate()
        }
      });
      this.br = document.createElement("br");
      this.element.appendChild(this.br);
      this.windCaption = new Component({
        tag: "span",
        textContent: `(${wind})`,
        parent: this.element
      });
    }
    setWind(wind) {
      this.wind = wind;
      window.sessionStorage.setItem("round", wind);
      this.ddbSpan.element.textContent = WindCharacters.get(wind) || "ERR";
      this.windCaption.element.textContent = `(${wind})`;
    }
    updateWind() {
      if (this.lock === true) return;
      switch (this.wind) {
        case "east":
          this.setWind("south");
          return;
        case "south":
          this.setWind("west");
          return;
        case "west":
          this.setWind("north");
          return;
        case "north":
          this.setWind("east");
          return;
      }
    }
  };
  function makeDraggable(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    elmnt.onmousedown = dragMouseDown;
    function dragMouseDown(e) {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }
    function elementDrag(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      elmnt.style.top = elmnt.offsetTop - pos2 + "px";
      elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
    }
    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  // src/components/nametag.ts
  var NameTag = class extends InputListener {
    constructor({ ...params }) {
      super({
        tag: "select",
        ...params,
        value: void 0
      });
      this.element.setAttribute("name", "nametag");
      this.nameOptions = {};
      if (params.value) {
        this.renderOption(params.value);
      } else {
        this.renderPlaceholder();
        this.element.style.fontWeight = "bold";
        this.element.style.color = "red";
      }
      let sortedMembers = [...window.MJDATA.members].sort((a, b) => {
        if (a.name > b.name) return 1;
        else if (a.name < b.name) return -1;
        else return 0;
      });
      for (const m of sortedMembers) {
        if (m.id === params.value?.id) continue;
        if (!m.tournament.registered) continue;
        this.renderOption(m);
      }
    }
    renderOption(member) {
      let optElem = document.createElement("option");
      optElem.textContent = member.name;
      optElem.style.fontWeight = "normal";
      optElem.style.color = "black";
      this.nameOptions[member.id] = optElem;
      this.element.appendChild(optElem);
      return optElem;
    }
    renderPlaceholder() {
      let optElem = document.createElement("option");
      optElem.textContent = "EMPTY";
      optElem.style.fontWeight = "bold";
      optElem.style.color = "red";
      this.empty = optElem;
      this.element.appendChild(optElem);
      return optElem;
    }
    generateListener() {
      return () => {
        this.empty?.remove();
        this.element.style.fontWeight = "normal";
        this.element.style.color = "black";
        this.listener = void 0;
      };
    }
  };

  // node_modules/canvas-confetti/dist/confetti.module.mjs
  var module = {};
  (function main(global, module2, isWorker, workerSize) {
    var canUseWorker = !!(global.Worker && global.Blob && global.Promise && global.OffscreenCanvas && global.OffscreenCanvasRenderingContext2D && global.HTMLCanvasElement && global.HTMLCanvasElement.prototype.transferControlToOffscreen && global.URL && global.URL.createObjectURL);
    var canUsePaths = typeof Path2D === "function" && typeof DOMMatrix === "function";
    var canDrawBitmap = function() {
      if (!global.OffscreenCanvas) {
        return false;
      }
      var canvas = new OffscreenCanvas(1, 1);
      var ctx = canvas.getContext("2d");
      ctx.fillRect(0, 0, 1, 1);
      var bitmap = canvas.transferToImageBitmap();
      try {
        ctx.createPattern(bitmap, "no-repeat");
      } catch (e) {
        return false;
      }
      return true;
    }();
    function noop() {
    }
    function promise(func) {
      var ModulePromise = module2.exports.Promise;
      var Prom = ModulePromise !== void 0 ? ModulePromise : global.Promise;
      if (typeof Prom === "function") {
        return new Prom(func);
      }
      func(noop, noop);
      return null;
    }
    var bitmapMapper = /* @__PURE__ */ function(skipTransform, map) {
      return {
        transform: function(bitmap) {
          if (skipTransform) {
            return bitmap;
          }
          if (map.has(bitmap)) {
            return map.get(bitmap);
          }
          var canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
          var ctx = canvas.getContext("2d");
          ctx.drawImage(bitmap, 0, 0);
          map.set(bitmap, canvas);
          return canvas;
        },
        clear: function() {
          map.clear();
        }
      };
    }(canDrawBitmap, /* @__PURE__ */ new Map());
    var raf = function() {
      var TIME = Math.floor(1e3 / 60);
      var frame, cancel;
      var frames = {};
      var lastFrameTime = 0;
      if (typeof requestAnimationFrame === "function" && typeof cancelAnimationFrame === "function") {
        frame = function(cb) {
          var id = Math.random();
          frames[id] = requestAnimationFrame(function onFrame(time) {
            if (lastFrameTime === time || lastFrameTime + TIME - 1 < time) {
              lastFrameTime = time;
              delete frames[id];
              cb();
            } else {
              frames[id] = requestAnimationFrame(onFrame);
            }
          });
          return id;
        };
        cancel = function(id) {
          if (frames[id]) {
            cancelAnimationFrame(frames[id]);
          }
        };
      } else {
        frame = function(cb) {
          return setTimeout(cb, TIME);
        };
        cancel = function(timer) {
          return clearTimeout(timer);
        };
      }
      return { frame, cancel };
    }();
    var getWorker = /* @__PURE__ */ function() {
      var worker;
      var prom;
      var resolves = {};
      function decorate(worker2) {
        function execute(options, callback) {
          worker2.postMessage({ options: options || {}, callback });
        }
        worker2.init = function initWorker(canvas) {
          var offscreen = canvas.transferControlToOffscreen();
          worker2.postMessage({ canvas: offscreen }, [offscreen]);
        };
        worker2.fire = function fireWorker(options, size, done) {
          if (prom) {
            execute(options, null);
            return prom;
          }
          var id = Math.random().toString(36).slice(2);
          prom = promise(function(resolve) {
            function workerDone(msg) {
              if (msg.data.callback !== id) {
                return;
              }
              delete resolves[id];
              worker2.removeEventListener("message", workerDone);
              prom = null;
              bitmapMapper.clear();
              done();
              resolve();
            }
            worker2.addEventListener("message", workerDone);
            execute(options, id);
            resolves[id] = workerDone.bind(null, { data: { callback: id } });
          });
          return prom;
        };
        worker2.reset = function resetWorker() {
          worker2.postMessage({ reset: true });
          for (var id in resolves) {
            resolves[id]();
            delete resolves[id];
          }
        };
      }
      return function() {
        if (worker) {
          return worker;
        }
        if (!isWorker && canUseWorker) {
          var code = [
            "var CONFETTI, SIZE = {}, module = {};",
            "(" + main.toString() + ")(this, module, true, SIZE);",
            "onmessage = function(msg) {",
            "  if (msg.data.options) {",
            "    CONFETTI(msg.data.options).then(function () {",
            "      if (msg.data.callback) {",
            "        postMessage({ callback: msg.data.callback });",
            "      }",
            "    });",
            "  } else if (msg.data.reset) {",
            "    CONFETTI && CONFETTI.reset();",
            "  } else if (msg.data.resize) {",
            "    SIZE.width = msg.data.resize.width;",
            "    SIZE.height = msg.data.resize.height;",
            "  } else if (msg.data.canvas) {",
            "    SIZE.width = msg.data.canvas.width;",
            "    SIZE.height = msg.data.canvas.height;",
            "    CONFETTI = module.exports.create(msg.data.canvas);",
            "  }",
            "}"
          ].join("\n");
          try {
            worker = new Worker(URL.createObjectURL(new Blob([code])));
          } catch (e) {
            typeof console !== void 0 && typeof console.warn === "function" ? console.warn("\u{1F38A} Could not load worker", e) : null;
            return null;
          }
          decorate(worker);
        }
        return worker;
      };
    }();
    var defaults = {
      particleCount: 50,
      angle: 90,
      spread: 45,
      startVelocity: 45,
      decay: 0.9,
      gravity: 1,
      drift: 0,
      ticks: 200,
      x: 0.5,
      y: 0.5,
      shapes: ["square", "circle"],
      zIndex: 100,
      colors: [
        "#26ccff",
        "#a25afd",
        "#ff5e7e",
        "#88ff5a",
        "#fcff42",
        "#ffa62d",
        "#ff36ff"
      ],
      // probably should be true, but back-compat
      disableForReducedMotion: false,
      scalar: 1
    };
    function convert(val, transform) {
      return transform ? transform(val) : val;
    }
    function isOk(val) {
      return !(val === null || val === void 0);
    }
    function prop(options, name, transform) {
      return convert(
        options && isOk(options[name]) ? options[name] : defaults[name],
        transform
      );
    }
    function onlyPositiveInt(number) {
      return number < 0 ? 0 : Math.floor(number);
    }
    function randomInt(min, max) {
      return Math.floor(Math.random() * (max - min)) + min;
    }
    function toDecimal(str) {
      return parseInt(str, 16);
    }
    function colorsToRgb(colors) {
      return colors.map(hexToRgb);
    }
    function hexToRgb(str) {
      var val = String(str).replace(/[^0-9a-f]/gi, "");
      if (val.length < 6) {
        val = val[0] + val[0] + val[1] + val[1] + val[2] + val[2];
      }
      return {
        r: toDecimal(val.substring(0, 2)),
        g: toDecimal(val.substring(2, 4)),
        b: toDecimal(val.substring(4, 6))
      };
    }
    function getOrigin(options) {
      var origin = prop(options, "origin", Object);
      origin.x = prop(origin, "x", Number);
      origin.y = prop(origin, "y", Number);
      return origin;
    }
    function setCanvasWindowSize(canvas) {
      canvas.width = document.documentElement.clientWidth;
      canvas.height = document.documentElement.clientHeight;
    }
    function setCanvasRectSize(canvas) {
      var rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
    function getCanvas(zIndex) {
      var canvas = document.createElement("canvas");
      canvas.style.position = "fixed";
      canvas.style.top = "0px";
      canvas.style.left = "0px";
      canvas.style.pointerEvents = "none";
      canvas.style.zIndex = zIndex;
      return canvas;
    }
    function ellipse(context, x, y, radiusX, radiusY, rotation, startAngle, endAngle, antiClockwise) {
      context.save();
      context.translate(x, y);
      context.rotate(rotation);
      context.scale(radiusX, radiusY);
      context.arc(0, 0, 1, startAngle, endAngle, antiClockwise);
      context.restore();
    }
    function randomPhysics(opts) {
      var radAngle = opts.angle * (Math.PI / 180);
      var radSpread = opts.spread * (Math.PI / 180);
      return {
        x: opts.x,
        y: opts.y,
        wobble: Math.random() * 10,
        wobbleSpeed: Math.min(0.11, Math.random() * 0.1 + 0.05),
        velocity: opts.startVelocity * 0.5 + Math.random() * opts.startVelocity,
        angle2D: -radAngle + (0.5 * radSpread - Math.random() * radSpread),
        tiltAngle: (Math.random() * (0.75 - 0.25) + 0.25) * Math.PI,
        color: opts.color,
        shape: opts.shape,
        tick: 0,
        totalTicks: opts.ticks,
        decay: opts.decay,
        drift: opts.drift,
        random: Math.random() + 2,
        tiltSin: 0,
        tiltCos: 0,
        wobbleX: 0,
        wobbleY: 0,
        gravity: opts.gravity * 3,
        ovalScalar: 0.6,
        scalar: opts.scalar,
        flat: opts.flat
      };
    }
    function updateFetti(context, fetti) {
      fetti.x += Math.cos(fetti.angle2D) * fetti.velocity + fetti.drift;
      fetti.y += Math.sin(fetti.angle2D) * fetti.velocity + fetti.gravity;
      fetti.velocity *= fetti.decay;
      if (fetti.flat) {
        fetti.wobble = 0;
        fetti.wobbleX = fetti.x + 10 * fetti.scalar;
        fetti.wobbleY = fetti.y + 10 * fetti.scalar;
        fetti.tiltSin = 0;
        fetti.tiltCos = 0;
        fetti.random = 1;
      } else {
        fetti.wobble += fetti.wobbleSpeed;
        fetti.wobbleX = fetti.x + 10 * fetti.scalar * Math.cos(fetti.wobble);
        fetti.wobbleY = fetti.y + 10 * fetti.scalar * Math.sin(fetti.wobble);
        fetti.tiltAngle += 0.1;
        fetti.tiltSin = Math.sin(fetti.tiltAngle);
        fetti.tiltCos = Math.cos(fetti.tiltAngle);
        fetti.random = Math.random() + 2;
      }
      var progress = fetti.tick++ / fetti.totalTicks;
      var x1 = fetti.x + fetti.random * fetti.tiltCos;
      var y1 = fetti.y + fetti.random * fetti.tiltSin;
      var x2 = fetti.wobbleX + fetti.random * fetti.tiltCos;
      var y2 = fetti.wobbleY + fetti.random * fetti.tiltSin;
      context.fillStyle = "rgba(" + fetti.color.r + ", " + fetti.color.g + ", " + fetti.color.b + ", " + (1 - progress) + ")";
      context.beginPath();
      if (canUsePaths && fetti.shape.type === "path" && typeof fetti.shape.path === "string" && Array.isArray(fetti.shape.matrix)) {
        context.fill(transformPath2D(
          fetti.shape.path,
          fetti.shape.matrix,
          fetti.x,
          fetti.y,
          Math.abs(x2 - x1) * 0.1,
          Math.abs(y2 - y1) * 0.1,
          Math.PI / 10 * fetti.wobble
        ));
      } else if (fetti.shape.type === "bitmap") {
        var rotation = Math.PI / 10 * fetti.wobble;
        var scaleX = Math.abs(x2 - x1) * 0.1;
        var scaleY = Math.abs(y2 - y1) * 0.1;
        var width = fetti.shape.bitmap.width * fetti.scalar;
        var height = fetti.shape.bitmap.height * fetti.scalar;
        var matrix = new DOMMatrix([
          Math.cos(rotation) * scaleX,
          Math.sin(rotation) * scaleX,
          -Math.sin(rotation) * scaleY,
          Math.cos(rotation) * scaleY,
          fetti.x,
          fetti.y
        ]);
        matrix.multiplySelf(new DOMMatrix(fetti.shape.matrix));
        var pattern = context.createPattern(bitmapMapper.transform(fetti.shape.bitmap), "no-repeat");
        pattern.setTransform(matrix);
        context.globalAlpha = 1 - progress;
        context.fillStyle = pattern;
        context.fillRect(
          fetti.x - width / 2,
          fetti.y - height / 2,
          width,
          height
        );
        context.globalAlpha = 1;
      } else if (fetti.shape === "circle") {
        context.ellipse ? context.ellipse(fetti.x, fetti.y, Math.abs(x2 - x1) * fetti.ovalScalar, Math.abs(y2 - y1) * fetti.ovalScalar, Math.PI / 10 * fetti.wobble, 0, 2 * Math.PI) : ellipse(context, fetti.x, fetti.y, Math.abs(x2 - x1) * fetti.ovalScalar, Math.abs(y2 - y1) * fetti.ovalScalar, Math.PI / 10 * fetti.wobble, 0, 2 * Math.PI);
      } else if (fetti.shape === "star") {
        var rot = Math.PI / 2 * 3;
        var innerRadius = 4 * fetti.scalar;
        var outerRadius = 8 * fetti.scalar;
        var x = fetti.x;
        var y = fetti.y;
        var spikes = 5;
        var step = Math.PI / spikes;
        while (spikes--) {
          x = fetti.x + Math.cos(rot) * outerRadius;
          y = fetti.y + Math.sin(rot) * outerRadius;
          context.lineTo(x, y);
          rot += step;
          x = fetti.x + Math.cos(rot) * innerRadius;
          y = fetti.y + Math.sin(rot) * innerRadius;
          context.lineTo(x, y);
          rot += step;
        }
      } else {
        context.moveTo(Math.floor(fetti.x), Math.floor(fetti.y));
        context.lineTo(Math.floor(fetti.wobbleX), Math.floor(y1));
        context.lineTo(Math.floor(x2), Math.floor(y2));
        context.lineTo(Math.floor(x1), Math.floor(fetti.wobbleY));
      }
      context.closePath();
      context.fill();
      return fetti.tick < fetti.totalTicks;
    }
    function animate(canvas, fettis, resizer, size, done) {
      var animatingFettis = fettis.slice();
      var context = canvas.getContext("2d");
      var animationFrame;
      var destroy;
      var prom = promise(function(resolve) {
        function onDone() {
          animationFrame = destroy = null;
          context.clearRect(0, 0, size.width, size.height);
          bitmapMapper.clear();
          done();
          resolve();
        }
        function update() {
          if (isWorker && !(size.width === workerSize.width && size.height === workerSize.height)) {
            size.width = canvas.width = workerSize.width;
            size.height = canvas.height = workerSize.height;
          }
          if (!size.width && !size.height) {
            resizer(canvas);
            size.width = canvas.width;
            size.height = canvas.height;
          }
          context.clearRect(0, 0, size.width, size.height);
          animatingFettis = animatingFettis.filter(function(fetti) {
            return updateFetti(context, fetti);
          });
          if (animatingFettis.length) {
            animationFrame = raf.frame(update);
          } else {
            onDone();
          }
        }
        animationFrame = raf.frame(update);
        destroy = onDone;
      });
      return {
        addFettis: function(fettis2) {
          animatingFettis = animatingFettis.concat(fettis2);
          return prom;
        },
        canvas,
        promise: prom,
        reset: function() {
          if (animationFrame) {
            raf.cancel(animationFrame);
          }
          if (destroy) {
            destroy();
          }
        }
      };
    }
    function confettiCannon(canvas, globalOpts) {
      var isLibCanvas = !canvas;
      var allowResize = !!prop(globalOpts || {}, "resize");
      var hasResizeEventRegistered = false;
      var globalDisableForReducedMotion = prop(globalOpts, "disableForReducedMotion", Boolean);
      var shouldUseWorker = canUseWorker && !!prop(globalOpts || {}, "useWorker");
      var worker = shouldUseWorker ? getWorker() : null;
      var resizer = isLibCanvas ? setCanvasWindowSize : setCanvasRectSize;
      var initialized = canvas && worker ? !!canvas.__confetti_initialized : false;
      var preferLessMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion)").matches;
      var animationObj;
      function fireLocal(options, size, done) {
        var particleCount = prop(options, "particleCount", onlyPositiveInt);
        var angle = prop(options, "angle", Number);
        var spread = prop(options, "spread", Number);
        var startVelocity = prop(options, "startVelocity", Number);
        var decay = prop(options, "decay", Number);
        var gravity = prop(options, "gravity", Number);
        var drift = prop(options, "drift", Number);
        var colors = prop(options, "colors", colorsToRgb);
        var ticks = prop(options, "ticks", Number);
        var shapes = prop(options, "shapes");
        var scalar = prop(options, "scalar");
        var flat = !!prop(options, "flat");
        var origin = getOrigin(options);
        var temp = particleCount;
        var fettis = [];
        var startX = canvas.width * origin.x;
        var startY = canvas.height * origin.y;
        while (temp--) {
          fettis.push(
            randomPhysics({
              x: startX,
              y: startY,
              angle,
              spread,
              startVelocity,
              color: colors[temp % colors.length],
              shape: shapes[randomInt(0, shapes.length)],
              ticks,
              decay,
              gravity,
              drift,
              scalar,
              flat
            })
          );
        }
        if (animationObj) {
          return animationObj.addFettis(fettis);
        }
        animationObj = animate(canvas, fettis, resizer, size, done);
        return animationObj.promise;
      }
      function fire(options) {
        var disableForReducedMotion = globalDisableForReducedMotion || prop(options, "disableForReducedMotion", Boolean);
        var zIndex = prop(options, "zIndex", Number);
        if (disableForReducedMotion && preferLessMotion) {
          return promise(function(resolve) {
            resolve();
          });
        }
        if (isLibCanvas && animationObj) {
          canvas = animationObj.canvas;
        } else if (isLibCanvas && !canvas) {
          canvas = getCanvas(zIndex);
          document.body.appendChild(canvas);
        }
        if (allowResize && !initialized) {
          resizer(canvas);
        }
        var size = {
          width: canvas.width,
          height: canvas.height
        };
        if (worker && !initialized) {
          worker.init(canvas);
        }
        initialized = true;
        if (worker) {
          canvas.__confetti_initialized = true;
        }
        function onResize() {
          if (worker) {
            var obj = {
              getBoundingClientRect: function() {
                if (!isLibCanvas) {
                  return canvas.getBoundingClientRect();
                }
              }
            };
            resizer(obj);
            worker.postMessage({
              resize: {
                width: obj.width,
                height: obj.height
              }
            });
            return;
          }
          size.width = size.height = null;
        }
        function done() {
          animationObj = null;
          if (allowResize) {
            hasResizeEventRegistered = false;
            global.removeEventListener("resize", onResize);
          }
          if (isLibCanvas && canvas) {
            if (document.body.contains(canvas)) {
              document.body.removeChild(canvas);
            }
            canvas = null;
            initialized = false;
          }
        }
        if (allowResize && !hasResizeEventRegistered) {
          hasResizeEventRegistered = true;
          global.addEventListener("resize", onResize, false);
        }
        if (worker) {
          return worker.fire(options, size, done);
        }
        return fireLocal(options, size, done);
      }
      fire.reset = function() {
        if (worker) {
          worker.reset();
        }
        if (animationObj) {
          animationObj.reset();
        }
      };
      return fire;
    }
    var defaultFire;
    function getDefaultFire() {
      if (!defaultFire) {
        defaultFire = confettiCannon(null, { useWorker: true, resize: true });
      }
      return defaultFire;
    }
    function transformPath2D(pathString, pathMatrix, x, y, scaleX, scaleY, rotation) {
      var path2d = new Path2D(pathString);
      var t1 = new Path2D();
      t1.addPath(path2d, new DOMMatrix(pathMatrix));
      var t2 = new Path2D();
      t2.addPath(t1, new DOMMatrix([
        Math.cos(rotation) * scaleX,
        Math.sin(rotation) * scaleX,
        -Math.sin(rotation) * scaleY,
        Math.cos(rotation) * scaleY,
        x,
        y
      ]));
      return t2;
    }
    function shapeFromPath(pathData) {
      if (!canUsePaths) {
        throw new Error("path confetti are not supported in this browser");
      }
      var path, matrix;
      if (typeof pathData === "string") {
        path = pathData;
      } else {
        path = pathData.path;
        matrix = pathData.matrix;
      }
      var path2d = new Path2D(path);
      var tempCanvas = document.createElement("canvas");
      var tempCtx = tempCanvas.getContext("2d");
      if (!matrix) {
        var maxSize = 1e3;
        var minX = maxSize;
        var minY = maxSize;
        var maxX = 0;
        var maxY = 0;
        var width, height;
        for (var x = 0; x < maxSize; x += 2) {
          for (var y = 0; y < maxSize; y += 2) {
            if (tempCtx.isPointInPath(path2d, x, y, "nonzero")) {
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          }
        }
        width = maxX - minX;
        height = maxY - minY;
        var maxDesiredSize = 10;
        var scale = Math.min(maxDesiredSize / width, maxDesiredSize / height);
        matrix = [
          scale,
          0,
          0,
          scale,
          -Math.round(width / 2 + minX) * scale,
          -Math.round(height / 2 + minY) * scale
        ];
      }
      return {
        type: "path",
        path,
        matrix
      };
    }
    function shapeFromText(textData) {
      var text, scalar = 1, color = "#000000", fontFamily = '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "EmojiOne Color", "Android Emoji", "Twemoji Mozilla", "system emoji", sans-serif';
      if (typeof textData === "string") {
        text = textData;
      } else {
        text = textData.text;
        scalar = "scalar" in textData ? textData.scalar : scalar;
        fontFamily = "fontFamily" in textData ? textData.fontFamily : fontFamily;
        color = "color" in textData ? textData.color : color;
      }
      var fontSize = 10 * scalar;
      var font = "" + fontSize + "px " + fontFamily;
      var canvas = new OffscreenCanvas(fontSize, fontSize);
      var ctx = canvas.getContext("2d");
      ctx.font = font;
      var size = ctx.measureText(text);
      var width = Math.ceil(size.actualBoundingBoxRight + size.actualBoundingBoxLeft);
      var height = Math.ceil(size.actualBoundingBoxAscent + size.actualBoundingBoxDescent);
      var padding = 2;
      var x = size.actualBoundingBoxLeft + padding;
      var y = size.actualBoundingBoxAscent + padding;
      width += padding + padding;
      height += padding + padding;
      canvas = new OffscreenCanvas(width, height);
      ctx = canvas.getContext("2d");
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
      var scale = 1 / scalar;
      return {
        type: "bitmap",
        // TODO these probably need to be transfered for workers
        bitmap: canvas.transferToImageBitmap(),
        matrix: [scale, 0, 0, scale, -width * scale / 2, -height * scale / 2]
      };
    }
    module2.exports = function() {
      return getDefaultFire().apply(this, arguments);
    };
    module2.exports.reset = function() {
      getDefaultFire().reset();
    };
    module2.exports.create = confettiCannon;
    module2.exports.shapeFromPath = shapeFromPath;
    module2.exports.shapeFromText = shapeFromText;
  })(function() {
    if (typeof window !== "undefined") {
      return window;
    }
    if (typeof self !== "undefined") {
      return self;
    }
    return this || {};
  }(), module, false);
  var confetti_module_default = module.exports;
  var create = module.exports.create;

  // src/components/successAnim.ts
  var mahjongConfetti = {
    shapes: [confetti_module_default.shapeFromText({ text: "\u{1F004}", scalar: 4 })],
    scalar: 3
  };
  var goldConfetti = { colors: ["#ffd700"], scalar: 1 };
  function triggerCelebration() {
    var end = Date.now() + 1 * 1e3;
    let defaultSettings = {
      particleCount: 3,
      spread: 100,
      startVelocity: 90
    };
    (function frame() {
      confetti_module_default({
        angle: 75,
        origin: { x: 0, y: 1 },
        ...defaultSettings,
        ...goldConfetti
      });
      confetti_module_default({
        angle: 75,
        origin: { x: 0, y: 1 },
        ...defaultSettings,
        ...mahjongConfetti
      });
      confetti_module_default({
        angle: 105,
        origin: { x: 1, y: 1 },
        ...defaultSettings,
        ...goldConfetti
      });
      confetti_module_default({
        angle: 105,
        origin: { x: 1, y: 1 },
        ...defaultSettings,
        ...mahjongConfetti
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }
  function pointBounce(elem_or_comp, points, {
    autoPosition = true,
    wind = "east",
    heightOffset = 110,
    msDuration = 1e3
  }) {
    let orientation;
    switch (wind) {
      case "east":
        orientation = 0;
        break;
      case "south":
        orientation = -90;
        break;
      case "west":
        orientation = 180;
        break;
      case "north":
        orientation = 90;
        break;
    }
    let elem = elem_or_comp instanceof HTMLElement ? elem_or_comp : elem_or_comp.element;
    let oldPosition = elem.style.position;
    if (autoPosition) elem.style.position = "relative";
    let pointPopup = new Component({
      tag: "p",
      textContent: points.toString(),
      parent: elem,
      classList: ["points"]
    });
    pointPopup.element.style.color = points > 0 ? "green" : "red";
    pointPopup.element.style.rotate = `${orientation}deg`;
    if (orientation === 0) {
      pointPopup.element.style.top = `-${heightOffset}%`;
    } else if (orientation === 90) {
      pointPopup.element.style.right = `-${heightOffset}%`;
      pointPopup.element.style.top = `${Math.floor(elem.clientHeight / 4)}px`;
    } else if (orientation === -90) {
      pointPopup.element.style.left = `-${heightOffset}%`;
      pointPopup.element.style.bottom = `${Math.floor(
        elem.clientHeight / 4
      )}px`;
    } else {
      pointPopup.element.style.top = `${heightOffset}%`;
    }
    pointPopup.element.style.animation = `bounce ${msDuration / 1e3}s ease-in-out 1 forwards`;
    window.setTimeout(() => {
      pointPopup.element.remove();
      elem.style.position = oldPosition;
    }, msDuration);
  }

  // src/components/player.ts
  function getPointsFromFaan(faan) {
    let pts = POINTS.get(faan);
    if (pts === void 0) throw new Error(`Couldn't get ${faan} faan.`);
    return pts;
  }
  var WinButton = class _WinButton extends UsesMember(FocusButton) {
    constructor(params) {
      super(params);
      this.popup = new Component({
        tag: "div",
        classList: ["win-button-popup"]
      });
      this.tableNo = params.tableNo;
      this.memberId = params.memberId;
      try {
        this.element.title = `${this.member.name} won!`;
      } catch {
        console.warn(`Failed to get ${this.memberId}`);
      }
      this.zimo = new FaanDropdownButton({
        textContent: "\u81EA\u6478",
        includePenalty: true,
        parent: this.popup.element,
        // don't set onclick here - do it in updatePlayers
        other: {
          title: "Self-draw"
        }
      });
      this.dachut = new DropdownButton({
        dropdownTag: "div",
        textContent: "\u6253\u51FA",
        parent: this.popup.element,
        // don't set onclick here - do it in updatePlayers
        other: {
          title: "From another's tile"
        }
      });
      this.baozimo = new DropdownButton({
        dropdownTag: "div",
        textContent: "\u5305\u81EA\u6478",
        parent: this.popup.element,
        other: {
          title: "(special case)"
        }
      });
      this.updatePlayers();
    }
    activate() {
      this.element.appendChild(this.popup.element);
      return super.activate();
    }
    deactivate() {
      this.element.removeChild(this.popup.element);
      return super.deactivate();
    }
    async onclickPointTransfer(losers, faan, kind, otherPlayers) {
      let roundWind = window.sessionStorage.getItem("round");
      let others = [];
      otherPlayers.forEach((o) => {
        if (others !== null && isMember(o)) {
          others.push(o.id);
        } else {
          others = null;
        }
      });
      let transferId;
      if (window.MJDATA.log.length === 0) {
        transferId = 0;
      } else {
        transferId = Math.max(...window.MJDATA.log.map((l) => l.id)) + 1;
      }
      let r = await pointTransfer(
        {
          // todo: server-side id
          id: transferId,
          to: this.memberId,
          from: losers.map((m) => {
            if (!isMember(m)) {
              throw new MahjongUnknownMemberError(m.id);
            }
            return m.id;
          }),
          others,
          // points is legacy, and referred to the points the winner gets div by number of people paying
          // calc on frontend as fallback for backend
          points: getPointsFromFaan(faan) * (kind === "baozimo" ? 3 : kind === "dachut" ? 2 : 1),
          // baozimo triple from one, dachut double from one, zimo base amount from three players
          faan,
          win_kind: kind,
          datetime: /* @__PURE__ */ new Date(),
          round_wind: isWind(roundWind) ? roundWind : null,
          seat_wind: null,
          disabled: false
        },
        this.element
      );
      if (r instanceof AppError) return;
      if (faan === 10) {
        triggerCelebration();
      }
      this.deactivate();
    }
    updatePlayers() {
      let table = getTable(this.tableNo);
      if (table instanceof MahjongUnknownTableError) {
        console.error(table);
        let newButton = _WinButton.empty();
        this.element.replaceWith(newButton.element);
        this.element = newButton.element;
        return;
      }
      let member = this.member;
      let otherPlayers = getOtherPlayersOnTable(member.id, table);
      this.dachut.dropdown.options = otherPlayers.map(
        (m) => new FaanDropdownButton({
          textContent: m.name,
          classList: ["small-button"],
          onclick: async (ev, faan) => this.onclickPointTransfer(
            [m],
            faan,
            "dachut",
            otherPlayers.filter((o) => o.id !== m.id)
          ),
          other: {
            title: ""
          }
        }).element
      );
      this.baozimo.dropdown.options = otherPlayers.map(
        (m) => new FaanDropdownButton({
          textContent: m.name,
          classList: ["small-button"],
          onclick: async (ev, faan) => this.onclickPointTransfer(
            [m],
            faan,
            "baozimo",
            otherPlayers.filter((o) => o.id !== m.id)
          ),
          other: {
            title: ""
          }
        }).element
      );
      this.zimo.onclick = async (ev, faan) => this.onclickPointTransfer(otherPlayers, faan, "zimo", []);
    }
    updateMember(memberId) {
      this.memberId = memberId;
      this.updatePlayers();
    }
    static empty(parent) {
      return new Component({
        tag: "button",
        textContent: "\u98DF",
        parent,
        classList: ["win-button", "small-button"],
        other: {
          disabled: true
        }
      });
    }
  };
  var AwaitButton = class extends Component {
    constructor(params) {
      super({ tag: "button", ...params });
      this.waiting = false;
      if (params.other?.onclick !== void 0) {
        throw Error("Pass onclick directly to an AwaitButton");
      }
      let passedOnclick = params.onclick || (() => {
      });
      let onclick = async (ev) => {
        if (this.waiting) {
          console.warn(
            "Prevented a repeat input because the previous request from this element had not completed yet.",
            this
          );
          return;
        }
        this.waiting = true;
        let r = await passedOnclick(ev);
        this.waiting = false;
        return r;
      };
      this.element.onclick = onclick;
    }
  };
  var FaanDropdownButton = class extends DropdownButton {
    constructor(params) {
      let min = params.min || 3;
      let max = params.max || 10;
      let faanRange = Array.from(Array(max + 1).keys()).slice(min);
      if (params.includePenalty) faanRange.push(-10);
      let passedOnclick = params.onclick || (() => {
      });
      let options = faanRange.map((faan) => {
        let onclick = (ev) => passedOnclick(ev, faan);
        return new AwaitButton({
          classList: ["small-button"],
          textContent: faan == -10 ? "Penalty" : faan.toString(),
          onclick,
          other: {
            title: ""
          }
        }).element;
      });
      super({ dropdownTag: "div", ...params, options });
      this.min = min;
      this.max = max;
      this.includePenalty = params.includePenalty || false;
      this._onclick = passedOnclick;
    }
    get onclick() {
      return this._onclick;
    }
    set onclick(v) {
      let faanRange = Array.from(Array(this.max + 1).keys()).slice(this.min);
      if (this.includePenalty) faanRange.push(-10);
      this.dropdown.options = faanRange.map((faan) => {
        let func = (ev) => v(ev, faan);
        return new Component({
          tag: "button",
          classList: ["small-button"],
          textContent: faan === -10 ? "Penalty" : faan.toString(),
          other: {
            onclick: func,
            title: ""
          }
        }).element;
      });
      this._onclick = v;
    }
  };
  var PlayerTag = class extends UsesSeat(InputListener) {
    constructor({ disabled = false, ...params }) {
      super({
        ...params,
        classList: ["player"],
        tag: "td"
      });
      this.tableNo = params.tableNo;
      this.seat = params.seat;
      let table = getTable(this.tableNo);
      if (table instanceof MahjongUnknownTableError) {
        this.memberId = 0;
        this.nameTag = new NameTag({
          classList: ["name-tag", this.seat],
          parent: this.element,
          value: void 0,
          other: {
            disabled: true
          }
        });
        this.winButton = this.disableWinButton();
        return;
      }
      this.memberId = table[this.seat];
      let me = getMember(this.memberId);
      this.nameTag = new NameTag({
        classList: ["name-tag", this.seat],
        parent: this.element,
        value: isMember(me) ? me : void 0,
        other: {
          disabled
        }
      });
      if (this.memberId === 0) {
        this.winButton = WinButton.empty(this.element);
      } else if (window.MJDATA.members.find((m) => m.id == this.memberId) === void 0) {
        console.warn(
          `Found a table ${table.table_no} with an invalid member of id ${table[this.seat]}. Assuming EMPTY - the datafile might need to be manually cleaned.`
        );
        this.winButton = WinButton.empty(this.element);
      } else {
        this.winButton = new WinButton({
          tableNo: this.tableNo,
          memberId: this.memberId,
          textContent: "\u98DF",
          parent: this.element,
          classList: ["win-button", "small-button"]
        });
      }
    }
    updateSeat(seat) {
      throw Error("not written");
      this.seat = seat;
      this.listener = this.generateListener();
    }
    updateTable(tableNo) {
      throw Error("not written");
      this.tableNo = tableNo;
      this.listener = this.generateListener();
    }
    /** Updates the WinButton to reflect the new `Member` at `this.seat`.
     * Does not update `this.memberId``.
     * Called by the parent component when member changes.
     */
    updateWinButton(table) {
      if (table === void 0) {
        table = getTable(this.tableNo);
      }
      if (table instanceof MahjongUnknownTableError) {
        this.disableWinButton();
        return;
      }
      let newMember = getMember(table[this.seat]);
      if (!isMember(newMember)) {
        this.disableWinButton();
        return;
      }
      if (this.winButton instanceof WinButton) {
        this.winButton.updateMember(newMember.id);
      } else if (this.memberId != 0) {
        this.winButton.element.remove();
        this.winButton = new WinButton({
          tableNo: this.tableNo,
          memberId: this.memberId,
          textContent: "\u98DF",
          parent: this.element,
          classList: ["win-button", "small-button"]
        });
      }
    }
    disableWinButton() {
      let newButton = WinButton.empty();
      this.winButton.element.replaceWith(newButton.element);
      this.winButton = newButton;
      return this.winButton;
    }
    // PlayerTag should update the table data but all the WinButtons will be updated by the table
    generateListener() {
      return async (ev) => {
        let target = ev.target;
        if (!(target instanceof HTMLSelectElement)) return;
        let newMember = window.MJDATA.members.find(
          (v) => v.name === target.value
        );
        if (!newMember) throw Error("could not find member from <option>");
        this.memberId = newMember.id;
        let tableCopy = getTable(this.tableNo);
        if (tableCopy instanceof MahjongUnknownTableError) {
          console.error(tableCopy);
          alert(
            "An error occurred while finding the table to modify. Please contact a member of the council."
          );
          return;
        }
        tableCopy[this.seat] = newMember.id;
        editTable(
          [
            {
              tableNo: this.tableNo,
              newTable: tableCopy
            }
          ],
          this.nameTag.element
        );
      };
    }
  };

  // src/components/seatingUtils.ts
  var import_stats_base_dists_normal_quantile = __toESM(require_lib39());
  function isSat(mem) {
    for (let t of window.MJDATA.tables) {
      if (mem.id == t.east) return true;
      if (mem.id == t.south) return true;
      if (mem.id == t.west) return true;
      if (mem.id == t.north) return true;
    }
    return false;
  }
  async function seatMemberLast(member, inPlaceOfCouncil = true, eventTarget = document) {
    let councilIds = inPlaceOfCouncil ? window.MJDATA.members.filter((m) => m.council).map((m) => m.id) : [];
    for (let t of window.MJDATA.tables.sort(
      (a, b) => a.table_no - b.table_no
    )) {
      if (t.east === 0 || councilIds.includes(t.east)) {
        t.east = member.id;
      } else if (t.south === 0 || councilIds.includes(t.south)) {
        t.south = member.id;
      } else if (t.west === 0 || councilIds.includes(t.west)) {
        t.west = member.id;
      } else if (t.north === 0 || councilIds.includes(t.north)) {
        t.north = member.id;
      } else {
        continue;
      }
      return await editTable(
        [
          {
            tableNo: t.table_no,
            newTable: t
          }
        ],
        eventTarget
      );
    }
  }
  async function allocateSeats(seatAbsent = false, seatCouncilLast = true, eventTarget = document) {
    let nTables = Math.floor(
      window.MJDATA.members.filter((m) => m.tournament.registered).length / 4
    );
    let maxNewTables = 10;
    while (window.MJDATA.tables.length < nTables && maxNewTables > 0) {
      await addTable(eventTarget);
      maxNewTables--;
    }
    let council = [];
    for (let mem of window.MJDATA.members) {
      if (mem.council && seatCouncilLast) {
        council.push(mem);
        continue;
      }
      if (!isSat(mem) && (seatAbsent || mem.tournament.registered)) {
        if (await seatMemberLast(mem, seatCouncilLast, eventTarget) === void 0) {
          console.log("ended early");
          return false;
        }
      }
    }
    console.log("seating council");
    shuffleArray(council);
    for (let cMem of council) {
      if (!isSat(cMem) && (seatAbsent || cMem.tournament.registered)) {
        await seatMemberLast(cMem, false, eventTarget);
      }
    }
    return true;
  }
  function shuffleArray(array) {
    for (let i = array.length - 1; i >= 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  function gaussianRandom(mean = 0, stdev = 1) {
    const u = 1 - Math.random();
    const v = Math.random();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return z * stdev + mean;
  }
  function matchmakingCoefficientToStdev(mc) {
    let arg = (1 + mc) / 2;
    let inv_sigma = Math.SQRT2 * (0, import_stats_base_dists_normal_quantile.default)(arg, 0, 1);
    console.log(mc, 1 / inv_sigma);
    return 1 / inv_sigma;
  }
  var OrderableElement = class {
    constructor(item, order) {
      this.item = item;
      this.order = order;
    }
  };
  function weightedNormalShuffle(array, sigma = 1, key = (_, index) => index) {
    let stdev = sigma * array.length;
    let elements = array.map(
      (item, index) => new OrderableElement(
        item,
        gaussianRandom(key(item, index, array), stdev)
      )
    );
    elements = elements.sort((a, b) => a.order - b.order);
    return elements.map((elem) => elem.item);
  }
  function randomizeSeats(array) {
    array.sort((a, b) => {
      let memberA = getMember(a);
      let memberB = getMember(b);
      if (!(isMember(memberA) && isMember(memberB))) return 0;
      let pts = (m) => m.tournament.session_points + m.tournament.total_points;
      return pts(memberB) - pts(memberA);
    });
    let sigma = matchmakingCoefficientToStdev(
      window.MJDATA.settings.matchmakingCoefficient
    );
    return weightedNormalShuffle(array, sigma);
  }
  function getRandomCouncilMap() {
    let councilMap = /* @__PURE__ */ new Map();
    let councilIds = window.MJDATA.members.filter((m) => m.council && m.tournament.registered).map((m) => m.id);
    let randomisedCouncilId = [...councilIds];
    shuffleArray(randomisedCouncilId);
    for (let i = 0; i < councilIds.length; i++) {
      councilMap.set(councilIds[i], randomisedCouncilId[i]);
    }
    return councilMap;
  }
  async function shuffleSeats(eventTarget = document) {
    window.sessionStorage.setItem("undoButton", "");
    let councilMap = getRandomCouncilMap();
    let flatTables = [];
    let tableOrders = [];
    for (let t of window.MJDATA.tables) {
      tableOrders.push(t.table_no);
      flatTables.push(t.east);
      flatTables.push(t.south);
      flatTables.push(t.west);
      flatTables.push(t.north);
    }
    flatTables = flatTables.map((m) => {
      if (m === 0 || !councilMap.has(m)) return m;
      let newCouncil = councilMap.get(m);
      return newCouncil === void 0 ? m : newCouncil;
    });
    flatTables = randomizeSeats(flatTables);
    let tableNo;
    let tableIndex = 0;
    let edits = [];
    while (tableIndex < tableOrders.length) {
      tableNo = tableOrders[tableIndex];
      let oldTable = getTable(tableNo);
      if (oldTable instanceof MahjongUnknownTableError) {
        console.error(oldTable);
        alert(
          "Something went wrong while shuffling the tables - please refresh and try again."
        );
        return;
      }
      let newTable = { ...oldTable };
      let seatIndex = 0;
      while (seatIndex < 4) {
        if (seatIndex === 0) {
          newTable.east = flatTables[tableIndex * 4 + seatIndex];
        } else if (seatIndex === 1) {
          newTable.south = flatTables[tableIndex * 4 + seatIndex];
        } else if (seatIndex === 2) {
          newTable.west = flatTables[tableIndex * 4 + seatIndex];
        } else if (seatIndex === 3) {
          newTable.north = flatTables[tableIndex * 4 + seatIndex];
          edits.push({ tableNo, newTable });
        }
        seatIndex++;
      }
      tableIndex++;
    }
    await editTable(edits, eventTarget);
  }
  function testFunction(f, N = 1e4, l = 20) {
    let array = Array.from(Array(l).keys());
    let elementCount;
    let indexMap = /* @__PURE__ */ new Map();
    for (let _ = 0; _ <= N; _++) {
      f(array).forEach((v, index) => {
        elementCount = indexMap.get(index) || /* @__PURE__ */ new Map();
        elementCount.set(v, (elementCount.get(v) || 0) + 1);
        indexMap.set(index, elementCount);
      });
    }
    let results;
    indexMap.forEach((ec, index) => {
      console.log(`Position ${index}`);
      results = [];
      ec.forEach((count, i) => {
        results.push([i, count / N * 100]);
      });
      results.sort((a, b) => a[0] - b[0]);
      results.forEach(([a, b]) => {
        console.log(a, "|".repeat(b));
      });
    });
  }
  if (window.DEBUG === void 0) window.DEBUG = {};
  window.DEBUG.weightedNormalShuffle = weightedNormalShuffle;
  window.DEBUG.testFunction = testFunction;

  // src/components/input/focus/dialog.ts
  var Dialog = class extends FocusNode {
    constructor({ activator, ...params }) {
      super({
        tag: "dialog",
        ...params
      });
      this.excludeSelf = false;
      if (activator.element === params.parent) {
        console.warn(
          `Setting the activator as a parent of the ${this} dialog will mean that whenever it is clicked it is reactivated. To bypass this warning, manually add the child node.`
        );
      }
      this.activator = activator;
      let dialog = this;
      this.activator.element.addEventListener("click", (ev) => {
        this.activate();
      });
      this.exclude.push(this.activator.element);
      this.element.style["padding"] = "0";
    }
    activate() {
      this.element.showModal();
      return super.activate();
    }
    deactivate() {
      this.element.close();
      return super.deactivate();
    }
  };
  var ConfirmationDialog = class extends Dialog {
    constructor(params) {
      super(params);
      this.element.style.maxWidth = "50%";
      this.div = new Component({
        tag: "div",
        parent: this.element
      });
      this.div.element.style.width = "100%";
      this.div.element.style.height = "100%";
      this.p = new Component({
        tag: "p",
        parent: this.div.element,
        other: {
          innerHTML: params.message.replace("\n", "<br/>")
        }
      });
      this.p.element.style.width = "100%";
      this.buttonsDiv = new Component({
        tag: "div",
        parent: this.div.element
      });
      this.buttonsDiv.element.style.display = "flex";
      this.buttonsDiv.element.style.justifyContent = "center";
      this.confirm = new Component({
        tag: "button",
        textContent: "Yes",
        parent: this.buttonsDiv.element
      });
      this.cancel = new Component({
        tag: "button",
        textContent: "Cancel",
        parent: this.buttonsDiv.element
      });
      this.confirm.element.style.fontSize = "16px";
      this.cancel.element.style.fontSize = "16px";
      this.confirm.element.style.margin = "0 1em 1em 1em";
      this.cancel.element.style.margin = "0 1em 1em 1em";
      this.confirm.element.style.padding = "4px";
      this.cancel.element.style.padding = "4px";
      this.onconfirm = params.onconfirm;
      this.oncancel = params.oncancel === void 0 ? () => {
      } : params.oncancel;
      this.updateButtons();
    }
    updateButtons() {
      this.cancel.element.onclick = (ev) => {
        this.oncancel(ev);
        if (!ev.defaultPrevented) {
          this.deactivate();
        }
      };
      this.confirm.element.onclick = this.onconfirm;
    }
  };

  // src/components/input/form/input.ts
  var Input = class extends Component {
    constructor({ id, ...params }) {
      super({
        tag: "input",
        id,
        ...params
      });
      this.element.autocomplete = params.autocomplete;
    }
    label(text) {
      let obj = {
        label: new Component({
          tag: "label",
          textContent: text,
          other: {
            htmlFor: this.element.id
          }
        })
      };
      this.element.insertAdjacentElement("beforebegin", obj.label.element);
      return Object.setPrototypeOf(obj, this);
    }
  };
  function getMatchingSubstrings(...targets) {
    let substring_match = "";
    for (let i = 0; i < Math.min(...targets.map((t) => t.length)); i++) {
      let next_char = targets[0][i];
      if (targets.every((v) => v[i] === next_char)) {
        substring_match = substring_match + next_char;
      } else {
        break;
      }
    }
    return substring_match;
  }
  var SmartInput = class extends Input {
    constructor({ id, parent, optionsValues, ...params }) {
      super({
        id,
        parent,
        autocomplete: "off",
        // not relevant for this component - we know all possible values
        ...params
      });
      this.repeatedAction = false;
      let dlid = `${id}-datalist`;
      this.datalist = new Component({
        tag: "datalist",
        parent,
        id: dlid
      });
      this.renderOptions(optionsValues);
      this.element.setAttribute("list", dlid);
      this.element.onchange = (ev) => {
        this.element.focus();
        let match = this.match(this.element.value);
        if (match === this.element.value) return;
        if (match !== void 0) {
          this.element.value = match;
        }
      };
    }
    // todo: resolve the mystery of why getters and setters didn't work. I reckon it's because
    // Labelled delegates to the original via prototyping.
    getOptions() {
      return Array.from(this.datalist.element.children).map((e) => {
        if (!(e instanceof HTMLOptionElement))
          console.warn(
            "getOptions called on object (below) but a non-option child was detected: should I parse?",
            this
          );
        return e.textContent || "";
      });
    }
    match(value) {
      value = value.trim().toLowerCase();
      let matches = this.getOptions().filter(
        (o) => o.trim().toLowerCase().startsWith(value)
      );
      if (matches.length === 1) {
        return matches[0];
      } else if (matches.length === 0) {
        return;
      } else {
        let matchedSubstr = getMatchingSubstrings(
          ...matches.map((m) => m.trim().toLowerCase())
        );
        return value + matchedSubstr.slice(value.length);
      }
    }
    renderOptions(optionsValues) {
      let newOptions = [];
      for (let o of optionsValues) {
        newOptions.push(
          new Component({
            tag: "option",
            textContent: o
          })
        );
      }
      this.datalist.clearChildNodes();
      this.datalist.appendChildNodes(...newOptions.map((c) => c.element));
    }
  };

  // src/components/editMembersPanel.ts
  var RemoveMemberButton = class extends DropdownButton {
    constructor(params) {
      super({
        textContent: "-",
        classList: ["member-button"],
        ...params
      });
      this.update();
    }
    update() {
      this.dropdown.options = window.MJDATA.members.map(
        (m) => new Component({
          tag: "button",
          textContent: m.name,
          other: {
            onclick: async (ev) => editMember({ id: m.id }, this.element)
          }
        }).element
      );
    }
  };
  var AddMemberButton = class extends Component {
    constructor(params) {
      super({
        tag: "button",
        classList: ["member-button"],
        textContent: "+",
        other: {
          id: "add-member"
        },
        ...params
      });
      this.dialog = new Dialog({
        activator: this,
        parent: document.body,
        id: "add-member-dialog"
      });
      this.form = new Component({
        tag: "form",
        parent: this.dialog.element,
        id: "new-member-form",
        other: {
          method: "dialog",
          action: "/members",
          enctype: "application/json",
          onsubmit: async (ev) => {
            ev.preventDefault();
            let name = new FormData(this.form.element).get("name")?.toString();
            if (!name) {
              throw Error("no name");
            }
            await addMember({ name }, this.form.element);
          }
        }
      });
      this.form.element.addEventListener(
        "mjAddMember",
        () => this.dialog.deactivate()
      );
      this.label = new Component({
        tag: "label",
        textContent: "New member",
        parent: this.form.element,
        other: {
          htmlFor: "name"
        }
      });
      this.input = new Component({
        tag: "input",
        parent: this.form.element,
        id: "name",
        other: {
          name: "name",
          autocomplete: "name",
          placeholder: "Username"
        }
      });
      this.submit = new Component({
        tag: "button",
        textContent: "Submit",
        parent: this.form.element
      });
    }
  };
  var Register = class extends Component {
    constructor(params) {
      super({
        tag: "form",
        classList: ["register"],
        ...params
      });
      this.sortMembers = (...members) => members.sort((a, b) => {
        if (a.name > b.name) {
          return 1;
        } else if (a.name < b.name) {
          return -1;
        } else {
          return 0;
        }
      });
      this.input = new SmartInput({
        id: "register-input",
        parent: this.element,
        optionsValues: this.sortMembers(...window.MJDATA.members).map(
          (v) => v.name
        )
      }).label("Register");
      this.input.element.style["fontSize"] = "14px";
      this.element.onsubmit = (ev) => {
        ev.preventDefault();
        let name = this.input.element.value.trim();
        let members = window.MJDATA.members.filter(
          (m) => m.name.trim() == name
        );
        if (members.length > 1) {
          console.error(`Multiple members named ${name}`);
          alert(
            "There seem to be multiple members with this name. If this is unlikely, try refreshing. Otherwise, you should rename one, I guess."
          );
          return;
        } else if (members.length === 0) {
          console.error(`No member named ${name}`);
          alert(
            "There was no member with that name found. Try refreshing?"
          );
          return;
        }
        let member = members[0];
        let r = manualRegister(
          { memberId: member.id },
          true,
          // leaveTables
          this.input.element
        );
        r.then((success) => {
          if (!success) {
            alert("Please try again.");
            window.location.reload;
          }
        });
      };
    }
    updateMembers() {
      this.input.renderOptions(
        this.sortMembers(...window.MJDATA.members).map((m) => m.name)
      );
    }
  };
  var EditMembersPanel = class extends Component {
    constructor(params) {
      super({
        tag: "div",
        classList: ["edit-members-bar"],
        ...params
      });
      this.addButton = new AddMemberButton({
        parent: this.element,
        dialogParent: this.element
      });
      this.removeButton = new RemoveMemberButton({
        dropdownTag: "div",
        options: [],
        parent: this.element
      });
      this.register = new Register({ parent: this.element });
      this.resetButton = new IconButton({
        // passed as an activator to confirmation (below)
        icon: "reset",
        parent: this.element,
        other: {
          title: "Reset the session (prompted to confirm)"
        }
      });
      let confirmation = new ConfirmationDialog({
        activator: this.resetButton,
        parent: this.element,
        // NOT INSIDE THE BUTTON otherwise it will reactivate itself
        message: "Are you sure you want to reset the session?\n\nThis will sum the current points to each member's total points. This cannot be undone. It will also mark everyone as absent.",
        onconfirm: (ev) => {
          resetSession();
          setTimeout(() => location.reload(), 50);
        }
      });
      this.exportButton = new Component({
        tag: "a",
        parent: this.element,
        other: {
          id: "export-button",
          href: "/data.json",
          download: "mahjong_data.json"
        }
      });
      this.exportButton.element.appendChild(
        new IconButton({
          icon: "download",
          other: {
            title: "Download raw game data as JSON"
          }
        }).svg
      );
    }
  };

  // src/components/memberTable.ts
  var MemberGrid = class extends Component {
    constructor(params) {
      super({
        tag: "table",
        id: "member-table",
        ...params
      });
      this.memberElems = {};
      this.crowns = [];
      this.updateMembers();
      this.showAbsent = false;
      document.addEventListener("mjPointTransfer", (ev) => {
        this.updateMembers();
      });
      document.addEventListener("mjEditTable", (ev) => {
        this.updateSatMembers();
      });
    }
    renderNewHeaders() {
      this.element.innerHTML = "";
      let headerRow = new Component({
        tag: "tr",
        parent: this.element
      });
      let name = new Component({
        tag: "th",
        textContent: "Name",
        parent: headerRow.element
      });
      let points = new Component({
        tag: "th",
        textContent: this.showAbsent ? "Total" : "Pts.",
        parent: headerRow.element
      });
      let regCount = window.MJDATA.members.filter(
        (m) => m.tournament.registered
      ).length;
      let present = new Component({
        tag: "th",
        classList: ["header", "registered"],
        textContent: `Here? (${regCount})`,
        parent: headerRow.element
      });
    }
    updateMembers() {
      this.renderNewHeaders();
      [...window.MJDATA.members].sort((a, b) => {
        if (this.showAbsent) {
          return b.tournament.total_points + b.tournament.session_points - (a.tournament.total_points + a.tournament.session_points);
        } else {
          return b.tournament.session_points - a.tournament.session_points;
        }
      }).forEach((m) => this.renderMember(m));
      this.renderWinnerCrowns();
    }
    updateSatMembers() {
      let mId;
      let td;
      for (mId in this.memberElems) {
        td = this.memberElems[mId][1];
        if (td.member.tournament.registered) {
          if (!isSat(td.member)) {
            td.element.style.color = "red";
            td.element.style.fontWeight = "bold";
          } else if (this.showAbsent) {
            td.element.style.color = "";
            td.element.style.fontWeight = "bold";
          } else {
            td.element.style.color = "";
            td.element.style.fontWeight = "";
          }
        } else {
          td.element.style.color = "";
          td.element.style.fontWeight = "";
        }
      }
    }
    renderWinnerCrowns() {
      this.crowns.forEach((c) => c.element.remove());
      this.crowns = [];
      let maxPts = Math.max(
        ...window.MJDATA.members.map(
          (m) => m.tournament.session_points + m.tournament.total_points
        )
      );
      let winners = window.MJDATA.members.filter(
        (m) => m.tournament.session_points + m.tournament.total_points === maxPts
      );
      let wMember;
      for (wMember of winners) {
        let wRow = (this.memberElems[wMember.id] || [
          void 0,
          void 0
        ])[0];
        if (wRow === void 0) continue;
        this.renderCrown(wRow);
      }
    }
    renderCrown(row) {
      row.element.style.position = "relative";
      let crown = new Component({
        tag: "span",
        textContent: "\u{1F451}",
        classList: ["winner-crown"],
        parent: row.element
      });
      this.crowns.push(crown);
    }
    renderMember(member) {
      if (!member.tournament.registered && !this.showAbsent) return;
      let row = new Component({
        tag: "tr",
        parent: this.element
      });
      let name = new NameTd(member, {
        parent: row.element
      });
      if (member.tournament.registered) {
        if (!isSat(member)) {
          name.element.style.color = "red";
          name.element.style.fontWeight = "bold";
        } else if (this.showAbsent) {
          name.element.style.fontWeight = "bold";
        }
      }
      let pointsTd = new PointsTd({
        points: this.showAbsent ? member.tournament.total_points + member.tournament.session_points : member.tournament.session_points,
        parent: row.element
      });
      let presentTd = new Component({
        tag: "td",
        classList: ["registered"],
        parent: row.element
      });
      let checkbox = new Component({
        tag: "input",
        classList: ["present-checkbox"],
        parent: presentTd.element,
        other: {
          type: "checkbox",
          checked: member.tournament.registered,
          onchange: async () => {
            let r = await manualRegister(
              { memberId: member.id },
              true,
              // leaveTables
              checkbox.element
            );
            if (!r) {
              alert("Please try again.");
              window.location.reload();
            }
          }
        }
      });
      this.memberElems[member.id] = [row, name];
    }
  };
  var PointsTd = class extends Component {
    constructor(params) {
      super({
        tag: "td",
        textContent: params.points.toString(),
        ...params
      });
      this.element.style["backgroundColor"] = params.points > 0 ? "green" : params.points === 0 ? "yellow" : "red";
    }
  };
  var NameTd = class extends FocusNode {
    constructor(member, params) {
      super({
        tag: "td",
        textContent: member.name,
        ...params
      });
      this.member = member;
      this.input = new Component({
        tag: "input",
        other: {
          value: member.name
        }
      });
      this.input.element.style.fontSize = "16px";
      this.input.element.style.margin = "0";
      this.input.element.style.width = "90%";
      this.keyListener = async (ev) => {
        if (ev.key === "Enter") {
          let r = await editMember({
            id: member.id,
            newMember: {
              id: member.id,
              name: this.input.element.value,
              tournament: member.tournament,
              council: member.council
            }
          });
          if (r instanceof AppError) return;
        }
        if (ev.key === "Escape" || ev.key === "Enter") {
          this.deactivate();
        }
      };
      this.dblclickListener = (ev) => {
        this.activate();
      };
      this.element.addEventListener("dblclick", this.dblclickListener);
    }
    activate() {
      super.activate();
      this.element.style.padding = "0";
      this.element.innerHTML = "";
      this.element.appendChild(this.input.element);
      this.input.element.addEventListener("keydown", this.keyListener);
      this.input.element.focus();
      return this;
    }
    deactivate() {
      super.deactivate();
      this.input.element.removeEventListener("keydown", this.keyListener);
      this.element.innerHTML = "";
      this.element.style.padding = "";
      this.element.textContent = this.member.name;
      return this;
    }
  };

  // src/components/sidebar.ts
  function renderSidebar() {
    let sidebar_elem = document.getElementById("sidebar");
    let main_article = document.getElementById("tables");
    if (!(sidebar_elem instanceof HTMLElement)) {
      throw Error("Could not find sidebar");
    }
    if (!(main_article instanceof HTMLElement)) {
      throw Error("Could not find main tables article");
    }
    let sidebar = new Sidebar({
      antagonist: main_article,
      element: sidebar_elem
    });
    document.addEventListener("mjEditMember", (ev) => {
      sidebar.membersTable.updateMembers();
      sidebar.editMembersPanel.removeButton.update();
      sidebar.editMembersPanel.register.updateMembers();
    });
    document.addEventListener("mjAddMember", (ev) => {
      sidebar.membersTable.updateMembers();
      sidebar.editMembersPanel.removeButton.update();
      sidebar.editMembersPanel.register.updateMembers();
    });
    sidebar.element.addEventListener("mjRegister", (ev) => {
      sidebar.membersTable.updateMembers();
      sidebar.editMembersPanel.register.input.element.value = "";
    });
    document.addEventListener("mjUndoLog", (ev) => {
      sidebar.membersTable.updateMembers();
    });
  }
  var ExpandSidebarButton = class extends Component {
    constructor({ open, close, ...params }) {
      super({
        tag: "button",
        textContent: ">",
        ...params
      });
      this.isOpen = false;
    }
  };
  var ShowAllCheckboxPanel = class extends Component {
    constructor(params) {
      super({
        tag: "div",
        id: "show-all-checkbox-panel",
        textContent: "Show unregistered members?",
        ...params
      });
      this.checkbox = new Component({
        tag: "input",
        classList: ["register-checkbox"],
        parent: this.element,
        other: {
          title: "Show all members?",
          type: "checkbox"
        }
      });
    }
  };
  var Sidebar = class extends Component {
    constructor({ antagonist, ...params }) {
      super({
        tag: "div",
        id: "sidebar",
        ...params
      });
      this.antagonist = antagonist;
      this.contents = new Component({
        tag: "div",
        id: "sidebar-contents",
        parent: this.element
      });
      this.expandButton = new ExpandSidebarButton({
        open: this.open,
        close: this.close,
        parent: this.element
      });
      this.editMembersPanel = new EditMembersPanel({
        parent: this.contents.element
      });
      this.showAllCheckboxPanel = new ShowAllCheckboxPanel({
        parent: this.contents.element
      });
      this.membersTable = new MemberGrid({
        classList: ["info-grid"],
        parent: this.contents.element
      });
      this.showAllCheckboxPanel.checkbox.element.onchange = () => {
        this.membersTable.showAbsent = this.showAllCheckboxPanel.checkbox.element.checked;
        this.membersTable.updateMembers();
      };
      this.expandButton.element.onclick = () => {
        if (this.expandButton.isOpen) {
          this.close();
          this.expandButton.element.textContent = ">";
        } else {
          this.open();
          this.expandButton.element.textContent = "<";
        }
      };
      this.closeByDefault();
    }
    open() {
      this.expandButton.isOpen = true;
      window.sessionStorage.setItem("sidebar", "open");
      this.element.classList.replace("closed", "open");
      if (window.innerWidth < 1e3) {
        this.element.style.width = "100%";
        this.antagonist.style["display"] = "none";
      } else {
        this.element.style.width = "30%";
      }
    }
    close() {
      this.expandButton.isOpen = false;
      window.sessionStorage.setItem("sidebar", "closed");
      this.antagonist.removeAttribute("style");
      this.element.removeAttribute("style");
      this.element.classList.replace("open", "closed");
    }
    closeByDefault() {
      this.element.style["transition"] = "none";
      this.element.classList.add("closed");
      if (window.sessionStorage.getItem("sidebar") === "open") {
        this.open();
      }
      setTimeout(() => this.element.style["transition"] = "", 1);
    }
  };

  // src/pages/tables.ts
  function tables() {
    renderTables();
    renderSidebar();
    renderHeader();
    document.addEventListener("mjEditMember", () => renderTables());
    document.addEventListener("mjResetSession", () => {
      renderSidebar();
      renderTables();
    });
    document.addEventListener("mjRegister", () => {
      renderTables();
    });
    document.addEventListener("mjAddTable", () => renderTables());
  }
  function renderHeader() {
    let headerBar = document.getElementById("header-bar");
    if (headerBar == void 0) {
      throw Error("No element with header-bar id");
    }
    let sit = new IconButton({
      icon: "fill",
      onclick: async (ev) => {
        await allocateSeats(false, true, sit.element);
        renderTables();
      },
      other: {
        title: "Fill seats with players"
      }
    });
    headerBar.children[0].insertAdjacentElement("beforebegin", sit.element);
    let shuffle = new IconButton({
      icon: "shuffle",
      parent: headerBar,
      onclick: async (ev) => {
        await shuffleSeats(shuffle.element);
        renderTables();
        let tablesGrid = document.getElementById("table");
        if (!tablesGrid) throw new Error("Couldn't find #table");
        tablesGrid.style.animation = "shake 0.2s";
        window.setTimeout(() => tablesGrid.style.animation = "", 200);
      },
      other: {
        title: "Randomize seating"
      }
    });
    let legendPanel = new Legend({
      parent: headerBar
    });
  }
  function renderTables() {
    let table_table = document.getElementById("table");
    if (!table_table) throw Error("No element with the table id is present.");
    table_table.innerHTML = "";
    let tables2 = [...window.MJDATA.tables];
    tables2 = tables2.sort((a, b) => a.table_no - b.table_no);
    try {
      tables2 = tables2.concat(
        ...JSON.parse(
          window.sessionStorage.getItem("savedTables") || "[]"
        ).sort((a, b) => b.table_no - a.table_no)
      );
    } catch {
    }
    let tablesAndNewButton = tables2.concat(
      void 0
    );
    let current_row = document.createElement("tr");
    let n_cols = 3;
    let index = 0;
    let td = document.createElement("td");
    for (const i of tablesAndNewButton) {
      if (index >= n_cols) {
        table_table.appendChild(current_row);
        current_row = document.createElement("tr");
        index = 0;
      }
      if (i === void 0) {
        let createTableButton = new Component({
          tag: "button",
          textContent: "+",
          parent: td,
          classList: ["create-table"],
          other: {
            onclick: async (ev) => {
              let r = await addTable(createTableButton.element);
              renderTables();
            }
          }
        });
      } else {
        let gameTable = new GameTable({
          parent: td,
          table: i
        });
      }
      current_row.appendChild(td);
      td = document.createElement("td");
      index++;
    }
    table_table.appendChild(current_row);
  }
  var GameTable = class extends InputListener {
    constructor(params) {
      super({
        ...params,
        tag: "table"
      });
      this.tableNo = params.table.table_no;
      let blank = (v) => v.appendChild(document.createElement("td"));
      let innerRows = [
        document.createElement("tr"),
        document.createElement("tr"),
        document.createElement("tr")
      ];
      innerRows.forEach((i) => this.element.appendChild(i));
      blank(innerRows[0]);
      let west = new PlayerTag({
        parent: innerRows[0],
        tableNo: params.table.table_no,
        seat: "west",
        disabled: this.tableNo < 0
      });
      blank(innerRows[0]);
      let north = new PlayerTag({
        parent: innerRows[1],
        tableNo: params.table.table_no,
        seat: "north",
        disabled: this.tableNo < 0
      });
      this.innerTableDisplay = new Component({
        tag: "td",
        classList: ["mahjong-table-display"],
        textContent: this.tableNo >= 0 ? this.tableNo.toString() : "Saved",
        parent: innerRows[1]
      });
      this.buttonPanel = new ButtonPanel({
        table: params.table,
        parent: this.innerTableDisplay.element
      });
      let south = new PlayerTag({
        parent: innerRows[1],
        tableNo: params.table.table_no,
        seat: "south",
        disabled: this.tableNo < 0
      });
      blank(innerRows[2]);
      let east = new PlayerTag({
        parent: innerRows[2],
        tableNo: params.table.table_no,
        seat: "east",
        disabled: this.tableNo < 0
      });
      this.renderDeleteCell(innerRows[2]);
      this.players = [east, south, west, north];
      this.element.addEventListener(
        "mjPointTransfer",
        (ev) => this.animatePointTransfer(ev)
      );
      document.addEventListener("mjPointTransfer", (ev) => {
        let log = ev.detail;
        if (ev.target instanceof HTMLElement && this.element.contains(ev.target)) {
          this.buttonPanel.toggleUndoButton(log.id);
        } else {
          this.buttonPanel.toggleUndoButton(void 0);
        }
      });
      this.element.addEventListener(
        "mjEditTable",
        () => this.buttonPanel.toggleUndoButton(void 0)
      );
    }
    animatePointTransfer(ev) {
      let winner = this.findPlayerTag(ev.detail.to);
      if (!winner) return;
      pointBounce(winner, ev.detail.points * ev.detail.from.length, {
        wind: winner.seat
      });
      let loserId;
      for (loserId of ev.detail.from) {
        let loser = this.findPlayerTag(loserId);
        if (!loser) continue;
        pointBounce(loser, -ev.detail.points, { wind: loser.seat });
      }
    }
    findPlayerTag(memberId) {
      let p;
      for (p of this.players) {
        if (p.memberId === memberId) {
          return p;
        }
      }
    }
    renderDeleteCell(parent) {
      let deleteButtonCell = document.createElement("td");
      let deleteButton = new DeleteButton({
        parent: deleteButtonCell,
        tableNo: this.tableNo,
        ondelete: () => {
          renderTables();
        }
      });
      parent.appendChild(deleteButtonCell);
    }
    generateListener() {
      return (ev) => {
        for (const player of this.players) {
          player.updateWinButton();
        }
      };
    }
    updateTable(tableNo) {
      throw Error("not imp.");
    }
  };
  var ButtonPanel = class extends Component {
    constructor(params) {
      super({
        tag: "div",
        classList: ["button-panel"],
        ...params
      });
      this.table = params.table;
      this.saveButton = new IconButton({
        icon: "save",
        parent: this.element,
        disabled: this.table.table_no < 0,
        onclick: (ev) => {
          let ssTables = JSON.parse(
            window.sessionStorage.getItem("savedTables") || "[]"
          );
          let newTable = { ...this.table };
          newTable.table_no = Math.min(
            0,
            ...ssTables.map((t) => t.table_no)
          ) - 1;
          ssTables.push(newTable);
          window.sessionStorage.setItem(
            "savedTables",
            JSON.stringify(ssTables)
          );
          let event = new CustomEvent("mjAddTable", {
            detail: this.table,
            bubbles: true
          });
          this.saveButton.element.dispatchEvent(event);
        }
      });
      let [logId, logTableNo] = (window.sessionStorage.getItem("undoButton") || "|").split("|");
      if (logTableNo && parseInt(logTableNo) === this.table.table_no) {
        this.toggleUndoButton(parseInt(logId));
      }
      document.addEventListener("mjUndoLog", (ev) => {
        this.toggleUndoButton(void 0);
      });
    }
    toggleUndoButton(logId) {
      if (this.undoButton) this.undoButton.element.remove();
      if (logId === void 0) {
        return;
      }
      window.sessionStorage.setItem(
        "undoButton",
        `${logId}|${this.table.table_no}`
      );
      this.undoButton = new IconButton({
        icon: "undo",
        parent: this.element,
        onclick: async (ev) => {
          let log = window.MJDATA.log.find((l) => l.id == logId);
          if (log === void 0) {
            alert(
              "That log couldn't be found - the webpage might have disconnected without uploading your win. Check with a member of the council; sorry!"
            );
            throw new Error("log not found");
          }
          await undoLog(
            {
              id: logId
            },
            // ! because we're setting it here. idk what to say
            this.undoButton.element
          );
          window.sessionStorage.removeItem("undoButton");
        }
      });
    }
  };

  // src/components/helpTooltip.ts
  var HelpHoverTooltip = class extends Component {
    constructor({ parent, ...params }) {
      super({
        tag: "span",
        classList: ["tooltip-parent"],
        parent,
        textContent: "?"
      });
      this.tooltip = new Tooltip({ parent: this.element, ...params });
    }
  };
  var Tooltip = class extends Component {
    constructor({
      message,
      width = "200px",
      widthExpandDirection = "right",
      ...params
    }) {
      super({
        tag: "div",
        classList: ["tooltip"],
        ...params
      });
      this.element.style.width = width;
      if (widthExpandDirection === "right") {
        this.element.style.left = "0";
      } else {
        this.element.style.right = "0";
      }
      let lastBr;
      for (let line of message.split("\n")) {
        let pElem = document.createElement("p");
        pElem.textContent = line;
        this.element.appendChild(pElem);
        lastBr = document.createElement("br");
        this.element.appendChild(lastBr);
      }
      lastBr?.remove();
    }
  };

  // src/pages/log.ts
  var isNatural = (f) => Array.from(f.trim()).every((i) => "0123456789".includes(i));
  var isInteger = (f) => isNatural(f) || f[0] === "-" && isNatural(f.slice(1));
  var normalizeQueryString = (s) => s.trim().toLowerCase();
  function getIntegerMatchPredicate(subquery) {
    return (l, sn) => l.faan === subquery || sn === subquery;
  }
  function getNameMatchPredicate(subquery) {
    subquery = normalizeQueryString(subquery);
    let logMemberIds = (l) => l.from.concat(l.to);
    let logMembers = (l) => logMemberIds(l).map(getMember).filter((m) => isMember(m));
    let logMemberNames = (l) => logMembers(l).map((m) => normalizeQueryString(m.name));
    return (l) => logMemberNames(l).includes(subquery);
  }
  function parseQuery(query) {
    query = query.trim().toLowerCase();
    let predicateList = [(l, sn) => true];
    for (let sq of query.split(" ")) {
      if (sq === "") {
        continue;
      }
      if (isInteger(sq)) {
        let predicate = (l, sn) => getIntegerMatchPredicate(parseInt(sq))(l, sn);
        predicateList.push(predicate);
      } else {
        let predicate = (l, sn) => getNameMatchPredicate(sq)(l, sn);
        predicateList.push(predicate);
      }
    }
    return (l, sn) => predicateList.every((v) => v(l, sn));
  }
  function logPage() {
    let placeholderLogTable = document.getElementById("log-table");
    if (!(placeholderLogTable instanceof HTMLTableElement)) {
      throw Error("Couldn't get log-table <table> element.");
    }
    let mainChildDiv = new Component({
      tag: "div"
    });
    mainChildDiv.element.style.width = "100%";
    let logTable = new LogTable({
      classList: ["info-grid", "log"],
      parent: mainChildDiv.element
    });
    placeholderLogTable.replaceWith(mainChildDiv.element);
    let filterForm = new FilterForm({
      oninput: (ev, value) => {
        logTable.element.innerHTML = "";
        logTable.renderHeaders();
        logTable.renderLogs(parseQuery(value));
      }
    });
    logTable.element.insertAdjacentElement("beforebegin", filterForm.element);
  }
  function getFaanFromPoints(points, n_losers, win_kind) {
    if (win_kind === "baozimo") {
      points = points / 3;
    } else if (win_kind === "dachut" || n_losers === 1) {
      points = points / 2;
    }
    for (let [faan, pts] of POINTS.entries()) {
      if (pts == points) return faan;
    }
    return void 0;
  }
  var FilterForm = class extends Component {
    constructor({ oninput, ...params }) {
      super({
        tag: "form",
        id: "filter-form",
        ...params
      });
      this.label = new Component({
        tag: "label",
        textContent: "Filter:",
        parent: this.element
      });
      this.oninput = oninput;
      this.input = new Component({
        tag: "input",
        parent: this.element,
        other: {
          placeholder: "Enter a name"
        }
      });
      this.input.element.style.width = "auto";
      this.input.element.style.fontSize = "12px";
      this.input.element.oninput = (ev) => this.oninput(ev, this.input.element.value);
      this.help = new HelpHoverTooltip({
        parent: this.element,
        width: "200px",
        message: "You can enter search terms such as names (included in log) or numbers (matches session # or faan).\nTerms are separated by spaces and every term must match a log."
      });
    }
  };
  var LogTable = class extends Component {
    constructor(params) {
      super({
        tag: "table",
        ...params
      });
      this.element.style.marginTop = "10px";
      this.headerRow = new Component({
        tag: "tr",
        parent: this.element
      });
      this.weekMap = /* @__PURE__ */ new Map();
      let sessionNo = 1;
      let date;
      window.MJDATA.log.map((l) => l.datetime).filter((d) => d !== null).sort().forEach((d) => {
        date = new Date(d).toDateString();
        if (this.weekMap.has(date)) return;
        this.weekMap.set(date, sessionNo);
        sessionNo++;
      });
      this.headers = [];
      this.logs = [];
      this.createHeaders();
      this.renderLogs();
      this.element.addEventListener("mjUndoLog", () => {
        this.element.innerHTML = "";
        this.renderHeaders();
        this.renderLogs();
      });
    }
    /**
     * Also renders the headers automatically.
     */
    createHeaders() {
      this.headers.push(
        new Component({
          tag: "th",
          parent: this.headerRow.element,
          textContent: "Session"
        })
      );
      this.headers[0].element.style["width"] = "8%";
      this.headers.push(
        new Component({
          tag: "th",
          parent: this.headerRow.element,
          textContent: "Faan"
        })
      );
      this.headers[1].element.style["width"] = "8%";
      this.headers.push(
        new Component({
          tag: "th",
          parent: this.headerRow.element,
          textContent: "Win type"
        })
      );
      this.headers[2].element.style["width"] = "14%";
      this.headers.push(
        new Component({
          tag: "th",
          parent: this.headerRow.element,
          textContent: "Winner"
        })
      );
      this.headers[3].element.style["width"] = "20%";
      this.headers.push(
        new Component({
          tag: "th",
          parent: this.headerRow.element,
          textContent: "Losers"
        })
      );
      this.headers.push(
        new Component({
          tag: "th",
          parent: this.headerRow.element,
          textContent: "Del."
        })
      );
      this.headers[5].element.style["width"] = "5%";
    }
    renderHeaders() {
      let header;
      for (header of this.headers) {
        this.element.appendChild(header.element);
      }
    }
    renderLogs(filter = () => true) {
      this.logs = [];
      let reverseLog = [...window.MJDATA.log].reverse();
      let log;
      let matchedIds;
      let session;
      for (log of reverseLog) {
        if (log.disabled) continue;
        session = log.datetime === null ? void 0 : this.weekMap.get(new Date(log.datetime).toDateString());
        if (!filter(log, session)) continue;
        this.logs.push(
          new LogRow({
            log,
            parent: this.element,
            boldIds: matchedIds,
            session
          })
        );
      }
    }
  };
  var LogRow = class extends Component {
    constructor({
      session = void 0,
      boldIds = [],
      ...params
    }) {
      super({
        tag: "tr",
        ...params
      });
      this.log = params.log;
      let win_kind = params.log.win_kind;
      this.dateTd = new Component({
        tag: "td",
        parent: this.element,
        textContent: session === void 0 ? params.log.datetime === null ? "(Date unknown)" : new Date(params.log.datetime).toDateString() : session.toString()
      });
      this.faanTd = new Component({
        tag: "td",
        parent: this.element,
        textContent: params.log.faan ? params.log.faan.toString() : getFaanFromPoints(
          params.log.points,
          params.log.from.length,
          win_kind === null ? void 0 : win_kind
        )?.toString() || "???"
      });
      this.modeTd = new Component({
        tag: "td",
        parent: this.element,
        textContent: win_kind === "zimo" || params.log.from.length > 1 ? "\u81EA\u6478" : win_kind === "dachut" ? "\u6253\u51FA" : win_kind === "baozimo" ? "\u5305\u81EA\u6478" : "\u6253\u51FA?"
      });
      this.toTd = new Component({
        tag: "td",
        parent: this.element,
        textContent: getMember(params.log.to).name
      });
      if (boldIds.includes(params.log.to))
        this.toTd.element.style.fontWeight = "bold";
      this.fromTd = new Component({
        tag: "td",
        parent: this.element
      });
      let mId;
      let memberSpan;
      for (mId of params.log.from) {
        if (memberSpan !== void 0)
          this.fromTd.element.appendChild(document.createTextNode(", "));
        memberSpan = document.createElement("span");
        memberSpan.textContent = getMember(mId).name;
        if (boldIds.includes(mId)) memberSpan.style.fontWeight = "bold";
        this.fromTd.element.appendChild(memberSpan);
      }
      this.disableTd = new Component({
        tag: "td",
        parent: this.element
      });
      this.disableTd.element.style.paddingBottom = "0";
      this.disableTd.element.style.border = "none";
      this.disableButton = new IconButton({
        icon: "trash",
        parent: this.disableTd.element,
        onclick: this.disable
      });
      this.disableButton.element.style.width = "16px";
      this.disableButton.element.style.paddingBottom = "26px";
    }
    async disable() {
      let r = await undoLog(
        {
          id: this.log.id
        },
        this.element
      );
      if (r instanceof AppError) return;
      window.sessionStorage.removeItem("undoButton");
    }
  };

  // src/components/settings.ts
  var SettingField = class extends Component {
    constructor({
      labelText,
      settingId,
      onupdate,
      ...params
    }) {
      super({
        tag: "fieldset",
        ...params
      });
      this.label = new Component({
        tag: "label",
        textContent: labelText,
        parent: this.element
      });
      this.label.element.setAttribute("for", "matchmakingInput");
      this.helpTooltip = new HelpHoverTooltip({
        message: "A number between 0 and 1 which determines the behaviour of the table shuffling algorithm.\n0 is an entirely random shuffle and 1 is completely fixed by order of total points.",
        width: "200px",
        widthExpandDirection: "left",
        parent: this.element
      });
      this.input = new Component({
        tag: "input",
        parent: this.element,
        other: {
          id: `${settingId}-input`,
          name: `${settingId}`
        }
      });
      this.input.element.oninput = (ev) => {
        if (onupdate !== void 0) {
          onupdate(ev);
        }
      };
    }
  };
  var SettingsPanel = class extends Dropdown {
    constructor({ onupdate, ...params }) {
      super({
        tag: "form",
        options: [],
        ...params
      });
      this.matchmaking = new SettingField({
        parent: this.element,
        settingId: "matchmakingCoefficient",
        labelText: "Matchmaking Coefficient"
      });
      this.element.onsubmit = async (ev) => {
        ev.preventDefault();
        let r = await updateSettings({
          matchmakingCoefficient: Number(
            this.matchmaking.input.element.value
          )
        });
        if (r instanceof AppError) return;
        if (onupdate !== void 0) onupdate(ev);
      };
      this.options = [this.matchmaking.element];
    }
  };
  var SettingsButton = class extends DropdownButton {
    constructor() {
      let iconbutton = new IconButton({
        icon: "settings"
      });
      let settingsPanel = new SettingsPanel({
        onupdate: (ev) => {
          this.deactivate();
        }
      });
      super({
        dropdownTag: "form",
        dropdown: settingsPanel,
        element: iconbutton.element
      });
      this.element.classList = "settings-button dropdown-button";
    }
  };

  // src/index.ts
  function pageMatches(options) {
    let path = window.location.href.split("/").slice(3).join("/");
    if (!(options instanceof Array)) options = [options];
    return options.includes(path);
  }
  async function setup(data) {
    window.MJDATA = await data;
    for (let settingsButton of Array.from(
      document.getElementsByClassName("settings-button")
    )) {
      settingsButton.replaceWith(new SettingsButton().element);
    }
  }
  function loadPage(pageRenderer) {
    let headers = {
      Accept: "application/json"
    };
    fetch("/data.json", { headers }).then(async (r) => {
      await setup(r.json());
      pageRenderer();
    });
  }
  function route() {
    if (pageMatches(["tables", "table"])) {
      loadPage(tables);
    } else if (pageMatches("qr")) {
      displayQR;
    } else if (pageMatches("log")) {
      loadPage(logPage);
    }
  }
  document.addEventListener("DOMContentLoaded", route);
})();
/*! Bundled license information:

@stdlib/utils-define-property/lib/define_property.js:
@stdlib/utils-define-property/lib/has_define_property_support.js:
  (**
  * @license Apache-2.0
  *
  * Copyright (c) 2021 The Stdlib Authors.
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *
  *    http://www.apache.org/licenses/LICENSE-2.0
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  *)

@stdlib/utils-define-property/lib/builtin.js:
@stdlib/utils-define-property/lib/polyfill.js:
@stdlib/utils-define-property/lib/index.js:
@stdlib/utils-define-nonenumerable-read-only-property/lib/main.js:
@stdlib/utils-define-nonenumerable-read-only-property/lib/index.js:
@stdlib/math-base-assert-is-nan/lib/main.js:
@stdlib/math-base-assert-is-nan/lib/index.js:
@stdlib/math-base-special-sqrt/lib/main.js:
@stdlib/math-base-special-sqrt/lib/index.js:
@stdlib/assert-has-symbol-support/lib/main.js:
@stdlib/assert-has-symbol-support/lib/index.js:
@stdlib/assert-has-tostringtag-support/lib/main.js:
@stdlib/assert-has-tostringtag-support/lib/index.js:
@stdlib/utils-native-class/lib/tostring.js:
@stdlib/utils-native-class/lib/main.js:
@stdlib/assert-has-own-property/lib/main.js:
@stdlib/assert-has-own-property/lib/index.js:
@stdlib/symbol-ctor/lib/main.js:
@stdlib/symbol-ctor/lib/index.js:
@stdlib/utils-native-class/lib/tostringtag.js:
@stdlib/utils-native-class/lib/polyfill.js:
@stdlib/utils-native-class/lib/index.js:
@stdlib/assert-is-uint32array/lib/main.js:
@stdlib/assert-is-uint32array/lib/index.js:
@stdlib/constants-uint32-max/lib/index.js:
@stdlib/assert-has-uint32array-support/lib/uint32array.js:
@stdlib/assert-has-uint32array-support/lib/main.js:
@stdlib/assert-has-uint32array-support/lib/index.js:
@stdlib/array-uint32/lib/main.js:
@stdlib/array-uint32/lib/polyfill.js:
@stdlib/array-uint32/lib/index.js:
@stdlib/assert-is-float64array/lib/main.js:
@stdlib/assert-is-float64array/lib/index.js:
@stdlib/assert-has-float64array-support/lib/float64array.js:
@stdlib/assert-has-float64array-support/lib/main.js:
@stdlib/assert-has-float64array-support/lib/index.js:
@stdlib/array-float64/lib/main.js:
@stdlib/array-float64/lib/polyfill.js:
@stdlib/array-float64/lib/index.js:
@stdlib/assert-is-uint8array/lib/main.js:
@stdlib/assert-is-uint8array/lib/index.js:
@stdlib/constants-uint8-max/lib/index.js:
@stdlib/assert-has-uint8array-support/lib/uint8array.js:
@stdlib/assert-has-uint8array-support/lib/main.js:
@stdlib/assert-has-uint8array-support/lib/index.js:
@stdlib/array-uint8/lib/main.js:
@stdlib/array-uint8/lib/polyfill.js:
@stdlib/array-uint8/lib/index.js:
@stdlib/assert-is-uint16array/lib/main.js:
@stdlib/assert-is-uint16array/lib/index.js:
@stdlib/constants-uint16-max/lib/index.js:
@stdlib/assert-has-uint16array-support/lib/uint16array.js:
@stdlib/assert-has-uint16array-support/lib/main.js:
@stdlib/assert-has-uint16array-support/lib/index.js:
@stdlib/array-uint16/lib/main.js:
@stdlib/array-uint16/lib/polyfill.js:
@stdlib/array-uint16/lib/index.js:
@stdlib/assert-is-little-endian/lib/ctors.js:
@stdlib/assert-is-little-endian/lib/main.js:
@stdlib/assert-is-little-endian/lib/index.js:
@stdlib/number-float64-base-get-high-word/lib/high.js:
@stdlib/number-float64-base-get-high-word/lib/main.js:
@stdlib/number-float64-base-get-high-word/lib/index.js:
@stdlib/number-float64-base-set-high-word/lib/high.js:
@stdlib/number-float64-base-set-high-word/lib/main.js:
@stdlib/number-float64-base-set-high-word/lib/index.js:
@stdlib/constants-float64-exponent-bias/lib/index.js:
@stdlib/number-ctor/lib/main.js:
@stdlib/number-ctor/lib/index.js:
@stdlib/constants-float64-ninf/lib/index.js:
@stdlib/math-base-special-ln/lib/index.js:
@stdlib/constants-float64-pinf/lib/index.js:
@stdlib/math-base-special-erfinv/lib/index.js:
@stdlib/stats-base-dists-normal-quantile/lib/main.js:
@stdlib/utils-constant-function/lib/main.js:
@stdlib/utils-constant-function/lib/index.js:
@stdlib/stats-base-dists-degenerate-quantile/lib/main.js:
@stdlib/stats-base-dists-degenerate-quantile/lib/factory.js:
@stdlib/stats-base-dists-degenerate-quantile/lib/index.js:
@stdlib/stats-base-dists-normal-quantile/lib/factory.js:
@stdlib/stats-base-dists-normal-quantile/lib/index.js:
  (**
  * @license Apache-2.0
  *
  * Copyright (c) 2018 The Stdlib Authors.
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *
  *    http://www.apache.org/licenses/LICENSE-2.0
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  *)

@stdlib/string-base-format-interpolate/lib/is_number.js:
@stdlib/string-base-format-interpolate/lib/zero_pad.js:
@stdlib/string-base-format-interpolate/lib/format_integer.js:
@stdlib/string-base-format-interpolate/lib/is_string.js:
@stdlib/string-base-format-interpolate/lib/format_double.js:
@stdlib/string-base-format-interpolate/lib/space_pad.js:
@stdlib/string-base-format-interpolate/lib/main.js:
@stdlib/string-base-format-interpolate/lib/index.js:
@stdlib/string-base-format-tokenize/lib/main.js:
@stdlib/string-base-format-tokenize/lib/index.js:
@stdlib/string-format/lib/is_string.js:
@stdlib/string-format/lib/main.js:
@stdlib/string-format/lib/index.js:
@stdlib/math-base-special-ln/lib/polyval_p.js:
@stdlib/math-base-special-ln/lib/polyval_q.js:
@stdlib/math-base-special-erfinv/lib/rational_p1q1.js:
@stdlib/math-base-special-erfinv/lib/rational_p2q2.js:
@stdlib/math-base-special-erfinv/lib/rational_p3q3.js:
@stdlib/math-base-special-erfinv/lib/rational_p4q4.js:
@stdlib/math-base-special-erfinv/lib/rational_p5q5.js:
  (**
  * @license Apache-2.0
  *
  * Copyright (c) 2022 The Stdlib Authors.
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *
  *    http://www.apache.org/licenses/LICENSE-2.0
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  *)

@stdlib/math-base-special-ln/lib/main.js:
  (**
  * @license Apache-2.0
  *
  * Copyright (c) 2018 The Stdlib Authors.
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *
  *    http://www.apache.org/licenses/LICENSE-2.0
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  *
  *
  * ## Notice
  *
  * The following copyright and license were part of the original implementation available as part of [FreeBSD]{@link https://svnweb.freebsd.org/base/release/9.3.0/lib/msun/src/e_log.c}. The implementation follows the original, but has been modified for JavaScript.
  *
  * ```text
  * Copyright (C) 1993 by Sun Microsystems, Inc. All rights reserved.
  *
  * Developed at SunPro, a Sun Microsystems, Inc. business.
  * Permission to use, copy, modify, and distribute this
  * software is freely granted, provided that this notice
  * is preserved.
  * ```
  *)

@stdlib/math-base-special-erfinv/lib/main.js:
  (**
  * @license Apache-2.0
  *
  * Copyright (c) 2018 The Stdlib Authors.
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *
  *    http://www.apache.org/licenses/LICENSE-2.0
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  *
  *
  * ## Notice
  *
  * The original C++ code and copyright notice are from the [Boost library]{@link http://www.boost.org/doc/libs/1_48_0/boost/math/special_functions/detail/erf_inv.hpp}. This implementation follows the original, but has been modified for JavaScript.
  *
  * ```text
  * (C) Copyright John Maddock 2006.
  *
  * Use, modification and distribution are subject to the
  * Boost Software License, Version 1.0. (See accompanying file
  * LICENSE or copy at http://www.boost.org/LICENSE_1_0.txt)
  * ```
  *)
*/
