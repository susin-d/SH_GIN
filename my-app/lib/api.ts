// The base URL for the API, configured via environment variables for flexibility.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// --- API Response Interfaces ---/

/**
 * A generic wrapper for all API responses.
 * @template T The type of the data payload in a successful response.
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

/**
 * Represents the structure of a User object from the backend.
 */
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "principal" | "teacher" | "student";
  profile?: {
    phone?: string;
    address?: string;
    class_name?: string; // Student-specific
    subject?: string;    // Teacher-specific
  };
}

/**
 * Represents the authentication tokens returned upon successful login.
 */
export interface AuthTokens {
  access: string;
  refresh: string;
}

// --- API Client Class ---

/**
 * Manages all communication with the backend API, including authentication,
 * token management, and making requests.
 */
class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Immediately load the access token from storage if it exists.
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("access_token");
    }
  }

  // --- Private Token Helpers for Encapsulation ---

  /**
   * Sets both access and refresh tokens in the client and localStorage.
   * This is the single source of truth for saving tokens.
   */
  private setTokens(access: string, refresh: string) {
    this.accessToken = access;
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
    }
  }

  /**
   * Retrieves the refresh token from localStorage.
   */
  private getRefreshToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("refresh_token");
    }
    return null;
  }

  /**
   * Public method to set only the access token, used after a refresh.
   */
  public setAccessToken(token: string) {
    this.accessToken = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", token);
    }
  }

  /**
   * Clears all authentication tokens from the client and localStorage.
   */
  public clearTokens() {
    this.accessToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  }

  /**
   * The core method for making all API requests.
   * It handles adding headers, token refresh, and error parsing.
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });

      // Handle responses with no JSON body (e.g., 204 No Content)
      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      if (!response.ok) {
        // Prevent an infinite refresh loop if the refresh endpoint itself fails
        const isRefreshing = endpoint.includes("/auth/token/refresh/");

        if (response.status === 401 && this.accessToken && !isRefreshing) {
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Retry the original request with the new token
            // We pass the original options, which will now be sent with the new token
            return this.request(endpoint, options);
          } else {
            this.clearTokens();
            // Optional: You could trigger a redirect to the login page here
            // if (typeof window !== 'undefined') window.location.href = '/login';
            return {
              success: false,
              message: "Your session has expired. Please login again.",
            };
          }
        }

        return {
          success: false,
          message: data?.detail || data?.message || `HTTP Error: ${response.status}`,
          errors: data?.errors || {},
        };
      }

      return { success: true, data };
    } catch (error) {
      console.error("API request failed:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "A network error occurred.",
      };
    }
  }

  /**
   * Attempts to get a new access token using the stored refresh token.
   */
  private async refreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    const response = await this.request<{ access: string }>("/auth/token/refresh/", {
      method: "POST",
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (response.success && response.data?.access) {
      this.setAccessToken(response.data.access);
      return true;
    }
    
    return false;
  }

  // --- Public API Methods ---

  // Authentication
  async login(username: string, password: string): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    type LoginResponse = {
        access: string;
        refresh: string;
        user: User;
    }

    const response = await this.request<LoginResponse>("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    if (response.success && response.data) {
      const { access, refresh, user } = response.data;
      this.setTokens(access, refresh);

      return {
        success: true,
        data: {
          user,
          tokens: { access, refresh },
        },
      };
    }

    return response;
  }

  async logout(): Promise<ApiResponse> {
    const refreshToken = this.getRefreshToken();
    
    // Tell the backend to blacklist the token for improved security
    if (refreshToken) {
        await this.request("/auth/logout/", {
            method: "POST",
            body: JSON.stringify({ refresh: refreshToken }),
        });
    }

    this.clearTokens();
    return { success: true, message: "Logged out successfully" };
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>("/auth/user/");
  }

  // Generic CRUD operations
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "POST", body: JSON.stringify(data) });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "PUT", body: JSON.stringify(data) });
  }

  async patch<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "PATCH", body: JSON.stringify(data) });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

// --- Singleton Instance and Helper Object ---

