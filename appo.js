import { 
  initializeApp 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";

import { 
  getFirestore,
  enableIndexedDbPersistence,
  collection,
  addDoc,
  getDocs,
  writeBatch,
  doc,
  onSnapshot,
  deleteDoc,
  updateDoc, // إضافة هذا الاستيراد
  getDoc, // ✅ إضافة getDoc هنا لحل المشكلة
  query,
  where
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

import { 
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

import { browserLocalPersistence, setPersistence } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC5ZE1m5qe10pbAiZcSjBkIVDVNZExtf5U",
  authDomain: "elferdaws-1a362.firebaseapp.com",
  projectId: "elferdaws-1a362",
  storageBucket: "elferdaws-1a362.firebasestorage.app",
  messagingSenderId: "74289958469",
  appId: "1:74289958469:web:4ab94014a6afc191b61d2c"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth();


// ✅ تعيين الثبات المحلي للمصادقة قبل أي استدعاء آخر
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("✅ تم تعيين ثبات المصادقة على LOCAL");
  })
  .catch((error) => {
    console.error("❌ خطأ أثناء تعيين الثبات:", error);
  });
  
  // ✅ تمكين استمرارية Firestore
enableIndexedDbPersistence(firestore)
  .then(() => {
    console.log("✅ تم تمكين استمرارية Firestore");
  })
  .catch((error) => {
    console.error("❌ خطأ أثناء تمكين استمرارية Firestore:", error);
  });

// ✅ استعادة الجلسة عند فقدان الإنترنت
async function restoreSession() {
  const storedUser = JSON.parse(localStorage.getItem("currentUser"));
  if (storedUser && storedUser.id) {
    currentUser = storedUser;
    console.warn("⚠️ لا يوجد اتصال بالإنترنت، تم استعادة جلسة المستخدم من التخزين المحلي:", currentUser);
    
    // ✅ تحميل المواعيد من التخزين المحلي
    const cachedAppointments = JSON.parse(localStorage.getItem(`appointments_${currentUser.id}`)) || [];
    displayAppointments(cachedAppointments);
  } else {
    console.warn("⚠️ لا يوجد مستخدم مسجّل دخول محليًا، الرجاء تسجيل الدخول.");
  }
}

// مراقبة Firestore للمواعيد (بشكل عام)
try {
  const appointmentsCollectionRef = collection(firestore, "appointments");
  onSnapshot(appointmentsCollectionRef, (snapshot) => {
    console.log("Firestore متصل بنجاح");
    snapshot.docs.forEach(doc => {
      console.log("Document:", doc.data());
    });
  }, (error) => {
    console.error("خطأ في الاتصال بـ Firestore:", error);
  });
} catch (error) {
  console.error("حدث خطأ أثناء إعداد مراقبة Firestore:", error);
}

let currentUser = {
  name: "اسم المستخدم", // سيتم تعيين الاسم الحقيقي بعد تسجيل الدخول
  id: null
};

// مراقبة حالة تسجيل الدخول
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("✅ المستخدم مسجّل دخول:", user.uid);

    // جلب بيانات المستخدم من Firestore وحفظها في التخزين المحلي
    const userRef = doc(firestore, "users", user.uid);
    try {
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        currentUser = {
          id: user.uid,
          name: userSnap.data().fullName || user.displayName || "مستخدم مجهول"
        };
      } else {
        currentUser = { id: user.uid, name: user.displayName || "مستخدم مجهول" };
      }
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      console.log("✅ تم حفظ بيانات المستخدم في localStorage:", currentUser);
    } catch (error) {
      console.error("❌ خطأ في جلب بيانات المستخدم:", error);
    }

    // استعلام لجلب مواعيد المستخدم فقط
    const userAppointmentsQuery = query(collection(firestore, "appointments"), where("userId", "==", user.uid));

    if (navigator.onLine) {
      onSnapshot(userAppointmentsQuery, (snapshot) => {
        console.log("✅ Firestore متصل بنجاح");
        const fetchedAppointments = snapshot.docs.map(doc => ({
          firebaseId: doc.id,
          ...doc.data()
        }));
        localStorage.setItem(`appointments_${user.uid}`, JSON.stringify(fetchedAppointments));
        console.log("📄 تم تحديث المواعيد في localStorage:", fetchedAppointments);
        displayAppointments(fetchedAppointments);
      }, (error) => {
        console.error("❌ خطأ في الاتصال بـ Firestore:", error);
      });
    } else {
      console.warn("⚠️ لا يوجد اتصال بالإنترنت، يتم تحميل المواعيد من التخزين المحلي...");
      const cachedAppointments = JSON.parse(localStorage.getItem(`appointments_${user.uid}`)) || [];
      displayAppointments(cachedAppointments);
    }
  } else {
    if (!navigator.onLine) {
      const storedUser = JSON.parse(localStorage.getItem("currentUser"));
      if (storedUser && storedUser.id) {
        currentUser = storedUser;
        console.warn("⚠️ لا يوجد مستخدم مسجّل دخول حاليًا، تم استعادة بيانات المستخدم من التخزين المحلي.");
        const cachedAppointments = JSON.parse(localStorage.getItem(`appointments_${currentUser.id}`)) || [];
        displayAppointments(cachedAppointments);
        return;
      }
    }
    console.log("❌ لا يوجد مستخدم مسجّل دخول");
    if (navigator.onLine) {
      localStorage.removeItem("currentUser");
    }
    displayAppointments([]);
  }
});




// تسجيل دخول المستخدم
async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("تم تسجيل الدخول بنجاح:", userCredential.user);
  } catch (error) {
    console.error("حدث خطأ أثناء تسجيل الدخول:", error.message);
  }
}



// الآن يمكنك استخدام currentUser في أي مكان داخل الكود

