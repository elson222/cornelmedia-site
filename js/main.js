// Initialize Lenis for smooth scrolling
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

// GSAP Animations
gsap.registerPlugin(ScrollTrigger);

// Smart Header (Hide on scroll down, show on scroll up/hover)
const header = document.querySelector('header');
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    // Add background when scrolled
    if (currentScrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }

    // Hide/Show based on direction
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling Down -> Hide
        header.classList.add('hidden');
    } else {
        // Scrolling Up -> Show
        header.classList.remove('hidden');
    }

    lastScrollY = currentScrollY;
});

// Show header on mouse hover near top
document.addEventListener('mousemove', (e) => {
    if (e.clientY < 100) {
        header.classList.remove('hidden');
    }
});

// Hero Background Blur on Scroll
gsap.to(".hero-bg", {
    scrollTrigger: {
        trigger: ".hero-section",
        start: "top top",
        end: "bottom top",
        scrub: true
    },
    filter: "blur(10px)",
    ease: "none"
});

// Hero Content Parallax
gsap.to(".hero-content", {
    scrollTrigger: {
        trigger: ".hero-section",
        start: "top top",
        end: "bottom top",
        scrub: true
    },
    y: 100,
    opacity: 0,
    ease: "none"
});

// Hero Text Animation
const tl = gsap.timeline({ delay: 0.5 });

tl.from(".hero-subtitle", {
    y: 20,
    opacity: 0,
    duration: 1.2,
    ease: "power3.out"
})
    .from(".brand-highlight", {
        scale: 0, /* Start from nothing */
        opacity: 0,
        duration: 1.5,
        ease: "elastic.out(1, 0.5)", /* Water drop pop effect */
        transformOrigin: "center center"
    }, "-=0.8")
    .from(".brand-secondary", {
        y: 20,
        opacity: 0,
        duration: 1,
        ease: "power2.out"
    }, "-=1")
    .from(".hero-title", {
        y: 30,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out"
    }, "-=0.8")
    .from(".hero-tags a", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out"
    }, "-=0.8");

// Section Transitions (Book-style fade away)
gsap.utils.toArray('.section, .hero-section').forEach(section => {
    const content = section.querySelector('.container');

    if (content) {
        // Fade in when entering
        gsap.fromTo(content,
            { opacity: 0, y: 50 },
            {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: section,
                    start: "top 80%",
                    end: "top 50%",
                    toggleActions: "play none none reverse"
                }
            }
        );

        // Fade out when leaving (Book effect)
        gsap.to(content, {
            opacity: 0,
            scale: 0.95,
            y: -50,
            scrollTrigger: {
                trigger: section,
                start: "top top",
                end: "bottom top",
                scrub: true
            }
        });
    }
});

// Circular 3D Gallery
const gallerySection = document.querySelector('.gallery-section');
const galleryWheel = document.querySelector('.gallery-wheel');
const cards = gsap.utils.toArray('.gallery-card');

if (gallerySection && galleryWheel && cards.length) {
    const numCards = cards.length;
    const radius = 300; // Distance from center
    const angleStep = 360 / numCards;

    // Initial positioning of cards
    cards.forEach((card, index) => {
        const angle = index * angleStep;
        gsap.set(card, {
            rotationY: angle,
            z: radius,
            transformOrigin: "50% 50% -300px" // Center of rotation
        });
    });

    // Rotate the wheel on scroll
    gsap.to(galleryWheel, {
        rotationY: -360, // Full rotation
        ease: "none",
        scrollTrigger: {
            trigger: ".gallery-section",
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
            // markers: true // Uncomment for debugging
        }
    });
}

// Mobile Menu Toggle
const mobileBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');

        // Toggle hamburger icon
        const icon = mobileBtn.textContent.trim() === '☰' ? '✕' : '☰';
        mobileBtn.textContent = icon;
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            mobileBtn.textContent = '☰';
        });
    });
}
