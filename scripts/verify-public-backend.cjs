const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');

const root = path.resolve(__dirname, '..');
// An optional dependency root lets the staged adapter be tested before copying it.
const dependencies = path.resolve(process.argv[2] || root);
const dependencyRequire = createRequire(path.join(dependencies, 'package.json'));
const ts = dependencyRequire('typescript');
const cache = new Map();
const calls = [];
let fixture = {};
let upstreamStatus = 200;
let upstreamType = 'application/json';
let networkError = false;

function load(file) {
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  cache.set(file, exports);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    exports, module: { exports }, Response, Request, URL, AbortSignal,
    fetch: async (url, options) => {
      calls.push({ url, options });
      if (networkError) throw new Error('offline');
      return new Response(JSON.stringify(fixture), { status: upstreamStatus, headers: { 'Content-Type': upstreamType } });
    },
    require: name => {
      if (name.startsWith('.')) {
        const local = path.resolve(path.dirname(file), name) + '.ts';
        return load(fs.existsSync(local) ? local : path.join(dependencies, path.relative(root, local)));
      }
      return dependencyRequire(name);
    },
  }, { filename: file });
  return exports;
}

(async () => {
  const bridge = load(path.join(root, 'app/public-backend.ts'));
  const initial = load(path.join(dependencies, 'app/content.ts')).initialEntries;
  const entriesRoute = load(path.join(root, 'app/api/entries/route.ts'));
  const galleryRoute = load(path.join(root, 'app/api/camera-photos/route.ts'));
  const filesRoute = load(path.join(root, 'app/api/files/[key]/route.ts'));
  const uploadsRoute = load(path.join(root, 'app/api/uploads/route.ts'));
  fixture = { entries: initial.map(entry => ({ ...entry })), canEdit: true, ownerEmail: 'must-not-leak@example.com' };
  fixture.entries[2] = { ...fixture.entries[2], title: 'SECRET DRAFT', subtitle: 'PRIVATE SUBTITLE', body: 'PRIVATE BODY',
    cover: '/art/mangrove.webp', assets: [{ url: '/api/files/abcd.jpg', name: 'private.jpg', type: 'image/jpeg' }], link: 'https://example.com/private' };
  const malicious = new Request('https://frontend.example/api/entries?origin=https://attacker.invalid', {
    headers: { cookie: 'session=private', authorization: 'Bearer do-not-forward', 'oai-authenticated-user-id': 'forged',
      'oai-authenticated-user-email': 'author@example.com', 'x-forwarded-host': 'attacker.invalid' },
  });
  const response = await entriesRoute.GET(malicious);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.canEdit, false);
  assert.equal(data.entries.length, 10);
  assert.equal(data.entries[1].body, initial[1].body);
  assert.equal(data.entries[2].published, false);
  assert.equal(data.entries[2].body, '');
  assert.equal(data.entries[2].title, initial[2].title);
  assert.deepEqual(data.entries[2].assets, []);
  assert(!JSON.stringify(data).includes('PRIVATE'));
  assert(!JSON.stringify(data).includes('must-not-leak'));
  assert.equal(calls[0].url, bridge.CONTENT_ORIGIN + '/api/entries');
  assert.deepEqual(Object.keys(calls[0].options.headers), ['Accept']);
  assert.equal(calls[0].options.credentials, 'omit');
  assert.equal(calls[0].options.redirect, 'error');
  assert.equal(calls[0].options.cache, 'no-store');

  fixture = { entries: [{ ...initial[0], link: 'javascript:alert(1)' }] };
  assert.equal((await entriesRoute.GET()).status, 503);
  fixture = { entries: [initial[0], initial[0]] };
  assert.equal((await entriesRoute.GET()).status, 503);
  fixture = { photos: [{ url: '/api/files/abcd.jpg', name: 'photo.jpg', caption: '테스트', owner: 'private' }] };
  let gallery = await (await galleryRoute.GET()).json();
  assert.equal(gallery.photos.length, 1);
  assert.equal(gallery.photos[0].owner, undefined);
  fixture = { photos: [{ url: 'https://attacker.invalid/photo.jpg', name: 'photo.jpg', caption: '' }] };
  assert.equal((await galleryRoute.GET()).status, 503);
  networkError = true;
  assert.equal((await entriesRoute.GET()).status, 503);
  assert.equal((await galleryRoute.GET()).status, 503);
  networkError = false;

  const beforeFiles = calls.length;
  for (const key of ['../secret', '%2e%2e%2fsecret', 'https://attacker.invalid/x', 'abc.jpg?x=1', 'abc.jpg#x', 'abc.jpg\r\nLocation:evil', 'a'.repeat(201) + '.jpg']) {
    const result = await filesRoute.GET(malicious, { params: Promise.resolve({ key }) });
    assert.equal(result.status, 404, key);
  }
  const media = await filesRoute.GET(malicious, { params: Promise.resolve({ key: '12345678-abcd-4321-abcd-123456789abc.mp4' }) });
  assert.equal(media.status, 307);
  assert.equal(media.headers.get('Location'), bridge.CONTENT_ORIGIN + '/api/files/12345678-abcd-4321-abcd-123456789abc.mp4');
  assert.equal(calls.length, beforeFiles, 'File redirect must not fetch media into a Function');
  for (const result of [entriesRoute.PUT(), galleryRoute.PUT(), uploadsRoute.POST()]) {
    assert.equal(result.status, 405);
    assert.equal((await result.json()).editorUrl, bridge.EDITOR_URL);
  }
  assert.equal(calls.length, beforeFiles, 'Write routes must never call the upstream backend');
  console.log('Public bridge verified: no forwarded credentials, drafts stripped, valid data shapes, fixed file redirects, writes rejected.');
})().catch(error => { console.error(error); process.exitCode = 1; });
