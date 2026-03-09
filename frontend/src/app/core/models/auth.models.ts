// JWT payload decoded from the Kisan id_token
// See oauth-integration.md → Token Reference
export interface KisanTokenPayload {
  sub: string;   // authenticated user's unique ID
  exp: number;   // expiration time (UNIX timestamp, seconds)
  iat: number;   // issued-at time (UNIX timestamp, seconds)
}

export interface KisanTokens {
  access_token: string;
  id_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// See oauth-integration.md → Step 4: Fetch User Profile After Login
export interface KisanProfile {
  first_name: string;
  last_name: string;
  mobile: string;
  country: string;
  country_code: string;
  state: string;
  city: string;
  email: string;
  is_email_verified: boolean;
  user_id: number;
  image_url: string;
  category: string;
  whatsapp_opt_in_status: boolean;
}
