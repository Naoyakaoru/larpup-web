export interface User {
  id: number;
  email: string;
  nickname: string;
  gender: "male" | "female";
  avatar_url: string | null;
  is_admin: boolean;
}

export interface Script {
  id: number;
  title: string;
  genres: string[];
  difficulty: "easy" | "medium" | "hard";
  difficulty_label: string;
  male_slots: number;
  female_slots: number;
  any_slots: number;
  total_slots: number;
  description: string;
  cover_image_url: string | null;
}

export interface Event {
  id: number;
  script: {
    id: number;
    title: string;
    total_slots: number;
    male_slots: number;
    female_slots: number;
    any_slots: number;
    difficulty: "easy" | "medium" | "hard";
    difficulty_label: string;
    genres: string[];
  };
  host: { id: number; nickname: string };
  allow_cross_gender: boolean;
  offline_male: number;
  offline_female: number;
  scheduled_at: string;
  location: string;
  status: "recruiting" | "full" | "completed" | "cancelled";
  confirmed_count: number;
  available_slots: number;
  members?: EventMember[];
  audit_logs?: AuditLogEntry[];
}

export interface AuditLogEntry {
  action: string;
  metadata: Record<string, string>;
  user: { id: number; nickname: string };
  created_at: string;
}

export interface EventMember {
  id: number;
  user: { id: number; nickname: string; gender: "male" | "female" };
  status:
    | "pending"
    | "confirmed"
    | "rejected"
    | "cancelled"
    | "leave_requested";
  cross_gender: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}
