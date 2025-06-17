// Script to populate local storage with mock school data
// Run this in the browser console or as a script

const mockSchools = {
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
      },
      {
        id: "t2",
        name: "Mr. Michael Brown",
        email: "michael.brown@stmarys.edu",
        phone: "+1-555-0102",
        subjects: ["English Literature", "Creative Writing"],
        classes: ["Grade 10B", "Grade 11B"],
        employeeId: "EMP002",
        qualification: "M.A. in English Literature",
        dateJoined: "2019-09-01",
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
      },
      {
        id: "s2",
        name: "James Davis",
        email: "james.davis@student.stmarys.edu",
        phone: "+1-555-0203",
        parentName: "Mrs. Davis",
        parentPhone: "+1-555-0204",
        parentEmail: "mrs.davis@email.com",
        admissionNumber: "STU002",
        class: "Grade 10B",
        dateOfBirth: "2008-07-22",
        gender: "male",
        address: "789 Learning Street, City Center",
        dateAdmitted: "2023-09-01",
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
      },
      {
        id: "sub2",
        name: "English Literature",
        code: "ENG101",
        description: "Study of classic and contemporary literature",
        teacherId: "t2",
        classes: ["Grade 10B", "Grade 11B"]
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
        subjects: ["MATH101", "ENG101"]
      },
      {
        id: "c2",
        name: "Grade 10B",
        level: "10",
        capacity: 25,
        currentStudents: 22,
        classTeacherId: "t2",
        subjects: ["ENG101"]
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
        id: "t3",
        name: "Dr. Robert Chen",
        email: "robert.chen@brighton.edu",
        phone: "+1-555-0301",
        subjects: ["Computer Science", "Robotics"],
        classes: ["Grade 12A", "Grade 11A"],
        employeeId: "EMP003",
        qualification: "Ph.D. in Computer Science",
        dateJoined: "2015-08-20",
        status: "active"
      },
      {
        id: "t4",
        name: "Ms. Lisa Thompson",
        email: "lisa.thompson@brighton.edu",
        phone: "+1-555-0302",
        subjects: ["Biology", "Chemistry"],
        classes: ["Grade 10A", "Grade 11B"],
        employeeId: "EMP004",
        qualification: "M.Sc. in Biology",
        dateJoined: "2018-01-15",
        status: "active"
      }
    ],
    students: [
      {
        id: "s3",
        name: "Alex Rodriguez",
        email: "alex.rodriguez@student.brighton.edu",
        phone: "+1-555-0401",
        parentName: "Mr. & Mrs. Rodriguez",
        parentPhone: "+1-555-0402",
        parentEmail: "rodriguez.family@email.com",
        admissionNumber: "STU003",
        class: "Grade 12A",
        dateOfBirth: "2006-11-08",
        gender: "male",
        address: "321 Future Street, Tech District",
        dateAdmitted: "2021-09-01",
        status: "active"
      },
      {
        id: "s4",
        name: "Sophia Kim",
        email: "sophia.kim@student.brighton.edu",
        phone: "+1-555-0403",
        parentName: "Dr. & Mrs. Kim",
        parentPhone: "+1-555-0404",
        parentEmail: "kim.family@email.com",
        admissionNumber: "STU004",
        class: "Grade 10A",
        dateOfBirth: "2009-05-12",
        gender: "female",
        address: "654 Innovation Lane, Tech District",
        dateAdmitted: "2023-09-01",
        status: "active"
      }
    ],
    subjects: [
      {
        id: "sub3",
        name: "Computer Science",
        code: "CS101",
        description: "Introduction to programming and computer science principles",
        teacherId: "t3",
        classes: ["Grade 12A", "Grade 11A"]
      },
      {
        id: "sub4",
        name: "Advanced Biology",
        code: "BIO101",
        description: "Comprehensive study of biological systems and processes",
        teacherId: "t4",
        classes: ["Grade 10A", "Grade 11B"]
      }
    ],
    classes: [
      {
        id: "c3",
        name: "Grade 12A",
        level: "12",
        capacity: 28,
        currentStudents: 25,
        classTeacherId: "t3",
        subjects: ["CS101", "BIO101"]
      },
      {
        id: "c4",
        name: "Grade 10A",
        level: "10",
        capacity: 30,
        currentStudents: 27,
        classTeacherId: "t4",
        subjects: ["BIO101"]
      }
    ]
  },
  "riverside": {
    id: "3",
    schoolCode: "riverside",
    name: "Riverside Elementary",
    logo: null,
    colorTheme: "#F59E0B",
    portalUrl: "https://riverside.edusms.com",
    description: "Nurturing environment for young learners",
    adminEmail: "admin@riverside.edu",
    adminPassword: "admin123",
    adminFirstName: "David",
    adminLastName: "Wilson",
    createdAt: "2024-03-10T09:15:00Z",
    status: "setup",
    profile: {
      address: "456 Learning Circle, Suburbia",
      phone: "+1-555-0789",
      website: "https://riverside.edu",
      principalName: "Mrs. Jennifer Adams",
      establishedYear: "2000",
      description: "Building strong foundations for lifelong learning",
      email: "info@riverside.edu",
      motto: "Growing Minds, Building Futures",
      type: "primary"
    },
    teachers: [
      {
        id: "t5",
        name: "Mrs. Jennifer Adams",
        email: "jennifer.adams@riverside.edu",
        phone: "+1-555-0501",
        subjects: ["General Studies", "Reading"],
        classes: ["Grade 1A", "Grade 2A"],
        employeeId: "EMP005",
        qualification: "M.Ed. in Elementary Education",
        dateJoined: "2010-08-25",
        status: "active"
      }
    ],
    students: [
      {
        id: "s5",
        name: "Emma Johnson",
        email: null,
        phone: null,
        parentName: "Mr. & Mrs. Johnson",
        parentPhone: "+1-555-0601",
        parentEmail: "johnson.family@email.com",
        admissionNumber: "STU005",
        class: "Grade 1A",
        dateOfBirth: "2018-09-03",
        gender: "female",
        address: "123 Child Street, Suburbia",
        dateAdmitted: "2024-09-01",
        status: "active"
      }
    ],
    subjects: [
      {
        id: "sub5",
        name: "General Studies",
        code: "GEN101",
        description: "Comprehensive elementary education curriculum",
        teacherId: "t5",
        classes: ["Grade 1A", "Grade 2A"]
      }
    ],
    classes: [
      {
        id: "c5",
        name: "Grade 1A",
        level: "1",
        capacity: 25,
        currentStudents: 18,
        classTeacherId: "t5",
        subjects: ["GEN101"]
      }
    ]
  },
  "techprep": {
    id: "4",
    schoolCode: "techprep",
    name: "Tech Prep Institute",
    logo: null,
    colorTheme: "#8B5CF6",
    portalUrl: "https://techprep.edusms.com",
    description: "Specialized technical and vocational training institute",
    adminEmail: "admin@techprep.edu",
    adminPassword: "admin123",
    adminFirstName: "Rachel",
    adminLastName: "Martinez",
    createdAt: "2024-01-05T16:45:00Z",
    status: "suspended",
    profile: {
      address: "789 Technical Avenue, Industrial Zone",
      phone: "+1-555-0124",
      website: "https://techprep.edu",
      principalName: "Mr. Kevin O'Brien",
      establishedYear: "2015",
      description: "Preparing students for technical careers and industry",
      email: "info@techprep.edu",
      motto: "Skills for Tomorrow's Workforce",
      type: "college"
    },
    teachers: [
      {
        id: "t6",
        name: "Mr. Kevin O'Brien",
        email: "kevin.obrien@techprep.edu",
        phone: "+1-555-0701",
        subjects: ["Engineering", "Technical Drawing"],
        classes: ["Year 1", "Year 2"],
        employeeId: "EMP006",
        qualification: "B.Eng. in Mechanical Engineering",
        dateJoined: "2018-03-10",
        status: "active"
      }
    ],
    students: [
      {
        id: "s6",
        name: "Marcus Thompson",
        email: "marcus.thompson@student.techprep.edu",
        phone: "+1-555-0801",
        parentName: "Mrs. Thompson",
        parentPhone: "+1-555-0802",
        parentEmail: "mrs.thompson@email.com",
        admissionNumber: "STU006",
        class: "Year 1",
        dateOfBirth: "2005-12-20",
        gender: "male",
        address: "456 Skill Street, Industrial Zone",
        dateAdmitted: "2023-09-01",
        status: "active"
      }
    ],
    subjects: [
      {
        id: "sub6",
        name: "Mechanical Engineering",
        code: "MECH101",
        description: "Fundamentals of mechanical engineering and design",
        teacherId: "t6",
        classes: ["Year 1", "Year 2"]
      }
    ],
    classes: [
      {
        id: "c6",
        name: "Year 1",
        level: "1",
        capacity: 25,
        currentStudents: 20,
        classTeacherId: "t6",
        subjects: ["MECH101"]
      }
    ]
  }
};

