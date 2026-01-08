# Profile Management Endpoints

## 📋 نظرة عامة

تم إضافة 4 endpoints جديدة لإدارة الملف الشخصي للمستخدم:

1. **GET** `/api/v1/client/profile` - جلب معلومات الملف الشخصي
2. **PUT** `/api/v1/client/profile/avatar` - رفع/تحديث صورة المستخدم
3. **PUT** `/api/v1/client/profile` - تحديث معلومات الطالب (للطلاب فقط)
4. **DELETE** `/api/v1/client/profile` - حذف الحساب

---

## 🔐 المصادقة

جميع الـ endpoints تتطلب **JWT Token** في الـ Headers:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 1️⃣ جلب معلومات الملف الشخصي

### Request:
```
GET /api/v1/client/profile
```

### Headers:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Response (200 OK):
```json
{
  "success": true,
  "user": {
    "id": 1,
    "universityId": "U123456",
    "email": "student@university.edu",
    "name": "Ali",
    "department": "Computer Science",
    "stage": "3",
    "avatar": "http://localhost:3000/uploads/avatars/1_1234567890.jpg",
    "role": "STUDENT",
    "blocked": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**ملاحظة**: 
- للطلاب: يعرض جميع المعلومات (universityId, department, stage)
- للضيوف: يعرض المعلومات الأساسية فقط (name, email, avatar)

---

## 2️⃣ رفع/تحديث صورة المستخدم

### Request:
```
PUT /api/v1/client/profile/avatar
Content-Type: multipart/form-data
```

### Headers:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Body (Form Data):
- **Field name**: `avatar`
- **File**: صورة (JPEG, PNG, GIF, WebP)
- **Max size**: 5MB

### قيود الملف:
- ✅ **الأنواع المسموحة**: JPEG, JPG, PNG, GIF, WebP
- ✅ **الحجم الأقصى**: 5MB
- ❌ **غير مسموح**: ملفات أخرى

### Response (200 OK):
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "user": {
    "id": 1,
    "name": "Ali",
    "avatar": "http://localhost:3000/uploads/avatars/1_1234567890.jpg",
    "role": "STUDENT"
  }
}
```

### Response (400 Bad Request - ملف كبير):
```json
{
  "error": "File too large",
  "message": "Maximum file size is 5MB"
}
```

### Response (400 Bad Request - نوع ملف غير صحيح):
```json
{
  "error": "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
}
```

### أمثلة الاستخدام:

#### cURL:
```bash
curl -X PUT http://localhost:3000/api/v1/client/profile/avatar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "avatar=@/path/to/image.jpg"
```

#### JavaScript (FormData):
```javascript
const formData = new FormData();
formData.append('avatar', fileInput.files[0]);

fetch('http://localhost:3000/api/v1/client/profile/avatar', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

#### Postman:
1. اختر **PUT** method
2. URL: `http://localhost:3000/api/v1/client/profile/avatar`
3. Headers: `Authorization: Bearer YOUR_TOKEN`
4. Body → form-data:
   - Key: `avatar` (اختر Type: File)
   - Value: اختر ملف الصورة

---

## 3️⃣ تحديث معلومات الطالب (للطلاب فقط)

### Request:
```
PUT /api/v1/client/profile
Content-Type: application/json
```

### Headers:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Body (JSON):
```json
{
  "name": "Ali Updated",
  "department": "Software Engineering",
  "stage": "4",
  "email": "newemail@university.edu"
}
```

**ملاحظة**: جميع الحقول اختيارية. يمكنك تحديث حقل واحد أو أكثر.

### Response (200 OK):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "universityId": "U123456",
    "email": "newemail@university.edu",
    "name": "Ali Updated",
    "department": "Software Engineering",
    "stage": "4",
    "avatar": "http://localhost:3000/uploads/avatars/1_1234567890.jpg",
    "role": "STUDENT",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

### Response (403 Forbidden - للضيوف):
```json
{
  "error": "Forbidden. Only students can update their profile information."
}
```

### Response (409 Conflict - Email مستخدم):
```json
{
  "error": "Email already in use by another account"
}
```

### Response (400 Bad Request - لا توجد حقول للتحديث):
```json
{
  "error": "No fields provided for update"
}
```

**مهم**: 
- ✅ **الطلاب فقط** يمكنهم تحديث معلوماتهم
- ❌ **الضيوف** لا يمكنهم تحديث معلوماتهم (403 Forbidden)
- ✅ يمكن تحديث `email` مع التحقق من عدم التكرار

---

## 4️⃣ حذف الحساب

### Request:
```
DELETE /api/v1/client/profile
```

### Headers:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Response (200 OK):
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

### ما يتم حذفه:
عند حذف الحساب، يتم حذف **جميع البيانات المرتبطة** تلقائياً (Cascade Delete):

- ✅ الحساب (User)
- ✅ جميع المحادثات (Conversations)
- ✅ جميع الرسائل (Messages)
- ✅ سجل الاستخدام اليومي (GuestUsage)
- ✅ ملف الصورة الشخصية (إذا كانت محلية)

**⚠️ تحذير**: هذه العملية **لا يمكن التراجع عنها**. تأكد من رغبتك في حذف الحساب.

---

## 🧪 أمثلة الاختبار الكاملة

### 1. جلب الملف الشخصي:
```bash
curl -X GET http://localhost:3000/api/v1/client/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. رفع صورة:
```bash
curl -X PUT http://localhost:3000/api/v1/client/profile/avatar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "avatar=@avatar.jpg"
```

### 3. تحديث معلومات الطالب:
```bash
curl -X PUT http://localhost:3000/api/v1/client/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ali",
    "department": "CS",
    "stage": "3"
  }'
```

### 4. حذف الحساب:
```bash
curl -X DELETE http://localhost:3000/api/v1/client/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📁 هيكل الملفات

```
uploads/
  └── avatars/
      ├── 1_1234567890.jpg
      ├── 2_1234567891.png
      └── ...
```

**ملاحظة**: 
- الملفات تُحفظ في `uploads/avatars/`
- اسم الملف: `{userId}_{timestamp}.{extension}`
- يتم حذف الصورة القديمة تلقائياً عند رفع صورة جديدة

---

## ⚠️ ملاحظات مهمة

1. **رفع الصور**:
   - ✅ يعمل للطلاب والضيوف
   - ✅ يتم حذف الصورة القديمة تلقائياً
   - ✅ الصور من Google OAuth لا تُحذف (تبقى URL)

2. **تحديث المعلومات**:
   - ✅ **للطلاب فقط** (403 للضيوف)
   - ✅ جميع الحقول اختيارية
   - ✅ Email يجب أن يكون فريداً

3. **حذف الحساب**:
   - ✅ يعمل للجميع (طلاب وضيوف)
   - ✅ حذف كامل لجميع البيانات المرتبطة
   - ⚠️ **لا يمكن التراجع عنه**

---

## 🔒 الأمان

- ✅ جميع الـ endpoints محمية بـ JWT Authentication
- ✅ المستخدم يمكنه فقط تعديل/حذف حسابه الخاص
- ✅ تحديث المعلومات للطلاب فقط
- ✅ التحقق من صحة الملفات المرفوعة
- ✅ حماية من رفع ملفات كبيرة أو خاطئة

---

## 🚀 الخطوات التالية

1. ✅ تأكد من وجود مجلد `uploads/avatars/`
2. ✅ اختبر رفع الصور
3. ✅ اختبر تحديث معلومات الطالب
4. ✅ اختبر حذف الحساب (بحذر!)

---

**🎉 النظام جاهز للاستخدام!**

