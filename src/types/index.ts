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
