import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kksuijhmtmqchzcytitd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtrc3VpamhtdG1xY2h6Y3l0aXRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NzY1MzEsImV4cCI6MjA3ODE1MjUzMX0.MYkbz5HtOwB-kqlzm8VjC8mYK4r46_7GH113ayVeJDY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
