// src/controllers/logs.ts - Log aktivitas (Super Admin only)

import type { Context } from "hono";
import { queryRaw } from "../config/database";
import { esc, getFlash, getUser } from "../helpers";
import type { ActivityLog } from "../types";
import { adminLayout } from "../views/admin/helpers";

export async function logs(c: Context) {
	const user = getUser(c);
	if (!user) return c.redirect("/login");
	if (user.roleName !== "super_admin") return c.redirect("/admin");
	const _flash = getFlash(c);
	const perPage = 5;
	const search = (c.req.query("q") || "").trim();
	const page = search ? 1 : Math.max(1, Number(c.req.query("page")) || 1);
	const limit = search ? 999 : perPage;
	const offset = search ? 0 : (page - 1) * perPage;

	let whereSql = "";
	const params: (string | number)[] = [];
	if (search) {
		whereSql = ` WHERE u.name LIKE ? OR al.action LIKE ? OR al.description LIKE ? OR al.ip_address LIKE ?`;
		const term = `%${search}%`;
		params.push(term, term, term, term);
	}

	const countRows = await queryRaw<{ cnt: number }[]>(
		`SELECT COUNT(*) AS cnt FROM activity_logs al LEFT JOIN users u ON u.id = al.user_id${whereSql}`,
		params,
	);
	const total = countRows[0]?.cnt ?? 0;
	const totalPages = search ? 1 : Math.ceil(total / perPage);

	const dataParams = [...params];
	const rows = await queryRaw<ActivityLog[]>(
		`SELECT al.*, u.name AS user_name
     FROM activity_logs al LEFT JOIN users u ON u.id = al.user_id${whereSql}
     ORDER BY al.created_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
		dataParams,
	);

	let tableRows = "";
	if (rows.length === 0) {
		tableRows =
			'<tr><td colspan="5" class="text-muted text-center" style="padding:32px">Belum ada log aktivitas.</td></tr>';
	} else {
		for (const row of rows) {
			tableRows += `<tr>
        <td><strong>${esc(row.user_name ?? "-")}</strong></td>
        <td><span class="badge-sm public">${esc(row.action)}</span></td>
        <td>${esc(row.description ?? "")}</td>
        <td><small class="text-muted">${esc(row.ip_address ?? "-")}</small></td>
        <td><small>${row.created_at}</small></td>
      </tr>`;
		}
	}

	const searchParam = search ? `&q=${encodeURIComponent(search)}` : "";

	let paginationHtml = "";
	if (totalPages > 1) {
		const pageLink = (n: number) => `/admin/logs?page=${n}${searchParam}`;
		const pages: (number | "...")[] = [];
		if (totalPages <= 7) {
			for (let i = 1; i <= totalPages; i++) pages.push(i);
		} else {
			pages.push(1);
			let start = Math.max(2, page - 1);
			let end = Math.min(totalPages - 1, page + 1);
			if (page <= 3) end = Math.min(4, totalPages - 1);
			else if (page >= totalPages - 2) start = Math.max(totalPages - 3, 2);
			if (start > 2) pages.push("...");
			for (let i = start; i <= end; i++) pages.push(i);
			if (end < totalPages - 1) pages.push("...");
			pages.push(totalPages);
		}
		let pageNums = "";
		for (const pg of pages) {
			if (pg === "...") {
				pageNums += `<span class="admin-page-dots">…</span>`;
			} else {
				const cls = pg === page ? " admin-page-active" : "";
				pageNums += `<a href="${pageLink(pg)}" class="admin-page-num${cls}">${pg}</a>`;
			}
		}
		paginationHtml = `
  <div class="admin-pagination">
    <span class="admin-page-info">${total} log · Hal ${page}/${totalPages}</span>
    <div class="admin-page-btns">
      <a href="${pageLink(page - 1)}" class="admin-page-num${page <= 1 ? " disabled" : ""}">&laquo;</a>
      ${pageNums}
      <a href="${pageLink(page + 1)}" class="admin-page-num${page >= totalPages ? " disabled" : ""}">&raquo;</a>
    </div>
  </div>`;
	}

	const searchBox = `
  <div style="display:flex;gap:8px;margin-bottom:16px">
    <input type="text" id="logSearch" placeholder="Cari user, aksi, deskripsi, atau IP..." value="${esc(search)}" style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:0.85rem;background:var(--bg-card);color:var(--text);outline:none">
    ${search ? `<a href="/admin/logs" class="btn btn-outline btn-sm">Reset</a>` : ""}
  </div>`;

	const body = `
<div class="admin-toolbar">
  <h2 style="font-family:var(--font-heading);font-size:1.2rem">Log Aktivitas</h2>
</div>
${searchBox}
<div class="admin-card">
  <div class="table-wrap">
  <table class="table">
    <thead><tr><th>User</th><th>Aksi</th><th>Deskripsi</th><th>IP</th><th>Waktu</th></tr></thead>
    <tbody id="logTableBody">${tableRows}</tbody>
  </table>
  </div>
  ${paginationHtml}
</div>
<script>
(function(){
  var inp=document.getElementById('logSearch'),timer;
  if(!inp)return;
  var tbody=document.getElementById('logTableBody'),card=document.querySelector('.admin-card');
  inp.addEventListener('input',function(){
    clearTimeout(timer);
    timer=setTimeout(function(){
      var v=inp.value.trim();
      var url=v===''?'/admin/logs':'/admin/logs?q='+encodeURIComponent(v);
      fetch(url,{headers:{'X-Requested-With':'XMLHttpRequest'}}).then(function(r){return r.text();}).then(function(html){
        var d=document.createElement('div');d.innerHTML=html;
        var nt=d.querySelector('#logTableBody');
        var np=d.querySelector('.admin-pagination');
        if(nt&&tbody)tbody.innerHTML=nt.innerHTML;
        var oldp=card&&card.querySelector('.admin-pagination');
        if(np){if(oldp)oldp.outerHTML=np.outerHTML;else if(card)card.insertAdjacentHTML('beforeend',np.outerHTML);}
        else if(oldp)oldp.remove();
        history.replaceState({q:v},'',url);
      });
    },150);
  });
  window.addEventListener('popstate',function(){location.reload();});
})();
</script>`;

	const isAjax = c.req.header("x-requested-with") === "XMLHttpRequest";
	if (isAjax) return c.html(body);
	return c.html(
		adminLayout(
			"Log Aktivitas",
			body,
			{ name: user.name, roleName: user.roleName },
			"logs",
		),
	);
}
