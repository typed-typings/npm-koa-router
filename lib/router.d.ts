import { Context as KoaContext } from 'koa';
import Layer = require('./layer');

declare interface Router <C extends Router.Context> {
    opts: Router.RouterOption;
    methods: string[];
    params: Router.Dict<Router.ParamMiddleware<Router.Context>>;
    stack: Layer[];

    /**
     * Use given middleware.
     *
     * Middleware run in the order they are defined by `.use()`. They are invoked
     * sequentially, requests start at the first middleware and work their way
     * "down" the middleware stack.
     *
     * @example
     *
     * ```javascript
     * // session middleware will run before authorize
     * router
     *   .use(session())
     *   .use(authorize());
     *
     * // use middleware only with given path
     * router.use('/users', userAuth());
     *
     * // or with an array of paths
     * router.use(['/users', '/admin'], userAuth());
     *
     * app.use(router.routes());
     * ```
     *
     * @param {String=} path
     * @param {Function} middleware
     * @param {Function=} ...
     * @returns {Router}
     */
    use(...middleware: Router.Middleware<Router.Context>[]): this;
    use(path: string | RegExp, ...middleware: Router.Middleware<Router.Context>[]): this;
    use(path: string[] | RegExp[], ...middleware: Router.Middleware<Router.Context>[]): this;

    /**
     * Set the path prefix for a Router instance that was already initialized.
     *
     * @example
     *
     * ```javascript
     * router.prefix('/things/:thing_id')
     * ```
     *
     * @param {String} prefix
     * @returns {Router}
     */
    prefix(prefix: string): this;

    /**
     * Returns router middleware which dispatches a route matching the request.
     * @returns {Function}
     */
    routes(): Router.Middleware<Router.Context>;
    middleware(): Router.Middleware<Router.Context>;

    /**
     * Returns separate middleware for responding to `OPTIONS` requests with
     * an `Allow` header containing the allowed methods, as well as responding
     * with `405 Method Not Allowed` and `501 Not Implemented` as appropriate.
     *
     * @example
     *
     * ```javascript
     * var app = koa();
     * var router = router();
     *
     * app.use(router.routes());
     * app.use(router.allowedMethods());
     * ```
     *
     * @param {Object=} options
     * @param {Boolean=} options.throw throw error instead of setting status and header
     * @param {Function=} options.notImplemented throw the returned value in place of the default NotImplemented error
     * @param {Function=} options.methodNotAllowed throw the returned value in place of the default MethodNotAllowed error
     * @returns {Function}
     */
    allowedMethods(): Router.Middleware<Router.Context>;
    allowedMethods(options: Router.AllowedMethodsOption): Router.Middleware<Router.Context>;

    /**
     * Redirect `source` to `destination` URL with optional 30x status `code`.
     *
     * Both `source` and `destination` can be route names.
     *
     * ```javascript
     * router.redirect('/login', 'sign-in');
     * ```
     *
     * This is equivalent to:
     *
     * ```javascript
     * router.all('/login', function (ctx) {
     *   ctx.redirect('/sign-in');
     *   ctx.status = 301;
     * });
     * ```
     *
     * @param {String} source URL or route name.
     * @param {String} destination URL or route name.
     * @param {Number} code HTTP status code (default: 301).
     * @returns {Router}
     */
    redirect(source: string, destination: string): this;
    redirect(source: string, destination: string, code: number): this;

    /**
     * Create and register a route.
     *
     * @param {String} path Path string or regular expression.
     * @param {Array.<String>} methods Array of HTTP verbs.
     * @param {Function} middleware Multiple middleware also accepted.
     * @returns {Layer}
     * @private
     */
    register(path: string | RegExp, methods: string[], middleware: Router.Middleware<Router.Context>, opts?: Router.LayerOption): Layer;
    register(path: string | RegExp, methods: string[], middleware: Router.Middleware<Router.Context>[], opts?: Router.LayerOption): Layer;
    register(path: string[] | RegExp[], methods: string[], middleware: Router.Middleware<Router.Context>, opts?: Router.LayerOption): this;
    register(path: string[] | RegExp[], methods: string[], middleware: Router.Middleware<Router.Context>[], opts?: Router.LayerOption): this;

