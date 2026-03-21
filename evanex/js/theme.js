const toggleButton = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme');

if (currentTheme) {
    document.documentElement.setAttribute('data-theme', currentTheme);
    if (currentTheme === 'dark') {
        toggleButton.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

toggleButton.addEventListener('click', () => {
    let theme = 'light';
    if (!document.documentElement.getAttribute('data-theme') || document.documentElement.getAttribute('data-theme') === 'light') {
        theme = 'dark';
        toggleButton.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        toggleButton.innerHTML = '<i class="fas fa-moon"></i>';
    }

    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
});
