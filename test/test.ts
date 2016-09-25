/// <reference path="../out/lib/router.d.ts" />
import * as http from 'http';
import test = require('blue-tape');
import Router = require('koa-router');
import * as Koa from 'koa';

test('simple test', async (t) => {
    interface User {
        name: string;
    }
    interface UserContext extends Router.Context {
        user?: User;
    }

    t.plan(2);
    const app = new Koa();
    const router = Router<UserContext>();

    router
        .param('user', (id, ctx, next) => {
            ctx.user = { name: 'jkey' };
            if (!id) {
                return ctx.status = 404;
            } else {
                return next();
            }
        })
        .get('/users/:user', ctx => {
            ctx.body = ctx.user;
        });

    app.use(router.routes()).use(router.allowedMethods());
    const server = app.listen();

    await new Promise(resolve => server.on('listening', resolve));

    let url = `http://localhost:${server.address().port}/users/4`;
    let res: http.IncomingMessage;
    try {
        res = await new Promise<http.IncomingMessage>((resolve, reject) => {
            http.get(url, resolve).on('error', reject);
        });
    } catch(e) {
        t.fail(e);
        process.exit();
    }

    t.equal(res.statusCode, 200);

    let str: string;
    try {
        str = await new Promise<string>((resolve, reject) => {
            let result = '';
            res.on('data', chunk => result += chunk)
                .on('end', () => resolve(result))
                .on('error', reject);
        });
    } catch (e) {
        t.fail(e);
        process.exit();
    }

    let data: User;
    try {
        data = JSON.parse(str);
    } catch(e) {
        t.fail(e);
        process.exit();
    }

    t.isEquivalent(data, { name: 'jkey' });
    t.end();
    process.exit();
});
