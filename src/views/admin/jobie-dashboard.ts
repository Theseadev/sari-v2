// src/views/admin/jobie-dashboard.ts — Jobie Admin Dashboard View

import { jobieAdminLayout } from "./jobie-helpers";

export function jobieDashboard(user: {
	name: string;
	email: string;
	role: string;
	avatar?: string;
}): string {
	const body = `
<div class="jd-header">
  <div class="jd-welcome">
    <h2 class="jd-title">Dashboard</h2>
    <p class="jd-subtitle">Welcome back, ${user.name}! Here's what's happening with your jobs.</p>
  </div>
  <div class="jd-actions">
    <a href="/jobie-admin/jobs/create" class="btn btn-primary">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      Post a Job
    </a>
  </div>
</div>

<div class="jd-stats" role="region" aria-label="Statistics">
  <article class="stat-card">
    <div class="stat-icon stat-icon--purple">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
    </div>
    <div class="stat-content">
      <span class="stat-value">24</span>
      <span class="stat-label">Active Jobs</span>
    </div>
    <span class="stat-trend positive">+12%</span>
  </article>

  <article class="stat-card">
    <div class="stat-icon stat-icon--blue">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    </div>
    <div class="stat-content">
      <span class="stat-value">1,234</span>
      <span class="stat-label">Applications</span>
    </div>
    <span class="stat-trend positive">+8%</span>
  </article>

  <article class="stat-card">
    <div class="stat-icon stat-icon--green">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    </div>
    <div class="stat-content">
      <span class="stat-value">89</span>
      <span class="stat-label">Messages</span>
    </div>
    <span class="stat-trend positive">+23%</span>
  </article>

  <article class="stat-card">
    <div class="stat-icon stat-icon--orange">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
    </div>
    <div class="stat-content">
      <span class="stat-value">45.2k</span>
      <span class="stat-label">Total Views</span>
    </div>
    <span class="stat-trend positive">+15%</span>
  </article>
</div>

<div class="jd-grid">
  <section class="jd-card jd-card--main" aria-labelledby="recentJobsTitle">
    <header class="jd-card-header">
      <h3 id="recentJobsTitle" class="jd-card-title">Recent Job Posts</h3>
      <a href="/jobie-admin/jobs" class="jd-card-link">View all</a>
    </header>
    <div class="jd-table-wrap">
      <table class="jd-table" role="table">
        <thead>
          <tr>
            <th scope="col">Job Title</th>
            <th scope="col">Company</th>
            <th scope="col">Location</th>
            <th scope="col">Type</th>
            <th scope="col">Status</th>
            <th scope="col">Applicants</th>
            <th scope="col">Posted</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Senior Frontend Developer</strong></td>
            <td>TechCorp Inc.</td>
            <td>San Francisco, CA</td>
            <td><span class="badge badge--fulltime">Full-time</span></td>
            <td><span class="badge badge--active">Active</span></td>
            <td>42</td>
            <td>2 days ago</td>
          </tr>
          <tr>
            <td><strong>Product Designer</strong></td>
            <td>DesignStudio</td>
            <td>Remote</td>
            <td><span class="badge badge--contract">Contract</span></td>
            <td><span class="badge badge--active">Active</span></td>
            <td>28</td>
            <td>5 days ago</td>
          </tr>
          <tr>
            <td><strong>DevOps Engineer</strong></td>
            <td>CloudScale</td>
            <td>New York, NY</td>
            <td><span class="badge badge--fulltime">Full-time</span></td>
            <td><span class="badge badge--pending">Pending</span></td>
            <td>15</td>
            <td>1 week ago</td>
          </tr>
          <tr>
            <td><strong>Backend Developer (Node.js)</strong></td>
            <td>DataFlow</td>
            <td>Austin, TX</td>
            <td><span class="badge badge--fulltime">Full-time</span></td>
            <td><span class="badge badge--active">Active</span></td>
            <td>67</td>
            <td>3 days ago</td>
          </tr>
          <tr>
            <td><strong>UI/UX Designer</strong></td>
            <td>CreativeMinds</td>
            <td>Remote</td>
            <td><span class="badge badge--parttime">Part-time</span></td>
            <td><span class="badge badge--draft">Draft</span></td>
            <td>0</td>
            <td>1 day ago</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <aside class="jd-card jd-card--side" aria-labelledby="quickStatsTitle">
    <header class="jd-card-header">
      <h3 id="quickStatsTitle" class="jd-card-title">Quick Stats</h3>
    </header>
    <div class="qs-list">
      <div class="qs-item">
        <div class="qs-icon qs-icon--purple">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div class="qs-content">
          <span class="qs-label">Unread Messages</span>
          <span class="qs-value">12</span>
        </div>
      </div>
      <div class="qs-item">
        <div class="qs-icon qs-icon--blue">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <div class="qs-content">
          <span class="qs-label">Pending Reviews</span>
          <span class="qs-value">7</span>
        </div>
      </div>
      <div class="qs-item">
        <div class="qs-icon qs-icon--green">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        </div>
        <div class="qs-content">
          <span class="qs-label">Conversion Rate</span>
          <span class="qs-value">3.2%</span>
        </div>
      </div>
      <div class="qs-item">
        <div class="qs-icon qs-icon--orange">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>
        </div>
        <div class="qs-content">
          <span class="qs-label">Avg. Time to Fill</span>
          <span class="qs-value">18 days</span>
        </div>
      </div>
    </div>
  </aside>
</div>

<section class="jd-card jd-card--full" aria-labelledby="activityTitle">
  <header class="jd-card-header">
    <h3 id="activityTitle" class="jd-card-title">Recent Activity</h3>
    <a href="/jobie-admin/activity" class="jd-card-link">View all</a>
  </header>
  <div class="activity-list">
    <article class="activity-item">
      <div class="activity-icon activity-icon--purple">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
      </div>
      <div class="activity-content">
        <p class="activity-text"><strong>Sarah Johnson</strong> applied for <strong>Senior Frontend Developer</strong></p>
        <time class="activity-time" datetime="2024-01-15T10:30:00">2 hours ago</time>
      </div>
    </article>
    <article class="activity-item">
      <div class="activity-icon activity-icon--blue">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </div>
      <div class="activity-content">
        <p class="activity-text">New message from <strong>Michael Chen</strong> regarding <strong>Product Designer</strong> position</p>
        <time class="activity-time" datetime="2024-01-15T09:15:00">4 hours ago</time>
      </div>
    </article>
    <article class="activity-item">
      <div class="activity-icon activity-icon--green">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div class="activity-content">
        <p class="activity-text"><strong>DevOps Engineer</strong> job post approved and published</p>
        <time class="activity-time" datetime="2024-01-15T08:00:00">6 hours ago</time>
      </div>
    </article>
    <article class="activity-item">
      <div class="activity-icon activity-icon--orange">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>
      </div>
      <div class="activity-content">
        <p class="activity-text">Job view milestone: <strong>Backend Developer</strong> reached 10,000 views</p>
        <time class="activity-time" datetime="2024-01-14T16:45:00">Yesterday</time>
      </div>
    </article>
    <article class="activity-item">
      <div class="activity-icon activity-icon--purple">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
      </div>
      <div class="activity-content">
        <p class="activity-text">New job draft created: <strong>UI/UX Designer</strong></p>
        <time class="activity-time" datetime="2024-01-14T14:20:00">Yesterday</time>
      </div>
    </article>
  </div>
</section>
`;

	return jobieAdminLayout("Dashboard", body, user, "dashboard");
}
