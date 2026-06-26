# Software Requirements Specification

## Functional

Authentication, Dashboard, CRUD for Products/Customers/Suppliers,
Purchase & Sales with automatic stock updates, Invoice generation,
Reports, Settings.

## Business Rules

-   Unique SKU/Barcode
-   Stock never below zero
-   Sales require available stock
-   Purchases increase stock
-   Sales decrease stock
-   Soft delete where applicable

## Non-functional

Performance, Security, Scalability, Accessibility, Responsive design,
Audit logging.

## Acceptance

Every module passes validation, authorization and CRUD tests.
