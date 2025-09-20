import axios, { AxiosInstance } from "axios";
import { getSession } from "next-auth/react";

class AxiosClient {
  private instance: AxiosInstance;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.instance = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add a request interceptor to include Authorization header
    this.instance.interceptors.request.use(
      async (config) => {
        if (!this.token) {
          this.token = await this.getToken();
        }
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }

        return config;
      },
      (error) => {
        // Handle request error
        return Promise.reject(error);
      },
    );
  }

  getInstance(): AxiosInstance {
    return this.instance;
  }

  async getToken(): Promise<string> {
    const session = await getSession();
    const token = session?.user?.token as string;
    return token;
  }
}

export default AxiosClient;
