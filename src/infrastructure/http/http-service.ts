import { ClientRequest } from "http";
import * as https from "https";
import {
  HTTPS_DEFAULT_TIMEOUT,
  RequestHeader,
} from "../../application/constant";
import { HttpRequestOptions } from "../../application/interfaces";
import { Logger, LogLevel } from "../logger/logger";
import { IHttpClient } from "./http-service.interface";

export class HttpClient implements IHttpClient {
  protected readonly logger: Logger;

  private static instance: HttpClient;
  constructor() {
    this.logger = Logger.initialize("HttpClient", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  static getInstance() {
    if (!HttpClient.instance) {
      HttpClient.instance = new HttpClient();
    }
    return HttpClient.instance;
  }

  async get<T>(
    url: string,
    options?: HttpRequestOptions,
    jwtToken?: string,
  ): Promise<T> {
    return this.sendRequest<T>("GET", url, undefined, options, jwtToken);
  }

  async post<TRequest, TResponse>(
    url: string,
    payload: TRequest,
    options?: HttpRequestOptions,
    jwtToken?: string,
  ): Promise<TResponse> {
    return this.sendRequest<TResponse>("POST", url, payload, options, jwtToken);
  }

  async put<TRequest, TResponse>(
    url: string,
    payload: TRequest,
    options?: HttpRequestOptions,
    jwtToken?: string,
  ): Promise<TResponse> {
    return this.sendRequest<TResponse>("PUT", url, payload, options, jwtToken);
  }

  async delete<TResponse>(
    url: string,
    options?: HttpRequestOptions,
    jwtToken?: string,
  ): Promise<TResponse> {
    return this.sendRequest<TResponse>(
      "DELETE",
      url,
      undefined,
      options,
      jwtToken,
    );
  }

  private handleResponseError(
    error: Error,
    options: HttpRequestOptions,
    reject: (reason?: any) => void,
    responseData?: any,
  ): void {
    this.logger.error(`API Response Error: ${error.message}`, {
      ...options,
      response: responseData,
    });
    reject(error);
  }

  private handleRequestError(
    error: Error,
    options: HttpRequestOptions,
    reject: (reason?: any) => void,
  ): void {
    this.logger.error(`API Request Error: ${error.message}`, options);
    reject(error);
  }

  private async sendRequest<T>(
    method: string,
    url: string,
    payload?: any,
    options: HttpRequestOptions = {},
    jwtToken?: string,
  ): Promise<T> {
    const parsedUrl = new URL(url);
    const { hostname, search } = parsedUrl;
    const requestOptions: HttpRequestOptions = {
      hostname: hostname,
      path: hostname + search,
      method,
      timeout: options.timeout ?? HTTPS_DEFAULT_TIMEOUT,
      headers: {
        ...this.generateRequestHeader(jwtToken),
        ...options.headers,
      },
    };
    return new Promise<T>((resolve, reject) => {
      const req: ClientRequest = https.request(requestOptions, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          if (!res.statusCode) {
            return this.handleResponseError(
              new Error("No status code"),
              requestOptions,
              reject,
              data,
            );
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsedData = JSON.parse(data);
              resolve(parsedData);
            } catch (error: any) {
              this.handleResponseError(
                new Error(`Failed to parse JSON response: ${error.message}`),
                requestOptions,
                reject,
                error,
              );
            }
          } else {
            const errorMessage = `Request failed with status code ${res.statusCode}`;
            this.handleResponseError(
              new Error(errorMessage),
              requestOptions,
              reject,
              data,
            );
          }
        });
      });
      req.on("error", (error) => {
        this.handleRequestError(error, requestOptions, reject);
      });
      if (payload) {
        this.writePayload(req, payload);
      }
      req.end();
    });
  }

  private writePayload(req: ClientRequest, payload: any) {
    const payloadToString = JSON.stringify(payload);
    req.setHeader("Content-Length", Buffer.byteLength(payloadToString));
    req.write(payloadToString);
  }

  private generateRequestHeader(jwtToken?: string): Record<string, string> {
    return {
      [RequestHeader.AUTHORIZATION]: jwtToken ? `Bearer ${jwtToken}` : "",
      [RequestHeader.CONTENT_TYPE]: "application/json",
      [RequestHeader.CONNECTION]: "keep-alive",
      [RequestHeader.ACCEPT]: "*/*",
    };
  }
}
