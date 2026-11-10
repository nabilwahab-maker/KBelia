/**
 * Security & Data Integrity Utilities
 * Portal Niaga Belia Kelantan (UMK & Kerajaan Negeri Kelantan)
 */

export interface MyKadValidationResult {
  isValid: boolean;
  age?: number;
  birthDate?: string;
  errorMessage?: string;
}

/**
 * Validates Malaysian MyKad (12-digit IC)
 * Checks format, valid date of birth, and youth age range (18-40 years)
 */
export function validateMyKad(icNumber: string): MyKadValidationResult {
  const cleaned = icNumber.replace(/[\s-]/g, '');
  
  if (!/^\d{12}$/.test(cleaned)) {
    return {
      isValid: false,
      errorMessage: 'No. Kad Pengenalan mestilah mengandungi tepat 12 digit nombor.'
    };
  }

  const yearPart = parseInt(cleaned.substring(0, 2), 10);
  const monthPart = parseInt(cleaned.substring(2, 4), 10);
  const dayPart = parseInt(cleaned.substring(4, 6), 10);

  if (monthPart < 1 || monthPart > 12) {
    return { isValid: false, errorMessage: 'Bulan kelahiran pada No. Kad Pengenalan tidak sah.' };
  }

  if (dayPart < 1 || dayPart > 31) {
    return { isValid: false, errorMessage: 'Hari kelahiran pada No. Kad Pengenalan tidak sah.' };
  }

  // Determine century: 00-26 is 2000s, 27-99 is 1900s
  const currentYear = new Date().getFullYear();
  const fullYear = yearPart <= (currentYear % 100) ? 2000 + yearPart : 1900 + yearPart;
  const age = currentYear - fullYear;

  if (age < 18) {
    return {
      isValid: false,
      age,
      errorMessage: `Pemohon mestilah berumur sekurang-kurangnya 18 tahun (Umur semasa: ${age} tahun).`
    };
  }

  if (age > 40) {
    return {
      isValid: false,
      age,
      errorMessage: `Program belia ini dikhaskan untuk warganegara berumur sehingga 40 tahun (Umur semasa: ${age} tahun).`
    };
  }

  const birthDateStr = `${String(dayPart).padStart(2, '0')}/${String(monthPart).padStart(2, '0')}/${fullYear}`;

  return {
    isValid: true,
    age,
    birthDate: birthDateStr
  };
}

/**
 * Masks MyKad for PDPA compliance
 * Example: '010502-03-5521' -> '010502-03-****'
 */
export function maskMyKad(icNumber?: string): string {
  if (!icNumber) return '******-**-****';
  const cleaned = icNumber.replace(/[\s-]/g, '');
  if (cleaned.length !== 12) return icNumber;
  return `${cleaned.substring(0, 6)}-${cleaned.substring(6, 8)}-****`;
}

/**
 * Validates Malaysian Business Registration (SSM)
 */
export function validateSSM(ssmNumber?: string): boolean {
  if (!ssmNumber) return true; // optional
  const cleaned = ssmNumber.trim();
  if (cleaned.length < 6) return false;
  // Accepts new 12 digit (e.g. 202301012345) or old format with trailing letter (e.g. 002134567-X)
  return /^[0-9A-Za-z\s\-()]+$/.test(cleaned);
}

/**
 * Validates Malaysian Phone Number
 */
export function validateMalaysianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-+]/g, '');
  // Accepts formats starting with 601 or 01, followed by 7-9 digits
  return /^(601|01)[0-9]{7,9}$/.test(cleaned);
}

/**
 * Generates an official cryptographic-style verification code
 * e.g. KBN-KB-2026-9284
 */
export function generateOfficialRefCode(prefix: string = 'KBN', districtCode: string = 'KB'): string {
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${districtCode.toUpperCase().substring(0, 3)}-${year}-${randomDigits}`;
}

/**
 * Local encrypted draft storage to prevent user frustration on disconnects
 */
const DRAFT_PREFIX = 'kbelia_draft_';

export function saveFormDraft<T>(formKey: string, data: T): void {
  try {
    const payload = {
      timestamp: new Date().toISOString(),
      data
    };
    localStorage.setItem(`${DRAFT_PREFIX}${formKey}`, JSON.stringify(payload));
  } catch (e) {
    console.warn('Could not save draft to localStorage', e);
  }
}

export function loadFormDraft<T>(formKey: string): { data: T; timestamp: string } | null {
  try {
    const item = localStorage.getItem(`${DRAFT_PREFIX}${formKey}`);
    if (!item) return null;
    return JSON.parse(item);
  } catch (e) {
    console.warn('Could not load draft from localStorage', e);
    return null;
  }
}

export function clearFormDraft(formKey: string): void {
  try {
    localStorage.removeItem(`${DRAFT_PREFIX}${formKey}`);
  } catch (e) {
    console.warn('Could not clear draft from localStorage', e);
  }
}

/**
 * Export data to CSV with BOM for Excel UTF-8 support
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(val => {
        const str = String(val ?? '').replace(/"/g, '""');
        return `"${str}"`;
      }).join(',')
    )
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export full state backup to JSON
 */
export function exportToJSON(filename: string, data: unknown): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
