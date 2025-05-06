import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

console.log("Supabase URL:", supabaseUrl);  // Esto debería imprimir la URL de Supabase
console.log("Supabase Key:", supabaseKey);  // Esto debería imprimir la clave de Supabase

export const supabase = createClient(supabaseUrl, supabaseKey);