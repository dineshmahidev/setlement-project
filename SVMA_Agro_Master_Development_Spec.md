# S.V.M.A. Agro Products — Master Development Specification

## 0. STRICT INSTRUCTIONS

Build a real, production-ready business application. Do NOT create a UI-only prototype.

### Mandatory rules

1. **Do not invent business formulas.**
   - Only implement formulas explicitly defined in this specification.
   - If a business rule is unknown, make it configurable or mark it as `TO_BE_CONFIRMED`.
   - Never silently assume a QC value changes a rate.

2. **Manual + Automatic calculation must both be supported.**
   - Relevant fields can be configured as `MANUAL` or `AUTOMATIC`.
   - Manual values must never be overwritten automatically.
   - Automatic calculations must show their formula/basis where practical.

3. **GST modes are mutually exclusive.**
   - `CGST + SGST`
   - `IGST`
   - `NO GST`
   - Never calculate CGST + SGST + IGST together.

4. **Inventory and Billing are separate modules inside the same application.**
   - One React frontend.
   - One Laravel backend.
   - One MySQL database.
   - Inventory has its own screens/tables/APIs.
   - Billing can integrate with Inventory.

5. **Incoming stock is quantity, not money.**
   - Incoming stock must NOT be treated as GST/amount calculation.
   - Settlement billing calculations and inventory quantity calculations are separate.
   - Inventory quantity source must be configurable:
     - `FINAL_WEIGHT`
     - `NET_WEIGHT`
     - `MANUAL_QUANTITY`
   - Default should be `FINAL_WEIGHT`, but Admin must be able to configure it.

6. **Do not duplicate stock.**
   - When an approved Settlement Bill creates Incoming Stock, the system must create one traceable Inventory transaction.
   - Editing a bill must not create another Stock In.
   - Use a unique reference to prevent duplicate posting.

7. **Approved financial/inventory records must not be hard-deleted.**
   - Use Draft / Approved / Cancelled / Archived states.
   - Keep an audit trail.

8. **Struck/crossed fields from the supplied reference bill must not automatically appear.**
   - Implement Field Configuration.
   - Admin can enable/disable fields.
   - Disabled fields must disappear from form, calculations, PDF and print.

9. **Do not use fake/mock data as the final implementation.**
   - Use actual Laravel APIs and MySQL persistence.
   - Seed only safe demo data for development/testing.

10. **Do not make QC-based pricing automatic unless an explicit rule is configured by Admin.**
    - QC values are manual by default.

---

# 1. TECHNOLOGY

## Frontend

- React.js
- Vite
- React Router
- Axios
- Tailwind CSS or clean component CSS
- Reusable components
- React Hook Form or equivalent
- Proper client-side validation
- Responsive desktop-first UI

## Backend

- Laravel
- REST API
- Laravel Sanctum
- Eloquent ORM
- Form Requests
- API Resources
- Policies/Gates
- Database migrations
- Seeders
- Service classes for business logic
- Transaction handling (`DB::transaction`)
- PDF generation

## Database

- MySQL
- Proper relational schema
- Foreign keys
- Indexes for frequently searched fields
- Unique constraints where required

---

# 2. CORE MODULES

Build these modules:

1. Dashboard
2. Branch Management
3. Staff / Users
4. Roles & Permissions
5. Vendor Master
6. Vehicle Master
7. Item Master
8. Category Master
9. Unit Master
10. Settlement Bills
11. QC Details
12. Charges
13. GST
14. Debit Notes
15. Inventory
16. Stock In
17. Stock Out
18. Stock Transfer
19. Stock Ledger
20. Vehicle Movements
21. Reports
22. Company Settings
23. Field Configuration
24. Audit Logs

---

# 3. BRANCH MANAGEMENT

Company operates multiple branches.

Create Branch Master.

Fields:

- Branch Code
- Branch Name
- Address
- City
- District
- State
- Pincode
- GSTIN
- Phone
- Email
- Status

Every relevant transaction must have a branch.

Examples:

- Settlement Bill
- Debit Note
- Inventory Transaction
- Stock Transfer
- Vehicle Movement
- Staff assignment

Users assigned to a branch should normally see only authorized branch data.

SUPER ADMIN can access all branches.

---

# 4. USER / STAFF MANAGEMENT

Roles:

- SUPER ADMIN
- ADMIN
- BRANCH MANAGER
- BILLING STAFF
- INVENTORY STAFF
- ACCOUNTS STAFF
- VIEWER

Staff fields:

- Name
- Employee ID
- Email
- Mobile
- Password
- Role
- Assigned Branch(es)
- Status