    /**
     * Lookup route with given `name`.
     *
     * @param {String} name
     * @returns {Layer|false}
     */
    route(name: string): Layer | boolean;

    /**
     * Generate URL for route. Takes either map of named `params` or series of
     * arguments (for regular expression routes).
     *
     * ```javascript
     * router.get('user', '/users/:id', function (ctx, next) {
     *  // ...
     * });
     *
     * router.url('user', 3);
     * // => "/users/3"
     *
     * router.url('user', { id: 3 });
     * // => "/users/3"
     * ```
     *
     * @param {String} name route name
     * @param {Object} params url parameters
     * @returns {String|Error}
     */
    url(name: string, params): string | Error;

    /**
     * Match given `path` and return corresponding routes.
     *
     * @param {String} path
     * @param {String} method
     * @returns {Object.<path, pathAndMethod>} returns layers that matched path and
     * path and method.
     * @private
     */
    match(path: string, method: string): Router.MatchedResult;

    /**
     * Run middleware for named route parameters. Useful for auto-loading or
     * validation.
     *
     * @example
     *
     * ```javascript
     * router
     *   .param('user', function (id, ctx, next) {
     *     ctx.user = users[id];
     *     if (!ctx.user) return ctx.status = 404;
     *     return next();
     *   })
     *   .get('/users/:user', function (ctx) {
     *     ctx.body = ctx.user;
     *   })
     *   .get('/users/:user/friends', function (ctx) {
     *     return ctx.user.getFriends().then(function(friends) {
     *       ctx.body = friends;
     *     });
     *   })
     *   // /users/3 => {"id": 3, "name": "Alex"}
     *   // /users/3/friends => [{"id": 4, "name": "TJ"}]
     * ```
     *
     * @param {String} param
     * @param {Function} middleware
     * @returns {Router}
     */
    param<T extends C>(param: string, middleware: Router.ParamMiddleware<T>): this;

    /**
     * Register route with all methods.
     *
     * @param {String} name Optional.
     * @param {String} path
     * @param {Function=} middleware You may also pass multiple middleware.
     * @param {Function} callback
     * @returns {Router}
     * @private
     */
    all<T extends C>(path: string, ...middleware: Router.Middleware<T>[]): this;
    all<T extends C>(name: string, path: string, ...middleware: Router.Middleware<T>[]): this;

