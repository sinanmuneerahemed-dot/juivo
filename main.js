import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({
    ignoreMobileResize: true,
    limitCallbacks: true
});

const video = document.getElementById('hero-video');
const canvas = document.getElementById('hero-canvas');
const context = canvas?.getContext('2d', { alpha: false }); // Optimize by disabling alpha
const root = document.documentElement;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const revealItems = gsap.utils.toArray('.reveal');
const storySteps = gsap.utils.toArray('.story-step');

let resizeTimer = null;

// Premium Interactive Features init
function initInteractiveFeatures() {
    // 1. Custom Blend-Mode Cursor
    const cursor = document.getElementById('custom-cursor');
    const interactiveElements = document.querySelectorAll('a, button, .story-step, .h-slide, .scroll-hint');
    
    // Performance optimized mouse follower using GSAP quickTo
    if (cursor && !window.matchMedia("(hover: none)").matches) {
        let xTo = gsap.quickTo(cursor, "x", {duration: 0.15, ease: "power3"});
        let yTo = gsap.quickTo(cursor, "y", {duration: 0.15, ease: "power3"});

        window.addEventListener("mousemove", e => {
            xTo(e.clientX);
            yTo(e.clientY);
        });

        // Add hover expanding state to all interactive elements
        interactiveElements.forEach(el => {
            el.addEventListener("mouseenter", () => cursor.classList.add("is-hovering"));
            el.addEventListener("mouseleave", () => cursor.classList.remove("is-hovering"));
        });
    }

    // 2. Magnetic CTA Buttons
    const ctaButton = document.querySelector('.header-cta');
    if (ctaButton && !window.matchMedia("(hover: none)").matches) {
        ctaButton.addEventListener("mousemove", function(e) {
            const position = ctaButton.getBoundingClientRect();
            const x = e.clientX - position.left - position.width / 2;
            const y = e.clientY - position.top - position.height / 2;

            gsap.to(ctaButton, {
                x: x * 0.35, 
                y: y * 0.35, 
                duration: 0.3,
                ease: "power2.out"
            });
        });

        ctaButton.addEventListener("mouseleave", function() {
            gsap.to(ctaButton, {
                x: 0, 
                y: 0, 
                duration: 0.7,
                ease: "elastic.out(1, 0.3)"
            });
        });
    }

    // 3. Infinite Scrolling Marquee Text
    const marqueeTrack = document.getElementById('marquee-track');
    if (marqueeTrack) {
        const marqueeTween = gsap.to(marqueeTrack, {
            xPercent: -50,
            ease: "none",
            duration: 15,
            repeat: -1
        });

        let scrollDecayTimeout;

        ScrollTrigger.create({
            start: 0,
            end: "max",
            onUpdate: (self) => {
                let velocity = Math.abs(self.getVelocity());
                
                // Gentler speed burst (max 3.5x speed)
                let targetTimeScale = 1 + (velocity / 400); 
                targetTimeScale = Math.min(targetTimeScale, 3.5);

                gsap.to(marqueeTween, {
                    timeScale: targetTimeScale,
                    duration: 0.3, // Quicker response to speed up
                    ease: "power2.out",
                    overwrite: "auto"
                });

                // Clear any existing decay timeout
                clearTimeout(scrollDecayTimeout);
                
                // Wait just 100ms after the last scroll event, then aggressively pull speed back to normal (1x)
                // This prevents the "infinite" stuck speed bug if the user abruptly stops scrolling.
                scrollDecayTimeout = setTimeout(() => {
                    gsap.to(marqueeTween, {
                        timeScale: 1,
                        duration: 0.8, // Smoothly coast down for almost a second
                        ease: "power3.out",
                        overwrite: "auto"
                    });
                }, 100);
            }
        });
    }
    // 4. Horizontal Scene Apple-Style Scroll
    const horizontalSection = document.getElementById('horizontal-showcase');
    const horizontalTrack = document.getElementById('horizontal-track');
    
    if (horizontalSection && horizontalTrack) {
        // Calculate the exact amount of x translation needed
        const getScrollAmount = () => -(horizontalTrack.scrollWidth - window.innerWidth);
        
        let horizontalTween = gsap.to(horizontalTrack, {
            x: getScrollAmount,
            ease: "none",
            scrollTrigger: {
                trigger: horizontalSection,
                start: "top top",
                end: () => `+=${horizontalTrack.scrollWidth - window.innerWidth}`,
                scrub: 1, // Smooth dampening
                pin: true, // Locks the section in place while scrubbing
                invalidateOnRefresh: true
            }
        });

        // Change background color dynamically for each slide
        const slides = gsap.utils.toArray('.h-slide');
        slides.forEach((slide) => {
            let bgColor = slide.getAttribute('data-bg');
            if (bgColor) {
                ScrollTrigger.create({
                    trigger: slide,
                    containerAnimation: horizontalTween,
                    start: "left center",
                    end: "right center",
                    onEnter: () => gsap.to('.horizontal-sticky', { backgroundColor: bgColor, duration: 0.8, overwrite: "auto" }),
                    onEnterBack: () => gsap.to('.horizontal-sticky', { backgroundColor: bgColor, duration: 0.8, overwrite: "auto" }),
                });
            }
        });
    }
}

