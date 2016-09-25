import { Dict, ParamMiddleware, Middleware, Context, LayerOption } from './router';


/**
 * Initialize a new routing Layer with given `method`, `path`, and `middleware`.
 */
declare class Layer {
    opts: LayerOption;
    name: string;
    methods: string[];
    paramNames: string[];
    stack: Middleware<Context>[];
    path: string;
    regexp: RegExp;

    /**
     * Initialize a new routing Layer with given `method`, `path`, and `middleware`.
     *
     * @param {String|RegExp} path Path string or regular expression.
     * @param {Array} methods Array of HTTP verbs.
     * @param {Array} middleware Layer callback/middleware or series of.
     * @param {Object=} opts
     * @param {String=} opts.name route name
     * @param {String=} opts.sensitive case sensitive (default: false)
     * @param {String=} opts.strict require the trailing slash (default: false)
     * @returns {Layer}
     * @private
     */
    constructor(path: string | RegExp, methods: string[], middleware: Middleware<Context>, opts?: LayerOption);
    constructor(path: string | RegExp, methods: string[], middleware: Middleware<Context>[], opts?: LayerOption);

    /**
     * Returns whether request `path` matches route.
     *
     * @param {String} path
     * @returns {Boolean}
     * @private
     */
    match(path: string): boolean;

    /**
     * Returns map of URL parameters for given `path` and `paramNames`.
     *
     * @param {String} path
     * @param {Array.<String>} captures
     * @param {Object=} existingParams
     * @returns {Object}
     * @private
     */
    params(path: string, captures: string[], existingParams: Dict<any>): Dict<any>;

    /**
     * Returns array of regexp url path captures.
     *
     * @param {String} path
     * @returns {Array.<String>}
     * @private
     */
    captures(path: string): string[];

    /**
     * Generate URL for route using given `params`.
     *
     * @example
     *
     * ```javascript
     * var route = new Layer(['GET'], '/users/:id', fn);
     *
     * route.url({ id: 123 }); // => "/users/123"
     * ```
     *
     * @param {Object} params url parameters
     * @returns {String}
     * @private
     */
    url(params: Dict<any>): string;
    url(...params: any[]): string;

    /**
     * Run validations on route named parameters.
     *
     * @example
     *
     * ```javascript
     * router
     *   .param('user', function (id, ctx, next) {
     *     ctx.user = users[id];
     *     if (!user) return ctx.status = 404;
     *     next();
     *   })
     *   .get('/users/:user', function (ctx, next) {
     *     ctx.body = ctx.user;
     *   });
     * ```
     *
     * @param {String} param
     * @param {Function} middleware
     * @returns {Layer}
     * @private
     */
    param(param: string, fn: ParamMiddleware<Context>): this;

    /**
     * Prefix route path.
     *
     * @param {String} prefix
     * @returns {Layer}
     * @private
     */
    setPrefix(prefix: string): this;
}

export = Layer;