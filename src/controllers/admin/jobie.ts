// src/controllers/admin/jobie.ts — Jobie Admin Controllers

import type { Request, Response } from "express";
import { jobieDashboard } from "../../views/admin/jobie-dashboard";
import { jobieAdminLayout } from "../../views/admin/jobie-helpers";

interface JobieUser {
	name: string;
	email: string;
	role: string;
	avatar?: string;
}

// Mock user - replace with actual auth
const getJobieUser = (_req: Request): JobieUser => ({
	name: "Sarah Chen",
	email: "sarah@jobie.io",
	role: "Admin",
	avatar: undefined,
});

export function jobieAdminDashboard(req: Request, res: Response) {
	const user = getJobieUser(req);
	const html = jobieDashboard(user);
	res.send(html);
}

export function jobieAdminJobs(req: Request, res: Response) {
	const user = getJobieUser(req);
	const html = jobieAdminLayout("Search Jobs", jobsBody(), user, "search-job");
	res.send(html);
}

export function jobieAdminApplications(req: Request, res: Response) {
	const user = getJobieUser(req);
	const html = jobieAdminLayout(
		"Applications",
		applicationsBody(),
		user,
		"applications",
	);
	res.send(html);
}

export function jobieAdminMessages(req: Request, res: Response) {
	const user = getJobieUser(req);
	const html = jobieAdminLayout("Messages", messagesBody(), user, "messages");
	res.send(html);
}

export function jobieAdminStatistics(req: Request, res: Response) {
	const user = getJobieUser(req);
	const html = jobieAdminLayout(
		"Statistics",
		statisticsBody(),
		user,
		"statistics",
	);
	res.send(html);
}

export function jobieAdminNews(req: Request, res: Response) {
	const user = getJobieUser(req);
	const html = jobieAdminLayout("News", newsBody(), user, "news");
	res.send(html);
}

function jobsBody(): string {
	return `
<div class="jd-header">
  <h1 class="jd-title">Search Jobs</h1>
  <a href="/jobie-admin/jobs/create" class="btn btn-primary">+ Post New Job</a>
</div>
<div class="jd-card">
  <div class="jd-card-header">
    <h3 class="jd-card-title">All Job Postings</h3>
  </div>
  <div class="jd-table-wrap">
    <table class="jd-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Company</th>
          <th>Location</th>
          <th>Type</th>
          <th>Status</th>
          <th>Applications</th>
          <th>Posted</th>
          <th>Actions</th>
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
          <td><a href="#" class="btn-sm">Edit</a></td>
        </tr>
        <tr>
          <td><strong>Product Designer</strong></td>
          <td>DesignStudio</td>
          <td>Remote</td>
          <td><span class="badge badge--contract">Contract</span></td>
          <td><span class="badge badge--active">Active</span></td>
          <td>28</td>
          <td>5 days ago</td>
          <td><a href="#" class="btn-sm">Edit</a></td>
        </tr>
        <tr>
          <td><strong>DevOps Engineer</strong></td>
          <td>CloudScale</td>
          <td>New York, NY</td>
          <td><span class="badge badge--fulltime">Full-time</span></td>
          <td><span class="badge badge--pending">Pending</span></td>
          <td>15</td>
          <td>1 week ago</td>
          <td><a href="#" class="btn-sm">Edit</a></td>
        </tr>
        <tr>
          <td><strong>Backend Developer (Node.js)</strong></td>
          <td>DataFlow</td>
          <td>Austin, TX</td>
          <td><span class="badge badge--fulltime">Full-time</span></td>
          <td><span class="badge badge--active">Active</span></td>
          <td>67</td>
          <td>3 days ago</td>
          <td><a href="#" class="btn-sm">Edit</a></td>
        </tr>
        <tr>
          <td><strong>UI/UX Designer</strong></td>
          <td>CreativeMinds</td>
          <td>Remote</td>
          <td><span class="badge badge--parttime">Part-time</span></td>
          <td><span class="badge badge--draft">Draft</span></td>
          <td>0</td>
          <td>1 day ago</td>
          <td><a href="#" class="btn-sm">Edit</a></td>
        </tr>
      </tbody>
    </table>
  </div>
</div>`;
}

