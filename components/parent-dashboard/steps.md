# Parent Dashboard Fee Payment: Step-by-Step Plan

## 1. Frontend: Payment Simulation Flow

### a. User Action
- User clicks "Pay Now" for a term with an outstanding balance.
- Payment modal opens for the selected student/term.

### b. Payment Modal
- User enters amount and clicks "Simulate Payment".
- Show a spinner/loading state for 4-5 seconds (simulate processing delay).
- Disable all modal buttons/inputs during loading.

### c. API Call
- POST payment details to `/api/schools/{schoolCode}/students/{studentId}/payments` with:
  - `amount`
  - `paymentMethod` (e.g., "simulation")
  - `description` (optional)
  - `term` and `year` (if needed for backend logic)

### d. UI Update
- On success:
  - Show a success message (toast or inline).
  - Refresh fee structure and payment history for the student.
  - Instantly update the UI to reflect:
    - New paid amount in payment history.
    - Updated outstanding balance for the term.
    - If fully paid, show "Cleared" status and hide/disable "Pay Now" button.
    - If overpaid, reduce the next term's balance accordingly (see backend logic).
- On error:
  - Show error message.
  - Allow retry.

## 2. Backend: Payment Processing & Carry-Forward Logic

### a. Receive Payment
- Endpoint: `/api/schools/{schoolCode}/students/{studentId}/payments` (POST)
- Validate input: amount > 0, student exists, etc.

### b. Apply Payment to Terms
- Find the current term/year with outstanding balance.
- Apply payment amount to the current term's balance.
- If payment exceeds current term's balance (overpayment):
  - Carry forward the excess to the next unpaid term (by chronological order).
  - Repeat until payment is exhausted or all terms are cleared.
- Update all affected term balances in the database.
- Record the payment and generate a receipt (with reference, date, method, etc.).

### c. Return Updated Data
- Respond with updated fee structure and payment history for the student.
- Include new balances, statuses, and payment record.

## 3. Frontend: Data Refresh & UI Consistency
- After payment, always refetch fee structure and payment history.
- Ensure UI reflects the latest backend state (balances, statuses, payment history).
- Disable "Pay Now" for cleared terms.
- Show carry-forward effect in subsequent terms if overpayment occurred.

## 4. Error Handling & Edge Cases
- Handle network/API errors gracefully (show error, allow retry).
- Prevent double submission (disable button while loading).
- Validate input (no negative/zero/invalid amounts).
- If backend returns an error (e.g., payment too large, student not found), show message.

## 5. Testing & Verification
- Test normal payment, full payment, and overpayment scenarios.
- Test UI updates and backend sync for each case.
- Test error handling (network, validation, backend errors).

---

**Note:**
- The backend must implement the carry-forward logic for overpayments.
- The frontend should always trust the backend for the latest balances and statuses after payment.
- All payment actions must be persisted in the backend and reflected in the UI after each transaction. 