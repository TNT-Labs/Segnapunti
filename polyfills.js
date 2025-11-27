// ===================================================================
// 🔧 POLYFILLS - Browser Compatibility
// ===================================================================
// ✅ FIX BUG #43: Polyfill per browser meno recenti
//
// ⚠️ NOTA MANUTENZIONE (MIGLIORAMENTO AUDIT #3):
// Questi polyfills sono per Internet Explorer 11 e browser molto vecchi.
// IE11 non è più supportato da Microsoft dal 15 Giugno 2022.
//
// Se decidi di NON supportare più IE11 e browser antichi:
// - Puoi rimuovere questo file completamente
// - Rimuovi anche i riferimenti in index.html, settings.html, etc.
// - Questo ridurrà la dimensione del bundle di ~5KB
//
// Browser supportati SENZA polyfills:
// - Chrome 51+ (2016)
// - Firefox 54+ (2017)
// - Safari 10+ (2016)
// - Edge 15+ (2017)
// ===================================================================

// Object.assign polyfill (IE 11)
if (typeof Object.assign !== 'function') {
  Object.defineProperty(Object, 'assign', {
    value: function assign(target) {
      'use strict';
      if (target === null || target === undefined) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      const to = Object(target);

      for (let index = 1; index < arguments.length; index++) {
        const nextSource = arguments[index];

        if (nextSource !== null && nextSource !== undefined) {
          for (const nextKey in nextSource) {
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    writable: true,
    configurable: true
  });
}

// Array.from polyfill (IE 11)
if (!Array.from) {
  Array.from = (function () {
    const toStr = Object.prototype.toString;
    const isCallable = function (fn) {
      return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
    };
    const toInteger = function (value) {
      const number = Number(value);
      if (isNaN(number)) return 0;
      if (number === 0 || !isFinite(number)) return number;
      return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
    };
    const maxSafeInteger = Math.pow(2, 53) - 1;
    const toLength = function (value) {
      const len = toInteger(value);
      return Math.min(Math.max(len, 0), maxSafeInteger);
    };

    return function from(arrayLike) {
      const C = this;
      const items = Object(arrayLike);

      if (arrayLike == null) {
        throw new TypeError('Array.from requires an array-like object - not null or undefined');
      }

      const mapFn = arguments.length > 1 ? arguments[1] : void undefined;
      let T;
      if (typeof mapFn !== 'undefined') {
        if (!isCallable(mapFn)) {
          throw new TypeError('Array.from: when provided, the second argument must be a function');
        }
        if (arguments.length > 2) {
          T = arguments[2];
        }
      }

      const len = toLength(items.length);
      const A = isCallable(C) ? Object(new C(len)) : new Array(len);
      let k = 0;
      let kValue;

      while (k < len) {
        kValue = items[k];
        if (mapFn) {
          A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
        } else {
          A[k] = kValue;
        }
        k += 1;
      }
      A.length = len;
      return A;
    };
  }());
}

// Array.includes polyfill (IE 11, Edge <14)
if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, 'includes', {
    value: function(searchElement, fromIndex) {
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      const o = Object(this);
      const len = o.length >>> 0;

      if (len === 0) {
        return false;
      }

      const n = fromIndex | 0;
      let k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      function sameValueZero(x, y) {
        return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
      }

      while (k < len) {
        if (sameValueZero(o[k], searchElement)) {
          return true;
        }
        k++;
      }

      return false;
    }
  });
}

// String.prototype.includes polyfill (IE 11)
if (!String.prototype.includes) {
  String.prototype.includes = function(search, start) {
    'use strict';

    if (search instanceof RegExp) {
      throw TypeError('first argument must not be a RegExp');
    }
    if (start === undefined) { start = 0; }
    return this.indexOf(search, start) !== -1;
  };
}

// String.prototype.startsWith polyfill (IE 11)
if (!String.prototype.startsWith) {
  Object.defineProperty(String.prototype, 'startsWith', {
    value: function(search, rawPos) {
      const pos = rawPos > 0 ? rawPos|0 : 0;
      return this.substring(pos, pos + search.length) === search;
    }
  });
}

// String.prototype.endsWith polyfill (IE 11)
if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(search, this_len) {
    if (this_len === undefined || this_len > this.length) {
      this_len = this.length;
    }
    return this.substring(this_len - search.length, this_len) === search;
  };
}

// Promise.finally polyfill (IE 11, Edge <18)
if (typeof Promise !== 'undefined' && !Promise.prototype.finally) {
  Promise.prototype.finally = function(onFinally) {
    return this.then(
      function(value) {
        return Promise.resolve(onFinally()).then(function() {
          return value;
        });
      },
      function(reason) {
        return Promise.resolve(onFinally()).then(function() {
          throw reason;
        });
      }
    );
  };
}

// NodeList.forEach polyfill (IE 11)
if (window.NodeList && !NodeList.prototype.forEach) {
  NodeList.prototype.forEach = Array.prototype.forEach;
}

// Optional chaining polyfill placeholder
// (Note: vero optional chaining richiede transpilation con Babel)
// Gli sviluppatori dovrebbero usare feature detection: if (obj && obj.prop)

// ✅ FIX BUG #51: Verifica disponibilità Logger
if (typeof Logger !== 'undefined' && Logger.log) {
  Logger.log('✅ Polyfills caricati');
} else {
  console.log('✅ Polyfills caricati');
}
