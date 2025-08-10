"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Download } from "lucide-react"
import * as XLSX from "xlsx"
import Papa from "papaparse"

export interface BulkImportProps {
  entityType: 'students' | 'teachers' | 'classes' | 'fee-structures' | 'grades' | 'subjects'
  schoolCode: string
  onSuccess?: (result: ImportResult) => void
  onError?: (error: string) => void
  className?: string
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg'
}

export interface ImportResult {
  created: any[]
  errors: any[]
  total: number
  success: boolean
}

export interface ImportTemplate {
  headers: string[]
  required: string[]
  optional: string[]
  description: string
  example: Record<string, any>
}

const IMPORT_TEMPLATES: Record<string, ImportTemplate> = {
  students: {
    headers: ['Name', 'Admission Number', 'Email', 'Date of Birth', 'Gender', 'Address', 'Parent Name', 'Parent Email', 'Parent Phone', 'Class', 'Status', 'Notes'],
    required: ['Name', 'Admission Number', 'Parent Name', 'Parent Phone'],
    optional: ['Email', 'Date of Birth', 'Gender', 'Address', 'Parent Email', 'Class', 'Status', 'Notes'],
    description: 'Import students with their parent information. Class names should match existing classes in your school.',
    example: {
      'Name': 'John Doe',
      'Admission Number': 'ADM001',
      'Email': 'john.doe@school.com',
      'Date of Birth': '2010-05-15',
      'Gender': 'Male',
      'Address': '123 Main St',
      'Parent Name': 'Jane Doe',
      'Parent Email': 'jane.doe@email.com',
      'Parent Phone': '+254700000000',
      'Class': 'Form 1A',
      'Status': 'active',
      'Notes': 'New student'
    }
  },
  teachers: {
    headers: ['Name', 'Email', 'Phone', 'Employee ID', 'Qualification', 'Date Joined', 'Assigned Class', 'Academic Year', 'Status'],
    required: ['Name', 'Email', 'Phone'],
    optional: ['Employee ID', 'Qualification', 'Date Joined', 'Assigned Class', 'Academic Year', 'Status'],
    description: 'Import teachers with their qualifications and assignments. Phone numbers should include country code (e.g., +254700000001). Dates should be in YYYY-MM-DD format.',
    example: {
      'Name': 'Jane Smith',
      'Email': 'jane.smith@school.com',
      'Phone': '+254700000001',
      'Employee ID': 'EMP001',
      'Qualification': 'B.Ed Mathematics',
      'Date Joined': '2024-01-15',
      'Assigned Class': 'Form 1A',
      'Academic Year': '2024',
      'Status': 'active'
    }
  },
  classes: {
    headers: ['Name', 'Grade', 'Teacher Email', 'Academic Year', 'Is Active'],
    required: ['Name', 'Grade', 'Academic Year'],
    optional: ['Teacher Email', 'Is Active'],
    description: 'Import classes with grade and teacher assignments',
    example: {
      'Name': 'Form 1A',
      'Grade': 'Form 1',
      'Teacher Email': 'jane.smith@school.com',
      'Academic Year': '2024',
      'Is Active': 'TRUE'
    }
  },
  'fee-structures': {
    headers: ['Name', 'Description', 'Amount', 'Frequency', 'Due Date', 'Is Active'],
    required: ['Name', 'Amount', 'Frequency'],
    optional: ['Description', 'Due Date', 'Is Active'],
    description: 'Import fee structures for different categories',
    example: {
      'Name': 'Tuition Fee',
      'Description': 'Monthly tuition fee',
      'Amount': '5000',
      'Frequency': 'monthly',
      'Due Date': '2024-02-01',
      'Is Active': 'TRUE'
    }
  },
  grades: {
    headers: ['Name', 'Is Alumni'],
    required: ['Name'],
    optional: ['Is Alumni'],
    description: 'Import grade levels',
    example: {
      'Name': 'Form 1',
      'Is Alumni': 'FALSE'
    }
  },
  subjects: {
    headers: ['Name', 'Code', 'Description', 'Teacher Email'],
    required: ['Name', 'Code'],
    optional: ['Description', 'Teacher Email'],
    description: 'Import subjects with teacher assignments',
    example: {
      'Name': 'Mathematics',
      'Code': 'MATH101',
      'Description': 'Core mathematics subject',
      'Teacher Email': 'jane.smith@school.com'
    }
  }
}

