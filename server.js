/* eslint-disable consistent-return */
/* eslint-disable no-return-await */

const http = require('http');
const Koa = require('koa');
const koaBody = require('koa-body');
const uuid = require('uuid');
const moment = require('moment');
const cors = require('@koa/cors');
// const Router = require('koa-router');
const WS = require('ws');

moment.locale('ru');

const app = new Koa();
// const router = new Router();

const clients = [];

// koaBody
app.use(
  koaBody({
    urlencoded: true,
    multipart: true,
    json: true,
  }),
);

// CORS
app.use(cors());
app.use(async (ctx, next) => {
  const origin = ctx.request.get('Origin');
  if (!origin) return await next();

  const headers = { 'Access-Control-Allow-Origin': '*' };

  if (ctx.request.method !== 'OPTIONS') {
    ctx.response.set({ ...headers });
    try {
      return await next();
    } catch (error) {
      error.headers = { ...error.headers, ...headers };
      throw error;
    }
  }

  if (ctx.request.get('Access-Control-Request-Method')) {
    ctx.response.set({
      ...headers,
      'Access-Control-Request-Method': 'GET, POST, PUT, DELETE, PATCH',
    });

    if (ctx.request.get('Access-Control-Request-Headers')) {
      ctx.response.set(
        'Access-Control-Request-Headers',
        ctx.request.get('Access-Control-Request-Headers'),
      );
    }

    ctx.response.status = 204; // No content
  }
});

// Server
const port = process.env.PORT || 7070;
const server = http.createServer(app.callback());
const wsServer = new WS.Server({ server });

wsServer.on('connection', (ws) => {
  const client = {};
  client.id = uuid.v4();

  ws.on('message', (msg) => {
    const messageParse = JSON.parse(msg);

    if (messageParse.type === 'newUser') {
      const newUser = clients.findIndex((val) => val.name === messageParse.name);
      if (newUser !== -1) {
        ws.send(JSON.stringify({ type: 'error name' }));
      } else {
        client.name = messageParse.name;
        clients.push(client);
        [...wsServer.clients]
          .filter((val) => val.readyState === WS.OPEN)
          .forEach((val) => val.send(JSON.stringify({ clients: [...clients], type: 'true name' })));
      }
    }
    // Array.from(wsServer.clients)
    //   .filter((o) => o.readyState === WS.OPEN)
    //   .forEach((o) => o.send(JSON.stringify(messageParse)));
  });

  ws.on('close', () => {
    const indexArr = clients.findIndex((item) => item.id === client.id);
    clients.splice(indexArr, 1);
    // if (client.name !== null) {
    //   wsServer.clients.forEach((item) =>
    //     item.send(
    //       JSON.stringify({
    //         type: 'user disconected',
    //         name: client.name,
    //         data: clients,
    //       })
    //     )
    //   );
    // }
  });
});

server.listen(port);
