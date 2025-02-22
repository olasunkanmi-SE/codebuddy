import { HttpRequestOptions } from "../../application/interfaces";
export interface IHttpClient {
  get<T>(
    url: string,
    options?: HttpRequestOptions,
    jwtToken?: string,
  ): Promise<T>;
  post<TRequest, TResponse>(
    url: string,
    payload: TRequest,
    options?: HttpRequestOptions,
    jwtToken?: string,
  ): Promise<TResponse>;
  put<TRequest, TResponse>(
    url: string,
    payload: TRequest,
    options?: HttpRequestOptions,
    jwtToken?: string,
  ): Promise<TResponse>;
  delete<TResponse>(
    url: string,
    options?: HttpRequestOptions,
    jwtToken?: string,
  ): Promise<TResponse>;
}