// تحميل المواعيد من localStorage عند تحميل الصفحة
let appointments = JSON.parse(localStorage.getItem(`appointments_${currentUser.id}`)) || [];
let historyAppointments = JSON.parse(localStorage.getItem(`historyAppointments_${currentUser.id}`)) || [];
// عرض تاريخ اليوم
document.getElementById('current-date').innerText = new Date().toLocaleDateString('ar-EG');


function hideConnectionMessage() {
    const connectionMessage = document.getElementById('connectionMessage');
    if (connectionMessage) {
        connectionMessage.style.display = 'none'; // إخفاء الرسالة
    }
}




if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(() => console.log('Service Worker registered successfully.'))
        .catch((error) => console.error('Service Worker registration failed:', error));
}

// عرض تاريخ اليوم
document.getElementById('current-date').innerText = new Date().toLocaleDateString('ar-EG');

// نقل الموعد إلى سجل المواعيد عند اتخاذ إجراء
window.moveToHistory = async function(appointmentId, action) {
  let appointments = JSON.parse(localStorage.getItem(`appointments_${currentUser.id}`)) || [];
  let historyAppointments = JSON.parse(localStorage.getItem(`historyAppointments_${currentUser.id}`)) || [];

  const appointmentIndex = appointments.findIndex(app => app.id === appointmentId);

  if (appointmentIndex !== -1) {
    const appointment = { ...appointments[appointmentIndex] };
    appointment.action = action;
    appointment.userId = currentUser.id;
    appointment.addedBy = currentUser.name && currentUser.name !== "اسم المستخدم المطلوب" ? currentUser.name : "غير متوفر";

    // ✅ **حفظ الموعد في سجل المواعيد قبل أي حذف**
    historyAppointments.push(appointment);
    localStorage.setItem(`historyAppointments_${currentUser.id}`, JSON.stringify(historyAppointments));

    // ✅ **إزالة الموعد من قائمة المواعيد**
    appointments.splice(appointmentIndex, 1);
    localStorage.setItem(`appointments_${currentUser.id}`, JSON.stringify(appointments));

    // ✅ **حذف الموعد من Firebase بعد الحفظ المحلي**
    if (appointment.firebaseId) {
      try {
        await deleteDoc(doc(firestore, "appointments", appointment.firebaseId));
      } catch (error) {
        console.error("❌ خطأ أثناء حذف الموعد من Firebase:", error);
      }
    }

    // ✅ **تحديث الواجهة**
    loadAppointments();
    loadHistoryAppointments(); // تحميل السجل مباشرة بعد التعديل
  } else {
    alert("❌ الموعد غير موجود!");
  }
};



