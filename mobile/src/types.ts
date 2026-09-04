export type Category = {
  id: string;
  name: string;
  sort_order: number;
  active: boolean;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  old_price: number | null;
  image_url: string;
  active: boolean;
  archived: boolean;
  stock_quantity: number;
  created_at?: string;
};

export type ProductDraft = {
  id?: string;
  name: string;
  category: string;
  price: string;
  old_price: string;
  image_url: string;
  local_image_uri?: string;
  image_mime_type?: string;
  stock_quantity: string;
  active: boolean;
  archived: boolean;
};
