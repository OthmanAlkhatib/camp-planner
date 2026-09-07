'use client';

import {
  Check,
  ChevronLeft,
  CircleAlert,
  Download,
  FileDown,
  FileText,
  Heading,
  Import,
  LayoutList,
  Plus,
  RotateCcw,
  Save,
  Table2,
  TentTree,
  Trash2,
} from 'lucide-react';
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  blockColors,
  calculateProgramTotals,
  checklistProgress,
  createCustomBlock,
  createDefaultCampPlan,
  CAMP_PLAN_STORAGE_KEY,
  type CampPlan,
  type ChecklistItem,
  type CustomBlock,
  type MetricRow,
  parseCampPlanFile,
  safePlanFilename,
  serializeCampPlan,
} from '@/lib/camp-plan';

type SaveState = 'saved' | 'saving' | 'error';

const navigation = [
  { id: 'identity', number: '00', label: 'بيانات المخيم' },
  { id: 'program', number: '01', label: 'هوية البرنامج' },
  { id: 'before', number: '02', label: 'قبل المخيم' },
  { id: 'during', number: '03', label: 'أثناء المخيم' },
  { id: 'after', number: '04', label: 'بعد المخيم' },
  { id: 'custom', number: '+', label: 'محتوى إضافي' },
];

export default function CampPlanner() {
  const [plan, setPlan] = useState<CampPlan>(() => createDefaultCampPlan());
  const [hydrated, setHydrated] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [message, setMessage] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'pdf' | 'word' | null>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const documentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const saved = window.localStorage.getItem(CAMP_PLAN_STORAGE_KEY);
      if (saved) {
        try {
          setPlan(parseCampPlanFile(saved));
        } catch {
          setMessage('تعذر فتح المسودة المحلية، لذلك بدأنا بخطة جديدة.');
        }
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(CAMP_PLAN_STORAGE_KEY, serializeCampPlan(plan));
        setSaveState('saved');
      } catch {
        setSaveState('error');
      }
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [hydrated, plan]);

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [message]);

  const totals = useMemo(() => calculateProgramTotals(plan), [plan]);
  const programProgress = checklistProgress(plan.beforeCamp.programChecklist);
  const readinessProgress = checklistProgress(plan.beforeCamp.readinessChecklist);
  const executionProgress = checklistProgress(plan.duringCamp.executionChecklist);
  const closureProgress = checklistProgress(plan.afterCamp.closureChecklist);

  function updateIdentity(field: keyof CampPlan['identity'], value: string) {
    setPlan((current) => ({ ...current, identity: { ...current.identity, [field]: value } }));
  }

  function downloadEditableFile() {
    const blob = new Blob([serializeCampPlan(plan)], { type: 'application/json;charset=utf-8' });
    downloadBlob(blob, safePlanFilename(plan.identity.campName, 'camp.json'));
    setMessage('تم حفظ نسخة قابلة للتعديل وإعادة الاستيراد.');
  }

  async function importEditableFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 2_000_000) {
      setMessage('الملف أكبر من الحد المسموح (2 ميغابايت).');
      return;
    }

    try {
      setPlan(parseCampPlanFile(await file.text()));
      setMessage('تم استيراد الخطة، ويمكنك متابعة التعديل.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر استيراد الملف.');
    }
  }

  async function exportPdf() {
    if (!documentRef.current) return;
    setExporting('pdf');
    setMessage('نجهّز ملف PDF الآن...');
    try {
      const { exportPlanToPdf } = await import('@/lib/export-pdf');
      await exportPlanToPdf(plan, documentRef.current);
      setMessage('تم تنزيل ملف PDF.');
    } catch {
      setMessage('تعذر إنشاء PDF. حاول مرة أخرى بعد اكتمال تحميل الصفحة.');
    } finally {
      setExporting(null);
    }
  }

  async function exportWord() {
    setExporting('word');
    setMessage('نجهّز ملف Word الآن...');
    try {
      const { exportPlanToWord } = await import('@/lib/export-docx');
      await exportPlanToWord(plan);
      setMessage('تم تنزيل ملف Word.');
    } catch {
      setMessage('تعذر إنشاء ملف Word. حاول مرة أخرى.');
    } finally {
      setExporting(null);
    }
  }

  function resetPlan() {
    if (!window.confirm('هل تريد بدء خطة جديدة؟ ستُستبدل المسودة المحفوظة على هذا الجهاز.')) return;
    setPlan(createDefaultCampPlan());
    setMessage('بدأنا خطة جديدة.');
  }

  function addCustomBlock(type: CustomBlock['type']) {
    const id = `block-${crypto.randomUUID()}`;
    setPlan((current) => ({
      ...current,
      customBlocks: [...current.customBlocks, createCustomBlock(type, id)],
    }));
    window.setTimeout(
      () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      50,
    );
  }

  function updateCustomBlock(id: string, updater: (block: CustomBlock) => CustomBlock) {
    setPlan((current) => ({
      ...current,
      customBlocks: current.customBlocks.map((block) => (block.id === id ? updater(block) : block)),
    }));
  }

  function removeCustomBlock(id: string) {
    setPlan((current) => ({
      ...current,
      customBlocks: current.customBlocks.filter((block) => block.id !== id),
    }));
  }

  return (
    <div className="app-shell" dir="rtl">
      <header className="topbar no-export">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <TentTree size={22} />
          </span>
          <div>
            <strong>مخطط المخيم</strong>
            <span>من الفكرة إلى التقييم</span>
          </div>
        </div>
        <div className="topbar-actions">
          <span className={`save-state save-${saveState}`}>
            {saveState === 'saving' ? (
              <Save size={15} />
            ) : saveState === 'error' ? (
              <CircleAlert size={15} />
            ) : (
              <Check size={15} />
            )}
            {saveState === 'saving'
              ? 'جارٍ الحفظ'
              : saveState === 'error'
                ? 'تعذر الحفظ'
                : 'محفوظ على جهازك'}
          </span>
          <button
            className="button ghost"
            type="button"
            onClick={() => importInput.current?.click()}
          >
            <Import size={17} /> استيراد
          </button>
          <button className="button ghost" type="button" onClick={downloadEditableFile}>
            <Download size={17} /> حفظ للتعديل
          </button>
          <div className="button-group" aria-label="خيارات التصدير">
            <button
              className="button secondary"
              type="button"
              onClick={exportWord}
              disabled={exporting !== null}
            >
              <FileText size={17} /> Word
            </button>
            <button
              className="button primary"
              type="button"
              onClick={exportPdf}
              disabled={exporting !== null}
            >
              <FileDown size={17} /> PDF
            </button>
          </div>
          <input
            ref={importInput}
            type="file"
            accept=".json,.camp.json,application/json"
            onChange={importEditableFile}
            hidden
          />
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar no-export">
          <div className="sidebar-intro">
            <span>دليل العمل</span>
            <p>تنقّل بين المراحل. كل تغيير يُحفظ تلقائيًا على هذا الجهاز.</p>
          </div>
          <nav aria-label="مراحل تخطيط المخيم">
            {navigation.map((item) => (
              <a key={item.id} href={`#${item.id}`}>
                <span>{item.number}</span>
                {item.label}
                <ChevronLeft size={16} aria-hidden="true" />
              </a>
            ))}
          </nav>
          <div className="sidebar-tip">
            <strong>قاعدة الدليل</strong>
            <p>لا تضع علامة «تم» إلا عندما يوجد دليل واضح يمكن مراجعته.</p>
          </div>
          <button className="reset-button" type="button" onClick={resetPlan}>
            <RotateCcw size={16} /> بدء خطة جديدة
          </button>
        </aside>

        <main className="planner-main">
          {message && (
            <div className="toast no-export" role="status">
              {message}
            </div>
          )}
          <div ref={documentRef} id="camp-plan-document" className="document-surface">
            <section id="identity" className="hero-card export-section">
              <div className="hero-copy">
                <span className="eyebrow">خطة جديدة قابلة للتحديث</span>
                <input
                  className="camp-title-input"
                  value={plan.identity.campName}
                  onChange={(event) => updateIdentity('campName', event.target.value)}
                  placeholder="اكتب اسم المخيم"
                  aria-label="اسم المخيم"
                />
                <p>ابدأ بالهوية، وازن البرنامج، ثم تابع التنفيذ والنتائج في ملف واحد.</p>
              </div>
              <div className="hero-seal" aria-hidden="true">
                <TentTree size={38} />
                <span>
                  خطة
                  <br />
                  واضحة
                </span>
              </div>
              <div className="identity-grid">
                <LabeledInput
                  label="الفئة المستهدفة"
                  value={plan.identity.targetGroup}
                  onChange={(value) => updateIdentity('targetGroup', value)}
                  placeholder="مثال: شباب 16-20 سنة"
                />
                <LabeledInput
                  label="التاريخ والمكان"
                  value={plan.identity.dateAndPlace}
                  onChange={(value) => updateIdentity('dateAndPlace', value)}
                  placeholder="التاريخ والموقع"
                />
                <LabeledInput
                  label="مسؤول المتابعة"
                  value={plan.identity.coordinator}
                  onChange={(value) => updateIdentity('coordinator', value)}
                  placeholder="الاسم"
                />
                <LabeledInput
                  label="الهدف الرئيسي"
                  value={plan.identity.mainGoal}
                  onChange={(value) => updateIdentity('mainGoal', value)}
                  placeholder="ما النتيجة التي نريد الوصول إليها؟"
                  wide
                />
              </div>
            </section>

            <section id="program" className="content-card export-section">
              <SectionHeader
                number="01"
                phase="أولًا"
                title="هوية البرنامج بالنسب"
                description="احسب النسب من وقت البرنامج الموجّه فقط، بعيدًا عن النوم والوجبات والصلاة والتنقل."
              />
              <div
                className={`balance-banner ${totals.percentage === 100 ? 'balanced' : 'unbalanced'}`}
              >
                <div>
                  <span>مجموع النسب</span>
                  <strong>{totals.percentage}%</strong>
                </div>
                <div>
                  <span>الساعات الموجّهة</span>
                  <strong>{totals.hours.toFixed(1)}</strong>
                </div>
                <p>
                  {totals.percentage === 100
                    ? 'التوزيع متوازن وجاهز للمراجعة.'
                    : `يتبقى ${Math.abs(100 - totals.percentage)}% للوصول إلى 100%.`}
                </p>
              </div>
              <div className="table-wrap">
                <table className="editor-table distribution-table">
                  <thead>
                    <tr>
                      <th>الفئة</th>
                      <th>يدخل فيها</th>
                      <th>النسبة</th>
                      <th>الساعات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.program.categories.map((category, index) => (
                      <tr key={category.id}>
                        <td>
                          <span className={`color-dot color-${category.color}`} />
                          {category.label}
                        </td>
                        <td>
                          <input
                            value={category.examples}
                            aria-label={`محتوى ${category.label}`}
                            onChange={(event) =>
                              setPlan((current) => ({
                                ...current,
                                program: {
                                  ...current.program,
                                  categories: current.program.categories.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, examples: event.target.value }
                                      : item,
                                  ),
                                },
                              }))
                            }
                          />
                        </td>
                        <td>
                          <NumberInput
                            value={category.percentage}
                            max={100}
                            suffix="%"
                            label={`نسبة ${category.label}`}
                            onChange={(value) =>
                              setPlan((current) => ({
                                ...current,
                                program: {
                                  ...current.program,
                                  categories: current.program.categories.map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, percentage: value } : item,
                                  ),
                                },
                              }))
                            }
                          />
                        </td>
                        <td>
                          <NumberInput
                            value={category.hours}
                            max={1000}
                            label={`ساعات ${category.label}`}
                            onChange={(value) =>
                              setPlan((current) => ({
                                ...current,
                                program: {
                                  ...current.program,
                                  categories: current.program.categories.map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, hours: value } : item,
                                  ),
                                },
                              }))
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="time-grid">
                <NumberCard
                  label="النوم المتصل لكل ليلة"
                  unit="ساعة"
                  value={plan.program.sleepHoursPerNight}
                  max={24}
                  onChange={(value) =>
                    setPlan((current) => ({
                      ...current,
                      program: { ...current.program, sleepHoursPerNight: value },
                    }))
                  }
                />
                <NumberCard
                  label="الفاصل بعد الوجبة"
                  unit="دقيقة"
                  value={plan.program.mealGapMinutes}
                  max={1440}
                  onChange={(value) =>
                    setPlan((current) => ({
                      ...current,
                      program: { ...current.program, mealGapMinutes: value },
                    }))
                  }
                />
                <NumberCard
                  label="إجمالي هوامش الانتقال"
                  unit="دقيقة"
                  value={plan.program.transitionMinutes}
                  max={10000}
                  onChange={(value) =>
                    setPlan((current) => ({
                      ...current,
                      program: { ...current.program, transitionMinutes: value },
                    }))
                  }
                />
                <NumberCard
                  label="إجمالي وقت البرنامج"
                  unit="ساعة"
                  value={plan.program.totalProgramHours}
                  max={10000}
                  onChange={(value) =>
                    setPlan((current) => ({
                      ...current,
                      program: { ...current.program, totalProgramHours: value },
                    }))
                  }
                />
              </div>
            </section>

            <section id="before" className="content-card export-section">
              <SectionHeader
                number="02"
                phase="ثانيًا"
                title="قبل المخيم"
                description="أغلق عناصر البرنامج والجاهزية قبل اتخاذ قرار الانطلاق."
              />
              <ChecklistEditor
                title="البرنامج"
                progress={programProgress}
                items={plan.beforeCamp.programChecklist}
                onChange={(items) =>
                  setPlan((current) => ({
                    ...current,
                    beforeCamp: { ...current.beforeCamp, programChecklist: items },
                  }))
                }
              />
              <ChecklistEditor
                title="الجاهزية"
                progress={readinessProgress}
                items={plan.beforeCamp.readinessChecklist}
                onChange={(items) =>
                  setPlan((current) => ({
                    ...current,
                    beforeCamp: { ...current.beforeCamp, readinessChecklist: items },
                  }))
                }
              />
              <div className="decision-panel">
                <div>
                  <span className="eyebrow">قرار الانطلاق</span>
                  <strong>هل المخيم جاهز للبدء؟</strong>
                  <p>لا يبدأ المخيم قبل إغلاق نواقص المكان، النوم، الطعام، الوقت والبرنامج.</p>
                </div>
                <div className="decision-controls">
                  <label
                    className={plan.beforeCamp.launchDecision === 'READY' ? 'selected ready' : ''}
                  >
                    <input
                      type="radio"
                      name="launch"
                      checked={plan.beforeCamp.launchDecision === 'READY'}
                      onChange={() =>
                        setPlan((current) => ({
                          ...current,
                          beforeCamp: { ...current.beforeCamp, launchDecision: 'READY' },
                        }))
                      }
                    />
                    جاهز
                  </label>
                  <label
                    className={
                      plan.beforeCamp.launchDecision === 'NOT_READY' ? 'selected not-ready' : ''
                    }
                  >
                    <input
                      type="radio"
                      name="launch"
                      checked={plan.beforeCamp.launchDecision === 'NOT_READY'}
                      onChange={() =>
                        setPlan((current) => ({
                          ...current,
                          beforeCamp: { ...current.beforeCamp, launchDecision: 'NOT_READY' },
                        }))
                      }
                    />
                    غير جاهز
                  </label>
                </div>
                <textarea
                  value={plan.beforeCamp.launchNotes}
                  onChange={(event) =>
                    setPlan((current) => ({
                      ...current,
                      beforeCamp: { ...current.beforeCamp, launchNotes: event.target.value },
                    }))
                  }
                  placeholder="اكتب النواقص أو سبب القرار..."
                  aria-label="ملاحظات قرار الانطلاق"
                />
              </div>
            </section>

            <section id="during" className="content-card export-section">
              <SectionHeader
                number="03"
                phase="ثالثًا"
                title="أثناء المخيم"
                description="تابع التنفيذ بالأدلة، وسجّل الانحرافات والقرارات فور حدوثها."
              />
              <ChecklistEditor
                title="متابعة التنفيذ"
                progress={executionProgress}
                items={plan.duringCamp.executionChecklist}
                onChange={(items) =>
                  setPlan((current) => ({
                    ...current,
                    duringCamp: { ...current.duringCamp, executionChecklist: items },
                  }))
                }
              />
              <MetricsEditor
                title="لوحة قياس سريعة"
                items={plan.duringCamp.metrics}
                onChange={(items) =>
                  setPlan((current) => ({
                    ...current,
                    duringCamp: { ...current.duringCamp, metrics: items },
                  }))
                }
              />
              <div className="notes-grid">
                <LabeledTextarea
                  label="ما الذي نحافظ عليه؟"
                  value={plan.duringCamp.keep}
                  onChange={(value) =>
                    setPlan((current) => ({
                      ...current,
                      duringCamp: { ...current.duringCamp, keep: value },
                    }))
                  }
                />
                <LabeledTextarea
                  label="ما الذي نختصر؟"
                  value={plan.duringCamp.shorten}
                  onChange={(value) =>
                    setPlan((current) => ({
                      ...current,
                      duringCamp: { ...current.duringCamp, shorten: value },
                    }))
                  }
                />
                <LabeledTextarea
                  label="ما الذي يُحمى من الإلغاء؟"
                  value={plan.duringCamp.remove}
                  onChange={(value) =>
                    setPlan((current) => ({
                      ...current,
                      duringCamp: { ...current.duringCamp, remove: value },
                    }))
                  }
                />
              </div>
            </section>

            <section id="after" className="content-card export-section">
              <SectionHeader
                number="04"
                phase="رابعًا"
                title="بعد المخيم"
                description="قِس النتيجة، أغلق التقييم، واختر ثلاثة تحسينات قابلة للتنفيذ فقط."
              />
              <MetricsEditor
                title="قياس النتيجة"
                items={plan.afterCamp.outcomeMetrics}
                onChange={(items) =>
                  setPlan((current) => ({
                    ...current,
                    afterCamp: { ...current.afterCamp, outcomeMetrics: items },
                  }))
                }
              />
              <ChecklistEditor
                title="إغلاق التقييم"
                progress={closureProgress}
                items={plan.afterCamp.closureChecklist}
                onChange={(items) =>
                  setPlan((current) => ({
                    ...current,
                    afterCamp: { ...current.afterCamp, closureChecklist: items },
                  }))
                }
              />
              <h3 className="subheading">سجل التحسين</h3>
              <div className="table-wrap">
                <table className="editor-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>التحسين القابل للقياس</th>
                      <th>المالك</th>
                      <th>الموعد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.afterCamp.improvements.map((item, index) => (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        {(['improvement', 'owner', 'dueDate'] as const).map((field) => (
                          <td key={field}>
                            <input
                              value={item[field]}
                              aria-label={`${field} ${index + 1}`}
                              onChange={(event) =>
                                setPlan((current) => ({
                                  ...current,
                                  afterCamp: {
                                    ...current.afterCamp,
                                    improvements: current.afterCamp.improvements.map(
                                      (row, rowIndex) =>
                                        rowIndex === index
                                          ? { ...row, [field]: event.target.value }
                                          : row,
                                    ),
                                  },
                                }))
                              }
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="notes-grid summary-grid">
                <LabeledTextarea
                  label="أبرز نجاح"
                  value={plan.afterCamp.biggestSuccess}
                  onChange={(value) =>
                    setPlan((current) => ({
                      ...current,
                      afterCamp: { ...current.afterCamp, biggestSuccess: value },
                    }))
                  }
                />
                <LabeledTextarea
                  label="أكبر عائق"
                  value={plan.afterCamp.biggestObstacle}
                  onChange={(value) =>
                    setPlan((current) => ({
                      ...current,
                      afterCamp: { ...current.afterCamp, biggestObstacle: value },
                    }))
                  }
                />
                <LabeledTextarea
                  label="موعد المخيم / المتابعة القادمة"
                  value={plan.afterCamp.nextCampDate}
                  onChange={(value) =>
                    setPlan((current) => ({
                      ...current,
                      afterCamp: { ...current.afterCamp, nextCampDate: value },
                    }))
                  }
                />
              </div>
            </section>

            <section id="custom" className="content-card custom-section export-section">
              <SectionHeader
                number="+"
                phase="مرن"
                title="محتوى إضافي"
                description="أضف ما يحتاجه مخيمك من عناوين أو ملاحظات أو جداول دون تغيير الدليل الأساسي."
              />
              <div className="add-toolbar no-export">
                <button type="button" onClick={() => addCustomBlock('heading')}>
                  <Heading size={17} /> إضافة عنوان
                </button>
                <button type="button" onClick={() => addCustomBlock('text')}>
                  <LayoutList size={17} /> إضافة نص
                </button>
                <button type="button" onClick={() => addCustomBlock('table')}>
                  <Table2 size={17} /> إضافة جدول
                </button>
              </div>
              {plan.customBlocks.length === 0 ? (
                <div className="empty-state">
                  <Plus size={25} />
                  <strong>لا يوجد محتوى إضافي بعد</strong>
                  <p>القالب الأساسي جاهز، ويمكنك إضافة ما يخص مخيمك فقط.</p>
                </div>
              ) : (
                <div className="custom-blocks">
                  {plan.customBlocks.map((block) => (
                    <CustomBlockEditor
                      key={block.id}
                      block={block}
                      onChange={(next) => updateCustomBlock(block.id, () => next)}
                      onRemove={() => removeCustomBlock(block.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
          <footer className="page-footer no-export">
            <span>كل البيانات محفوظة محليًا على جهازك.</span>
            <span>لا حسابات، لا قاعدة بيانات، ولا إرسال خارجي.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

function SectionHeader({
  number,
  phase,
  title,
  description,
}: {
  number: string;
  phase: string;
  title: string;
  description: string;
}) {
  return (
    <header className="section-header">
      <div className="section-number">{number}</div>
      <div>
        <span>{phase}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </header>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  wide = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  wide?: boolean;
}) {
  return (
    <label className={`field ${wide ? 'field-wide' : ''}`}>
      <span>{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function LabeledTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field textarea-field">
      <span>{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="اكتب هنا..."
      />
    </label>
  );
}

function NumberInput({
  value,
  onChange,
  label,
  max,
  suffix,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  max: number;
  suffix?: string;
}) {
  return (
    <label className="number-input">
      <input
        type="number"
        min="0"
        max={max}
        step="0.5"
        value={value}
        aria-label={label}
        onChange={(event) => onChange(Math.min(max, Math.max(0, Number(event.target.value) || 0)))}
      />
      {suffix && <span>{suffix}</span>}
    </label>
  );
}

function NumberCard({
  label,
  unit,
  value,
  max,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="number-card">
      <span>{label}</span>
      <div>
        <input
          type="number"
          min="0"
          max={max}
          step="0.5"
          value={value}
          onChange={(event) =>
            onChange(Math.min(max, Math.max(0, Number(event.target.value) || 0)))
          }
        />
        <small>{unit}</small>
      </div>
    </label>
  );
}

function ChecklistEditor({
  title,
  progress,
  items,
  onChange,
}: {
  title: string;
  progress: { completed: number; total: number };
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}) {
  return (
    <div className="editor-group">
      <div className="group-heading">
        <h3>{title}</h3>
        <span>
          {progress.completed} من {progress.total}
        </span>
      </div>
      <div className="table-wrap">
        <table className="editor-table checklist-table">
          <thead>
            <tr>
              <th>تم</th>
              <th>دليل الفحص</th>
              <th>شرط النجاح</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className={item.checked ? 'row-complete' : ''}>
                <td>
                  <label className="check-control">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(event) =>
                        onChange(
                          items.map((candidate, candidateIndex) =>
                            candidateIndex === index
                              ? { ...candidate, checked: event.target.checked }
                              : candidate,
                          ),
                        )
                      }
                    />
                    <span>
                      <Check size={15} />
                    </span>
                  </label>
                </td>
                <td>
                  <input
                    value={item.evidence}
                    aria-label={`دليل الفحص ${index + 1}`}
                    onChange={(event) =>
                      onChange(
                        items.map((candidate, candidateIndex) =>
                          candidateIndex === index
                            ? { ...candidate, evidence: event.target.value }
                            : candidate,
                        ),
                      )
                    }
                  />
                </td>
                <td>
                  <textarea
                    value={item.successCondition}
                    aria-label={`شرط النجاح ${index + 1}`}
                    onChange={(event) =>
                      onChange(
                        items.map((candidate, candidateIndex) =>
                          candidateIndex === index
                            ? { ...candidate, successCondition: event.target.value }
                            : candidate,
                        ),
                      )
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricsEditor({
  title,
  items,
  onChange,
}: {
  title: string;
  items: MetricRow[];
  onChange: (items: MetricRow[]) => void;
}) {
  const update = (index: number, field: keyof MetricRow, value: string) =>
    onChange(
      items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    );
  return (
    <div className="editor-group">
      <div className="group-heading">
        <h3>{title}</h3>
        <span>قياس وقرار</span>
      </div>
      <div className="table-wrap">
        <table className="editor-table metrics-table">
          <thead>
            <tr>
              <th>المؤشر</th>
              <th>المستهدف</th>
              <th>النتيجة</th>
              <th>القرار / الملاحظة</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id}>
                <td>
                  <input
                    value={item.indicator}
                    aria-label={`المؤشر ${index + 1}`}
                    onChange={(event) => update(index, 'indicator', event.target.value)}
                  />
                </td>
                <td>
                  <input
                    value={item.target}
                    aria-label={`المستهدف ${index + 1}`}
                    onChange={(event) => update(index, 'target', event.target.value)}
                  />
                </td>
                <td>
                  <input
                    value={item.result}
                    aria-label={`النتيجة ${index + 1}`}
                    onChange={(event) => update(index, 'result', event.target.value)}
                    placeholder="النتيجة"
                  />
                </td>
                <td>
                  <input
                    value={item.decision}
                    aria-label={`القرار ${index + 1}`}
                    onChange={(event) => update(index, 'decision', event.target.value)}
                    placeholder="قرار أو ملاحظة"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CustomBlockEditor({
  block,
  onChange,
  onRemove,
}: {
  block: CustomBlock;
  onChange: (block: CustomBlock) => void;
  onRemove: () => void;
}) {
  return (
    <article id={block.id} className={`custom-block block-${block.color}`}>
      <div className="custom-block-header">
        <input
          value={block.title}
          onChange={(event) => onChange({ ...block, title: event.target.value })}
          aria-label="عنوان المحتوى الإضافي"
        />
        <div className="custom-actions no-export">
          <label>
            <span>اللون</span>
            <select
              value={block.color}
              onChange={(event) =>
                onChange({ ...block, color: event.target.value as CustomBlock['color'] })
              }
            >
              {blockColors.map((color) => (
                <option key={color.value} value={color.value}>
                  {color.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={onRemove} aria-label="حذف المحتوى">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      {block.type === 'table' ? (
        <CustomTable block={block} onChange={onChange} />
      ) : (
        <textarea
          className={block.type === 'heading' ? 'heading-content' : 'text-content'}
          value={block.content}
          onChange={(event) => onChange({ ...block, content: event.target.value })}
          placeholder={
            block.type === 'heading'
              ? 'اكتب العنوان أو الفكرة الرئيسية...'
              : 'اكتب الملاحظات هنا...'
          }
        />
      )}
    </article>
  );
}

function CustomTable({
  block,
  onChange,
}: {
  block: Extract<CustomBlock, { type: 'table' }>;
  onChange: (block: CustomBlock) => void;
}) {
  const updateColumn = (index: number, value: string) =>
    onChange({
      ...block,
      columns: block.columns.map((column, columnIndex) => (columnIndex === index ? value : column)),
    });
  const updateCell = (rowIndex: number, columnIndex: number, value: string) =>
    onChange({
      ...block,
      rows: block.rows.map((row, currentRow) =>
        currentRow === rowIndex
          ? row.map((cell, currentColumn) => (currentColumn === columnIndex ? value : cell))
          : row,
      ),
    });

  return (
    <>
      <div className="table-wrap">
        <table className="editor-table custom-table">
          <thead>
            <tr>
              {block.columns.map((column, index) => (
                <th key={index}>
                  <input
                    value={column}
                    aria-label={`عنوان العمود ${index + 1}`}
                    onChange={(event) => updateColumn(index, event.target.value)}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, columnIndex) => (
                  <td key={columnIndex}>
                    <input
                      value={cell}
                      aria-label={`صف ${rowIndex + 1} عمود ${columnIndex + 1}`}
                      onChange={(event) => updateCell(rowIndex, columnIndex, event.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-actions no-export">
        <button
          type="button"
          onClick={() => onChange({ ...block, rows: [...block.rows, block.columns.map(() => '')] })}
          disabled={block.rows.length >= 30}
        >
          <Plus size={15} /> صف
        </button>
        <button
          type="button"
          onClick={() =>
            onChange({
              ...block,
              columns: [...block.columns, `عمود ${block.columns.length + 1}`],
              rows: block.rows.map((row) => [...row, '']),
            })
          }
          disabled={block.columns.length >= 6}
        >
          <Plus size={15} /> عمود
        </button>
        {block.rows.length > 1 && (
          <button
            type="button"
            onClick={() => onChange({ ...block, rows: block.rows.slice(0, -1) })}
          >
            <Trash2 size={15} /> آخر صف
          </button>
        )}
      </div>
    </>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
