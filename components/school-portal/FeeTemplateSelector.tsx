"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Upload, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FeeTemplate {
  id: string;
  name: string;
  filename: string;
  description: string;
  downloadUrl: string;
}

interface FeeTemplateItem {
  Name: string;
  Description: string;
  Amount: number;
  Frequency: string;
  'Due Date': string;
  'Is Active': string;
}

interface FeeTemplateSelectorProps {
  schoolCode: string;
  onTemplateSelected?: (template: FeeTemplate) => void;
  onTemplateImported?: () => void;
  colorTheme?: string;
}

export function FeeTemplateSelector({ 
  schoolCode, 
  onTemplateSelected, 
  onTemplateImported,
  colorTheme = "#3b82f6"
}: FeeTemplateSelectorProps) {
  const [templates, setTemplates] = useState<FeeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<FeeTemplate | null>(null);
  const [previewData, setPreviewData] = useState<FeeTemplateItem[]>([]);
  const [importing, setImporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/fee-structure-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      } else {
        throw new Error('Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load fee structure templates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewTemplate = async (template: FeeTemplate) => {
    try {
      const response = await fetch(template.downloadUrl);
      const csvText = await response.text();
      const lines = csvText.split('\n');
      const headers = lines[0].split(',');
      
      const data: FeeTemplateItem[] = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',');
          const item: any = {};
          headers.forEach((header, index) => {
            item[header.trim()] = values[index]?.trim() || '';
          });
          return item as FeeTemplateItem;
        });

      setPreviewData(data);
      setSelectedTemplate(template);
      setShowPreview(true);
    } catch (error) {
      console.error('Error previewing template:', error);
      toast({
        title: "Error",
        description: "Failed to preview template",
        variant: "destructive"
      });
    }
  };

  const handleImportTemplate = async (template: FeeTemplate) => {
    setImporting(true);
    try {
      // Download the template file
      const response = await fetch(template.downloadUrl);
      const blob = await response.blob();
      
      // Create FormData to upload
      const formData = new FormData();
      formData.append('file', blob, template.filename);

      // Import the template
      const importResponse = await fetch(`/api/schools/${schoolCode}/fee-structure/import`, {
        method: 'POST',
        body: formData
      });

      if (importResponse.ok) {
        const result = await importResponse.json();
        toast({
          title: "Success!",
          description: `Successfully imported ${result.created?.length || 0} fee structures`,
        });
        
        if (onTemplateImported) {
          onTemplateImported();
        }
      } else {
        const error = await importResponse.json();
        throw new Error(error.error || 'Import failed');
      }
    } catch (error) {
      console.error('Error importing template:', error);
      toast({
        title: "Error",
        description: "Failed to import fee structure template",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = (template: FeeTemplate) => {
    const link = document.createElement('a');
    link.href = template.downloadUrl;
    link.download = template.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Downloaded",
      description: `Template downloaded: ${template.name}`,
    });

    if (onTemplateSelected) {
      onTemplateSelected(template);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colorTheme }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Choose a Fee Structure Template</h3>
        <p className="text-sm text-gray-600">
          Select a pre-built template that matches your school type, or download and customize before importing
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" style={{ color: colorTheme }} />
                {template.name}
              </CardTitle>
              <CardDescription className="text-sm">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreviewTemplate(template)}
                  className="flex items-center gap-1"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadTemplate(template)}
                  className="flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleImportTemplate(template)}
                  disabled={importing}
                  className="flex items-center gap-1"
                  style={{ backgroundColor: colorTheme }}
                >
                  <Upload className="h-4 w-4" />
                  {importing ? 'Importing...' : 'Import Now'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Preview of fee structure items in this template
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Amount (KES)</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Frequency</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-medium">{item.Name}</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm">{item.Description}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        {Number(item.Amount).toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <Badge variant="outline">{item.Frequency}</Badge>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <Badge variant={item['Is Active'] === 'TRUE' ? 'default' : 'secondary'}>
                          {item['Is Active'] === 'TRUE' ? 'Active' : 'Optional'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close
              </Button>
              {selectedTemplate && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadTemplate(selectedTemplate)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download to Edit
                  </Button>
                  <Button
                    onClick={() => handleImportTemplate(selectedTemplate)}
                    disabled={importing}
                    style={{ backgroundColor: colorTheme }}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    {importing ? 'Importing...' : 'Import Template'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}



