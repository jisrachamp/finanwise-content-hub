export type BackendUser = {
  _id: string;
  nombre: string;
  correo: string;
  rol: "administrador" | "usuario" | string;
  fechaRegistro?: string;
  tokenActualizacion?: string;
  preferencias?: {
    temasFavoritos: string[];
    notificaciones: boolean;
  };
};

export type LoginResponse = {
  user: BackendUser;
  accessToken: string;
  refreshToken: string;
};

export type LoginPayload = {
  correo: string;
  password: string;
};
