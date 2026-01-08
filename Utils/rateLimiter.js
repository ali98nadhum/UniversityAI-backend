const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// CHANGE: Configuration for guest rate limits
// You can move these to .env if needed
const GUEST_DAILY_LIMIT = parseInt(process.env.GUEST_DAILY_LIMIT || "10"); // Default: 10 questions per day
const GUEST_RESET_HOUR = parseInt(process.env.GUEST_RESET_HOUR || "0"); // Reset at midnight (0 = 00:00)

/**
 * Check if a guest user has exceeded their daily question limit
 * @param {number} userId - The user ID
 * @returns {Promise<{allowed: boolean, remaining: number, limit: number}>}
 */
async function checkGuestLimit(userId) {
  try {
    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find or create today's usage record
    let usage = await prisma.guestUsage.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    // If no record exists, create one
    if (!usage) {
      usage = await prisma.guestUsage.create({
        data: {
          userId,
          date: today,
          questionCount: 0,
        },
      });
    }

    const remaining = Math.max(0, GUEST_DAILY_LIMIT - usage.questionCount);
    const allowed = usage.questionCount < GUEST_DAILY_LIMIT;

    return {
      allowed,
      remaining,
      limit: GUEST_DAILY_LIMIT,
      used: usage.questionCount,
    };
  } catch (error) {
    console.error("Error checking guest limit:", error);
    // On error, allow the request (fail open) but log it
    return {
      allowed: true,
      remaining: GUEST_DAILY_LIMIT,
      limit: GUEST_DAILY_LIMIT,
      used: 0,
    };
  }
}

/**
 * Increment the question count for a guest user
 * @param {number} userId - The user ID
 * @returns {Promise<void>}
 */
async function incrementGuestUsage(userId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Use upsert to create or update
    await prisma.guestUsage.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      update: {
        questionCount: {
          increment: 1,
        },
      },
      create: {
        userId,
        date: today,
        questionCount: 1,
      },
    });
  } catch (error) {
    console.error("Error incrementing guest usage:", error);
    // Don't throw - we don't want to block the request if tracking fails
  }
}

/**
 * Middleware to enforce rate limiting for GUEST users
 * Students have unlimited access
 */
async function guestRateLimitMiddleware(req, res, next) {
  try {
    const user = req.user;

    // Only apply rate limiting to GUEST users
    if (user?.role !== "GUEST") {
      return next(); // Students and admins have unlimited access
    }

    const limitCheck = await checkGuestLimit(user.id);

    if (!limitCheck.allowed) {
      return res.status(429).json({
        error: "تم تجاوز حد الأسئلة اليومي",
        message: `لقد وصلت إلى الحد اليومي المسموح به وهو ${limitCheck.limit} أسئلة. يرجى المحاولة غدًا أو التسجيل كطالب للحصول على وصول غير محدود.`,
        limit: limitCheck.limit,
        used: limitCheck.used,
        remaining: 0,
      });
    }

    // Attach limit info to request for logging/response
    req.guestLimitInfo = {
      remaining: limitCheck.remaining,
      limit: limitCheck.limit,
      used: limitCheck.used,
    };

    next();
  } catch (error) {
    console.error("Rate limit middleware error:", error);
    // On error, allow the request (fail open)
    next();
  }
}

module.exports = {
  checkGuestLimit,
  incrementGuestUsage,
  guestRateLimitMiddleware,
  GUEST_DAILY_LIMIT,
};

