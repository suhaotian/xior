import express from 'express';
import multer from 'multer';

export async function startServer(port: number) {
  const app = express();
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  (['get', 'post', 'patch', 'put', 'delete', 'head', 'options'] as const).forEach((method) => {
    app[method](`/${method}`, (req, res) => {
      res.send({
        method,
        query: req.query,
        body: req.body,
      });
    });
  });

  [404, 401, 403, 500, 200].forEach((status) => {
    app.get('/' + status, (req, res) => {
      res.status(status).send({ status });
    });
  });

  app.get('/timeout', (req, res) => {
    setTimeout(() => {
      res.end('hi');
    }, 2000);
  });
  app.post('/timeout', (req, res) => {
    setTimeout(() => {
      res.end('hi');
    }, 2000);
  });

  app.get('/headers', (req, res) => {
    res.send({
      headers: {
        'x-custom-header': req.headers['x-custom-header'],
      },
    });
  });
  app.get('/params', (req, res) => {
    res.setHeader(req.query.headerName as string, req.query.headerValue as string).end('ok');
  });
  app.post('/params', (req, res) => {
    res.setHeader(req.body.headerName as string, req.body.headerValue as string).end('ok');
  });

  const upload = multer({ dest: 'uploads/' });
  app.post('/upload', upload.single('file'), (req, res) => {
    res.send({
      file: req.file,
      query: req.query,
      body: req.body,
    });
  });

  app.all('/stream/:chunks', function (req, res, next) {
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked',
    });

    // set default chunks to 10
    let chunks = +(req.params.chunks || 10);

    // max out chunks at 100
    if (chunks > 100) chunks = 100;

    let count = 1;

    while (count <= chunks) {
      res.write(
        JSON.stringify({
          type: 'stream',
          chunk: count++,
        }) + '\n'
      );
    }

    res.end();
    next();
  });

  const close: Function = await new Promise((resolve, reject) => {
    try {
      const handler = app.listen(port, () => {
        resolve(() => {
          handler.close();
        });
      });
    } catch (e) {
      reject(e);
    }
  });
  return close;
}

export function readChunks(reader: ReadableStreamDefaultReader) {
  return {
    async *[Symbol.asyncIterator]() {
      let readResult = await reader.read();
      while (!readResult.done) {
        yield readResult.value;
        readResult = await reader.read();
      }
    },
  };
}