Permissions must be granular.

Examples:

- dashboard.view
- vendors.view
- vendors.create
- vendors.edit
- vendors.delete
- settlement.view
- settlement.create
- settlement.edit
- settlement.approve
- settlement.cancel
- debitnote.view
- debitnote.create
- inventory.view
- inventory.stock_in
- inventory.stock_out
- inventory.transfer
- vehicle.view
- reports.view
- users.manage
- branches.manage
- settings.manage
- audit.view

Do not rely only on hiding frontend buttons. Backend authorization is mandatory.

---

# 5. VENDOR MASTER

Fields:

- Vendor Code
- Vendor Name
- Address
- City
- District
- State
- Pincode
- GST Number
- Phone
- Email
- PAN
- PO Number
- Default Branch
- Status

When creating a Settlement Bill:

1. Select Vendor.
2. Auto-populate vendor details.
3. Allow bill-specific override if necessary.
4. Do not modify the master vendor record unless explicitly saved as a vendor update.

---

# 6. VEHICLE MASTER

Fields:

- Vehicle Number
- Vehicle Type
- Owner Name
- Driver Name
- Driver Mobile
- RC Number
- Insurance Expiry
- Permit Expiry
- Fitness Expiry
- Branch
- Status

Vehicle can be selected in:

- Settlement Bills
- Stock In
- Stock Out
- Stock Transfer
- Vehicle Movement

Allow manual vehicle entry only when appropriate.

---

# 7. ITEM / INVENTORY MASTER

## Item fields

- Item Code
- Item Name
- Category
- Unit
- Minimum Stock Level
- Maximum Stock Level
- Status

## Category

Admin can create categories.

Do not hard-code categories.

## Units

Support:

- KG
- MT
- BAG
- LITRE
- NOS
- Custom

Admin can create custom units.

---

# 8. SETTLEMENT BILL

Use the supplied Settlement Bill image as the visual/business reference.

The system must generate a clean digital version. Do not reproduce handwritten strike-through marks.

## Header

- Company Name
- Logo
- GSTIN
- CIN
- Email
- Website
- Address

## Vendor

- Vendor Name
- Address
- GST Number
- PO Number

## Bill details

- Lot Number
- Bill Number
- Bill Date
- Vehicle Number
- Net Weight
- Jute Bag Quantity
- Container Unit Rate
- Final Unit Rate
- Final Weight
- Total Value

---

# 9. QC TEST PARTICULARS

Default configurable fields:

- Oil Content
- FFA
- SS
- Fibre
- Moisture
- IV
- Calcium
- Protein

Each field:

- Name
- Value
- Unit
- Remarks
- Active/Inactive

### Strict rule

QC values are MANUAL by default.

Do not automatically change:

- Final Unit Rate
- Rebate
- Total Value

from QC values unless an Admin-configured calculation rule exists.

---

# 10. RATE MANAGEMENT

Support both:

### Manual

User enters:

`Final Unit Rate = 203.00`

### Automatic

System calculates using a configured rule.

Never overwrite a manually entered rate.

If automatic calculation is enabled, show the calculation basis.

---

# 11. TOTAL VALUE

Default supported formula:

`Total Value = Billing Quantity × Final Unit Rate`

Billing Quantity must be configurable:

- Final Weight
- Net Weight
- Manual Quantity

Do not hard-code sample numbers.

---

# 12. CHARGES

Configurable charge types may include:

- Bag Amount
- Bran Value
- Weighing Charges
- Unloading Charges
- Loading Charges
- Advance Paid
- Lorry Freight
- Other Charges
- Rebate

Every charge supports:

- Name
- Amount
- Manual / Automatic
- Add / Deduct
- Active / Inactive
- Optional calculation rule

Example:

Unloading Charges can be:

`Manual = ₹1500`

or, if configured:

`Weight × configured rate`

Never invent a formula.

---

# 13. GST

GST Type must be one of:

- `CGST_SGST`
- `IGST`
- `NONE`

## CGST + SGST

Example:

Taxable Amount = ₹4,01,421

GST Rate = 5%

CGST = 2.5%
SGST = 2.5%
IGST = 0

## IGST

IGST = configured rate
CGST = 0
SGST = 0

## No GST

All tax amounts = 0

### Strict rule

Never calculate CGST + SGST and IGST simultaneously.

GST rates must be configurable.

---

# 14. NET PAYABLE

General structure:

`Base Value + Applicable Tax + Additive Charges - Deductive Charges = Net Payable`

But the exact treatment of each charge must come from configuration.

Show a clear calculation breakdown before saving.

---

