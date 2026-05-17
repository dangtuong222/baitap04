import { createContext, useReducer, useState, useEffect } from 'react';

const initialAuthState = {
    isAuthenticated: false,
    user: {
        email: "",
        name: ""
    },
    token: null
};

const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN':
            return {
                isAuthenticated: true,
                user: action.payload.user,
                token: action.payload.token,
            };
        case 'LOGOUT':
            return initialAuthState;
        case 'RESTORE_AUTH':
            return {
                isAuthenticated: true,
                user: action.payload.user,
                token: action.payload.token,
            };
        default:
            return state;
    }
};

export const AuthContext = createContext({
    auth: initialAuthState,
    dispatch: () => {},
    appLoading: true,
    setAppLoading: () => {},
});

export const AuthWrapper = (props) => {
    const [auth, dispatch] = useReducer(authReducer, initialAuthState);
    const [appLoading, setAppLoading] = useState(true);

    useEffect(() => {
        // Check for stored token on app load
        const checkStoredToken = () => {
            const token = localStorage.getItem("access_token");
            const storedUser = localStorage.getItem("user_info");
            
            if (token && storedUser) {
                try {
                    const user = JSON.parse(storedUser);
                    dispatch({
                        type: 'RESTORE_AUTH',
                        payload: {
                            user,
                            token,
                        },
                    });
                } catch (error) {
                    console.error('Error restoring auth:', error);
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("user_info");
                }
            }
            setAppLoading(false);
        };

        checkStoredToken();
    }, []);

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