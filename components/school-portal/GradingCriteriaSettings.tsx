"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type GradingCriteriaSettingsProps = {
  schoolCode: string;
};

export default function GradingCriteriaSettings({ schoolCode }: GradingCriteriaSettingsProps) {
  const [criteria, setCriteria] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [passMark, setPassMark] = useState("50");
  const [message, setMessage] = useState("");

  const loadCriteria = async () => {
    const response = await fetch(
      `/api/schools/${encodeURIComponent(schoolCode)}/grading/criteria`,
      { credentials: "include" }
    );
    if (response.ok) {
      const payload = await response.json();
      setCriteria(payload.data || []);
    }
  };

  useEffect(() => {
    loadCriteria();
  }, [schoolCode]);

  const createCriteria = async () => {
    setMessage("");
    const response = await fetch(
      `/api/schools/${encodeURIComponent(schoolCode)}/grading/criteria`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          description,
          passMark: Number(passMark || 50),
          isActive: criteria.length === 0,
        }),
      }
    );
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error || "Failed to create criteria.");
      return;
    }
    setName("");
    setDescription("");
    setPassMark("50");
    setMessage("Criteria created.");
    loadCriteria();
  };

  const activateCriteria = async (criteriaId: string) => {
    const response = await fetch(
      `/api/schools/${encodeURIComponent(schoolCode)}/grading/criteria/activate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ criteriaId }),
      }
    );
    const payload = await response.json();
    setMessage(response.ok ? "Active criteria updated." : payload.error || "Activation failed.");
    loadCriteria();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grading Criteria</CardTitle>
        <CardDescription>
          Admin-managed grading policy used by teacher auto-grading.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label>Criteria Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Pass Mark</Label>
            <Input value={passMark} onChange={(e) => setPassMark(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={createCriteria}>
              Add Criteria
            </Button>
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. WAEC-aligned grade bands"
          />
        </div>
        <div className="space-y-2">
          {(criteria || []).map((item) => (
            <div key={item.id} className="rounded border p-3 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-slate-500">
                  Pass Mark: {item.passMark}% {item.isActive ? " | Active" : ""}
                </p>
              </div>
              <Button
                variant={item.isActive ? "secondary" : "outline"}
                onClick={() => activateCriteria(item.id)}
                disabled={item.isActive}
              >
                {item.isActive ? "Active" : "Activate"}
              </Button>
            </div>
          ))}
          {criteria.length === 0 ? (
            <p className="text-sm text-slate-500">No grading criteria yet.</p>
          ) : null}
        </div>
        {message ? <p className="text-sm">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
