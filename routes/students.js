// routes/students.js
import express from 'express';
import { pool } from '../db.js';
import { authRequired, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/students
router.get('/', authRequired, requireRole('tpo'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, branch, graduation_year, created_at
       FROM users
       WHERE role = 'student'
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Students list error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/students/stats
router.get('/stats/overview', authRequired, requireRole('tpo'), async (req, res) => {
  try {
    const usersCount = await pool.query(
      `SELECT role, COUNT(*)::int AS count
       FROM users
       GROUP BY role`
    );

    const jobsCount = await pool.query(
      `SELECT status, COUNT(*)::int AS count
       FROM jobs
       GROUP BY status`
    );

    const appsCount = await pool.query(
      `SELECT status, COUNT(*)::int AS count
       FROM applications
       GROUP BY status`
    );

    res.json({
      users: usersCount.rows,
      jobs: jobsCount.rows,
      applications: appsCount.rows
    });
  } catch (err) {
    console.error('Stats error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
