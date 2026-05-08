import { request } from "./client";
import type { Address } from "../types";

export function getAddresses(params?: { q?: string; version_id?: number }) {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.version_id) qs.set("version_id", String(params.version_id));
  const query = qs.toString();
  return request<Address[]>(`/addresses${query ? `?${query}` : ""}`);
}

export function createAddress(data: {
  name: string;
  map_url?: string | null;
  address?: string | null;
  region?: string;
  store_id?: number;
}) {
  return request<Address>("/addresses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAddress(
  id: number,
  data: { name?: string; map_url?: string | null; address?: string | null; region?: string }
) {
  return request<Address>(`/addresses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function getAdminAddresses() {
  return request<Address[]>("/admin/addresses");
}

export function adminDeleteAddress(id: number) {
  return request<void>(`/admin/addresses/${id}`, { method: "DELETE" });
}

// Store ↔ Address linking
export function getStoreAddresses(storeId: number) {
  return request<Address[]>(`/stores/${storeId}/addresses`);
}

export function linkAddressToStore(storeId: number, addressId: number) {
  return request<Address>(`/stores/${storeId}/addresses`, {
    method: "POST",
    body: JSON.stringify({ address_id: addressId }),
  });
}

export function unlinkAddressFromStore(storeId: number, addressId: number) {
  return request<void>(`/stores/${storeId}/addresses/${addressId}`, {
    method: "DELETE",
  });
}

// ScriptVersion ↔ Address linking
export function getVersionAddresses(storeId: number, versionId: number) {
  return request<Address[]>(
    `/stores/${storeId}/script_versions/${versionId}/addresses`
  );
}

export function linkAddressToVersion(
  storeId: number,
  versionId: number,
  addressId: number
) {
  return request<Address>(
    `/stores/${storeId}/script_versions/${versionId}/addresses`,
    { method: "POST", body: JSON.stringify({ address_id: addressId }) }
  );
}

export function unlinkAddressFromVersion(
  storeId: number,
  versionId: number,
  addressId: number
) {
  return request<void>(
    `/stores/${storeId}/script_versions/${versionId}/addresses/${addressId}`,
    { method: "DELETE" }
  );
}
