import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import zlib from 'node:zlib';
import axios, { AxiosResponse } from 'axios';

const CHUNK_DELAY = 50;
const TEST_TIMEOUT = 10000;
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
  return new Promise((resolve) => {
    server.closeAllConnections?.();
    server.close(() => resolve());
  });
};

const getServerUrl = (server: http.Server): string => {
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Invalid server address');
  }
  return `http://127.0.0.1:${address.port}`;
};

test.describe('Axios Stream Tests', () => {
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
    const filePath = path.join(process.cwd(), 'test-output.txt');

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
        (err: any) => {
          return err.response?.status === 404;
        },
        'Axios should throw for 404 response'
      );
    } finally {
      await closeServer(server);
    }
  });

  test('should reject on HTTP 500', async () => {
    const server = await createServer((req, res) => {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    });

    const url = getServerUrl(server);

    try {
      await assert.rejects(
        axios.get(url, {
          responseType: 'stream',
          validateStatus: (status) => status < 400,
        }),
        (err: any) => {
          return err.response?.status === 500;
        },
        'Axios should throw for 500 response'
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
            setImmediate(() => controller.abort());
          }
        });

        res.data.on('end', () => {
          clearTimeout(timeout);
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

  test('should handle pause and resume with backpressure', async () => {
    const chunkSize = 1024 * 64; // 64KB chunks
    const totalChunks = 10;
    const server = await createServer((req, res) => {
      res.writeHead(200);
      let i = 0;

      const sendChunk = () => {
        if (i < totalChunks) {
          const canContinue = res.write('x'.repeat(chunkSize));
          i++;

          if (canContinue) {
            setImmediate(sendChunk);
          } else {
            res.once('drain', sendChunk);
          }
        } else {
          res.end();
        }
      };

      sendChunk();
      req.on('close', () => res.destroy());
    });

    const url = getServerUrl(server);

    try {
      const res: AxiosResponse<Readable> = await axios.get(url, {
        responseType: 'stream',
      });
      let receivedBytes = 0;
      let pauseTime = 0;
      let resumeTime = 0;
      let wasPaused = false;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Test timeout'));
        }, TEST_TIMEOUT);

        res.data.on('data', (chunk: Buffer) => {
          receivedBytes += chunk.length;

          // Pause after receiving ~3 chunks worth
          if (receivedBytes > chunkSize * 3 && !wasPaused) {
            wasPaused = true;
            pauseTime = Date.now();
            res.data.pause();

            setTimeout(() => {
              resumeTime = Date.now();
              res.data.resume();
            }, 300);
          }
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

      assert.strictEqual(receivedBytes, chunkSize * totalChunks);
      assert.ok(wasPaused, 'Stream should have been paused');
      assert.ok(resumeTime - pauseTime >= 250, 'Stream should have been paused for at least 250ms');
    } finally {
      await closeServer(server);
    }
  });

  test('should handle multiple concurrent streams', async () => {
    let activeConnections = 0;
    let maxConcurrent = 0;

    const server = await createServer((req, res) => {
      activeConnections++;
      maxConcurrent = Math.max(maxConcurrent, activeConnections);

      const id = req.url?.slice(1) || '0';
      res.writeHead(200);

      // Simulate some processing time
      setTimeout(() => {
        res.end(`Response for ${id}`);
        activeConnections--;
      }, 100);
    });

    const url = getServerUrl(server);

    try {
      const promises = [1, 2, 3, 4, 5].map(async (id) => {
        const res: AxiosResponse<Readable> = await axios.get(`${url}/${id}`, {
          responseType: 'stream',
        });
        const chunks: string[] = [];

        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Test timeout'));
          }, TEST_TIMEOUT);

          res.data.on('data', (chunk: Buffer) => chunks.push(chunk.toString()));
          res.data.on('end', () => {
            clearTimeout(timeout);
            resolve();
          });
          res.data.on('error', (err: Error) => {
            clearTimeout(timeout);
            reject(err);
          });
        });

        return { id, content: chunks.join('') };
      });

      const results = await Promise.all(promises);

      results.forEach(({ id, content }) => {
        assert.strictEqual(content, `Response for ${id}`);
      });

      assert.ok(
        maxConcurrent >= 3,
        `Should have handled concurrent requests, got ${maxConcurrent}`
      );
    } finally {
      await closeServer(server);
    }
  });

  test('should handle gzip compressed response', async () => {
    const content = 'This is compressed content that should be decoded! '.repeat(50);
    const compressed = zlib.gzipSync(content);

    const server = await createServer((req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Content-Encoding': 'gzip',
      });
      res.end(compressed);
    });

    const url = getServerUrl(server);

    try {
      const res: AxiosResponse<Readable> = await axios.get(url, {
        responseType: 'stream',
        decompress: true,
      });
      const chunks: string[] = [];

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Test timeout'));
        }, TEST_TIMEOUT);

        res.data.on('data', (chunk: Buffer) => chunks.push(chunk.toString()));
        res.data.on('end', () => {
          clearTimeout(timeout);
          resolve();
        });
        res.data.on('error', (err: Error) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      assert.strictEqual(chunks.join(''), content);
    } finally {
      await closeServer(server);
    }
  });

  test('should handle HTTP redirect and verify redirect occurred', async () => {
    let redirectHit = false;
    let targetHit = false;

    const server = await createServer((req, res) => {
      if (req.url === '/redirect') {
        redirectHit = true;
        res.writeHead(302, { Location: '/target' });
        res.end();
      } else if (req.url === '/target') {
        targetHit = true;
        res.writeHead(200);
        res.end('Redirected content');
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    const url = getServerUrl(server);

    try {
      const res: AxiosResponse<Readable> = await axios.get(`${url}/redirect`, {
        responseType: 'stream',
        maxRedirects: 5,
      });
      const chunks: string[] = [];

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Test timeout'));
        }, TEST_TIMEOUT);

        res.data.on('data', (chunk: Buffer) => chunks.push(chunk.toString()));
        res.data.on('end', () => {
          clearTimeout(timeout);
          resolve();
        });
        res.data.on('error', (err: Error) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      assert.strictEqual(chunks.join(''), 'Redirected content');
      assert.ok(redirectHit, 'Redirect endpoint should have been hit');
      assert.ok(targetHit, 'Target endpoint should have been hit');
    } finally {
      await closeServer(server);
    }
  });

  test('should expose response headers and status', async () => {
    const server = await createServer((req, res) => {
      const body = '{"ok": true}';
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'test-value',
        'Content-Length': Buffer.byteLength(body).toString(), // fix length
      });
      res.end(body);
    });

    const url = getServerUrl(server);

    try {
      const res: AxiosResponse<NodeJS.ReadableStream> = await axios.get(url, {
        responseType: 'stream',
      });

      // Verify headers and status before consuming stream
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['content-type'], 'application/json');
      assert.strictEqual(res.headers['x-custom-header'], 'test-value');
      assert.strictEqual(res.headers['content-length'], '12');

      const chunks: Buffer[] = [];

      const streamPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Test timeout')), TEST_TIMEOUT);

        res.data.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.data.on('end', () => {
          clearTimeout(timeout);
          resolve();
        });
        res.data.on('error', (err: Error) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      await streamPromise;

      const body = Buffer.concat(chunks as any).toString();
      assert.strictEqual(body, '{"ok": true}');
    } finally {
      await closeServer(server);
    }
  });

  test('should handle stream destroy and stop receiving data', async () => {
    let chunksSent = 0;
    const server = await createServer((req, res) => {
      res.writeHead(200);

      const timer = setInterval(() => {
        if (!res.destroyed) {
          try {
            res.write(`chunk${chunksSent++}`);
          } catch (err) {
            clearInterval(timer);
          }
        } else {
          clearInterval(timer);
        }
      }, CHUNK_DELAY);

      req.on('close', () => clearInterval(timer));
    });

    const url = getServerUrl(server);

    try {
      const res: AxiosResponse<Readable> = await axios.get(url, {
        responseType: 'stream',
      });

      let chunksReceived = 0;
      let destroyed = false;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Test timeout'));
        }, TEST_TIMEOUT);

        res.data.on('data', () => {
          chunksReceived++;
          if (chunksReceived === 3) {
            destroyed = true;
            res.data.destroy();
          }
        });

        res.data.on('close', () => {
          clearTimeout(timeout);
          // Give server a moment to potentially send more
          setTimeout(() => resolve(), 200);
        });

        res.data.on('error', () => {
          clearTimeout(timeout);
          setTimeout(() => resolve(), 200);
        });
      });

      assert.ok(destroyed, 'Stream should have been destroyed');
      assert.ok(
        chunksReceived <= 5,
        `Should have stopped receiving data, got ${chunksReceived} chunks`
      );
    } finally {
      await closeServer(server);
    }
  });

  test('should handle connection refused error', async () => {
    // Use a port that's very unlikely to be in use
    const unusedPort = 59999;

    await assert.rejects(
      axios.get(`http://127.0.0.1:${unusedPort}`, {
        responseType: 'stream',
        timeout: 2000,
      }),
      (err: any) => {
        return err.code === 'ECONNREFUSED';
      },
      'Should reject with ECONNREFUSED error'
    );
  });

  test('should handle request timeout', async () => {
    const server = await createServer((req, res) => {
      // Don't respond - let it timeout
      req.on('close', () => {
        res.destroy();
      });
    });

    const url = getServerUrl(server);

    try {
      await assert.rejects(
        axios.get(url, {
          responseType: 'stream',
          timeout: 500,
        }),
        (err: any) => {
          return err.code === 'ECONNABORTED' || err.message.includes('timeout');
        },
        'Should timeout with ECONNABORTED'
      );
    } finally {
      await closeServer(server);
    }
  });

  test('should handle POST with streaming response', async () => {
    const server = await createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        const parsed = JSON.parse(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ received: parsed.message, length: parsed.message.length }));
      });
    });

    const url = getServerUrl(server);
    const testMessage = 'test message for POST';

    try {
      const res: AxiosResponse<Readable> = await axios.post(
        url,
        { message: testMessage },
        { responseType: 'stream' }
      );

      const chunks: string[] = [];
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Test timeout'));
        }, TEST_TIMEOUT);

        res.data.on('data', (chunk: Buffer) => chunks.push(chunk.toString()));
        res.data.on('end', () => {
          clearTimeout(timeout);
          resolve();
        });
        res.data.on('error', (err: Error) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      const response = JSON.parse(chunks.join(''));
      assert.strictEqual(response.received, testMessage);
      assert.strictEqual(response.length, testMessage.length);
    } finally {
      await closeServer(server);
    }
  });

  test('should handle very slow server (slow drip)', async () => {
    const server = await createServer((req, res) => {
      res.writeHead(200);
      let count = 0;

      const timer = setInterval(() => {
        if (count < 5) {
          res.write('x');
          count++;
        } else {
          clearInterval(timer);
          res.end();
        }
      }, 200); // Very slow - 200ms between bytes

      req.on('close', () => clearInterval(timer));
    });

    const url = getServerUrl(server);

    try {
      const startTime = Date.now();
      const res: AxiosResponse<Readable> = await axios.get(url, {
        responseType: 'stream',
        timeout: 3000, // Should be enough for slow drip
      });

      let received = '';
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Test timeout'));
        }, TEST_TIMEOUT);

        res.data.on('data', (chunk: Buffer) => {
          received += chunk.toString();
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

      const elapsed = Date.now() - startTime;
      assert.strictEqual(received, 'xxxxx');
      assert.ok(elapsed >= 800, `Should take at least 800ms for slow drip, took ${elapsed}ms`);
    } finally {
      await closeServer(server);
    }
  });

  test('should handle partial content (206 range request)', async () => {
    const fullContent = 'abcdefghijklmnopqrstuvwxyz';

    const server = await createServer((req, res) => {
      const rangeHeader = req.headers.range;

      if (rangeHeader) {
        const match = rangeHeader.match(/bytes=(\d+)-(\d+)?/);
        if (match) {
          const start = parseInt(match[1]);
          const end = match[2] ? parseInt(match[2]) : fullContent.length - 1;
          const chunk = fullContent.slice(start, end + 1);

          res.writeHead(206, {
            'Content-Type': 'text/plain',
            'Content-Range': `bytes ${start}-${end}/${fullContent.length}`,
            'Content-Length': chunk.length.toString(),
          });
          res.end(chunk);
        } else {
          res.writeHead(400);
          res.end('Invalid range');
        }
      } else {
        res.writeHead(200);
        res.end(fullContent);
      }
    });

    const url = getServerUrl(server);

    try {
      const res: AxiosResponse<Readable> = await axios.get(url, {
        responseType: 'stream',
        headers: { Range: 'bytes=5-15' },
      });

      assert.strictEqual(res.status, 206);
      assert.ok(res.headers['content-range']);

      const chunks: string[] = [];
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Test timeout'));
        }, TEST_TIMEOUT);

        res.data.on('data', (chunk: Buffer) => chunks.push(chunk.toString()));
        res.data.on('end', () => {
          clearTimeout(timeout);
          resolve();
        });
        res.data.on('error', (err: Error) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      assert.strictEqual(chunks.join(''), 'fghijklmnop');
    } finally {
      await closeServer(server);
    }
  });
});
