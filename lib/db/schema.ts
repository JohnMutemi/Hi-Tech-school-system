import { pgTable, text, integer, real, timestamp, uuid, boolean } from "drizzle-orm/pg-core"

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'super_admin', 'admin', 'teacher', 'student', 'parent'
  schoolId: uuid("school_id").references(() => schools.id),
  phone: text("phone"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Schools table
export const schools = pgTable("schools", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  logo: text("logo"),
  colorTheme: text("color_theme").default("#3b82f6"),
  description: text("description"),
  adminFirstName: text("admin_first_name"),
  adminLastName: text("admin_last_name"),
  adminEmail: text("admin_email"),
  adminPassword: text("admin_password"),
  status: text("status").default("active"), // 'active', 'setup', 'suspended'
  profile: text("profile"), // Store JSON as text
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Classes table
export const classes = pgTable("classes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  schoolId: uuid("school_id")
    .references(() => schools.id)
    .notNull(),
  teacherId: uuid("teacher_id").references(() => users.id),
  level: text("level"), // Primary, Secondary, etc.
  capacity: integer("capacity"),
  currentStudents: integer("current_students").default(0),
  academicYear: text("academic_year").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Students table
export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  schoolId: uuid("school_id")
    .references(() => schools.id)
    .notNull(),
  classId: uuid("class_id").references(() => classes.id),
  admissionNumber: text("admission_number").notNull(),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),
  parentName: text("parent_name"),
  parentPhone: text("parent_phone"),
  parentEmail: text("parent_email"),
  address: text("address"),
  dateAdmitted: text("date_admitted"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Teachers table
export const teachers = pgTable("teachers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  schoolId: uuid("school_id")
    .references(() => schools.id)
    .notNull(),
  employeeId: text("employee_id").notNull(),
  qualification: text("qualification"),
  dateJoined: text("date_joined"),
  subjects: text("subjects"), // Store JSON as text
  classes: text("classes"), // Store JSON as text
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Subjects table
export const subjects = pgTable("subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  description: text("description"),
  schoolId: uuid("school_id")
    .references(() => schools.id)
    .notNull(),
  teacherId: uuid("teacher_id").references(() => teachers.id),
  classes: text("classes"), // Store JSON as text
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Fee Structures table
export const feeStructures = pgTable("fee_structures", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .references(() => schools.id)
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  amount: real("amount").notNull(),
  frequency: text("frequency").notNull(), // 'monthly', 'termly', 'annually', 'one-time'
  dueDate: text("due_date"),
  academicYear: text("academic_year").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Student Fees table
export const studentFees = pgTable("student_fees", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .references(() => students.id)
    .notNull(),
  feeStructureId: uuid("fee_structure_id")
    .references(() => feeStructures.id)
    .notNull(),
  schoolId: uuid("school_id")
    .references(() => schools.id)
    .notNull(),
  amount: real("amount").notNull(),
  balance: real("balance").notNull(),
  dueDate: text("due_date").notNull(),
  status: text("status").default("pending"), // 'pending', 'partial', 'paid', 'overdue'
  academicYear: text("academic_year").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Payments table
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .references(() => students.id)
    .notNull(),
  schoolId: uuid("school_id")
    .references(() => schools.id)
    .notNull(),
  amount: real("amount").notNull(),
  paymentMethod: text("payment_method").notNull(), // 'cash', 'mpesa', 'bank', 'card'
  referenceNumber: text("reference_number"),
  transactionId: text("transaction_id"),
  status: text("status").default("pending"), // 'pending', 'completed', 'failed', 'cancelled'
  paymentDate: timestamp("payment_date").defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Receipts table
export const receipts = pgTable("receipts", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentId: uuid("payment_id")
    .references(() => payments.id)
    .notNull(),
  studentId: uuid("student_id")
    .references(() => students.id)
    .notNull(),
  schoolId: uuid("school_id")
    .references(() => schools.id)
    .notNull(),
  receiptNumber: text("receipt_number").notNull().unique(),
  amount: real("amount").notNull(),
  generatedAt: timestamp("generated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Fee Statements table
export const feeStatements = pgTable("fee_statements", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .references(() => students.id)
    .notNull(),
  schoolId: uuid("school_id")
    .references(() => schools.id)
    .notNull(),
  period: text("period").notNull(), // e.g., "January 2024"
  totalFees: real("total_fees").notNull(),
  totalPaid: real("total_paid").notNull(),
  balance: real("balance").notNull(),
  statementDate: timestamp("statement_date").defaultNow(),
  academicYear: text("academic_year").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}) 