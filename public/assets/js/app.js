// public/assets/js/app.js - SARI v2
document.addEventListener("DOMContentLoaded", function () {
	// Restore scroll position after form submit (faculty/prodi filter)
	const savedScroll = sessionStorage.getItem("scrollY");
	if (savedScroll !== null) {
		window.scrollTo(0, parseInt(savedScroll, 10));
		sessionStorage.removeItem("scrollY");
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

	function openBookModal(slug, originEl) {
		fetch("/buku/" + slug + "?modal=1")
			.then((r) => r.text())
			.then((html) => {
				// Remove existing modal if any
				closeBookModal();

				const container = document.createElement("div");
				container.innerHTML = html;
				const modal = container.querySelector(".modal-overlay");
				if (!modal) return;

				// Set transform origin for animation
				if (originEl) {
					const rect = originEl.getBoundingClientRect();
					const originX = rect.left + rect.width / 2;
					const originY = rect.top + rect.height / 2;
					const card = modal.querySelector(".modal-card");
					if (card) card.style.transformOrigin = originX + "px " + originY + "px";
				}

				document.body.appendChild(modal);
				currentBookModal = modal;

				// Trigger animation
				requestAnimationFrame(() => {
					modal.classList.add("show");
				});

				// Close handlers
				const closeBtn = modal.querySelector(".modal-close");
				if (closeBtn) closeBtn.addEventListener("click", closeBookModal);
				modal.addEventListener("click", (e) => {
					if (e.target === modal) closeBookModal();
				});
				document.addEventListener("keydown", onKeydown);

				function onKeydown(e) {
					if (e.key === "Escape") closeBookModal();
				}
			})
			.catch(console.error);
	}

	function closeBookModal() {
		if (!currentBookModal) return;
		currentBookModal.classList.remove("show");
		currentBookModal.classList.add("closing");
		setTimeout(() => {
			currentBookModal.remove();
			currentBookModal = null;
		}, 250);
		document.removeEventListener("keydown", onKeydown);
	}

	// Delegated click on book cards
	document.body.addEventListener("click", function (e) {
		const card = e.target.closest(".book-card");
		if (!card) return;

		e.preventDefault();
		const slug = card.dataset.bookSlug;
		if (slug) openBookModal(slug, card);
	});

	// Login modal — animate from button to center
	var loginBtn = document.getElementById("openLogin");
	var modal = document.getElementById("loginModal");
	var closeBtn = document.getElementById("closeModal");
	var card = modal ? modal.querySelector(".modal-card") : null;

	function openModal() {
		if (!loginBtn || !modal || !card) return;
		var btnRect = loginBtn.getBoundingClientRect();
		var originX = btnRect.left + btnRect.width / 2;
		var originY = btnRect.top + btnRect.height / 2;
		card.style.transformOrigin = originX + "px " + originY + "px";
		modal.classList.remove("closing");
		modal.classList.add("show");
	}

	function closeModal() {
		if (!modal) return;
		modal.classList.remove("show");
		modal.classList.add("closing");
		setTimeout(function () {
			modal.classList.remove("closing");
		}, 250);
	}

	if (loginBtn && modal) {
		loginBtn.addEventListener("click", function (e) {
			e.preventDefault();
			openModal();
		});
		modal.addEventListener("click", function (e) {
			if (e.target === modal) closeModal();
		});
	}
	if (closeBtn) {
		closeBtn.addEventListener("click", closeModal);
	}

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
			// close others
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
				// save scroll position before submit
				sessionStorage.setItem("scrollY", window.scrollY.toString());
				// auto submit
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
