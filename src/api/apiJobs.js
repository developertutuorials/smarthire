import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const getSupabase = (token) => {
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};

// Fetch Jobs
export async function getJobs(token, { location, company_id, searchQuery }) {
  const supabase = getSupabase(token);
  let query = supabase
    .from("jobs")
    .select("*, saved: saved_jobs(id), company: companies(name,logo_url)");

  if (location) query = query.eq("location", location);
  if (company_id) query = query.eq("company_id", company_id);
  if (searchQuery) query = query.ilike("title", `%${searchQuery}%`);

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching Jobs:", error);
    return null;
  }
  return data;
}

// Read Saved Jobs
export async function getSavedJobs(token) {
  const supabase = getSupabase(token);
  const { data, error } = await supabase
    .from("saved_jobs")
    .select("*, job: jobs(*, company: companies(name,logo_url))");

  if (error) {
    console.error("Error fetching Saved Jobs:", error);
    return null;
  }
  return data;
}

// Read single job
export async function getSingleJob(token, { job_id }) {
  const supabase = getSupabase(token);
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "*, company: companies(name,logo_url), applications: applications(*)",
    )
    .eq("id", job_id)
    .single();

  if (error) {
    console.error("Error fetching Job:", error);
    return null;
  }
  return data;
}

// Add / Remove Saved Job
export async function saveJob(token, { alreadySaved }, saveData) {
  const supabase = getSupabase(token);

  if (alreadySaved) {
    const { data, error } = await supabase
      .from("saved_jobs")
      .delete()
      .eq("job_id", saveData.job_id);

    if (error) {
      console.error("Error removing saved job:", error);
      return null;
    }
    return data;
  } else {
    const { data, error } = await supabase
      .from("saved_jobs")
      .insert([saveData])
      .select();

    if (error) {
      console.error("Error saving job:", error);
      return null;
    }
    return data;
  }
}

// Job isOpen toggle
// Job isopen toggle
export async function updateHiringStatus(token, { job_id }, isOpen) {
  const supabase = getSupabase(token);
  const { data, error } = await supabase
    .from("jobs")
    .update({ isopen: isOpen }) // isOpen → isopen
    .eq("id", job_id)
    .select();

  if (error) {
    console.error("Error Updating Hiring Status:", error);
    return null;
  }
  return data;
}

// Get my created jobs
export async function getMyJobs(token, { recruiter_id }) {
  const supabase = getSupabase(token);
  const { data, error } = await supabase
    .from("jobs")
    .select("*, company: companies(name,logo_url)")
    .eq("recruiter_id", recruiter_id);

  if (error) {
    console.error("Error fetching Jobs:", error);
    return null;
  }
  return data;
}

// Delete job
export async function deleteJob(token, { job_id }) {
  const supabase = getSupabase(token);
  const { data, error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", job_id)
    .select();

  if (error) {
    console.error("Error deleting job:", error);
    return null;
  }
  return data;
}

// Post job
// Post job
export async function addNewJob(token, _, jobData) {
  const supabase = getSupabase(token);

  const { data, error } = await supabase
    .from("jobs")
    .insert([
      {
        ...jobData,
        company_id: Number(jobData.company_id),
        isopen: true, // yeh add karo
      },
    ])
    .select();

  if (error) {
    console.error("Error creating job:", error);
    throw new Error("Error Creating Job");
  }
  return data;
}