// تحميل سجل المواعيد
window.loadHistoryAppointments = function() {
  if (!currentUser.id) {
    console.error("❌ خطأ: لا يوجد مستخدم مسجّل دخول");
    return;
  }

  let historyAppointments = JSON.parse(localStorage.getItem(`historyAppointments_${currentUser.id}`)) || [];
  console.log("📌 عدد المواعيد في سجل المواعيد:", historyAppointments.length, historyAppointments);

  // ✅ التأكد من أن عنصر الجدول موجود قبل تحديثه
  const historySection = document.getElementById('history-section');
  const historyTable = document.querySelector('#history-appointments');

  if (!historySection || !historyTable) {
    console.error("❌ خطأ: لم يتم العثور على `#history-section` أو `#history-appointments`");
    return;
  }

  const historyTableBody = historyTable.querySelector('tbody');
  if (!historyTableBody) {
    console.error("❌ خطأ: لم يتم العثور على `tbody` داخل الجدول");
    return;
  }

  // ✅ إظهار القسم مؤقتًا لضمان تحديث الجدول
  historySection.style.display = 'block';
  
  historyTableBody.innerHTML = ""; // ✅ تفريغ الجدول قبل إعادة تحميله

  if (historyAppointments.length === 0) {
    historyTableBody.innerHTML = `<tr><td colspan="12" style="text-align:center;">لا توجد مواعيد في السجل</td></tr>`;
  } else {
    historyAppointments.forEach((appointment, index) => {
      console.log(`📌 إضافة الموعد إلى الجدول:`, appointment);
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${appointment.clientName || '-'}</td>
        <td>${appointment.time || '-'}</td>
        <td>${appointment.date || '-'}</td>
        <td>${appointment.phone || '-'}</td>
        <td>${appointment.altPhone || '-'}</td>
        <td>${appointment.address || '-'}</td>
        <td>${appointment.issue || '-'}</td>
        <td>${appointment.deviceType || '-'}</td>
        <td>${appointment.deviceName || '-'}</td>
        <td>${appointment.notes || '-'}</td>
        <td>${appointment.action || '-'}</td>
      `;
      row.onclick = () => showAppointmentDetails(appointment.id);
      historyTableBody.appendChild(row);
    });
  }

  // ✅ إخفاء القسم بعد التحديث، سيظهر فقط عند الضغط على زر "سجل المواعيد"
  historySection.style.display = 'none';

  console.log("✅ تم تحميل سجل المواعيد بنجاح.");
};


// دالة لعرض تفاصيل الموعد
window.showAppointmentDetails = function(appointmentId) {
  // ✅ التأكد من أن المستخدم مسجّل دخول
  if (!currentUser.id) {
    console.error("❌ خطأ: لا يوجد مستخدم مسجّل دخول");
    return;
  }

  // ✅ جلب سجل المواعيد الصحيح من `localStorage`
  const historyAppointments = JSON.parse(localStorage.getItem(`historyAppointments_${currentUser.id}`)) || [];

  // ✅ البحث عن الموعد باستخدام `appointmentId`
  const appointment = historyAppointments.find(app => app.id.toString() === appointmentId.toString());

  if (appointment) {
    const detailsContent = document.getElementById('appointmentDetailsContent');
    let detailsHTML = `
      <p><strong>اسم العميل:</strong> ${appointment.clientName}</p>
      <p><strong>أضيف بواسطة:</strong> ${appointment.addedBy && appointment.addedBy !== 'غير متوفر' ? appointment.addedBy : 'غير متوفر'}</p>
    `;

    if (appointment.action === 'مكتمل') {
      detailsHTML += `
        <p><strong>تفاصيل الصيانة:</strong> ${appointment.maintenanceDetails || '-'}</p>
        <p><strong>السعر:</strong> ${appointment.price || '-'}</p>
        <p><strong>الوقت والتاريخ الفعلي:</strong> ${appointment.actualDateTime || '-'}</p>
        <p><strong>قطع الغيار:</strong> ${(appointment.spareParts || []).join(', ')}</p>
      `;
    } else if (appointment.action === 'ملغي') {
      detailsHTML += `<p><strong>سبب الإلغاء:</strong> ${appointment.cancelReason || '-'}</p>`;
    } else if (appointment.action === 'سحب للورشة') {
      detailsHTML += `<p><strong>ملاحظات الورشة:</strong> ${appointment.workshopNotes || '-'}</p>`;
    }

    detailsContent.innerHTML = detailsHTML;
    openModal('appointmentDetailsModal'); // ✅ فتح النافذة المنبثقة
  } else {
    alert("❌ لم يتم العثور على الموعد!");
  }
};




// إظهار واجهة إضافة موعد جديد
window.showAddAppointment = function() {
  console.log("تم استدعاء showAddAppointment");
  document.getElementById('add-appointment-section').style.display = 'block';
  document.querySelector('.header').style.display = 'none';
  document.querySelector('.upcoming-btn').style.display = 'none';
  document.querySelector('.missed-section').style.display = 'none';
  document.querySelector('.appointments-section').style.display = 'none';
  document.querySelector('.pending-section').style.display = 'none';
  document.getElementById('upcoming-section').style.display = 'none';
  document.querySelector('.history-btn').style.display = 'none'; // إخفاء زر سجل المواعيد
  document.querySelector('.button-container').style.display = 'none'; // إخفاء حاوية الأزرار
  document.getElementById('history-section').style.display = 'none'; // إخفاء قسم سجل المواعيد
    document.querySelector('.floating-btn').style.display = 'none';
};	

// إخفاء واجهة إضافة موعد جديد
window.cancelAddAppointment = function() {
  document.getElementById('add-appointment-section').style.display = 'none';
  document.querySelector('.header').style.display = 'flex';
  document.querySelector('.upcoming-btn').style.display = 'block';
  document.querySelector('.missed-section').style.display = 'block';
  document.querySelector('.appointments-section').style.display = 'block';
  document.querySelector('.pending-section').style.display = 'block';
  document.querySelector('.history-btn').style.display = 'block'; // إعادة عرض زر سجل المواعيد
  document.querySelector('.button-container').style.display = 'flex'; // إعادة عرض حاوية الأزرار
    document.querySelector('.floating-btn').style.display = 'block';
}
window.saveAppointment = async function() {
    // ✅ استعادة بيانات المستخدم في حالة عدم وجودها
    if (!currentUser.id) {
        const storedUser = JSON.parse(localStorage.getItem("currentUser"));
        if (storedUser) {
            currentUser = storedUser;
            console.log("✅ استعادة بيانات المستخدم قبل حفظ الموعد:", currentUser);
        }
    }

    if (!currentUser.id) {
        console.error("❌ لا يوجد معرف مستخدم، لا يمكن حفظ الموعد!");
        alert("حدث خطأ، يرجى إعادة تسجيل الدخول.");
        return;
    }

    const clientName = document.getElementById('client-name').value;
    const appointmentTime = document.getElementById('appointment-time').value;
    const appointmentDate = document.getElementById('appointment-date').value;
    const phone = document.getElementById('phone').value;
    const altPhone = document.getElementById('alt-phone').value;
    const address = document.getElementById('address').value;
    const issue = document.getElementById('issue').value;
    const deviceType = document.getElementById('device-type').value;
    const deviceName = document.getElementById('device-name').value;
    const notes = document.getElementById('notes').value;
    const noDateCheckbox = document.getElementById('no-date-checkbox').checked;

    const newAppointment = {
        id: Date.now().toString(),
        clientName,
        time: noDateCheckbox ? null : appointmentTime,
        date: noDateCheckbox ? null : appointmentDate,
        phone,
        altPhone,
        address,
        issue,
        deviceType,
        deviceName,
        notes,
        status: noDateCheckbox ? "بانتظار تحديد موعد" : "قيد الانتظار",
        addedBy: currentUser.name || "غير متوفر",
        userId: currentUser.id
    };

    if (!clientName || !phone || !issue) {
        alert('الرجاء ملء الحقول الإلزامية: الاسم، الهاتف، المشكلة');
        return;
    }

    if (!noDateCheckbox) {
        const currentDate = new Date();
        const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
        if (appointmentDateTime < currentDate) {
            alert("التاريخ قديم! يرجى تعديل التاريخ أو الوقت.");
            return;
        }
    }

    try {
        if (navigator.onLine) {
            const docRef = await addDoc(collection(firestore, "appointments"), newAppointment);
            newAppointment.firebaseId = docRef.id;
        } else {
            console.log("🚀 الموعد تم تخزينه محليًا وسيتم رفعه لاحقًا.");
        }
    } catch (error) {
        console.error("خطأ أثناء حفظ الموعد في Firebase:", error);
    }

    let localAppointments = JSON.parse(localStorage.getItem(`appointments_${currentUser.id}`)) || [];

    // ✅ التأكد من أن الموعد غير مكرر في التخزين المحلي
    if (!localAppointments.some(app => app.id === newAppointment.id)) {
        localAppointments.push(newAppointment);
        localStorage.setItem(`appointments_${currentUser.id}`, JSON.stringify(localAppointments));
    }

    console.log("✅ تم حفظ الموعد بنجاح:", newAppointment);
    loadAppointments();
    cancelAddAppointment();
};



// نقل المواعيد من "المواعيد القادمة" إلى "مواعيد اليوم" عند حلول تاريخها
window.moveUpcomingToToday = function() {
  const currentDate = new Date();
  appointments = appointments.map(appointment => {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    if (appointmentDateTime.toDateString() === currentDate.toDateString() && appointment.status === "قيد الانتظار") {
      appointment.status = "مواعيد اليوم";
    }
    return appointment;
  });
  localStorage.setItem('appointments', JSON.stringify(appointments));
};


// جلب المواعيد من الخادم
window.fetchAppointmentsFromServer = async function() {
  try {
    // جلب المواعيد الحالية من Firebase
    const appointmentsQuery = query(
      collection(firestore, "appointments"),
      where("userId", "==", currentUser.id)
    );
    const appointmentsSnapshot = await getDocs(appointmentsQuery);
    const appointmentsList = appointmentsSnapshot.docs.map(doc => ({
      firebaseId: doc.id,
      ...doc.data()
    }));

    // حفظ المواعيد في localStorage
    localStorage.setItem(`appointments_${currentUser.id}`, JSON.stringify(appointmentsList));

    // عرض المواعيد
    displayAppointments(appointmentsList);
  } catch (error) {
    console.error("حدث خطأ أثناء جلب المواعيد من Firebase:", error);
    alert("خطأ في جلب البيانات: " + error.message);
  }
};

window.displayAppointments = function(appointments) {
  const todayTableBody = document.querySelector('#today-appointments tbody');
  const missedTableBody = document.querySelector('#missed-appointments tbody');
  const upcomingTableBody = document.querySelector('#upcoming-appointments tbody');
  const pendingTableBody = document.querySelector('#pending-users tbody');

  // تفريغ الجداول
  todayTableBody.innerHTML = "";
  missedTableBody.innerHTML = "";
  upcomingTableBody.innerHTML = "";
  pendingTableBody.innerHTML = "";

  const currentDate = new Date();

  appointments.forEach((appointment, index) => {
    // تجاهل المواعيد التي لا تخص المستخدم الحالي
    if (appointment.userId !== currentUser.id) return;

    const appointmentDateTime = appointment.date ? new Date(`${appointment.date}T${appointment.time}`) : null;
    const isPending = appointment.status === "بانتظار تحديد موعد";
    const isToday = appointmentDateTime && appointmentDateTime.toDateString() === currentDate.toDateString();
    const isUpcoming = appointmentDateTime && appointmentDateTime > currentDate;
    const isMissed = (appointmentDateTime && appointmentDateTime < currentDate) || appointment.status === "فات موعده";

    let rowHTML = `
      <tr>
        <td>${index + 1}</td>
        <td>${appointment.clientName}</td>
        <td>${appointment.time || '-'}</td>
        ${isToday ? '' : `<td>${appointment.date || '-'}</td>`} <!-- إخفاء التاريخ في جدول مواعيد اليوم -->
        <td><button onclick="makeCall('${appointment.phone}')">${appointment.phone}</button></td>
        <td><button onclick="makeCall('${appointment.altPhone}')">${appointment.altPhone}</button></td>
        <td>${appointment.address}</td>
        <td>${appointment.issue}</td>
        <td>${appointment.deviceType}</td>
        <td>${appointment.deviceName}</td>
        <td>${appointment.notes}</td>
        <td>
          <select onchange="handleActionChange(this, '${appointment.id}')">
            <option value="">اختر إجراء</option>
            <option value="completed">مكتمل</option>
            <option value="workshop">سحب للورشة</option>
            <option value="cancelled">ملغي</option>
            <option value="postponed">تأجيل</option>
          </select>
        </td>
      </tr>
    `;

    if (isPending) {
      pendingTableBody.innerHTML += rowHTML;
    } else if (isToday) {
      todayTableBody.innerHTML += rowHTML;
    } else if (isMissed) {
      missedTableBody.innerHTML += rowHTML;
    } else if (isUpcoming) {
            upcomingTableBody.innerHTML += rowHTML; // ✅ تأكد من إضافة المواعيد المستقبلية إلى الجدول
    }
  });
}




// إظهار المواعيد القادمة
window.showUpcomingAppointments = function() {
  console.log("تم استدعاء showUpcomingAppointments");
  document.getElementById('upcoming-section').style.display = 'block';
  document.querySelector('.header').style.display = 'none';
  document.querySelector('.upcoming-btn').style.display = 'none';
  document.querySelector('.missed-section').style.display = 'none';
  document.querySelector('.history-btn').style.display = 'none'; // إخفاء زر سجل المواعيد
  document.querySelector('.appointments-section').style.display = 'none';
  document.querySelector('.pending-section').style.display = 'none';
  document.getElementById('add-appointment-section').style.display = 'none';
  document.getElementById('history-section').style.display = 'none'; // إخفاء قسم سجل المواعيد
  document.querySelector('.button-container').style.display = 'none'; // إخفاء حاوية الأزرار
  filterUpcomingAppointments();
  if (checkInternetConnection()) {
      document.getElementById('upcoming-section').style.display = 'block';
      document.querySelector('.header').style.display = 'none';
      document.querySelector('.upcoming-btn').style.display = 'none';
      document.querySelector('.missed-section').style.display = 'none';
      document.querySelector('.history-btn').style.display = 'none';
      document.querySelector('.appointments-section').style.display = 'none';
      document.querySelector('.pending-section').style.display = 'none';
      document.getElementById('add-appointment-section').style.display = 'none';
      document.getElementById('history-section').style.display = 'none';
      document.querySelector('.button-container').style.display = 'none';
      filterUpcomingAppointments();
  } else {
      showConnectionMessage();
  }
};



// تغيير طريقة الفلترة
window.changeFilterMethod = function() {
  const filterMethod = document.getElementById('filter-method').value;
  const dateFilter = document.getElementById('date-filter');
  const nameFilter = document.getElementById('name-filter');

  if (filterMethod === 'date') {
    dateFilter.style.display = 'block';
    nameFilter.style.display = 'none';
  } else {
    dateFilter.style.display = 'none';
    nameFilter.style.display = 'block';
  }

  filterUpcomingAppointments();
}

// فلترة المواعيد القادمة
window.filterUpcomingAppointments = function() {
  const filterMethod = document.getElementById('filter-method').value;
  const filterDate = document.getElementById('filter-date').value;
  const searchInput = document.getElementById('search-input').value.toLowerCase();
  const upcomingTableBody = document.querySelector('#upcoming-appointments tbody');
  upcomingTableBody.innerHTML = "";

  appointments.forEach((appointment, index) => {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    const matchesFilter = filterMethod === 'date'
      ? (!filterDate || appointment.date === filterDate)
       : (appointment.clientName.toLowerCase().includes(searchInput) || 
       appointment.phone.includes(searchInput)); // إصلاح هنا

    if (appointmentDateTime > new Date() && matchesFilter) {
      upcomingTableBody.innerHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${appointment.clientName}</td>
          <td>${appointment.time}</td>
          <td>${appointment.date}</td>
          <td><button onclick="makeCall('${appointment.phone}')">${appointment.phone}</button></td>
          <td><button onclick="makeCall('${appointment.altPhone}')">${appointment.altPhone}</button></td>
          <td>${appointment.address}</td>
          <td>${appointment.issue}</td>
          <td>${appointment.deviceType}</td>
          <td>${appointment.deviceName}</td>
          <td>${appointment.notes}</td>
          <td>
            <select onchange="handleActionChange(this, ${appointment.id})">
              <option value="">اختر إجراء</option>
              <option value="completed">مكتمل</option>
              <option value="workshop">سحب للورشة</option>
              <option value="cancelled">ملغي</option>
            </select>
          </td>
        </tr>
      `;
    }
  });
}

