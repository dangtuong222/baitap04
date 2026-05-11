import { createContext, useReducer, useState } from 'react';

const initialAuthState = {
    isAuthenticated: false,
    user: {
        email: "",
        name: ""
    }
};

const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN':
            return {
                isAuthenticated: true,
                user: action.payload.user,
            };
        case 'LOGOUT':
            return initialAuthState;
        default:
            return state;
    }
};

export const AuthContext = createContext({
    auth: initialAuthState,
    dispatch: () => {},
    appLoading: true,
});

export const AuthWrapper = (props) => {
    const [auth, dispatch] = useReducer(authReducer, initialAuthState);
    const [appLoading, setAppLoading] = useState(true);

    return (
        <AuthContext.Provider value={{
            auth,
            dispatch,
            appLoading,
            setAppLoading,
        }}>
            {props.children}
        </AuthContext.Provider>
    );
};