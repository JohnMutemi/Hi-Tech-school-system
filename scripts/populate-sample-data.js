// Script to populate sample school data in localStorage
// Run this in the browser console to add test schools

const sampleSchools = [
  {
    id: "school_1",
    schoolCode: "ABC1234",
    name: "Academy High School",
    logoUrl: "",
    colorTheme: "#3b82f6",
    portalUrl: "/schools/abc1234",
    description: "A prestigious high school focused on academic excellence",
    adminEmail: "admin@academy.edu",
    adminPassword: "temp123",
    adminFirstName: "John",
    adminLastName: "Smith",
    createdAt: "2024-01-15T10:00:00.000Z",
    status: "active",
    profile: {
      address: "123 Education Street, City, State 12345",
      phone: "+1-555-0123",
      website: "https://academy.edu",
      principalName: "Dr. Sarah Johnson",
      establishedYear: "1995",
      description: "A prestigious high school focused on academic excellence",
      email: "admin@academy.edu",
      motto: "Excellence in Education",
      type: "primary"
    },
    teachers: [],
    students: [],
    subjects: [],
    classes: []
  },
  {
    id: "school_2",
    schoolCode: "XYZ5678",
    name: "Innovation Elementary",
    logoUrl: "",
    colorTheme: "#10b981",
    portalUrl: "/schools/xyz5678",
    description: "Modern elementary school with innovative teaching methods",
    adminEmail: "admin@innovation.edu",
    adminPassword: "temp456",
    adminFirstName: "Maria",
    adminLastName: "Garcia",
    createdAt: "2024-01-20T14:30:00.000Z",
    status: "setup",
    profile: {
      address: "456 Learning Avenue, Town, State 67890",
      phone: "+1-555-0456",
      website: "https://innovation.edu",
      principalName: "Mr. David Wilson",
      establishedYear: "2010",
      description: "Modern elementary school with innovative teaching methods",
      email: "admin@innovation.edu",
      motto: "Learning Through Innovation",
      type: "primary"
    },
    teachers: [],
    students: [],
    subjects: [],
    classes: []
  },
  {
    id: "school_3",
    schoolCode: "DEF9012",
    name: "Community Middle School",
    logoUrl: "",
    colorTheme: "#f59e0b",
    portalUrl: "/schools/def9012",
    description: "Community-focused middle school with strong parent involvement",
    adminEmail: "admin@community.edu",
    adminPassword: "temp789",
    adminFirstName: "Lisa",
    adminLastName: "Brown",
    createdAt: "2024-01-25T09:15:00.000Z",
    status: "suspended",
    profile: {
      address: "789 Community Drive, Village, State 13579",
      phone: "+1-555-0789",
      website: "https://community.edu",
      principalName: "Dr. Robert Chen",
      establishedYear: "2005",
      description: "Community-focused middle school with strong parent involvement",
      email: "admin@community.edu",
      motto: "Building Strong Communities",
      type: "primary"
    },
    teachers: [],
    students: [],
    subjects: [],
    classes: []
  }
]

// Function to save schools to localStorage
function populateSampleData() {
  try {
    // Clear existing data
    localStorage.removeItem("schools-data")
    
    // Save each school
    sampleSchools.forEach(school => {
      const existingData = JSON.parse(localStorage.getItem("schools-data") || "[]")
      existingData.push(school)
      localStorage.setItem("schools-data", JSON.stringify(existingData))
    })
    
    console.log("✅ Sample schools added successfully!")
    console.log("Schools added:", sampleSchools.map(s => `${s.name} (${s.schoolCode})`))
    console.log("You can now test the super admin dashboard and school portals.")
    
    return true
  } catch (error) {
    console.error("❌ Error adding sample data:", error)
    return false
  }
}

// Function to clear all data
function clearAllData() {
  try {
    localStorage.removeItem("schools-data")
    console.log("✅ All school data cleared!")
    return true
  } catch (error) {
    console.error("❌ Error clearing data:", error)
    return false
  }
}

// Function to view current data
function viewCurrentData() {
  try {
    const data = JSON.parse(localStorage.getItem("schools-data") || "[]")
    console.log("📊 Current schools in localStorage:", data)
    return data
  } catch (error) {
    console.error("❌ Error reading data:", error)
    return []
  }
}

// Export functions for use in browser console
if (typeof window !== 'undefined') {
  window.populateSampleData = populateSampleData
  window.clearAllData = clearAllData
  window.viewCurrentData = viewCurrentData
  
  console.log("🎯 Sample data functions available:")
  console.log("- populateSampleData() - Add sample schools")
  console.log("- clearAllData() - Clear all school data")
  console.log("- viewCurrentData() - View current schools")
}

module.exports = {
  populateSampleData,
  clearAllData,
  viewCurrentData,
  sampleSchools
} 