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
const flavorCards = gsap.utils.toArray('.flavor-card');

let resizeTimer = null;

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

            const lockScroll = () => {
                if (!isHeroLocked) {
                    document.body.style.overflow = 'hidden';
                    isHeroLocked = true;
                }
            };
            
            const unlockScroll = () => {
                if (isHeroLocked) {
                    document.body.style.overflow = '';
                    isHeroLocked = false;
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
    buildIntroAnimations();
    buildScrollAnimations();
    attachResizeHandler();
}

init();
