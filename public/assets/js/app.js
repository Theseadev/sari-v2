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
