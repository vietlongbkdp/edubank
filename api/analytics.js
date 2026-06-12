// GET ?scope=student: thống kê tiến bộ học sinh | ?scope=teacher: thống kê kho câu hỏi GV
import { connectDB } from './_lib/db.js';
import { Attempt, Question, Exam } from './_lib/models.js';
import { requireAuth } from './_lib/auth.js';
import { ok, err } from './_lib/respond.js';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  if (req.method !== 'GET') return err(res, 405, 'Method không hỗ trợ');
  const auth = requireAuth(req, res);
  if (!auth) return;
  await connectDB();

  try {
    if (req.query.scope === 'teacher') {
      const uid = new mongoose.Types.ObjectId(auth.id);
      const [totalQuestions, totalExams, byDifficulty, mismatched] = await Promise.all([
        Question.countDocuments({ createdBy: uid }),
        Exam.countDocuments({ createdBy: uid }),
        Question.aggregate([
          { $match: { createdBy: uid } },
          { $group: { _id: '$difficulty', count: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ]),
        // Câu hỏi có tỉ lệ đúng thực tế lệch nhiều so với độ khó gán (gợi ý GV điều chỉnh)
        Question.aggregate([
          { $match: { createdBy: uid, 'stats.timesAnswered': { $gte: 5 } } },
          { $addFields: {
              actualRate: { $divide: ['$stats.timesCorrect', '$stats.timesAnswered'] },
              // Độ khó 1 ≈ 95% đúng, độ khó 10 ≈ 5% đúng
              expectedRate: { $subtract: [1, { $divide: ['$difficulty', 10.5] }] }
          }},
          { $addFields: { gap: { $abs: { $subtract: ['$actualRate', '$expectedRate'] } } } },
          { $match: { gap: { $gte: 0.3 } } },
          { $sort: { gap: -1 } }, { $limit: 10 },
          { $project: { code: 1, content: 1, difficulty: 1, actualRate: 1, expectedRate: 1, gap: 1 } }
        ])
      ]);
      return ok(res, { totalQuestions, totalExams, byDifficulty, mismatched });
    }

    // scope=student (mặc định)
    const uid = new mongoose.Types.ObjectId(auth.id);
    const attempts = await Attempt.find({ studentId: uid, status: 'submitted' })
      .populate('examId', 'title subject')
      .sort({ submittedAt: 1 }).lean();

    // Gộp breakdown theo chuyên đề trên toàn bộ lịch sử
    const topicAgg = new Map();
    attempts.forEach(a => (a.breakdownTopic || []).forEach(b => {
      const t = topicAgg.get(b.topic) || { correct: 0, total: 0 };
      t.correct += b.correct; t.total += b.total;
      topicAgg.set(b.topic, t);
    }));
    const topics = [...topicAgg].map(([topic, v]) => ({
      topic, ...v, rate: v.total ? Math.round((v.correct / v.total) * 100) : 0
    })).sort((a, b) => a.rate - b.rate);

    const scores = attempts.map(a => a.score);
    const avg = scores.length ? Math.round((scores.reduce((s, x) => s + x, 0) / scores.length) * 100) / 100 : 0;
    // So sánh 3 bài gần nhất với 3 bài trước đó để đánh giá tiến bộ
    const recent = scores.slice(-3), prev = scores.slice(-6, -3);
    const trend = recent.length && prev.length
      ? Math.round(((recent.reduce((s, x) => s + x, 0) / recent.length) - (prev.reduce((s, x) => s + x, 0) / prev.length)) * 100) / 100
      : 0;

    return ok(res, {
      totalAttempts: attempts.length,
      avgScore: avg,
      bestScore: scores.length ? Math.max(...scores) : 0,
      trend,
      timeline: attempts.map(a => ({
        date: a.submittedAt, score: a.score, title: a.examId?.title, subject: a.examId?.subject, id: a._id
      })),
      topics,
      weakest: topics.slice(0, 3),
      strongest: topics.slice(-3).reverse()
    });
  } catch (e) {
    console.error(e);
    return err(res, 500, 'Lỗi máy chủ');
  }
}
