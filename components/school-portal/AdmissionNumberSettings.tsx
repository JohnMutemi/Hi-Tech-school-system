import { useEffect, useState } from 'react';

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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState({
    lastAdmissionNumber: '',
  });
  const [nextPreview, setNextPreview] = useState('');

  useEffect(() => {
    if (!schoolCode) return;
    setLoading(true);
    fetch(`/api/schools/${schoolCode}`)
      .then(res => res.json())
      .then(data => {
        setSettings({
          lastAdmissionNumber: data.lastAdmissionNumber || '',
        });
        setLoading(false);
        setTimeout(() => setNextPreview(getNextAdmissionNumber(data.lastAdmissionNumber || '')), 0);
      })
      .catch(() => {
        setError('Failed to load settings');
        setLoading(false);
      });
  }, [schoolCode]);

  useEffect(() => {
    setNextPreview(getNextAdmissionNumber(settings.lastAdmissionNumber));
  }, [settings.lastAdmissionNumber]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ lastAdmissionNumber: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/schools/${schoolCode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to save settings');
      setSuccess('Settings updated successfully');
    } catch (err) {
      setError('Failed to save settings');
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-2xl font-semibold mb-1 text-gray-900 tracking-tight">Admission Number Settings</h2>
      <p className="mb-7 text-gray-500 text-sm leading-relaxed">Set your school's last used or first admission number. The system will automatically increment for each new student.</p>
      <form onSubmit={handleSubmit} className="space-y-7">
        <div>
          <label className="block font-medium mb-1 text-gray-800 text-sm">Last Used Admission Number</label>
          <input
            type="text"
            name="lastAdmissionNumber"
            value={settings.lastAdmissionNumber}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-base focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-gray-50 text-gray-900 placeholder-gray-300 transition outline-none shadow-sm"
            placeholder="e.g. T001, ADM104, 9787"
          />
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
            Enter the <span className="font-semibold text-gray-700">last admission number</span> used in your school. For new schools, enter the <span className="font-semibold text-gray-700">first admission number</span> you want to use.<br />
            The system will automatically increment the number for each new student, regardless of format.<br />
            <span className="block mt-1"><b>Examples:</b> <span className="font-mono text-blue-700">T001</span> → <span className="font-mono text-blue-700">T002</span>, <span className="font-mono text-blue-700">ADM104</span> → <span className="font-mono text-blue-700">ADM105</span>, <span className="font-mono text-blue-700">9787</span> → <span className="font-mono text-blue-700">9788</span></span>
          </p>
        </div>
        <div>
          <label className="block font-medium mb-1 text-gray-800 text-sm">Preview Next Admission Number</label>
          <div className="bg-gray-50 rounded-md px-4 py-2.5 text-lg font-mono text-blue-700 border border-gray-200 shadow-sm">
            {nextPreview || <span className="text-gray-300">—</span>}
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-md font-semibold shadow-sm hover:bg-blue-700 transition text-base tracking-wide"
        >
          Save Settings
        </button>
        {error && <div className="text-red-600 text-sm text-center mt-2 font-medium">{error}</div>}
        {success && <div className="text-green-600 text-sm text-center mt-2 font-medium">{success}</div>}
      </form>
    </div>
  );
} 