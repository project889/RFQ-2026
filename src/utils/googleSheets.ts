import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { QuotationOrder } from '../types';
import { calcFinancialProgress, formatNumber, formatDate } from './formatters';

// Ensure Firebase App is initialized cleanly
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize Auth listener
export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Popup
export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('ไม่สามารถดึง Access Token จาก Google Auth ได้');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

// Export Order Tracking to Google Sheets
export interface ExportResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  totalExported: number;
}

export const exportOrderTrackingToSheets = async (
  orders: QuotationOrder[],
  existingSpreadsheetId?: string
): Promise<ExportResult> => {
  let token = cachedAccessToken;
  if (!token) {
    const loginResult = await signInWithGoogle();
    if (!loginResult) {
      throw new Error('กรุณาลงชื่อเข้าใช้ Google เพื่อใช้งานระบบ Google Sheets');
    }
    token = loginResult.accessToken;
  }

  // Filter orders for Order Tracking (same logic as tab)
  const trackingOrders = orders.filter(
    (o) => o.soNo || o.woNo || o.status === 'COMPLETED' || o.status === 'FINAL' || o.status === 'AWARDED'
  );

  const headers = [
    'ลำดับ',
    'เลขที่ QT',
    'เลขที่ SO',
    'วันที่ SO',
    'เลขที่ PO/WO',
    'ชื่อลูกค้า',
    'ผู้ดูแล (Sales)',
    'ผู้ออกเอกสาร',
    'รายละเอียดงาน / โครงการ',
    'มูลค่างานรวม (บาท)',
    'สถานะ QT',
    'ยอดวางบิลแล้ว (บาท)',
    'ยอดรับชำระแล้ว (บาท)',
    'ยอดคงเหลือ (บาท)',
    'ความคืบหน้าการวางบิล (%)',
    'รายละเอียดงวดย่อย (Child IVs)',
  ];

  const dataRows = trackingOrders.map((order, idx) => {
    const prog = calcFinancialProgress(order);
    const installmentSummary = order.installments && order.installments.length > 0
      ? order.installments
          .map(
            (b) =>
              `งวดที่ ${b.installmentNo}: ${formatNumber(b.amount)} ฿ [${
                b.ivNo || 'ไม่มี IV'
              }] - ${b.status}`
          )
          .join(' | ')
      : 'ยังไม่มีงวดย่อย';

    return [
      idx + 1,
      order.qtNo || '-',
      order.soNo || '-',
      formatDate(order.soDate),
      order.woNo || '-',
      order.customerName || '-',
      order.salesPerson || '-',
      order.issuedBy || '-',
      order.description || order.project || '-',
      order.amount || 0,
      order.status || 'IN_PROGRESS',
      prog.billedAmount,
      prog.paidAmount,
      prog.remainingBalance,
      prog.billedPercentage,
      installmentSummary,
    ];
  });

  const values = [headers, ...dataRows];

  let targetSpreadsheetId = existingSpreadsheetId?.trim();

  if (!targetSpreadsheetId) {
    // Create a new Spreadsheet via REST API
    const dateStr = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: `Order Tracking Data - ${dateStr}`,
        },
        sheets: [
          {
            properties: {
              title: 'Order Tracking',
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
        ],
      }),
    });

    if (!createRes.ok) {
      const errJson = await createRes.json().catch(() => ({}));
      throw new Error(
        `ไม่สามารถสร้าง Google Sheet ใหม่ได้: ${errJson.error?.message || createRes.statusText}`
      );
    }

    const createData = await createRes.json();
    targetSpreadsheetId = createData.spreadsheetId;
  }

  // Update sheet content
  const range = `Order Tracking!A1:P${values.length}`;
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${targetSpreadsheetId}/values/${encodeURIComponent(
      range
    )}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values,
      }),
    }
  );

  if (!updateRes.ok) {
    const errJson = await updateRes.json().catch(() => ({}));
    throw new Error(
      `ไม่สามารถเขียนข้อมูลลงใน Google Sheet ได้: ${errJson.error?.message || updateRes.statusText}`
    );
  }

  // Format header row style (Batch update styling)
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${targetSpreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.12, green: 0.16, blue: 0.23 }, // #1E293B (slate-800)
                  textFormat: {
                    foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                    bold: true,
                    fontSize: 10,
                  },
                  horizontalAlignment: 'CENTER',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
            },
          },
        ],
      }),
    });
  } catch (e) {
    console.warn('Styling header failed silently:', e);
  }

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${targetSpreadsheetId}/edit`;

  return {
    spreadsheetId: targetSpreadsheetId,
    spreadsheetUrl,
    totalExported: trackingOrders.length,
  };
};