// Function to populate local storage
function populateLocalStorage() {
  try {
    // Save the mock data to localStorage
    localStorage.setItem("schools-data", JSON.stringify(mockSchools));
    
    console.log("✅ Mock data successfully populated!");
    console.log("📊 Schools added:", Object.keys(mockSchools).length);
    console.log("🏫 School codes:", Object.keys(mockSchools));
    
    // Verify the data was saved
    const savedData = localStorage.getItem("schools-data");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      console.log("✅ Verification: Data saved successfully");
      console.log("📈 Total schools in storage:", Object.keys(parsed).length);
    } else {
      console.error("❌ Error: Data was not saved properly");
    }
    
    return true;
  } catch (error) {
    console.error("❌ Error populating local storage:", error);
    return false;
  }
}

// Function to clear local storage
function clearLocalStorage() {
  try {
    localStorage.removeItem("schools-data");
    console.log("✅ Local storage cleared successfully");
    return true;
  } catch (error) {
    console.error("❌ Error clearing local storage:", error);
    return false;
  }
}

// Function to check current storage status
function checkStorageStatus() {
  try {
    const data = localStorage.getItem("schools-data");
    if (data) {
      const parsed = JSON.parse(data);
      console.log("📊 Current storage status:");
      console.log("🏫 Schools in storage:", Object.keys(parsed).length);
      console.log("📝 School names:", Object.values(parsed).map(s => s.name));
      console.log("💾 Data size:", data.length, "characters");
    } else {
      console.log("📭 No schools data found in storage");
    }
  } catch (error) {
    console.error("❌ Error checking storage status:", error);
  }
}

// Export functions for use in browser console
if (typeof window !== "undefined") {
  window.populateLocalStorage = populateLocalStorage;
  window.clearLocalStorage = clearLocalStorage;
  window.checkStorageStatus = checkStorageStatus;
  
  console.log("🚀 Local Storage Script Loaded!");
  console.log("Available functions:");
  console.log("- populateLocalStorage() - Add mock data");
  console.log("- clearLocalStorage() - Clear all data");
  console.log("- checkStorageStatus() - Check current data");
}

module.exports = {
  populateLocalStorage,
  clearLocalStorage,
  checkStorageStatus,
  mockSchools
}; 