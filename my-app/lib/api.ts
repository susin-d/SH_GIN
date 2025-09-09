// The base URL for the API, configured via environment variables for flexibility.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// --- API Response Interfaces ---
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}
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
    class_name?: string;
    subject?: string;
  };
}
export interface AuthTokens {
  access: string;
  refresh: string;
}

// --- API Client Class ---
class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("access_token");
    }
  }

  private setTokens(access: string, refresh: string) {
    this.accessToken = access;
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
    }
  }

  private getRefreshToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("refresh_token");
    }
    return null;
  }

  public setAccessToken(token: string) {
    this.accessToken = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", token);
    }
  }

  public clearTokens() {
    this.accessToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (options.headers) {
      Object.assign(headers, options.headers);
    }
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }
    const fetchOptions: RequestInit = { ...options, headers, cache: 'no-store' };
    try {
      const response = await fetch(url, fetchOptions);
      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else if (response.ok) {
        // Handle non-JSON success responses (like HTML for reports)
        return { success: true, data: await response.text() as any };
      }

      if (!response.ok) {
        const isRefreshing = endpoint.includes("/auth/token/refresh/");
        if (response.status === 401 && this.accessToken && !isRefreshing) {
          const refreshed = await this.refreshToken();
          if (refreshed) {
            return this.request(endpoint, options);
          } else {
            this.clearTokens();
            return { success: false, message: "Your session has expired. Please login again." };
          }
        }
        return { success: false, message: data?.detail || data?.message || `HTTP Error: ${response.status}`, errors: data?.errors || {} };
      }
      return { success: true, data };
    } catch (error) {
      console.error("API request failed:", error);
      return { success: false, message: error instanceof Error ? error.message : "A network error occurred." };
    }
  }

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

  async login(username: string, password: string): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    type LoginResponse = { access: string; refresh: string; user: User };
    const response = await this.request<LoginResponse>("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    if (response.success && response.data) {
      const { access, refresh, user } = response.data;
      this.setTokens(access, refresh);
      return { success: true, data: { user, tokens: { access, refresh } } };
    }
    return response as unknown as ApiResponse<{ user: User; tokens: AuthTokens }>;
  }

  async logout(): Promise<ApiResponse> {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
        await this.request("/auth/logout/", {
            method: "POST",
            body: JSON.stringify({ refresh: refreshToken }),
        });
    }
    this.clearTokens();
    return { success: true, message: "Logged out successfully" };
  }

  async getCurrentUser(): Promise<ApiResponse<User>> { return this.request<User>("/auth/user/"); }
  async get<T>(endpoint: string): Promise<ApiResponse<T>> { return this.request<T>(endpoint); }
  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> { return this.request<T>(endpoint, { method: "POST", body: JSON.stringify(data) }); }
  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> { return this.request<T>(endpoint, { method: "PUT", body: JSON.stringify(data) }); }
  async patch<T>(endpoint: string, data: any): Promise<ApiResponse<T>> { return this.request<T>(endpoint, { method: "PATCH", body: JSON.stringify(data) }); }
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> { return this.request<T>(endpoint, { method: "DELETE" }); }
}

// --- Singleton Instance and Helper Object ---
export const apiClient = new ApiClient(API_BASE_URL);

export const api = {
  admin: {
    updateUser: (userId: number, data: { username?: string; password?: string }) =>
      apiClient.post("/admin/update-user/", {
        user_id: userId,
        username: data.username,
        password: data.password,
      }),
  },
  users: {
    list: () => apiClient.get("/users/"),
  },
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
    details: (id: number) => apiClient.get(`/student/${id}/details/`),
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
    details: (id: number) => apiClient.get(`/classes/${id}/details/`),
  },
  fees: {
    list: () => apiClient.get("/fees/"),
    createFee: (studentId: number, amount: number, dueDate: string) => 
      apiClient.post("/fees/actions/", { action: "create_fee", student_id: studentId, amount, due_date: dueDate }),
    createClassFee: (classId: number, amount: number, dueDate: string) =>
      apiClient.post("/fees/actions/", { action: "create_class_fee", class_id: classId, amount, due_date: dueDate }),
    sendReminders: () => 
      apiClient.post("/fees/actions/", { action: "send_reminders" }),
    delete: (id: number) => apiClient.delete(`/fees/${id}/`),
  },
  feeTypes: {
    list: () => apiClient.get("/fee-types/"),
    update: (id: number, data: { amount: number }) => apiClient.patch(`/fee-types/${id}/`, data),
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
    list: () => apiClient.get("/report-management/list_reports/"),
    generate: (data: { report_type: string; format: string }) =>
      apiClient.post("/report-management/generate/", data),
    files: (reportId: string) => apiClient.get(`/report-management/${reportId}/files/`),
    download: (reportId: string, params: { path: string }) =>
      apiClient.get(`/report-management/${reportId}/download/?path=${encodeURIComponent(params.path)}`),
    delete: (reportId: string) => apiClient.delete(`/report-management/${reportId}/delete/`),
  },
  health: {
    check: () => apiClient.get("/health/"),
  },
    periods: {
      list: () => apiClient.get("/periods/"),
      update: (id: number, data: { start_time: string, end_time: string }) =>
        apiClient.patch(`/periods/${id}/`, data),
    },
    tasks: {
      list: () => apiClient.get("/tasks/"),
      create: (data: any) => apiClient.post("/tasks/", data),
      update: (id: number, data: any) => apiClient.put(`/tasks/${id}/`, data),
      delete: (id: number) => apiClient.delete(`/tasks/${id}/`),
      markCompleted: (id: number) => apiClient.post(`/tasks/${id}/mark_completed/`, {}),
      markInProgress: (id: number) => apiClient.post(`/tasks/${id}/mark_in_progress/`, {}),
      todayTasks: () => apiClient.get("/tasks/today_tasks/"),
      upcomingTasks: () => apiClient.get("/tasks/upcoming_tasks/"),
    }
};