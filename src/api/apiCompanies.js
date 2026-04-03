import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fetch Companies
export async function getCompanies(token) {
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    },
  });

  const { data, error } = await supabase.from("companies").select("*");

  if (error) {
    console.error("Error fetching Companies:", error);
    throw error;
  }

  return data;
}

// Add Company
export async function addNewCompany(token, _, companyData) {
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    },
  });

  const random = Math.floor(Math.random() * 90000);
  const fileName = `logo-${random}-${companyData.name}-${Date.now()}`;

  const { error: storageError } = await supabase.storage
    .from("company-logo")
    .upload(fileName, companyData.logo);

  if (storageError) {
    console.error("Storage error:", storageError);
    throw new Error(storageError.message || "Error uploading Company Logo");
  }

  const { data: publicUrlData } = supabase.storage
    .from("company-logo")
    .getPublicUrl(fileName);

  const logo_url = publicUrlData.publicUrl;

  const { data, error } = await supabase
    .from("companies")
    .insert([
      {
        name: companyData.name,
        logo_url,
      },
    ])
    .select();

  if (error) {
    console.error("Insert error:", error);
    throw new Error(error.message || "Error submitting Company");
  }

  return data;
}