export function BulkImport({ 
  entityType, 
  schoolCode, 
  onSuccess, 
  onError, 
  className,
  variant = 'default',
  size = 'default'
}: BulkImportProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string>("")
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const template = IMPORT_TEMPLATES[entityType]

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setError("")
    setData([])
    setResult(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const ext = selectedFile.name.split('.').pop()?.toLowerCase()
        let rows: any[] = []

        if (ext === 'csv') {
          const parsed = Papa.parse(event.target?.result as string, { header: true })
          rows = parsed.data
        } else if (['xlsx', 'xls'].includes(ext || '')) {
          const workbook = XLSX.read(event.target?.result, { type: 'binary' })
          const sheet = workbook.Sheets[workbook.SheetNames[0]]
          rows = XLSX.utils.sheet_to_json(sheet)
        } else {
          setError("Unsupported file type. Please use CSV or Excel files.")
          return
        }

        // Validate required fields
        const requiredFields = template.required
        const missingFields = requiredFields.filter(field => 
          !rows[0] || !rows[0][field]
        )

        if (missingFields.length > 0) {
          setError(`Missing required fields: ${missingFields.join(', ')}`)
          return
        }

        setData(rows)
      } catch (err: any) {
        setError(`Failed to parse file: ${err.message}`)
      }
    }

    if (selectedFile.name.endsWith('.csv')) {
      reader.readAsText(selectedFile)
    } else {
      reader.readAsBinaryString(selectedFile)
    }
  }

  const handleImport = async () => {
    if (!file || data.length === 0) return

    setIsLoading(true)
    setProgress(0)
    setError("")

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/schools/${schoolCode}/${entityType}/import`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setResult(result)
        setProgress(100)
        onSuccess?.(result)
        setTimeout(() => {
          setIsOpen(false)
          setFile(null)
          setData([])
          setResult(null)
          setProgress(0)
        }, 2000)
      } else {
        setError(result.error || 'Import failed')
        onError?.(result.error || 'Import failed')
      }
    } catch (err: any) {
      setError(`Import failed: ${err.message}`)
      onError?.(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const downloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([template.example])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, entityType)
    XLSX.writeFile(workbook, `${entityType}-template.xlsx`)
  }

  const resetForm = () => {
    setFile(null)
    setData([])
    setError("")
    setResult(null)
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant={variant}
        size={size}
        className={className}
      >
        <Upload className="w-4 h-4 mr-2" />
        Import {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Import {entityType.charAt(0).toUpperCase() + entityType.slice(1)}</DialogTitle>
            <DialogDescription>
              {template.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Template Download */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h4 className="font-medium text-blue-900">Download Template</h4>
                <p className="text-sm text-blue-700">Get the correct format for your data</p>
              </div>
              <Button onClick={downloadTemplate} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">CSV or Excel files only</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>

              {file && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">{file.name}</span>
                  <span className="text-xs text-green-600">({data.length} rows)</span>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-800">{error}</span>
              </div>
            )}

            {/* Data Preview */}
            {data.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Data Preview ({data.length} rows)</h4>
                <div className="max-h-64 overflow-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {template.headers.map((header) => (
                          <TableHead key={header} className="text-xs">
                            {header}
                            {template.required.includes(header) && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.slice(0, 5).map((row, index) => (
                        <TableRow key={index}>
                          {template.headers.map((header) => (
                            <TableCell key={header} className="text-xs">
                              {row[header] || '-'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {data.length > 5 && (
                    <div className="p-2 text-center text-xs text-gray-500">
                      Showing first 5 rows of {data.length} total rows
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Progress */}
            {isLoading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Importing...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">Import Complete</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Created: {result.created.length}
                      </span>
                    </div>
                  </div>
                  
                  {result.errors.length > 0 && (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800">
                          Errors: {result.errors.length}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {result.errors.length > 0 && (
                  <div className="max-h-32 overflow-auto">
                    <h5 className="text-sm font-medium text-red-800 mb-2">Errors:</h5>
                    <div className="space-y-1">
                      {result.errors.slice(0, 5).map((error: any, index: number) => (
                        <div key={index} className="text-xs text-red-700">
                          {error[entityType.slice(0, -1)] || 'Unknown'}: {error.error}
                        </div>
                      ))}
                      {result.errors.length > 5 && (
                        <div className="text-xs text-red-600">
                          ... and {result.errors.length - 5} more errors
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            {!isLoading && !result && (
              <>
                <Button variant="outline" onClick={resetForm}>
                  Reset
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={!file || data.length === 0}
                >
                  Import {data.length > 0 ? `(${data.length} items)` : ''}
                </Button>
              </>
            )}
            {result && (
              <Button onClick={() => setIsOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 