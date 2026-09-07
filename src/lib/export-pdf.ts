import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { CampPlan } from './camp-plan';
import { safePlanFilename } from './camp-plan';

export async function exportPlanToPdf(plan: CampPlan, element: HTMLElement) {
  await document.fonts.ready;
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
    logging: false,
    windowWidth: Math.max(element.scrollWidth, 1100),
  });

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const pageWidth = 210;
  const pageHeight = 297;
  const imageWidth = pageWidth;
  const imageHeight = (canvas.height * imageWidth) / canvas.width;
  const image = canvas.toDataURL('image/jpeg', 0.94);

  let y = 0;
  pdf.addImage(image, 'JPEG', 0, y, imageWidth, imageHeight, undefined, 'FAST');
  while (y + imageHeight > pageHeight) {
    y -= pageHeight;
    pdf.addPage();
    pdf.addImage(image, 'JPEG', 0, y, imageWidth, imageHeight, undefined, 'FAST');
  }

  pdf.save(safePlanFilename(plan.identity.campName, 'pdf'));
}
