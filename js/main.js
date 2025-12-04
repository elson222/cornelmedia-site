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

// Header Scroll Effect
const header = document.querySelector('header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
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

// Section Fade Up (Apple-style smooth reveal)
gsap.utils.toArray('.section').forEach(section => {
    gsap.from(section, {
        opacity: 0,
        y: 80, /* Larger movement */
        duration: 1.5, /* Slower duration */
        ease: "power3.out", /* Smooth ease */
        scrollTrigger: {
            trigger: section,
            start: "top 85%", /* Trigger slightly later */
            end: "top 20%",
            toggleActions: "play none none reverse"
        }
    });
});

// Mobile Menu Toggle
const mobileBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

mobileBtn.addEventListener('click', () => {
    if (navLinks.style.display === 'flex') {
        navLinks.style.display = 'none';
    } else {
        navLinks.style.display = 'flex';
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '80px';
        navLinks.style.left = '0';
        navLinks.style.width = '100%';
        navLinks.style.background = 'rgba(5, 5, 5, 0.95)';
        navLinks.style.padding = '20px';
        navLinks.style.textAlign = 'center';
    }
});
