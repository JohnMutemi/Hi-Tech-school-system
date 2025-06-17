import { pgTable, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'super_admin', 'admin', 'teacher', 'student', 'parent'
  schoolId: uuid("school_id").references(() => schools.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const schools = pgTable("schools", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  logo: text("logo"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const classes = pgTable("classes", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  schoolId: uuid("school_id")
    .references(() => schools.id)
    .notNull(),
  teacherId: uuid("teacher_id").references(() => users.id),
  academicYear: text("academic_year").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const students = pgTable("students", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  schoolId: uuid("school_id")
    .references(() => schools.id)
    .notNull(),
  classId: uuid("class_id").references(() => classes.id),
  admissionNumber: text("admission_number").notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  parentId: uuid("parent_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})
