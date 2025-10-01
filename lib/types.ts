export type Customer = {
  ID: string;
  Name: string;
  Email?: string;
  Phone?: string;
  Spend: number;
  Goal: number;
  Visits: number;
  LastVisit?: string; // ISO
  TimesHit200: number;
  CreatedAt: string;
  UpdatedAt: string;
  Notes?: string;
  Deleted?: boolean;
};

export type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

