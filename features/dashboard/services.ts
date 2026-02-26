export async function getDashboardStats() {
  return fetch("/api/dashboard").then(res => res.json())
}