import { API_BASE_URL } from "../config";


function getCookie(name: string): string | undefined {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
}


export async function fetchWithAuth<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const tokenCookie = getCookie('token');
  const hasTokenCookie = tokenCookie !== undefined;
  console.log(`API Request: ${url}`, { 
    options, 
    hasTokenCookie,
    allCookies: document.cookie
  });
  
  try {
    const headers: HeadersInit = {
      ...defaultHeaders
    };
    

    if (hasTokenCookie) {
      headers['Authorization'] = `Bearer ${tokenCookie}`;
    }
    

    if (options.headers) {
      Object.assign(headers, options.headers);
    }
    
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers,
    });console.log(`API Response: ${response.status} ${response.statusText}`, { url });
    

    if (!response.ok) {
      if (response.status === 401) {
        console.warn('Authentication required - redirecting to login');
        

        if (!window.location.pathname.includes('/auth')) {

          sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
          console.log('Redirecting to auth page, saving return path:', window.location.pathname);
          window.location.href = '/auth';
        }
        
        throw new Error('Authentication required');
      }
      

      let errorData;
      try {
        errorData = await response.json();
        console.error('API Error Response:', errorData);
      } catch {
        errorData = { error: response.statusText };
        console.error('API Error (not JSON):', response.statusText);
      }
      
      const error = new Error(errorData.error || errorData.message || `Request failed with status: ${response.status}`);
      (error as any).status = response.status;
      (error as any).data = errorData;
      throw error;
    }


    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json() as T;
    }
    
    return await response.text() as unknown as T;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}
