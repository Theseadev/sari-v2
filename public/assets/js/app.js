// public/assets/js/app.js - SARI v2
console.log("[app.js] loaded");
document.addEventListener("DOMContentLoaded", function () {
	// Restore scroll position after form submit (faculty/prodi filter)
	const savedScroll = sessionStorage.getItem("scrollY");
	if (savedScroll !== null) {
		window.scrollTo(0, parseInt(savedScroll, 10));
		sessionStorage.removeItem("scrollY");
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
