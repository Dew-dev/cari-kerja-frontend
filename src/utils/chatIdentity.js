/**
 * Chat identity helpers.
 *
 * API / login shape:
 *   worker/recruiter/sender.id      → workers.id | recruiters.id (profile)
 *   worker/recruiter/sender.user_id → users.id
 *
 * auth.user: id = profile, user_id = users.id
 *
 * Chat tables (conversations.worker_id / recruiter_id) store users.id.
 * POST /chat/start { worker_id } therefore expects users.id, not workers.id.
 */

export function isSameId(a, b) {
  if (a == null || b == null) return false
  return String(a) === String(b)
}

/** True if `person` is the logged-in user (profile id and/or users.id). */
export function isCurrentUser(person, me) {
  if (!person || !me) return false

  if (person.id != null && me.id != null && isSameId(person.id, me.id)) {
    return true
  }
  if (
    person.user_id != null &&
    me.user_id != null &&
    isSameId(person.user_id, me.user_id)
  ) {
    return true
  }

  // Legacy flat sender_id — could be either id type
  if (person.sender_id != null) {
    return (
      isSameId(person.sender_id, me.id) || isSameId(person.sender_id, me.user_id)
    )
  }

  return false
}

export function isOwnMessage(message, me) {
  if (!message || !me) return false
  if (message.sender) return isCurrentUser(message.sender, me)
  return isCurrentUser(
    { id: message.sender_id, sender_id: message.sender_id },
    me,
  )
}

/** Stable key for grouping bubbles (prefer profile id). */
export function getSenderKey(message) {
  return (
    message?.sender?.id ||
    message?.sender?.user_id ||
    message?.sender_id ||
    ''
  )
}

/** Worker profile id (workers.id) — for matching conversation.worker.id in the list. */
export function resolveWorkerProfileId(source) {
  if (!source) return null

  const candidates = [
    source.worker?.id,
    source.worker_id,
    source.worker_profile_id,
    // Only treat top-level id as worker profile when it's clearly a worker record
    source.role === 'worker' || source.role === 'user' ? source.id : null,
    // Applicants API often returns worker profile as `id` (not application_id)
    source.application_id && source.id && !isSameId(source.id, source.application_id)
      ? source.id
      : null,
  ]

  for (const id of candidates) {
    if (id == null || id === '') continue
    // Never send application id as worker_id
    if (source.application_id && isSameId(id, source.application_id)) continue
    // Never send users.id when we have a distinct profile id available
    if (source.user_id && isSameId(id, source.user_id) && source.worker?.id) continue
    return id
  }

  return null
}

/**
 * users.id for POST /chat/start { worker_id }.
 * Chat DB FKs reference users.id (same as JWT userMeta.id).
 */
export function resolveWorkerUserId(source) {
  if (!source) return null

  const candidates = [
    source.worker?.user_id,
    source.user_id,
    source.worker_user_id,
  ]

  for (const id of candidates) {
    if (id == null || id === '') continue
    if (source.application_id && isSameId(id, source.application_id)) continue
    // Don't confuse workers.id with users.id
    const profileId = resolveWorkerProfileId(source)
    if (profileId && isSameId(id, profileId)) continue
    return id
  }

  return null
}
