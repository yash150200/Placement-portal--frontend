// routes/applications.js
import express from 'express';
import { pool } from '../db.js';
import { authRequired, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/applications
router.post('/', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can apply' });
    }

    const { jobId, resume_url, cover_letter } = req.body;
    if (!jobId) return res.status(400).json({ message: 'Job ID required' });

    const result = await pool.query(
      `INSERT INTO applications (user_id, job_id, resume_url, cover_letter)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id, job_id)
       DO UPDATE SET resume_url = EXCLUDED.resume_url,
                     cover_letter = EXCLUDED.cover_letter
       RETURNING *`,
      [req.user.id, jobId, resume_url || null, cover_letter || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Apply error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/applications/my (student)
router.get('/my', authRequired, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students' });
    }

    const result = await pool.query(
      `SELECT a.*, j.title, j.company, j.location
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.user_id = $1
       ORDER BY a.applied_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('My applications error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/applications/job/:jobId (TPO)
router.get('/job/:jobId', authRequired, requireRole('tpo'), async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const result = await pool.query(
      `SELECT a.*, u.name as student_name, u.email as student_email, u.branch, u.graduation_year
       FROM applications a
       JOIN users u ON a.user_id = u.id
       WHERE a.job_id = $1
       ORDER BY a.applied_at DESC`,
      [jobId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Job applications error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
