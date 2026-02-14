export type NotificationFrequency = 'none' | 'daily_6am';

export interface Redirect {
  id: string;
  slug: string;
  target_url: string;
  notification_email: string | null;
  notification_frequency: NotificationFrequency;
  created_at: string;
  updated_at: string;
}

export interface AccessLog {
  id: string;
  redirect_id: string;
  param_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface DashboardStats {
  total_accesses: number;
  unique_users: number;
}

// --- TeamFlow Types ---

export interface Member {
  id: string;
  user_id?: string;
  name: string;
  color: string;
  avatar_url?: string;
  created_at: string;
}

export type TaskStatus = 'pending' | 'completed' | 'cancelled' | 'deleted';

export interface Task {
  id: string;
  title: string;
  amount: number;
  points: number;
  member_id: string;
  status: TaskStatus;
  start_date: string;
  end_date: string;
  notes?: string;
  scheduled_date?: string;
  completed_at?: string;
  created_at: string;
  member?: Member;
}

export interface MonthlyGoal {
  id: string;
  month: string;
  target_amount: number;
  target_points: number;
  created_at?: string;
}

export interface DashboardSummary {
  completedAmount: number;
  pendingAmount: number;
  completedPoints: number;
  pendingPoints: number;
  targetAmount: number;
  targetPoints: number;
  recentActivities: Task[];
  monthlyCompletedCount: number;
}

export interface MemberStats {
  member: Member;
  totalAmount: number;
  completedAmount: number;
  totalPoints: number;
  completedPoints: number;
  taskCount: number;
  completedTaskCount: number;
}

export interface TaskFormData {
  title: string;
  amount: number;
  points: number;
  member_id: string;
  start_date: string;
  end_date: string;
  notes: string;
}

export type ViewMode = 'personal' | 'team';
export type RankingPeriod = 'monthly' | 'yearly';
