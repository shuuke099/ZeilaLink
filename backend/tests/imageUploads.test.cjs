const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const sharp = require('sharp');
const express = require('express');
const { normalizeImage, MAX_IMAGE_OUTPUT_BYTES } = require('../src/utils/normalizeImage');

const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zeilalink-image-test-'));
process.env.NODE_ENV = 'test';
process.env.STORAGE_PROVIDER = 'local';
process.env.UPLOADS_ROOT = temporaryRoot;
const storage = require('../src/config/aws');
let server;
let origin;

before(async () => {
  const app = express();
  // Test authentication fixture; production continues to use authenticate.
  app.post('/image', (req, res) => {
    req.user = { id: 'image-test-owner' };
    storage.publicImageUpload.single('file')(req, res, async (error) => {
      if (error) return res.status(error.status || 400).json({ error: error.code || error.message });
      const key = storage.getUploadKey(req, req.file);
      try {
        const valid = await storage.validateStoredFile(req.file.path, 'public-image', req.file.mimetype, req.body.imagePreset || 'listing');
        if (!valid) throw Object.assign(new Error('Invalid content'), { status: 400 });
        const bytes = await fs.promises.readFile(req.file.path);
        const metadata = await sharp(bytes).metadata();
        res.json({ key, bytes: bytes.length, format: metadata.format, width: metadata.width, height: metadata.height });
      } catch (error) {
        await storage.removeStoredUpload(key);
        res.status(error.status || 500).json({ error: error.message });
      }
    });
  });
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  const resolved = path.resolve(temporaryRoot);
  assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
  assert.ok(path.basename(resolved).startsWith('zeilalink-image-test-'));
  await fs.promises.rm(resolved, { recursive: true, force: true });
});

test('large landscape and small portrait originals produce the same listing dimensions', async () => {
  for (const [width, height, format] of [[3600, 2400, 'jpeg'], [60, 140, 'png'], [1000, 1000, 'webp']]) {
    const input = await sharp({ create: { width, height, channels: 3, background: '#ff0000' } }).toFormat(format).toBuffer();
    const output = await normalizeImage(input);
    const metadata = await sharp(output).metadata();
    assert.deepEqual([metadata.width, metadata.height, metadata.format], [1200, 800, 'webp']);
    assert.ok(output.length <= MAX_IMAGE_OUTPUT_BYTES);
  }
});

test('portrait is padded without stretching; square logos retain transparent padding', async () => {
  const input = await sharp({ create: { width: 100, height: 200, channels: 3, background: '#ff0000' } }).png().toBuffer();
  const listing = await normalizeImage(input);
  const { data, info } = await sharp(listing).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const sample = (x, y) => [...data.subarray((y * info.width + x) * 3, (y * info.width + x) * 3 + 3)];
  assert.ok(sample(100, 400).every((channel) => channel > 245));
  assert.ok(sample(600, 400)[0] > 245 && sample(600, 400)[1] < 10);
  const square = await normalizeImage(input, 'square');
  const metadata = await sharp(square).metadata();
  assert.deepEqual([metadata.width, metadata.height, metadata.hasAlpha], [512, 512, true]);
});

test('applies phone orientation and removes EXIF metadata', async () => {
  const input = await sharp({ create: { width: 100, height: 200, channels: 3, background: '#ff0000' } }).jpeg().withMetadata({ orientation: 6 }).toBuffer();
  const output = await normalizeImage(input);
  const metadata = await sharp(output).metadata();
  assert.equal(metadata.orientation, undefined);
  assert.equal(metadata.exif, undefined);
  const { data } = await sharp(output).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  // After orientation, this is a landscape image occupying the full canvas width.
  assert.ok(data[(400 * 1200 + 100) * 3] > 245);
  assert.ok(data[(400 * 1200 + 100) * 3 + 1] < 10);
});

test('rejects corrupt images, oversized originals, and excessive pixel dimensions', async () => {
  await assert.rejects(normalizeImage(Buffer.from('not an image')), { status: 400 });
  await assert.rejects(normalizeImage(Buffer.alloc(20 * 1024 * 1024 + 1)), { status: 400 });
  const huge = await sharp({ create: { width: 7000, height: 6000, channels: 3, background: '#fff' } }).png().toBuffer();
  await assert.rejects(normalizeImage(huge), { status: 400 });
});

async function upload(buffer, type = 'image/png', preset = 'listing') {
  const data = new FormData();
  data.append('imagePreset', preset);
  data.append('file', new Blob([buffer], { type }), type === 'image/png' ? 'test.png' : 'test.jpg');
  const response = await fetch(`${origin}/image`, { method: 'POST', body: data });
  return { status: response.status, body: await response.json() };
}

test('six concurrent large gallery uploads are resized before quota accounting', async () => {
  const original = await sharp(randomBytes(2200 * 1800 * 3), { raw: { width: 2200, height: 1800, channels: 3 } }).png().toBuffer();
  assert.ok(original.length > 5 * 1024 * 1024);
  const results = await Promise.all(Array.from({ length: 6 }, () => upload(original)));
  for (const result of results) {
    assert.equal(result.status, 200, JSON.stringify(result.body));
    assert.match(result.body.key, /\.webp$/);
    assert.deepEqual([result.body.width, result.body.height, result.body.format], [1200, 800, 'webp']);
    assert.ok(result.body.bytes <= MAX_IMAGE_OUTPUT_BYTES);
  }
});

test('square upload preset is stored as a 512px WEBP; invalid content is removed', async () => {
  const image = await sharp({ create: { width: 90, height: 40, channels: 3, background: '#008800' } }).png().toBuffer();
  const result = await upload(image, 'image/png', 'square');
  assert.equal(result.status, 200);
  assert.deepEqual([result.body.width, result.body.height], [512, 512]);
  const invalid = await upload(Buffer.from('not an image'));
  assert.equal(invalid.status, 400);
  const saved = await fs.promises.readdir(path.join(temporaryRoot, 'public/users/image-test-owner'));
  assert.equal(saved.length, 7);
});

test('private PDFs keep their original bytes', async () => {
  const key = 'private/documents/image-test-owner/document.pdf';
  const file = storage.localPathForUploadKey(key);
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  const pdf = Buffer.from('%PDF-1.4\n%%EOF');
  await fs.promises.writeFile(file, pdf);
  assert.equal(await storage.validateStoredFile(file, 'private-document'), true);
  assert.deepEqual(await fs.promises.readFile(file), pdf);
});

test('normalization does not bypass the per-user public file quota', async () => {
  const directory = path.join(temporaryRoot, 'public/users/image-test-owner');
  const files = await fs.promises.readdir(directory);
  const sample = await fs.promises.readFile(path.join(directory, files[0]));
  for (let index = files.length; index < 25; index++) {
    await fs.promises.writeFile(path.join(directory, `quota-${index}.webp`), sample);
  }
  const original = await sharp({ create: { width: 20, height: 20, channels: 3, background: '#888' } }).png().toBuffer();
  const result = await upload(original);
  assert.equal(result.status, 413);
  assert.match(result.body.error, /quota/i);
  assert.equal((await fs.promises.readdir(directory)).length, 25);
});
