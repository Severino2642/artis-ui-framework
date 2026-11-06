// ═══════════════════════════════════════════════════════════════
//  HEADER MODELS
// ═══════════════════════════════════════════════════════════════

export interface BreadcrumbItem {
  label: string;
  route?: string;  // undefined = item courant (non cliquable)
  icon?: string;   // optionnel: icône Material Outlined
}

export type NotificationCategory = 'today' | 'week' | 'earlier';

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;       // peut contenir des balises <strong>
  time: string;          // ex: "1h ago", "3h ago"
  icon: string;          // Material Outlined icon name
  category: NotificationCategory;
  severity: NotificationSeverity;
  isRead: boolean;
}

export interface ProfileMenuItem {
  id: string;
  label: string;
  icon: string;          // Material Outlined icon name
  route?: string;
  action?: string;       // identifiant d'action émise en Output
  isDanger?: boolean;
  dividerBefore?: boolean;
}

export interface HeaderUser {
  name: string;
  email: string;
  avatarUrl?: string;    // URL image; si absent → initiales
  role?: string;
}
