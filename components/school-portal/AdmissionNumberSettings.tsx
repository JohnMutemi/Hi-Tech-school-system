import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Settings, Hash, CheckCircle, AlertCircle, Save, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function getNextAdmissionNumber(lastAdmissionNumber: string): string {
  if (!lastAdmissionNumber) return '';
  const match = lastAdmissionNumber.match(/(\d+)(?!.*\d)/);
  if (match) {
    const number = match[1];
    const next = (parseInt(number, 10) + 1).toString().padStart(number.length, '0');
    return lastAdmissionNumber.replace(/(\d+)(?!.*\d)/, next);
  }
  return lastAdmissionNumber + '1';
}

export default function AdmissionNumberSettings({ schoolCode }: { schoolCode: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    lastAdmissionNumber: '',
    admissionNumberAutoIncrement: true,
  });
  const [nextPreview, setNextPreview] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!schoolCode) return;
    setLoading(true);
    fetch(`/api/schools/${schoolCode}`)
      .then(res => res.json())
      .then(data => {
        setSettings({
          lastAdmissionNumber: data.lastAdmissionNumber || '',
          admissionNumberAutoIncrement: data.admissionNumberAutoIncrement !== false,
        });
        setLoading(false);
        
        // Generate preview based on school settings
        if (data.admissionNumberAutoIncrement && data.lastAdmissionNumber) {
          setNextPreview(getNextAdmissionNumber(data.lastAdmissionNumber));
        } else {
          setNextPreview('ADM001');
        }
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive"
        });
        setLoading(false);
      });
  }, [schoolCode]);

  useEffect(() => {
    if (settings.admissionNumberAutoIncrement && settings.lastAdmissionNumber) {
      setNextPreview(getNextAdmissionNumber(settings.lastAdmissionNumber));
    } else {
      setNextPreview('ADM001');
    }
  }, [settings.lastAdmissionNumber, settings.admissionNumberAutoIncrement]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/schools/${schoolCode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to save settings');
      
      toast({
        title: "Success!",
        description: "Admission number settings updated successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading admission settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 rounded-2xl bg-gradient-to-br from-white to-blue-50/30">
      <CardHeader className="border-b border-blue-100/50 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Hash className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-gray-800">Admission Number Settings</span>
            <div className="text-sm text-gray-600 font-normal mt-1">
              Configure automatic admission number generation
            </div>
          </div>
        </CardTitle>
        <CardDescription className="text-gray-600 mt-2">
          Set your school's last used admission number. The system will automatically increment for new students.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Auto-increment toggle */}
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <Label htmlFor="auto-increment" className="text-base font-medium text-gray-800">
                  Enable Auto-Increment
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Automatically generate sequential admission numbers
                </p>
              </div>
            </div>
            <Switch
              id="auto-increment"
              checked={settings.admissionNumberAutoIncrement}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, admissionNumberAutoIncrement: checked }))
              }
            />
          </div>

          {/* Last admission number input */}
          <div className="space-y-4">
            <Label htmlFor="last-admission" className="text-base font-medium text-gray-800">
              Last Used Admission Number
            </Label>
            <Input
              id="last-admission"
              name="lastAdmissionNumber"
              value={settings.lastAdmissionNumber}
              onChange={handleChange}
              placeholder="e.g. ADM001, STU101, 2024001"
              className="text-lg py-3 bg-white border-gray-200 focus:border-blue-400 focus:ring-blue-100"
            />
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 leading-relaxed">
                <strong>Examples:</strong> Enter the last number used in your school.
              </p>
              <div className="mt-2 flex flex-wrap gap-4 text-xs">
                <span className="font-mono bg-white px-2 py-1 rounded border">
                  ADM101 → ADM102
                </span>
                <span className="font-mono bg-white px-2 py-1 rounded border">
                  STU001 → STU002
                </span>
                <span className="font-mono bg-white px-2 py-1 rounded border">
                  2024001 → 2024002
                </span>
              </div>
            </div>
          </div>

          {/* Preview section */}
          <div className="space-y-4">
            <Label className="text-base font-medium text-gray-800">
              Next Admission Number Preview
            </Label>
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-emerald-800 font-medium mb-1">Next Student Will Get:</p>
                <div className="text-2xl font-mono font-bold text-emerald-700">
                  {nextPreview || (
                    <span className="text-gray-400 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      No preview available
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Save button */}
          <Button
            type="submit"
            disabled={saving}
            className="w-full py-3 text-base font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving Settings...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Settings
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 