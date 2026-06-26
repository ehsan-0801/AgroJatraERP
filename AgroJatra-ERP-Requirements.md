# AgroJatra ERP - Software Requirements Specification (SRS)

## Project Overview
**Project Name:** AgroJatra ERP

**Tagline:** *Everything Your Business Needs in One Place.*

AgroJatra ERP is a modern, web-based ERP solution for small and medium businesses in Bangladesh. It centralizes inventory, purchasing, sales, customers, suppliers, reporting, and business analytics into a single platform.

---

# Technology Stack

## Frontend
- React 19 + Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Router
- TanStack Query
- React Hook Form + Zod
- Zustand
- Recharts
- TanStack Table
- Sonner

## Backend
- Supabase
- PostgreSQL
- Supabase Authentication
- Supabase Storage
- Row Level Security (RLS)

---

# Modules

## Authentication
- Registration
- Login
- Forgot Password
- Logout
- Protected Routes
- Session Persistence

## Dashboard
KPIs:
- Total Products
- Total Customers
- Total Suppliers
- Total Purchases
- Total Sales
- Revenue
- Inventory Value
- Low Stock

Widgets:
- Sales Trend
- Purchase Trend
- Top Selling Products
- Recent Sales
- Recent Purchases

## Product Management
- Full CRUD
- SKU & Barcode
- Category
- Purchase Price
- Selling Price
- Stock
- Minimum Stock
- Unit
- Image
- Search, Filter, Sort
- Pagination

Business Rules:
- SKU unique
- Barcode unique
- Selling Price >= Purchase Price

## Customer Management
- Full CRUD
- Purchase History
- Outstanding Due
- Search & Filter

## Supplier Management
- Full CRUD
- Purchase History
- Search & Filter

## Purchase Management
- Purchase Entry
- Supplier Selection
- Multiple Line Items
- Tax & Discount
- Print Purchase

Stock Logic:
- Creating purchase increases stock.
- Updating purchase adjusts stock.
- Deleting purchase reverses stock.

## Sales Management
- Sales Entry
- Customer Selection
- Invoice Generation
- PDF Invoice
- Print Invoice

Stock Logic:
- Validate stock before sale.
- Deduct stock after sale.

## Reports
- Product Report
- Customer Report
- Supplier Report
- Purchase Report
- Sales Report

Export:
- PDF
- Excel
- CSV
- Print

## Settings
- Business Information
- Logo
- Currency
- Timezone
- Theme

---

# Database Tables

- users
- products
- categories
- customers
- suppliers
- purchases
- purchase_items
- sales
- sales_items

---

# Non-functional Requirements

- Responsive UI
- Dark/Light Theme
- Secure Authentication
- Input Validation
- Audit Logging
- Soft Deletes
- Fast Dashboard (<2s)
- Pagination
- Error Handling
- Scalable Architecture

---

# Navigation

- Dashboard
- Products
- Customers
- Suppliers
- Purchases
- Sales
- Reports
- Settings
- Profile
- Logout

---

# Future Enhancements

- RBAC
- Multi-Branch
- Warehouse Management
- Expense Module
- Returns
- Barcode Scanner
- QR Codes
- SMS & Email Notifications
- Offline Support
- PWA

---

# Branding

**Name:** AgroJatra ERP

**Meaning:** "AgroJatra" symbolizes a journey of growth and progress. Although inspired by the Bengali word "অগ্রযাত্রা" (forward journey), the platform is suitable for businesses across industries—not just agriculture.

**Suggested Colors**
- Emerald (#10B981)
- Slate (#0F172A)
- White (#FFFFFF)

**Typography**
- Geist
- Inter

**Design Style**
- Clean
- Minimal
- Modern SaaS
- Dashboard-first
- Rounded components
- Accessible UI
