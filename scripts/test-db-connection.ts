import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { db } from '../lib/db'
import { schools } from '../lib/db/schema'

async function testConnection() {
  try {
    console.log('Database URL:', process.env.DATABASE_URL)
    // Try to query the schools table
    const result = await db.select().from(schools)
    console.log('Database connection successful!')
    console.log('Schools in database:', result)
  } catch (error) {
    console.error('❌ Database connection failed!')
    console.error('Error details:', error)
    process.exit(1)
  }
}

// Run the test
testConnection(); 