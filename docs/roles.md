# Roles (0.9.8)

Besides Owner, the owner can give a Gmail one of two roles in **More › Developer panel › Access**:

| Role | Badge | Can | Cannot |
|---|---|---|---|
| Co-developer | Co-dev (code icon) | Developer panel: Build, Logs, Errors, Flags, Crashes | manage owners/roles, see owner keys, the owner pack or its secrets, Database, Test data, AI requests |
| Beta tester | Tester (flask icon) | More › Beta features (early `preview-` flags) and the Report a problem shortcut | any developer data |

Emails are stored only as SHA-256 hashes (`ka-roles`, synced with the owner's own settings in Drive).
To recognise people on **their own** devices, tap **Copy roles.json**, save it as `public/roles.json` (hashes only) and redeploy.
Roles are a client-side convenience, **not security**: anyone can read the app's code. Never rely on them to protect secrets.