function setAccent(tint) {
    gsap.to(root, {
        '--accent': tint,
        duration: 0.45,
        ease: 'power2.out',
        overwrite: true
    });
}

function buildIntroAnimations() {
    gsap.set(flavorCards, { y: 42, autoAlpha: 0 });

    const intro = gsap.timeline({
        defaults: {
            ease: 'power3.out'
        }
    });

    intro
        .from('.site-header', {
            y: -24,
            autoAlpha: 0,
            duration: 0.8
        })
        .from(video, {
            autoAlpha: 0,
            duration: 1.1
        }, 0.05)
        .from(revealItems, {
            y: 32,
            autoAlpha: 0,
            duration: 0.9,
            stagger: 0.1
        }, 0.2)
        .from('.scroll-hint', {
            y: 16,
            autoAlpha: 0,
            duration: 0.7
        }, 0.55);
}

function buildScrollAnimations() {
    const scrubValue = prefersReducedMotion ? false : 0.85;

    gsap.to('.panel--hero .panel-inner', {
        yPercent: -16,
        autoAlpha: 0.06,
        ease: 'none',
        scrollTrigger: {
            trigger: '#hero',
            start: 'top top',
            end: 'bottom top',
            scrub: scrubValue
        }
    });

    gsap.to('.scroll-hint', {
        y: -22,
        autoAlpha: 0,
        ease: 'none',
        scrollTrigger: {
            trigger: '#hero',
            start: 'top top',
            end: '+=220',
            scrub: scrubValue
        }
    });

    if (!prefersReducedMotion && video && canvas && context) {
        let isDrawing = false;
        let targetTime = 0;
        let cWidth = 0;
        let cHeight = 0;

        // Size the canvas correctly based on the video source
        const setupCanvasSize = () => {
            cWidth = video.videoWidth || window.innerWidth;
            cHeight = video.videoHeight || window.innerHeight;
            canvas.width = cWidth;
            canvas.height = cHeight;
        };

        const drawFrame = () => {
            if (cWidth > 0 && cHeight > 0) {
                context.drawImage(video, 0, 0, cWidth, cHeight);
            }
        };

        const setupVideoSync = () => {
            setupCanvasSize();
            drawFrame(); // Draw initial frame

            // Create a render loop that constantly paints whichever frame the video is currently on
            const renderLoop = () => {
                if (!video.paused && !video.ended) {
                    if (video.videoWidth > 0 && video.videoHeight > 0) {
                        context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    }
                }
                requestAnimationFrame(renderLoop);
            };
            requestAnimationFrame(renderLoop);
            
            // Prime the video
            video.currentTime = 0;
            video.loop = false;
            video.playbackRate = 1.75; // Speed up the video playback slightly
            video.pause();

            // The hero section bounds logic:
            // We only want to lock the user ONCE they scroll into the hero section,
            // and we want to unlock them if they manage to scroll past it (either up or down).
            
            let isHeroLocked = false;
            let hasCompletedVideo = false; // Add flag so we don't re-lock instantly
            let heroUnlockTime = 0;

            const lockScroll = () => {
                if (!isHeroLocked) {
                    document.body.style.overflow = 'hidden';
                    isHeroLocked = true;
                    hasCompletedVideo = false; // Reset completion state if we legitimately lock
                }
            };
            
            const unlockScroll = () => {
                if (isHeroLocked) {
                    document.body.style.overflow = '';
                    isHeroLocked = false;
                    hasCompletedVideo = true; // Mark as passed
                    heroUnlockTime = Date.now();
                }
            };

            // Remove the hard lock on load, rely on the observer instead
            // document.body.style.overflow = 'hidden';

            let isScrollingDown = true;
            let isUserActivelyScrolling = false;
            let scrollTimeout;
            let activeWheelEvents = 0;
            
            // Custom playback loop to handle forwards AND backwards playback
            let lastTimestamp = performance.now();
            
            const playbackLoop = (timestamp) => {
                const deltaTime = (timestamp - lastTimestamp) / 1000;
                lastTimestamp = timestamp;

                if (isUserActivelyScrolling && isHeroLocked) {
                    const timeStep = deltaTime * 1.75; 

                    if (isScrollingDown) {
                        // Play forward
                        if (video.currentTime + timeStep < video.duration) {
                            video.currentTime += timeStep;
                            context.drawImage(video, 0, 0, canvas.width, canvas.height);
                        } else {
                            video.currentTime = video.duration;
                            unlockScroll(); // Free the user at the bottom
                        }
                    } else {
                        // Play backward
                        if (video.currentTime - timeStep > 0) {
                            video.currentTime -= timeStep;
                            context.drawImage(video, 0, 0, canvas.width, canvas.height);
                        } else {
                            video.currentTime = 0;
                            unlockScroll(); // Free the user at the top
                        }
                    }
                }
                
                requestAnimationFrame(playbackLoop);
            };
            requestAnimationFrame(playbackLoop);

            // Use an observer to know exactly when the hero section is fully on screen
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    // Lock if the hero is mostly taking up the screen
                    if (entry.isIntersecting && entry.intersectionRatio > 0.8) {
                        // Prevent re-locking instantly right after they just unlocked
                        if (hasCompletedVideo && (Date.now() - heroUnlockTime < 1500)) {
                            return; // Let them scroll away!
                        }

                        // Also don't lock if they are trying to scroll AWAY after completing
                        if (hasCompletedVideo && entry.intersectionRatio < 1.0) {
                            return; 
                        }

                        lockScroll();
                        
                        // Force a scroll to exactly top 0 so it's perfectly framed
                        window.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                        });
                    }
                });
            }, {
                root: null,
                threshold: [0.1, 0.5, 0.8, 1.0]
            });
            
            observer.observe(document.getElementById('hero'));
            
            // Listen to the user's scroll wheel natively
            let wheelListener = (e) => {
                if (!isHeroLocked) return; // Ignore if we aren't trapped
                
                // Prevent the actual page from scrolling underneath if we are locked, 
                // but allow the wheel event to pass through if we aren't
                if (e.cancelable) e.preventDefault();

                isUserActivelyScrolling = true;
                activeWheelEvents++;
                
                if (e.deltaY > 0) {
                    isScrollingDown = true;
                } else if (e.deltaY < 0) {
                    isScrollingDown = false;
                }
                
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    activeWheelEvents--;
                    if (activeWheelEvents <= 0) {
                        isUserActivelyScrolling = false;
                        activeWheelEvents = 0;
                    }
                }, 150); 
            };
            
            // Attach the wheel listeners (cannot be passive if we want to preventDefault)
            window.addEventListener('wheel', wheelListener, { passive: false });
            
            // For mobile touch scrolling
            let lastTouchY = 0;
            window.addEventListener('touchstart', e => {
                lastTouchY = e.touches[0].clientY;
            }, { passive: true });
            
            window.addEventListener('touchmove', e => {
                if (!isHeroLocked) return;
                
                if (e.cancelable) e.preventDefault();
                
                const currentTouchY = e.touches[0].clientY;
                if (Math.abs(lastTouchY - currentTouchY) > 5) {
                    isUserActivelyScrolling = true;
                    isScrollingDown = lastTouchY > currentTouchY;
                    activeWheelEvents++;
                    
                    clearTimeout(scrollTimeout);
                    scrollTimeout = setTimeout(() => {
                        activeWheelEvents--;
                        if (activeWheelEvents <= 0) {
                            isUserActivelyScrolling = false;
                            activeWheelEvents = 0;
                        }
                    }, 150); 
                }
                lastTouchY = currentTouchY;
            }, { passive: false });
            
            // Update canvas upon resize
            window.addEventListener('resize', () => {
                setupCanvasSize();
                if (video.paused) { 
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                }
            }, { passive: true });
        };

        // We MUST wait for loadeddata so videoWidth/videoHeight are populated before sizing the Canvas
        if (video.readyState >= 2) {
            setupVideoSync();
        } else {
            video.addEventListener('loadeddata', setupVideoSync);
        }
    }

    storySteps.forEach((step) => {
        const tint = step.dataset.tint || 'rgba(255, 170, 61, 0.86)';

        gsap.to(step, {
            y: 0,
            autoAlpha: 1,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: step,
                start: 'top 72%',
                end: 'top 42%',
                scrub: scrubValue,
                onEnter: () => setAccent(tint),
                onEnterBack: () => setAccent(tint),
                toggleClass: {
                    targets: step,
                    className: 'is-active'
                }
            }
        });

        gsap.to(step, {
            y: -38,
            autoAlpha: 0.2,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: step,
                start: 'bottom 50%',
                end: 'bottom 18%',
                scrub: scrubValue,
                onLeave: () => step.classList.remove('is-active'),
                onLeaveBack: () => step.classList.remove('is-active')
            }
        });
    });

    gsap.to(flavorCards, {
        y: 0,
        autoAlpha: 1,
        duration: 0.9,
        stagger: 0.14,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.panel--flavors',
            start: 'top 72%',
            once: true
        }
    });

    gsap.from('.order-card', {
        y: 48,
        autoAlpha: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '#order',
            start: 'top 80%',
            once: true
        }
    });
}

function attachResizeHandler() {
    window.addEventListener('resize', () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
            ScrollTrigger.refresh();
        }, 120);
    }, { passive: true });
}

function init() {
    initInteractiveFeatures();
    buildIntroAnimations();
    buildScrollAnimations();
    attachResizeHandler();
}

init();
