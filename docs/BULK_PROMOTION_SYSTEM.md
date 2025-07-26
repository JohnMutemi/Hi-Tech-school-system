# Bulk Promotion System

## Overview

The new simplified bulk promotion system allows school administrators to promote students from one grade to the next based on three key criteria: Grade, Discipline, and Maximum Fee Balance.

## Features

### ✅ Core Functionality
- **Bulk Promotion**: Promote multiple students at once
- **Three Criteria System**: Grade, Discipline, Fee Balance
- **Manual Override**: Admin can select/deselect individual students
- **Real-time Eligibility**: Instant calculation of student eligibility
- **Audit Trail**: Complete logging of all promotions and exclusions

### ✅ Grade Progression Rules
- **1A → 2A**: Grade 1A students promoted to 2A
- **2A → 3A**: Grade 2A students promoted to 3A
- **3A → 4A**: Grade 3A students promoted to 4A
- **4A → 5A**: Grade 4A students promoted to 5A
- **5A → 6A**: Grade 5A students promoted to 6A
- **6A → Alumni**: Grade 6A students graduate to Alumni

### ✅ Eligibility Criteria
1. **Minimum Grade**: Student must achieve minimum grade percentage (default: 50%)
2. **Maximum Fee Balance**: Student's outstanding fee balance must be below threshold (default: $0)
3. **Maximum Disciplinary Cases**: Student must have disciplinary cases below limit (default: 0)

## Database Schema

### New Models

#### BulkPromotionConfig
```sql
model BulkPromotionConfig {
  id                    String   @id @default(uuid())
  schoolId              String   @unique
  minGrade              Float    @default(50.0)
  maxFeeBalance         Float    @default(0.0)
  maxDisciplinaryCases  Int      @default(0)
  isActive              Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  school                School   @relation(fields: [schoolId], references: [id])
}
```

#### Updated PromotionCriteria
```sql
model PromotionCriteria {
  // ... existing fields ...
  promotionType String @default("bulk")
  minGrade Float @default(50.0)
  maxFeeBalance Float @default(0.0)
}
```

## API Endpoints

### 1. Get Eligible Students
```
GET /api/schools/{schoolCode}/promotions/bulk/eligible
```

