import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC5ZE1m5qe10pbAiZcSjBkIVDVNZExtf5U",
    authDomain: "elferdaws-1a362.firebaseapp.com",
    projectId: "elferdaws-1a362",
    storageBucket: "elferdaws-1a362.firebasestorage.app",
    messagingSenderId: "74289958469",
    appId: "1:74289958469:web:4ab94014a6afc191b61d2c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);



function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

function showRegisterForm() {
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('loginForm').style.display = 'none';
}

document.getElementById('registerRedirectBtn').addEventListener('click', showRegisterForm);
document.getElementById('loginRedirectBtn').addEventListener('click', showLoginForm);


document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const identifier = document.getElementById('email').value.trim(); // يمكن أن يكون بريدًا إلكترونيًا أو رقم هاتف
            const password = document.getElementById('password').value.trim();

            // مسح رسائل الخطأ السابقة
            clearErrorMessages();

            // التحقق من وجود المدخلات
            if (!identifier || !password) {
                if (!identifier) {
                    document.getElementById('emailErrorE').textContent = 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف.';
                }
                if (!password) {
                    document.getElementById('passwordErrorP').textContent = 'يرجى إدخال كلمة المرور.';
                }
                return;
            }

            // التحقق من نوع المدخل (بريد إلكتروني أو رقم هاتف)
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
            const isPhone = /^\+?\d{10,15}$/.test(identifier);

            if (!isEmail && !isPhone) {
                document.getElementById('emailErrorEr').textContent = 'يرجى إدخال بريد إلكتروني صالح أو رقم هاتف صالح.';
                document.getElementById('emailErrorEr').style.display = 'block';
                return;
            }

            // تسجيل الدخول
            if (isEmail) {
                loginWithEmail(identifier, password);
            } else if (isPhone) {
                const fakeEmail = `${identifier}@phone.fake`; // تحويل رقم الهاتف إلى بريد إلكتروني وهمي
                loginWithEmail(fakeEmail, password);
            }
        });
    }
});

// وظيفة لمسح رسائل الخطأ السابقة
function clearErrorMessages() {
    document.getElementById('emailErrorE').textContent = '';
    document.getElementById('emailErrorEr').style.display = 'none';
    document.getElementById('passwordErrorP').textContent = '';
    document.getElementById('passwordErrorEr').style.display = 'none';
    document.getElementById('errorLogin').style.display = 'none';
}

// وظيفة لتسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور
function loginWithEmail(email, password) {
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            handleLoginSuccess(userCredential);
        })
        .catch((error) => {
            handleLoginError(error);
        });
}

// وظيفة لمعالجة نجاح تسجيل الدخول
function handleLoginSuccess(userCredential) {
    // تخزين بيانات المستخدم في localStorage
    localStorage.setItem('user', JSON.stringify(userCredential.user));

    // إعادة توجيه المستخدم إلى الصفحة الرئيسية
    window.location.href = 'index.html'; // استبدل index.html بصفحة التطبيق الخاصة بك
}

// وظيفة لمعالجة أخطاء تسجيل الدخول
function handleLoginError(error) {
    console.error('Full error object:', error);

    // إخفاء رسائل الخطأ القديمة
    clearErrorMessages();


    // التعامل مع أكواد الخطأ
            switch (error.code) {
                case 'auth/user-not-found':
                    document.getElementById('emailErrorEr').textContent = 'البريد الإلكتروني غير مسجل.';
                    document.getElementById('emailErrorEr').style.display = 'block';
                    break;
                case 'auth/wrong-password':
                    document.getElementById('passwordErrorEr').textContent = 'كلمة المرور غير صحيحة.';
                    document.getElementById('passwordErrorEr').style.display = 'block';
                    break;
                case 'auth/invalid-email':
                    document.getElementById('emailErrorEr').textContent = 'تنسيق البريد الإلكتروني غير صحيح.';
                    document.getElementById('emailErrorEr').style.display = 'block';
                    break;
                case 'auth/too-many-requests':
                    document.getElementById('errorLogin').textContent = 'تم حظر الحساب مؤقتًا بسبب محاولات متكررة. حاول لاحقًا.';
                    document.getElementById('errorLogin').style.display = 'block';
                    break;
                case 'auth/invalid-login-credentials': // معالجة خطأ غير شائع
                    document.getElementById('errorLogin').textContent = 'بيانات تسجيل الدخول غير صحيحة. يرجى التأكد من البريد الإلكتروني وكلمة المرور.';
                    document.getElementById('errorLogin').style.display = 'block';
                    break;
                default:
                    // عرض رسالة خطأ عامة
                    document.getElementById('errorLogin').textContent = 'فشل تسجيل الدخول: ' + error.message;
                    document.getElementById('errorLogin').style.display = 'block';
                    break;
    }
}



