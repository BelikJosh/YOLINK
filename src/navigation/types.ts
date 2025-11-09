export type RootStackParamList = {
  Login: undefined;
  CreateAccount: undefined;
  ClientTabs: { user: any };
  VendorTabs: { user: any };
  Profile: { user: any };
  Settings: undefined;
  Cobrar: undefined;
  GenerarQR: undefined;
  AgregarProducto: undefined;
  HistorialVentas: undefined;
};

export type ClientTabParamList = {
  Explore: { user?: UserData };
  Near: { user?: UserData };
  Scann: { user?: UserData };
  Favorites: { user?: UserData };
  ProfileClient: { user?: UserData };
};

export type VendorTabParamList = {
  HomeVendor: undefined;
  Catalogue: undefined;
  MakeCount: undefined;
  Sales: undefined;
  ProfileVendor: undefined;
};