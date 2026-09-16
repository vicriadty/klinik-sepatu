export type AuthStackParamList = {
  SignIn: undefined;
};

export type AppStackParamList = {
  Home: undefined;
  Customers: { created?: string; search?: string; select?: boolean } | undefined;
  CustomerForm: { select?: boolean } | undefined;
  OrderCustomer: undefined;
  OrderItems: undefined;
  OrderItemForm: { itemId?: string } | undefined;
  OrderItemServices: { itemId: string };
  OrderReview: undefined;
  OrderSuccess: {
    orderNumber: string;
    customerName: string;
    grandTotal: number;
  };
};
