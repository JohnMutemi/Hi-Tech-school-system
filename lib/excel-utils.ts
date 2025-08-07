import * as XLSX from 'xlsx';

export interface StudentData {
  name: string;
  admissionNumber: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  class: string;
  status: string;
  notes: string;
}

export const sampleStudentData: StudentData[] = [
  {
    name: "Ethan Kipkorir",
    admissionNumber: "ADM101",
    email: "ethan.kipkorir@school.com",
    dateOfBirth: "2013-02-17",
    gender: "Male",
    address: "42 Main St",
    parentName: "Mercy Kipkorir",
    parentEmail: "mercy.kipkorir@email.com",
    parentPhone: "254711223344",
    class: "Grade 1A",
    status: "active",
    notes: "New student"
  },
  {
    name: "Faith Atieno",
    admissionNumber: "ADM102",
    email: "faith.atieno@school.com",
    dateOfBirth: "2012-08-25",
    gender: "Female",
    address: "17 Riverside Rd",
    parentName: "George Atieno",
    parentEmail: "george.atieno@email.com",
    parentPhone: "254722334455",
    class: "Grade 1A",
    status: "active",
    notes: "Sibling in same school"
  },
  {
    name: "Brian Omondi",
    admissionNumber: "ADM103",
    email: "brian.omondi@school.com",
    dateOfBirth: "2011-11-02",
    gender: "Male",
    address: "89 Highview Ave",
    parentName: "Clara Omondi",
    parentEmail: "clara.omondi@email.com",
    parentPhone: "254733445566",
    class: "Grade 1A",
    status: "active",
    notes: "Transferred from another school"
  },
  {
    name: "Naomi Njeri",
    admissionNumber: "ADM104",
    email: "naomi.njeri@school.com",
    dateOfBirth: "2010-09-18",
    gender: "Female",
    address: "76 Sunridge Blvd",
    parentName: "James Njeri",
    parentEmail: "james.njeri@email.com",
    parentPhone: "254744556677",
    class: "Grade 1A",
    status: "active",
    notes: "New admission"
  },
  {
    name: "Samuel Mwangi",
    admissionNumber: "ADM105",
    email: "samuel.mwangi@school.com",
    dateOfBirth: "2012-01-09",
    gender: "Male",
    address: "34 Oak Lane",
    parentName: "Mary Mwangi",
    parentEmail: "mary.mwangi@email.com",
    parentPhone: "254755667788",
    class: "Grade 1A",
    status: "active",
    notes: "Scholarship recipient"
  },
  {
    name: "Linet Chebet",
    admissionNumber: "ADM106",
    email: "linet.chebet@school.com",
    dateOfBirth: "2011-06-21",
    gender: "Female",
    address: "58 Hilltop Dr",
    parentName: "David Chebet",
    parentEmail: "david.chebet@email.com",
    parentPhone: "254766778899",
    class: "Grade 1A",
    status: "active",
    notes: "New student"
  },
  {
    name: "Victor Ochieng",
    admissionNumber: "ADM107",
    email: "victor.ochieng@school.com",
    dateOfBirth: "2011-07-22",
    gender: "Male",
    address: "11 Cedar Way",
    parentName: "Joyce Ochieng",
    parentEmail: "joyce.ochieng@email.com",
    parentPhone: "254712345678",
    class: "Grade 2A",
    status: "active",
    notes: "New admission"
  },
  {
    name: "Emily Wanjiku",
    admissionNumber: "ADM108",
    email: "emily.wanjiku@school.com",
    dateOfBirth: "2010-03-15",
    gender: "Female",
    address: "99 Riverbank Rd",
    parentName: "Peter Wanjiku",
    parentEmail: "peter.wanjiku@email.com",
    parentPhone: "254723456789",
    class: "Grade 2A",
    status: "active",
    notes: "Transferred from another school"
  },
  {
    name: "Joseph Kiptoo",
    admissionNumber: "ADM109",
    email: "joseph.kiptoo@school.com",
    dateOfBirth: "2011-10-30",
    gender: "Male",
    address: "56 Garden Rd",
    parentName: "Grace Kiptoo",
    parentEmail: "grace.kiptoo@email.com",
    parentPhone: "254734567890",
    class: "Grade 2A",
    status: "active",
    notes: "Sibling in same school"
  },
  {
    name: "Winnie Achieng",
    admissionNumber: "ADM110",
    email: "winnie.achieng@school.com",
    dateOfBirth: "2009-12-11",
    gender: "Female",
    address: "78 Elm Str",
    parentName: "Patrick Achieng",
    parentEmail: "patrick.achieng@email.com",
    parentPhone: "254745678901",
    class: "Grade 2A",
    status: "active",
    notes: "Scholarship recipient"
  },
  {
    name: "Eric Njoroge",
    admissionNumber: "ADM111",
    email: "eric.njoroge@school.com",
    dateOfBirth: "2012-05-27",
    gender: "Male",
    address: "22 Maple Drive",
    parentName: "Susan Njoroge",
    parentEmail: "susan.njoroge@email.com",
    parentPhone: "254756789012",
    class: "Grade 2A",
    status: "active",
    notes: "New student"
  },
  {
    name: "Brenda Kiplagat",
    admissionNumber: "ADM112",
    email: "brenda.kiplagat@school.com",
    dateOfBirth: "2010-08-08",
    gender: "Female",
    address: "83 Sunset Ave",
    parentName: "Daniel Kiplagat",
    parentEmail: "daniel.kiplagat@email.com",
    parentPhone: "254767890123",
    class: "Grade 2A",
    status: "active",
    notes: "New admission"
  },
  {
    name: "Collins Mwangi",
    admissionNumber: "ADM113",
    email: "collins.mwangi@school.com",
    dateOfBirth: "2009-06-13",
    gender: "Male",
    address: "51 Pine Hill Rd",
    parentName: "Lucy Mwangi",
    parentEmail: "lucy.mwangi@email.com",
    parentPhone: "254778901234",
    class: "Grade 3A",
    status: "active",
    notes: "Transferred from another school"
  },
  {
    name: "Ruth Wambui",
    admissionNumber: "ADM114",
    email: "ruth.wambui@school.com",
    dateOfBirth: "2008-12-19",
    gender: "Female",
    address: "36 Brookside Dr",
    parentName: "Peter Wambui",
    parentEmail: "peter.wambui@email.com",
    parentPhone: "254789012345",
    class: "Grade 3A",
    status: "active",
    notes: "Scholarship recipient"
  },
  {
    name: "Andrew Otieno",
    admissionNumber: "ADM115",
    email: "andrew.otieno@school.com",
    dateOfBirth: "2010-04-25",
    gender: "Male",
    address: "69 Rosewood St",
    parentName: "Milly Otieno",
    parentEmail: "milly.otieno@email.com",
    parentPhone: "254700123456",
    class: "Grade 3A",
    status: "active",
    notes: "New student"
  },
  {
    name: "Catherine Chepngeno",
    admissionNumber: "ADM116",
    email: "catherine.chepngeno@school.com",
    dateOfBirth: "2009-01-30",
    gender: "Female",
    address: "44 Greenfield Ct",
    parentName: "Kiprono Chepngeno",
    parentEmail: "kiprono.chepngeno@email.com",
    parentPhone: "254711234567",
    class: "Grade 3A",
    status: "active",
    notes: "New admission"
  },
  {
    name: "Dennis Kibet",
    admissionNumber: "ADM117",
    email: "dennis.kibet@school.com",
    dateOfBirth: "2010-10-02",
    gender: "Male",
    address: "63 Windy Ridge",
    parentName: "Agnes Kibet",
    parentEmail: "agnes.kibet@email.com",
    parentPhone: "254722345678",
    class: "Grade 3A",
    status: "active",
    notes: "Sibling in same school"
  },
  {
    name: "Rose Mumbua",
    admissionNumber: "ADM118",
    email: "rose.mumbua@school.com",
    dateOfBirth: "2009-09-14",
    gender: "Female",
    address: "80 Clearview Rd",
    parentName: "Simon Mumbua",
    parentEmail: "simon.mumbua@email.com",
    parentPhone: "254733456789",
    class: "Grade 3A",
    status: "active",
    notes: "New admission"
  },
  {
    name: "Mark Kipruto",
    admissionNumber: "ADM119",
    email: "mark.kipruto@school.com",
    dateOfBirth: "2008-07-11",
    gender: "Male",
    address: "59 Eastwood Dr",
    parentName: "Betty Kipruto",
    parentEmail: "betty.kipruto@email.com",
    parentPhone: "254744567890",
    class: "Grade 4A",
    status: "active",
    notes: "Transferred from another school"
  },
  {
    name: "Terry Naliaka",
    admissionNumber: "ADM120",
    email: "terry.naliaka@school.com",
    dateOfBirth: "2009-05-08",
    gender: "Female",
    address: "27 Bluebell Ave",
    parentName: "Thomas Naliaka",
    parentEmail: "thomas.naliaka@email.com",
    parentPhone: "254755678901",
    class: "Grade 4A",
    status: "active",
    notes: "Scholarship recipient"
  },
  {
    name: "Victor Muli",
    admissionNumber: "ADM121",
    email: "victor.muli@school.com",
    dateOfBirth: "2008-10-19",
    gender: "Male",
    address: "88 Lakeview Ln",
    parentName: "Ann Muli",
    parentEmail: "ann.muli@email.com",
    parentPhone: "254766789012",
    class: "Grade 4A",
    status: "active",
    notes: "New student"
  },
  {
    name: "Grace Njoki",
    admissionNumber: "ADM122",
    email: "grace.njoki@school.com",
    dateOfBirth: "2009-02-22",
    gender: "Female",
    address: "90 Sunset Blvd",
    parentName: "Martin Njoki",
    parentEmail: "martin.njoki@email.com",
    parentPhone: "254777890123",
    class: "Grade 4A",
    status: "active",
    notes: "New admission"
  },
  {
    name: "Isaac Otieno",
    admissionNumber: "ADM123",
    email: "isaac.otieno@school.com",
    dateOfBirth: "2010-01-14",
    gender: "Male",
    address: "18 Sunrise Way",
    parentName: "Beatrice Otieno",
    parentEmail: "beatrice.otieno@email.com",
    parentPhone: "254788901234",
    class: "Grade 4A",
    status: "active",
    notes: "Sibling in same school"
  },
  {
    name: "Lucy Wamaitha",
    admissionNumber: "ADM124",
    email: "lucy.wamaitha@school.com",
    dateOfBirth: "2009-04-09",
    gender: "Female",
    address: "29 Garden Estate",
    parentName: "David Wamaitha",
    parentEmail: "david.wamaitha@email.com",
    parentPhone: "254799012345",
    class: "Grade 4A",
    status: "active",
    notes: "Transferred from another school"
  },
  {
    name: "Kevin Chege",
    admissionNumber: "ADM125",
    email: "kevin.chege@school.com",
    dateOfBirth: "2007-11-11",
    gender: "Male",
    address: "14 Northview Rd",
    parentName: "Rose Chege",
    parentEmail: "rose.chege@email.com",
    parentPhone: "254701234567",
    class: "Grade 5A",
    status: "active",
    notes: "New student"
  },
  {
    name: "Lilian Jepchirchir",
    admissionNumber: "ADM126",
    email: "lilian.jepchirchir@school.com",
    dateOfBirth: "2008-03-03",
    gender: "Female",
    address: "33 Ridge Rd",
    parentName: "Paul Jepchirchir",
    parentEmail: "paul.jepchirchir@email.com",
    parentPhone: "254712345678",
    class: "Grade 5A",
    status: "active",
    notes: "New admission"
  },
  {
    name: "Michael Oduor",
    admissionNumber: "ADM127",
    email: "michael.oduor@school.com",
    dateOfBirth: "2007-09-25",
    gender: "Male",
    address: "26 Mountain Rd",
    parentName: "Elizabeth Oduor",
    parentEmail: "elizabeth.oduor@email.com",
    parentPhone: "254723456789",
    class: "Grade 5A",
    status: "active",
    notes: "Scholarship recipient"
  },
  {
    name: "Agnes Nyambura",
    admissionNumber: "ADM128",
    email: "agnes.nyambura@school.com",
    dateOfBirth: "2008-12-07",
    gender: "Female",
    address: "15 Valley Ct",
    parentName: "James Nyambura",
    parentEmail: "james.nyambura@email.com",
    parentPhone: "254734567890",
    class: "Grade 5A",
    status: "active",
    notes: "Transferred from another school"
  },
  {
    name: "Stephen Kiplangat",
    admissionNumber: "ADM129",
    email: "stephen.kiplangat@school.com",
    dateOfBirth: "2009-06-18",
    gender: "Male",
    address: "12 Bayview Dr",
    parentName: "Mercy Kiplangat",
    parentEmail: "mercy.kiplangat@email.com",
    parentPhone: "254745678901",
    class: "Grade 5A",
    status: "active",
    notes: "Sibling in same school"
  },
  {
    name: "Purity Wanjiru",
    admissionNumber: "ADM130",
    email: "purity.wanjiru@school.com",
    dateOfBirth: "2008-05-02",
    gender: "Female",
    address: "40 Westpark Ln",
    parentName: "John Wanjiru",
    parentEmail: "john.wanjiru@email.com",
    parentPhone: "254756789012",
    class: "Grade 5A",
    status: "active",
    notes: "New admission"
  }
];

