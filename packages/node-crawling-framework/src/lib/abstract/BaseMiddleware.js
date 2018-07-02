function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg;
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  return funcs.reduce((a, b) => (...args) => a(b(...args)));
}

class BaseMiddleware {
  _applyToMethod(methodName, ...middlewares) {
    if (!this._methods) {
      this._methods = {};
      this._methodMiddlewares = {};
    }

    if (typeof methodName === "string" && !/^_+|_+$/g.test(methodName)) {
      let method = this._methods[methodName] || this[methodName];
      if (typeof method === "function") {
        this._methods[methodName] = method;
        if (this._methodMiddlewares[methodName] === undefined) {
          this._methodMiddlewares[methodName] = [];
        }
        middlewares.forEach(
          middleware =>
            typeof middleware === "function" &&
            this._methodMiddlewares[methodName].push(middleware(this))
        );
        this[methodName] = compose(...this._methodMiddlewares[methodName])(
          method.bind(this)
        );
      }
    }
  }

  use(...middlewares) {
    Array.prototype.slice.call(arguments).forEach(arg => {
      typeof arg === "object" &&
        Object.keys(arg).forEach(key => {
          typeof arg[key] === "function" &&
            this._applyToMethod(key, arg[key].bind(arg));
        });
    });
  }
}

module.exports = BaseMiddleware;