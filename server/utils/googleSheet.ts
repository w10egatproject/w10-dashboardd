import { google } from 'googleapis';
import { requireServerEnv } from './env';

function sanitizePrivateKey(privateKey: string) {
  let key = privateKey.replace(/^"(.*)"$/, '$1');
  const keyStart = key.indexOf('-----BEGIN PRIVATE KEY-----');

  if (keyStart !== -1) {
    key = key.substring(keyStart);
  }

  return key.replace(/\\n/g, '\n');
}

function getSheetsClient() {
  const auth = new google.auth.JWT({
    email: requireServerEnv('GOOGLE_CLIENT_EMAIL'),
    key: sanitizePrivateKey(requireServerEnv('GOOGLE_PRIVATE_KEY')),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return {
    sheetId: requireServerEnv('GOOGLE_SHEET_ID'),
    sheets: google.sheets({ version: 'v4', auth }),
  };
}

const OT_CONTRACTOR_SPREADSHEET_ID = process.env.GOOGLE_OT_CONTRACTOR_SHEET_ID || process.env.GOOGLE_OT_SHEET_ID || '1ucCTBZBLF8tkTWyuIE46_aRx0vUwen382wWokuR55UQ';
const OT_EMPLOYEE_SPREADSHEET_ID = process.env.GOOGLE_OT_EMPLOYEE_SHEET_ID || '1__JtmwYd3xmL6XL-VkEU1E53NyaySwcT7dQY3OQ4aCA';
const OT_CONTRACTOR_SHEET_ID = Number(process.env.GOOGLE_OT_CONTRACTOR_SHEET_ID_NUM || process.env.GOOGLE_OT_SHEET_ID_NUM || 2120946153);

async function getSheetTitleById(client: ReturnType<typeof getSheetsClient>, spreadsheetId: string, sheetId: number) {
  const metadata = await client.sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets(properties(sheetId,title))',
  });
  const sheet = metadata.data.sheets?.find(item => item.properties?.sheetId === sheetId);
  return sheet?.properties?.title || '';
}

async function getSummarySheetTitle(client: ReturnType<typeof getSheetsClient>, spreadsheetId: string, filters: { year?: string; month?: string } = {}) {
  const explicitTitle = process.env.GOOGLE_OT_EMPLOYEE_SHEET_TITLE;
  if (explicitTitle) return explicitTitle;

  const metadata = await client.sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets(properties(title,index))',
  });
  const sheets = metadata.data.sheets?.sort((a, b) => (a.properties?.index || 0) - (b.properties?.index || 0)) || [];
  
  // Try to find a sheet that matches the current month name in Thai
  if (filters.month && filters.month !== 'all') {
    const monthNames = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const monthShortNames = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const monthIdx = parseInt(filters.month) - 1;
    const monthName = monthNames[monthIdx];
    const monthShortName = monthShortNames[monthIdx];

    const match = sheets.find(item => 
      item.properties?.title?.includes('สรุป') && 
      (item.properties?.title?.includes(monthName) || item.properties?.title?.includes(monthShortName))
    );
    if (match) return match.properties?.title || '';
  }

  const summarySheet = sheets.find(item => item.properties?.title?.includes('สรุป'));
  return summarySheet?.properties?.title || sheets[0]?.properties?.title || '';
}

function quoteSheetName(sheetName: string) {
  return `'${sheetName.replace(/'/g, "''")}'`;
}

export async function getRawDashboardSheets(filters: { year?: string; month?: string } = {}) {
  const client = getSheetsClient();
  const [otContractorSummaryTitle, otEmployeeSummaryTitle] = await Promise.all([
    getSheetTitleById(client, OT_CONTRACTOR_SPREADSHEET_ID, OT_CONTRACTOR_SHEET_ID),
    OT_EMPLOYEE_SPREADSHEET_ID ? getSummarySheetTitle(client, OT_EMPLOYEE_SPREADSHEET_ID, filters) : Promise.resolve(''),
  ]);

  const [dashboardRes, infoRes, otSummaryRes, otEmployeeSummaryRes, otCheckErrorRes, otEmployeeCheckErrorRes] = await Promise.all([
    client.sheets.spreadsheets.values.get({
      spreadsheetId: client.sheetId,
      range: "'Dashboard W10 All'!A1:CZ1000",
    }),
    client.sheets.spreadsheets.values.get({
      spreadsheetId: client.sheetId,
      range: "'Dashboard W10 All info'!A1:CZ5000",
    }),
    client.sheets.spreadsheets.values.get({
      spreadsheetId: OT_CONTRACTOR_SPREADSHEET_ID,
      range: `${quoteSheetName(otContractorSummaryTitle)}!A1:AP1000`,
    }),
    OT_EMPLOYEE_SPREADSHEET_ID && otEmployeeSummaryTitle ? client.sheets.spreadsheets.values.get({
      spreadsheetId: OT_EMPLOYEE_SPREADSHEET_ID,
      range: `${quoteSheetName(otEmployeeSummaryTitle)}!A1:AP1000`,
    }) : Promise.resolve({ data: { values: [] } }),
    client.sheets.spreadsheets.values.get({
      spreadsheetId: OT_CONTRACTOR_SPREADSHEET_ID,
      range: `${quoteSheetName(process.env.GOOGLE_OT_CHECK_ERROR_SHEET_TITLE || 'Check OT Error')}!A1:AP1000`,
    }),
    OT_EMPLOYEE_SPREADSHEET_ID ? client.sheets.spreadsheets.values.get({
      spreadsheetId: OT_EMPLOYEE_SPREADSHEET_ID,
      range: `${quoteSheetName(process.env.GOOGLE_OT_EMPLOYEE_CHECK_ERROR_SHEET_TITLE || 'Check OT Error')}!A1:AP1000`,
    }) : Promise.resolve({ data: { values: [] } }),
  ]);

  return {
    dashboard: dashboardRes.data.values || [],
    info: infoRes.data.values || [],
    otSummary: otSummaryRes.data.values || [],
    otEmployeeSummary: otEmployeeSummaryRes.data.values || [],
    otCheckError: otCheckErrorRes.data.values || [],
    otEmployeeCheckError: otEmployeeCheckErrorRes.data.values || [],
  };
}

export async function updateDashboardFilters(year: string, month: string) {
  const client = getSheetsClient();

  await client.sheets.spreadsheets.values.update({
    spreadsheetId: client.sheetId,
    range: "'Dashboard W10 All info'!C2:C3",
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[year === 'all' ? 'All' : year], [month === 'all' ? 'รวมทุกเดือน' : month]],
    },
  });
}
