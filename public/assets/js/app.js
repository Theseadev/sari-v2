// public/assets/js/app.js - SARI v2
console.log("[app.js] loaded");

// Apply theme immediately (before DOM ready)
(function () {
	var t = localStorage.getItem("theme") || "light";
	if (t === "dark") document.documentElement.setAttribute("data-theme", "dark");
})();

// DOMContentLoaded handler starts below
document.addEventListener("DOMContentLoaded", function () {
	// Restore scroll position after form submit (faculty/prodi filter)
	const savedScroll = sessionStorage.getItem("scrollY");
	if (savedScroll !== null) {
		window.scrollTo(0, parseInt(savedScroll, 10));
		sessionStorage.removeItem("scrollY");
	}

	// Theme toggle
	const savedTheme = document.documentElement.getAttribute("data-theme") || "light";
	const themeBtn = document.getElementById("themeToggle");
	if (themeBtn) {
		themeBtn.textContent = savedTheme === "dark" ? "☀️" : "🌙";
		themeBtn.addEventListener("click", function () {
			const current = document.documentElement.getAttribute("data-theme");
			const next = current === "dark" ? "light" : "dark";
			document.documentElement.setAttribute("data-theme", next);
			localStorage.setItem("theme", next);
			themeBtn.textContent = next === "dark" ? "☀️" : "🌙";
		});
	}

	// SweetAlert2 flash messages
	const flashType = document.querySelector('meta[name="flash-type"]')?.content;
	const flashMsg = document.querySelector('meta[name="flash-msg"]')?.content;
	if (flashMsg && typeof Swal !== "undefined") {
		Swal.fire({
			toast: true,
			position: "top-end",
			icon: flashType === "success" ? "success" : flashType === "danger" ? "error" : flashType,
			title: flashMsg,
			showConfirmButton: false,
			timer: 4000,
			timerProgressBar: true,
		});
	}

	// Auto-hide flash alerts after 5s
	document.querySelectorAll(".alert").forEach(function (el) {
		setTimeout(function () {
			el.style.opacity = "0";
			el.style.transition = "opacity .5s";
		}, 5000);
	});

	// --- Book Detail Modal ---
	let currentBookModal = null;
	function onKeydown(e) {
		if (e.key === "Escape") closeBookModal();
	}

	function openBookModal(slug, originEl, filterParams = {}) {
		const qs = new URLSearchParams();
		if (filterParams.q) qs.set("q", filterParams.q);
		if (filterParams.faculty) qs.set("faculty", filterParams.faculty);
		if (filterParams.program) qs.set("program", filterParams.program);
		const query = qs.toString() ? "?" + qs.toString() : "";

		fetch("/buku/" + slug + query)
			.then((r) => r.text())
			.then((html) => {
				closeBookModal();

				const container = document.createElement("div");
				container.innerHTML = html;
				const modal = container.querySelector(".modal-overlay");
				if (!modal) return;

				if (originEl) {
					const rect = originEl.getBoundingClientRect();
					const originX = rect.left + rect.width / 2;
					const originY = rect.top + rect.height / 2;
					const card = modal.querySelector(".modal-card");
					if (card)
						card.style.transformOrigin = originX + "px " + originY + "px";
				}

				document.body.appendChild(modal);
				currentBookModal = modal;

				// Inject CSRF token ke form di modal
				const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
				if (csrfToken) {
					modal.querySelectorAll("form").forEach(function (f) {
						if (!f.querySelector('input[name="csrf_token"]')) {
							const inp = document.createElement("input");
							inp.type = "hidden";
							inp.name = "csrf_token";
							inp.value = csrfToken;
							f.appendChild(inp);
						}
					});
				}

				requestAnimationFrame(() => {
					modal.classList.add("show");
				});

				const closeBtn = modal.querySelector(".modal-close");
				if (closeBtn) closeBtn.addEventListener("click", closeBookModal);
				modal.addEventListener("click", (e) => {
					if (e.target === modal) closeBookModal();
				});
				document.addEventListener("keydown", onKeydown);

				modal.querySelectorAll("[data-nav]").forEach((btn) => {
					btn.addEventListener("click", () => {
						const navSlug = btn.dataset.slug;
						const current = modal.querySelector("#bookModal");
						const q = current?.dataset?.q || "";
						const fac = current?.dataset?.faculty || "";
						const prog = current?.dataset?.program || "";
						if (navSlug) {
							openBookModal(navSlug, btn, { q, faculty: fac, program: prog });
						}
					});
				});
			})
			.catch(console.error);
	}

	function closeBookModal() {
		const modal = currentBookModal;
		if (!modal) return;
		currentBookModal = null;
		modal.classList.remove("show");
		modal.classList.add("closing");
		setTimeout(() => {
			modal.remove();
		}, 250);
		document.removeEventListener("keydown", onKeydown);
	}

	// Delegated click on book cards
	document.body.addEventListener("click", function (e) {
		const card = e.target.closest(".book-card");
		if (!card) return;

		e.preventDefault();
		const slug = card.dataset.bookSlug;
		console.log("[app.js] book card clicked:", slug);
		if (slug) openBookModal(slug, card);
	});

	// --- Auth Modal (unified login/register with tabs) ---
	var authOpenBtn = document.getElementById("openAuth");
	var authModal = document.getElementById("authModal");
	var authCloseBtn = document.getElementById("closeAuthModal");
	var authCard = authModal ? authModal.querySelector(".modal-card") : null;

	function openAuthModal() {
		if (!authModal || !authCard || !authOpenBtn) return;
		var btnRect = authOpenBtn.getBoundingClientRect();
		var originX = btnRect.left + btnRect.width / 2;
		var originY = btnRect.top + btnRect.height / 2;
		authCard.style.transformOrigin = originX + "px " + originY + "px";
		authModal.classList.remove("closing");
		authModal.classList.add("show");
	}

	function closeAuthModal() {
		if (!authModal) return;
		authModal.classList.remove("show");
		authModal.classList.add("closing");
		setTimeout(function () {
			authModal.classList.remove("closing");
		}, 250);
	}

	function switchAuthTab(tabName) {
		if (!authModal) return;
		authModal.querySelectorAll(".auth-tab").forEach(function (btn) {
			btn.classList.toggle("active", btn.dataset.tab === tabName);
		});
		authModal.querySelectorAll(".auth-panel").forEach(function (panel) {
			panel.classList.toggle("active", panel.id === "panel-" + tabName);
		});
	}

	if (authOpenBtn && authModal) {
		authOpenBtn.addEventListener("click", function (e) {
			e.preventDefault();
			openAuthModal();
		});
		authModal.addEventListener("click", function (e) {
			if (e.target === authModal) closeAuthModal();
		});
	}
	if (authCloseBtn) {
		authCloseBtn.addEventListener("click", closeAuthModal);
	}

	// Tab switching
	document.querySelectorAll(".auth-tab").forEach(function (btn) {
		btn.addEventListener("click", function () {
			switchAuthTab(btn.dataset.tab);
		});
	});

	// Switch links ("Sudah punya akun? Login" / "Belum punya akun? Daftar")
	document.querySelectorAll("[data-switch]").forEach(function (link) {
		link.addEventListener("click", function (e) {
			e.preventDefault();
			switchAuthTab(link.dataset.switch);
		});
	});

	// ESC key closes auth modal
	document.addEventListener("keydown", function (e) {
		if (e.key === "Escape" && authModal && authModal.classList.contains("show")) {
			closeAuthModal();
		}
	});

	// Auto-open auth modal if ?auth=login or ?auth=register in URL
	var authParam = new URLSearchParams(window.location.search).get("auth");
	if (authParam && authModal) {
		switchAuthTab(authParam);
		openAuthModal();
		// Clean URL without reload
		window.history.replaceState({}, "", window.location.pathname);
	}

	// --- Bookmark Modal ---
	var bmOpenBtn = document.getElementById("openBookmarks");
	var bmModal = document.getElementById("bookmarkModal");
	var bmCloseBtn = document.getElementById("closeBookmarkModal");
	var bmContent = document.getElementById("bookmarkModalContent");

	if (bmOpenBtn && bmModal) {
		bmOpenBtn.addEventListener("click", function (e) {
			e.preventDefault();
			if (bmContent) {
				bmContent.innerHTML = "Memuat...";
				fetch("/bookmark/modal")
					.then(function (r) { return r.text(); })
					.then(function (html) { bmContent.innerHTML = html; })
					.catch(function () { bmContent.innerHTML = "<p style='padding:20px;text-align:center;color:var(--danger)'>Gagal memuat.</p>"; });
			}
			bmModal.classList.remove("closing");
			bmModal.classList.add("show");
		});
		bmModal.addEventListener("click", function (e) {
			if (e.target === bmModal) {
				bmModal.classList.remove("show");
				bmModal.classList.add("closing");
				setTimeout(function () { bmModal.classList.remove("closing"); }, 250);
			}
		});
	}
	if (bmCloseBtn && bmModal) {
		bmCloseBtn.addEventListener("click", function () {
			bmModal.classList.remove("show");
			bmModal.classList.add("closing");
			setTimeout(function () { bmModal.classList.remove("closing"); }, 250);
		});
	}
	// Click book in bookmark modal → open detail modal
	if (bmModal && bmContent) {
		bmContent.addEventListener("click", function (e) {
			var link = e.target.closest("a[href^='/buku/']");
			if (!link) return;
			e.preventDefault();
			var slug = link.getAttribute("href").split("/buku/")[1];
			if (!slug) return;
			bmModal.classList.remove("show");
			bmModal.classList.add("closing");
			setTimeout(function () { bmModal.classList.remove("closing"); }, 250);
			openBookModal(slug, link);
		});
	}

	// --- Riwayat Modal ---
	var rwOpenBtn = document.getElementById("openRiwayat");
	var rwModal = document.getElementById("riwayatModal");
	var rwCloseBtn = document.getElementById("closeRiwayatModal");
	var rwContent = document.getElementById("riwayatModalContent");

	if (rwOpenBtn && rwModal) {
		rwOpenBtn.addEventListener("click", function (e) {
			e.preventDefault();
			if (rwContent) {
				rwContent.innerHTML = "Memuat...";
				fetch("/riwayat/modal")
					.then(function (r) { return r.text(); })
					.then(function (html) { rwContent.innerHTML = html; })
					.catch(function () { rwContent.innerHTML = "<p style='padding:20px;text-align:center;color:var(--danger)'>Gagal memuat.</p>"; });
			}
			rwModal.classList.remove("closing");
			rwModal.classList.add("show");
		});
		rwModal.addEventListener("click", function (e) {
			if (e.target === rwModal) {
				rwModal.classList.remove("show");
				rwModal.classList.add("closing");
				setTimeout(function () { rwModal.classList.remove("closing"); }, 250);
			}
		});
	}
	if (rwCloseBtn && rwModal) {
		rwCloseBtn.addEventListener("click", function () {
			rwModal.classList.remove("show");
			rwModal.classList.add("closing");
			setTimeout(function () { rwModal.classList.remove("closing"); }, 250);
		});
	}
	// Click book in riwayat modal → open detail modal
	if (rwModal && rwContent) {
		rwContent.addEventListener("click", function (e) {
			var link = e.target.closest("a[href^='/buku/']");
			if (!link) return;
			e.preventDefault();
			var slug = link.getAttribute("href").split("/buku/")[1];
			if (!slug) return;
			rwModal.classList.remove("show");
			rwModal.classList.add("closing");
			setTimeout(function () { rwModal.classList.remove("closing"); }, 250);
			openBookModal(slug, link);
		});
	}

	// --- Profil Modal ---
	var prOpenBtn = document.getElementById("openProfil");
	var prModal = document.getElementById("profilModal");
	var prCloseBtn = document.getElementById("closeProfilModal");
	var prContent = document.getElementById("profilModalContent");

	if (prOpenBtn && prModal) {
		prOpenBtn.addEventListener("click", function (e) {
			e.preventDefault();
			if (prContent) {
				prContent.innerHTML = "Memuat...";
				fetch("/profil/modal")
					.then(function (r) { return r.text(); })
					.then(function (html) { prContent.innerHTML = html; })
					.catch(function () { prContent.innerHTML = "<p style='padding:20px;text-align:center;color:var(--danger)'>Gagal memuat.</p>"; });
			}
			prModal.classList.remove("closing");
			prModal.classList.add("show");
		});
		prModal.addEventListener("click", function (e) {
			if (e.target === prModal) {
				prModal.classList.remove("show");
				prModal.classList.add("closing");
				setTimeout(function () { prModal.classList.remove("closing"); }, 250);
			}
		});
	}
	if (prCloseBtn && prModal) {
		prCloseBtn.addEventListener("click", function () {
			prModal.classList.remove("show");
			prModal.classList.add("closing");
			setTimeout(function () { prModal.classList.remove("closing"); }, 250);
		});
	}

	// --- Password Modal ---
	var pwOpenBtn = document.getElementById("openPassword");
	var pwModal = document.getElementById("passwordModal");
	var pwCloseBtn = document.getElementById("closePasswordModal");
	var pwContent = document.getElementById("passwordModalContent");

	if (pwOpenBtn && pwModal) {
		pwOpenBtn.addEventListener("click", function (e) {
			e.preventDefault();
			if (pwContent) {
				pwContent.innerHTML = "Memuat...";
				fetch("/profil/ganti-password/modal")
					.then(function (r) { return r.text(); })
					.then(function (html) {
					pwContent.innerHTML = html;
					// Inject CSRF token
					var token = document.querySelector('meta[name="csrf-token"]')?.content;
					if (token) {
						pwContent.querySelectorAll('form').forEach(function (f) {
							if (!f.querySelector('input[name="csrf_token"]')) {
								var inp = document.createElement('input');
								inp.type = 'hidden';
								inp.name = 'csrf_token';
								inp.value = token;
								f.appendChild(inp);
							}
						});
					}
				})
					.catch(function () { pwContent.innerHTML = "<p style='padding:20px;text-align:center;color:var(--danger)'>Gagal memuat.</p>"; });
			}
			pwModal.classList.remove("closing");
			pwModal.classList.add("show");
		});
		pwModal.addEventListener("click", function (e) {
			if (e.target === pwModal) {
				pwModal.classList.remove("show");
				pwModal.classList.add("closing");
				setTimeout(function () { pwModal.classList.remove("closing"); }, 250);
			}
		});
	}
	if (pwCloseBtn && pwModal) {
		pwCloseBtn.addEventListener("click", function () {
			pwModal.classList.remove("show");
			pwModal.classList.add("closing");
			setTimeout(function () { pwModal.classList.remove("closing"); }, 250);
		});
	}

	// SweetAlert2 delete confirm
	document.body.addEventListener("click", function (e) {
		var btn = e.target.closest("button[onclick]", "form[onsubmit]");
		var form = e.target.closest("form[action*='/delete']");
		if (!form) return;
		var submitBtn = form.querySelector("button[type='submit']");
		if (e.target !== submitBtn) return;
		e.preventDefault();
		Swal.fire({
			title: "Yakin hapus?",
			text: "Data yang dihapus tidak bisa dikembalikan.",
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#b91c1c",
			cancelButtonColor: "#6b7280",
			confirmButtonText: "Ya, hapus!",
			cancelButtonText: "Batal",
		}).then(function (result) {
			if (result.isConfirmed) form.submit();
		});
	});

	// User dropdown toggle
	document.querySelectorAll(".user-dropdown-trigger").forEach(function (trigger) {
		trigger.addEventListener("click", function (e) {
			e.preventDefault();
			e.stopPropagation();
			trigger.closest(".user-dropdown-wrap").classList.toggle("open");
		});
	});
	document.addEventListener("click", function () {
		document.querySelectorAll(".user-dropdown-wrap.open").forEach(function (w) {
			w.classList.remove("open");
		});
	});

	// Custom dropdowns
	document.querySelectorAll(".dd-wrap").forEach(function (wrap) {
		var trigger = wrap.querySelector(".dd-trigger");
		var text = wrap.querySelector(".dd-text");
		var list = wrap.querySelector(".dd-list");
		var input = wrap.querySelector("input[type=hidden]");
		var selected = list.querySelector(".selected");
		if (selected && text) text.textContent = selected.textContent;

		trigger.addEventListener("click", function (e) {
			e.stopPropagation();
			document.querySelectorAll(".dd-wrap.open").forEach(function (w) {
				if (w !== wrap) w.classList.remove("open");
			});
			wrap.classList.toggle("open");
		});

		list.querySelectorAll("li").forEach(function (li) {
			li.addEventListener("click", function () {
				list.querySelector(".selected")?.classList.remove("selected");
				li.classList.add("selected");
				text.textContent = li.textContent;
				input.value = li.dataset.val;
				wrap.classList.remove("open");
				sessionStorage.setItem("scrollY", window.scrollY.toString());
				wrap.closest("form")?.submit();
			});
		});
	});
	document.addEventListener("click", function () {
		document.querySelectorAll(".dd-wrap.open").forEach(function (w) {
			w.classList.remove("open");
		});
	});

	// Inject CSRF token ke semua form yang tidak punya
	const token = document.querySelector('meta[name="csrf-token"]')?.content;
	if (token) {
		document.querySelectorAll("form").forEach(function (form) {
			if (!form.querySelector('input[name="csrf_token"]')) {
				var input = document.createElement("input");
				input.type = "hidden";
				input.name = "csrf_token";
				input.value = token;
				form.appendChild(input);
			}
		});
	}
});