function applicationsBody(): string {
	return `
<div class="jd-header">
  <h1 class="jd-title">Applications</h1>
</div>
<div class="jd-card">
  <div class="jd-card-header">
    <h3 class="jd-card-title">Recent Applications</h3>
  </div>
  <div class="jd-table-wrap">
    <table class="jd-table">
      <thead>
        <tr>
          <th>Candidate</th>
          <th>Job</th>
          <th>Company</th>
          <th>Applied</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Alex Rivera</strong><br><small>alex@email.com</small></td>
          <td>Senior Frontend Developer</td>
          <td>TechCorp Inc.</td>
          <td>2 hours ago</td>
          <td><span class="badge badge--new">New</span></td>
          <td><a href="#" class="btn-sm">Review</a></td>
        </tr>
        <tr>
          <td><strong>Maria Santos</strong><br><small>maria@email.com</small></td>
          <td>Product Designer</td>
          <td>DesignStudio</td>
          <td>5 hours ago</td>
          <td><span class="badge badge--review">In Review</span></td>
          <td><a href="#" class="btn-sm">Review</a></td>
        </tr>
        <tr>
          <td><strong>James Park</strong><br><small>james@email.com</small></td>
          <td>DevOps Engineer</td>
          <td>CloudScale</td>
          <td>1 day ago</td>
          <td><span class="badge badge--interview">Interview</span></td>
          <td><a href="#" class="btn-sm">Review</a></td>
        </tr>
        <tr>
          <td><strong>Priya Sharma</strong><br><small>priya@email.com</small></td>
          <td>Backend Developer</td>
          <td>DataFlow</td>
          <td>2 days ago</td>
          <td><span class="badge badge--hired">Hired</span></td>
          <td><a href="#" class="btn-sm">View</a></td>
        </tr>
        <tr>
          <td><strong>David Kim</strong><br><small>david@email.com</small></td>
          <td>UI/UX Designer</td>
          <td>CreativeMinds</td>
          <td>3 days ago</td>
          <td><span class="badge badge--rejected">Rejected</span></td>
          <td><a href="#" class="btn-sm">View</a></td>
        </tr>
      </tbody>
    </table>
  </div>
</div>`;
}

function messagesBody(): string {
	return `
<div class="jd-header">
  <h1 class="jd-title">Messages</h1>
</div>
<div class="jd-card">
  <div class="jd-card-header">
    <h3 class="jd-card-title">Conversations</h3>
  </div>
  <div class="activity-list">
    <article class="activity-item">
      <div class="activity-icon activity-icon--blue">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </div>
      <div class="activity-content">
        <p class="activity-text"><strong>Michael Chen</strong> — <em>Regarding: Product Designer position</em></p>
        <time class="activity-time" datetime="2024-01-15T09:15:00">4 hours ago</time>
      </div>
    </article>
    <article class="activity-item">
      <div class="activity-icon activity-icon--purple">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
      </div>
      <div class="activity-content">
        <p class="activity-text"><strong>Sarah Johnson</strong> — <em>Application for Senior Frontend Developer</em></p>
        <time class="activity-time" datetime="2024-01-15T10:30:00">2 hours ago</time>
      </div>
    </article>
    <article class="activity-item">
      <div class="activity-icon activity-icon--green">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div class="activity-content">
        <p class="activity-text"><strong>You</strong> replied to <strong>Priya Sharma</strong> — <em>Backend Developer interview scheduled</em></p>
        <time class="activity-time" datetime="2024-01-14T16:45:00">Yesterday</time>
      </div>
    </article>
  </div>
</div>`;
}