// تغيير طريقة الفلترة في سجل المواعيد
window.changeHistoryFilterMethod = function() {
  const filterMethod = document.getElementById('history-filter-method').value;
  const dateFilter = document.getElementById('history-date-filter');
  const nameFilter = document.getElementById('history-name-filter');

  if (filterMethod === 'date') {
    dateFilter.style.display = 'block';
    nameFilter.style.display = 'none';
  } else {
    dateFilter.style.display = 'none';
    nameFilter.style.display = 'block';
  }

  filterHistoryAppointments();
}

// فلترة المواعيد في سجل المواعيد
window.filterHistoryAppointments = function() {
  if (!currentUser.id) {
    console.error("❌ خطأ: لا يوجد مستخدم مسجّل دخول");
    return;
  }

  const filterDate = document.getElementById('history-filter-date').value;
  const filterText = document.getElementById('history-search-input').value.toLowerCase();

  // ✅ جلب سجل المواعيد الأصلي
  let historyAppointments = JSON.parse(localStorage.getItem(`historyAppointments_${currentUser.id}`)) || [];
  
  console.log("📌 عدد المواعيد قبل الفلترة:", historyAppointments.length);

  // ✅ تطبيق الفلترة بالتاريخ
  if (filterDate) {
    historyAppointments = historyAppointments.filter(app => app.date === filterDate);
  }

  // ✅ تطبيق الفلترة بالاسم أو رقم الهاتف
  if (filterText) {
    historyAppointments = historyAppointments.filter(app => 
      (app.clientName && app.clientName.toLowerCase().includes(filterText)) ||
      (app.phone && app.phone.includes(filterText)) ||
      (app.altPhone && app.altPhone.includes(filterText))
    );
  }

  console.log("📌 عدد المواعيد بعد الفلترة:", historyAppointments.length);

  // ✅ تحديث الجدول مباشرة
  updateHistoryTable(historyAppointments);
};


