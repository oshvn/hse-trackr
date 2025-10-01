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
      `Schedule an urgent meeting with ${row.contractor_name} about ${row.doc_type_name} (overdue ${daysOver} day${daysOver !== 1 ? 's' : ''}).`
    );

    actions.push(
      `Send an escalation email with the latest template for ${row.doc_type_name}.`
    );

    actions.push(
      'Assign a mentor to close the gaps and share the standard checklist.'
    );
  }

  if (row.status_color === "amber" && dueDate) {
    const daysToDeadline = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysToDeadline <= 3 && daysToDeadline >= 0) {
      actions.push(
        'Add daily reminders and book a pre-deadline internal review.'
      );

      actions.push(
        `Check in with ${row.contractor_name} to confirm progress on ${row.doc_type_name}.`
      );
    }
  }

  return actions;
}
