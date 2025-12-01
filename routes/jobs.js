// routes/jobs.js
import express from 'express';
import { pool } from '../db.js';
import { authRequired, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/jobs
router.get('/', authRequired, async (req, res) => {
  try {
    const jobs = await pool.query(
      `SELECT j.*, u.name AS tpo_name
       FROM jobs j
       LEFT JOIN users u ON j.created_by = u.id
       ORDER BY j.created_at DESC`
    );
    res.json(jobs.rows);
  } catch (err) {
    console.error('Jobs list error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/jobs/:id
router.get('/:id', authRequired, async (req, res) => {
  try {
    const jobId = req.params.id;
    const result = await pool.query(
      `SELECT j.*, u.name AS tpo_name, u.email AS tpo_email
       FROM jobs j
       LEFT JOIN users u ON j.created_by = u.id
       WHERE j.id = $1`,
      [jobId]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Job not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Job details error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/jobs (TPO)
router.post('/', authRequired, requireRole('tpo'), async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      ctc,
      description,
      requirements,
      last_date
    } = req.body;

    if (!title || !company || !location) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await pool.query(
      `INSERT INTO jobs
      (title, company, location, ctc, description, requirements, last_date, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`,
      [
        title,
        company,
        location,
        ctc || null,
        description || null,
        requirements || null,
        last_date || null,
        req.user.id
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create job error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/jobs/:id (TPO)
router.put('/:id', authRequired, requireRole('tpo'), async (req, res) => {
  try {
    const jobId = req.params.id;
    const {
      title,
      company,
      location,
      ctc,
      description,
      requirements,
      last_date,
      status
    } = req.body;

    const result = await pool.query(
      `UPDATE jobs
       SET title = $1,
           company = $2,
           location = $3,
           ctc = $4,
           description = $5,
           requirements = $6,
           last_date = $7,
           status = $8
       WHERE id = $9
       RETURNING *`,
      [
        title,
        company,
        location,
        ctc,
        description,
        requirements,
        last_date,
        status || 'open',
        jobId
      ]
    );

    if (result.rowCount === 0) return res.status(404).json({ message: 'Job not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update job error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/jobs/:id (TPO)
router.delete('/:id', authRequired, requireRole('tpo'), async (req, res) => {
  try {
    const jobId = req.params.id;
    const result = await pool.query('DELETE FROM jobs WHERE id = $1', [jobId]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Job not found' });
    res.json({ message: 'Job deleted' });
  } catch (err) {
    console.error('Delete job error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
