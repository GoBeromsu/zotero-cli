export interface HttpResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export interface HttpClient {
  request(
    method: string,
    url: string,
    options?: {
      headers?: Record<string, string>;
      body?: string;
    }
  ): Promise<HttpResponse>;
}

export class NodeHttpClient implements HttpClient {
  async request(
    method: string,
    url: string,
    options: { headers?: Record<string, string>; body?: string } = {}
  ): Promise<HttpResponse> {
    const response = await fetch(url, {
      method,
      headers: options.headers,
      body: options.body
    });

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      status: response.status,
      headers,
      body: await response.text()
    };
  }
}
