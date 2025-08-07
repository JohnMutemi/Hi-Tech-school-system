"use client";

import React from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface StudentData {
  Name: string;
  'Admission Number': string;
  Email: string;
  'Date of Birth': string;
  Gender: string;
  Address: string;
  'Parent Name': string;
  'Parent Email': string;
  'Parent Phone': string;
  Class: string;
  Status: string;
  Notes: string;
}

const ExcelGenerator: React.FC = () => {
  const studentData: StudentData[] = [
    {
      Name: "Ethan Kipkorir",
      'Admission Number': "ADM101",
      Email: "ethan.kipkorir@school.com",
      'Date of Birth': "2013-02-17",
      Gender: "Male",
      Address: "42 Main St",
      'Parent Name': "Mercy Kipkorir",
      'Parent Email': "mercy.kipkorir@email.com",
      'Parent Phone': "254711223344",
      Class: "Grade 1A",
      Status: "active",
      Notes: "New student"
    },
    {
      Name: "Faith Atieno",
      'Admission Number': "ADM102",
      Email: "faith.atieno@school.com",
      'Date of Birth': "2012-08-25",
      Gender: "Female",
      Address: "17 Riverside Rd",
      'Parent Name': "George Atieno",
      'Parent Email': "george.atieno@email.com",
      'Parent Phone': "254722334455",
      Class: "Grade 1A",
      Status: "active",
      Notes: "Sibling in same school"
    },
    {
      Name: "Brian Omondi",
      'Admission Number': "ADM103",
      Email: "brian.omondi@school.com",
      'Date of Birth': "2011-11-02",
      Gender: "Male",
      Address: "89 Highview Ave",
      'Parent Name': "Clara Omondi",
      'Parent Email': "clara.omondi@email.com",
      'Parent Phone': "254733445566",
      Class: "Grade 1A",
      Status: "active",
      Notes: "Transferred from another school"
    },
    {
      Name: "Naomi Njeri",
      'Admission Number': "ADM104",
      Email: "naomi.njeri@school.com",
      'Date of Birth': "2010-09-18",
      Gender: "Female",
      Address: "76 Sunridge Blvd",
      'Parent Name': "James Njeri",
      'Parent Email': "james.njeri@email.com",
      'Parent Phone': "254744556677",
      Class: "Grade 1A",
      Status: "active",
      Notes: "New admission"
    },
    {
      Name: "Samuel Mwangi",
      'Admission Number': "ADM105",
      Email: "samuel.mwangi@school.com",
      'Date of Birth': "2012-01-09",
      Gender: "Male",
      Address: "34 Oak Lane",
      'Parent Name': "Mary Mwangi",
      'Parent Email': "mary.mwangi@email.com",
      'Parent Phone': "254755667788",
      Class: "Grade 1A",
      Status: "active",
      Notes: "Scholarship recipient"
    },
    {
      Name: "Linet Chebet",
      'Admission Number': "ADM106",
      Email: "linet.chebet@school.com",
      'Date of Birth': "2011-06-21",
      Gender: "Female",
      Address: "58 Hilltop Dr",
      'Parent Name': "David Chebet",
      'Parent Email': "david.chebet@email.com",
      'Parent Phone': "254766778899",
      Class: "Grade 1A",
      Status: "active",
      Notes: "New student"
    },
    {
      Name: "Victor Ochieng",
      'Admission Number': "ADM107",
      Email: "victor.ochieng@school.com",
      'Date of Birth': "2011-07-22",
      Gender: "Male",
      Address: "11 Cedar Way",
      'Parent Name': "Joyce Ochieng",
      'Parent Email': "joyce.ochieng@email.com",
      'Parent Phone': "254712345678",
      Class: "Grade 2A",
      Status: "active",
      Notes: "New admission"
    },
    {
      Name: "Emily Wanjiku",
      'Admission Number': "ADM108",
      Email: "emily.wanjiku@school.com",
      'Date of Birth': "2010-03-15",
      Gender: "Female",
      Address: "99 Riverbank Rd",
      'Parent Name': "Peter Wanjiku",
      'Parent Email': "peter.wanjiku@email.com",
      'Parent Phone': "254723456789",
      Class: "Grade 2A",
      Status: "active",
      Notes: "Transferred from another school"
    },
    {
      Name: "Joseph Kiptoo",
      'Admission Number': "ADM109",
      Email: "joseph.kiptoo@school.com",
      'Date of Birth': "2011-10-30",
      Gender: "Male",
      Address: "56 Garden Rd",
      'Parent Name': "Grace Kiptoo",
      'Parent Email': "grace.kiptoo@email.com",
      'Parent Phone': "254734567890",
      Class: "Grade 2A",
      Status: "active",
      Notes: "Sibling in same school"
    },
    {
      Name: "Winnie Achieng",
      'Admission Number': "ADM110",
      Email: "winnie.achieng@school.com",
      'Date of Birth': "2009-12-11",
      Gender: "Female",
      Address: "78 Elm Str",
      'Parent Name': "Patrick Achieng",
      'Parent Email': "patrick.achieng@email.com",
      'Parent Phone': "254745678901",
      Class: "Grade 2A",
      Status: "active",
      Notes: "Scholarship recipient"
    },
    {
      Name: "Eric Njoroge",
      'Admission Number': "ADM111",
      Email: "eric.njoroge@school.com",
      'Date of Birth': "2012-05-27",
      Gender: "Male",
      Address: "22 Maple Drive",
      'Parent Name': "Susan Njoroge",
      'Parent Email': "susan.njoroge@email.com",
      'Parent Phone': "254756789012",
      Class: "Grade 2A",
      Status: "active",
      Notes: "New student"
    },
    {
      Name: "Brenda Kiplagat",
      'Admission Number': "ADM112",
      Email: "brenda.kiplagat@school.com",
      'Date of Birth': "2010-08-08",
      Gender: "Female",
      Address: "83 Sunset Ave",
      'Parent Name': "Daniel Kiplagat",
      'Parent Email': "daniel.kiplagat@email.com",
      'Parent Phone': "254767890123",
      Class: "Grade 2A",
      Status: "active",
      Notes: "New admission"
    },
    {
      Name: "Collins Mwangi",
      'Admission Number': "ADM113",
      Email: "collins.mwangi@school.com",
      'Date of Birth': "2009-06-13",
      Gender: "Male",
      Address: "51 Pine Hill Rd",
      'Parent Name': "Lucy Mwangi",
      'Parent Email': "lucy.mwangi@email.com",
      'Parent Phone': "254778901234",
      Class: "Grade 3A",
      Status: "active",
      Notes: "Transferred from another school"
    },
    {
      Name: "Ruth Wambui",
      'Admission Number': "ADM114",
      Email: "ruth.wambui@school.com",
      'Date of Birth': "2008-12-19",
      Gender: "Female",
      Address: "36 Brookside Dr",
      'Parent Name': "Peter Wambui",
      'Parent Email': "peter.wambui@email.com",
      'Parent Phone': "254789012345",
      Class: "Grade 3A",
      Status: "active",
      Notes: "Scholarship recipient"
    },
    {
      Name: "Andrew Otieno",
      'Admission Number': "ADM115",
      Email: "andrew.otieno@school.com",
      'Date of Birth': "2010-04-25",
      Gender: "Male",
      Address: "69 Rosewood St",
      'Parent Name': "Milly Otieno",
      'Parent Email': "milly.otieno@email.com",
      'Parent Phone': "254700123456",
      Class: "Grade 3A",
      Status: "active",
      Notes: "New student"
    },
    {
      Name: "Catherine Chepngeno",
      'Admission Number': "ADM116",
      Email: "catherine.chepngeno@school.com",
      'Date of Birth': "2009-01-30",
      Gender: "Female",
      Address: "44 Greenfield Ct",
      'Parent Name': "Kiprono Chepngeno",
      'Parent Email': "kiprono.chepngeno@email.com",
      'Parent Phone': "254711234567",
      Class: "Grade 3A",
      Status: "active",
      Notes: "New admission"
    },
    {
      Name: "Dennis Kibet",
      'Admission Number': "ADM117",
      Email: "dennis.kibet@school.com",
      'Date of Birth': "2010-10-02",
      Gender: "Male",
      Address: "63 Windy Ridge",
      'Parent Name': "Agnes Kibet",
      'Parent Email': "agnes.kibet@email.com",
      'Parent Phone': "254722345678",
      Class: "Grade 3A",
      Status: "active",
      Notes: "Sibling in same school"
    },
    {
      Name: "Rose Mumbua",
      'Admission Number': "ADM118",
      Email: "rose.mumbua@school.com",
      'Date of Birth': "2009-09-14",
      Gender: "Female",
      Address: "80 Clearview Rd",
      'Parent Name': "Simon Mumbua",
      'Parent Email': "simon.mumbua@email.com",
      'Parent Phone': "254733456789",
      Class: "Grade 3A",
      Status: "active",
      Notes: "New admission"
    },
    {
      Name: "Mark Kipruto",
      'Admission Number': "ADM119",
      Email: "mark.kipruto@school.com",
      'Date of Birth': "2008-07-11",
      Gender: "Male",
      Address: "59 Eastwood Dr",
      'Parent Name': "Betty Kipruto",
      'Parent Email': "betty.kipruto@email.com",
      'Parent Phone': "254744567890",
      Class: "Grade 4A",
      Status: "active",
      Notes: "Transferred from another school"
    },
    {
      Name: "Terry Naliaka",
      'Admission Number': "ADM120",
      Email: "terry.naliaka@school.com",
      'Date of Birth': "2009-05-08",
      Gender: "Female",
      Address: "27 Bluebell Ave",
      'Parent Name': "Thomas Naliaka",
      'Parent Email': "thomas.naliaka@email.com",
      'Parent Phone': "254755678901",
      Class: "Grade 4A",
      Status: "active",
      Notes: "Scholarship recipient"
    },
    {
      Name: "Victor Muli",
      'Admission Number': "ADM121",
      Email: "victor.muli@school.com",
      'Date of Birth': "2008-10-19",
      Gender: "Male",
      Address: "88 Lakeview Ln",
      'Parent Name': "Ann Muli",
      'Parent Email': "ann.muli@email.com",
      'Parent Phone': "254766789012",
      Class: "Grade 4A",
      Status: "active",
      Notes: "New student"
    },
    {
      Name: "Grace Njoki",
      'Admission Number': "ADM122",
      Email: "grace.njoki@school.com",
      'Date of Birth': "2009-02-22",
      Gender: "Female",
      Address: "90 Sunset Blvd",
      'Parent Name': "Martin Njoki",
      'Parent Email': "martin.njoki@email.com",
      'Parent Phone': "254777890123",
      Class: "Grade 4A",
      Status: "active",
      Notes: "New admission"
    },
    {
      Name: "Isaac Otieno",
      'Admission Number': "ADM123",
      Email: "isaac.otieno@school.com",
      'Date of Birth': "2010-01-14",
      Gender: "Male",
      Address: "18 Sunrise Way",
      'Parent Name': "Beatrice Otieno",
      'Parent Email': "beatrice.otieno@email.com",
      'Parent Phone': "254788901234",
      Class: "Grade 4A",
      Status: "active",
      Notes: "Sibling in same school"
    },
    {
      Name: "Lucy Wamaitha",
      'Admission Number': "ADM124",
      Email: "lucy.wamaitha@school.com",
      'Date of Birth': "2009-04-09",
      Gender: "Female",
      Address: "29 Garden Estate",
      'Parent Name': "David Wamaitha",
      'Parent Email': "david.wamaitha@email.com",
      'Parent Phone': "254799012345",
      Class: "Grade 4A",
      Status: "active",
      Notes: "Transferred from another school"
    },
    {
      Name: "Kevin Chege",
      'Admission Number': "ADM125",
      Email: "kevin.chege@school.com",
      'Date of Birth': "2007-11-11",
      Gender: "Male",
      Address: "14 Northview Rd",
      'Parent Name': "Rose Chege",
      'Parent Email': "rose.chege@email.com",
      'Parent Phone': "254701234567",
      Class: "Grade 5A",
      Status: "active",
      Notes: "New student"
    },
    {
      Name: "Lilian Jepchirchir",
      'Admission Number': "ADM126",
      Email: "lilian.jepchirchir@school.com",
      'Date of Birth': "2008-03-03",
      Gender: "Female",
      Address: "33 Ridge Rd",
      'Parent Name': "Paul Jepchirchir",
      'Parent Email': "paul.jepchirchir@email.com",
      'Parent Phone': "254712345678",
      Class: "Grade 5A",
      Status: "active",
      Notes: "New admission"
    },
    {
      Name: "Michael Oduor",
      'Admission Number': "ADM127",
      Email: "michael.oduor@school.com",
      'Date of Birth': "2007-09-25",
      Gender: "Male",
      Address: "26 Mountain Rd",
      'Parent Name': "Elizabeth Oduor",
      'Parent Email': "elizabeth.oduor@email.com",
      'Parent Phone': "254723456789",
      Class: "Grade 5A",
      Status: "active",
      Notes: "Scholarship recipient"
    },
    {
      Name: "Agnes Nyambura",
      'Admission Number': "ADM128",
      Email: "agnes.nyambura@school.com",
      'Date of Birth': "2008-12-07",
      Gender: "Female",
      Address: "15 Valley Ct",
      'Parent Name': "James Nyambura",
      'Parent Email': "james.nyambura@email.com",
      'Parent Phone': "254734567890",
      Class: "Grade 5A",
      Status: "active",
      Notes: "Transferred from another school"
    },
    {
      Name: "Stephen Kiplangat",
      'Admission Number': "ADM129",
      Email: "stephen.kiplangat@school.com",
      'Date of Birth': "2009-06-18",
      Gender: "Male",
      Address: "12 Bayview Dr",
      'Parent Name': "Mercy Kiplangat",
      'Parent Email': "mercy.kiplangat@email.com",
      'Parent Phone': "254745678901",
      Class: "Grade 5A",
      Status: "active",
      Notes: "Sibling in same school"
    },
    {
      Name: "Purity Wanjiru",
      'Admission Number': "ADM130",
      Email: "purity.wanjiru@school.com",
      'Date of Birth': "2008-05-02",
      Gender: "Female",
      Address: "40 Westpark Ln",
      'Parent Name': "John Wanjiru",
      'Parent Email': "john.wanjiru@email.com",
      'Parent Phone': "254756789012",
      Class: "Grade 5A",
      Status: "active",
      Notes: "New admission"
    }
  ];

  const generateExcel = () => {
    try {
      // Create a new workbook
      const workbook = XLSX.utils.book_new();
      
      // Convert data to worksheet
      const worksheet = XLSX.utils.json_to_sheet(studentData);
      
      // Set column widths for better readability
      const columnWidths = [
        { wch: 18 }, // Name
        { wch: 15 }, // Admission Number
        { wch: 25 }, // Email
        { wch: 12 }, // Date of Birth
        { wch: 8 },  // Gender
        { wch: 20 }, // Address
        { wch: 18 }, // Parent Name
        { wch: 25 }, // Parent Email
        { wch: 15 }, // Parent Phone
        { wch: 10 }, // Class
        { wch: 8 },  // Status
        { wch: 30 }  // Notes
      ];
      worksheet['!cols'] = columnWidths;
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
      
      // Generate the Excel file and trigger download
      const fileName = `students_data_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      console.log('Excel file generated successfully!');
    } catch (error) {
      console.error('Error generating Excel file:', error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Student Data Excel Generator</h2>
          <p className="text-gray-600">
            Generate and download an Excel file containing {studentData.length} student records with complete information including admission details, parent contacts, and class assignments.
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Data Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{studentData.length}</div>
              <div className="text-sm text-gray-600">Total Students</div>
            </div>
            <div className="bg-white rounded p-3 text-center">
              <div className="text-2xl font-bold text-green-600">5</div>
              <div className="text-sm text-gray-600">Grade Levels</div>
            </div>
            <div className="bg-white rounded p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">12</div>
              <div className="text-sm text-gray-600">Data Columns</div>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-blue-800 mb-2">Excel File Contents:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Name, Admission Number, Email</li>
            <li>• Date of Birth, Gender, Address</li>
            <li>• Parent Name, Email, Phone</li>
            <li>• Class Assignment, Status, Notes</li>
            <li>• Properly formatted with column widths</li>
          </ul>
        </div>
        
        <div className="text-center">
          <Button 
            onClick={generateExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
            size="lg"
          >
            <Download className="mr-2 h-5 w-5" />
            Download Excel File
          </Button>
        </div>
        
        <div className="mt-4 text-center text-sm text-gray-500">
          File will be saved as: students_data_{new Date().toISOString().split('T')[0]}.xlsx
        </div>
      </div>
    </div>
  );
};

export default ExcelGenerator;