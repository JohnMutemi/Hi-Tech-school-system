# eduSMS Project

## Overview
The eduSMS project is a school management system designed to facilitate the management of schools, students, teachers, and administrative tasks. It provides a platform for super admins to manage multiple schools and their respective data.

## Features
- **Super Admin Dashboard**: Manage multiple schools and their data.
- **School Management**: Add, view, and manage schools.
- **User Authentication**: Secure login for super admins and school admins.
- **Data Seeding**: Scripts to populate the database with sample data for testing and development.

## Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- A database (e.g., SQLite, PostgreSQL)

## Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd eduSMS
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory.
   - Add necessary environment variables (e.g., `DATABASE_URL`).

4. Compile TypeScript (if applicable):
   ```bash
   npm run build
   # or
   yarn build
   ```

## Usage
### Running the Application
To start the application, run:
```bash
npm start
# or
yarn start
```

### Seeding Data
To populate the database with sample data, run:
```bash
node scripts/populate-sample-data.js
node scripts/populate-superadmin-data.js
```

### Accessing the Dashboard
- Open your browser and navigate to `http://localhost:3000`.
- Log in using the super admin credentials.

## Project Structure
- `app/`: Contains the main application code.
- `components/`: Reusable UI components.
- `lib/`: Utility functions and database interactions.
- `scripts/`: Scripts for seeding data and other utilities.

## Contributing
1. Fork the repository.
2. Create a new branch for your feature.
3. Commit your changes.
4. Push to the branch.
5. Create a Pull Request.

## License
This project is licensed under the MIT License.

## Contact
For any questions or concerns, please contact [your-email@example.com](mailto:your-email@example.com). 