export function downloadStudentsExcel(students: StudentData[] = sampleStudentData, filename: string = 'students.xlsx') {
  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // Convert data to worksheet format
  const wsData = [
    // Header row
    [
      'Name',
      'Admission Number', 
      'Email',
      'Date of Birth',
      'Gender',
      'Address',
      'Parent Name',
      'Parent Email',
      'Parent Phone',
      'Class',
      'Status',
      'Notes'
    ],
    // Data rows
    ...students.map(student => [
      student.name,
      student.admissionNumber,
      student.email,
      student.dateOfBirth,
      student.gender,
      student.address,
      student.parentName,
      student.parentEmail,
      student.parentPhone,
      student.class,
      student.status,
      student.notes
    ])
  ];
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths for better readability
  const colWidths = [
    { wch: 20 }, // Name
    { wch: 15 }, // Admission Number
    { wch: 25 }, // Email
    { wch: 12 }, // Date of Birth
    { wch: 8 },  // Gender
    { wch: 20 }, // Address
    { wch: 20 }, // Parent Name
    { wch: 25 }, // Parent Email
    { wch: 15 }, // Parent Phone
    { wch: 12 }, // Class
    { wch: 8 },  // Status
    { wch: 30 }  // Notes
  ];
  ws['!cols'] = colWidths;
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Students');
  
  // Generate Excel file and trigger download
  XLSX.writeFile(wb, filename);
}

export function createExcelFromData(data: any[], sheetName: string = 'Sheet1', filename: string = 'data.xlsx') {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}