    /**
     * Create `router.verb()` methods, where *verb* is one of the HTTP verbs such
     * as `router.get()` or `router.post()`.
     *
     * Match URL patterns to callback functions or controller actions using `router.verb()`,
     * where **verb** is one of the HTTP verbs such as `router.get()` or `router.post()`.
     *
     * ```javascript
     * router
     *   .get('/', function (ctx, next) {
     *     ctx.body = 'Hello World!';
     *   })
     *   .post('/users', function (ctx, next) {
     *     // ...
     *   })
     *   .put('/users/:id', function (ctx, next) {
     *     // ...
     *   })
     *   .del('/users/:id', function (ctx, next) {
     *     // ...
     *   });
     * ```
     *
     * Route paths will be translated to regular expressions used to match requests.
     *
     * Query strings will not be considered when matching requests.
     *
     * #### Named routes
     *
     * Routes can optionally have names. This allows generation of URLs and easy
     * renaming of URLs during development.
     *
     * ```javascript
     * router.get('user', '/users/:id', function (ctx, next) {
     *  // ...
     * });
     *
     * router.url('user', 3);
     * // => "/users/3"
     * ```
     *
     * #### Multiple middleware
     *
     * Multiple middleware may be given:
     *
     * ```javascript
     * router.get(
     *   '/users/:id',
     *   function (ctx, next) {
     *     return User.findOne(ctx.params.id).then(function(user) {
     *       ctx.user = user;
     *       next();
     *     });
     *   },
     *   function (ctx) {
     *     console.log(ctx.user);
     *     // => { id: 17, name: "Alex" }
     *   }
     * );
     * ```
     *
     * ### Nested routers
     *
     * Nesting routers is supported:
     *
     * ```javascript
     * var forums = new Router();
     * var posts = new Router();
     *
     * posts.get('/', function (ctx, next) {...});
     * posts.get('/:pid', function (ctx, next) {...});
     * forums.use('/forums/:fid/posts', posts.routes(), posts.allowedMethods());
     *
     * // responds to "/forums/123/posts" and "/forums/123/posts/123"
     * app.use(forums.routes());
     * ```
     *
     * #### Router prefixes
     *
     * Route paths can be prefixed at the router level:
     *
     * ```javascript
     * var router = new Router({
     *   prefix: '/users'
     * });
     *
     * router.get('/', ...); // responds to "/users"
     * router.get('/:id', ...); // responds to "/users/:id"
     * ```
     *
     * #### URL parameters
     *
     * Named route parameters are captured and added to `ctx.params`.
     *
     * ```javascript
     * router.get('/:category/:title', function (ctx, next) {
     *   console.log(ctx.params);
     *   // => { category: 'programming', title: 'how-to-node' }
     * });
     * ```
     *
     * The [path-to-regexp](https://github.com/pillarjs/path-to-regexp) module is
     * used to convert paths to regular expressions.
     *
     * @name get|put|post|patch|delete
     * @memberof module:koa-router.prototype
     * @param {String} path
     * @param {Function=} middleware route middleware(s)
     * @param {Function} callback route callback
     * @returns {Router}
     */
    get<T extends C>(path: string, ...middleware: Router.Middleware<T>[]): this;
    get<T extends C>(name: string, path: string, ...middleware: Router.Middleware<T>[]): this;
    post<T extends C>(path: string, ...middleware: Router.Middleware<T>[]): this;
    post<T extends C>(name: string, path: string, ...middleware: Router.Middleware<T>[]): this;
    put<T extends C>(path: string, ...middleware: Router.Middleware<T>[]): this;
    put<T extends C>(name: string, path: string, ...middleware: Router.Middleware<T>[]): this;
    head<T extends C>(path: string, ...middleware: Router.Middleware<T>[]): this;
    head<T extends C>(name: string, path: string, ...middleware: Router.Middleware<T>[]): this;
    delete<T extends C>(path: string, ...middleware: Router.Middleware<T>[]): this;
    delete<T extends C>(name: string, path: string, ...middleware: Router.Middleware<T>[]): this;
    del<T extends C>(path: string, ...middleware: Router.Middleware<T>[]): this;
    del<T extends C>(name: string, path: string, ...middleware: Router.Middleware<T>[]): this;
    options<T extends C>(path: string, ...middleware: Router.Middleware<T>[]): this;
    options<T extends C>(name: string, path: string, ...middleware: Router.Middleware<T>[]): this;
    trace<T extends C>(path: string, ...middleware: Router.Middleware<T>[]): this;
    trace<T extends C>(name: string, path: string, ...middleware: Router.Middleware<T>[]): this;
    copy<T extends C>(path: string, ...middleware: Router.Middleware<T>[]): this;
    copy<T extends C>(name: string, path: string, ...middleware: Router.Middleware<T>[]): this;
    lock<T extends C>(path: string, ...middleware: Router.Middleware<T>[]): this;
    lock<T extends C>(name: string, path: string, ...middleware: Router.Middleware<T>[]): this;
    mkcol<T extends C>(path: string, ...middleware: Router.Middleware<T>[]): this;
    mkcol<T extends C>(name: string, path: string, ...middleware: Router.Middleware<T>[]): this;
    move<T extends C>(path: string, ...middleware: Router.Middleware<T>[]): this;
    move<T extends C>(name: string, path: string, ...middleware: Router.Middleware<T>[]): this;
    purge<T extends C>(path: string, ...middleware: Router.Middleware<T>[]): this;
    purge<T extends C>(name: string, path: string, ...middleware: Router.Middleware<T>[]): this;
    propfind<T extends C>(path: string, ...middleware: Router.Middleware<T>[]): this;
    propfind<T extends C>(name: string, path: string, ...middleware: Router.Middleware<T>[]): this;
    proppatch<T extends C>(path: string, ...middleware: Router.Middleware<T>[]): this;
    proppatch<T extends C>(name: string, path: string, ...middleware: Router.Middleware<T>[]): this;
    unlock<T extends C>(path: string, ...middleware: Router.Middleware<T>[]): this;
    unlock<T extends C>(name: string, path: string, ...middleware: Router.Middleware<T>[]): this;
    report<T extends C>(path: string, ...middleware: Router.Middleware<T>[]): this;
    report<T extends C>(name: string, path: string, ...middleware: Router.Middleware<T>[]): this;
    mkactivity<T extends C>(path: string, ...middleware: Router.Middleware<T>[]): this;
    mkactivity<T extends C>(name: string, path: string, ...middleware: Router.Middleware<T>[]): this;
    checkout<T extends C>(path: string, ...middleware: Router.Middleware<T>[]): this;
    checkout<T extends C>(name: string, path: string, ...middleware: Router.Middleware<T>[]): this;
    merge<T extends C>(path: string, ...middleware: Router.Middleware<T>[]): this;
    merge<T extends C>(name: string, path: string, ...middleware: Router.Middleware<T>[]): this;
    notify<T extends C>(path: string, ...middleware: Router.Middleware<T>[]): this;
    notify<T extends C>(name: string, path: string, ...middleware: Router.Middleware<T>[]): this;
    subscribe<T extends C>(path: string, ...middleware: Router.Middleware<T>[]): this;
    subscribe<T extends C>(name: string, path: string, ...middleware: Router.Middleware<T>[]): this;
    unsubscribe<T extends C>(path: string, ...middleware: Router.Middleware<T>[]): this;
    unsubscribe<T extends C>(name: string, path: string, ...middleware: Router.Middleware<T>[]): this;
    patch<T extends C>(path: string, ...middleware: Router.Middleware<T>[]): this;
    patch<T extends C>(name: string, path: string, ...middleware: Router.Middleware<T>[]): this;
    search<T extends C>(path: string, ...middleware: Router.Middleware<T>[]): this;
    search<T extends C>(name: string, path: string, ...middleware: Router.Middleware<T>[]): this;
    connect<T extends C>(path: string, ...middleware: Router.Middleware<T>[]): this;
    connect<T extends C>(name: string, path: string, ...middleware: Router.Middleware<T>[]): this;
}

