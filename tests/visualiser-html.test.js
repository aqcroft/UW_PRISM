const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('visualiser inline script parses and references release/intelligence assets', () => {
  const html = fs.readFileSync(require.resolve('../visualiser.html'), 'utf8');
  const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)];
  assert.ok(inline.length, 'expected inline visualiser application script');
  inline.forEach((script, index) => new vm.Script(script[1], { filename: `visualiser-inline-${index}.js` }));
  assert.match(html, /src="version\.js"/);
  assert.match(html, /src="intelligence\.js"/);
  assert.match(html, /urlParams\.get\('demo'\)\s*===\s*'1'/);
});
