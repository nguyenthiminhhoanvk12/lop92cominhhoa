# Security Specification & Threat Model

## 1. Data Invariants
1. A user document `/users/{userId}` can only be created/updated by the authenticated user whose `request.auth.uid == userId`.
2. A user cannot elevate their own role to arbitrary unassigned roles without validation.
3. Students and Parents can only read their own assigned records (matching their `studentId` or `userId`).
4. Only verified teachers or the designated class teacher can modify classes, attendance, scores, emulation/competition points, and daily reports.
5. In conversations and direct messages, participants can only access conversations where they are either the teacher, the parent, or the student involved.
6. Messages cannot be forged: `senderId` must strictly equal `request.auth.uid`.
7. Timestamps and sizes must be bounded. Document IDs must conform to `^[a-zA-Z0-9_\-]+$`.

## 2. The "Dirty Dozen" Threat Payloads
1. **Payload 1 (Ghost Field Injection):** Malicious user tries to inject `isAdmin: true` or `role: "teacher"` into `/users/student123`.
2. **Payload 2 (Score Alteration by Student):** Student attempts to write to `/scores/score999` with higher grades.
3. **Payload 3 (Score Reading by Another Student):** Student A attempts to read Student B's score document.
4. **Payload 4 (Attendance Spoofing):** Student/Parent attempts to mark themselves as `present`.
5. **Payload 5 (Competition Point Tampering):** Student attempts to insert +100 bonus emulation points for themselves.
6. **Payload 6 (Forged Message Sender):** Attacker sets `senderId: "teacher_uid"` while authenticated as `student_uid`.
7. **Payload 7 (Oversized Payload / Denial of Wallet):** Attacker sends a 5MB payload for announcement content.
8. **Payload 8 (Orphaned Record Creation):** User creates a student record referencing non-existent `classId`.
9. **Payload 9 (ID Poisoning Attack):** Malicious user requests `/classes/..%2F..%2Fpasswords`.
10. **Payload 10 (Conversation Eavesdropping):** Parent A attempts to read Conversation between Teacher and Parent B.
11. **Payload 11 (Unauthorized Class Deletion):** Student attempts to delete `/classes/classA`.
12. **Payload 12 (Daily Report Tampering):** Student attempts to overwrite daily report notes.
