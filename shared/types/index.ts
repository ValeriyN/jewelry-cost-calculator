// ─── Auth ──────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  markupCoefficient: number;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ─── Categories & Suppliers ────────────────────────────────────────────────
export interface Category {
  id: number;
  name: string;
}

export interface Supplier {
  id: number;
  name: string;
}

// ─── Components ────────────────────────────────────────────────────────────
export interface Component {
  id: number;
  name: string;
  categoryId: number | null;
  categoryName: string | null;
  supplierId: number | null;
  supplierName: string | null;
  photoPath: string | null;
  batchQuantity: number;
  batchTotalCost: number;
  deliveryCost: number;
  unitCost: number;
  createdAt: string;
}

export interface CreateComponentDto {
  name: string;
  categoryId?: number;
  supplierId?: number;
  batchQuantity: number;
  batchTotalCost: number;
  deliveryCost?: number;
}

export interface UpdateComponentDto extends Partial<CreateComponentDto> {}

// ─── Product Components ────────────────────────────────────────────────────
export interface ProductComponent {
  id: number;
  componentId: number;
  componentName: string;
  categoryId: number | null;
  categoryName: string | null;
  quantity: number;
  unitCostSnapshot: number;
  totalCost: number;
}

// ─── Products ──────────────────────────────────────────────────────────────
export interface Product {
  id: number;
  name: string;
  photoPath: string | null;
  shareToken: string | null;
  createdAt: string;
}

export interface ProductDetail extends Product {
  components: ProductComponent[];
  totalCost: number;
  recommendedPrice: number;
  categoryBreakdown: CategoryBreakdownItem[];
}

export interface CategoryBreakdownItem {
  categoryId: number | null;
  categoryName: string | null;
  totalCost: number;
}

export interface CreateProductDto {
  name: string;
  components: { componentId: number; quantity: number }[];
}

export interface UpdateProductDto {
  name?: string;
  components?: { componentId: number; quantity: number }[];
}

// ─── Settings ──────────────────────────────────────────────────────────────
export interface Settings {
  markupCoefficient: number;
}

// ─── Public Share ──────────────────────────────────────────────────────────
export interface PublicProduct {
  name: string;
  photoPath: string | null;
  recommendedPrice: number;
  components: { componentName: string; quantity: number }[];
}

// ─── API Responses ─────────────────────────────────────────────────────────
export interface ApiError {
  error: string;
}

export interface ShareResponse {
  shareToken: string;
  shareUrl: string;
}
