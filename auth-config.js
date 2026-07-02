/* ============================================================
   LIBAAS — Shared Auth Config
   Used by BOTH index.html (storefront login) and admin.html
   (admin panel login) so the admin credentials stay in sync
   between the two. Included before customers-data.js / admin.js.

   SECURITY NOTE: this is a static site with no server, so this
   is client-side-only protection (deters casual snooping, not a
   substitute for real server-side auth). See the note in admin.js
   for more detail.
   ============================================================ */

// To change the admin password: hash your new password with SHA-256 and
// paste the hash below. Generate one at https://emn178.github.io/online-tools/sha256.html
// Current default admin login is: admin@libaas.pk / libaas2026
const ADMIN_EMAIL = 'admin@libaas.pk';
const ADMIN_PASSWORD_HASH = '8821b814624f34188cefd11154315a06b0e3849f87f3663e398c81258b027c43';

async function sha256(text) {
    const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}
