import mongoose from 'mongoose';
const { Schema, model, models } = mongoose;

// ===== Người dùng =====
const userSchema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['teacher', 'student', 'admin'], default: 'student' },
  avatarUrl: String,
  school: String,
  subjectsTaught: [String],
  grade: String,
  bio: String,
  teacherCode: { type: String, index: true },  // mã GV để học sinh tra cứu đề, vd GV-A1B2C3
  isLocked: { type: Boolean, default: false }
}, { timestamps: true });

// ===== Câu hỏi — đối tượng trung tâm =====
const questionSchema = new Schema({
  code: { type: String, unique: true },
  subject: { type: String, required: true, index: true },
  grade: { type: String, index: true },
  topic: { type: String, index: true },
  subTopic: String,
  type: { type: String, enum: ['single_choice', 'multi_choice', 'true_false', 'short_answer', 'essay'], default: 'single_choice' },
  content: { type: String, required: true },     // Markdown + LaTeX ($...$)
  images: [String],
  options: [{ label: String, text: String, image: String }],
  correctAnswer: Schema.Types.Mixed,              // "D" | ["A","C"] | "42"
  solution: String,
  solutionImages: [String],
  difficulty: { type: Number, min: 1, max: 10, default: 5, index: true },
  cognitiveLevel: { type: String, enum: ['nhan_biet', 'thong_hieu', 'van_dung', 'van_dung_cao'], default: 'thong_hieu' },
  tags: [String],
  source: String,
  estimatedTime: { type: Number, default: 90 },   // giây
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  isPublic: { type: Boolean, default: true, index: true },
  status: { type: String, enum: ['active', 'draft', 'reported'], default: 'active', index: true },
  reportReason: String,
  stats: {
    timesUsed: { type: Number, default: 0 },
    timesAnswered: { type: Number, default: 0 },
    timesCorrect: { type: Number, default: 0 }
  }
}, { timestamps: true });
questionSchema.index({ content: 'text', tags: 'text', source: 'text' });

// ===== Đề thi =====
const examSchema = new Schema({
  code: String,
  title: { type: String, required: true },
  subject: String,
  grade: String,
  duration: { type: Number, default: 90 },        // phút
  questionIds: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
  shuffleQuestions: { type: Boolean, default: false },
  shuffleOptions: { type: Boolean, default: false },
  matrix: [{ difficulty: Number, count: Number }],
  totalScore: { type: Number, default: 10 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  visibility: { type: String, enum: ['private', 'public'], default: 'private' },
  accessPassword: { type: String, default: '' }  // mã khóa đề; rỗng = đề mở, ai cũng làm được
}, { timestamps: true });

// ===== Lượt làm bài =====
const attemptSchema = new Schema({
  examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  startedAt: { type: Date, default: Date.now },
  submittedAt: Date,
  answers: [{ questionId: Schema.Types.ObjectId, selected: Schema.Types.Mixed, isCorrect: Boolean, timeSpent: Number }],
  score: Number,
  correctCount: Number,
  totalQuestions: Number,
  breakdownTopic: [{ topic: String, correct: Number, total: Number }],
  breakdownDifficulty: [{ difficulty: Number, correct: Number, total: Number }],
  status: { type: String, enum: ['in_progress', 'submitted', 'expired'], default: 'in_progress' }
}, { timestamps: true });

export const User = models.User || model('User', userSchema);
export const Question = models.Question || model('Question', questionSchema);
export const Exam = models.Exam || model('Exam', examSchema);
export const Attempt = models.Attempt || model('Attempt', attemptSchema);
