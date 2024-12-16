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

async function checkAdmin(userId) {
    const userDocRef = doc(firestore, "users", userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        document.getElementById('adminActions').style.display = userData.isAdmin ? 'block' : 'none';
    } else {
        console.log("لا يوجد بيانات لهذا المستخدم");
        document.getElementById('adminActions').style.display = 'none';
    }
}


document.getElementById('loginBtn').addEventListener('click', () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    // مسح رسائل الخطأ السابقة
    document.getElementById('emailErrorE').textContent = '';
    document.getElementById('emailErrorEr').style.display = 'none';
    document.getElementById('passwordErrorP').textContent = '';
    document.getElementById('passwordErrorEr').style.display = 'none';
    document.getElementById('errorLogin').style.display = 'none';

    // التحقق من وجود البريد وكلمة المرور
    if (!email || !password) {
        if (!email) {
            document.getElementById('emailErrorE').textContent = 'يرجى إدخال البريد الإلكتروني.';
        }
        if (!password) {
            document.getElementById('passwordErrorP').textContent = 'يرجى إدخال كلمة المرور.';
        }
        return;
    }

    // تسجيل الدخول باستخدام Firebase
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // إخفاء نموذج تسجيل الدخول وعرض محتوى التطبيق
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('registerForm').style.display = 'none';
            document.getElementById('appContent').style.display = 'block';

            checkAdmin(userCredential.user.uid);
        })
        .catch((error) => {
console.error('Full error object:', error);

    // إخفاء رسائل الخطأ القديمة
    document.getElementById('emailErrorEr').style.display = 'none';
    document.getElementById('passwordErrorEr').style.display = 'none';
    document.getElementById('errorLogin').style.display = 'none';

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
        });
});



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
    document.getElementById("appContent").style.display = "block";
});





// إضافة الأقواس المفقودة في أماكن أخرى من الكود، مثل الدوال الأخرى.


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

