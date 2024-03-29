export interface IPaymentPlan {
  name: string;
  price: number;
  dateRange: number; // days that will be add to user expiration date.
  isActive: boolean;
  description?: string;
  icon?: string;
}
