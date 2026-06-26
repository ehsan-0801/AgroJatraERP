# Database Design

Tables: users, products, categories, customers, suppliers, purchases,
purchase_items, sales, sales_items.

Relationships: - Category 1:N Products - Supplier 1:N Purchases -
Customer 1:N Sales - Purchase 1:N Purchase Items - Sale 1:N Sale Items -
Product referenced by purchase_items and sales_items.

Use UUID PKs, foreign keys, indexes and timestamps.