// دالة لتسجيل مستخدم جديد
document.getElementById("registerBtn").addEventListener("click", async (event) => {
    event.preventDefault();

    // الحصول على القيم من المدخلات
    const identifier = document.getElementById("identifier").value.trim();
    const password = document.getElementById("registerPassword").value.trim();
    const fullName = document.getElementById("registerFullName").value.trim();

    // مسح رسائل الأخطاء السابقة
    document.getElementById("identifierError").textContent = "";
    document.getElementById("passwordError").textContent = "";
    document.getElementById("resetPasswordMessage").textContent = ""; // إخفاء رسالة إعادة تعيين كلمة المرور

    // التحقق من المدخلات
    if (!identifier || !password || !fullName) {
        if (!identifier) document.getElementById("identifierError").innerText = "يرجى إدخال البريد الإلكتروني أو رقم الهاتف.";
        if (!password) document.getElementById("passwordError").innerText = "يرجى إدخال كلمة المرور.";
        if (!fullName) document.getElementById("FullNameError").innerText = "يرجى إدخال الاسم بالكامل.";
        return;
    }

    // التحقق من نوع المدخل (بريد إلكتروني أم رقم هاتف)
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const isPhone = /^\+?\d{10,15}$/.test(identifier);

    if (!isEmail && !isPhone) {
        document.getElementById("identifierError").innerText = "يرجى إدخال بريد إلكتروني صحيح أو رقم هاتف صالح.";
        return;
    }

   try {
        // عرض علامة تحميل
        document.getElementById("loadingIndicator").style.display = "block";

        // إنشاء المستخدم
        let userCredential;
        if (isEmail) {
            userCredential = await createUserWithEmailAndPassword(auth, identifier, password);
        } else {
            const fakeEmail = `${identifier}@phone.fake`; // إنشاء بريد مزيف للأرقام
            userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, password);
        }

        const user = userCredential.user;

        // تخزين بيانات المستخدم في Firestore
        await setDoc(doc(firestore, "users", user.uid), {
            fullName,
            phone: isPhone ? identifier : null,
            email: isEmail ? identifier : null,
            isAdmin: false,
        });
		
		  // تخزين بيانات المستخدم في localStorage
        localStorage.setItem("user", JSON.stringify({
            uid: user.uid,
            fullName: fullName,
            phone: isPhone ? identifier : null,
            email: isEmail ? identifier : null,
        }));


 // إخفاء علامة التحميل
        document.getElementById("loadingIndicator").style.display = "none";

        // عرض رسالة الترحيب وزر الانتقال
        document.getElementById("registerForm").style.display = "none";
        document.getElementById("welcomeMessage").style.display = "block";

    
    } catch (error) {
		        // إخفاء علامة التحميل في حالة وجود خطأ
		        document.getElementById("loadingIndicator").style.display = "none";

        if (error.code === "auth/email-already-in-use") {
            // عرض رسالة الخطأ
            document.getElementById("identifierError").textContent = "البريد الإلكتروني أو رقم الهاتف مسجل بالفعل.";

            // إنشاء رسالة إضافية لإعادة تعيين كلمة المرور
            const resetPasswordMessage = document.getElementById("resetPasswordMessage");
            resetPasswordMessage.innerHTML = `
                هل تريد <span id="resetPasswordLink" style="color: blue; text-decoration: underline; cursor: pointer;">إعادة تعيين كلمة السر</span>؟
            `;
            resetPasswordMessage.style.display = "block";

            // إضافة حدث عند الضغط على رابط إعادة تعيين كلمة المرور
            document.getElementById("resetPasswordLink").addEventListener("click", async () => {
                if (isEmail) {
                    try {
                        await sendPasswordResetEmail(auth, identifier);
                        alert("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.");
                    } catch (resetError) {
                        alert("حدث خطأ أثناء إرسال رابط إعادة تعيين كلمة المرور: " + resetError.message);
                    }
                } else {
                    alert("لا يمكن إعادة تعيين كلمة المرور باستخدام رقم الهاتف.");
                }
            });
        } else if (error.code === "auth/invalid-email") {
            document.getElementById("identifierError").textContent = "البريد الإلكتروني غير صالح.";
        } else if (error.code === "auth/weak-password") {
            document.getElementById("passwordError").textContent = "كلمة المرور ضعيفة. يجب أن تكون على الأقل 6 أحرف.";
        } else {
            console.error("فشل التسجيل:", error);
            alert("حدث خطأ أثناء التسجيل: " + error.message);
        }
    }
});

// التعامل مع زر الانتقال إلى التطبيق
document.getElementById("goToAppBtn").addEventListener("click", () => {
    document.getElementById("welcomeMessage").style.display = "none";
    window.location.href = 'index.html'; // أو الصفحة التي تستخدمها لتسجيل الدخول
});

function showLoading() {
    document.getElementById("loading").style.display = "block";
}

function hideLoading() {
    document.getElementById("loading").style.display = "none";
}
