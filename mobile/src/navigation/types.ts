export type AuthStackParamList = {
  SignIn: undefined;
};

export type AppStackParamList = {
  Home: undefined;
  Customers: { created?: string; search?: string } | undefined;
  CustomerForm: undefined;
};
