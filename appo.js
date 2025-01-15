// عرض تاريخ اليوم
document.getElementById('current-date').innerText = new Date().toLocaleDateString('ar-EG');

// تحميل المواعيد من localStorage// تحميل المواعيد من localStorage
let appointments = JSON.parse(localStorage.getItem('appointments')) || [];
let historyAppointments = JSON.parse(localStorage.getItem('historyAppointments')) || [];



// نقل الموعد إلى سجل المواعيد عند اتخاذ إجراء
function moveToHistory(appointmentId, action) {
  const appointmentIndex = appointments.findIndex(app => app.id === appointmentId);
  if (appointmentIndex !== -1) {
    const appointment = appointments[appointmentIndex];
    appointment.action = action; // الإجراء المتخذ (مكتمل، ملغي، مؤجل)
    historyAppointments.push(appointment);
    appointments.splice(appointmentIndex, 1); // إزالة الموعد من القائمة الرئيسية
    localStorage.setItem('appointments', JSON.stringify(appointments));
    localStorage.setItem('historyAppointments', JSON.stringify(historyAppointments));
    loadAppointments();
    loadHistoryAppointments();
  }
}

// تحميل سجل المواعيد
function loadHistoryAppointments() {
  const historyTableBody = document.querySelector('#history-appointments tbody');
  historyTableBody.innerHTML = "";

  historyAppointments.forEach((appointment, index) => {
    historyTableBody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${appointment.appointmentNumber}</td>
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
        <td>${appointment.action}</td>
      </tr>
    `;
  });
}

// إظهار سجل المواعيد
function showHistory() {
  document.getElementById('history-section').style.display = 'block';
  document.querySelector('.header').style.display = 'none';
  document.querySelector('.upcoming-btn').style.display = 'none';
  document.querySelector('.history-btn').style.display = 'none';
  document.querySelector('.missed-section').style.display = 'none';
  document.querySelector('.appointments-section').style.display = 'none';
  document.querySelector('.pending-section').style.display = 'none';
  document.getElementById('upcoming-section').style.display = 'none';
  loadHistoryAppointments();
}

// تحميل البيانات عند فتح الصفحة
moveUpcomingToToday();
loadAppointments();

// إظهار واجهة إضافة موعد جديد
function showAddAppointment() {
  document.getElementById('add-appointment-section').style.display = 'block';
  document.querySelector('.header').style.display = 'none';
  document.querySelector('.upcoming-btn').style.display = 'none';
  document.querySelector('.missed-section').style.display = 'none';
  document.querySelector('.appointments-section').style.display = 'none';
  document.querySelector('.pending-section').style.display = 'none';
  document.getElementById('upcoming-section').style.display = 'none';
    document.querySelector('.history-btn').style.display = 'none'; // إخفاء زر سجل المواعيد
}

// إخفاء واجهة إضافة موعد جديد
function cancelAddAppointment() {
  document.getElementById('add-appointment-section').style.display = 'none';
  document.querySelector('.header').style.display = 'flex';
  document.querySelector('.upcoming-btn').style.display = 'block';
  document.querySelector('.missed-section').style.display = 'block';
  document.querySelector('.appointments-section').style.display = 'block';
  document.querySelector('.pending-section').style.display = 'block';
  document.querySelector('.history-btn').style.display = 'block'; // إعادة عرض زر سجل المواعيد
}

// حفظ الموعد الجديد
function saveAppointment() {
  const appointmentNumber = document.getElementById('appointment-number').value;
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

  const newAppointment = {
    id: Date.now(),
    appointmentNumber,
    clientName,
    time: appointmentTime,
    date: appointmentDate,
    phone,
    altPhone,
    address,
    issue,
    deviceType,
    deviceName,
    notes,
    status: "قيد الانتظار"
  };

  // التحقق من تاريخ الموعد
  const currentDate = new Date();
  const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
  if (appointmentDateTime < currentDate) {
    alert("التاريخ قديم! يرجى تعديل التاريخ أو الوقت.");
    return;
  }

  // إضافة الموعد إلى القائمة
  appointments.push(newAppointment);
  localStorage.setItem('appointments', JSON.stringify(appointments));

  // تفريغ الحقول بعد الحفظ
  document.getElementById('add-appointment-form').reset();

  // إعادة تحميل الجداول
  loadAppointments();
  cancelAddAppointment();
}

// نقل المواعيد من "المواعيد القادمة" إلى "مواعيد اليوم" عند حلول تاريخها
function moveUpcomingToToday() {
  const currentDate = new Date();
  appointments = appointments.map(appointment => {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    if (appointmentDateTime.toDateString() === currentDate.toDateString() && appointment.status === "قيد الانتظار") {
      appointment.status = "مواعيد اليوم";
    }
    return appointment;
  });
  localStorage.setItem('appointments', JSON.stringify(appointments));
}


// تحميل المواعيد
function loadAppointments() {
  moveUpcomingToToday(); // تحقق من المواعيد القادمة ونقلها إلى "مواعيد اليوم" إذا لزم الأمر

  const currentDate = new Date();
  const todayTableBody = document.querySelector('#today-appointments tbody');
  const missedTableBody = document.querySelector('#missed-appointments tbody');
  const upcomingTableBody = document.querySelector('#upcoming-appointments tbody');

  todayTableBody.innerHTML = "";
  missedTableBody.innerHTML = "";
  upcomingTableBody.innerHTML = "";

  appointments.forEach((appointment, index) => {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    
    // صف لجدول مواعيد اليوم (بدون حقل التاريخ)
    const todayRow = `
      <tr>
        <td>${index + 1}</td>
        <td>${appointment.appointmentNumber}</td>
        <td>${appointment.clientName}</td>
        <td>${appointment.time}</td>
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
            <option value="cancelled">ملغي</option>
            <option value="postponed">تأجيل</option>
          </select>
          <div class="action-options" id="action-options-${appointment.id}" style="display: none;">
            <!-- يتم ملء الخيارات الفرعية هنا ديناميكياً -->
          </div>
        </td>
      </tr>
    `;

    // صف لجدول المواعيد الفائتة (مع حقل التاريخ)
    const missedRow = `
      <tr>
        <td>${index + 1}</td>
        <td>${appointment.appointmentNumber}</td>
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
            <option value="cancelled">ملغي</option>
            <option value="postponed">تأجيل</option>
          </select>
          <div class="action-options" id="action-options-${appointment.id}" style="display: none;">
            <!-- يتم ملء الخيارات الفرعية هنا ديناميكياً -->
          </div>
        </td>
      </tr>
    `;

    // صف لجدول المواعيد القادمة (مع حقل التاريخ)
    const upcomingRow = `
      <tr>
        <td>${index + 1}</td>
        <td>${appointment.appointmentNumber}</td>
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
            <option value="cancelled">ملغي</option>
            <option value="postponed">تأجيل</option>
          </select>
          <div class="action-options" id="action-options-${appointment.id}" style="display: none;">
            <!-- يتم ملء الخيارات الفرعية هنا ديناميكياً -->
          </div>
        </td>
      </tr>
    `;

    // تحديد الجدول المناسب بناءً على تاريخ الموعد
    if (appointmentDateTime.toDateString() === currentDate.toDateString()) {
      todayTableBody.innerHTML += todayRow; // جدول مواعيد اليوم (بدون تاريخ)
    } else if (appointmentDateTime < currentDate) {
      missedTableBody.innerHTML += missedRow; // جدول المواعيد الفائتة (مع تاريخ)
    } else {
      upcomingTableBody.innerHTML += upcomingRow; // جدول المواعيد القادمة (مع تاريخ)
    }
  });
}

// إظهار المواعيد القادمة
function showUpcomingAppointments() {
  document.getElementById('upcoming-section').style.display = 'block';
  document.querySelector('.header').style.display = 'none';
  document.querySelector('.upcoming-btn').style.display = 'none';
  document.querySelector('.missed-section').style.display = 'none';
    document.querySelector('.history-btn').style.display = 'none'; // إخفاء زر سجل المواعيد
  document.querySelector('.appointments-section').style.display = 'none';
  document.querySelector('.pending-section').style.display = 'none';
  document.getElementById('add-appointment-section').style.display = 'none';
    document.getElementById('history-section').style.display = 'none'; // إخفاء قسم سجل المواعيد
  filterUpcomingAppointments();
}

// تحميل البيانات عند فتح الصفحة
loadAppointments();

// إظهار المحتوى الرئيسي
function showMainContent() {
  document.getElementById('upcoming-section').style.display = 'none';
  document.querySelector('.header').style.display = 'flex';
  document.querySelector('.upcoming-btn').style.display = 'block';
  document.querySelector('.missed-section').style.display = 'block';
  document.querySelector('.appointments-section').style.display = 'block';
  document.querySelector('.pending-section').style.display = 'block';
    document.querySelector('.history-btn').style.display = 'block'; // إعادة عرض زر سجل المواعيد

}

// تغيير طريقة الفلترة
function changeFilterMethod() {
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
function filterUpcomingAppointments() {
  const filterMethod = document.getElementById('filter-method').value;
  const filterDate = document.getElementById('filter-date').value;
  const searchInput = document.getElementById('search-input').value.toLowerCase();
  const upcomingTableBody = document.querySelector('#upcoming-appointments tbody');
  upcomingTableBody.innerHTML = "";

  appointments.forEach((appointment, index) => {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    const matchesFilter = filterMethod === 'date'
      ? (!filterDate || appointment.date === filterDate)
      : (appointment.clientName.toLowerCase().includes(searchInput) || appointment.appointmentNumber.includes(searchInput));

    if (appointmentDateTime > new Date() && matchesFilter) {
      upcomingTableBody.innerHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${appointment.appointmentNumber}</td>
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
              <option value="cancelled">ملغي</option>
              <option value="postponed">تأجيل</option>
            </select>
            <div class="action-options" id="action-options-${appointment.id}" style="display: none;">
              <!-- يتم ملء الخيارات الفرعية هنا ديناميكياً -->
            </div>
          </td>
        </tr>
      `;
    }
  });
}