**Query Parameters:**
- `minGrade`: Minimum grade percentage (default: 50.0)
- `maxFeeBalance`: Maximum fee balance (default: 0.0)
- `maxDisciplinaryCases`: Maximum disciplinary cases (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "studentId": "uuid",
      "studentName": "John Doe",
      "currentClass": "1A",
      "currentGrade": "1A",
      "averageGrade": 75.5,
      "feeBalance": 0.0,
      "disciplinaryCases": 0,
      "isEligible": true,
      "reason": null,
      "userId": "uuid",
      "admissionNumber": "2025-001"
    }
  ],
  "criteria": {
    "minGrade": 50.0,
    "maxFeeBalance": 0.0,
    "maxDisciplinaryCases": 0
  }
}
```

### 2. Execute Bulk Promotion
```
POST /api/schools/{schoolCode}/promotions/bulk/execute
```

**Request Body:**
```json
{
  "selectedStudents": ["uuid1", "uuid2", "uuid3"],
  "criteria": {
    "minGrade": 50.0,
    "maxFeeBalance": 0.0,
    "maxDisciplinaryCases": 0
  },
  "promotedBy": "admin-user-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "promoted": [...],
    "excluded": [...],
    "summary": {
      "totalStudents": 10,
      "promoted": 8,
      "excluded": 2
    }
  }
}
```

### 3. Get/Update Configuration
```
GET /api/schools/{schoolCode}/promotions/bulk/config
POST /api/schools/{schoolCode}/promotions/bulk/config
```

## Frontend Components

### PromotionsSection
Location: `components/school-portal/PromotionsSection.tsx`

**Features:**
- Criteria configuration form
- Student eligibility table with filters
- Manual student selection/deselection
- Bulk promotion execution with confirmation
- Real-time eligibility calculation
- Progress indicators and error handling

**Key UI Elements:**
1. **Promotion Criteria Configuration**
   - Minimum Grade input
   - Maximum Fee Balance input
   - Maximum Disciplinary Cases input
   - Save and Check Eligibility buttons

2. **Student Eligibility Table**
   - Student information display
   - Eligibility status indicators
   - Individual selection checkboxes
   - Grade and eligibility filters
   - Bulk selection controls

3. **Promotion Execution**
   - Selected students summary
   - Confirmation dialog
   - Progress tracking
   - Results display

## Implementation Details

### Service Layer
Location: `lib/services/bulk-promotion-service.ts`

**Key Functions:**
- `calculateStudentEligibility()`: Check individual student eligibility
- `getEligibleStudents()`: Get all eligible students for a school
- `executeBulkPromotion()`: Execute promotion for selected students
- `getBulkPromotionConfig()`: Get school's promotion configuration
- `updateBulkPromotionConfig()`: Update promotion criteria

### Data Sources
1. **Grade Calculation**: Currently placeholder (60-90% random), can be enhanced
2. **Fee Balance**: Uses existing `calculateStudentOutstanding()` utility
3. **Disciplinary Cases**: Currently placeholder (0), can be enhanced

## Setup Instructions

### 1. Database Migration
```bash
npx prisma migrate dev --name add_bulk_promotion_fields
```

### 2. Create Default Configurations
```bash
node scripts/create-bulk-promotion-migration.js
```

### 3. Test the System
```bash
node scripts/test-bulk-promotion.js
```

### 4. Start Development Server
```bash
npm run dev
```

## Usage Workflow

1. **Access Promotions Tab**: Navigate to school portal → Promotions
2. **Configure Criteria**: Set minimum grade, fee balance, and disciplinary requirements
3. **Save Configuration**: Click "Save Criteria" to persist settings
4. **Check Eligibility**: Click "Check Eligibility" to load student data
5. **Review Students**: Review eligible and ineligible students in the table
6. **Manual Override**: Select/deselect students as needed
7. **Execute Promotion**: Click "Execute Promotion" with confirmation
8. **Review Results**: Check promotion logs and student status updates

## Future Enhancements

### Phase 2 Features
- **Enhanced Grade Calculation**: Real grade calculation from student records
- **Disciplinary Tracking**: Actual disciplinary case counting system
- **Notification System**: Email/SMS notifications to parents
- **Advanced Filters**: More granular filtering options
- **Promotion History**: Detailed promotion history and reports

### Phase 3 Features
- **Subject-specific Requirements**: Different criteria per subject
- **Term-based Calculations**: Term-specific grade and fee calculations
- **Batch Processing**: Handle large student populations efficiently
- **Approval Workflow**: Multi-level approval system
- **Integration**: Integration with external grade systems

## Troubleshooting

### Common Issues

1. **No Students Found**
   - Ensure students are assigned to classes
   - Check that classes have valid grade assignments
   - Verify students are in eligible grades (1A-6A)

2. **API Errors**
   - Check database connection
   - Verify school code is correct
   - Ensure all required fields are provided

3. **Promotion Failures**
   - Check if next grade/class exists
   - Verify student data integrity
   - Review promotion logs for specific errors

### Debug Commands
```bash
# Test database connection
node scripts/test-bulk-promotion.js

# Check database schema
npx prisma studio

# View logs
npm run dev
```

## Security Considerations

- **Authentication**: All endpoints require valid school admin session
- **Authorization**: Only school admins can access promotion features
- **Audit Trail**: All promotions are logged with user and timestamp
- **Data Validation**: Input validation on all criteria fields
- **Confirmation**: Promotion execution requires explicit confirmation

## Performance Notes

- **Batch Processing**: Designed to handle 100+ students efficiently
- **Caching**: Consider caching student eligibility calculations
- **Database Indexes**: Ensure proper indexing on student and class tables
- **Memory Usage**: Large student populations may require pagination 