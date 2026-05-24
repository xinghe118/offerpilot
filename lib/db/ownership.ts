export function assertUserScopedRecord(recordUserId: string, currentUserId: string) {
  if (recordUserId !== currentUserId) {
    throw new Error("Record does not belong to the current user.");
  }
}

export function requireUserId(userId: string | null | undefined) {
  if (!userId) {
    throw new Error("Authentication is required.");
  }

  return userId;
}
