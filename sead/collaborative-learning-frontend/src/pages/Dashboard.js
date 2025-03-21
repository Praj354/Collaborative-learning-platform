import React, { useEffect, useState } from "react";

const Dashboard = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        // ✅ Fetch user details
        const token = localStorage.getItem("token");

        fetch("http://localhost:5000/api/auth/me", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    console.error("Error fetching user:", data.error);
                } else {
                    setUser(data);
                }
            })
            .catch((err) => console.error("Fetch error:", err));
    }, []);

    return (
        <div>
            <h1>Dashboard</h1>
            {user ? (
                <p>Welcome, {user.name}!</p>
            ) : (
                <p>Loading user details...</p>
            )}
        </div>
    );
};

export default Dashboard;