async function searchMotor() {
    const searchQuery = document.getElementById("searchMotor").value.toLowerCase();
    const tableBody = document.getElementById("motorsTable").getElementsByTagName("tbody")[0];
    tableBody.innerHTML = ""; // تفريغ الجدول

    try {
        // جلب البيانات من Firebase
        const motorsCollectionRef = collection(firestore, "motors");
        const motorsSnapshot = await getDocs(motorsCollectionRef);
        const motorsList = motorsSnapshot.docs.map(doc => doc.data());

        // تصفية النتائج بناءً على البحث في الموديل فقط
        const filteredMotors = motorsList.filter(motor => {
            const model = motor.model || ''; // التأكد من وجود الموديل
            return model.toLowerCase().includes(searchQuery); // البحث فقط في الموديل
        });

        if (filteredMotors.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='16'>لا توجد نتائج مطابقة</td></tr>";
        } else {
            // ترتيب الحقول الذي يجب عرضه
            const fieldOrder = [
                "model",
                "hp",
                "w",
                "rlaAmperage",
                "displacement",
                "kCalHr",
                "btu",
                "w23",
                "w_5",
                "w_72",
                "application",
                "refrigerant",
                "manufacturer",
                "electricity",
                "running_capacitor",
                "starting_capacitor"
            ];

            // عرض النتائج في الجدول
            filteredMotors.forEach(motor => {
                const row = document.createElement("tr");
                fieldOrder.forEach(field => {
                    const cell = document.createElement("td");
                    if (motor[field]) {
                        // إذا كان الحقل موجودًا وله قيمة
                        cell.textContent = motor[field];
                    } else {
                        // ترك الحقل فارغًا إذا لم يكن موجودًا
                        cell.textContent = "";
                    }
                    row.appendChild(cell);
                });
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error("حدث خطأ أثناء البحث:", error);
        alert("فشل البحث، يرجى المحاولة لاحقًا.");
    }
}




// ربط الدالة للبيئة العامة
window.searchMotor = searchMotor;

// أو ربط الحدث مباشرة في JavaScript
document.getElementById("searchMotor").addEventListener("input", searchMotor);

// إظهار نموذج تسجيل موتور جديد
function showMotorForm() {
    hideAllSections(); // تأكد من أن هذه الدالة موجودة وتخفي جميع الأقسام الأخرى
    document.getElementById('motorForm').style.display = 'block'; // عرض نموذج الموتور
    document.querySelector('.top-bar').style.display = 'block'; // عرض الشريط العلوي
}

function hideAllSections() {
    const sections = document.querySelectorAll('#appContent > div');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    console.log("تم إخفاء جميع الأقسام");
}

// تأكد من عرض جميع العناصر المطلوبة عند الضغط على زر إلغاء
document.getElementById("cancelMotorBtn").addEventListener("click", () => {
    console.log("تم الضغط على زر إلغاء");
    document.getElementById("motorForm").style.display = "none"; // إخفاء نموذج الموتور
    document.getElementById("appContent").style.display = "block"; // عرض محتوى التطبيق
    document.querySelector('.top-bar').style.display = 'block'; // عرض الشريط العلوي
    const otherSections = document.querySelectorAll('#appContent > div');
    otherSections.forEach(section => {
        if (section.id !== 'motorForm') {
            section.style.display = 'block'; // إعادة عرض الأقسام الأخرى
        }
    });
    searchMotor(); // تحديث جدول الموتورات بعد الإلغاء
});

document.getElementById('showMotorForm').addEventListener('click', showMotorForm);

// مصفوفة لتخزين بيانات الموتورات
// لا حاجة لتعريف مكرر للمتغير motors

document.getElementById("saveMotorBtn").addEventListener("click", async () => {
    console.log("تم الضغط على زر حفظ");
    const motor = {
        model: document.getElementById("motorModel").value || "غير متوفر",
        hp: document.getElementById("motorHP").value || "غير متوفر",
        w: document.getElementById("motorW").value || "غير متوفر",
        rla_amperage: document.getElementById("motorRLA").value || "غير متوفر",
        displacement: document.getElementById("motorDisplCC").value || "غير متوفر",
        kcal_hr: document.getElementById("motorKCAL").value || "غير متوفر",
        btu: document.getElementById("motorBTU").value || "غير متوفر",
        w_23: document.getElementById("motorW23").value || "غير متوفر",
        w_5: document.getElementById("motorW5").value || "غير متوفر",
        w_72: document.getElementById("motorW72").value || "غير متوفر",
        application: document.getElementById("motorApplication").value || "غير متوفر",
        refrigerant: document.getElementById("motorRefrigerant").value || "غير متوفر",
        manufacturer: document.getElementById("motorManufacturer").value || "غير متوفر",
        electricity: document.getElementById("motorElectricity").value || "غير متوفر",
        running_capacitor: document.getElementById("motorRunningCapacitor").value || "غير متوفر",
        starting_capacitor: document.getElementById("motorStartingCapacitor").value || "غير متوفر"
    };

    try {
        await addDoc(collection(firestore, "motors"), motor);
        alert("تم حفظ البيانات بنجاح!");

 
        // تفريغ الحقول بعد الحفظ
        document.getElementById("motorModel").value = "";
        document.getElementById("motorHP").value = "";
        document.getElementById("motorW").value = "";
        document.getElementById("motorRLA").value = "";
        document.getElementById("motorDisplCC").value = "";
        document.getElementById("motorKCAL").value = "";
        document.getElementById("motorBTU").value = "";
        document.getElementById("motorW23").value = "";
        document.getElementById("motorW5").value = "";
        document.getElementById("motorW72").value = "";
        document.getElementById("motorApplication").value = "";
        document.getElementById("motorRefrigerant").value = "";
        document.getElementById("motorManufacturer").value = "";
        document.getElementById("motorElectricity").value = "";
        document.getElementById("motorRunningCapacitor").value = "";
        document.getElementById("motorStartingCapacitor").value = "";

        searchMotor(); // تحديث جدول الموتورات بعد الإضافة

    } catch (error) {
        console.log("حدث خطأ أثناء الحفظ:", error.message);
        alert("حدث خطأ أثناء الحفظ: " + error.message);
    }
});


document.getElementById("uploadBtn").addEventListener("click", async () => {
    const fileInput = document.getElementById("fileInput");
    if (fileInput.files.length === 0) {
        alert("يرجى اختيار ملف!");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async (event) => {
        try {
            // قراءة الملف باستخدام SheetJS
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: "array" });

            // اختيار أول شيت وتحويله إلى JSON
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const motorsData = XLSX.utils.sheet_to_json(firstSheet);

            // رفع البيانات إلى Firebase Firestore
            for (const motor of motorsData) {
                // التأكد من أن الحقول تحتوي على قيم صحيحة
                const motorData = {
                    model: motor["موديل"] || null,
                    hp: motor["HP"] || null,
                    w: motor["W"] || null,
                    rlaAmperage: motor["RLA - الامبير"] || null,
                    displacement: motor["Displ.CC - الازاحة"] || null,
                    kCalHr: motor["k CAL/HR"] || null,
                    btu: motor["B T U"] || null,
                    w23: motor["W23"] || null,
                    w5: motor["W5"] || null,
                    w7_2: motor["W7.2+"] || null,
                    application: motor["التطبيق"] || null,
                    refrigerant: motor["الفريون"] || null,
                    manufacturer: motor["الشركة المصنعة"] || null,
                    electricity: motor["الكهرباء"] || null,
                    runningCapacitor: motor["مكثف تشغيل"] || null,
                    startingCapacitor: motor["مكثف تقويم"] || null
                };

                // رفع البيانات إلى Firebase (تأكد من أنك قمت بإعداد Firestore)
                await addDoc(collection(firestore, "motors"), motorData);
            }

            alert("تم رفع البيانات بنجاح!");
        } catch (error) {
            console.error("حدث خطأ أثناء رفع الملف:", error);
            alert("فشل رفع الملف!");
        }
    };

    reader.readAsArrayBuffer(file);
});


// تحميل البيانات من ملف Excel باستخدام مكتبة xlsx (على سبيل المثال)
function loadExcelData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // افترض أن البيانات في أول ورقة (sheet)
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const motorsData = XLSX.utils.sheet_to_json(firstSheet);
        // معالجة البيانات قبل إرسالها إلى Firebase
        jsonData.forEach(row => {
            const motorData = processMotorData(row);
            addDoc(collection(firestore, "motors"), motorData); // إرسال البيانات إلى Firebase
        });
    };
    reader.readAsBinaryString(file);
}

// دالة لمعالجة بيانات المواتير
function processMotorData(data) {
    return {
        model: data.model || "",  // تأكد من أن الموديل ليس undefined أو null
        hp: data.hp || "",  // التأكد من أن القيم فارغة تبقى فارغة
        w: data.w || "",
        rla_amperage: data.rla_amperage || "",
        displacement: data.displacement || "",
        kcal_hr: data.kcal_hr || "",
        btu: data.btu || "",
        w_23: data.w_23 || "",
        w_5: data.w_5 || "",
        w_72: data.w_72 || "",
        application: data.application || "",
        refrigerant: data.refrigerant || "",
        manufacturer: data.manufacturer || "",
        electricity: data.electricity || "",
        running_capacitor: data.running_capacitor || "",
        starting_capacitor: data.starting_capacitor || ""
    };
}