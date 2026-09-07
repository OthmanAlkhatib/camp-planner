import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { CampPlan, ChecklistItem, MetricRow } from './camp-plan';
import { calculateProgramTotals, safePlanFilename } from './camp-plan';

const borders = {
  top: { style: BorderStyle.SINGLE, size: 2, color: 'CCD8D3' },
  bottom: { style: BorderStyle.SINGLE, size: 2, color: 'CCD8D3' },
  left: { style: BorderStyle.SINGLE, size: 2, color: 'CCD8D3' },
  right: { style: BorderStyle.SINGLE, size: 2, color: 'CCD8D3' },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'CCD8D3' },
  insideVertical: { style: BorderStyle.SINGLE, size: 2, color: 'CCD8D3' },
};

function rtlParagraph(
  text: string,
  options?: { heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel]; bold?: boolean },
) {
  return new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.RIGHT,
    heading: options?.heading,
    spacing: { after: 120 },
    children: [new TextRun({ text, bold: options?.bold, font: 'Cairo', size: 24 })],
  });
}

function cell(text: string, bold = false) {
  return new TableCell({
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
    children: [rtlParagraph(text, { bold })],
  });
}

function simpleTable(headers: string[], rows: string[][]) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders,
    rows: [
      new TableRow({ children: headers.map((header) => cell(header, true)) }),
      ...rows.map((row) => new TableRow({ children: row.map((value) => cell(value)) })),
    ],
  });
}

function checklistTable(items: ChecklistItem[]) {
  return simpleTable(
    ['تم', 'دليل الفحص', 'شرط النجاح'],
    items.map((item) => [item.checked ? 'نعم' : 'لا', item.evidence, item.successCondition]),
  );
}

function metricsTable(items: MetricRow[]) {
  return simpleTable(
    ['المؤشر', 'المستهدف', 'النتيجة', 'القرار / الملاحظة'],
    items.map((item) => [item.indicator, item.target, item.result, item.decision]),
  );
}

function sectionTitle(title: string) {
  return rtlParagraph(title, { heading: HeadingLevel.HEADING_1, bold: true });
}

export async function exportPlanToWord(plan: CampPlan) {
  const totals = calculateProgramTotals(plan);
  const children: (Paragraph | Table)[] = [
    rtlParagraph(plan.identity.campName || 'خطة مخيم جديدة', {
      heading: HeadingLevel.TITLE,
      bold: true,
    }),
    rtlParagraph('دليل تفاعلي لتخطيط وتقييم المخيمات'),
    simpleTable(
      ['البيان', 'القيمة'],
      [
        ['الفئة المستهدفة', plan.identity.targetGroup],
        ['التاريخ والمكان', plan.identity.dateAndPlace],
        ['مسؤول المتابعة', plan.identity.coordinator],
        ['الهدف الرئيسي', plan.identity.mainGoal],
      ],
    ),
    sectionTitle('أولًا: هوية البرنامج بالنسب'),
    simpleTable(
      ['الفئة', 'يدخل فيها', 'النسبة', 'الساعات'],
      [
        ...plan.program.categories.map((category) => [
          category.label,
          category.examples,
          `${category.percentage}%`,
          String(category.hours),
        ]),
        ['المجموع', '', `${totals.percentage}%`, String(totals.hours)],
      ],
    ),
    rtlParagraph(`وقت نوم متصل مستهدف: ${plan.program.sleepHoursPerNight} ساعة`),
    rtlParagraph(`الفاصل بعد الوجبة: ${plan.program.mealGapMinutes} دقيقة`),
    rtlParagraph(`إجمالي هوامش الانتقال: ${plan.program.transitionMinutes} دقيقة`),
    rtlParagraph(`إجمالي وقت البرنامج: ${plan.program.totalProgramHours} ساعة`),
    sectionTitle('ثانيًا: قبل المخيم'),
    rtlParagraph('البرنامج', { bold: true }),
    checklistTable(plan.beforeCamp.programChecklist),
    rtlParagraph('الجاهزية', { bold: true }),
    checklistTable(plan.beforeCamp.readinessChecklist),
    rtlParagraph(
      `قرار الانطلاق: ${plan.beforeCamp.launchDecision === 'READY' ? 'جاهز' : plan.beforeCamp.launchDecision === 'NOT_READY' ? 'غير جاهز' : 'لم يُحسم'}`,
      { bold: true },
    ),
    rtlParagraph(plan.beforeCamp.launchNotes),
    sectionTitle('ثالثًا: أثناء المخيم'),
    checklistTable(plan.duringCamp.executionChecklist),
    rtlParagraph('لوحة القياس السريعة', { bold: true }),
    metricsTable(plan.duringCamp.metrics),
    simpleTable(
      ['قرار منتصف المخيم', 'الملاحظة'],
      [
        ['ما الذي نحافظ عليه؟', plan.duringCamp.keep],
        ['ما الذي نختصر؟', plan.duringCamp.shorten],
        ['ما الذي يُحمى من الإلغاء؟', plan.duringCamp.remove],
      ],
    ),
    sectionTitle('رابعًا: بعد المخيم'),
    metricsTable(plan.afterCamp.outcomeMetrics),
    rtlParagraph('إغلاق التقييم', { bold: true }),
    checklistTable(plan.afterCamp.closureChecklist),
    rtlParagraph('سجل التحسين', { bold: true }),
    simpleTable(
      ['التحسين القابل للقياس', 'المالك', 'الموعد'],
      plan.afterCamp.improvements.map((item) => [item.improvement, item.owner, item.dueDate]),
    ),
    simpleTable(
      ['الخلاصة', 'التفاصيل'],
      [
        ['أبرز نجاح', plan.afterCamp.biggestSuccess],
        ['أكبر عائق', plan.afterCamp.biggestObstacle],
        ['موعد المخيم / المتابعة القادمة', plan.afterCamp.nextCampDate],
      ],
    ),
  ];

  if (plan.customBlocks.length > 0) {
    children.push(sectionTitle('محتوى إضافي'));
    for (const block of plan.customBlocks) {
      children.push(rtlParagraph(block.title, { heading: HeadingLevel.HEADING_2, bold: true }));
      if (block.type === 'table') {
        children.push(simpleTable(block.columns, block.rows));
      } else {
        children.push(rtlParagraph(block.content));
      }
    }
  }

  const document = new Document({
    creator: 'مخطط المخيم',
    title: plan.identity.campName || 'خطة مخيم',
    description: 'خطة مخيم عربية قابلة للتعديل',
    sections: [
      {
        properties: {
          page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(document);
  downloadBlob(blob, safePlanFilename(plan.identity.campName, 'docx'));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
