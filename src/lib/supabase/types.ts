export type Role = "admin" | "staff";
export type InvoiceStatus = "draft" | "sent" | "paid";

export interface Profile {
  id: string;
  name: string;
  role: Role;
  phone: string | null;
  rate_per_hour: number | null;
  internal_rate: number | null;
  external_rate: number | null;
  created_at: string;
}

export interface School {
  id: string;
  name: string;
  address: string | null;
  contact_name: string | null;
  contact_email: string | null;
  created_at: string;
}

export interface Student {
  id: string;
  name: string;
  school_id: string;
  student_number: string | null;
  date_of_birth: string | null;
  grade: string | null;
  teacher: string | null;
  eligibility: string | null;
  service_minutes: string | null;
  iep_date: string | null;
  iep_re_eval_date: string | null;
  parent_phone: string | null;
  parent_phone_2: string | null;
  parent_email: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  archived: boolean;
  // joined
  school?: School;
  goals?: Goal[];
}

export interface Goal {
  id: string;
  student_id: string;
  goal_number: number;
  description: string;
  iep_year: string | null;
  created_at: string;
  archived: boolean;
}

export interface Session {
  id: string;
  student_id: string;
  date: string;
  entered_by: string;
  notes: string | null;
  created_at: string;
  // joined
  student?: Student;
  entered_by_profile?: Profile;
  session_goals?: SessionGoal[];
}

export interface SessionGoal {
  id: string;
  session_id: string;
  goal_id: string;
  correct_count: number;
  total_count: number;
  percentage: number;
  target: string | null;
  performance_level: string | null;
  notes: string | null;
  // joined
  goal?: Goal;
}

export interface Hours {
  id: string;
  user_id: string;
  school_id: string;
  date: string;
  hours: number;
  description: string | null;
  created_at: string;
  // joined
  profile?: Profile;
  school?: School;
}

export interface Invoice {
  id: string;
  school_id: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  status: InvoiceStatus;
  created_at: string;
  // joined
  school?: School;
  invoice_lines?: InvoiceLine[];
}

export interface InvoiceLine {
  id: string;
  invoice_id: string;
  user_id: string;
  date: string;
  hours: number;
  rate: number;
  amount: number;
  description: string | null;
  // joined
  profile?: Profile;
}
