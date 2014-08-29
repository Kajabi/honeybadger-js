/*
  honeybadger.js v0.1.0
  A JavaScript Notifier for Honeybadger
  https://github.com/honeybadger-io/honeybadger-js
  https://www.honeybadger.io/
  MIT license
*/
(function(window) {
// Generated by CoffeeScript 1.7.1
var Configuration;

Configuration = (function() {
  Configuration.defaults = {
    api_key: null,
    host: 'api.honeybadger.io',
    ssl: true,
    project_root: window.location.protocol + '//' + window.location.host,
    environment: 'production',
    component: null,
    action: null,
    disabled: false,
    onerror: false,
    debug: false,
    timeout: 100
  };

  function Configuration(options) {
    var k, v, _ref;
    if (options == null) {
      options = {};
    }
    _ref = this.constructor.defaults;
    for (k in _ref) {
      v = _ref[k];
      this[k] = v;
    }
    for (k in options) {
      v = options[k];
      this[k] = v;
    }
  }

  Configuration.prototype.reset = function() {
    var k, v, _ref;
    _ref = this.constructor.defaults;
    for (k in _ref) {
      v = _ref[k];
      this[k] = v;
    }
    return this;
  };

  return Configuration;

})();
// Generated by CoffeeScript 1.7.1
var Notice;

Notice = (function() {
  function Notice(options) {
    var k, v, _ref, _ref1, _ref2, _ref3;
    this.options = options != null ? options : {};
    this.error = this.options.error;
    this.stack = this._stackTrace(this.error);
    this["class"] = (_ref = this.error) != null ? _ref.name : void 0;
    this.message = (_ref1 = this.error) != null ? _ref1.message : void 0;
    this.source = null;
    this.url = document.URL;
    this.project_root = Honeybadger.configuration.project_root;
    this.environment = Honeybadger.configuration.environment;
    this.component = Honeybadger.configuration.component;
    this.action = Honeybadger.configuration.action;
    this.cgi_data = this._cgiData();
    this.context = {};
    _ref2 = Honeybadger.context;
    for (k in _ref2) {
      v = _ref2[k];
      this.context[k] = v;
    }
    if (this.options.context && typeof this.options.context === 'object') {
      _ref3 = this.options.context;
      for (k in _ref3) {
        v = _ref3[k];
        this.context[k] = v;
      }
    }
  }

  Notice.prototype.payload = function() {
    return {
      notifier: {
        name: 'honeybadger.js',
        url: 'https://github.com/honeybadger-io/honeybadger-js',
        version: Honeybadger.version,
        language: 'javascript'
      },
      error: {
        "class": this["class"],
        message: this.message,
        backtrace: this.stack,
        source: this.source
      },
      request: {
        url: this.url,
        component: this.component,
        action: this.action,
        context: this.context,
        cgi_data: this.cgi_data
      },
      server: {
        project_root: this.project_root,
        environment_name: this.environment
      }
    };
  };

  Notice.prototype._stackTrace = function(error) {
    return (error != null ? error.stacktrace : void 0) || (error != null ? error.stack : void 0) || null;
  };

  Notice.prototype._cgiData = function() {
    var data, k, v;
    data = {};
    if (typeof navigator !== "undefined" && navigator !== null) {
      for (k in navigator) {
        v = navigator[k];
        if ((k != null) && (v != null) && !(typeof v === 'object')) {
          data[k.replace(/(?=[A-Z][a-z]*)/g, '_').toUpperCase()] = v;
        }
      }
      data['HTTP_USER_AGENT'] = data['USER_AGENT'];
      delete data['USER_AGENT'];
    }
    if (document.referrer.match(/\S/)) {
      data['HTTP_REFERER'] = document.referrer;
    }
    return data;
  };

  return Notice;

})();
// Generated by CoffeeScript 1.7.1
var Client, Honeybadger, UncaughtError, currentError, currentNotice, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

_ref = [null, null], currentError = _ref[0], currentNotice = _ref[1];

Client = (function() {
  Client.prototype.version = '0.1.0';

  function Client(options) {
    this._windowOnErrorHandler = __bind(this._windowOnErrorHandler, this);
    this._domReady = __bind(this._domReady, this);
    this.log('Initializing honeybadger.js ' + this.version);
    if (options) {
      this.configure(options);
    }
  }

  Client.prototype.log = function() {
    this.log.history = this.log.history || [];
    this.log.history.push(arguments);
    if (this.configuration.debug && window.console) {
      return console.log(Array.prototype.slice.call(arguments));
    }
  };

  Client.prototype.configure = function(options) {
    var args, k, v, _i, _len, _ref1;
    if (options == null) {
      options = {};
    }
    for (k in options) {
      v = options[k];
      this.configuration[k] = v;
    }
    if (!this._configured && this.configuration.debug && window.console) {
      _ref1 = this.log.history;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        args = _ref1[_i];
        console.log(Array.prototype.slice.call(args));
      }
    }
    this._configured = true;
    return this;
  };

  Client.prototype.configuration = new Configuration();

  Client.prototype.context = {};

  Client.prototype.resetContext = function(options) {
    if (options == null) {
      options = {};
    }
    this.context = options instanceof Object ? options : {};
    return this;
  };

  Client.prototype.setContext = function(options) {
    var k, v;
    if (options == null) {
      options = {};
    }
    if (options instanceof Object) {
      for (k in options) {
        v = options[k];
        this.context[k] = v;
      }
    }
    return this;
  };

  Client.prototype.beforeNotifyHandlers = [];

  Client.prototype.beforeNotify = function(handler) {
    return this.beforeNotifyHandlers.push(handler);
  };

  Client.prototype.notify = function(error, options) {
    var handler, k, notice, v, _i, _len, _ref1, _ref2;
    if (options == null) {
      options = {};
    }
    if (!this._validConfig() || this.configuration.disabled === true) {
      return false;
    }
    if (error instanceof Error) {
      options['error'] = error;
    } else if (typeof error === 'string') {
      options['error'] = new Error(error);
    } else if (error instanceof Object) {
      for (k in error) {
        v = error[k];
        options[k] = v;
      }
    }
    if (currentNotice) {
      if (options.error === currentError) {
        return;
      } else if (this._loaded) {
        this._send(currentNotice);
      }
    }
    if (((function() {
      var _results;
      _results = [];
      for (k in options) {
        if (!__hasProp.call(options, k)) continue;
        _results.push(k);
      }
      return _results;
    })()).length === 0) {
      return false;
    }
    notice = new Notice(options);
    _ref1 = this.beforeNotifyHandlers;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      handler = _ref1[_i];
      if (handler(notice) === false) {
        return false;
      }
    }
    _ref2 = [options.error, notice], currentError = _ref2[0], currentNotice = _ref2[1];
    if (!this._loaded) {
      this.log('Queuing notice', notice);
      this._queue.push(notice);
    } else {
      this.log('Defering notice', notice);
      window.setTimeout((function(_this) {
        return function() {
          if (options.error === currentError) {
            return _this._send(notice);
          }
        };
      })(this));
    }
    return notice;
  };

  Client.prototype.wrap = function(func) {
    var honeybadgerWrapper;
    return honeybadgerWrapper = function() {
      var e;
      try {
        return func.apply(this, arguments);
      } catch (_error) {
        e = _error;
        Honeybadger.notify(e);
        throw e;
      }
    };
  };

  Client.prototype.reset = function() {
    this.resetContext();
    this.configuration.reset();
    this._configured = false;
    return this;
  };

  Client.prototype.install = function() {
    if (this.installed === true) {
      return;
    }
    if (window.onerror !== this._windowOnErrorHandler) {
      this.log('Installing window.onerror handler');
      this._oldOnErrorHandler = window.onerror;
      window.onerror = this._windowOnErrorHandler;
    }
    if (this._loaded) {
      this.log('honeybadger.js ' + this.version + ' ready');
    } else {
      this.log('Installing ready handler');
      if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', this._domReady, true);
        window.addEventListener('load', this._domReady, true);
      } else {
        window.attachEvent('onload', this._domReady);
      }
    }
    this._installed = true;
    return this;
  };

  Client.prototype._queue = [];

  Client.prototype._loaded = document.readyState === 'complete';

  Client.prototype._configured = false;

  Client.prototype._domReady = function() {
    var notice, _results;
    if (this._loaded) {
      return;
    }
    this._loaded = true;
    this.log('honeybadger.js ' + this.version + ' ready');
    _results = [];
    while (notice = this._queue.pop()) {
      _results.push(this._send(notice));
    }
    return _results;
  };

  Client.prototype._send = function(notice) {
    var _ref1;
    this.log('Sending notice', notice);
    _ref1 = [null, null], currentError = _ref1[0], currentNotice = _ref1[1];
    return this._sendRequest(notice.payload());
  };

  Client.prototype._validConfig = function() {
    var _ref1;
    if (!this._configured) {
      return false;
    }
    if ((_ref1 = this.configuration.api_key) != null ? _ref1.match(/\S/) : void 0) {
      return true;
    } else {
      return false;
    }
  };

  Client.prototype._sendRequest = function(data) {
    var url;
    url = 'http' + ((this.configuration.ssl && 's') || '') + '://' + this.configuration.host + '/v1/notices.gif';
    return this._request(url, data);
  };

  Client.prototype._request = function(url, payload) {
    var img, timeout;
    img = new Image();
    img.src = url + '?' + this._serialize({
      api_key: this.configuration.api_key,
      notice: payload,
      t: new Date().getTime()
    });
    if (this.configuration.timeout) {
      timeout = window.setTimeout(((function(_this) {
        return function() {
          img.src = '';
          return _this.log('Request timed out.', url, payload);
        };
      })(this)), this.configuration.timeout);
      img.onload = function() {
        return window.clearTimeout(timeout);
      };
    }
    return true;
  };

  Client.prototype._serialize = function(obj, prefix) {
    var k, pk, ret, v;
    ret = [];
    for (k in obj) {
      v = obj[k];
      if (obj.hasOwnProperty(k) && (k != null) && (v != null)) {
        pk = (prefix ? prefix + '[' + k + ']' : k);
        ret.push(typeof v === 'object' ? this._serialize(v, pk) : encodeURIComponent(pk) + '=' + encodeURIComponent(v));
      }
    }
    return ret.join('&');
  };

  Client.prototype._windowOnErrorHandler = function(msg, url, line, col, error) {
    if (!currentNotice && this.configuration.onerror) {
      this.log('Error caught by window.onerror', msg, url, line, col, error);
      if (!error) {
        error = new UncaughtError(msg, url, line, col);
      }
      this.notify(error);
    }
    if (this._oldOnErrorHandler) {
      return this._oldOnErrorHandler.apply(this, arguments);
    }
    return false;
  };

  return Client;

})();

UncaughtError = (function(_super) {
  __extends(UncaughtError, _super);

  function UncaughtError(message, url, line, column) {
    this.name = 'UncaughtError';
    this.message = message || 'An unknown error was caught by window.onerror.';
    this.stack = [this.message, '\n    at ? (', url || 'unknown', ':', line || 0, ':', column || 0, ')'].join('');
  }

  return UncaughtError;

})(Error);

Honeybadger = new Client;

Honeybadger.Client = Client;
  window.Honeybadger = Honeybadger;
  Honeybadger.install();
})(window);
