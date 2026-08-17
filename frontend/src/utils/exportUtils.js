/**
 * exportUtils.js
 * Pure-frontend PDF (jsPDF + jspdf-autotable) and Excel (SheetJS/xlsx) export.
 * No backend file generation — data comes from the API, format is done client-side.
 */

// ── Status badge color map for PDF ─────────────────────────────────────────
const STATUS_COLORS = {
  "Full Day":   [232, 249, 240],
  "Full Day (WFH)": [232, 249, 240],
  "Partial":    [255, 243, 233],
  "Partial (WFH)": [255, 243, 233],
  "Leave":      [238, 244, 255],
  "Absent":     [255, 240, 240],
  "Weekend":    [245, 245, 248],
};

const STATUS_TEXT = {
  "Full Day":   [24, 160, 75],
  "Full Day (WFH)": [24, 160, 75],
  "Partial":    [255, 123, 13],
  "Partial (WFH)": [255, 123, 13],
  "Leave":      [70, 106, 230],
  "Absent":     [235, 9, 16],
  "Weekend":    [118, 118, 123],
};

// ── PDF: Monthly Attendance (single employee) ───────────────────────────────
export const exportAttendancePDF = async (reportData, companyName = "HA Technologies") => {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc  = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw   = doc.internal.pageSize.getWidth();
  const { employee, period, summary, dailyRows } = reportData;

  // ── Header band ────────────────────────────────────────────────────────
  doc.setFillColor(50, 23, 64);
  doc.rect(0, 0, pw, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, 14, 12);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("HR Management System — Monthly Attendance Report", 14, 20);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString("en-US")}`, pw - 14, 20, { align: "right" });

  // ── Employee info ──────────────────────────────────────────────────────
  let y = 36;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(`${employee.fullName}`, 14, y);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 90, 90);
  y += 6;
  doc.text(`Employee ID: ${employee.employeeId || "—"}   |   Department: ${employee.department || "—"}   |   Designation: ${employee.designation || "—"}`, 14, y);
  y += 5;
  doc.text(`Reporting Period: ${period.label}`, 14, y);

  // ── Summary cards row ──────────────────────────────────────────────────
  y += 8;
  const cards = [
    { label: "Working Days", value: summary.totalWorkingDays },
    { label: "Present",      value: summary.presentDays },
    { label: "Full Days",    value: summary.fullDays },
    { label: "Partial Days", value: summary.partialDays },
    { label: "Absent",       value: summary.absentDays },
    { label: "Leave",        value: summary.leaveDays },
    { label: "WFH",          value: summary.wfhDays },
    { label: "Total Hours",  value: summary.totalHours },
  ];
  const cardW = (pw - 28) / 4;
  cards.forEach((c, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const cx  = 14 + col * cardW;
    const cy  = y + row * 18;
    doc.setFillColor(247, 247, 250);
    doc.roundedRect(cx, cy, cardW - 2, 14, 2, 2, "F");
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(c.label.toUpperCase(), cx + 3, cy + 5);
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(String(c.value), cx + 3, cy + 11);
  });

  y += Math.ceil(cards.length / 4) * 18 + 6;

  // ── Daily table ────────────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Daily Attendance Detail", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Date", "Day", "Clock In", "Clock Out", "Sessions", "Hours", "Status"]],
    body: dailyRows.map(r => [
      r.date.split("-").reverse().join("/"),
      r.dayName,
      r.firstClockIn,
      r.lastClockOut,
      String(r.sessions || 0),
      r.totalHours,
      r.status,
    ]),
    styles:         { fontSize: 8, cellPadding: 2.5, valign: "middle" },
    headStyles:     { fillColor: [50, 23, 64], textColor: [255,255,255], fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [250, 250, 252] },
    columnStyles:   { 0: { cellWidth: 22 }, 1: { cellWidth: 12 }, 6: { cellWidth: 22 } },
    didDrawCell:    (data) => {
      if (data.section === "body" && data.column.index === 6) {
        const status = data.cell.text[0];
        const bg     = STATUS_COLORS[status] || [240,240,240];
        const fg     = STATUS_TEXT[status]   || [80,80,80];
        doc.setFillColor(...bg);
        doc.roundedRect(data.cell.x + 0.5, data.cell.y + 0.5, data.cell.width - 1, data.cell.height - 1, 1.5, 1.5, "F");
        doc.setTextColor(...fg);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.text(status, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 0.5, { align: "center", baseline: "middle" });
      }
    },
    margin: { left: 14, right: 14 },
  });

  // ── Footer ─────────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(`${companyName} — Confidential`, 14, doc.internal.pageSize.getHeight() - 6);
    doc.text(`Page ${i} of ${pageCount}`, pw - 14, doc.internal.pageSize.getHeight() - 6, { align: "right" });
  }

  doc.save(`Attendance_${employee.fullName.replace(/ /g,"_")}_${period.monthName}_${period.year}.pdf`);
};

// ── PDF: Org Monthly Attendance (admin) ──────────────────────────────────────
export const exportOrgAttendancePDF = async (reportData, companyName = "HA Technologies") => {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pw  = doc.internal.pageSize.getWidth();
  const { period, rows, totalWorkingDays } = reportData;

  doc.setFillColor(50, 23, 64);
  doc.rect(0, 0, pw, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15); doc.setFont("helvetica", "bold");
  doc.text(companyName, 14, 11);
  doc.setFontSize(9);  doc.setFont("helvetica", "normal");
  doc.text(`Monthly Attendance Report — ${period.label}  (Working Days: ${totalWorkingDays})`, 14, 19);
  doc.text(`Generated: ${new Date().toLocaleString("en-US")}`, pw - 14, 19, { align: "right" });

  autoTable(doc, {
    startY: 30,
    head: [["#","Employee","ID","Department","Designation","Present","Leave","WFH","Absent","Total Hours"]],
    body: rows.map((r, i) => [
      i + 1, r.name, r.employeeId, r.department, r.designation,
      r.presentDays, r.leaveDays, r.wfhDays, r.absentDays, r.totalHours,
    ]),
    styles:      { fontSize: 8, cellPadding: 2.5 },
    headStyles:  { fillColor: [50,23,64], textColor:[255,255,255], fontStyle:"bold" },
    alternateRowStyles: { fillColor: [250,250,252] },
    columnStyles: { 0: { cellWidth: 8 } },
    margin: { left: 14, right: 14 },
  });

  const pc = doc.getNumberOfPages();
  for (let i = 1; i <= pc; i++) {
    doc.setPage(i);
    doc.setFontSize(7); doc.setTextColor(160,160,160);
    doc.text(`${companyName} — Confidential`, 14, doc.internal.pageSize.getHeight()-5);
    doc.text(`Page ${i}/${pc}`, pw-14, doc.internal.pageSize.getHeight()-5, { align:"right" });
  }

  doc.save(`Org_Attendance_${period.label.replace(/ /g,"_")}.pdf`);
};

// ── Excel: Single employee attendance ────────────────────────────────────────
export const exportAttendanceExcel = async (reportData, companyName = "HA Technologies") => {
  const XLSX = await import("xlsx");
  const { employee, period, summary, dailyRows } = reportData;

  const wb = XLSX.utils.book_new();

  // --- Summary sheet ---
  const sumData = [
    [companyName + " — Monthly Attendance Report"],
    [""],
    ["Employee",     employee.fullName],
    ["Employee ID",  employee.employeeId || "—"],
    ["Department",   employee.department || "—"],
    ["Designation",  employee.designation || "—"],
    ["Period",       period.label],
    ["Generated",    new Date().toLocaleString("en-US")],
    [""],
    ["SUMMARY"],
    ["Working Days",      summary.totalWorkingDays],
    ["Present Days",      summary.presentDays],
    ["Full Days",         summary.fullDays],
    ["Partial Days",      summary.partialDays],
    ["Absent Days",       summary.absentDays],
    ["Leave Days",        summary.leaveDays],
    ["WFH Days",          summary.wfhDays],
    ["Total Hours",       summary.totalHours],
    ["Avg Hours/Day",     summary.avgHoursPerDay],
    ["Late Arrivals",     summary.lateDays],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(sumData);
  ws1["!cols"] = [{ wch: 22 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Summary");

  // --- Detail sheet ---
  const headers = ["Date","Day","First Clock-In","Last Clock-Out","Sessions","Total Hours","Status"];
  const detail  = dailyRows.map(r => [
    r.date, r.dayName, r.firstClockIn, r.lastClockOut,
    r.sessions || 0, r.totalHours, r.status,
  ]);
  const ws2 = XLSX.utils.aoa_to_sheet([headers, ...detail]);
  ws2["!cols"] = [{ wch:14 },{ wch:10 },{ wch:14 },{ wch:14 },{ wch:10 },{ wch:12 },{ wch:18 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Daily Detail");

  XLSX.writeFile(wb, `Attendance_${employee.fullName.replace(/ /g,"_")}_${period.monthName}_${period.year}.xlsx`);
};

// ── Excel: Org monthly ───────────────────────────────────────────────────────
export const exportOrgAttendanceExcel = async (reportData, companyName = "HA Technologies") => {
  const XLSX = await import("xlsx");
  const { period, rows, totalWorkingDays } = reportData;

  const wb = XLSX.utils.book_new();
  const headers = ["#","Employee","ID","Department","Designation","Present","Leave","WFH","Absent","Total Hours"];
  const data    = rows.map((r, i) => [
    i+1, r.name, r.employeeId, r.department, r.designation,
    r.presentDays, r.leaveDays, r.wfhDays, r.absentDays, r.totalHours,
  ]);
  const ws = XLSX.utils.aoa_to_sheet([
    [`${companyName} — Monthly Attendance Report — ${period.label}  |  Working Days: ${totalWorkingDays}`],
    [`Generated: ${new Date().toLocaleString("en-US")}`],
    [],
    headers,
    ...data,
  ]);
  ws["!cols"] = [8,24,12,20,20,10,10,10,10,14].map(w=>({ wch:w }));
  XLSX.utils.book_append_sheet(wb, ws, `${period.monthName} ${period.year}`);
  XLSX.writeFile(wb, `Org_Attendance_${period.label.replace(/ /g,"_")}.xlsx`);
};

// ── PDF: Project Report ───────────────────────────────────────────────────────
export const exportProjectPDF = async (reportData, companyName = "HA Technologies") => {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pw  = doc.internal.pageSize.getWidth();
  const { period, summary, projectRows, taskRows } = reportData;

  doc.setFillColor(50, 23, 64);
  doc.rect(0, 0, pw, 24, "F");
  doc.setTextColor(255,255,255);
  doc.setFontSize(14); doc.setFont("helvetica","bold");
  doc.text(companyName, 14, 11);
  doc.setFontSize(9); doc.setFont("helvetica","normal");
  doc.text(`Project & Task Report — ${period.label}`, 14, 19);
  doc.text(`Generated: ${new Date().toLocaleString("en-US")}`, pw-14, 19, { align:"right" });

  // Summary
  let y = 30;
  const sumCards = [
    ["Total Projects", summary.totalProjects],
    ["Total Tasks",    summary.totalTasks],
    ["Completed",      summary.doneTasks],
    ["In Progress",    summary.inProgressTasks],
    ["Overdue",        summary.overdueTasks],
  ];
  const cw = (pw - 28) / sumCards.length;
  sumCards.forEach((c, i) => {
    doc.setFillColor(247,247,250);
    doc.roundedRect(14 + i*cw, y, cw-2, 14, 2, 2, "F");
    doc.setTextColor(100,100,100); doc.setFontSize(7); doc.setFont("helvetica","normal");
    doc.text(c[0].toUpperCase(), 14 + i*cw + 3, y + 5);
    doc.setTextColor(30,30,30); doc.setFontSize(12); doc.setFont("helvetica","bold");
    doc.text(String(c[1]), 14 + i*cw + 3, y + 11);
  });
  y += 20;

  if (projectRows.length > 0) {
    doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.setTextColor(30,30,30);
    doc.text("Projects Summary", 14, y); y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Project","Status","Deadline","Tasks","Done","Overdue","Progress%","Members"]],
      body: projectRows.map(p => [p.name, p.status, p.deadline, p.totalTasks, p.doneTasks, p.overdueTasks, p.progress+"%", p.members||"—"]),
      styles: { fontSize:7.5, cellPadding:2 },
      headStyles: { fillColor:[50,23,64], textColor:[255,255,255], fontStyle:"bold" },
      alternateRowStyles: { fillColor:[250,250,252] },
      margin: { left:14, right:14 },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  if (taskRows.length > 0) {
    doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.setTextColor(30,30,30);
    doc.text("Task Detail", 14, y); y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Task","Project","Assigned To","Department","Status","Due Date","Created"]],
      body: taskRows.map(t => [t.title, t.project, t.assignedTo, t.department, t.status, t.dueDate, t.createdAt]),
      styles: { fontSize:7.5, cellPadding:2 },
      headStyles: { fillColor:[50,23,64], textColor:[255,255,255], fontStyle:"bold" },
      alternateRowStyles: { fillColor:[250,250,252] },
      margin: { left:14, right:14 },
    });
  }

  const pc = doc.getNumberOfPages();
  for (let i=1;i<=pc;i++){
    doc.setPage(i); doc.setFontSize(7); doc.setTextColor(160,160,160);
    doc.text(`${companyName} — Confidential`,14,doc.internal.pageSize.getHeight()-5);
    doc.text(`Page ${i}/${pc}`,pw-14,doc.internal.pageSize.getHeight()-5,{align:"right"});
  }
  doc.save(`Project_Report_${period.label.replace(/ /g,"_")}.pdf`);
};

// ── Excel: Project Report ────────────────────────────────────────────────────
export const exportProjectExcel = async (reportData, companyName = "HA Technologies") => {
  const XLSX = await import("xlsx");
  const { period, projectRows, taskRows } = reportData;
  const wb = XLSX.utils.book_new();

  if (projectRows.length > 0) {
    const ph = ["Project","Status","Deadline","Created By","Members","Total Tasks","Done","Pending","Overdue","Progress%"];
    const pd = projectRows.map(p=>[p.name,p.status,p.deadline,p.createdBy,p.members,p.totalTasks,p.doneTasks,p.pendingTasks,p.overdueTasks,p.progress+"%"]);
    const ws1 = XLSX.utils.aoa_to_sheet([[`${companyName} — Project Report — ${period.label}`],[`Generated: ${new Date().toLocaleString()}`],[],ph,...pd]);
    ws1["!cols"]=[24,14,14,18,30,12,10,10,10,12].map(w=>({wch:w}));
    XLSX.utils.book_append_sheet(wb,ws1,"Projects");
  }

  if (taskRows.length > 0) {
    const th = ["Task","Project","Assigned To","Department","Status","Due Date","Created","Overdue?"];
    const td = taskRows.map(t=>[t.title,t.project,t.assignedTo,t.department,t.status,t.dueDate,t.createdAt,t.isOverdue?"Yes":"No"]);
    const ws2 = XLSX.utils.aoa_to_sheet([th,...td]);
    ws2["!cols"]=[28,20,18,16,14,12,12,10].map(w=>({wch:w}));
    XLSX.utils.book_append_sheet(wb,ws2,"Tasks");
  }

  XLSX.writeFile(wb,`Project_Report_${period.label.replace(/ /g,"_")}.xlsx`);
};
