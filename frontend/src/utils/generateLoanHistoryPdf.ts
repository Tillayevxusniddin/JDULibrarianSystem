// src/utils/generateLoanHistoryPdf.ts
import type { Loan } from '../types';

// pdfmake works in browser with embedded virtual fonts
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - pdfmake build has no perfect types for vfs at this path in ESM
import pdfMake from 'pdfmake/build/pdfmake';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Support various module shapes produced by bundlers
const fontsModule: any = pdfFonts as any;
const resolvedVfs = fontsModule?.pdfMake?.vfs || fontsModule?.vfs || fontsModule?.default?.pdfMake?.vfs || fontsModule?.default?.vfs;
if (resolvedVfs) {
  (pdfMake as any).vfs = resolvedVfs;
}

const toDisplayStatus = (status: string) => status.replace(/_/g, ' ');

const fetchAsDataUrl = async (url: string): Promise<string | null> => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const type = blob.type || res.headers.get('content-type') || '';
    // pdfmake supports PNG/JPEG only in browsers; skip SVG and others gracefully
    if (!type.startsWith('image/') || /svg/i.test(type)) return null;
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export interface GenerateLoanHistoryPdfOptions {
  logoUrl?: string; // optional logo to include in header
}

export async function generateLoanHistoryPdf(loans: Loan[], options: GenerateLoanHistoryPdfOptions = {}) {
  // Count borrow frequency per user within current dataset
  const userCount = new Map<string, number>();
  loans.forEach((l) => userCount.set(l.user.id, (userCount.get(l.user.id) ?? 0) + 1));

  // Sort by user borrow frequency desc, then by dueDate asc
  const sorted = [...loans].sort((a, b) => {
    const ca = userCount.get(a.user.id) ?? 0;
    const cb = userCount.get(b.user.id) ?? 0;
    if (cb !== ca) return cb - ca;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  // Build table body
  const body: any[] = [
    [
      { text: 'Kitob', style: 'tableHeader' },
      { text: 'Foydalanuvchi', style: 'tableHeader' },
      { text: 'Qaytarish Muddati', style: 'tableHeader' },
      { text: 'Statusi', style: 'tableHeader' },
    ],
    ...sorted.map((loan) => [
      loan.bookCopy.book.title,
      `${loan.user.firstName} ${loan.user.lastName}`,
      new Date(loan.dueDate).toLocaleDateString(),
      toDisplayStatus(loan.status),
    ]),
  ];

  const logoDataUrl = options.logoUrl ? await fetchAsDataUrl(options.logoUrl) : null;
  const now = new Date();

  const docDefinition: any = {
    info: {
      title: 'Ijara Tarixi (Loan History Report)',
      subject: 'Loan history export generated from current page data',
    },
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    content: [
      {
        columns: [
          logoDataUrl
            ? { image: logoDataUrl, width: 40, height: 40, margin: [0, 0, 8, 0] }
            : { text: '' },
          {
            stack: [
              { text: 'Ijara Tarixi (Loan History Report)', style: 'title' },
              { text: `Yaratilgan sana: ${now.toLocaleString()}`, style: 'date' },
            ],
            width: '*',
          },
        ],
        columnGap: 8,
        margin: [0, 0, 0, 16],
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', 120, 90],
          body,
        },
        layout: {
          hLineWidth: () => 0.6,
          vLineWidth: () => 0.6,
          hLineColor: () => '#e0e0e0',
          vLineColor: () => '#e0e0e0',
          paddingLeft: () => 6,
          paddingRight: () => 6,
          paddingTop: () => 6,
          paddingBottom: () => 6,
        },
      },
    ],
    styles: {
      title: { fontSize: 16, bold: true },
      date: { fontSize: 10, color: '#666' },
      tableHeader: { bold: true },
    },
    defaultStyle: {
      font: 'Roboto', // provided by vfs_fonts, supports UTF-8 for Uzbek Latin
      fontSize: 10,
    },
  };

  // Use open() to allow user to download; fall back to download
  pdfMake.createPdf(docDefinition).download(`loan-history-${now.toISOString().slice(0,10)}.pdf`);
}

export default generateLoanHistoryPdf;