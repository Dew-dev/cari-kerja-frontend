/**
 * Chat identity helpers.
 *
 * API shape:
 *   worker/recruiter/sender.id      → workers.id | recruiters.id (profile)
 *   worker/recruiter/sender.user_id → users.id
 *
 * auth.user typically mirrors that: id = profile, user_id = users.id
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

/** Worker profile id for POST /chat/start { worker_id }. */
export function resolveWorkerProfileId(source) {
  if (!source) return null
  return (
    source.worker?.id ||
    source.worker_id ||
    (source.role === 'worker' || source.role === 'user' ? source.id : null) ||
    source.id ||
    null
  )
}
