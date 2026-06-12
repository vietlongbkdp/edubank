// Lượt làm bài của học sinh
// POST {examId}: bắt đầu làm bài → trả câu hỏi ĐÃ ẨN đáp án đúng & lời giải
// PUT ?id {action:'save'|'submit', answers}: lưu tạm / nộp bài (chấm điểm server-side)
// GET: danh sách lượt của tôi | GET ?id: chi tiết để xem lại (kèm lời giải nếu đã nộp)
import { connectDB } from './_lib/db.js';
import { Exam, Attempt, Question } from './_lib/models.js';
import { requireAuth } from './_lib/auth.js';
import { ok, err } from './_lib/respond.js';

// So sánh đáp án (hỗ trợ chọn 1, chọn nhiều, trả lời ngắn)
function isAnswerCorrect(selected, correct) {
  if (selected == null || correct == null) return false;
  if (Array.isArray(correct)) {
    const a = Array.isArray(selected) ? [...selected].sort() : [selected];
    return JSON.stringify(a.sort()) === JSON.stringify([...correct].sort());
  }
  return String(selected).trim().toLowerCase() === String(correct).trim().toLowerCase();
}

// Ẩn đáp án đúng + lời giải khi gửi câu hỏi cho học sinh đang làm bài
const sanitize = (q) => {
  const { correctAnswer, solution, solutionImages, ...rest } = q;
  return rest;
};

export default async function handler(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;
  await connectDB();

  try {
    if (req.method === 'POST') {
      const exam = await Exam.findById(req.body?.examId).populate('questionIds').lean();
      if (!exam) return err(res, 404, 'Không tìm thấy đề thi');
      const attempt = await Attempt.create({
        examId: exam._id, studentId: auth.id,
        totalQuestions: exam.questionIds.length
      });
      return ok(res, {
        attemptId: attempt._id,
        startedAt: attempt.startedAt,
        duration: exam.duration,
        examTitle: exam.title,
        questions: exam.questionIds.map(sanitize)
      }, 'Bắt đầu làm bài');
    }

    if (req.method === 'PUT') {
      const attempt = await Attempt.findById(req.query.id);
      if (!attempt) return err(res, 404, 'Không tìm thấy lượt làm bài');
      if (String(attempt.studentId) !== auth.id) return err(res, 403, 'Không có quyền');
      if (attempt.status !== 'in_progress') return err(res, 400, 'Bài thi đã nộp');

      const { action, answers = [] } = req.body || {};
      if (action === 'save') {
        attempt.answers = answers;
        await attempt.save();
        return ok(res, null, 'Đã lưu tiến trình');
      }

      if (action === 'submit') {
        const exam = await Exam.findById(attempt.examId).populate('questionIds').lean();
        const qMap = new Map(exam.questionIds.map(q => [String(q._id), q]));
        let correctCount = 0;
        const topicMap = new Map(), diffMap = new Map();

        attempt.answers = exam.questionIds.map(q => {
          const a = answers.find(x => String(x.questionId) === String(q._id));
          const isCorrect = a ? isAnswerCorrect(a.selected, q.correctAnswer) : false;
          if (isCorrect) correctCount++;
          // Gom theo chuyên đề & độ khó
          const t = topicMap.get(q.topic || 'Khác') || { correct: 0, total: 0 };
          t.total++; if (isCorrect) t.correct++;
          topicMap.set(q.topic || 'Khác', t);
          const d = diffMap.get(q.difficulty) || { correct: 0, total: 0 };
          d.total++; if (isCorrect) d.correct++;
          diffMap.set(q.difficulty, d);
          return { questionId: q._id, selected: a?.selected ?? null, isCorrect, timeSpent: a?.timeSpent || 0 };
        });

        attempt.correctCount = correctCount;
        attempt.totalQuestions = exam.questionIds.length;
        attempt.score = Math.round((correctCount / exam.questionIds.length) * 10 * 100) / 100;
        attempt.breakdownTopic = [...topicMap].map(([topic, v]) => ({ topic, ...v }));
        attempt.breakdownDifficulty = [...diffMap].map(([difficulty, v]) => ({ difficulty, ...v }))
          .sort((a, b) => a.difficulty - b.difficulty);
        attempt.submittedAt = new Date();
        attempt.status = 'submitted';
        await attempt.save();

        // Cập nhật thống kê độ khó thực tế cho từng câu hỏi
        const bulk = attempt.answers.map(a => ({
          updateOne: {
            filter: { _id: a.questionId },
            update: { $inc: { 'stats.timesAnswered': 1, 'stats.timesCorrect': a.isCorrect ? 1 : 0 } }
          }
        }));
        if (bulk.length) await Question.bulkWrite(bulk);

        return ok(res, { attemptId: attempt._id, score: attempt.score, correctCount, total: attempt.totalQuestions }, 'Đã nộp bài');
      }
      return err(res, 400, 'Action không hợp lệ');
    }

    if (req.method === 'GET') {
      if (req.query.id) {
        const attempt = await Attempt.findById(req.query.id)
          .populate({ path: 'examId', populate: { path: 'questionIds' } }).lean();
        if (!attempt) return err(res, 404, 'Không tìm thấy');
        if (String(attempt.studentId) !== auth.id && auth.role !== 'admin') return err(res, 403, 'Không có quyền');
        // Chỉ trả lời giải khi đã nộp bài
        if (attempt.status === 'in_progress') {
          attempt.examId.questionIds = attempt.examId.questionIds.map(sanitize);
        }
        return ok(res, attempt);
      }
      const list = await Attempt.find({ studentId: auth.id, status: 'submitted' })
        .populate('examId', 'title subject grade duration')
        .sort({ submittedAt: -1 }).lean();
      return ok(res, list);
    }

    return err(res, 405, 'Method không hỗ trợ');
  } catch (e) {
    console.error(e);
    return err(res, 500, 'Lỗi máy chủ');
  }
}
