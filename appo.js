// عرض تاريخ اليوم
document.getElementById('current-date').innerText = new Date().toLocaleDateString('ar-EG');


// تحميل المواعيد الفائتة
function loadMissedAppointments() {
  const currentTime = new Date();
  const appointments = [
    {
      id: 1,
      appointmentNumber: "1001",
      clientName: "أحمد علي",
      time: "10:00",
      date: "2025-01-10",
      phone: "01012345678",
      altPhone: "01198765432",
      address: "القاهرة، مصر",
      issue: "الجهاز لا يعمل",
      deviceType: "ثلاجة",
      deviceName: "LG 450L",
      status: "قيد الانتظار"
    }
    // المزيد من المواعيد
  ];

  const missedTableBody = document.querySelector('#missed-appointments tbody');
  missedTableBody.innerHTML = "";

  appointments.forEach((appointment, index) => {
    const appointmentDate = new Date(`${appointment.date}T${appointment.time}`);
    if (appointmentDate < currentTime && appointment.status !== "ملغي") {
      missedTableBody.innerHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${appointment.appointmentNumber}</td>
          <td>${appointment.clientName}</td>
          <td>${appointment.time}</td>
          <td>${appointment.date}</td>
          <td>
            <a href="tel:${appointment.phone}">${appointment.phone}</a>
          </td>
          <td>
            <a href="tel:${appointment.altPhone}">${appointment.altPhone}</a>
          </td>
          <td>${appointment.address}</td>
          <td>${appointment.issue}</td>
          <td>${appointment.deviceType}</td>
          <td>${appointment.deviceName}</td>
          <td>
            <button onclick="rescheduleAppointment(${appointment.id})">إعادة جدولة</button>
            <button onclick="cancelAppointment(${appointment.id})">إلغاء</button>
          </td>
        </tr>
      `;
    }
  });
}


// إعادة جدولة موعد
function rescheduleAppointment(appointmentId) {
  alert(`إعادة جدولة الموعد ID: ${appointmentId}`);
}

// إلغاء موعد
function cancelAppointment(appointmentId) {
  alert(`إلغاء الموعد ID: ${appointmentId}`);
}

// استدعاء الدالة عند فتح الصفحة
loadMissedAppointments();

// بيانات مواعيد اليوم (كمثال)
const todayAppointments = [
  {
    id: 1,
    appointmentNumber: "12345",
    clientName: "أحمد علي",
    appointmentTime: "10:00 صباحًا",
    phone: "01012345678",
    altPhone: "01198765432",
    address: "شارع النصر، القاهرة",
    issue: "تسريب ماء",
    deviceType: "ثلاجة",
    deviceName: "سامسونج"
  },
  {
    id: 2,
    appointmentNumber: "12346",
    clientName: "منى حسن",
    appointmentTime: "12:30 مساءً",
    phone: "01234567890",
    altPhone: "01087654321",
    address: "شارع الجامعة، الجيزة",
    issue: "لا يعمل",
    deviceType: "غسالة",
    deviceName: "LG"
  }
];

// تحميل مواعيد اليوم إلى الجدول
function loadTodayAppointments() {
  const tableBody = document.querySelector('#today-appointments tbody');
  tableBody.innerHTML = ""; // تفريغ الجدول قبل ملئه

  todayAppointments.forEach((appointment, index) => {
    const row = `
      <tr>
        <td>${index + 1}</td>
        <td>${appointment.appointmentNumber}</td>
        <td>${appointment.clientName}</td>
        <td>${appointment.appointmentTime}</td>
        <td><button onclick="makeCall('${appointment.phone}')">${appointment.phone}</button></td>
        <td><button onclick="makeCall('${appointment.altPhone}')">${appointment.altPhone}</button></td>
        <td>${appointment.address}</td>
        <td>${appointment.issue}</td>
        <td>${appointment.deviceType}</td>
        <td>${appointment.deviceName}</td>
        <td>
          <select onchange="handleActionChange(this, ${appointment.id})">
            <option value="">اختر إجراء</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغي</option>
            <option value="postponed">تأجيل</option>
          </select>
          <div class="action-options" id="action-options-${appointment.id}" style="display: none;">
            <!-- الخيارات الفرعية ستظهر هنا ديناميكيًا -->
          </div>
        </td>
      </tr>
    `;
    tableBody.innerHTML += row;
  });
}

// استدعاء الوظيفة عند تحميل الصفحة
loadTodayAppointments();

// وظيفة التعامل مع تغيير الإجراء
function handleActionChange(selectElement, appointmentId) {
  const action = selectElement.value;
  const optionsContainer = document.getElementById(`action-options-${appointmentId}`);
  
  optionsContainer.innerHTML = ""; // تفريغ الخيارات السابقة
  optionsContainer.style.display = "block"; // إظهار الحاوية

  if (action === "completed") {
    // خيارات مكتمل
    optionsContainer.innerHTML = `
      <button onclick="markAsWorkshop(${appointmentId})">سحب الجهاز إلى الورشة</button>
      <button onclick="markAsRepaired(${appointmentId})">تمت الصيانة</button>
    `;
  } else if (action === "cancelled") {
    // خيارات ملغي
    optionsContainer.innerHTML = `
      <input type="text" placeholder="سبب الإلغاء" id="cancel-reason-${appointmentId}">
      <button onclick="cancelAppointment(${appointmentId})">تأكيد الإلغاء</button>
    `;
  } else if (action === "postponed") {
    // خيارات تأجيل
    optionsContainer.innerHTML = `
      <input type="datetime-local" id="new-date-${appointmentId}">
      <button onclick="rescheduleAppointment(${appointmentId})">تحديد الموعد</button>
    `;
  } else {
    // إخفاء الحاوية عند عدم اختيار أي إجراء
    optionsContainer.style.display = "none";
  }
}

// وظائف إضافية (كمثال فقط)
function makeCall(phoneNumber) {
  alert(`إجراء اتصال على الرقم: ${phoneNumber}`);
}

function markAsWorkshop(appointmentId) {
  alert(`تم تحديد الموعد ID: ${appointmentId} كسحب إلى الورشة.`);
}

function markAsRepaired(appointmentId) {
  alert(`تم تحديد الموعد ID: ${appointmentId} كتمت الصيانة.`);
}

function cancelAppointment(appointmentId) {
  const reason = document.getElementById(`cancel-reason-${appointmentId}`).value;
  if (!reason) {
    alert("يرجى إدخال سبب الإلغاء.");
    return;
  }
  alert(`تم إلغاء الموعد ID: ${appointmentId} بسبب: ${reason}`);
}

function rescheduleAppointment(appointmentId) {
  const newDate = document.getElementById(`new-date-${appointmentId}`).value;
  if (!newDate) {
    alert("يرجى اختيار موعد جديد.");
    return;
  }
  alert(`تم تأجيل الموعد ID: ${appointmentId} إلى ${newDate}`);
}


// تحميل المستخدمين بانتظار تحديد موعد
function loadPendingUsers() {
  const pendingUsers = [
    {
      id: 1,
      name: "خالد مصطفى",
      phone: "01012345678",
      altPhone: "01112345678",
      address: "شارع النصر، القاهرة",
      issue: "تبريد لا يعمل",
      deviceType: "ثلاجة",
      deviceName: "سامسونج"
    },
    {
      id: 2,
      name: "نور محمود",
      phone: "01234567890",
      altPhone: "01098765432",
      address: "شارع الجامعة، الجيزة",
      issue: "صوت عالي",
      deviceType: "غسالة",
      deviceName: "LG"
    }
  ];

  const tableBody = document.querySelector('#pending-users tbody');
  tableBody.innerHTML = "";

  pendingUsers.forEach((user, index) => {
    tableBody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${user.name}</td>
        <td>
          <button onclick="makeCall('${user.phone}')">${user.phone}</button>
        </td>
        <td>
          <button onclick="makeCall('${user.altPhone}')">${user.altPhone}</button>
        </td>
        <td>${user.address}</td>
        <td>${user.issue}</td>
        <td>${user.deviceType}</td>
        <td>${user.deviceName}</td>
        <td><button onclick="assignAppointment(${user.id})">تحديد موعد</button></td>
      </tr>
    `;
  });
}

// إجراء اتصال
function makeCall(phoneNumber) {
  alert(`إجراء اتصال على الرقم: ${phoneNumber}`);
}

// تحديد موعد
function assignAppointment(userId) {
  alert(`تحديد موعد للمستخدم ID: ${userId}`);
}


// إضافة موعد جديد
function addNewAppointment() {
  alert("فتح نافذة إضافة موعد جديد");
}

// المواعيد القادمة
function showUpcomingAppointments() {
  alert("عرض المواعيد القادمة");
}

// تحميل البيانات عند فتح الصفحة
loadTodayAppointments();
loadPendingUsers();
