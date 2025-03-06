-- Enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create a table for storing user PATs
CREATE TABLE IF NOT EXISTS public.user_pats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  pat TEXT NOT NULL,
  project_id TEXT,
  check_all_projects BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS policies for the user_pats table
ALTER TABLE public.user_pats ENABLE ROW LEVEL SECURITY;

-- Users can only see their own PATs
CREATE POLICY "Users can view their own PATs"
  ON public.user_pats
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own PATs
CREATE POLICY "Users can insert their own PATs"
  ON public.user_pats
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own PATs
CREATE POLICY "Users can update their own PATs"
  ON public.user_pats
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own PATs
CREATE POLICY "Users can delete their own PATs"
  ON public.user_pats
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create a table for compliance check logs
CREATE TABLE IF NOT EXISTS public.compliance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  project_id TEXT,
  project_name TEXT,
  check_type TEXT NOT NULL,
  status TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS policies for the compliance_logs table
ALTER TABLE public.compliance_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own logs
CREATE POLICY "Users can view their own logs"
  ON public.compliance_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own logs
CREATE POLICY "Users can insert their own logs"
  ON public.compliance_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users cannot update or delete logs to maintain audit trail 