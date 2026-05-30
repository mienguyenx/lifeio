import { format, startOfWeek, endOfWeek, subWeeks, parseISO, isWithinInterval, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { Task, Habit, Goal, PomodoroSession } from '@/types/lifeos';

interface ExportData {
  tasks: Task[];
  habits: Habit[];
  goals: Goal[];
  pomodoroSessions: PomodoroSession[];
}

function generateWeeklyData(tasks: Task[], pomodoroSessions: PomodoroSession[]) {
  const now = new Date();
  const weeks = [];
  
  for (let i = 7; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    
    const completedTasks = tasks.filter(t => 
      t.status === 'done' && 
      t.completedAt && 
      isWithinInterval(parseISO(t.completedAt), { start: weekStart, end: weekEnd })
    ).length;
    
    const pomodoros = pomodoroSessions.filter(s => 
      s.phase === 'work' && 
      isWithinInterval(parseISO(s.completedAt), { start: weekStart, end: weekEnd })
    ).length;
    
    weeks.push({
      week: `${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM')}`,
      completedTasks,
      pomodoros
    });
  }
  
  return weeks;
}

function generateMonthlyData(tasks: Task[], pomodoroSessions: PomodoroSession[]) {
  const now = new Date();
  const months = [];
  
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(subMonths(now, i));
    
    const completedTasks = tasks.filter(t => 
      t.status === 'done' && 
      t.completedAt && 
      isWithinInterval(parseISO(t.completedAt), { start: monthStart, end: monthEnd })
    ).length;
    
    const pomodoros = pomodoroSessions.filter(s => 
      s.phase === 'work' && 
      isWithinInterval(parseISO(s.completedAt), { start: monthStart, end: monthEnd })
    ).length;
    
    months.push({
      month: format(monthStart, 'MMMM yyyy', { locale: vi }),
      completedTasks,
      pomodoros
    });
  }
  
  return months;
}

export function exportToCSV(data: ExportData): void {
  const { tasks, habits, goals, pomodoroSessions } = data;
  
  // Weekly stats
  const weeklyData = generateWeeklyData(tasks, pomodoroSessions);
  
  // Monthly stats
  const monthlyData = generateMonthlyData(tasks, pomodoroSessions);
  
  // Build CSV content
  let csvContent = 'BÁO CÁO PRODUCTIVITY - LIFEOS\n';
  csvContent += `Ngày xuất: ${format(new Date(), 'dd/MM/yyyy HH:mm')}\n\n`;
  
  // Summary
  csvContent += '=== TỔNG QUAN ===\n';
  csvContent += `Tổng Tasks,${tasks.length}\n`;
  csvContent += `Tasks hoàn thành,${tasks.filter(t => t.status === 'done').length}\n`;
  csvContent += `Tổng Habits,${habits.length}\n`;
  csvContent += `Tổng Goals,${goals.length}\n`;
  csvContent += `Goals hoàn thành,${goals.filter(g => g.completedAt).length}\n`;
  csvContent += `Tổng Pomodoros,${pomodoroSessions.filter(s => s.phase === 'work').length}\n\n`;
  
  // Weekly data
  csvContent += '=== THỐNG KÊ TUẦN ===\n';
  csvContent += 'Tuần,Tasks hoàn thành,Pomodoros\n';
  weeklyData.forEach(w => {
    csvContent += `${w.week},${w.completedTasks},${w.pomodoros}\n`;
  });
  csvContent += '\n';
  
  // Monthly data
  csvContent += '=== THỐNG KÊ THÁNG ===\n';
  csvContent += 'Tháng,Tasks hoàn thành,Pomodoros\n';
  monthlyData.forEach(m => {
    csvContent += `${m.month},${m.completedTasks},${m.pomodoros}\n`;
  });
  csvContent += '\n';
  
  // Tasks list
  csvContent += '=== DANH SÁCH TASKS ===\n';
  csvContent += 'Tiêu đề,Trạng thái,Ưu tiên,Lĩnh vực,Deadline,Ngày hoàn thành\n';
  tasks.forEach(t => {
    csvContent += `"${t.title}",${t.status},${t.priority},${t.area || ''},${t.dueDate || ''},${t.completedAt ? format(parseISO(t.completedAt), 'dd/MM/yyyy') : ''}\n`;
  });
  csvContent += '\n';
  
  // Goals list
  csvContent += '=== DANH SÁCH GOALS ===\n';
  csvContent += 'Tiêu đề,Lĩnh vực,Tiến độ,Ngày đích,Trạng thái\n';
  goals.forEach(g => {
    csvContent += `"${g.title}",${g.area},${g.progress}%,${g.targetDate || ''},${g.completedAt ? 'Hoàn thành' : 'Đang làm'}\n`;
  });
  
  // Create and download file
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `lifeos-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(data: ExportData): void {
  // For Excel, we'll create a more structured CSV that Excel can open properly
  // with proper formatting. For a real Excel file, we'd need a library like xlsx
  exportToCSV(data); // Fallback to CSV which Excel can open
}