# 15. DEBIT NOTE

Fields:

- Debit Note Number
- Date
- Invoice Number
- Invoice Date
- Lot Number
- Vendor
- Branch
- Particulars
- Rebate
- Invoice Value
- CGST
- SGST
- IGST
- Total

Debit Note can link to a Settlement Bill.

GST logic follows the same mutually exclusive GST modes.

---

# 16. INVENTORY — SEPARATE MODULE + BILLING INTEGRATION

Inventory is a separate business module but must live in the same application.

Inventory screens:

- Current Stock
- Stock In
- Stock Out
- Stock Transfer
- Stock Ledger
- Stock Adjustments
- Low Stock
- Inventory Reports

Billing screens remain separate:

- Settlement Bills
- Debit Notes

They communicate through controlled references.

---

# 17. INVENTORY QUANTITY — STRICT RULE

Inventory is quantity-based.

It is NOT the same as settlement amount calculation.

Example:

Settlement Bill:

- Item = Rice Bran Grade II
- Final Weight = 15,095 KG
- Vehicle = TN28AC3072
- Vendor = S.K. Sathana Traders
- Branch = Tiruppur
- Date = Bill Date
- Lot = RB-G2/080803/26-27

If inventory quantity source is `FINAL_WEIGHT`:

`Stock In = +15,095 KG`

If source is `NET_WEIGHT`:

`Stock In = +Net Weight`

If source is `MANUAL_QUANTITY`:

`Stock In = user-entered quantity`

This configuration must be available in Admin settings.

---

# 18. SETTLEMENT BILL → STOCK IN INTEGRATION

When an approved Settlement Bill represents incoming material:

1. Bill is approved.
2. System checks whether inventory posting is enabled for the bill/item.
3. System determines inventory quantity using configured source.
4. System creates one Stock In transaction.
5. Stock In stores:
   - Branch
   - Item
   - Quantity
   - Unit
   - Date
   - Vehicle
   - Driver if available
   - Vendor
   - Lot Number
   - Reference Settlement Bill
   - Created By
6. Current stock is updated through the transaction/ledger logic.
7. The bill is marked as inventory-posted.

### Duplicate protection

A Settlement Bill must never create duplicate Stock In transactions.

Use a unique reference such as:

`source_type = SETTLEMENT_BILL`
`source_id = settlement_bill_id`

with a database-level uniqueness strategy.

---

# 19. INVENTORY MANUAL STOCK IN

Inventory staff must also be able to create Stock In independently.

Reason:

Not every stock receipt necessarily comes from a Settlement Bill.

Stock In fields:

- Transaction Number
- Date
- Branch
- Item
- Quantity
- Unit
- Vehicle
- Driver
- Vendor
- Lot Number
- Reference
- Remarks
- Created By

Allow reference type:

- Settlement Bill
- Purchase
- Return
- Opening Stock
- Manual
- Other

---

# 20. STOCK OUT

Stock Out fields:

- Dispatch Number
- Date
- Branch
- Item
- Quantity
- Unit
- Vehicle Number
- Driver Name
- Driver Mobile
- Destination
- Customer
- Lot Number
- Remarks

Before posting:

`Requested Quantity <= Available Stock`

unless Admin explicitly enables negative stock.

After posting:

Current stock decreases.

---

# 21. STOCK TRANSFER

Support Branch A → Branch B.

Example:

From:
Dindigul

To:
Tiruppur

Item:
Rice Bran Grade II

Quantity:
5,000 KG

Vehicle:
TN28AC3072

Date:
selected date

Create linked:

- Transfer Out at source
- Transfer In at destination

Both use the same Transfer Number.

Do not count the transfer as company-wide stock loss.

---

# 22. STOCK LEDGER

Every stock movement must be traceable.

Ledger columns:

- Date
- Transaction Number
- Branch
- Item
- Opening Balance
- Stock In
- Stock Out
- Transfer In
- Transfer Out
- Adjustment
- Closing Balance
- Vehicle
- Vendor/Customer
- Lot
- Reference

Do not simply overwrite a stock number without a transaction record.

---

# 23. CURRENT STOCK

Current stock can be derived from transactions.

General:

`Opening + In + Transfer In + Returns - Out - Transfer Out - Adjustment Out`

Show:

- Opening
- Total In
- Total Out
- Available
- Minimum Level
- Status

Status:

- Normal
- Low Stock
- Out of Stock

---

# 24. VEHICLE MOVEMENT

Track vehicle movement history.

Columns:

- Date
- Vehicle
- Driver
- Branch
- Transaction Type
- Vendor
- Customer
- Item
- Quantity
- Lot
- Reference

