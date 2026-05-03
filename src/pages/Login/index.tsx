// Login & Register — Logic
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router";
import LoginView from "./view";

interface Props {
  theme?: string;
  toggleTheme?: () => void;
}

export function Login({ theme = "light", toggleTheme = () => {} }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");

    if (isRegisterMode) {
      // Official GoTrue API Signup (100% safe, bypasses all manual SQL issues)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // If signup succeeds, we manually insert them into the staff table as an Admin
      if (data.user) {
        const { error: staffError } = await supabase.from("staff").insert({
          id: data.user.id,
          email: data.user.email,
          name: "System Administrator",
          role: "Admin",
          permissions: {
            pos: true,
            dashboard: true,
            products: true,
            categories: true,
            customers: true,
            staff: true,
            orders: true,
          },
        });

        if (staffError) {
          console.error("Staff Insert Error:", staffError);
          // Non-fatal, they are registered at least
        }
      }

      setLoading(false);
      navigate("/");
    } else {
      // Normal Login
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setLoading(false);

      if (authError) {
        if (authError.message.includes("schema")) {
          setError(
            "Database schema updating. Please wait 1 minute or run NOTIFY pgrst, 'reload schema'; in Supabase SQL editor.",
          );
        } else {
          setError(authError.message);
        }
      } else {
        navigate("/");
      }
    }
  };

  return (
    <LoginView
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      error={error}
      loading={loading}
      handleLogin={handleLogin}
      theme={theme}
      toggleTheme={toggleTheme}
      isRegisterMode={isRegisterMode}
      setIsRegisterMode={setIsRegisterMode}
    />
  );
}

export default Login;
