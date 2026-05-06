import { request } from "./client";
import type { Event } from "../types";

interface EventFilters {
  status?: string;
  script_id?: number;
  date?: string;
}

export function getEvents(filters: EventFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.script_id) params.set("script_id", String(filters.script_id));
  if (filters.date) params.set("date", filters.date);
  const qs = params.toString();
  return request<Event[]>(`/events${qs ? `?${qs}` : ""}`);
}

export function getEvent(id: number) {
  return request<Event>(`/events/${id}`);
}

type CreateEventData = {
  scheduled_at: string;
  location: string;
  host_in_game: boolean;
  host_cross_gender: boolean;
  allow_cross_gender: boolean;
  offline_male: number;
  offline_female: number;
} & ({ script_id: number } | { script_version_id: number })

export function createEvent(data: CreateEventData) {
  return request<Event>("/events", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateEvent(
  id: number,
  data: Partial<{
    scheduled_at: string;
    location: string;
    status: string;
    offline_male: number;
    offline_female: number;
    allow_cross_gender: boolean;
  }>,
) {
  return request<Event>(`/events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function joinEvent(id: number, crossGender = false) {
  return request<{ message: string }>(`/events/${id}/join`, {
    method: "POST",
    body: JSON.stringify({ cross_gender: crossGender }),
  });
}

export function leaveEvent(id: number) {
  return request<{ message: string }>(`/events/${id}/leave`, {
    method: "DELETE",
  });
}

export function deleteEvent(id: number) {
  return request<{ message: string }>(`/events/${id}`, { method: "DELETE" });
}

export function restoreEvent(id: number) {
  return request<Event>(`/events/${id}/restore`, { method: "PATCH" });
}

export function cancelEvent(id: number) {
  return request<Event>(`/events/${id}/cancel`, { method: "PATCH" });
}

export function updateMember(
  eventId: number,
  memberId: number,
  status: string,
) {
  return request<{ id: number; status: string }>(
    `/events/${eventId}/members/${memberId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
}
