import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
  console.log(`API Request: ${options.method || 'GET'} ${url}`);

  // Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);
    console.log(`API Response: ${response.status} ${url}`);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`API Error: ${url}`, error);
    throw error;
  }
}