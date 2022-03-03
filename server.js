/* eslint-disable no-useless-return */
/* eslint-disable consistent-return */
/* eslint-disable no-return-await */
const tickets = [
  {
    id: '1',
    name: 'Задача',
    description: 'полное описание задачи',
    status: 'false',
    created: '2017-02-03 12:13',
  },
  {
    id: '2',
    name: 'Задача 2',
    description: 'полное описание задачи 2',
    status: 'true',
    created: '2020-02-03 12:13',
  },
  {
    id: '3',
    name: 'Задача 3',
    description: 'полное описание задачи 3',
    status: 'false',
    created: '2021-23-03 12:13',
  },
];

const http = require('http');
const Koa = require('koa');
const koaBody = require('koa-body');
const uuid = require('uuid');
const moment = require('moment');
const cors = require('@koa/cors');

moment.locale('ru');

const app = new Koa();

// test push ticket
tickets.push({
  id: uuid.v4(),
  name: 'Задача 5',
  description: 'полное описание задачи 5',
  status: 'false',
  created: `${moment().format('L')} ${moment().format('LT')}`,
});
tickets.push({
  id: uuid.v4(),
  name: 'Задача 6',
  description: 'полное описание задачи 6',
  status: 'false',
  created: `${moment().format('L')} ${moment().format('LT')}`,
});
tickets.push({
  id: uuid.v4(),
  name: 'Задача 32',
  description: 'полное описание задачи 32',
  status: 'false',
  created: `${moment().format('L')} ${moment().format('LT')}`,
});

// koaBody
app.use(
  koaBody({
    urlencoded: true,
    multipart: true,
    json: true,
    text: true,
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

// response

app.use(async (ctx) => {
  const { method, id: reqId } = ctx.request.query;
  const { name: reqName, description: reqDescription } = ctx.request.body;

  switch (method) {
    case 'allTickets':
      ctx.response.body = JSON.stringify(
        tickets.map(({
          id, name, status, created,
        }) => ({
          id,
          name,
          status,
          created,
        })),
      );
      return;

    case 'ticketById':
      if (reqId) {
        ctx.response.body = JSON.stringify(
          tickets.find(({ id }) => id === reqId),
        );
      } else {
        ctx.response.status = 404;
      }
      return;

    case 'createTicket':
      // eslint-disable-next-line no-case-declarations
      const newTicket = {
        id: uuid.v4(),
        name: reqName,
        description: reqDescription,
        status: 'false',
        created: `${moment().format('L')} ${moment().format('LT')}`,
      };
      tickets.push(newTicket);

      ctx.response.body = JSON.stringify([newTicket]);
      return;

    case 'editTicket':
      // eslint-disable-next-line no-case-declarations
      const index = tickets.find(({ id }) => id === reqId);

      index.name = reqName;
      index.description = reqDescription;
      ctx.response.body = JSON.stringify(index);

      return;

    case 'deleteTicket':
      // eslint-disable-next-line no-case-declarations
      const ind = tickets.findIndex(({ id }) => id === reqId);

      tickets.splice(ind, 1);
      ctx.response.body = JSON.stringify(true);
      return;

    case 'ticketStatus':
      // eslint-disable-next-line no-case-declarations
      const statusTic = tickets.find(({ id }) => id === reqId);
      statusTic.status = true;
      ctx.response.body = JSON.stringify(statusTic);

      return;

    default:
      ctx.response.status = 404;
      return;
  }
});

// Server
const port = process.env.PORT || 7070;
http.createServer(app.callback()).listen(port);
