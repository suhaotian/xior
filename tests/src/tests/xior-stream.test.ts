import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import axios, { XiorResponse as AxiosResponse } from 'xior';
import { Readable } from 'node:stream';

const CHUNK_DELAY = 50;
const TEST_TIMEOUT = 5000;
const LARGE_CHUNK_SIZE = 1024 * 256;
const LARGE_CHUNK_COUNT = 20;

interface StreamTestResult {
  ended: boolean;
  errored: boolean;
  error?: Error;
}

const createServer = (
  handler: (req: http.IncomingMessage, res: http.ServerResponse) => void
): Promise<http.Server> => {
  const server = http.createServer(handler);
  return new Promise((resolve) => {
    server.listen(0, () => resolve(server));
  });
};

const closeServer = (server: http.Server): Promise<void> => {
  return new Promise((resolve) => server.close(() => resolve()));
};

const getServerUrl = (server: http.Server): string => {
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Invalid server address');
  }
  return `http://127.0.0.1:${address.port}`;
};

test.describe('Xior.js Stream Tests', () => {
  test('should read streamed chunks correctly', async () => {
    const chunks = ['Hello', ' ', 'World', '!'];
    const server = await createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      let i = 0;
      const timer = setInterval(() => {
        if (i < chunks.length) {
          res.write(chunks[i++]);
        } else {
          clearInterval(timer);
          res.end();
        }
      }, CHUNK_DELAY);

      req.on('close', () => clearInterval(timer));
    });

    const url = getServerUrl(server);

    try {
      const res: AxiosResponse<Readable> = await axios.get(url, {
        responseType: 'stream',
      });
      const data: string[] = [];

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Test timeout'));
        }, TEST_TIMEOUT);

        res.data.on('data', (chunk: Buffer) => data.push(chunk.toString()));
        res.data.on('end', () => {
          clearTimeout(timeout);
          resolve();
        });
        res.data.on('error', (err: Error) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      assert.strictEqual(data.join(''), 'Hello World!');
    } finally {
      await closeServer(server);
    }
  });

  test('should pipe stream to file', async () => {
    const content = 'Streaming test file content!';
    const server = await createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(content);
    });

    const url = getServerUrl(server);
    const filePath = path.join(process.cwd(), 'test-output-xior.txt');

    try {
      const res: AxiosResponse<Readable> = await axios.get(url, {
        responseType: 'stream',
      });
      const ws = fs.createWriteStream(filePath);

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Test timeout'));
        }, TEST_TIMEOUT);

        res.data.pipe(ws);

        res.data.on('error', (err: Error) => {
          clearTimeout(timeout);
          ws.destroy();
          reject(err);
        });

        ws.on('error', (err: Error) => {
          clearTimeout(timeout);
          res.data.destroy();
          reject(err);
        });

        ws.on('finish', () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      const result = fs.readFileSync(filePath, 'utf8');
      assert.strictEqual(result, content);

      fs.unlinkSync(filePath);
    } finally {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await closeServer(server);
    }
  });

  test('should handle server abort (error event)', async () => {
    const server = await createServer((req, res) => {
      res.writeHead(200);
      res.write('partial');
      setTimeout(() => res.destroy(), 100);
    });

    const url = getServerUrl(server);

    try {
      const res: AxiosResponse<Readable> = await axios.get(url, {
        responseType: 'stream',
      });

      let errorCaught = false;
      let streamEnded = false;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Test timeout - error event not received'));
        }, TEST_TIMEOUT);

        const cleanup = (): void => {
          clearTimeout(timeout);
          res.data.removeAllListeners();
          res.data.destroy();
        };

        res.data.on('error', () => {
          errorCaught = true;
          cleanup();
          resolve();
        });

        res.data.on('end', () => {
          streamEnded = true;
          cleanup();
          resolve();
        });

        res.data.resume();
      });

      assert.ok(errorCaught || streamEnded, 'Stream should error or end');
    } finally {
      await closeServer(server);
    }
  });

  test('should reject on HTTP 404', async () => {
    const server = await createServer((req, res) => {
      res.writeHead(404);
      res.end('Not found');
    });

    const url = getServerUrl(server);

    try {
      await assert.rejects(
        axios.get(url, { responseType: 'stream' }),
        /404/,
        'Axios should throw for 404 response'
      );
    } finally {
      await closeServer(server);
    }
  });

  test('should handle large stream without crash', async () => {
    const chunk = 'x'.repeat(LARGE_CHUNK_SIZE);
    const server = await createServer((req, res) => {
      res.writeHead(200);
      for (let i = 0; i < LARGE_CHUNK_COUNT; i++) {
        res.write(chunk);
      }
      res.end();
    });

    const url = getServerUrl(server);

    try {
      const res: AxiosResponse<Readable> = await axios.get(url, {
        responseType: 'stream',
      });
      let total = 0;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Test timeout'));
        }, TEST_TIMEOUT);

        res.data.on('data', (buf: Buffer) => {
          total += buf.length;
        });

        res.data.on('end', () => {
          clearTimeout(timeout);
          resolve();
        });

        res.data.on('error', (err: Error) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      assert.strictEqual(total, chunk.length * LARGE_CHUNK_COUNT);
    } finally {
      await closeServer(server);
    }
  });

  test('should send custom headers', async () => {
    const server = await createServer((req, res) => {
      assert.strictEqual(req.headers['x-token'], 'abc123');
      res.end('ok');
    });

    const url = getServerUrl(server);

    try {
      const res: AxiosResponse<Readable> = await axios.get(url, {
        responseType: 'stream',
        headers: { 'X-Token': 'abc123' },
      });

      const chunks: string[] = [];
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Test timeout'));
        }, TEST_TIMEOUT);

        res.data.on('data', (c: Buffer) => chunks.push(c.toString()));

        res.data.on('end', () => {
          clearTimeout(timeout);
          resolve();
        });

        res.data.on('error', (err: Error) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      assert.strictEqual(chunks.join(''), 'ok');
    } finally {
      await closeServer(server);
    }
  });

  test('should support AbortController to cancel stream', async () => {
    const server = await createServer((req, res) => {
      res.writeHead(200);
      let i = 0;
      // Send chunks indefinitely until connection closes
      const timer = setInterval(() => {
        if (!res.destroyed && !res.writableEnded) {
          try {
            res.write('chunk' + i++);
          } catch (err) {
            clearInterval(timer);
          }
        }
      }, CHUNK_DELAY);

      req.on('close', () => clearInterval(timer));
      res.on('close', () => clearInterval(timer));
    });

    const url = getServerUrl(server);

    try {
      const controller = new AbortController();
      const res: AxiosResponse<Readable> = await axios.get(url, {
        responseType: 'stream',
        signal: controller.signal,
      });

      let count = 0;
      let abortTriggered = false;

      const result = await new Promise<StreamTestResult>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Test timeout - abort did not cause error'));
        }, TEST_TIMEOUT);

        res.data.on('data', () => {
          if (++count >= 2 && !abortTriggered) {
            abortTriggered = true;
            // Abort immediately on next tick to ensure stream is active
            setImmediate(() => controller.abort());
          }
        });

        res.data.on('end', () => {
          clearTimeout(timeout);
          // If we aborted but stream ended normally, that's unexpected
          if (abortTriggered) {
            reject(new Error('Stream ended normally after abort'));
          } else {
            resolve({ ended: true, errored: false });
          }
        });

        res.data.on('error', (err: Error) => {
          clearTimeout(timeout);
          resolve({ ended: false, errored: true, error: err });
        });
      });

      assert.ok(
        result.errored && result.error && /(abort|cancel)/i.test(result.error.message),
        `Should reject with abort/cancel error, got: ${result.error?.message || 'no error'}`
      );
    } finally {
      await closeServer(server);
    }
  });

  test('should handle empty response', async () => {
    const server = await createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end();
    });

    const url = getServerUrl(server);

    try {
      const res: AxiosResponse<Readable> = await axios.get(url, {
        responseType: 'stream',
      });
      const data: string[] = [];

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Test timeout'));
        }, TEST_TIMEOUT);

        res.data.on('data', (chunk: Buffer) => data.push(chunk.toString()));

        res.data.on('end', () => {
          clearTimeout(timeout);
          resolve();
        });

        res.data.on('error', (err: Error) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      assert.strictEqual(data.join(''), '');
    } finally {
      await closeServer(server);
    }
  });
});
