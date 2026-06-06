const bcrypt = require('bcryptjs');
const pool = require('./db');

const seed = async () => {
  console.log('Seeding database...');

  try {
    // ── Clear existing data in safe order ──────────────────────────
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('TRUNCATE TABLE xp_events');
    await pool.query('TRUNCATE TABLE certifications');
    await pool.query('TRUNCATE TABLE section_completions');
    await pool.query('TRUNCATE TABLE enrollments');
    await pool.query('TRUNCATE TABLE course_sections');
    await pool.query('TRUNCATE TABLE courses');
    await pool.query('TRUNCATE TABLE checkins');
    await pool.query('TRUNCATE TABLE applications');
    await pool.query('TRUNCATE TABLE job_postings');
    await pool.query('TRUNCATE TABLE users');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    // ── Users ───────────────────────────────────────────────────────
    const hash = await bcrypt.hash('password123', 10);

    const [adminResult] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department)
       VALUES (?, ?, ?, 'hr_admin', 'Human Resources')`,
      ['Admin User', 'admin@hrpulse.com', hash]
    );
    const adminId = adminResult.insertId;

    const [supResult] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department)
       VALUES (?, ?, ?, 'supervisor', 'Engineering')`,
      ['Sarah Chen', 'supervisor@hrpulse.com', hash]
    );
    const supervisorId = supResult.insertId;

    const [empResult] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department, supervisor_id)
       VALUES (?, ?, ?, 'employee', 'Engineering', ?)`,
      ['James Miller', 'employee@hrpulse.com', hash, supervisorId]
    );
    const employeeId = empResult.insertId;

    console.log('✓ Users created');

    // ── Job postings ────────────────────────────────────────────────
    const [job1] = await pool.query(
      `INSERT INTO job_postings (title, description, location, status, created_by)
       VALUES (?, ?, ?, 'open', ?)`,
      [
        'Frontend Developer',
        'We are looking for a skilled React developer to join our product team. You will build and maintain user-facing features, collaborate with designers, and contribute to our design system.\n\nRequirements:\n- 2+ years of React experience\n- Strong CSS and responsive design skills\n- Experience with REST APIs',
        'Remote',
        adminId,
      ]
    );

    await pool.query(
      `INSERT INTO job_postings (title, description, location, status, created_by)
       VALUES (?, ?, ?, 'open', ?)`,
      [
        'HR Business Partner',
        'Join our People team to help shape the employee experience. You will partner with department heads on talent strategy, performance management, and organizational development.\n\nRequirements:\n- 3+ years in an HR role\n- Strong communication and interpersonal skills\n- Experience with HRIS systems',
        'Algiers',
        adminId,
      ]
    );

    // Sample application
    await pool.query(
      `INSERT INTO applications (job_posting_id, applicant_name, applicant_email, cover_letter, status)
       VALUES (?, ?, ?, ?, 'reviewing')`,
      [
        job1.insertId,
        'Karim Benali',
        'karim@example.com',
        'I have been working with React for 3 years and would love to bring my skills to your team.',
      ]
    );

    console.log('✓ Jobs and applications created');

    // ── Courses ─────────────────────────────────────────────────────
    const [course1] = await pool.query(
      `INSERT INTO courses (title, description, created_by)
       VALUES (?, ?, ?)`,
      ['Onboarding Essentials', 'Everything new team members need to hit the ground running — company culture, tools, and processes.', adminId]
    );
    const course1Id = course1.insertId;

    const course1Sections = [
      ['Welcome to HR Pulse', 'Learn about our mission, values, and what makes our culture unique. We believe in transparency, ownership, and continuous learning.'],
      ['Tools & Communication', 'We use Slack for async communication, Notion for documentation, and GitHub for code. Here is how we use each one effectively.'],
      ['Your First 30 Days', 'A guide to your first month — who to meet, what to focus on, and how to ask for help without hesitation.'],
    ];

    const [s1] = await pool.query(
      'INSERT INTO course_sections (course_id, title, content, order_index) VALUES ?',
      [course1Sections.map((s, i) => [course1Id, s[0], s[1], i])]
    );

    const [course2] = await pool.query(
      `INSERT INTO courses (title, description, created_by)
       VALUES (?, ?, ?)`,
      ['Giving Effective Feedback', 'A practical guide to delivering feedback that actually helps people grow — for both managers and individual contributors.', adminId]
    );
    const course2Id = course2.insertId;

    const course2Sections = [
      ['Why Feedback Matters', 'Feedback is the fastest path to growth. This section covers the research behind effective feedback and why most feedback falls flat.'],
      ['The SBI Framework', 'Situation–Behavior–Impact. A simple structure that makes feedback specific, objective, and actionable.'],
      ['Receiving Feedback Well', 'Giving feedback is only half the equation. Learn how to receive feedback with an open mind and turn it into action.'],
    ];

    await pool.query(
      'INSERT INTO course_sections (course_id, title, content, order_index) VALUES ?',
      [course2Sections.map((s, i) => [course2Id, s[0], s[1], i])]
    );

    console.log('✓ Courses and sections created');

    // ── Enrollments & progress ──────────────────────────────────────
    // Employee enrolled in course 1 and completed first two sections
    await pool.query(
      'INSERT INTO enrollments (user_id, course_id) VALUES (?, ?), (?, ?)',
      [employeeId, course1Id, employeeId, course2Id]
    );

    // Get section IDs for course 1
    const [sections] = await pool.query(
      'SELECT id FROM course_sections WHERE course_id = ? ORDER BY order_index ASC LIMIT 2',
      [course1Id]
    );

    await pool.query(
      'INSERT INTO section_completions (user_id, section_id) VALUES ?',
      [sections.map(s => [employeeId, s.id])]
    );

    // XP for section completions
    await pool.query(
      'INSERT INTO xp_events (user_id, points, reason) VALUES (?, ?, ?), (?, ?, ?)',
      [employeeId, 10, 'section_completed', employeeId, 10, 'section_completed']
    );

    // Supervisor enrolled and completed course 2 fully
    await pool.query(
      'INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)',
      [supervisorId, course2Id]
    );

    const [allSections2] = await pool.query(
      'SELECT id FROM course_sections WHERE course_id = ?',
      [course2Id]
    );

    await pool.query(
      'INSERT INTO section_completions (user_id, section_id) VALUES ?',
      [allSections2.map(s => [supervisorId, s.id])]
    );

    await pool.query(
      'INSERT INTO certifications (user_id, course_id) VALUES (?, ?)',
      [supervisorId, course2Id]
    );

    await pool.query(
      'INSERT INTO xp_events (user_id, points, reason) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?), (?, ?, ?)',
      [
        supervisorId, 10, 'section_completed',
        supervisorId, 10, 'section_completed',
        supervisorId, 10, 'section_completed',
        supervisorId, 50, 'course_completed',
      ]
    );

    console.log('✓ Enrollments and progress created');

    // ── Check-ins ───────────────────────────────────────────────────
    const checkins = [
      [employeeId, 4, 4, 'Good day, made progress on the onboarding module.'],
      [employeeId, 3, 3, 'A bit tired but got through my tasks.'],
      [employeeId, 5, 5, 'Great sprint review today, team was really aligned.'],
      [supervisorId, 4, 5, 'Team is performing well this week.'],
      [supervisorId, 3, 3, null],
      [adminId, 5, 4, 'Excited about the new hire joining next week.'],
    ];

    await pool.query(
      'INSERT INTO checkins (user_id, mood, energy, note) VALUES ?',
      [checkins]
    );

    // XP for check-ins
    const checkinXP = [employeeId, supervisorId, adminId].map(id => [id, 5, 'checkin_submitted'])
    await pool.query(
      'INSERT INTO xp_events (user_id, points, reason) VALUES ?',
      [checkinXP]
    );

    console.log('✓ Check-ins created');

    console.log('\n✅ Seed complete. Demo accounts:');
    console.log('   admin@hrpulse.com     — hr_admin');
    console.log('   supervisor@hrpulse.com — supervisor');
    console.log('   employee@hrpulse.com   — employee');
    console.log('   Password for all: password123\n');

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

seed();