// إظهار سجل المواعيد
window.showHistory = function() {
  console.log("📌 تم استدعاء showHistory");

  // ✅ تحميل المواعيد أولًا
  loadHistoryAppointments();

  // ✅ بعد تحميل البيانات، يتم إظهار الجدول
  setTimeout(() => {
    document.getElementById('history-section').style.display = 'block';
  }, 300);
  
  // ✅ إخفاء الأقسام الأخرى إذا لزم الأمر
  document.getElementById('upcoming-section').style.display = 'none';
  document.querySelector('.header').style.display = 'none';
  document.querySelector('.missed-section').style.display = 'none';
  document.querySelector('.appointments-section').style.display = 'none';
  document.querySelector('.pending-section').style.display = 'none';
  document.querySelector('.button-container').style.display = 'none';
};



// متغير لتتبع الصفحة الحالية
let currentSection = "main"; // القسم الرئيسي افتراضيًا

// وظيفة للتحكم في سلوك زر الرجوع
function handleBackButton() {
  if (currentSection !== "main") {
    // إذا كان المستخدم ليس في الصفحة الرئيسية، ارجع إلى المحتوى الرئيسي
    showMainContent();
    currentSection = "main"; // تحديث المتغير ليعكس الصفحة الحالية
  } else {
    // إذا كان المستخدم في الصفحة الرئيسية، اخرج من القسم
    window.history.back(); // العودة إلى الصفحة السابقة
  }
}

// إضافة مستمع لحدث زر الرجوع في الهاتف
window.addEventListener("popstate", function (event) {
  handleBackButton();
});

// إظهار المحتوى الرئيسي
window.showMainContent = function() {
  document.getElementById('upcoming-section').style.display = 'none';
  document.getElementById('history-section').style.display = 'none';
  document.getElementById('add-appointment-section').style.display = 'none';
  document.querySelector('.header').style.display = 'flex';
  document.querySelector('.button-container').style.display = 'flex';
  document.querySelector('.missed-section').style.display = 'block';
  document.querySelector('.appointments-section').style.display = 'block';
  document.querySelector('.pending-section').style.display = 'block';
  currentSection = "main"; // تحديث المتغير ليعكس الصفحة الحالية
}





