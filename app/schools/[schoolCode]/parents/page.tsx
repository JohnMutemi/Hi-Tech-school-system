"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

export default function ParentsListPage() {
  const router = useRouter();
  const params = useParams();
  const schoolCode = params.schoolCode as string;
  const [parents, setParents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchParents() {
      setLoading(true);
      const res = await fetch(`/api/schools/${schoolCode}/parents`);
      if (res.ok) {
        setParents(await res.json());
      }
      setLoading(false);
    }
    if (schoolCode) fetchParents();
  }, [schoolCode]);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Parents</CardTitle>
          <Button asChild>
            <Link href={`/schools/${schoolCode}/parents/add`}>Add Parent</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : parents.length === 0 ? (
            <div>No parents found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parents.map((parent) => (
                  <TableRow key={parent.id}>
                    <TableCell>{parent.name}</TableCell>
                    <TableCell>{parent.phone}</TableCell>
                    <TableCell>{parent.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 