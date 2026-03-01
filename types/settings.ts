export interface Setting {
  id: number;
  key: string;
  value: string;
  description: string | null;
  category: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}
