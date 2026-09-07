export const CAMP_PLAN_SCHEMA_VERSION = 1 as const;
export const CAMP_PLAN_STORAGE_KEY = 'camp-planner:draft:v1';

export const blockColors = [
  { value: 'green', label: 'أخضر' },
  { value: 'gold', label: 'ذهبي' },
  { value: 'blue', label: 'أزرق' },
  { value: 'rose', label: 'وردي' },
  { value: 'neutral', label: 'حيادي' },
] as const;

export type BlockColor = (typeof blockColors)[number]['value'];

export interface CampIdentity {
  campName: string;
  targetGroup: string;
  dateAndPlace: string;
  coordinator: string;
  mainGoal: string;
}

export interface ProgramCategory {
  id: string;
  label: string;
  examples: string;
  percentage: number;
  hours: number;
  color: BlockColor;
}

export interface ChecklistItem {
  id: string;
  evidence: string;
  successCondition: string;
  checked: boolean;
}

export interface MetricRow {
  id: string;
  indicator: string;
  target: string;
  result: string;
  decision: string;
}

export interface ImprovementRow {
  id: string;
  improvement: string;
  owner: string;
  dueDate: string;
}

export interface CustomTextBlock {
  id: string;
  type: 'heading' | 'text';
  title: string;
  content: string;
  color: BlockColor;
}

export interface CustomTableBlock {
  id: string;
  type: 'table';
  title: string;
  color: BlockColor;
  columns: string[];
  rows: string[][];
}

export type CustomBlock = CustomTextBlock | CustomTableBlock;

export interface CampPlan {
  schemaVersion: typeof CAMP_PLAN_SCHEMA_VERSION;
  identity: CampIdentity;
  program: {
    categories: ProgramCategory[];
    sleepHoursPerNight: number;
    mealGapMinutes: number;
    transitionMinutes: number;
    totalProgramHours: number;
  };
  beforeCamp: {
    programChecklist: ChecklistItem[];
    readinessChecklist: ChecklistItem[];
    launchDecision: 'UNDECIDED' | 'READY' | 'NOT_READY';
    launchNotes: string;
  };
  duringCamp: {
    executionChecklist: ChecklistItem[];
    metrics: MetricRow[];
    keep: string;
    shorten: string;
    remove: string;
  };
  afterCamp: {
    outcomeMetrics: MetricRow[];
    closureChecklist: ChecklistItem[];
    improvements: ImprovementRow[];
    biggestSuccess: string;
    biggestObstacle: string;
    nextCampDate: string;
  };
  customBlocks: CustomBlock[];
}

const programChecklist: ChecklistItem[] = [
  ['بطاقة الهدف', 'الفئة المستهدفة والهدف النهائي مكتوبان بوضوح.'],
  ['قائمة المشاركين والبرامج', 'فئة الصغار منفصلة بالكامل عن الكبار إن وجدت.'],
  ['الجدول النهائي', 'لكل فقرة أساسية هدف ومسؤول ووقت بداية ونهاية.'],
  ['ورقة الأسئلة', 'مواضع التدبر وأسئلة الأنشطة القبلية المباشرة جاهزة.'],
  ['فقرات البرنامج', 'التعارف والمشاريع والمهارة العملية ظاهرة في الجدول.'],
  ['الحد الزمني', 'الجدول لا يحتوي فراغًا غير مسمى أطول من الحد المتفق عليه.'],
].map(([evidence, successCondition], index) => ({
  id: `program-${index + 1}`,
  evidence,
  successCondition,
  checked: false,
}));

const readinessChecklist: ChecklistItem[] = [
  ['نسخة مطبوعة + رسالة', 'الجدول معلق في الموقع ومرسل للمشاركين.'],
  ['تأكيد الاستلام', 'المشايخ والميسرون استلموا الهدف والجمهور والزمن.'],
  ['القيم في الجدول', 'النوم المتصل والفاصل بعد الطعام محميان في الجدول.'],
  ['قائمة المشتريات', 'السناك والماء والقهوة لها كميات ومسؤول.'],
  ['قائمة المكان مكتملة', 'المكان والأدوات والصوت والعرض والمبيت فُحصت.'],
  ['نسبة أدوار المشاركين', 'نسبة المشاركين الذين سيؤدون دورًا عمليًا محددة.'],
].map(([evidence, successCondition], index) => ({
  id: `readiness-${index + 1}`,
  evidence,
  successCondition,
  checked: false,
}));

