export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toISOString().replace("T", " ").substring(0, 19)
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toISOString().substring(0, 10)
}
