// CHANGE: Student registration & login using university ID and password
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

/**
 * Helper to generate JWT for students and guests
 */
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// ==================================
// @desc Student registration
// @route POST /auth/student/register
// @access public
// ==================================
module.exports.registerStudent = async (req, res) => {
  try {
    const { universityId, password, name, department, stage, email } = req.body;

    if (!universityId || !password) {
      return res
        .status(400)
        .json({ error: "الرجاء إدخال رقم الجامعة وكلمة المرور" });
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ universityId }, email ? { email } : undefined].filter(Boolean),
      },
    });

    if (existing) {
      return res
        .status(409)
        .json({ error: "رقم الجامعة أو البريد الإلكتروني مستخدم بالفعل" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        universityId,
        passwordHash,
        name: name || null,
        department: department || null,
        stage: stage || null,
        email: email || null,
        role: "STUDENT", // CHANGE: Students are stored with STUDENT role
      },
    });

    const token = generateToken(user);

    return res.status(201).json({
      message: "تم إنشاء الحساب بنجاح",
      token,
      user: {
        id: user.id,
        universityId: user.universityId,
        name: user.name,
        department: user.department,
        stage: user.stage,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error registering student:", error);
    return res.status(500).json({ error: "فشل في إنشاء الحساب" });
  }
};

// ==================================
// @desc Student login
// @route POST /auth/student/login
// @access public
// ==================================
module.exports.loginStudent = async (req, res) => {
  try {
    const { universityId, password } = req.body;

    if (!universityId || !password) {
      return res
        .status(400)
        .json({ error: "الرجاء إدخال رقم الجامعة وكلمة المرور" });
    }

    const user = await prisma.user.findFirst({
      where: {
        universityId,
        role: "STUDENT",
      },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({
        error: "رقم الجامعة أو كلمة المرور غير صحيحة"
      });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ 
        error: "رقم الجامعة أو كلمة المرور غير صحيحة" 
      });
    }

    const token = generateToken(user);

    return res.json({
      message: "تم تسجيل الدخول بنجاح",
      token,
      user: {
        id: user.id,
        universityId: user.universityId,
        name: user.name,
        department: user.department,
        stage: user.stage,
        role: user.role,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Error logging in student:", error);
    return res.status(500).json({ error: "فشل في تسجيل الدخول" });
  }
};


