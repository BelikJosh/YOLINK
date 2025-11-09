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
  Explore: undefined;
  Near: undefined;
  Scann: undefined;
  Favorites: undefined;
  ProfileClient: undefined;
};

export type VendorTabParamList = {
  HomeVendor: undefined;
  Catalogue: undefined;
  MakeCount: undefined;
  Sales: undefined;
  ProfileVendor: undefined;
};