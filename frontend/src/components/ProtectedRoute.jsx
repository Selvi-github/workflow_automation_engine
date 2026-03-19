import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * A wrapper component that protects routes from unauthenticated access.
 * If the user is not logged in, it redirects to the login page.
 * If the user doesn't have the required role, it can also redirect or show an error.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('wf_token');
    const userJson = localStorage.getItem('wf_user');
    const location = useLocation();

    if (!token || !userJson) {
        // Redirect to login but save the current location they were trying to go to
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const user = JSON.parse(userJson);

    // If roles are specified, check if the user has one of them
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // If they don't have the role, redirect based on their actual role
        // or just to a safe default like /workflows
        return <Navigate to="/workflows" replace />;
    }

    return children;
};

export default ProtectedRoute;
