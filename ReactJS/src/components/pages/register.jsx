import React, { useState } from 'react';
import RegisterStep1 from './register-step1';
import RegisterStep2 from './register-step2';

const RegisterPage = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');

    const handleStep1Next = (userEmail) => {
        setEmail(userEmail);
        setStep(2);
    };

    const handleStep2Back = () => {
        setStep(1);
    };

    return (
        <>
            {step === 1 ? (
                <RegisterStep1 onNext={handleStep1Next} email={email} />
            ) : (
                <RegisterStep2 email={email} onBack={handleStep2Back} />
            )}
        </>
    );
};

export default RegisterPage;