function statisticsBody(): string {
	return `
<div class="jd-header">
  <h1 class="jd-title">Statistics</h1>
</div>
<div class="stats-grid">
  <div class="stat-card stat-card--purple">
    <div class="stat-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
    </div>
    <div class="stat-content">
      <span class="stat-value">156</span>
      <span class="stat-label">Active Jobs</span>
      <span class="stat-trend stat-trend--up">+12% from last month</span>
    </div>
  </div>
  <div class="stat-card stat-card--blue">
    <div class="stat-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    </div>
    <div class="stat-content">
      <span class="stat-value">2,847</span>
      <span class="stat-label">Total Applications</span>
      <span class="stat-trend stat-trend--up">+8% from last month</span>
    </div>
  </div>
  <div class="stat-card stat-card--green">
    <div class="stat-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
    </div>
    <div class="stat-content">
      <span class="stat-value">3.2%</span>
      <span class="stat-label">Conversion Rate</span>
      <span class="stat-trend stat-trend--down">-0.3% from last month</span>
    </div>
  </div>
  <div class="stat-card stat-card--orange">
    <div class="stat-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>
    </div>
    <div class="stat-content">
      <span class="stat-value">18 days</span>
      <span class="stat-label">Avg. Time to Fill</span>
      <span class="stat-trend stat-trend--down">-2 days from last month</span>
    </div>
  </div>
</div>

<div class="jd-grid">
  <section class="jd-card" aria-labelledby="chartTitle1">
    <header class="jd-card-header">
      <h3 id="chartTitle1" class="jd-card-title">Applications Over Time</h3>
    </header>
    <div class="chart-placeholder" style="height: 280px; display: flex; align-items: center; justify-content: center; color: var(--j-text-dim);">
      <span>Chart: Applications trend (last 30 days)</span>
    </div>
  </section>
  <section class="jd-card" aria-labelledby="chartTitle2">
    <header class="jd-card-header">
      <h3 id="chartTitle2" class="jd-card-title">Top Job Categories</h3>
    </header>
    <div class="chart-placeholder" style="height: 280px; display: flex; align-items: center; justify-content: center; color: var(--j-text-dim);">
      <span>Chart: Category distribution</span>
    </div>
  </section>
</div>`;
}

function newsBody(): string {
	return `
<div class="jd-header">
  <h1 class="jd-title">News & Announcements</h1>
  <a href="/jobie-admin/news/create" class="btn btn-primary">+ Create Post</a>
</div>
<div class="jd-card">
  <div class="jd-card-header">
    <h3 class="jd-card-title">Recent Posts</h3>
  </div>
  <div class="jd-table-wrap">
    <table class="jd-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Type</th>
          <th>Published</th>
          <th>Views</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>New Features for Job Seekers</strong></td>
          <td><span class="badge badge--feature">Feature</span></td>
          <td>Jan 15, 2024</td>
          <td>1,234</td>
          <td><span class="badge badge--published">Published</span></td>
          <td><a href="#" class="btn-sm">Edit</a></td>
        </tr>
        <tr>
          <td><strong>2024 Salary Report Released</strong></td>
          <td><span class="badge badge--report">Report</span></td>
          <td>Jan 10, 2024</td>
          <td>3,567</td>
          <td><span class="badge badge--published">Published</span></td>
          <td><a href="#" class="btn-sm">Edit</a></td>
        </tr>
        <tr>
          <td><strong>Tips for Remote Interviews</strong></td>
          <td><span class="badge badge--guide">Guide</span></td>
          <td>Jan 5, 2024</td>
          <td>892</td>
          <td><span class="badge badge--published">Published</span></td>
          <td><a href="#" class="btn-sm">Edit</a></td>
        </tr>
        <tr>
          <td><strong>Platform Maintenance Notice</strong></td>
          <td><span class="badge badge--notice">Notice</span></td>
          <td>Jan 20, 2024</td>
          <td>0</td>
          <td><span class="badge badge--draft">Scheduled</span></td>
          <td><a href="#" class="btn-sm">Edit</a></td>
        </tr>
      </tbody>
    </table>
  </div>
</div>`;
}
