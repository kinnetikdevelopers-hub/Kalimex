import Papa from 'papaparse'
import type { Grade } from '../types'

export interface StudentImportRow {
  full_name: string
  admission_number: string
  grade_name: string
  gender?: string
  date_of_birth?: string
  guardian_name?: string
  guardian_phone?: string
  guardian_email?: string
  guardian_relationship?: string
  // resolved
  grade_id?: string
  errors: string[]
  warnings: string[]
  valid: boolean
}

const REQUIRED_COLS = ['full_name', 'admission_number', 'grade_name']

const COLUMN_ALIASES: Record<string, string> = {
  // full_name aliases
  'name': 'full_name', 'student name': 'full_name', 'pupil name': 'full_name',
  'full name': 'full_name', 'student_name': 'full_name',
  // admission_number aliases
  'admission no': 'admission_number', 'adm no': 'admission_number',
  'admission': 'admission_number', 'adm_no': 'admission_number', 'adm no.': 'admission_number',
  // grade aliases
  'grade': 'grade_name', 'class': 'grade_name', 'form': 'grade_name',
  // gender
  'sex': 'gender',
  // guardian
  'parent name': 'guardian_name', 'parent_name': 'guardian_name', 'guardian': 'guardian_name',
  'parent phone': 'guardian_phone', 'parent_phone': 'guardian_phone', 'phone': 'guardian_phone',
  'parent email': 'guardian_email', 'parent_email': 'guardian_email',
  'relationship': 'guardian_relationship',
}

function normalizeHeader(h: string): string {
  const lower = h.toLowerCase().trim()
  return COLUMN_ALIASES[lower] || lower.replace(/\s+/g, '_')
}

function validateRow(row: Record<string, string>, grades: Grade[]): StudentImportRow {
  const errors: string[] = []
  const warnings: string[] = []

  const full_name = (row.full_name || '').trim()
  const admission_number = (row.admission_number || '').trim()
  const grade_name = (row.grade_name || '').trim()

  if (!full_name) errors.push('Full name is required')
  else if (full_name.length < 3) errors.push('Full name too short')

  if (!admission_number) errors.push('Admission number is required')

  if (!grade_name) errors.push('Grade is required')

  // Match grade (flexible: "Grade 4", "G4", "4", "Std 4", "PP1")
  let grade_id: string | undefined
  if (grade_name) {
    const match = grades.find(g => {
      const gn = g.name.toLowerCase()
      const gn2 = grade_name.toLowerCase()
      return gn === gn2
        || gn.replace(/\s/g, '') === gn2.replace(/\s/g, '')
        || g.code.toLowerCase() === gn2.replace(/\s/g, '')
        || gn.includes(gn2)
        || gn2.includes(gn)
    })
    if (!match) errors.push(`Grade "${grade_name}" not found — check grade names in Fee Structure`)
    else grade_id = match.id
  }

  // Gender validation
  const gender = (row.gender || '').toLowerCase().trim()
  if (gender && !['male', 'female', 'm', 'f', 'boy', 'girl'].includes(gender)) {
    warnings.push(`Gender "${row.gender}" not recognized — will be skipped`)
  }

  // Phone validation
  const phone = (row.guardian_phone || '').replace(/\s/g, '')
  if (phone && !/^(07|01|2547|2541|\+2547|\+2541)\d{7,8}$/.test(phone)) {
    warnings.push('Guardian phone number format may be invalid')
  }

  return {
    full_name,
    admission_number,
    grade_name,
    grade_id,
    gender: gender ? (['m', 'boy'].includes(gender) ? 'male' : ['f', 'girl'].includes(gender) ? 'female' : gender) : undefined,
    date_of_birth: row.date_of_birth?.trim() || undefined,
    guardian_name: row.guardian_name?.trim() || undefined,
    guardian_phone: phone || undefined,
    guardian_email: row.guardian_email?.trim() || undefined,
    guardian_relationship: row.guardian_relationship?.trim() || 'Parent',
    errors,
    warnings,
    valid: errors.length === 0,
  }
}

export interface ParseResult {
  rows: StudentImportRow[]
  totalRows: number
  validRows: number
  invalidRows: number
  missingColumns: string[]
}

export function parseStudentCSV(csvText: string, grades: Grade[]): ParseResult {
  const { data, meta } = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
  })

  const headers = (meta.fields || []) as string[]
  const missingColumns = REQUIRED_COLS.filter(c => !headers.includes(c))

  const rows: StudentImportRow[] = (data as Record<string, string>[]).map(row =>
    validateRow(row, grades)
  )

  return {
    rows,
    totalRows: rows.length,
    validRows: rows.filter(r => r.valid).length,
    invalidRows: rows.filter(r => !r.valid).length,
    missingColumns,
  }
}

// ─── Generate a sample CSV template ──────────────────────────────────────────
export function generateCSVTemplate(): string {
  const headers = [
    'full_name', 'admission_number', 'grade_name', 'gender',
    'date_of_birth', 'guardian_name', 'guardian_phone',
    'guardian_email', 'guardian_relationship',
  ]
  const sample = [
    ['Amara Wanjiku', 'GVA/2025/045', 'Grade 4', 'Female', '2015-03-12', 'Grace Wanjiku', '0712345678', 'grace@email.com', 'Mother'],
    ['Brian Otieno', 'GVA/2025/046', 'PP1', 'Male', '2020-07-22', 'John Otieno', '0723456789', '', 'Father'],
    ['Chloe Abdi', 'GVA/2025/047', 'Grade 8', 'Female', '2011-11-05', 'Fatuma Abdi', '0734567890', '', 'Mother'],
  ]
  return [headers.join(','), ...sample.map(r => r.join(','))].join('\n')
}
