export type ItemStatus = "available" | "unavailable" | "sold_out";

export type CategoryRef = {
  _id: string;
  name: string;
  status?: string;
  displayOrder?: number;
};

export type MenuItem = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  prepTimeMinutes?: number;
  status: ItemStatus;
  isChefRecommended?: boolean;
  popularityCount?: number;

  categoryId: string | CategoryRef;
  modifierGroupIds?: string[];
  primaryPhoto?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type MenuItemPhoto = {
  _id: string;
  menuItemId: string;
  url: string;
  isPrimary: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type Paginated<T> = {
  page: number;
  limit: number;
  total: number;
  items: T[];
};