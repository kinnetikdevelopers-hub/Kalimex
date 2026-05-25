import { useState, useRef, useCallback } from 'react'
import { Upload, Download, CheckCircle, XCircle, AlertTriangle, FileText, Users } from 'lucide-react'
import { SectionHeader, Card, Button, Badge } from '../../components/ui'
import { DEMO_GRADES, formatKES } from '../../lib/mockData'
import { parseStudentCSV, generateCSVTemplate, type StudentImportRow, type ParseResult } from '../../lib/csvImport'
import toast from 'react-hot-toast'

export default function ImportStudentsPage() {
  const [dragging, setDragging] = useState(false)
  const [result, setResult] = useState<ParseResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      toast.error('Please upload a CSV file')
      return
    }
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const parsed = parseStudentCSV(text, DEMO_GRADES)
      setResult(parsed)
      setImported(false)
    }
    reader.readAsText(file)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const downloadTemplate = () => {
    const csv = generateCSVTemplate()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'kalimex_student_import_template.csv'; a.click()
    URL.revokeObjectURL(url)
    toast.success('Template downloaded')
  }

  const handleImport = () => {
    if (!result) return
    setImporting(true)
    setTimeout(() => {
      setImporting(false)
      setImported(true)
      toast.success(`${result.validRows} students imported successfully!`)
    }, 2000)
  }

  const statusBadge = (row: StudentImportRow) => {
    if (!row.valid) return <Badge variant="red"><XCircle size={10} /> Invalid</Badge>
    if (row.warnings.length > 0) return <Badge variant="amber"><AlertTriangle size={10} /> Warning</Badge>
    return <Badge variant="green"><CheckCircle size={10} /> Ready</Badge>
  }

  return (
    <div className="animate-in">
      <SectionHeader
        title="Import Students"
        subtitle="Bulk upload students from a CSV file"
        action={
          <Button variant="secondary" icon={<Download size={14} />} onClick={downloadTemplate}>
            Download Template
          </Button>
        }
      />

      {/* Instructions */}
      <Card style={{ marginBottom: 20, padding: '16px 20px' }}>
        <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={16} style={{ color: 'var(--green)' }} /> How to Import
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { step: '1', title: 'Download Template', desc: 'Get the CSV template with the correct column headers' },
            { step: '2', title: 'Fill in Students', desc: 'Add student details in Excel or Google Sheets, save as CSV' },
            { step: '3', title: 'Upload & Import', desc: 'Drag and drop the file — Kalimex validates and imports instantly' },
          ].map(s => (
            <div key={s.step} style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--ink)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{s.step}</div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{s.title}</p>
                <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--surface)', borderRadius: 8 }}>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>
            <strong style={{ color: 'var(--ink)' }}>Required columns:</strong> full_name, admission_number, grade_name &nbsp;·&nbsp;
            <strong style={{ color: 'var(--ink)' }}>Optional:</strong> gender, date_of_birth, guardian_name, guardian_phone, guardian_email &nbsp;·&nbsp;
            <strong style={{ color: 'var(--ink)' }}>Accepted grade formats:</strong> "Grade 4", "PP1", "G4", "Standard 6"
          </p>
        </div>
      </Card>

      {/* Drop zone */}
      {!result && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--green)' : 'var(--line)'}`,
            borderRadius: 16, padding: '60px 40px', textAlign: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
            background: dragging ? 'var(--green-light)' : 'var(--white)',
            marginBottom: 20,
          }}
        >
          <input ref={fileRef} type="file" accept=".csv,.txt" onChange={onFileChange} style={{ display: 'none' }} />
          <Upload size={40} style={{ color: dragging ? 'var(--green)' : 'var(--muted)', margin: '0 auto 16px' }} />
          <p style={{ fontSize: 16, fontWeight: 700, color: dragging ? 'var(--green)' : 'var(--ink)', marginBottom: 6 }}>
            {dragging ? 'Drop to upload' : 'Drag & drop your CSV here'}
          </p>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>or click to browse files</p>
          <div style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 10, border: '1.5px solid var(--line)', fontSize: 13, color: 'var(--ink-3)' }}>
            Select CSV File
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Summary bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { label: 'Total Rows', value: result.totalRows, color: 'var(--ink)' },
              { label: 'Ready to Import', value: result.validRows, color: 'var(--green)' },
              { label: 'Errors', value: result.invalidRows, color: result.invalidRows > 0 ? 'var(--red)' : 'var(--green)' },
              { label: 'Missing Columns', value: result.missingColumns.length, color: result.missingColumns.length > 0 ? 'var(--red)' : 'var(--green)' },
            ].map(s => (
              <Card key={s.label} style={{ padding: '14px 18px' }}>
                <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{s.label}</p>
                <p style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</p>
              </Card>
            ))}
          </div>

          {/* Missing columns warning */}
          {result.missingColumns.length > 0 && (
            <Card style={{ background: 'var(--red-light)', border: '1px solid var(--red)', padding: '14px 18px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)', marginBottom: 4 }}>⚠ Missing Required Columns</p>
              <p style={{ fontSize: 13, color: 'var(--red)' }}>
                Your file is missing: <strong>{result.missingColumns.join(', ')}</strong>. Download the template to see the correct column names.
              </p>
            </Card>
          )}

          {/* Imported success */}
          {imported && (
            <Card style={{ background: 'var(--green-light)', border: '1px solid var(--green)', padding: '14px 18px' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>✓ {result.validRows} students imported successfully!</p>
              <p style={{ fontSize: 13, color: 'var(--green)' }}>Students are now visible in the Students page. Invoices will be auto-generated at term start.</p>
            </Card>
          )}

          {/* Action bar */}
          {!imported && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Button variant="secondary" onClick={() => { setResult(null); if (fileRef.current) fileRef.current.value = '' }}>
                Upload Different File
              </Button>
              <Button
                icon={<Users size={14} />}
                loading={importing}
                disabled={result.validRows === 0 || result.missingColumns.length > 0}
                onClick={handleImport}
              >
                Import {result.validRows} Valid Students
              </Button>
              {result.invalidRows > 0 && (
                <p style={{ fontSize: 13, color: 'var(--amber)', marginLeft: 8 }}>
                  ⚠ {result.invalidRows} rows with errors will be skipped
                </p>
              )}
            </div>
          )}

          {/* Preview table */}
          <Card style={{ padding: 0 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 700 }}>Preview — First {Math.min(result.rows.length, 50)} rows</p>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>Showing {Math.min(result.rows.length, 50)} of {result.rows.length}</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--line)', background: 'var(--surface)' }}>
                    {['Status', 'Full Name', 'Adm. No.', 'Grade', 'Gender', 'Guardian', 'Phone', 'Issues'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.slice(0, 50).map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--surface)', background: !row.valid ? '#FFF5F5' : i % 2 === 0 ? 'var(--white)' : 'var(--surface)' }}>
                      <td style={{ padding: '10px 14px' }}>{statusBadge(row)}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: row.full_name ? 'var(--ink)' : 'var(--red)' }}>{row.full_name || '—'}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 12 }}>{row.admission_number || '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        {row.grade_id
                          ? <Badge variant="muted">{row.grade_name}</Badge>
                          : <span style={{ color: 'var(--red)', fontSize: 12 }}>{row.grade_name || '—'}</span>}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--ink-3)', textTransform: 'capitalize' }}>{row.gender || '—'}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--ink-3)' }}>{row.guardian_name || '—'}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 12 }}>{row.guardian_phone || '—'}</td>
                      <td style={{ padding: '10px 14px', maxWidth: 220 }}>
                        {row.errors.map(e => (
                          <p key={e} style={{ fontSize: 11, color: 'var(--red)', marginBottom: 2 }}>✕ {e}</p>
                        ))}
                        {row.warnings.map(w => (
                          <p key={w} style={{ fontSize: 11, color: 'var(--amber)', marginBottom: 2 }}>⚠ {w}</p>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
