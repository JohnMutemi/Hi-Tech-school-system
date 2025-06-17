"use server"

import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

export async function createUser(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const role = formData.get("role") as string

    // Validate required fields
    if (!name || !email || !password || !role) {
      return { error: "All fields are required" }
    }

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1)

    if (existingUser.length > 0) {
      return { error: "User with this email already exists" }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("Error creating user:", error)
    return { error: "Failed to create user" }
  }
}

export async function updateUser(id: string, formData: FormData) {
  try {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const role = formData.get("role") as string

    if (!name || !email || !role) {
      return { error: "All fields are required" }
    }

    await db
      .update(users)
      .set({
        name,
        email,
        role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("Error updating user:", error)
    return { error: "Failed to update user" }
  }
}

export async function deleteUser(id: string) {
  try {
    await db.delete(users).where(eq(users.id, id))
    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("Error deleting user:", error)
    return { error: "Failed to delete user" }
  }
}

export async function toggleUserStatus(id: string) {
  try {
    const user = await db.select().from(users).where(eq(users.id, id)).limit(1)

    if (user.length === 0) {
      return { error: "User not found" }
    }

    await db
      .update(users)
      .set({
        isActive: !user[0].isActive,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("Error toggling user status:", error)
    return { error: "Failed to update user status" }
  }
}
