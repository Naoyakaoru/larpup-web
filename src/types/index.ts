export interface User {
  id: number;
  handle: string;
  email: string;
  nickname: string;
  gender: "male" | "female";
  avatar_url: string | null;
  is_admin: boolean;
  show_hosted_events: boolean;
}

export interface PublicProfile {
  id: number;
  handle: string;
  nickname: string;
  gender: "male" | "female";
  avatar_url: string | null;
  hosted_events?: Pick<Event, "id" | "script" | "scheduled_at" | "location" | "status">[];
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
  duration: number | null;
  description: string;
  status: "pending" | "approved" | "rejected";
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
    duration: number | null;
    price: number | null;
    store: { id: number; name: string } | null;
    version_name: string | null;
  };
  host: { id: number; handle: string; nickname: string };
  script_version_id: number;
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
  deleted_at: string | null;
}

export interface AuditLogEntry {
  action: string;
  metadata: Record<string, string>;
  user: { id: number; nickname: string };
  created_at: string;
}

export interface EventMember {
  id: number;
  user: { id: number; handle: string; nickname: string; gender: "male" | "female" };
  status:
    | "pending"
    | "confirmed"
    | "rejected"
    | "cancelled"
    | "leave_requested";
  cross_gender: boolean;
  applied_at: string;
  confirmed_at: string | null;
  rejected_at: string | null;
  leave_requested_at: string | null;
  cancelled_at: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Store {
  id: number;
  name: string;
  status: "active" | "inactive";
  owner: { id: number; handle: string; nickname: string };
}
