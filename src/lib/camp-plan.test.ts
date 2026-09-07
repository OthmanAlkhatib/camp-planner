import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateProgramTotals,
  createCustomBlock,
  createDefaultCampPlan,
  parseCampPlanFile,
  safePlanFilename,
  serializeCampPlan,
} from './camp-plan';

test('default guide contains the four planning stages and balanced-total calculation', () => {
  const plan = createDefaultCampPlan();
  plan.program.categories[0].percentage = 40;
  plan.program.categories[1].percentage = 60;
  plan.program.categories[0].hours = 4;
  plan.program.categories[1].hours = 6;

  assert.deepEqual(calculateProgramTotals(plan), { percentage: 100, hours: 10 });
  assert.equal(plan.beforeCamp.programChecklist.length, 6);
  assert.equal(plan.duringCamp.executionChecklist.length, 6);
  assert.equal(plan.afterCamp.closureChecklist.length, 4);
});

test('editable file serialization round-trips without losing Arabic content', () => {
  const plan = createDefaultCampPlan();
  plan.identity.campName = 'مخيم الهمة';
  plan.identity.mainGoal = 'بناء روح الفريق';
  plan.customBlocks.push(createCustomBlock('table', 'custom-1'));

  assert.deepEqual(parseCampPlanFile(serializeCampPlan(plan)), plan);
});

test('import fails closed on unknown fields and unsupported versions', () => {
  const plan = createDefaultCampPlan();
  assert.throws(
    () => parseCampPlanFile(JSON.stringify({ ...plan, unexpectedAuthority: true })),
    /صيغة الخطة غير معروفة/,
  );
  assert.throws(
    () => parseCampPlanFile(JSON.stringify({ ...plan, schemaVersion: 2 })),
    /صيغة الخطة غير معروفة/,
  );
});

test('custom blocks are deterministic and filenames are safe', () => {
  assert.deepEqual(createCustomBlock('heading', 'block-7'), {
    id: 'block-7',
    type: 'heading',
    title: 'عنوان جديد',
    content: '',
    color: 'gold',
  });
  assert.equal(safePlanFilename(' مخيم: صيف / 2026? ', 'docx'), 'مخيم-صيف-2026.docx');
});
