export type UserRole = "usuario" | "administrador";

export type Usuario = {
  _id: string;
  nombre: string;
  correo: string;
  rol: UserRole;
  fechaRegistro?: string;

  perfil?: {
    edad?: number;
    ingresosMensuales?: number;
    nivelEndeudamiento?: number;
    nivelEducativo?: string;
  };

  preferencias?: {
    temasFavoritos?: string[];
    notificaciones?: boolean;
  };

  tokenActualizacion?: string;
};

export type UsuarioCreatePayload = {
  nombre: string;
  correo: string;
  password: string;
  rol?: UserRole;

  perfil?: {
    edad?: number;
    ingresosMensuales?: number;
    nivelEndeudamiento?: number;
    nivelEducativo?: string;
  };

  preferencias?: {
    temasFavoritos?: string[];
    notificaciones?: boolean;
  };
};

export type UsuarioUpdatePayload = Partial<Omit<UsuarioCreatePayload, "password">> & {
  // password opcional en update (si tu backend lo soporta)
  password?: string;
};
