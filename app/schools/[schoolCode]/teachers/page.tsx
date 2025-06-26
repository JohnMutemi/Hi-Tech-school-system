"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"

export default function TeachersListPage() {
  const router = useRouter()
  const params = useParams()
  const schoolCode = params.schoolCode as string
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTeachers() {
      setLoading(true)
      const res = await fetch(`/api/schools/${schoolCode}/teachers`)
      if (res.ok) {
        setTeachers(await res.json())
      }
      setLoading(false)
    }
    if (schoolCode) fetchTeachers()
  }, [schoolCode])

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Teachers</CardTitle>
          <Button asChild>
            <Link href={`/schools/${schoolCode}/teachers/add`}>Add Teacher</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : teachers.length === 0 ? (
            <div>No teachers found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Subject</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>{teacher.name}</TableCell>
                    <TableCell>{teacher.email}</TableCell>
                    <TableCell>{teacher.subject}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 