const executionChecklist: ChecklistItem[] = [
  ['تأكيد مسؤول الافتتاح', 'الجدول والهدف وقواعد النوم شُرحت في الافتتاح.'],
  ['سجل الوقت', 'بداية ونهاية كل فقرة أساسية مسجلة.'],
  ['سجل التعديلات', 'أي تعديل له سبب وصاحب قرار.'],
  ['إجمالي الفراغ', 'الفراغ غير المخطط ضمن الحد المتفق عليه.'],
  ['تأكيد مسؤول الضيافة', 'النوم والسناك والفاصل بعد الطعام نُفذت كما خُطط.'],
  ['المنفذ ≠ المخطط', 'التدبر والمشاريع والأدوار العملية لم تُلغ دون قرار.'],
].map(([evidence, successCondition], index) => ({
  id: `execution-${index + 1}`,
  evidence,
  successCondition,
  checked: false,
}));

const closureChecklist: ChecklistItem[] = [
  ['نسبة الرد', 'جُمعت آراء المشاركين خلال 24 ساعة.'],
  ['جدول النسب النهائي', 'قورنت النسب المخططة بالوقت المنفذ فعليًا.'],
  ['سجل التحسين', 'اختيرت ثلاثة تحسينات فقط للدورة القادمة.'],
  ['قرار مكتوب', 'حُسم قرار التكرار أو التمديد وفق النتائج والقدرة.'],
].map(([evidence, successCondition], index) => ({
  id: `closure-${index + 1}`,
  evidence,
  successCondition,
  checked: false,
}));

const quickMetrics: MetricRow[] = [
  ['الفقرات التي بدأت في وقتها', '90% فأكثر'],
  ['الفراغ غير المخطط', 'ضمن الحد المتفق عليه'],
  ['الفقرات الأساسية المنفذة', '90% فأكثر'],
  ['المشاركون الذين نفذوا دورًا عمليًا', 'حسب الهدف'],
  ['ساعات النوم المتصل', 'حسب الخطة'],
  ['الانحراف عن نسب الفئات', 'أقل ما يمكن'],
].map(([indicator, target], index) => ({
  id: `quick-${index + 1}`,
  indicator,
  target,
  result: '',
  decision: '',
}));

const outcomeMetrics: MetricRow[] = [
  ['وضوح الجدول', '4 من 5 فأكثر'],
  ['ملاءمة المحتوى للمستوى', '4 من 5 فأكثر'],
  ['جودة التدبر', '4 من 5 فأكثر'],
  ['تنظيم النوم', '4 من 5 فأكثر'],
  ['من ناموا دون جوع', '90% فأكثر'],
  ['من نفذوا دورًا أو مشروعًا', 'حسب الهدف'],
  ['تحقق نسب الفئات المستهدفة', 'نعم'],
].map(([indicator, target], index) => ({
  id: `outcome-${index + 1}`,
  indicator,
  target,
  result: '',
  decision: '',
}));

export function createDefaultCampPlan(): CampPlan {
  return {
    schemaVersion: CAMP_PLAN_SCHEMA_VERSION,
    identity: {
      campName: '',
      targetGroup: '',
      dateAndPlace: '',
      coordinator: '',
      mainGoal: '',
    },
    program: {
      categories: [
        ['faith', 'إيماني وتزكوي', 'تدبر، قيام، أذكار، دعاء ومجلس إيماني', 'green'],
        ['knowledge', 'معرفي وتوعوي', 'محاضرات، استضافات ونقاشات توعوية', 'blue'],
        ['skills', 'عملي ومهاري', 'مشاريع، ورش، تخطيط، إلقاء وعروض', 'gold'],
        ['social', 'اجتماعي وتعارفي', 'تعارف، جلسة حبية وحوار جماعي', 'rose'],
        ['sports', 'ترفيهي ورياضي', 'رياضة، ألعاب ونشاط حر', 'neutral'],
      ].map(([id, label, examples, color]) => ({
        id,
        label,
        examples,
        percentage: 0,
        hours: 0,
        color: color as BlockColor,
      })),
      sleepHoursPerNight: 7,
      mealGapMinutes: 45,
      transitionMinutes: 60,
      totalProgramHours: 0,
    },
    beforeCamp: {
      programChecklist,
      readinessChecklist,
      launchDecision: 'UNDECIDED',
      launchNotes: '',
    },
    duringCamp: {
      executionChecklist,
      metrics: quickMetrics,
      keep: '',
      shorten: '',
      remove: '',
    },
    afterCamp: {
      outcomeMetrics,
      closureChecklist,
      improvements: [1, 2, 3].map((number) => ({
        id: `improvement-${number}`,
        improvement: '',
        owner: '',
        dueDate: '',
      })),
      biggestSuccess: '',
      biggestObstacle: '',
      nextCampDate: '',
    },
    customBlocks: [],
  };
}

