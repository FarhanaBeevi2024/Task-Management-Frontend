import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

/** Prefer your listing URLs in .env; fallbacks open the App Store / Play catalog until set. */
const IOS_APP_URL =
  import.meta.env.VITE_IOS_APP_STORE_URL || 'https://www.apple.com/app-store/';
const ANDROID_APP_URL =
  import.meta.env.VITE_ANDROID_PLAY_STORE_URL || 'https://play.google.com/store/apps';

function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-header-inner">
          <Link to="/" className="landing-logo" aria-label="Task Flow home">
            <img
              src="/task-flow-logo.png"
              alt=""
              width={48}
              height={48}
              className="landing-logo-img"
              decoding="async"
            />
            <span className="landing-logo-text">Task Flow</span>
          </Link>
          <nav className="landing-nav" aria-label="Primary">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#download-app">Mobile app</a>
          </nav>
          <div className="landing-header-actions">
            <a href="#download-app" className="landing-nav-mobile-app">
              Mobile app
            </a>
            <Link to="/sign-in" className="landing-btn landing-btn-primary">
              Get started
            </Link>
            <Link to="/sign-in" className="landing-btn landing-btn-ghost">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero" aria-labelledby="hero-heading">
          <div className="landing-hero-bg" aria-hidden />
          <div className="landing-hero-inner">
            <p className="landing-eyebrow">Built for modern teams</p>
            <h1 id="hero-heading" className="landing-hero-title">
              Ship work faster with clarity across projects and tasks
            </h1>
            <p className="landing-hero-lede">
              Plan sprints, track issues, and keep everyone aligned—without the spreadsheet
              chaos. One place for your backlog, board, and team workflow.
            </p>
            <div className="landing-hero-ctas">
              <Link to="/sign-in" className="landing-btn landing-btn-primary landing-btn-lg">
                Sign in to your workspace
              </Link>
              <a href="#features" className="landing-btn landing-btn-outline landing-btn-lg">
                Explore features
              </a>
            </div>
            <ul className="landing-hero-points" role="list">
              <li>Projects, boards, and workflows in one app</li>
              <li>Role-based access for your organization</li>
              <li>Designed for remote and hybrid teams</li>
            </ul>
          </div>
        </section>

        <section id="features" className="landing-section landing-features">
          <div className="landing-section-inner">
            <h2 className="landing-section-title">Everything you need to run delivery</h2>
            <p className="landing-section-sub">
              From intake to done—stay on top of work with views your team will actually use.
            </p>
            <div className="landing-feature-grid">
              <article className="landing-card">
                <div className="landing-card-icon" aria-hidden>
                  ◇
                </div>
                <h3>Projects &amp; tasks</h3>
                <p>
                  Organize work into projects, break it into tasks, and see status at a glance on
                  boards and lists.
                </p>
              </article>
              <article className="landing-card">
                <div className="landing-card-icon" aria-hidden>
                  ◈
                </div>
                <h3>Workflows that fit you</h3>
                <p>
                  Move items through stages that match how your team works—no rigid tool forcing
                  your process.
                </p>
              </article>
              <article className="landing-card">
                <div className="landing-card-icon" aria-hidden>
                  ◆
                </div>
                <h3>Team visibility</h3>
                <p>
                  Keep stakeholders informed with shared views, clear ownership, and a single
                  source of truth.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="landing-section landing-steps">
          <div className="landing-section-inner">
            <h2 className="landing-section-title">How it works</h2>
            <ol className="landing-steps-list">
              <li>
                <span className="landing-step-num">1</span>
                <div>
                  <h3>Join your organization</h3>
                  <p>Use your invitation to create an account and land in the right workspace.</p>
                </div>
              </li>
              <li>
                <span className="landing-step-num">2</span>
                <div>
                  <h3>Plan and prioritize</h3>
                  <p>Capture work, assign owners, and order what matters for the next sprint or release.</p>
                </div>
              </li>
              <li>
                <span className="landing-step-num">3</span>
                <div>
                  <h3>Execute and improve</h3>
                  <p>Track progress on the board, unblock work, and refine estimates with real data.</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section
          id="download-app"
          className="landing-section landing-download-outer"
          aria-labelledby="download-app-heading"
        >
          <div className="landing-section-inner">
            <div className="landing-download-card">
              <div className="landing-download-grid">
                <div className="landing-download-text">
                  <span className="landing-download-badge">Download the App</span>
                  <h2 id="download-app-heading" className="landing-download-title">
                    Download our app and empower your productivity
                  </h2>
                  <p className="landing-download-body">
                    Task Flow helps you plan, organize, and track work effortlessly. Manage
                    everything in one place with real-time collaboration, smart reminders, and an
                    intuitive design—so you can focus on what matters most, on the web or on the go.
                  </p>
                  <div className="landing-download-stores">
                    <a
                      href={ANDROID_APP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="landing-store-badge-link"
                      aria-label="Get Task Flow on Google Play"
                    >
                      <img
                        src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
                        alt=""
                        className="landing-store-badge-img landing-store-badge-img--play"
                        width={180}
                        height={70}
                        decoding="async"
                      />
                    </a>
                    <a
                      href={IOS_APP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="landing-store-badge-link"
                      aria-label="Download Task Flow on the App Store"
                    >
                      <img
                        src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83"
                        alt=""
                        className="landing-store-badge-img landing-store-badge-img--apple"
                        width={160}
                        height={54}
                        decoding="async"
                      />
                    </a>
                  </div>
                </div>
                <div className="landing-download-visual">
                  <div className="landing-download-visual-inner">
                    <img
                      src="/landing-app-hero.png"
                      alt="Task Flow on mobile: onboarding, dashboard, and schedule views across three phones"
                      className="landing-download-mockup"
                      width={911}
                      height={477}
                      decoding="async"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-cta-band" aria-labelledby="cta-heading">
          <div className="landing-cta-inner">
            <h2 id="cta-heading">Ready to focus your team?</h2>
            <p>Sign in to access your workspace—your organization admin sends invitations for new members.</p>
            <Link to="/sign-in" className="landing-btn landing-btn-on-dark landing-btn-lg">
              Sign In
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand-wrap">
            <img
              src="/task-flow-logo.png"
              alt=""
              width={36}
              height={36}
              className="landing-footer-logo"
              decoding="async"
            />
            <span className="landing-footer-brand">Task Flow</span>
          </div>
          <span className="landing-footer-note">© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
