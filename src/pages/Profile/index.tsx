// Profile — Logic
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import ProfileView from "./view";

export function Profile() {
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email || "");
        setCreatedAt(user.created_at || "");
      }
      setLoading(false);
    });
  }, []);

  return <ProfileView email={email} createdAt={createdAt} loading={loading} />;
}

export default Profile;