export function calculateProgramTotals(plan: CampPlan) {
  return plan.program.categories.reduce(
    (totals, category) => ({
      percentage: totals.percentage + category.percentage,
      hours: totals.hours + category.hours,
    }),
    { percentage: 0, hours: 0 },
  );
}

export function checklistProgress(items: ChecklistItem[]) {
  const completed = items.filter((item) => item.checked).length;
  return { completed, total: items.length };
}

export function createCustomBlock(type: CustomBlock['type'], id: string): CustomBlock {
  if (type === 'table') {
    return {
      id,
      type,
      title: 'جدول جديد',
      color: 'green',
      columns: ['العمود الأول', 'العمود الثاني'],
      rows: [['', '']],
    };
  }

  return {
    id,
    type,
    title: type === 'heading' ? 'عنوان جديد' : 'ملاحظات جديدة',
    content: '',
    color: type === 'heading' ? 'gold' : 'neutral',
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function isBoundedString(value: unknown, max = 10_000): value is string {
  return typeof value === 'string' && value.length <= max;
}

function isBoundedNumber(value: unknown, max = 100_000): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max;
}

function isBlockColor(value: unknown): value is BlockColor {
  return blockColors.some((color) => color.value === value);
}

function isChecklistItem(value: unknown): value is ChecklistItem {
  return (
    isRecord(value) &&
    hasExactKeys(value, ['id', 'evidence', 'successCondition', 'checked']) &&
    isBoundedString(value.id, 100) &&
    isBoundedString(value.evidence, 500) &&
    isBoundedString(value.successCondition, 1_000) &&
    typeof value.checked === 'boolean'
  );
}

function isMetricRow(value: unknown): value is MetricRow {
  return (
    isRecord(value) &&
    hasExactKeys(value, ['id', 'indicator', 'target', 'result', 'decision']) &&
    isBoundedString(value.id, 100) &&
    isBoundedString(value.indicator, 500) &&
    isBoundedString(value.target, 500) &&
    isBoundedString(value.result, 1_000) &&
    isBoundedString(value.decision, 2_000)
  );
}

function isImprovementRow(value: unknown): value is ImprovementRow {
  return (
    isRecord(value) &&
    hasExactKeys(value, ['id', 'improvement', 'owner', 'dueDate']) &&
    isBoundedString(value.id, 100) &&
    isBoundedString(value.improvement, 2_000) &&
    isBoundedString(value.owner, 300) &&
    isBoundedString(value.dueDate, 200)
  );
}

function isCustomBlock(value: unknown): value is CustomBlock {
  if (!isRecord(value) || !isBoundedString(value.id, 100) || !isBlockColor(value.color)) {
    return false;
  }

  if (value.type === 'heading' || value.type === 'text') {
    return (
      hasExactKeys(value, ['id', 'type', 'title', 'content', 'color']) &&
      isBoundedString(value.title, 500) &&
      isBoundedString(value.content, 10_000)
    );
  }

  if (value.type === 'table') {
    if (!Array.isArray(value.columns) || !Array.isArray(value.rows)) return false;
    const columns = value.columns;
    return (
      hasExactKeys(value, ['id', 'type', 'title', 'color', 'columns', 'rows']) &&
      isBoundedString(value.title, 500) &&
      columns.length >= 1 &&
      columns.length <= 6 &&
      columns.every((column) => isBoundedString(column, 300)) &&
      value.rows.length <= 30 &&
      value.rows.every(
        (row) =>
          Array.isArray(row) &&
          row.length === columns.length &&
          row.every((cell) => isBoundedString(cell, 2_000)),
      )
    );
  }

  return false;
}

export function isCampPlan(value: unknown): value is CampPlan {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      'schemaVersion',
      'identity',
      'program',
      'beforeCamp',
      'duringCamp',
      'afterCamp',
      'customBlocks',
    ]) ||
    value.schemaVersion !== CAMP_PLAN_SCHEMA_VERSION
  ) {
    return false;
  }

  const { identity, program, beforeCamp, duringCamp, afterCamp, customBlocks } = value;
  if (
    !isRecord(identity) ||
    !hasExactKeys(identity, [
      'campName',
      'targetGroup',
      'dateAndPlace',
      'coordinator',
      'mainGoal',
    ]) ||
    !Object.values(identity).every((entry) => isBoundedString(entry, 2_000))
  ) {
    return false;
  }

  if (
    !isRecord(program) ||
    !hasExactKeys(program, [
      'categories',
      'sleepHoursPerNight',
      'mealGapMinutes',
      'transitionMinutes',
      'totalProgramHours',
    ]) ||
    !Array.isArray(program.categories) ||
    program.categories.length < 1 ||
    program.categories.length > 20 ||
    !program.categories.every(
      (category) =>
        isRecord(category) &&
        hasExactKeys(category, ['id', 'label', 'examples', 'percentage', 'hours', 'color']) &&
        isBoundedString(category.id, 100) &&
        isBoundedString(category.label, 500) &&
        isBoundedString(category.examples, 2_000) &&
        isBoundedNumber(category.percentage, 100) &&
        isBoundedNumber(category.hours, 1_000) &&
        isBlockColor(category.color),
    ) ||
    !isBoundedNumber(program.sleepHoursPerNight, 24) ||
    !isBoundedNumber(program.mealGapMinutes, 1_440) ||
    !isBoundedNumber(program.transitionMinutes, 10_000) ||
    !isBoundedNumber(program.totalProgramHours, 10_000)
  ) {
    return false;
  }

  if (
    !isRecord(beforeCamp) ||
    !hasExactKeys(beforeCamp, [
      'programChecklist',
      'readinessChecklist',
      'launchDecision',
      'launchNotes',
    ]) ||
    !Array.isArray(beforeCamp.programChecklist) ||
    !beforeCamp.programChecklist.every(isChecklistItem) ||
    !Array.isArray(beforeCamp.readinessChecklist) ||
    !beforeCamp.readinessChecklist.every(isChecklistItem) ||
    !['UNDECIDED', 'READY', 'NOT_READY'].includes(String(beforeCamp.launchDecision)) ||
    !isBoundedString(beforeCamp.launchNotes, 5_000)
  ) {
    return false;
  }

  if (
    !isRecord(duringCamp) ||
    !hasExactKeys(duringCamp, ['executionChecklist', 'metrics', 'keep', 'shorten', 'remove']) ||
    !Array.isArray(duringCamp.executionChecklist) ||
    !duringCamp.executionChecklist.every(isChecklistItem) ||
    !Array.isArray(duringCamp.metrics) ||
    !duringCamp.metrics.every(isMetricRow) ||
    !isBoundedString(duringCamp.keep, 5_000) ||
    !isBoundedString(duringCamp.shorten, 5_000) ||
    !isBoundedString(duringCamp.remove, 5_000)
  ) {
    return false;
  }

  if (
    !isRecord(afterCamp) ||
    !hasExactKeys(afterCamp, [
      'outcomeMetrics',
      'closureChecklist',
      'improvements',
      'biggestSuccess',
      'biggestObstacle',
      'nextCampDate',
    ]) ||
    !Array.isArray(afterCamp.outcomeMetrics) ||
    !afterCamp.outcomeMetrics.every(isMetricRow) ||
    !Array.isArray(afterCamp.closureChecklist) ||
    !afterCamp.closureChecklist.every(isChecklistItem) ||
    !Array.isArray(afterCamp.improvements) ||
    !afterCamp.improvements.every(isImprovementRow) ||
    !isBoundedString(afterCamp.biggestSuccess, 5_000) ||
    !isBoundedString(afterCamp.biggestObstacle, 5_000) ||
    !isBoundedString(afterCamp.nextCampDate, 500)
  ) {
    return false;
  }

  return (
    Array.isArray(customBlocks) && customBlocks.length <= 50 && customBlocks.every(isCustomBlock)
  );
}

export function serializeCampPlan(plan: CampPlan) {
  if (!isCampPlan(plan)) {
    throw new Error('خطة المخيم غير صالحة للحفظ.');
  }
  return `${JSON.stringify(plan, null, 2)}\n`;
}

export function parseCampPlanFile(source: string): CampPlan {
  if (source.length > 2_000_000) {
    throw new Error('حجم الملف أكبر من الحد المسموح (2 ميغابايت).');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error('الملف ليس ملف خطة صالحًا.');
  }

  if (!isCampPlan(parsed)) {
    throw new Error('صيغة الخطة غير معروفة أو تحتوي حقولًا غير صالحة.');
  }
  return parsed;
}

export function safePlanFilename(campName: string, extension: string) {
  const base = campName
    .trim()
    .replace(/[\\/:*?"<>|]+/gu, '-')
    .replace(/\s+/gu, '-')
    .replace(/-+/gu, '-')
    .replace(/^-|-$/gu, '')
    .slice(0, 80);
  return `${base || 'خطة-مخيم'}.${extension}`;
}
