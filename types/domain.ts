export type SchoolYear = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type Subject = {
  id: string;
  user_id: string;
  school_year_id: string;
  name: string;
  created_at: string;
};

/** Return shape for form Server Actions used with `useActionState`. */
export type FormState = { error: string } | undefined;
