// Simple mock data script

// Simple mock data with just 2 schools for super admin dashboard
// Run this in browser console: copy and paste the code below

const simpleMockSchools = {
  "stmarys": {
    id: "1",
    schoolCode: "stmarys",
    name: "St. Mary's High School",
    logo: null,
    colorTheme: "#3B82F6",
    portalUrl: "https://stmarys.edusms.com",
    description: "A prestigious Catholic school with excellent academic standards",
    adminEmail: "admin@stmarys.edu",
    adminPassword: "admin123",
    adminFirstName: "John",
    adminLastName: "Smith",
    createdAt: "2024-01-15T10:00:00Z",
    status: "active",
    profile: {
      address: "123 Education Street, City Center",
      phone: "+1-555-0123",
      website: "https://stmarys.edu",
      principalName: "Dr. Sarah Johnson",
      establishedYear: "1985",
      description: "Excellence in education since 1985",
      email: "info@stmarys.edu",
      motto: "Knowledge, Faith, Excellence",
      type: "secondary"
    },
    teachers: [
      {
        id: "t1",
        name: "Dr. Sarah Johnson",
        email: "sarah.johnson@stmarys.edu",
        phone: "+1-555-0101",
        subjects: ["Mathematics", "Physics"],
        classes: ["Grade 11A", "Grade 12A"],
        employeeId: "EMP001",
        qualification: "Ph.D. in Mathematics",
        dateJoined: "2020-08-15",
        status: "active"
      }
    ],
    students: [
      {
        id: "s1",
        name: "Emma Wilson",
        email: "emma.wilson@student.stmarys.edu",
        phone: "+1-555-0201",
        parentName: "Mr. & Mrs. Wilson",
        parentPhone: "+1-555-0202",
        parentEmail: "parents.wilson@email.com",
        admissionNumber: "STU001",
        class: "Grade 11A",
        dateOfBirth: "2007-03-15",
        gender: "female",
        address: "456 Student Lane, City Center",
        dateAdmitted: "2022-09-01",
        status: "active"
      }
    ],
    subjects: [
      {
        id: "sub1",
        name: "Advanced Mathematics",
        code: "MATH101",
        description: "Advanced level mathematics including calculus and algebra",
        teacherId: "t1",
        classes: ["Grade 11A", "Grade 12A"]
      }
    ],
    classes: [
      {
        id: "c1",
        name: "Grade 11A",
        level: "11",
        capacity: 30,
        currentStudents: 28,
        classTeacherId: "t1",
        subjects: ["MATH101"]
      }
    ]
  },
  "brighton": {
    id: "2",
    schoolCode: "brighton",
    name: "Brighton Academy",
    logo: null,
    colorTheme: "#10B981",
    portalUrl: "https://brighton.edusms.com",
    description: "Modern academy focusing on STEM education and innovation",
    adminEmail: "admin@brighton.edu",
    adminPassword: "admin123",
    adminFirstName: "Maria",
    adminLastName: "Garcia",
    createdAt: "2024-02-20T14:30:00Z",
    status: "active",
    profile: {
      address: "789 Innovation Drive, Tech District",
      phone: "+1-555-0456",
      website: "https://brighton.edu",
      principalName: "Dr. Robert Chen",
      establishedYear: "2010",
      description: "Preparing students for the future through technology and innovation",
      email: "info@brighton.edu",
      motto: "Innovate, Learn, Succeed",
      type: "mixed"
    },
    teachers: [
      {
        id: "t2",
        name: "Dr. Robert Chen",
        email: "robert.chen@brighton.edu",
        phone: "+1-555-0301",
        subjects: ["Computer Science", "Robotics"],
        classes: ["Grade 12A", "Grade 11A"],
        employeeId: "EMP002",
        qualification: "Ph.D. in Computer Science",
        dateJoined: "2015-08-20",
        status: "active"
      }
    ],
    students: [
      {
        id: "s2",
        name: "Alex Rodriguez",
        email: "alex.rodriguez@student.brighton.edu",
        phone: "+1-555-0401",
        parentName: "Mr. & Mrs. Rodriguez",
        parentPhone: "+1-555-0402",
        parentEmail: "rodriguez.family@email.com",
        admissionNumber: "STU002",
        class: "Grade 12A",
        dateOfBirth: "2006-11-08",
        gender: "male",
        address: "321 Future Street, Tech District",
        dateAdmitted: "2021-09-01",
        status: "active"
      }
    ],
    subjects: [
      {
        id: "sub2",
        name: "Computer Science",
        code: "CS101",
        description: "Introduction to programming and computer science principles",
        teacherId: "t2",
        classes: ["Grade 12A", "Grade 11A"]
      }
    ],
    classes: [
      {
        id: "c2",
        name: "Grade 12A",
        level: "12",
        capacity: 28,
        currentStudents: 25,
        classTeacherId: "t2",
        subjects: ["CS101"]
      }
    ]
  }
};

// Function to populate with simple data
function addSimpleMockData() {
  try {
    localStorage.setItem("schools-data", JSON.stringify(simpleMockSchools));
    console.log("✅ Simple mock data added successfully!");
    console.log("🏫 Schools added: St. Mary's High School, Brighton Academy");
    console.log("📊 Total schools: 2");
    return true;
  } catch (error) {
    console.error("❌ Error adding mock data:", error);
    return false;
  }
}

// Function to check current data
function checkCurrentData() {
  const data = localStorage.getItem("schools-data");
  if (data) {
    const schools = JSON.parse(data);
    console.log("📊 Current schools in storage:", Object.keys(schools).length);
    console.log("🏫 School names:", Object.values(schools).map(s => s.name));
  } else {
    console.log("📭 No schools data found");
  }
}

// Auto-run when pasted in console
addSimpleMockData();
checkCurrentData();

console.log("🚀 Ready! You can now:");
console.log("1. Go to /superadmin to see your dashboard");
console.log("2. Use 'Add School' to add more schools");
console.log("3. Test school portals at /schools/[schoolCode]");
