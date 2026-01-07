document.addEventListener('DOMContentLoaded', function () {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        // Toggle menu on click
        hamburger.addEventListener('click', function (e) {
            e.preventDefault(); // Prevent default behavior
            navLinks.classList.toggle('active');
            console.log('Hamburger clicked, menu toggled');
        });

        // Close menu when clicking ANY link inside nav-links
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    } else {
        console.error('Hamburger or nav-links not found!');
    }
});
