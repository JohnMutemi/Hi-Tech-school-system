## Academic Year and Term Management

### Models

- `AcademicYear`: Represents a school year (e.g., 2024), with start/end dates and a flag for current year.
- `Term`: Represents a term within an academic year (e.g., Term 1), with start/end dates and a flag for current term.
- `Student`: Now references current academic year and term.

### API Endpoints

#### Get/Set Current Academic Year

- `GET /api/schools/{schoolCode}?action=current-academic-year`
- `POST /api/schools/{schoolCode}?action=set-current-academic-year`
  - Body: `{ "academicYearId": "..." }`

#### Get/Set Current Term

- `GET /api/schools/{schoolCode}?action=current-term`
- `POST /api/schools/{schoolCode}?action=set-current-term`
  - Body: `{ "termId": "..." }`

#### Academic Year CRUD

- `GET /api/schools/{schoolCode}/academic-years`
- `POST /api/schools/{schoolCode}/academic-years` (body: AcademicYear fields)
- `PUT /api/schools/{schoolCode}/academic-years` (body: AcademicYear fields)
- `DELETE /api/schools/{schoolCode}/academic-years` (body: `{ "id": "..." }`)

#### Term CRUD

- `GET /api/schools/{schoolCode}/terms?yearId=...`
- `POST /api/schools/{schoolCode}/terms` (body: Term fields)
- `PUT /api/schools/{schoolCode}/terms` (body: Term fields)
- `DELETE /api/schools/{schoolCode}/terms` (body: `{ "id": "..." }`)

#### Promotion (Updated)

- `POST /api/schools/{schoolCode}/promotions`
  - Body includes `toAcademicYearId` and `toTermId` to set the student's new year/term.

### Example: Set Current Academic Year

```bash
curl -X POST \
  /api/schools/ABC123?action=set-current-academic-year \
  -H 'Content-Type: application/json' \
  -d '{ "academicYearId": "year-uuid" }'
```

### Example: Create Academic Year

```bash
curl -X POST \
  /api/schools/ABC123/academic-years \
  -H 'Content-Type: application/json' \
  -d '{ "name": "2025", "startDate": "2025-01-01", "endDate": "2025-12-31" }'
```
