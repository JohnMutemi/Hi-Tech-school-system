"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DebugParentChildrenProps {
  schoolCode: string;
  parentId: string;
}

export default function DebugParentChildren({ schoolCode, parentId }: DebugParentChildrenProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      console.log('🔍 Debug: Fetching data for:', { schoolCode, parentId });
      
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      const apiUrl = `${baseUrl}/api/schools/${schoolCode}/parents/${parentId}`;
      
      console.log('🌐 Debug: API URL:', apiUrl);
      
      const res = await fetch(apiUrl);
      
      console.log('📡 Debug: Response status:', res.status);
      
      if (res.ok) {
        const responseData = await res.json();
        console.log('✅ Debug: Response data:', responseData);
        setData(responseData);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Debug: API error:', errorData);
        setError(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (e: any) {
      console.error('💥 Debug: Fetch error:', e);
      setError(e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolCode && parentId) {
      fetchData();
    }
  }, [schoolCode, parentId]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Parent-Child Debug Tool
          <Badge variant={error ? "destructive" : data ? "default" : "secondary"}>
            {error ? "Error" : data ? "Success" : "Loading"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>School Code:</strong> {schoolCode}
          </div>
          <div>
            <strong>Parent ID:</strong> {parentId}
          </div>
        </div>

        <Button onClick={fetchData} disabled={loading}>
          {loading ? "Loading..." : "Refresh Data"}
        </Button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-semibold text-red-800">Error:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {data && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Parent Data:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(data.parent, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">
                Children Data ({data.students?.length || 0} children):
              </h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                {JSON.stringify(data.students, null, 2)}
              </pre>
            </div>

            {data.students && data.students.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Children Summary:</h3>
                <div className="grid gap-2">
                  {data.students.map((child: any, index: number) => (
                    <div key={child.id} className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="font-medium">{index + 1}. {child.name}</div>
                      <div className="text-sm text-gray-600">
                        ID: {child.id} | Class: {child.className} | Grade: {child.gradeName}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
