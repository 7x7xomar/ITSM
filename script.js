// ====================================================
// 1. التهيئة والعناصر الأساسية (DOM Elements)
// ====================================================
// ربط عناصر نافذة تفاصيل التذكرة
const viewModal = document.getElementById("viewModal");
const closeViewModalBtn = document.getElementById("closeViewModalBtn");
const closeViewBtn = document.getElementById("closeViewBtn");

// ربط عناصر النافذة المنبثقة من الـ HTML
const ticketModal = document.getElementById("ticketModal");
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelBtn");

// متغير لتخزين ID التذكرة التي نعدلها (null إذا كانت جديدة)
let currentEditingTicketId = null;
// ربط عناصر النموذج والجدول
const ticketForm = document.getElementById("ticketForm");
const ticketsTableBody = document.getElementById("ticketsTableBody");

// ربط حقول البحث والتصفية
const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");

// مصفوفة البيانات الرئيسية لاستيعاب التذاكر
let tickets = [];

// ====================================================
// 2. الأحداث البدائية عند تحميل الصفحة (Initialization)
// ====================================================

// عند تحميل المستند بالكامل، نقوم بقراءة البيانات المخزنة سابباً
document.addEventListener("DOMContentLoaded", () => {
  loadTicketsFromStorage(); // تحميل البيانات من localStorage
  renderTickets(); // رسم التذاكر في الجدول
  updateDashboardStats(); // تحديث الأرقام والإحصائيات
});

// ====================================================
// 3. إدارة التخزين المحلي (LocalStorage Operations)
// ====================================================

// دالة لجلب البيانات المخزنة من ذاكرة المتصفح
function loadTicketsFromStorage() {
  const storedTickets = localStorage.getItem("itsm_tickets");
  if (storedTickets) {
    // تحويل النص المخزن بتنسيق JSON إلى مصفوفة كائنات
    tickets = JSON.parse(storedTickets);
  } else {
    // إذا كان الاستخدام لأول مرة، نضع بيانات تجريبية بسيطة
    tickets = [
      {
        id: "INC-1001",
        title: "توقف خدمة البريد الإلكتروني",
        department: "البرمجيات",
        priority: "عالية",
        status: "قيد المعالجة",
        date: "2026-08-28"
      }
    ];
    saveTicketsToStorage(); // حفظ البيانات التجريبية
  }
}

// دالة لحفظ المصفوفة الحالية داخل localStorage
function saveTicketsToStorage() {
  localStorage.setItem("itsm_tickets", JSON.stringify(tickets));
}

// ====================================================
// 4. التحكم بالنافذة المنبثقة (Modal Controls)
// ====================================================

// فتح النافذة عند الضغط على زر "إنشاء تذكرة جديدة"
openModalBtn.addEventListener("click", () => {
  ticketModal.classList.add("active");
});

// دالة لإغلاق النافذة المنبثقة وتنظيف النموذج
function closeModal() {
  ticketModal.classList.remove("active");
  ticketForm.reset(); // إفراغ الخانات
  currentEditingTicketId = null; // إعادة تعيين معرف التعديل
  document.querySelector(".modal-header h3").innerText =
    "إنشاء تذكرة دعم فني جديدة";
}

// ربط أحداث الإغلاق بالأزرار
closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);

// إغلاق النافذة عند الضغط في أي مكان خارج الكارت المنبثق
window.addEventListener("click", (e) => {
  if (e.target === ticketModal) {
    closeModal();
  }
});