// دالة للتحقق من الاتصال بالإنترنت
window.checkInternetConnection = function() {
    return navigator.onLine; // تُرجع true إذا كان هناك اتصال بالإنترنت، و false إذا لم يكن هناك اتصال
}

window.showConnectionMessage = function() {	
    const connectionMessage = document.getElementById('connectionMessage');
    if (connectionMessage) {
        connectionMessage.style.display = 'block';
    }
}

let currentAppointmentId = null; // لتخزين الموعد الحالي الذي يتم التعامل معه

// دالة لفتح النافذة المنبثقة
window.openModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'block';
  }
};

// دالة لإغلاق النافذة المنبثقة
window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
};

// دالة لإضافة قطعة غيار
window.addSparePart = function() {
  const container = document.getElementById('sparePartsContainer');
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'sparePart';
  input.placeholder = 'اسم قطعة الغيار';
  container.appendChild(input);
}

// دالة لحفظ الموعد المكتمل
window.saveCompletedAppointment = async function() {
  if (!currentAppointmentId) {
    alert("❌ لم يتم تحديد موعد!");
    return;
  }

  const maintenanceDetails = document.getElementById('maintenanceDetails').value;
  const price = document.getElementById('price').value;
  const actualDateTime = document.getElementById('actualDateTime').value;
  const spareParts = Array.from(document.querySelectorAll('.sparePart')).map(input => input.value);

  let appointments = JSON.parse(localStorage.getItem(`appointments_${currentUser.id}`)) || [];
  let historyAppointments = JSON.parse(localStorage.getItem(`historyAppointments_${currentUser.id}`)) || [];

  const appointmentIndex = appointments.findIndex(app => app.id === currentAppointmentId);
  if (appointmentIndex === -1) {
    alert("❌ لم يتم العثور على الموعد!");
    return;
  }

  const appointment = appointments[appointmentIndex];
  appointment.action = 'مكتمل';
  appointment.maintenanceDetails = maintenanceDetails;
  appointment.price = price;
  appointment.actualDateTime = actualDateTime;
  appointment.spareParts = spareParts;

  // **حفظ الموعد في سجل المواعيد قبل حذفه من Firebase**
  historyAppointments.push(appointment);
  localStorage.setItem(`historyAppointments_${currentUser.id}`, JSON.stringify(historyAppointments));

  // **إزالة الموعد من القائمة الأساسية**
  appointments.splice(appointmentIndex, 1);
  localStorage.setItem(`appointments_${currentUser.id}`, JSON.stringify(appointments));

  // **حذف الموعد من Firebase بعد حفظه محليًا**
  if (appointment.firebaseId) {
    try {
      await deleteDoc(doc(firestore, "appointments", appointment.firebaseId));
    } catch (error) {
      console.error("❌ خطأ أثناء حذف الموعد من Firebase:", error);
    }
  }

  // **تحديث الواجهة**
  loadAppointments();
  loadHistoryAppointments();
  closeModal('completeModal');
};


// دالة لحفظ الموعد المسحوب للورشة
window.saveWorkshopAppointment = async function() {
  if (!currentAppointmentId) {
    alert("❌ لم يتم تحديد موعد!");
    return;
  }

  const workshopNotes = document.getElementById('workshopNotes').value;

  let appointments = JSON.parse(localStorage.getItem(`appointments_${currentUser.id}`)) || [];
  let historyAppointments = JSON.parse(localStorage.getItem(`historyAppointments_${currentUser.id}`)) || [];

  const appointmentIndex = appointments.findIndex(app => app.id === currentAppointmentId);
  if (appointmentIndex === -1) {
    alert("❌ لم يتم العثور على الموعد!");
    return;
  }

  const appointment = appointments[appointmentIndex];
  appointment.action = 'سحب للورشة';
  appointment.workshopNotes = workshopNotes;

  // **حفظ الموعد في سجل المواعيد قبل حذفه من Firebase**
  historyAppointments.push(appointment);
  localStorage.setItem(`historyAppointments_${currentUser.id}`, JSON.stringify(historyAppointments));

  // **إزالة الموعد من القائمة الأساسية**
  appointments.splice(appointmentIndex, 1);
  localStorage.setItem(`appointments_${currentUser.id}`, JSON.stringify(appointments));

  // **حذف الموعد من Firebase بعد الحفظ المحلي**
  if (appointment.firebaseId) {
    try {
      await deleteDoc(doc(firestore, "appointments", appointment.firebaseId));
    } catch (error) {
      console.error("❌ خطأ أثناء حذف الموعد من Firebase:", error);
    }
  }

  // **تحديث الواجهة**
  loadAppointments();
  loadHistoryAppointments();
  closeModal('workshopModal');
};


// دالة لحفظ الموعد الملغي
window.saveCancelledAppointment = function() {
  const cancelReason = document.getElementById('cancelReason').value;

  const appointment = appointments.find(app => app.id === currentAppointmentId);
  if (appointment) {
    appointment.action = 'ملغي';
    appointment.cancelReason = cancelReason;
    moveToHistory(appointment.id, 'ملغي');
  }

  closeModal('cancelModal');
};


// دالة لحفظ الموعد المؤجل
window.savePostponedAppointment = async function() {
  const newAppointmentDate = document.getElementById('newAppointmentDate').value;
  const newAppointmentTime = document.getElementById('newAppointmentTime').value;

  const appointmentIndex = appointments.findIndex(app => app.id === currentAppointmentId);
  if (appointmentIndex === -1) return;

  const appointment = appointments[appointmentIndex];

  const currentDate = new Date();
  const newDateTime = new Date(`${newAppointmentDate}T${newAppointmentTime}`);

  if (newDateTime < currentDate) {
    alert("لا يمكن تأجيل الموعد إلى وقت ماضي!");
    return;
  }

  appointment.date = newAppointmentDate;
  appointment.time = newAppointmentTime;
  appointment.status = "قيد الانتظار";

  try {
    if (appointment.firebaseId) {
      const appointmentDocRef = doc(firestore, "appointments", appointment.firebaseId);
      await updateDoc(appointmentDocRef, {
        date: newAppointmentDate,
        time: newAppointmentTime,
        status: "قيد الانتظار"
      });
    }

    localStorage.setItem('appointments', JSON.stringify(appointments));

    loadAppointments();
    closeModal('postponeModal');
  } catch (error) {
    console.error("حدث خطأ أثناء تحديث الموعد:", error);
  }
};


