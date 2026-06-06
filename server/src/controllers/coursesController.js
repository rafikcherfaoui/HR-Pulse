const pool = require('../db/db');

// GET /api/courses — all authenticated users
const getAllCourses = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, u.name AS created_by_name,
        COUNT(DISTINCT e.user_id) AS enrolled_count
       FROM courses c
       JOIN users u ON c.created_by = u.id
       LEFT JOIN enrollments e ON c.id = e.course_id
       GROUP BY c.id
       ORDER BY c.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/courses/:id — full course with sections + caller's progress
const getCourseById = async (req, res) => {
  try {
    // Get the course
    const [courseRows] = await pool.query(
      `SELECT c.*, u.name AS created_by_name
       FROM courses c
       JOIN users u ON c.created_by = u.id
       WHERE c.id = ?`,
      [req.params.id]
    );
    if (courseRows.length === 0) {
      return res.status(404).json({ message: 'Course not found.' });
    }
    const course = courseRows[0];

    // Get all sections for this course
    const [sections] = await pool.query(
      'SELECT * FROM course_sections WHERE course_id = ? ORDER BY order_index ASC',
      [req.params.id]
    );

    // Get which sections this user has already completed
    const [completions] = await pool.query(
      `SELECT section_id FROM section_completions
       WHERE user_id = ? AND section_id IN (
         SELECT id FROM course_sections WHERE course_id = ?
       )`,
      [req.user.id, req.params.id]
    );
    const completedIds = completions.map(c => c.section_id);

    // Check if the user is enrolled
    const [enrollment] = await pool.query(
      'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?',
      [req.user.id, req.params.id]
    );

    // Attach a completed flag to each section
    const sectionsWithProgress = sections.map(s => ({
      ...s,
      completed: completedIds.includes(s.id),
    }));

    const totalSections = sections.length;
    const completedCount = completedIds.length;
    const progress = totalSections === 0 ? 0 : Math.round((completedCount / totalSections) * 100);

    res.json({
      ...course,
      sections: sectionsWithProgress,
      enrolled: enrollment.length > 0,
      progress,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/courses — hr_admin only
const createCourse = async (req, res) => {
  const { title, description, sections } = req.body;
  // sections is an array: [{ title, content, order_index }, ...]

  if (!title) {
    return res.status(400).json({ message: 'Title is required.' });
  }

  // Use a transaction — if sections insert fails, the course insert rolls back too
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      'INSERT INTO courses (title, description, created_by) VALUES (?, ?, ?)',
      [title, description || null, req.user.id]
    );
    const courseId = result.insertId;

    if (sections && sections.length > 0) {
      const sectionValues = sections.map((s, i) => [
        courseId,
        s.title,
        s.content || null,
        s.order_index ?? i,
      ]);
      await connection.query(
        'INSERT INTO course_sections (course_id, title, content, order_index) VALUES ?',
        [sectionValues]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Course created.', courseId });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  } finally {
    connection.release();
  }
};

// PUT /api/courses/:id — hr_admin only
const updateCourse = async (req, res) => {
  const { title, description } = req.body;
  try {
    const [result] = await pool.query(
      `UPDATE courses
       SET title = COALESCE(?, title), description = COALESCE(?, description)
       WHERE id = ?`,
      [title, description, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Course not found.' });
    }
    res.json({ message: 'Course updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/courses/:id — hr_admin only
const deleteCourse = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM courses WHERE id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Course not found.' });
    }
    res.json({ message: 'Course deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/courses/:id/enroll — employee or supervisor
const enrollInCourse = async (req, res) => {
  try {
    // Check course exists
    const [course] = await pool.query(
      'SELECT id FROM courses WHERE id = ?',
      [req.params.id]
    );
    if (course.length === 0) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    // INSERT IGNORE silently skips if the unique key already exists
    await pool.query(
      'INSERT IGNORE INTO enrollments (user_id, course_id) VALUES (?, ?)',
      [req.user.id, req.params.id]
    );

    res.json({ message: 'Enrolled successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/sections/:id/complete — employee or supervisor
const completeSection = async (req, res) => {
  const userId = req.user.id;
  const sectionId = req.params.id;

  try {
    // Get the section so we know which course it belongs to
    const [sectionRows] = await pool.query(
      'SELECT * FROM course_sections WHERE id = ?',
      [sectionId]
    );
    if (sectionRows.length === 0) {
      return res.status(404).json({ message: 'Section not found.' });
    }
    const courseId = sectionRows[0].course_id;

    // Make sure the user is enrolled before allowing completion
    const [enrollment] = await pool.query(
      'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );
    if (enrollment.length === 0) {
      return res.status(403).json({ message: 'You are not enrolled in this course.' });
    }

    // Mark this section complete (ignore if already done)
    await pool.query(
      'INSERT IGNORE INTO section_completions (user_id, section_id) VALUES (?, ?)',
      [userId, sectionId]
    );

    // Award XP for completing a section
    await pool.query(
      'INSERT INTO xp_events (user_id, points, reason) VALUES (?, ?, ?)',
      [userId, 10, 'section_completed']
    );

    // Check if the entire course is now complete
    const [totalRows] = await pool.query(
      'SELECT COUNT(*) AS total FROM course_sections WHERE course_id = ?',
      [courseId]
    );
    const [completedRows] = await pool.query(
      `SELECT COUNT(*) AS completed FROM section_completions sc
       JOIN course_sections cs ON sc.section_id = cs.id
       WHERE sc.user_id = ? AND cs.course_id = ?`,
      [userId, courseId]
    );

    const total = totalRows[0].total;
    const completed = completedRows[0].completed;
    let certified = false;

    if (total > 0 && completed === total) {
      // Issue certification (INSERT IGNORE avoids duplicates)
      await pool.query(
        'INSERT IGNORE INTO certifications (user_id, course_id) VALUES (?, ?)',
        [userId, courseId]
      );
      // Bonus XP for finishing the whole course
      await pool.query(
        'INSERT INTO xp_events (user_id, points, reason) VALUES (?, ?, ?)',
        [userId, 50, 'course_completed']
      );
      certified = true;
    }

    const progress = Math.round((completed / total) * 100);
    res.json({ message: 'Section marked complete.', progress, certified });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/courses/my — authenticated user's enrolled courses + progress
const getMyCourses = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         c.id, c.title, c.description,
         COUNT(DISTINCT cs.id) AS total_sections,
         COUNT(DISTINCT sc.section_id) AS completed_sections,
         ROUND(COUNT(DISTINCT sc.section_id) / NULLIF(COUNT(DISTINCT cs.id), 0) * 100) AS progress,
         cert.issued_at AS certified_at
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN course_sections cs ON cs.course_id = c.id
       LEFT JOIN section_completions sc ON sc.section_id = cs.id AND sc.user_id = e.user_id
       LEFT JOIN certifications cert ON cert.course_id = c.id AND cert.user_id = e.user_id
       WHERE e.user_id = ?
       GROUP BY c.id, cert.issued_at`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/courses/progress/all — hr_admin sees everyone's progress
const getAllProgress = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         u.id AS user_id, u.name, u.department,
         c.id AS course_id, c.title AS course_title,
         COUNT(DISTINCT cs.id) AS total_sections,
         COUNT(DISTINCT sc.section_id) AS completed_sections,
         ROUND(COUNT(DISTINCT sc.section_id) / NULLIF(COUNT(DISTINCT cs.id), 0) * 100) AS progress,
         cert.issued_at AS certified_at
       FROM enrollments e
       JOIN users u ON e.user_id = u.id
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN course_sections cs ON cs.course_id = c.id
       LEFT JOIN section_completions sc ON sc.section_id = cs.id AND sc.user_id = e.user_id
       LEFT JOIN certifications cert ON cert.course_id = c.id AND cert.user_id = e.user_id
       GROUP BY u.id, c.id, cert.issued_at
       ORDER BY u.name, c.title`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  completeSection,
  getMyCourses,
  getAllProgress,
};