This must connect to inventory and billing references where available.

---

# 25. DASHBOARD

Show:

- Total Branches
- Total Vendors
- Today's Settlement Bills
- Today's Debit Notes
- Today's Stock In
- Today's Stock Out
- Current Stock
- Low Stock Items
- Active Vehicles
- Today's Vehicle Movements

Filters:

- Branch
- Date range

Charts:

- Stock In vs Stock Out
- Settlement Value
- Branch-wise Stock
- Item-wise Stock
- Vehicle Movements

Keep it fast and lightweight.

---

# 26. REPORTS

Create:

1. Settlement Bill Report
2. Debit Note Report
3. Vendor Report
4. QC Report
5. Current Stock Report
6. Stock Ledger
7. Stock In Report
8. Stock Out Report
9. Branch-wise Stock
10. Vehicle Movement
11. Vehicle-wise Transactions
12. GST Report
13. Low Stock Report
14. Date-wise Transactions

Filters:

- Branch
- Date From
- Date To
- Vendor
- Item
- Vehicle
- Bill Number
- Lot Number
- Transaction Type

Export:

- PDF
- Excel
- CSV

---

# 27. PDF / PRINT

Settlement Bill PDF must be:

- Professional
- Print-ready
- Based on supplied reference
- Header on every page
- Footer on every page
- Page number
- Company logo
- Vendor section
- Bill details
- QC
- Charges
- GST
- Net Payable
- Signature
- Seal if configured

Disabled fields must not appear.

---

# 28. FIELD CONFIGURATION

Admin → Field Configuration.

Fields:

- Module
- Field Name
- Visible
- Required
- Manual / Automatic
- Default Value
- Calculation Rule
- Sort Order

Example:

`Weighing Charges`
Visible = NO

Then it must be absent from:

- Form
- Calculation
- PDF
- Print

Do not leave hidden fields affecting calculations.

---

# 29. COMPANY SETTINGS

Admin can configure:

- Company Name
- Logo
- Address
- GSTIN
- CIN
- Email
- Website
- Phone
- Default GST
- Invoice Prefix
- Debit Note Prefix
- Bill Number Format
- Currency
- Default Branch
- PDF Header
- PDF Footer
- Signature
- Seal
- Inventory Quantity Source

---

# 30. AUDIT LOG

Log important actions:

- Create
- Update
- Approve
- Cancel
- Stock adjustment
- Stock transfer
- User creation
- Permission changes
- Settings changes

For important records store:

- User
- Action
- Record
- Old value
- New value
- Date/time

---

# 31. STATUSES

Settlement:

- Draft
- Submitted
- Approved
- Cancelled

Debit Note:

- Draft
- Approved
- Cancelled

Inventory:

- Draft/Pending
- Posted
- Cancelled

Only authorized users can approve/cancel.

---

# 32. DATABASE TABLES

Create proper normalized tables.

Core:

- users
- roles
- permissions
- role_permissions
- user_permissions
- branches
- company_settings

Masters:

- vendors
- vendor_contacts
- vehicles
- vehicle_drivers
- item_categories
- units
- items

Billing:

- settlement_bills
- settlement_bill_qc
- settlement_bill_charges
- settlement_bill_taxes
- debit_notes
- debit_note_items
- debit_note_taxes

Inventory:

- inventory_transactions
- stock_transfers
- stock_transfer_items
- stock_adjustments

Vehicle:

- vehicle_movements

Configuration:

- field_configurations

Security:

- audit_logs

Use foreign keys and indexes.

---

# 33. API

Examples:

Authentication:

`POST /api/login`
`POST /api/logout`
`GET /api/me`

Branches:

`GET /api/branches`
`POST /api/branches`
`PUT /api/branches/{id}`

Vendors:

`GET /api/vendors`
`POST /api/vendors`
`PUT /api/vendors/{id}`

Vehicles:

`GET /api/vehicles`
`POST /api/vehicles`

Items:

`GET /api/items`
`POST /api/items`

Settlement:

`GET /api/settlement-bills`
`POST /api/settlement-bills`
`GET /api/settlement-bills/{id}`
`PUT /api/settlement-bills/{id}`
`POST /api/settlement-bills/{id}/approve`
`POST /api/settlement-bills/{id}/cancel`
`GET /api/settlement-bills/{id}/pdf`

Debit Notes:

`GET /api/debit-notes`
`POST /api/debit-notes`

Inventory:

`GET /api/inventory`
`POST /api/inventory/stock-in`
`POST /api/inventory/stock-out`
`POST /api/inventory/transfer`

