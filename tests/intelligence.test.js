const test = require('node:test');
const assert = require('node:assert/strict');
const { activityFor, evaluatePromotion } = require('../intelligence.js');

test('personal activity counts own PC growth and newly added open direct partners', () => {
  const rows = [
    { name: 'A', level: 1, pc: 4, gc: 20, services: 8, closed: false },
    { name: 'B', level: 2, pc: 1, gc: 2, services: 1, closed: false },
    { name: 'C', level: 2, pc: 0, gc: 0, services: 0, closed: true },
    { name: 'D', level: 3, pc: 1, gc: 1, services: 1, closed: false }
  ];
  const previous = [
    { name: 'A', level: 1, pc: 3, gc: 18, services: 7, closed: false },
    { name: 'C', level: 2, pc: 0, gc: 0, services: 0, closed: true }
  ];
  const signal = activityFor(rows[0], rows, previous);
  assert.equal(signal.personalCustomerDelta, 1);
  assert.equal(signal.directRecruitments, 1);
  assert.equal(signal.personallyActive, true);
  assert.equal(signal.groupCustomerDelta, 2);
});

test('group and service movement alone does not claim personal activity', () => {
  const current = [{ name: 'A', level: 1, pc: 3, gc: 23, services: 9, closed: false }];
  const previous = [{ name: 'A', level: 1, pc: 3, gc: 20, services: 7, closed: false }];
  const signal = activityFor(current[0], current, previous);
  assert.equal(signal.personallyActive, false);
  assert.equal(signal.structuralChangeOnly, true);
});

test('promotion estimate returns explicit gaps and caveat for personal-leg routes', () => {
  const result = evaluatePromotion({ pc: 6, gc: 12, d: 1 }, 'SQD', [
    { key: 'pc', v: 6, l: 'PC' }, { key: 'gc', v: 12, l: 'GC' }, { key: 'd', v: 2, l: 'D legs' }
  ]);
  assert.equal(result.estimateReady, false);
  assert.deepEqual(result.gaps.map(x => [x.key, x.missing]), [['d', 1]]);
  assert.match(result.warning, /Personal recruitment/);
  assert.equal(result.confidence, 'planning-estimate');
});

test('promotion estimate reports all requirements met without claiming authoritative qualification', () => {
  const result = evaluatePromotion({ pc: 10, gc: 50, qd: 3 }, 'TL', [
    { key: 'pc', v: 10, l: 'PC' }, { key: 'gc', v: 50, l: 'GC' }, { key: 'qd', v: 3, l: 'QD legs' }
  ]);
  assert.equal(result.estimateReady, true);
  assert.equal(result.met, 3);
  assert.match(result.warning, /current UW promotion planner/);
});
