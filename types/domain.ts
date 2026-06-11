export type SchoolYear = {
  id: string;
  user_id: string;
  name: string;
  level: number | null;
  created_at: string;
};

export type Subject = {
  id: string;
  user_id: string;
  school_year_id: string;
  name: string;
  color: string | null;
  created_at: string;
};