// ====================================================
// 5. إضافة تذكرة جديدة (Create Ticket)
// ====================================================
ticketForm.addEventListener("submit", (e) => {
  e.preventDefault(); // منع الصفحة من إعادة التحميل عند إرسال النموذج

  const title = document.getElementById("ticketTitle").value.trim();
  const department = document.getElementById("ticketDepartment").value;
  const priority = document.getElementById("ticketPriority").value;
  const description = document.getElementById("ticketDescription").value.trim();

  // في حال كنا في وضع التعديل
  if (currentEditingTicketId) {
    tickets = tickets.map((ticket) => {
      if (ticket.id === currentEditingTicketId) {
        return {
          ...ticket,
          title: title,
          department: department,
          priority: priority,
          description: description
        };
      }
      return ticket;
    });
  } else {
    // =========================================================
    // توليد الرقم التسلسلي التلقائي (INC-1001, INC-1002, ...)
    // =========================================================
    let newTicketId = "INC-1001"; // الرقم الافتراضي لأول تذكرة

    if (tickets.length > 0) {
      // استخراج الأرقام فقط من معرفات التذاكر الحالية وتحويلها إلى أعداد
      const ids = tickets
        .map((t) => parseInt(t.id.replace("INC-", ""), 10))
        .filter((num) => !isNaN(num));

      if (ids.length > 0) {
        const maxId = Math.max(...ids); // إيجاد أعلى رقم حالي
        newTicketId = "INC-" + (maxId + 1); // زيادة 1 على الرقم الأعلى
      }
    }

    // إنشاء التذكرة الجديدة بالرقم التسلسلي الجديد
    const newTicket = {
      id: newTicketId,
      title: title,
      department: department,
      priority: priority,
      description: description,
      status: "جديد",
      date: new Date().toISOString().split("T")[0]
    };
    tickets.unshift(newTicket);
  }
  // حفظ التحديثات وإعادة عرض المكونات
  saveTicketsToStorage();
  renderTickets();
  updateDashboardStats();
  closeModal();
});

// ====================================================
// 6. عرض البيانات ورسم الجدول (Render Table)
// ====================================================

function renderTickets() {
  // تفريغ محتوى الجدول القديم
  ticketsTableBody.innerHTML = "";

  // جلب قيم التصفية والبحث
  const searchTerm = searchInput.value.toLowerCase();
  const selectedStatus = filterStatus.value;

  // تصفية المصفوفة بناءً على البحث والحالة المحددة
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchTerm) ||
      ticket.id.toLowerCase().includes(searchTerm);
    const matchesStatus =
      selectedStatus === "ALL" || ticket.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // في حال عدم وجود بيانات تطابق البحث
  if (filteredTickets.length === 0) {
    ticketsTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">لا توجد تذاكر مطابقة للعرض</td></tr>`;
    return;
  }

  // المرور على كل تذكرة وبناء الصف الخاص بها داخل الجدول
  filteredTickets.forEach((ticket) => {
    const row = document.createElement("tr");

    // تحديد فئة التنسيق بناءً على حالة التذكرة
    let badgeClass = "badge-new";
    if (ticket.status === "قيد المعالجة") badgeClass = "badge-progress";
    if (ticket.status === "مغلق") badgeClass = "badge-closed";

    row.innerHTML = `
            <td><strong>${ticket.id}</strong></td>
            <td>${ticket.title}</td>
            <td>${ticket.department}</td>
            <td>${ticket.priority}</td>
            <td><span class="badge ${badgeClass}">${ticket.status}</span></td>
            <td>${ticket.date}</td>
            <td>
    <!-- زر تعديل التذكرة -->
    <button class="action-btn" title="تعديل التذكرة" onclick="openEditModal('${ticket.id}')">✏️</button>
    <!-- زر تغيير الحالة -->
    <button class="action-btn" title="تغيير الحالة" onclick="cycleStatus('${ticket.id}')">🔄</button>
    <!-- زر حذف التذكرة -->
    <button class="action-btn" title="حذف التذكرة" onclick="deleteTicket('${ticket.id}')">🗑️</button>
</td>
        `;
    // إضافة حدث الضغط المزدوج على الصف بالكامل
    row.setAttribute("ondblclick", `openViewModal('${ticket.id}')`);
    row.style.cursor = "pointer"; // تغيير شكل الماوس لإعلام المستخدم بإمكانية الضغط
    row.title = "انقر مرتين (Double Click) لعرض التفاصيل الكاملة";

    ticketsTableBody.appendChild(row);
  });
}

