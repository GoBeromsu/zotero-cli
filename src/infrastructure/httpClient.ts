export interface HttpResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export interface HttpRawResponse {
  status: number;
  headers: Record<string, string>;
  data: Buffer;
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

  requestRaw(
    method: string,
    url: string,
    options?: { headers?: Record<string, string> }
  ): Promise<HttpRawResponse>;

  requestFormData(
    url: string,
    fields: Record<string, string>,
    file: { name: string; data: Buffer; contentType: string }
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

  async requestRaw(
    method: string,
    url: string,
    options: { headers?: Record<string, string> } = {}
  ): Promise<HttpRawResponse> {
    const response = await fetch(url, {
      method,
      headers: options.headers,
    });

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const arrayBuffer = await response.arrayBuffer();
    return {
      status: response.status,
      headers,
      data: Buffer.from(arrayBuffer),
    };
  }

  async requestFormData(
    url: string,
    fields: Record<string, string>,
    file: { name: string; data: Buffer; contentType: string }
  ): Promise<HttpResponse> {
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      formData.append(key, value);
    }
    const blob = new Blob([file.data], { type: file.contentType });
    formData.append("file", blob, file.name);

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      status: response.status,
      headers,
      body: await response.text(),
    };
  }
}
