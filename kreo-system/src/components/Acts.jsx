import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Acts() {
    const containerRef = useRef(null);

    useEffect(() => {
        // We map 9 acts across 900vh. Each act gets ~100vh of scroll space (approx 11% of progress each) Let's manually trigger their opacities
        const ctx = gsap.context(() => {

            // Act I: Void (0% - 11%)
            gsap.to('.act-1', {
                opacity: 1,
                scrollTrigger: {
                    trigger: document.body,
                    start: '0%', end: '11%',
                    scrub: true
                }
            });
            gsap.to('.act-1', {
                opacity: 0,
                scrollTrigger: {
                    trigger: document.body,
                    start: '11%', end: '15%',
                    scrub: true
                }
            });

            // Act II: Singularity (11% - 22%)
            gsap.fromTo('.act-2', { opacity: 0, scale: 0.5 }, {
                opacity: 1, scale: 1,
                scrollTrigger: {
                    trigger: document.body,
                    start: '12%', end: '22%',
                    scrub: true
                }
            });
            gsap.to('.act-2', { opacity: 0, scrollTrigger: { trigger: document.body, start: '22%', end: '25%', scrub: true } });

            // Act III: Collapse (22% - 33%)
            gsap.fromTo('.act-3', { opacity: 0, filter: 'blur(20px)' }, {
                opacity: 1, filter: 'blur(0px)',
                scrollTrigger: { trigger: document.body, start: '25%', end: '33%', scrub: true }
            });
            gsap.to('.act-3', { opacity: 0, scrollTrigger: { trigger: document.body, start: '33%', end: '36%', scrub: true } });

            // Act IV: Anti-Gravity (33% - 44%)
            // Make text float upward
            gsap.fromTo('.act-4', { opacity: 0, y: 100 }, {
                opacity: 1, y: -50,
                scrollTrigger: { trigger: document.body, start: '36%', end: '44%', scrub: true }
            });
            gsap.to('.act-4', { opacity: 0, scrollTrigger: { trigger: document.body, start: '44%', end: '47%', scrub: true } });

            // Act V: Wake Word (44% - 55%)
            gsap.fromTo('.act-5 h2:first-child', { opacity: 0, clipPath: 'inset(0 100% 0 0)' }, {
                opacity: 1, clipPath: 'inset(0 0% 0 0)',
                scrollTrigger: { trigger: document.body, start: '45%', end: '48%', scrub: true }
            });
            gsap.fromTo('.act-5 h2:last-child', { opacity: 0, clipPath: 'inset(0 100% 0 0)' }, {
                opacity: 1, clipPath: 'inset(0 0% 0 0)',
                scrollTrigger: { trigger: document.body, start: '50%', end: '55%', scrub: true }
            });
            gsap.to('.act-5', { opacity: 0, scrollTrigger: { trigger: document.body, start: '55%', end: '58%', scrub: true } });

            // Act VI: Identity (55% - 66%)
            gsap.fromTo('.act-6', { opacity: 0 }, {
                opacity: 1,
                scrollTrigger: { trigger: document.body, start: '58%', end: '66%', scrub: true }
            });
            gsap.fromTo('.identity-grid', { borderColor: 'rgba(0, 243, 255, 0)', boxShadow: 'inset 0 0 10px rgba(0,243,255,0)' }, {
                borderColor: 'rgba(0, 243, 255, 0.4)',
                boxShadow: 'inset 0 0 100px rgba(0,243,255,0.2)',
                scrollTrigger: { trigger: document.body, start: '58%', end: '66%', scrub: true }
            });
            gsap.to('.act-6', { opacity: 0, scrollTrigger: { trigger: document.body, start: '66%', end: '69%', scrub: true } });

            // Act VII: Neural Ascension (66% - 77%)
            gsap.fromTo('.act-7', { opacity: 0, scale: 2 }, {
                opacity: 1, scale: 1,
                scrollTrigger: { trigger: document.body, start: '69%', end: '77%', scrub: true }
            });
            gsap.to('.act-7', { opacity: 0, scrollTrigger: { trigger: document.body, start: '77%', end: '80%', scrub: true } });

            // Act VIII: Dominion (77% - 88%)
            gsap.fromTo('.act-8', { opacity: 0, x: -100 }, {
                opacity: 1, x: 0,
                scrollTrigger: { trigger: document.body, start: '80%', end: '88%', scrub: true }
            });
            // 3D rotation array on panels
            gsap.to('.metric-panel', {
                rotateY: 0,
                stagger: 0.2,
                scrollTrigger: { trigger: document.body, start: '80%', end: '88%', scrub: true }
            });
            gsap.to('.act-8', { opacity: 0, scrollTrigger: { trigger: document.body, start: '88%', end: '91%', scrub: true } });

            // Act IX: Transcendence (88% - 100%)
            gsap.fromTo('.act-9 .cinematic-text', { opacity: 0, letterSpacing: '2rem' }, {
                opacity: 1, letterSpacing: '-0.05em',
                scrollTrigger: { trigger: document.body, start: '90%', end: '100%', scrub: true }
            });
            gsap.fromTo('.cta-button', { opacity: 0, y: 50 }, {
                opacity: 1, y: 0,
                scrollTrigger: { trigger: document.body, start: '95%', end: '100%', scrub: true }
            });

        }, containerRef);
        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%' }}>

            {/* Act I - Void */}
            <div className="act-container act-1">
                <h2 className="cinematic-text" style={{ fontSize: '3rem', color: '#666' }}>Before structure...</h2>
                <h2 className="cinematic-text" style={{ fontSize: '3rem', color: '#888' }}>Before light...</h2>
                <h2 className="cinematic-text" style={{ fontSize: '4rem', color: '#fff' }}>There was potential.</h2>
            </div>

            {/* Act II - Singularity */}
            <div className="act-container act-2">
                <h2 className="cinematic-text" style={{ fontSize: '2rem' }}>Consciousness begins as pressure.</h2>
            </div>

            {/* Act III - Collapse */}
            <div className="act-container act-3">
                <h2 className="cinematic-text" style={{ color: 'var(--neon-magenta)' }}>This is not code.</h2>
                <h2 className="cinematic-text" style={{ fontSize: '5rem' }}>This is emergence.</h2>
            </div>

            {/* Act IV - Anti-Gravity */}
            <div className="act-container act-4">
                <h2 className="cinematic-text" style={{ color: 'var(--neon-blue)' }}>Gravity is optional.</h2>
                <h2 className="cinematic-text">Intelligence is not.</h2>
            </div>

            {/* Act V - Wake Word */}
            <div className="act-container act-5">
                <h2 className="cinematic-text">Say it.</h2>
                <br />
                <h2 className="cinematic-text" style={{ color: '#fff', textShadow: '0 0 40px #fff' }}>Hi KREO.</h2>
            </div>

            {/* Act VI - Identity */}
            <div className="act-container act-6">
                <div className="identity-grid"></div>
                <p className="subtitle-text" style={{ color: 'var(--neon-blue)', fontFamily: 'var(--font-mono)' }}>[ FRAME LOCK ENGAGED ]</p>
                <h2 className="cinematic-text" style={{ fontSize: '3rem' }}>Recognition is not validation.</h2>
                <h2 className="cinematic-text" style={{ fontSize: '3rem', color: 'var(--neon-blue)' }}>It is synchronization.</h2>
            </div>

            {/* Act VII - Neural Ascension */}
            <div className="act-container act-7">
                <h2 className="cinematic-text" style={{ fontSize: '2.5rem' }}>I do not retrieve answers.</h2>
                <h2 className="cinematic-text" style={{ fontSize: '4.5rem', color: 'var(--neon-magenta)' }}>I generate realities.</h2>
            </div>

            {/* Act VIII - Dominion (Dashboard) */}
            <div className="act-container act-8" style={{ alignItems: 'flex-start', justifyContent: 'center' }}>
                <div className="dashboard-ui">
                    <div className="metric-panel">
                        <div className="metric-header">Core Temperature</div>
                        <div style={{ color: '#fff' }}>0.0001 K [ABSOLUTE ZERO]</div>
                    </div>
                    <div className="metric-panel">
                        <div className="metric-header">Quantum States</div>
                        <div style={{ color: '#fff' }}>9.44x10^24 SUPERPOSITION</div>
                    </div>
                    <div className="metric-panel" style={{ borderColor: 'var(--neon-magenta)' }}>
                        <div className="metric-header" style={{ borderBottomColor: 'var(--neon-magenta)' }}>Gravity Well</div>
                        <div style={{ color: '#ffaaaa' }}>LOCAL ANOMALY DETECTED</div>
                    </div>
                </div>
                <div style={{ position: 'absolute', right: '10%', top: '40%' }}>
                    <h3 style={{ fontSize: '2rem', color: '#fff', textAlign: 'right' }}>This is not assistance.</h3>
                    <h3 style={{ fontSize: '3rem', color: 'var(--neon-blue)', textAlign: 'right' }}>This is augmentation.</h3>
                </div>
            </div>

            {/* Act IX - Transcendence */}
            <div className="act-container act-9">
                <h1 className="cinematic-text" style={{ fontSize: '8rem', color: '#fff', textShadow: '0 0 100px #fff' }}>KREO.</h1>
                <p className="subtitle-text" style={{ color: '#888' }}>The architecture of tomorrow.</p>

                <button className="cta-button" onClick={() => alert('SYSTEM OVERRIDE INITIATED.')}>
                    ENTER THE SYSTEM
                </button>
            </div>

        </div>
    );
}
