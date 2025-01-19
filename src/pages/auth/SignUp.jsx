import AccountForm from "../../containers/AccountForm";
import supabase from "../../utils/supabase";
import toast from "react-hot-toast";

const SignUp = () => {
  const signUp = async (email, password) => {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: import.meta.env.VITE_HOST,
      },
    });

    if (result.data.user?.identities?.length === 0) {
      toast.error("Account cannot be created. Please, try again later.");
    } else {
      toast.success(
        "Welcome and please check your inbox to confirm your account!"
      );
    }
  };

  return (
    <>
      <h1>Sign Up</h1>
      <AccountForm onSubmit={signUp} />
    </>
  );
};

export default SignUp;