// تعديل الأزرار في الجداول
window.handleActionChange = function(selectElement, appointmentId) {
  const action = selectElement.value;
  currentAppointmentId = appointmentId; // تأكيد تعيين الموعد الحالي

  switch (action) {
    case "completed":
      openModal('completeModal', appointmentId);
      break;
    case "workshop":
      openModal('workshopModal', appointmentId);
      break;
    case "cancelled":
      openModal('cancelModal', appointmentId);
      break;
    case "postponed":
      openModal('postponeModal', appointmentId);
      break;
    default:
      alert("يرجى اختيار إجراء صالح.");
  }
};








// دالة لفتح تطبيق الاتصال بالهاتف
window.makeCall = function(phoneNumber) {
    if (phoneNumber) {
        window.open(`tel:${phoneNumber}`); // فتح تطبيق الاتصال بالهاتف
    } else {
        alert("رقم الهاتف غير متوفر.");
    }
}

// مستمع لحدث input على حقل رقم الهاتف
document.getElementById('phone').addEventListener('input', function() {
  const phoneNumber = this.value.trim(); // الحصول على رقم الهاتف المدخل
  const appointments = JSON.parse(localStorage.getItem('appointments')) || []; // تحميل المواعيد الحالية
  const historyAppointments = JSON.parse(localStorage.getItem('historyAppointments')) || []; // تحميل سجل المواعيد

  // البحث عن موعد سابق بنفس رقم الهاتف في المواعيد الحالية
  let previousAppointment = appointments.find(app => app.phone === phoneNumber);

  // إذا لم يتم العثور على الموعد في المواعيد الحالية، نبحث في سجل المواعيد
  if (!previousAppointment) {
    previousAppointment = historyAppointments.find(app => app.phone === phoneNumber);
  }

  if (previousAppointment) {
    // إذا تم العثور على موعد سابق، يتم ملء الحقول تلقائيًا فقط إذا كانت فارغة
    if (!document.getElementById('client-name').value) {
      document.getElementById('client-name').value = previousAppointment.clientName;
    }
    if (!document.getElementById('alt-phone').value) {
      document.getElementById('alt-phone').value = previousAppointment.altPhone;
    }
    if (!document.getElementById('address').value) {
      document.getElementById('address').value = previousAppointment.address;
    }
    if (!document.getElementById('issue').value) {
      document.getElementById('issue').value = previousAppointment.issue;
    }
    if (!document.getElementById('device-type').value) {
      document.getElementById('device-type').value = previousAppointment.deviceType;
    }
    if (!document.getElementById('device-name').value) {
      document.getElementById('device-name').value = previousAppointment.deviceName;
    }

    // الملاحظات لا يتم ملؤها تلقائيًا أبدًا
    document.getElementById('notes').value = '';
  }
});

//لاخفاء حقل الوقت والتاريخ
window.toggleDateTimeFields = function() {
  const noDateCheckbox = document.getElementById('no-date-checkbox');
  const timeField = document.getElementById('appointment-time');
  const dateField = document.getElementById('appointment-date');

  if (noDateCheckbox.checked) {
    timeField.disabled = true;
    dateField.disabled = true;
  } else {
    timeField.disabled = false;
    dateField.disabled = false;
  }
}


// تحميل المواعيد
window.loadAppointments = async function() {
  try {
    let userAppointments = JSON.parse(localStorage.getItem(`appointments_${currentUser.id}`)) || [];

    if (navigator.onLine) {
      const appointmentsQuery = query(
        collection(firestore, "appointments"),
        where("userId", "==", currentUser.id)
      );
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      userAppointments = appointmentsSnapshot.docs.map(doc => ({
        firebaseId: doc.id,
        ...doc.data()
      }));

      localStorage.setItem(`appointments_${currentUser.id}`, JSON.stringify(userAppointments));
    } else {
      console.warn("⚠️ لا يوجد اتصال بالإنترنت، يتم تحميل المواعيد من التخزين المحلي...");
    }

    console.log("📌 المواعيد التي تم تحميلها:", userAppointments);
    appointments = userAppointments;
    displayAppointments(appointments);

  } catch (error) {
    console.error("❌ خطأ أثناء تحميل المواعيد:", error);
  }
};



// إرسال المواعيد إلى Firebase عند الاتصال بالإنترنت
window.syncAppointmentsToFirebase = async function() {
  if (!currentUser.id) {
    console.error("❌ لا يوجد معرف مستخدم، لا يمكن مزامنة المواعيد!");
    return;
  }

  const localAppointments = JSON.parse(localStorage.getItem(`appointments_${currentUser.id}`)) || [];

  if (localAppointments.length === 0) {
    console.log("✅ لا توجد مواعيد غير متزامنة.");
    return;
  }

  try {
    const batch = writeBatch(firestore);
    const appointmentsRef = collection(firestore, "appointments");

    // جلب المواعيد الحالية من Firestore
    const serverSnapshot = await getDocs(query(appointmentsRef, where("userId", "==", currentUser.id)));
    const serverAppointments = serverSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // مقارنة البيانات لمنع التكرار
    localAppointments.forEach(localApp => {
      const isDuplicate = serverAppointments.some(serverApp => serverApp.id === localApp.id);

      if (!isDuplicate && !localApp.firebaseId) {
        const docRef = doc(appointmentsRef);
        batch.set(docRef, { ...localApp, userId: currentUser.id });
        localApp.firebaseId = docRef.id;
      }
    });

    await batch.commit();

    localStorage.setItem(`appointments_${currentUser.id}`, JSON.stringify(localAppointments));
    console.log("✅ تم مزامنة المواعيد مع Firebase بنجاح!");
  } catch (error) {
    console.error("❌ حدث خطأ أثناء المزامنة:", error);
  }
};



async function reloadAppointments() {
  await fetchAppointmentsFromServer(); // جلب البيانات مجددًا
  displayAppointments(appointments);   // إعادة عرض البيانات
}

// ✅ عند تحميل الصفحة، استعادة الجلسة إذا لم يكن هناك إنترنت
window.addEventListener("load", async () => {
  console.log("✅ تم تحميل الصفحة، في انتظار تسجيل الدخول...");

  if (!navigator.onLine) {
    console.warn("⚠️ لا يوجد اتصال بالإنترنت، يتم استعادة الجلسة...");
    restoreSession();
    return;
  }

  // ✅ استعادة بيانات المستخدم من التخزين المحلي
  let storedUser = JSON.parse(localStorage.getItem("currentUser"));
  if (storedUser && storedUser.id) {
    currentUser = storedUser;
    console.log("✅ تم استعادة بيانات المستخدم من `localStorage`:", currentUser);
  } else {
    console.warn("⚠️ لم يتم العثور على بيانات المستخدم محليًا.");
    currentUser = { id: null, name: "مستخدم مجهول" };
  }

  // ✅ استعادة المواعيد من التخزين المحلي
  let cachedAppointments = JSON.parse(localStorage.getItem(`appointments_${currentUser.id}`)) || [];
  if (cachedAppointments.length > 0) {
    console.log("📌 عرض المواعيد من التخزين المحلي:", cachedAppointments);
    displayAppointments(cachedAppointments);
  } else {
    console.warn("⚠️ لا توجد مواعيد في التخزين المحلي!");
  }

  // ✅ متابعة تسجيل الدخول قبل تحميل المواعيد من Firestore
  const waitForUserLogin = new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("✅ المستخدم مسجّل دخول:", user.uid);
        currentUser = { id: user.uid, name: user.displayName || "مستخدم مجهول" };
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        resolve(user);
      } else {
        console.warn("⚠️ لا يوجد مستخدم مسجّل دخول، سيتم استخدام التخزين المحلي فقط.");
        resolve(null);
      }
    });
  });

  await waitForUserLogin;

  // ✅ تحميل المواعيد من Firebase إذا كان هناك اتصال بالإنترنت
  if (navigator.onLine) {
    console.log("🌍 لديك اتصال بالإنترنت، سيتم تحميل المواعيد من Firebase...");
    await loadAppointments();
  } else {
    console.warn("⚠️ لا يوجد اتصال بالإنترنت، ستظل المواعيد المحلية معروضة.");
  }
});

// ✅ الاستماع لتغيرات الاتصال بالإنترنت وإعادة فحص المصادقة عند عودة الاتصال
window.addEventListener("online", async () => {
  console.log("🌍 تمت استعادة الاتصال بالإنترنت، جاري مزامنة المواعيد...");
  
  // ✅ التحقق مما إذا كان هناك مستخدم حالي أم لا
  const storedUser = JSON.parse(localStorage.getItem("currentUser"));
  if (storedUser && storedUser.id) {
    console.log("✅ المستخدم لا يزال مسجّل دخول، إعادة تحميل المواعيد...");
    await syncAppointmentsToFirebase();
    await loadAppointments();
  } else {
    console.warn("⚠️ لا يوجد مستخدم مخزن محليًا، انتظار Firebase لإعادة التحقق من الجلسة.");
    
    // ✅ انتظار إعادة فحص المصادقة بعد استعادة الاتصال
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("✅ تم استعادة تسجيل الدخول تلقائيًا:", user.uid);
        currentUser = { id: user.uid, name: user.displayName || "مستخدم مجهول" };
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        await syncAppointmentsToFirebase();
        await loadAppointments();
      } else {
        console.warn("❌ لم يتم استعادة الجلسة تلقائيًا، يتطلب تسجيل الدخول يدويًا.");
      }
    });
  }
});

// ✅ عند فقدان الاتصال، استخدام البيانات المحلية دون مسح الجلسة
window.addEventListener("offline", () => {
  console.warn("⚠️ تم فقدان الاتصال بالإنترنت، سيتم عرض البيانات من التخزين المحلي فقط.");
});





function updateHistoryTable(filteredAppointments) {
  const historyTableBody = document.querySelector('#history-appointments tbody');
  
  if (!historyTableBody) {
    console.error("❌ خطأ: لم يتم العثور على `tbody` داخل جدول سجل المواعيد");
    return;
  }

  historyTableBody.innerHTML = ""; // ✅ تفريغ الجدول

  if (filteredAppointments.length === 0) {
    historyTableBody.innerHTML = `<tr><td colspan="12" style="text-align:center;">لا توجد مواعيد مطابقة</td></tr>`;
  } else {
    filteredAppointments.forEach((appointment, index) => {
      console.log(`📌 عرض موعد مفلتر:`, appointment);
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${appointment.clientName || '-'}</td>
        <td>${appointment.time || '-'}</td>
        <td>${appointment.date || '-'}</td>
        <td>${appointment.phone || '-'}</td>
        <td>${appointment.altPhone || '-'}</td>
        <td>${appointment.address || '-'}</td>
        <td>${appointment.issue || '-'}</td>
        <td>${appointment.deviceType || '-'}</td>
        <td>${appointment.deviceName || '-'}</td>
        <td>${appointment.notes || '-'}</td>
        <td>${appointment.action || '-'}</td>
      `;
      row.onclick = () => showAppointmentDetails(appointment.id);
      historyTableBody.appendChild(row);
    });
  }

  console.log("✅ تم تحديث جدول سجل المواعيد بالنتائج المفلترة.");
}
