// Jobie Admin — Theme & Mobile Sidebar

(() => {
	// Theme Toggle
	const themeToggle = document.getElementById("themeToggle");
	const html = document.documentElement;

	function getTheme() {
		return (
			localStorage.getItem("jobie-theme") ||
			(window.matchMedia("(prefers-color-scheme: dark)").matches
				? "dark"
				: "light")
		);
	}

	function applyTheme(theme) {
		html.setAttribute("data-theme", theme);
		localStorage.setItem("jobie-theme", theme);
	}

	// Initialize
	applyTheme(getTheme());

	if (themeToggle) {
		themeToggle.addEventListener("click", () => {
			const current = html.getAttribute("data-theme");
			const next = current === "dark" ? "light" : "dark";
			applyTheme(next);
		});
	}

	// System theme change listener
	window
		.matchMedia("(prefers-color-scheme: dark)")
		.addEventListener("change", (e) => {
			if (!localStorage.getItem("jobie-theme")) {
				applyTheme(e.matches ? "dark" : "light");
			}
		});

	// Mobile Sidebar Toggle
	const sidebar = document.querySelector(".jobie-sidebar");

	function createMobileToggle() {
		if (
			window.innerWidth <= 1024 &&
			!document.getElementById("mobileSidebarToggle")
		) {
			const btn = document.createElement("button");
			btn.id = "mobileSidebarToggle";
			btn.className = "jt-btn jt-menu";
			btn.setAttribute("aria-label", "Toggle navigation menu");
			btn.setAttribute("aria-expanded", "false");
			btn.setAttribute("aria-controls", "jobieSidebar");
			btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      `;
			const topbar = document.querySelector(".jobie-topbar .jt-left");
			if (topbar) {
				topbar.prepend(btn);
				btn.addEventListener("click", toggleSidebar);
			}
		} else if (window.innerWidth > 1024) {
			const btn = document.getElementById("mobileSidebarToggle");
			if (btn) btn.remove();
			if (sidebar) sidebar.classList.remove("open");
		}
	}

	function toggleSidebar() {
		if (!sidebar) return;
		const isOpen = sidebar.classList.toggle("open");
		const btn = document.getElementById("mobileSidebarToggle");
		if (btn) btn.setAttribute("aria-expanded", String(isOpen));
		// Trap focus when open
		if (isOpen) trapFocus(sidebar);
	}

	function trapFocus(element) {
		const focusable = element.querySelectorAll(
			'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
		);
		const first = focusable[0];
		const last = focusable[focusable.length - 1];

		function handleTab(e) {
			if (e.key !== "Tab") return;
			if (e.shiftKey) {
				if (document.activeElement === first) {
					e.preventDefault();
					last.focus();
				}
			} else {
				if (document.activeElement === last) {
					e.preventDefault();
					first.focus();
				}
			}
		}

		element.addEventListener("keydown", handleTab);
		element.dataset.trapped = "true";

		// Cleanup on close
		const observer = new MutationObserver(() => {
			if (!element.classList.contains("open")) {
				element.removeEventListener("keydown", handleTab);
				element.removeAttribute("data-trapped");
				observer.disconnect();
			}
		});
		observer.observe(element, { attributes: true, attributeFilter: ["class"] });
	}

	// Close sidebar when clicking outside on mobile
	document.addEventListener("click", (e) => {
		if (window.innerWidth <= 1024 && sidebar?.classList.contains("open")) {
			const toggle = document.getElementById("mobileSidebarToggle");
			if (!sidebar.contains(e.target) && !toggle?.contains(e.target)) {
				sidebar.classList.remove("open");
				if (toggle) toggle.setAttribute("aria-expanded", "false");
			}
		}
	});

	// Close sidebar on nav link click (mobile)
	sidebar?.querySelectorAll(".js-nav-link").forEach((link) => {
		link.addEventListener("click", () => {
			if (window.innerWidth <= 1024) {
				sidebar.classList.remove("open");
				const toggle = document.getElementById("mobileSidebarToggle");
				if (toggle) toggle.setAttribute("aria-expanded", "false");
			}
		});
	});

	// Handle resize
	let resizeTimer;
	window.addEventListener("resize", () => {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(createMobileToggle, 100);
	});

	createMobileToggle();

	// Bokeh parallax effect on mouse move
	const bokehContainer = document.querySelector(".jobie-bokeh");
	if (
		bokehContainer &&
		!window.matchMedia("(prefers-reduced-motion: reduce)").matches
	) {
		const bokehItems = bokehContainer.querySelectorAll(".bokeh");

		document.addEventListener("mousemove", (e) => {
			const { clientX, clientY } = e;
			const x = (clientX / window.innerWidth - 0.5) * 2;
			const y = (clientY / window.innerHeight - 0.5) * 2;

			bokehItems.forEach((item, i) => {
				const factor = (i + 1) * 0.3;
				const tx = x * 30 * factor;
				const ty = y * 30 * factor;
				item.style.transform = `translate(${tx}px, ${ty}px)`;
			});
		});
	}

	// Active nav highlight based on current URL
	function setActiveNav() {
		const path = window.location.pathname;
		const navItems = document.querySelectorAll(".js-nav-item");

		navItems.forEach((item) => {
			const link = item.querySelector(".js-nav-link");
			if (!link) return;
			const href = link.getAttribute("href");
			if (href && path.startsWith(href) && href !== "/jobie-admin") {
				item.classList.add("js-nav-item--active");
			} else if (href === "/jobie-admin" && path === "/jobie-admin") {
				item.classList.add("js-nav-item--active");
			} else {
				item.classList.remove("js-nav-item--active");
			}
		});
	}

	setActiveNav();
})();
