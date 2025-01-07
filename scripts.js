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



// التحقق إذا كان المستخدم قد سجل الدخول عند تحميل الصفحةwindow.onload = function() {
window.onload = function() {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        // إذا لم يكن هناك مستخدم، إعادة توجيه إلى صفحة تسجيل الدخول
        window.location.href = 'auth.html';
    } else {
        // إذا كان هناك مستخدم مسجل، عرض محتوى التطبيق
        document.getElementById('appContent').style.display = 'block';
        
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("user")); // الحصول على بيانات المستخدم من Local Storage
    if (user && user.uid) {
        await checkAdmin(user.uid); // التحقق مما إذا كان المستخدم أدمن
    } else {
        console.log("لم يتم العثور على مستخدم مسجل الدخول.");
    }
});

async function checkAdmin(userId) {
    try {
        const userDocRef = doc(firestore, "users", userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            console.log("بيانات المستخدم:", userData);

            // إظهار الزر إذا كان المستخدم أدمن
            document.getElementById("adminActions").style.display = userData.isAdmin ? "block" : "none";
        } else {
            console.log("لا يوجد بيانات لهذا المستخدم");
            document.getElementById("adminActions").style.display = "none";
        }
    } catch (error) {
        console.error("خطأ أثناء جلب بيانات المستخدم:", error);
    }
}


// إضافة وظيفة لتسجيل الخروج عند النقر على الزر
document.getElementById('logoutBtn').addEventListener('click', () => {
    // مسح بيانات المستخدم من localStorage
    localStorage.removeItem('user');

    // إعادة توجيه المستخدم إلى صفحة تسجيل الدخول
    window.location.href = 'auth.html'; // أو الصفحة التي تستخدمها لتسجيل الدخول
});

// إضافة الأقواس المفقودة في أماكن أخرى من الكود، مثل الدوال الأخرى.



async function searchMotor() {
	function showLoading() {
    document.getElementById("loading").style.display = "block"; // تُظهر الصورة
}

    const searchQuery = document.getElementById("searchMotor").value.toLowerCase();
    const tableBody = document.getElementById("motorsTable").getElementsByTagName("tbody")[0];
	    const noDataMessage = document.getElementById("noDataMessage"); // إضافة مرجع للرسالة
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
						 noDataMessage.style.display = 'block'; // إظهار الرسالة
        } else {
            // إخفاء الرسالة إذا كانت هناك نتائج
            noDataMessage.style.display = 'none'; 
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
    }function hideLoading() {
    document.getElementById("loading").style.display = "none"; // تُخفي الصورة
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

document.addEventListener('DOMContentLoaded', () => {
    const dropdownToggle = document.getElementById('dropdownToggle');
    const dropdownMenu = document.getElementById('dropdownMenu');

    // إظهار أو إخفاء القائمة عند النقر على الأيقونة
    dropdownToggle.addEventListener('click', (e) => {
        e.stopPropagation(); // منع إخفاء القائمة عند النقر على الأيقونة
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });

    // إخفاء القائمة عند النقر في أي مكان في الصفحة
    document.addEventListener('click', () => {
        dropdownMenu.style.display = 'none';
    });

    // منع إخفاء القائمة عند النقر عليها
    dropdownMenu.addEventListener('click', (e) => {
        e.stopPropagation();
    });
});

// التحقق من إصدار التطبيق
document.addEventListener("DOMContentLoaded", async () => {
    const localVersionCode = 3.1; // رقم إصدار التطبيق الحالي

    // وظيفة للتحقق من بيئة التشغيل (موبايل أم متصفح)
    function isMobileApp() {
        // كشف إذا كان التطبيق يعمل داخل WebView (بيئة الموبايل)
        return /wv|Android|iPhone|Mobile/i.test(navigator.userAgent);
    }

    try {
        // جلب رقم الإصدار الأحدث من Firestore
        const appInfoRef = doc(firestore, "appInfo", "version");
        const appInfoSnap = await getDoc(appInfoRef);

        if (appInfoSnap.exists()) {
            const latestVersion = appInfoSnap.data().versionCode;

            if (localVersionCode < latestVersion) {
                // إذا كان الإصدار الحالي أقل من الإصدار الأحدث وتطبيق الموبايل فقط
                if (isMobileApp()) {
                    alert("يرجى تحديث التطبيق للحصول على أحدث الميزات.");
                    // يمكن إعادة توجيه المستخدم إلى متجر التطبيقات هنا
                    window.location.href = "https://your-app-update-link.com";
                } else {
                    console.log("التطبيق يعمل على المتصفح، لن تظهر الرسالة.");
                }
            } else {
                console.log("التطبيق محدث.");
            }
        } else {
            console.log("لم يتم العثور على بيانات الإصدار في Firestore.");
        }
    } catch (error) {
        console.error("حدث خطأ أثناء التحقق من الإصدار:", error);
    }
});