// ====================================================
// 7. تحديث حالة وتغيير/حذف التذاكر (Update & Delete)
// ====================================================

// دالة لتغيير حالة التذكرة تسلسلياً (جديد -> قيد المعالجة -> مغلق)
function cycleStatus(id) {
  tickets = tickets.map((ticket) => {
    if (ticket.id === id) {
      if (ticket.status === "جديد") ticket.status = "قيد المعالجة";
      else if (ticket.status === "قيد المعالجة") ticket.status = "مغلق";
      else ticket.status = "جديد";
    }
    return ticket;
  });

  saveTicketsToStorage();
  renderTickets();
  updateDashboardStats();
}

// دالة لحذف التذكرة من النظام
function deleteTicket(id) {
  if (confirm("هل أنت تأكد من رغبتك في حذف هذه التذكرة؟")) {
    tickets = tickets.filter((ticket) => ticket.id !== id);
    saveTicketsToStorage();
    renderTickets();
    updateDashboardStats();
  }
}

// ====================================================
// 8. تحديث لوحة الإحصائيات (Update Stats Cards)
// ====================================================
function openEditModal(id) {
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) return;

  // تخزين ID التذكرة الحالية
  currentEditingTicketId = id;

  // تعبئة حقول النموذج بالبيانات الحالية
  document.getElementById("ticketTitle").value = ticket.title;
  document.getElementById("ticketDepartment").value = ticket.department;
  document.getElementById("ticketPriority").value = ticket.priority;
  document.getElementById("ticketDescription").value = ticket.description || "";

  // تغيير عنوان النافذة بزر التعديل
  document.querySelector(".modal-header h3").innerText =
    "تعديل تذكرة: " + ticket.id;

  // فتح النافذة المنبثقة
  ticketModal.classList.add("active");
}
// ====================================================
// 9. تحديث لوحة الإحصائيات (Update Stats Cards)
// ====================================================

function updateDashboardStats() {
  document.getElementById("totalTicketsCount").innerText = tickets.length;
  document.getElementById("pendingTicketsCount").innerText = tickets.filter(
    (t) => t.status === "جديد"
  ).length;
  document.getElementById("progressTicketsCount").innerText = tickets.filter(
    (t) => t.status === "قيد المعالجة"
  ).length;
  document.getElementById("closedTicketsCount").innerText = tickets.filter(
    (t) => t.status === "مغلق"
  ).length;
}
// ====================================================
// 10. دالة فتح النافذة وعرض البيانات التفصيلية للتذكرة
// ====================================================

function openViewModal(id) {
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) return;

  // تعبئة بيانات التذكرة في النافذة
  document.getElementById("viewTicketId").innerText =
    "تفاصيل التذكرة: " + ticket.id;
  document.getElementById("viewTitle").innerText = ticket.title;
  document.getElementById("viewDepartment").innerText = ticket.department;
  document.getElementById("viewPriority").innerText = ticket.priority;
  document.getElementById("viewStatus").innerText = ticket.status;
  document.getElementById("viewDate").innerText = ticket.date;
  document.getElementById("viewDescription").innerText =
    ticket.description || "لا يوجد وصف إضافي مكتوب.";

  // فتح النافذة
  viewModal.classList.add("active");
}

// دالة إغلاق نافذة عرض التفاصيل
function closeViewModal() {
  viewModal.classList.remove("active");
}

// ربط أزرار الإغلاق بالحدث
closeViewModalBtn.addEventListener("click", closeViewModal);
closeViewBtn.addEventListener("click", closeViewModal);

// حدث إغلاق النافذة عند الضغط على الخلفية المعتمة خارج النافذه
window.addEventListener("click", (e) => {
  if (e.target === ticketModal) closeModal();
  if (e.target === viewModal) closeViewModal();
});

// ====================================================
// 11. ربط أحداث الفلترة والبحث (Search & Filter Events)
// ====================================================

searchInput.addEventListener("input", renderTickets);
filterStatus.addEventListener("change", renderTickets);