Reports:

`GET /api/reports/stock`
`GET /api/reports/settlement`
`GET /api/reports/vehicle`

Use Laravel API Resources.

---

# 34. FRONTEND STRUCTURE

Recommended:

src/
- components/
- layouts/
- pages/
- features/
- services/
- hooks/
- context/
- utils/
- routes/
- forms/
- tables/
- pdf/
- auth/

Sidebar:

Dashboard

Masters
- Vendors
- Items
- Categories
- Vehicles
- Branches
- Units

Billing
- Settlement Bills
- Debit Notes

Inventory
- Current Stock
- Stock In
- Stock Out
- Stock Transfer
- Stock Ledger
- Low Stock

Vehicle
- Vehicle Movements

Reports
- Settlement
- Inventory
- GST
- Vehicles
- Branch-wise

Administration
- Staff
- Roles & Permissions
- Field Configuration
- Company Settings
- Audit Logs

---

# 35. UX REQUIREMENTS

Desktop-first.

Responsive for tablet/mobile.

Use:

- Search
- Filters
- Pagination
- Sort
- Modals/drawers
- Confirmation dialogs
- Toast messages
- Loading states
- Empty states
- Error states

Do not add unnecessary animations.

Forms must auto-populate master data.

---

# 36. SECURITY

Mandatory:

- Laravel Sanctum
- Password hashing
- Backend authorization
- Policies/Gates
- Form Request validation
- Secure file uploads
- SQL injection protection
- Rate limiting where appropriate
- Branch-level authorization
- Permission checks on every protected API

Never trust frontend-only permission checks.

---

# 37. BUSINESS TRANSACTION SAFETY

Financial/inventory operations must use database transactions.

For example, approving a Settlement Bill and posting Inventory Stock In should be atomic.

If one operation fails:

- Do not partially save the transaction.
- Roll back the database transaction.
- Show a meaningful error.

---

# 38. DEVELOPMENT ORDER

## Phase 1
- Laravel setup
- React setup
- MySQL
- Authentication
- Roles
- Permissions
- Branches

## Phase 2
- Vendor
- Vehicle
- Item
- Category
- Units

## Phase 3
- Settlement Bill
- QC
- Charges
- GST
- Calculation Engine

## Phase 4
- Debit Note
- PDF
- Print

## Phase 5
- Inventory
- Stock In
- Stock Out
- Transfer
- Ledger

## Phase 6
- Settlement → Inventory integration
- Vehicle movements

## Phase 7
- Reports
- Dashboard

## Phase 8
- Field Configuration
- Company Settings
- Audit Logs

## Phase 9
- Testing
- Security
- Performance
- Responsive UI

---

# 39. REQUIRED TEST CASES

Test:

- Vendor creation
- Vendor auto-fill
- Manual rate
- Automatic rate
- Manual charge
- Automatic charge
- CGST + SGST
- IGST
- No GST
- Debit Note
- Settlement approval
- Settlement → Stock In
- Duplicate Stock In prevention
- Manual Stock In
- Stock Out
- Insufficient Stock
- Branch Transfer
- Vehicle tracking
- Staff permissions
- Branch restrictions
- PDF
- Audit logs

Special tests:

1. IGST must never calculate together with CGST/SGST.
2. Disabled fields must not appear in calculations/PDF.
3. QC must not alter rate unless configured.
4. Approved Settlement Bill must not create duplicate stock.
5. Stock Out must not exceed stock unless explicitly allowed.
6. Transfer must not reduce total company stock.
7. Cancelled financial records must remain auditable.
8. Bill amount and inventory quantity calculations must remain independent.

---

# 40. FINAL ACCEPTANCE CRITERIA

The project is complete only when:

- React frontend works with real APIs.
- Laravel backend works with MySQL.
- Login and permissions work.
- Branch restrictions work.
- Vendor auto-fill works.
- Settlement Bill works.
- Manual/Automatic calculation modes work.
- GST modes are mutually exclusive.
- Debit Note works.
- PDF/Print works.
- Inventory works independently.
- Settlement Bill can create a linked Stock In when configured.
- Stock Out works.
- Stock Transfer works.
- Stock Ledger is traceable.
- Vehicle movement history works.
- Reports work.
- Audit logs work.
- Disabled fields disappear everywhere.
- No duplicate stock posting occurs.
- No critical business formula is invented.

## FINAL RULE

When business logic is uncertain, DO NOT GUESS.

Create a configurable setting or clearly mark the rule as `TO_BE_CONFIRMED`.

The goal is to digitize the company's actual workflow, not to invent a new workflow.
