(() => {
	var c = document.cookie.match(/(?:^|; )theme=(\w+)/);
	var theme = c
		? c[1]
		: window.matchMedia("(prefers-color-scheme: dark)").matches
			? "dark"
			: "light";
	if (theme === "dark") document.documentElement.classList.add("dark");
})();
