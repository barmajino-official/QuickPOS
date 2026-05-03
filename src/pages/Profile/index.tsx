import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export function Profile() {
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data?.session?.user) {
        console.error(error || "No active session user");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }
      setEmail(data.session.user.email || "");
      setCreatedAt(data.session.user.created_at || "");
      setLoading(false);
    };
    // if supabase auth error or undefined then logout and clear the sesstion tmm

    init();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-16">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-base-content">
          User Profile
        </h1>
        <p className="text-sm opacity-60">
          Manage your system credentials and preferences.
        </p>
      </div>

      <div className="bg-base-100 border border-base-300 shadow-sm rounded-md overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-base-300 pb-8 mb-8">
            <div className="w-24 h-24 rounded-md bg-blue-600 flex items-center justify-center text-4xl font-bold text-white shadow-sm">
              {email[0]?.toUpperCase()}
            </div>
            <div className="text-center sm:text-left pt-2">
              <h2 className="text-2xl font-bold text-base-content">
                {email.split("@")[0]}
              </h2>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mt-1">
                Authorized Staff
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-bold uppercase text-base-content/50 tracking-wider mb-1 block">
                Registered Email Address
              </label>
              <div className="font-medium text-base-content px-3 py-2 bg-base-200/50 rounded-sm border border-base-300">
                {email}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-base-content/50 tracking-wider mb-1 block">
                Account Creation Date
              </label>
              <div className="font-medium text-base-content px-3 py-2 bg-base-200/50 rounded-sm border border-base-300">
                {createdAt
                  ? new Date(createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
