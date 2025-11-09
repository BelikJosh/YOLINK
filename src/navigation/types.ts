export type RootStackParamList = {
  Login: undefined;
  CreateAccount: undefined;
  ClientTabs: { user: any };
  VendorTabs: { user: any };
};

export type ClientTabParamList = {
  Explore: undefined;
  Near: undefined;
  Scann: undefined;
  Favorites: undefined;
  ProfileClient: { user?: any }; // Añade user como parámetro opcional
};

export type VendorTabParamList = {
  HomeVendor: undefined;
  Catalogue: undefined;
  MakeCount: undefined;
  Sales: undefined;
  ProfileVendor: undefined;
};