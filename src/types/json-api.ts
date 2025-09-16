export interface JsonApiResource {
  id: string;
  type: string;
  attributes?: Record<string, unknown>;
  relationships?: Record<string, JsonApiRelationship>;
  links?: Record<string, string>;
  meta?: Record<string, unknown>;
}

export interface JsonApiRelationship {
  data?: JsonApiResourceIdentifier | JsonApiResourceIdentifier[];
  links?: Record<string, string>;
  meta?: Record<string, unknown>;
}

export interface JsonApiResourceIdentifier {
  id: string;
  type: string;
  meta?: Record<string, unknown>;
}

export interface JsonApiDocument {
  data?: JsonApiResource | JsonApiResource[];
  errors?: JsonApiError[];
  meta?: Record<string, unknown>;
  links?: Record<string, string>;
  included?: JsonApiResource[];
  jsonapi?: {
    version: string;
    meta?: Record<string, unknown>;
  };
}

export interface JsonApiError {
  id?: string;
  links?: Record<string, string>;
  status?: string;
  code?: string;
  title?: string;
  detail?: string;
  source?: {
    pointer?: string;
    parameter?: string;
    header?: string;
  };
  meta?: Record<string, unknown>;
}
