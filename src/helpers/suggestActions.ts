export interface DocProgressRow {
  contractor_name: string;
  doc_type_name: string;
  status_color: string;
  planned_due_date: string | null;
  is_critical: boolean;
  overdue_days?: number;
}

export function suggestActions(row: DocProgressRow): string[] {
  const actions: string[] = [];
  const today = new Date();
  const dueDate = row.planned_due_date ? new Date(row.planned_due_date) : null;

  if (row.status_color === "red" && dueDate && today > dueDate) {
    const daysOver = row.overdue_days ?? Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    actions.push(
      `Tổ chức họp khẩn với ${row.contractor_name} về ${row.doc_type_name} (trễ ${daysOver} ngày).`
    );
    
    actions.push(
      `Gửi email cảnh báo + đính kèm template mẫu cho ${row.doc_type_name}.`
    );
    
    actions.push(
      `Chỉ định mentor hỗ trợ hoàn thiện hồ sơ, cung cấp checklist chuẩn.`
    );
  }
  
  if (row.status_color === "amber" && dueDate) {
    const daysToDeadline = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysToDeadline <= 3 && daysToDeadline >= 0) {
      actions.push(
        `Nhắc nhở định kỳ hằng ngày; đặt lịch review nội bộ trước hạn.`
      );
      
      actions.push(
        `Liên hệ trực tiếp ${row.contractor_name} kiểm tra tiến độ ${row.doc_type_name}.`
      );
    }
  }
  
  return actions;
}