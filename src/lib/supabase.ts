import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://aqyzxirbiijkxngusjau.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjdjOGNkY2U2LTRmYmEtNGUxZS05OTU4LWIyZTVkMzFmZGU2MSJ9.eyJwcm9qZWN0SWQiOiJhcXl6eGlyYmlpamt4bmd1c2phdSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzkxMDM2NTMxLCJleHAiOjIxMDYzOTY1MzEsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.-2WXRMeyFg5n7d7amL8xDgREY4l4bYc8XU0y_oPhOqw';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };