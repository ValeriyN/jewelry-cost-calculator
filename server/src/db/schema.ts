import { sqliteTable, integer, real, text, unique } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  markupCoefficient: real("markup_coefficient").notNull().default(1.8),
  defaultDeliveryCost: real("default_delivery_cost").notNull().default(20),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const categories = sqliteTable(
  "categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [unique().on(t.name, t.userId)]
);

export const suppliers = sqliteTable(
  "suppliers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [unique().on(t.name, t.userId)]
);

export const components = sqliteTable("components", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  categoryId: integer("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  supplierId: integer("supplier_id").references(() => suppliers.id, {
    onDelete: "set null",
  }),
  photoPath: text("photo_path"),
  batchQuantity: real("batch_quantity").notNull(),
  batchTotalCost: real("batch_total_cost").notNull(),
  deliveryCost: real("delivery_cost").notNull().default(20),
  // unit_cost is stored (not just generated) so it can be snapshotted easily
  // It must be kept in sync on insert/update via application logic
  unitCost: real("unit_cost").notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  photoPath: text("photo_path"),
  shareToken: text("share_token").unique(),
  description: text("description"),
  customPrice: real("custom_price"),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const productPhotos = sqliteTable("product_photos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  photoPath: text("photo_path").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const productComponents = sqliteTable("product_components", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  componentId: integer("component_id")
    .notNull()
    .references(() => components.id, { onDelete: "restrict" }),
  quantity: real("quantity").notNull(),
  // Snapshot of unit_cost at the time the component was added to this product
  unitCostSnapshot: real("unit_cost_snapshot").notNull(),
});
