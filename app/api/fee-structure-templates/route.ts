import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const templatesDir = path.join(process.cwd(), 'public', 'templates', 'fee-structures');
    
    // Check if templates directory exists
    if (!fs.existsSync(templatesDir)) {
      return NextResponse.json({ 
        error: 'Templates directory not found' 
      }, { status: 404 });
    }

    const files = fs.readdirSync(templatesDir);
    const csvFiles = files.filter(file => file.endsWith('.csv'));
    
    const templates = csvFiles.map(file => {
      const name = file.replace('.csv', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const description = getTemplateDescription(file);
      
      return {
        id: file.replace('.csv', ''),
        name,
        filename: file,
        description,
        downloadUrl: `/templates/fee-structures/${file}`
      };
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching fee structure templates:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch templates' 
    }, { status: 500 });
  }
}

function getTemplateDescription(filename: string): string {
  const descriptions: Record<string, string> = {
    'primary-school-template.csv': 'Comprehensive fee structure for primary schools (Grade 1-6) with essential and optional fees',
    'secondary-school-template.csv': 'Complete fee structure for secondary schools including laboratory and examination fees',
    'international-school-template.csv': 'Premium fee structure for international schools with advanced facilities and programs',
    'basic-school-template.csv': 'Simple and affordable fee structure for basic education institutions'
  };
  
  return descriptions[filename] || 'Fee structure template';
}



