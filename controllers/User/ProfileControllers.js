const { PrismaClient } = require("@prisma/client");
const path = require("path");
const fs = require("fs").promises;

const prisma = new PrismaClient();

// CHANGE: Directory for storing uploaded avatars
const AVATAR_UPLOAD_DIR = path.join(__dirname, "../../uploads/avatars");

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.mkdir(AVATAR_UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating upload directory:", error);
  }
}

// Initialize upload directory on module load
ensureUploadDir();

// ==================================
// @desc Upload/Update user avatar
// @route PUT /api/v1/client/profile/avatar
// @method PUT
// @access private (all authenticated users)
// ==================================
module.exports.uploadAvatar = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        error: "No image file provided",
        message: "Please upload an image file using the 'avatar' field"
      });
    }

    // Validate file type
    const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedMimes.includes(req.file.mimetype)) {
      // Delete uploaded file if invalid
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        error: "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.",
      });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        error: "File too large. Maximum size is 5MB.",
      });
    }

    // Get current user to check existing avatar
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    // Delete old avatar if exists (not from Google OAuth)
    if (user?.avatar && !user.avatar.startsWith("http")) {
      const oldAvatarPath = path.join(__dirname, "../../", user.avatar);
      await fs.unlink(oldAvatarPath).catch(() => {
        // Ignore if file doesn't exist
      });
    }

    // Create relative path for database storage
    const relativePath = path.relative(
      path.join(__dirname, "../../"),
      req.file.path
    );

    // Update user avatar in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: relativePath },
      select: {
        id: true,
        name: true,
        avatar: true,
        role: true,
      },
    });

    // Return full URL for avatar
    const avatarUrl = updatedUser.avatar?.startsWith("http")
      ? updatedUser.avatar
      : `${req.protocol}://${req.get("host")}/${updatedUser.avatar}`;

    res.json({
      success: true,
      message: "Avatar uploaded successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        avatar: avatarUrl,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    // Delete uploaded file on error
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    res.status(500).json({ error: "Failed to upload avatar" });
  }
};

// ==================================
// @desc Update student profile information
// @route PUT /api/v1/client/profile
// @method PUT
// @access private (STUDENT only)
// ==================================
module.exports.updateStudentProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    // CHANGE: Only students can update their profile information
    if (role !== "STUDENT") {
      return res.status(403).json({
        error: "غير مسموح. فقط حسابات الطلاب يمكنها تعديل معلوماتها."
      });
    }

    const { name, department, stage, email } = req.body;

    // Build update data (only include provided fields)
    const updateData = {};
    if (name !== undefined) updateData.name = name || null;
    if (department !== undefined) updateData.department = department || null;
    if (stage !== undefined) updateData.stage = stage || null;

    // Email update requires uniqueness check
    if (email !== undefined) {
      if (email) {
        // Check if email is already taken by another user
        const existingUser = await prisma.user.findFirst({
          where: {
            email,
            NOT: { id: userId },
          },
        });

        if (existingUser) {
          return res.status(409).json({
            error: "البريد الإلكتروني مستخدم بالفعل من قبل حساب آخر."
          });
        }
        updateData.email = email;
      } else {
        updateData.email = null;
      }
    }

    // If no fields to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: "No fields provided for update",
      });
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        universityId: true,
        email: true,
        name: true,
        department: true,
        stage: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: "تم تحديث بيانات الحساب بنجاح.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// ==================================
// @desc Delete user account
// @route DELETE /api/v1/client/profile
// @method DELETE
// @access private (all authenticated users)
// ==================================
module.exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    // Get user info before deletion (for cleanup)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        avatar: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete avatar file if exists (not from Google OAuth)
    if (user.avatar && !user.avatar.startsWith("http")) {
      const avatarPath = path.join(__dirname, "../../", user.avatar);
      await fs.unlink(avatarPath).catch(() => {
        // Ignore if file doesn't exist
      });
    }
    // Delete user from database
    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({
      success: true,
      message: "تم حذف حسابك بنجاح."
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
};

// ==================================
// @desc Get current user profile
// @route GET /api/v1/client/profile
// @method GET
// @access private (all authenticated users)
// ==================================
module.exports.getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        universityId: true,
        email: true,
        name: true,
        department: true,
        stage: true,
        avatar: true,
        role: true,
        blocked: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return full URL for avatar if it's a local file
    const avatarUrl = user.avatar?.startsWith("http")
      ? user.avatar
      : user.avatar
      ? `${req.protocol}://${req.get("host")}/${user.avatar}`
      : null;

    res.json({
      success: true,
      user: {
        ...user,
        avatar: avatarUrl,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