// Create a single, shared instance of the ApiClient.
export const apiClient = new ApiClient(API_BASE_URL);

// Create a structured helper object for easy access to all API endpoints.
// This provides excellent autocompletion and type safety in your code.
export const api = {
  auth: {
    login: (username: string, password: string) => apiClient.login(username, password),
    logout: () => apiClient.logout(),
    getCurrentUser: () => apiClient.getCurrentUser(),
  },
  students: {
    list: () => apiClient.get("/students/"),
    get: (id: number) => apiClient.get(`/students/${id}/`),
    create: (data: any) => apiClient.post("/students/", data),
    update: (id: number, data: any) => apiClient.put(`/students/${id}/`, data),
    delete: (id: number) => apiClient.delete(`/students/${id}/`),
    fees: (id: number) => apiClient.get(`/students/${id}/fees/`),
    attendance: (id: number) => apiClient.get(`/students/${id}/attendance/`),
  },
  teachers: {
    list: () => apiClient.get("/teachers/"),
    get: (id: number) => apiClient.get(`/teachers/${id}/`),
    create: (data: any) => apiClient.post("/teachers/", data),
    update: (id: number, data: any) => apiClient.put(`/teachers/${id}/`, data),
    delete: (id: number) => apiClient.delete(`/teachers/${id}/`),
    classes: (id: number) => apiClient.get(`/teachers/${id}/classes/`),
  },
  classes: {
    list: () => apiClient.get("/classes/"),
    get: (id: number) => apiClient.get(`/classes/${id}/`),
    create: (data: any) => apiClient.post("/classes/", data),
    update: (id: number, data: any) => apiClient.put(`/classes/${id}/`, data),
    delete: (id: number) => apiClient.delete(`/classes/${id}/`),
    students: (id: number) => apiClient.get(`/classes/${id}/students/`),
    timetable: (id: number) => apiClient.get(`/classes/${id}/timetable/`),
  },
  fees: {
    list: () => apiClient.get("/fees/"),
    get: (id: number) => apiClient.get(`/fees/${id}/`),
    create: (data: any) => apiClient.post("/fees/", data),
    update: (id: number, data: any) => apiClient.put(`/fees/${id}/`, data),
    delete: (id: number) => apiClient.delete(`/fees/${id}/`),
    pay: (id: number, data: any) => apiClient.post(`/fees/${id}/pay/`, data),
  },
  attendance: {
    list: () => apiClient.get("/attendance/"),
    create: (data: any) => apiClient.post("/attendance/", data),
    update: (id: number, data: any) => apiClient.put(`/attendance/${id}/`, data),
    byClass: (classId: number, date?: string) =>
      apiClient.get(`/attendance/class/${classId}/${date ? `?date=${date}` : ""}`),
  },
  timetable: {
    list: () => apiClient.get("/timetable/"),
    get: (id: number) => apiClient.get(`/timetable/${id}/`),
    create: (data: any) => apiClient.post("/timetable/", data),
    update: (id: number, data: any) => apiClient.put(`/timetable/${id}/`, data),
    delete: (id: number) => apiClient.delete(`/timetable/${id}/`),
    byClass: (classId: number) => apiClient.get(`/timetable/class/${classId}/`),
  },
  leaves: {
    list: () => apiClient.get("/leaves/"),
    get: (id: number) => apiClient.get(`/leaves/${id}/`),
    create: (data: any) => apiClient.post("/leaves/", data),
    update: (id: number, data: any) => apiClient.put(`/leaves/${id}/`, data),
    approve: (id: number) => apiClient.patch(`/leaves/${id}/`, { status: "approved" }),
    reject: (id: number) => apiClient.patch(`/leaves/${id}/`, { status: "rejected" }),
  },
  reports: {
    attendance: (params?: any) => apiClient.get(`/reports/attendance/?${new URLSearchParams(params)}`),
    fees: (params?: any) => apiClient.get(`/reports/fees/?${new URLSearchParams(params)}`),
    academic: (params?: any) => apiClient.get(`/reports/academic/?${new URLSearchParams(params)}`),
  },
};