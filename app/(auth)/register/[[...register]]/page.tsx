import RegisterForm from "./components/register-form";

const RegisterPage = () => {
    return (
        <div className="flex items-center justify-center h-screen flex-col">
            <h1>Register</h1>
            <RegisterForm />
        </div>
    );
}

export default RegisterPage;