declare namespace Router {
    export type Dict <T> = { [key: string]: T; };
    export type Middleware <T> = (context: T, next: () => any) => any;
    export type ParamMiddleware <T> = (parmValue: string, context: T, next: () => any) => any;

    export interface RouterOption {
        prefix?: string;
        methods?: string[];
        sensitive?: boolean;
        strict?: boolean;
    }

    export interface LayerOption {
        name?: string;
        sensitive?: boolean;
        strict?: boolean;
        prefix?: string;
        ignoreCaptures?: boolean;
    }

    export interface Context extends KoaContext {
        matched: any[];
        captures: any;
        params: any;
    }

    export interface AllowedMethodsOption {
        /**
         * throw error instead of setting status and header
         */
        throw?: boolean;
        /**
         * throw the returned value in place of the default NotImplemented error
         */
        notImplemented?: () => any;
        /**
         * throw the returned value in place of the default MethodNotAllowed error
         */
        methodNotAllowed?: () => any;
    }

    export interface MatchedResult {
        path: string[];
        pathAndMethod: Layer[];
        route: boolean;
    }

    export interface KoaRouter {
        /**
         * Create a new router.
         *
         * @example
         *
         * Basic usage:
         *
         * ```javascript
         * var app = require('koa')();
         * var router = require('koa-router')();
         *
         * router.get('/', function (ctx, next) {...});
         *
         * app
         *   .use(router.routes())
         *   .use(router.allowedMethods());
         * ```
         *
         * @alias module:koa-router
         * @param {Object=} opts
         * @param {String=} opts.prefix prefix router paths
         * @constructor
         */
        new <T extends Context>(opts?: RouterOption): Router<T>;
        <T extends Context>(opts?: RouterOption): Router<T>;

        /**
         * Generate URL from url pattern and given `params`.
         *
         * @example
         *
         * ```javascript
         * var url = Router.url('/users/:id', {id: 1});
         * // => "/users/1"
         * ```
         *
         * @param {String} path url pattern
         * @param {Object} params url parameters
         * @returns {String}
         */
        url(path: string, params: Dict<any>): string;
    }
}

declare const Router: Router.KoaRouter;

export = Router;